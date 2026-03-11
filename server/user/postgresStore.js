import {
  createPostgresDatabase,
  ensureLaunchKvSchema,
  loadKvRecord,
  upsertKvRecord,
} from '../db/postgres.js';
import { getInstallationKey, getOwnerKeys, getUserKey } from '../db/identity.js';

const NAMESPACE = 'user_state';
const ENTITY_KEY = 'state';

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

export function createUserStateStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = ensureLaunchKvSchema(db);

  const resolveState = async (identity, snapshot, executor) => {
    const ownerKeys = getOwnerKeys(identity);
    let mergedExisting = createEmptyState();

    for (const ownerKey of ownerKeys.slice().reverse()) {
      const current = await loadKvRecord(executor, NAMESPACE, ownerKey, ENTITY_KEY);
      if (current) {
        mergedExisting = mergeStates(mergedExisting, current);
      }
    }

    const merged = mergeStates(mergedExisting, snapshot || {});
    for (const ownerKey of ownerKeys) {
      await upsertKvRecord(executor, NAMESPACE, ownerKey, ENTITY_KEY, identity, merged);
    }
    return merged;
  };

  return {
    async getState(identity, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveState(identity, snapshot || {}, client));
    },
    async saveState(identity, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveState(identity, snapshot || {}, client));
    },
    async promoteToUser(identity, snapshot) {
      await ready;
      if (!identity?.userId) {
        return db.withTransaction((client) => resolveState(identity, snapshot || {}, client));
      }

      return db.withTransaction(async (client) => {
        const installationState = await loadKvRecord(client, NAMESPACE, getInstallationKey(identity.installationId), ENTITY_KEY);
        const userState = await loadKvRecord(client, NAMESPACE, getUserKey(identity.userId), ENTITY_KEY);
        const merged = mergeStates(mergeStates(installationState || {}, userState || {}), snapshot || {});
        await upsertKvRecord(client, NAMESPACE, getUserKey(identity.userId), ENTITY_KEY, identity, merged);
        await upsertKvRecord(client, NAMESPACE, getInstallationKey(identity.installationId), ENTITY_KEY, identity, merged);
        return merged;
      });
    },
  };
}
