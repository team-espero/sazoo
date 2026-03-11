import { openLaunchDatabase } from '../db/launchDb.js';

const nowIso = () => new Date().toISOString();

const getInstallationKey = (installationId) => `installation:${installationId}`;
const getUserKey = (userId) => (userId ? `user:${userId}` : null);
const getOwnerKeys = ({ installationId, userId }) => {
  const keys = [getInstallationKey(installationId)];
  const userKey = getUserKey(userId);
  if (userKey) keys.unshift(userKey);
  return keys;
};

const parseOwnerKey = (ownerKey) => {
  if (ownerKey.startsWith('installation:')) {
    return { installationId: ownerKey.replace('installation:', ''), userId: null };
  }
  if (ownerKey.startsWith('user:')) {
    return { installationId: null, userId: ownerKey.replace('user:', '') };
  }
  return { installationId: null, userId: null };
};

const TIER_RANK = {
  FREE: 0,
  BASIC: 1,
  PREMIUM: 2,
};

const createEmptyState = () => ({
  profiles: [],
  activeProfileId: 'me',
  userTier: 'FREE',
  onboardingComplete: false,
});

const normalizeProfiles = (profiles) => {
  const byId = new Map();
  for (const profile of Array.isArray(profiles) ? profiles : []) {
    if (!profile || typeof profile !== 'object' || !profile.id) continue;
    byId.set(profile.id, {
      ...profile,
      knowledgeLevel: profile.knowledgeLevel || 'newbie',
      memo: profile.memo || '',
    });
  }
  return [...byId.values()];
};

const normalizeState = (value) => {
  const base = createEmptyState();
  const profiles = normalizeProfiles(value?.profiles || base.profiles);
  const activeProfileId = String(value?.activeProfileId || profiles[0]?.id || base.activeProfileId);
  const tier = value?.userTier && TIER_RANK[value.userTier] !== undefined ? value.userTier : base.userTier;
  return {
    profiles,
    activeProfileId,
    userTier: tier,
    onboardingComplete: Boolean(value?.onboardingComplete),
  };
};

const mergeProfiles = (leftProfiles, rightProfiles) => {
  const merged = new Map();
  for (const profile of normalizeProfiles(leftProfiles)) {
    merged.set(profile.id, profile);
  }
  for (const profile of normalizeProfiles(rightProfiles)) {
    merged.set(profile.id, {
      ...(merged.get(profile.id) || {}),
      ...profile,
    });
  }
  return [...merged.values()];
};

const mergeStates = (left, right) => {
  const safeLeft = normalizeState(left || {});
  const safeRight = normalizeState(right || {});
  const profiles = mergeProfiles(safeLeft.profiles, safeRight.profiles);
  const rightActiveExists = profiles.some((profile) => profile.id === safeRight.activeProfileId);
  const leftActiveExists = profiles.some((profile) => profile.id === safeLeft.activeProfileId);

  return {
    profiles,
    activeProfileId: rightActiveExists
      ? safeRight.activeProfileId
      : leftActiveExists
        ? safeLeft.activeProfileId
        : profiles[0]?.id || 'me',
    userTier: TIER_RANK[safeRight.userTier] >= TIER_RANK[safeLeft.userTier]
      ? safeRight.userTier
      : safeLeft.userTier,
    onboardingComplete: safeLeft.onboardingComplete || safeRight.onboardingComplete,
  };
};

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_state_records (
      owner_key TEXT PRIMARY KEY,
      installation_id TEXT,
      user_id TEXT,
      profiles_json TEXT NOT NULL,
      active_profile_id TEXT NOT NULL,
      user_tier TEXT NOT NULL,
      onboarding_complete INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_user_state_records_user_id
      ON user_state_records(user_id, updated_at DESC);
  `);
};

const loadState = (db, ownerKey) => {
  const row = db.prepare(`
    SELECT profiles_json, active_profile_id, user_tier, onboarding_complete
    FROM user_state_records
    WHERE owner_key = ?
  `).get(ownerKey);

  if (!row) return null;

  return normalizeState({
    profiles: JSON.parse(row.profiles_json || '[]'),
    activeProfileId: row.active_profile_id,
    userTier: row.user_tier,
    onboardingComplete: Boolean(row.onboarding_complete),
  });
};

const persistState = (db, ownerKey, identity, state) => {
  const normalized = normalizeState(state);
  const parsedOwner = parseOwnerKey(ownerKey);
  const installationId = parsedOwner.installationId || identity.installationId || null;
  const userId = parsedOwner.userId || identity.userId || null;

  db.prepare(`
    INSERT INTO user_state_records (
      owner_key, installation_id, user_id, profiles_json, active_profile_id, user_tier, onboarding_complete, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_key) DO UPDATE SET
      installation_id = excluded.installation_id,
      user_id = excluded.user_id,
      profiles_json = excluded.profiles_json,
      active_profile_id = excluded.active_profile_id,
      user_tier = excluded.user_tier,
      onboarding_complete = excluded.onboarding_complete,
      updated_at = excluded.updated_at
  `).run(
    ownerKey,
    installationId,
    userId,
    JSON.stringify(normalized.profiles),
    normalized.activeProfileId,
    normalized.userTier,
    normalized.onboardingComplete ? 1 : 0,
    nowIso(),
  );

  return normalized;
};

export function createUserStateStore(dbPath) {
  const { db } = openLaunchDatabase(dbPath);
  ensureSchema(db);

  let writeQueue = Promise.resolve();
  const withMutation = async (handler) => {
    let result;
    let caughtError;
    const run = async () => {
      try {
        result = handler();
        return result;
      } catch (error) {
        caughtError = error;
        return undefined;
      }
    };

    writeQueue = writeQueue.then(run, run);
    await writeQueue;
    if (caughtError) throw caughtError;
    return result;
  };

  const resolveState = (identity, snapshot) => {
    const ownerKeys = getOwnerKeys(identity);
    const mergedExisting = ownerKeys
      .slice()
      .reverse()
      .map((ownerKey) => loadState(db, ownerKey))
      .filter(Boolean)
      .reduce((accumulator, item) => mergeStates(accumulator, item), createEmptyState());
    const merged = mergeStates(mergedExisting, snapshot || {});
    for (const ownerKey of ownerKeys) {
      persistState(db, ownerKey, identity, merged);
    }
    return merged;
  };

  return {
    async getState(identity, snapshot) {
      return withMutation(() => resolveState(identity, snapshot || {}));
    },
    async saveState(identity, snapshot) {
      return withMutation(() => resolveState(identity, snapshot || {}));
    },
    async promoteToUser(identity, snapshot) {
      if (!identity?.userId) {
        return withMutation(() => resolveState(identity, snapshot || {}));
      }
      return withMutation(() => {
        const installationState = loadState(db, getInstallationKey(identity.installationId));
        const userState = loadState(db, getUserKey(identity.userId));
        const merged = mergeStates(mergeStates(installationState || {}, userState || {}), snapshot || {});
        persistState(db, getUserKey(identity.userId), identity, merged);
        persistState(db, getInstallationKey(identity.installationId), identity, merged);
        return merged;
      });
    },
  };
}
