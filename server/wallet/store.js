import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

const DAILY_FREE_COINS = 3;
const MAX_ADS_PER_DAY = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const LEDGER_LIMIT = 300;
const REWARDED_AD_CLAIM_LIMIT = 1000;

const STARTER_BUNDLE = {
  id: 'yeopjeon_3_bundle',
  coinAmount: 3,
  priceKrw: 500,
};

const clampNonNegativeInt = (value, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
};

const safeTimestamp = (value, fallback) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const nowIso = () => new Date().toISOString();
const safeJsonParse = (value, fallback) => {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const createLedgerEntry = ({ kind, amount, source, metadata, wallet }) => ({
  id:
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
  kind,
  amount,
  source,
  metadata: metadata || {},
  balanceAfter: {
    freeCoins: wallet.freeCoins,
    paidCoins: wallet.paidCoins,
    totalCoinsUsed: wallet.totalCoinsUsed,
  },
  createdAt: nowIso(),
});

const dedupeLedger = (entries) => {
  const seen = new Set();
  return entries
    .filter((entry) => {
      if (!entry || typeof entry !== 'object') return false;
      if (!entry.id || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    })
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, LEDGER_LIMIT);
};

const createInitialWallet = (now) => ({
  freeCoins: DAILY_FREE_COINS,
  lastRefillTime: now,
  freeCoinsExpireAt: now + WINDOW_MS,
  paidCoins: 0,
  adsWatchedToday: 0,
  lastAdResetTime: now,
  totalCoinsUsed: 0,
  ledger: [],
});

const mergeWallets = (left, right, now) => {
  const safeLeft = left || createInitialWallet(now);
  const safeRight = right || createInitialWallet(now);

  return {
    freeCoins: Math.max(clampNonNegativeInt(safeLeft.freeCoins), clampNonNegativeInt(safeRight.freeCoins)),
    lastRefillTime: Math.max(safeTimestamp(safeLeft.lastRefillTime, now), safeTimestamp(safeRight.lastRefillTime, now)),
    freeCoinsExpireAt: Math.max(
      safeTimestamp(safeLeft.freeCoinsExpireAt, now + WINDOW_MS),
      safeTimestamp(safeRight.freeCoinsExpireAt, now + WINDOW_MS),
    ),
    paidCoins: Math.max(clampNonNegativeInt(safeLeft.paidCoins), clampNonNegativeInt(safeRight.paidCoins)),
    adsWatchedToday: Math.max(clampNonNegativeInt(safeLeft.adsWatchedToday), clampNonNegativeInt(safeRight.adsWatchedToday)),
    lastAdResetTime: Math.max(
      safeTimestamp(safeLeft.lastAdResetTime, now),
      safeTimestamp(safeRight.lastAdResetTime, now),
    ),
    totalCoinsUsed: Math.max(
      clampNonNegativeInt(safeLeft.totalCoinsUsed),
      clampNonNegativeInt(safeRight.totalCoinsUsed),
    ),
    ledger: dedupeLedger([...(safeLeft.ledger || []), ...(safeRight.ledger || [])]),
  };
};

const normalizeWallet = (value, now) => {
  const seed = createInitialWallet(now);
  const merged = {
    ...seed,
    ...(value || {}),
  };

  let freeCoins = Math.min(DAILY_FREE_COINS, clampNonNegativeInt(merged.freeCoins, seed.freeCoins));
  let lastRefillTime = safeTimestamp(merged.lastRefillTime, seed.lastRefillTime);
  let freeCoinsExpireAt = safeTimestamp(merged.freeCoinsExpireAt, lastRefillTime + WINDOW_MS);
  const paidCoins = clampNonNegativeInt(merged.paidCoins);
  let adsWatchedToday = Math.min(MAX_ADS_PER_DAY, clampNonNegativeInt(merged.adsWatchedToday));
  let lastAdResetTime = safeTimestamp(merged.lastAdResetTime, seed.lastAdResetTime);
  const totalCoinsUsed = clampNonNegativeInt(merged.totalCoinsUsed);
  const ledger = dedupeLedger(Array.isArray(merged.ledger) ? merged.ledger : []);
  const lifecycleEntries = [];

  if (now >= freeCoinsExpireAt) {
    if (freeCoins > 0) {
      lifecycleEntries.push({
        kind: 'expired',
        amount: freeCoins,
        source: 'free',
        metadata: { reason: 'free_pool_window_elapsed' },
      });
    }

    freeCoins = DAILY_FREE_COINS;
    lastRefillTime = now;
    freeCoinsExpireAt = now + WINDOW_MS;
    lifecycleEntries.push({
      kind: 'earned_from_daily',
      amount: DAILY_FREE_COINS,
      source: 'free',
      metadata: { reason: 'free_pool_refill' },
    });
  }

  if (now - lastAdResetTime >= WINDOW_MS) {
    adsWatchedToday = 0;
    lastAdResetTime = now;
  }

  return {
    wallet: {
      freeCoins,
      lastRefillTime,
      freeCoinsExpireAt,
      paidCoins,
      adsWatchedToday,
      lastAdResetTime,
      totalCoinsUsed,
      ledger,
    },
    lifecycleEntries,
  };
};

const appendLedger = (wallet, entry) => ({
  ...wallet,
  ledger: dedupeLedger([createLedgerEntry({ ...entry, wallet }), ...(wallet.ledger || [])]),
});

const getInstallationKey = (installationId) => `installation:${installationId}`;
const getUserKey = (userId) => (userId ? `user:${userId}` : null);
const getOwnerKeys = ({ installationId, userId }) => {
  const keys = [getInstallationKey(installationId)];
  const userKey = getUserKey(userId);
  if (userKey) {
    keys.unshift(userKey);
  }
  return keys;
};
const getRewardedAdClaimKey = (ownerKey, provider, rewardClaimId) => `${ownerKey}:${provider}:${rewardClaimId}`;
const getVerifiedPurchaseKey = (ownerKey, provider, externalPurchaseId) => `${ownerKey}:${provider}:${externalPurchaseId}`;

const parseOwnerKey = (ownerKey) => {
  if (ownerKey.startsWith('installation:')) {
    return { installationId: ownerKey.replace('installation:', ''), userId: null };
  }
  if (ownerKey.startsWith('user:')) {
    return { installationId: null, userId: ownerKey.replace('user:', '') };
  }
  return { installationId: null, userId: null };
};

const ensureSchema = (db) => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS wallet_snapshots (
      owner_key TEXT PRIMARY KEY,
      installation_id TEXT,
      user_id TEXT,
      free_coins INTEGER NOT NULL,
      last_refill_time INTEGER NOT NULL,
      free_coins_expire_at INTEGER NOT NULL,
      paid_coins INTEGER NOT NULL,
      ads_watched_today INTEGER NOT NULL,
      last_ad_reset_time INTEGER NOT NULL,
      total_coins_used INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS wallet_ledger (
      owner_key TEXT NOT NULL,
      entry_id TEXT NOT NULL,
      kind TEXT NOT NULL,
      amount INTEGER NOT NULL,
      source TEXT NOT NULL,
      metadata_json TEXT NOT NULL,
      balance_after_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (owner_key, entry_id)
    );

    CREATE INDEX IF NOT EXISTS idx_wallet_ledger_owner_created
      ON wallet_ledger(owner_key, created_at DESC);

    CREATE TABLE IF NOT EXISTS rewarded_ad_claims (
      claim_key TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      provider TEXT NOT NULL,
      placement_id TEXT NOT NULL,
      reward_claim_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_rewarded_ad_claims_owner_created
      ON rewarded_ad_claims(owner_key, created_at DESC);

    CREATE TABLE IF NOT EXISTS verified_purchase_claims (
      purchase_key TEXT PRIMARY KEY,
      owner_key TEXT NOT NULL,
      provider TEXT NOT NULL,
      external_purchase_id TEXT NOT NULL,
      bundle_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      order_id TEXT,
      purchase_token TEXT,
      metadata_json TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_verified_purchase_claims_owner_created
      ON verified_purchase_claims(owner_key, created_at DESC);
  `);
};

const loadWalletForOwner = (db, ownerKey) => {
  const snapshot = db.prepare(`
    SELECT owner_key, installation_id, user_id, free_coins, last_refill_time, free_coins_expire_at,
           paid_coins, ads_watched_today, last_ad_reset_time, total_coins_used
    FROM wallet_snapshots
    WHERE owner_key = ?
  `).get(ownerKey);

  if (!snapshot) {
    return null;
  }

  const ledgerRows = db.prepare(`
    SELECT entry_id, kind, amount, source, metadata_json, balance_after_json, created_at
    FROM wallet_ledger
    WHERE owner_key = ?
    ORDER BY datetime(created_at) DESC
    LIMIT ?
  `).all(ownerKey, LEDGER_LIMIT);

  return {
    freeCoins: snapshot.free_coins,
    lastRefillTime: snapshot.last_refill_time,
    freeCoinsExpireAt: snapshot.free_coins_expire_at,
    paidCoins: snapshot.paid_coins,
    adsWatchedToday: snapshot.ads_watched_today,
    lastAdResetTime: snapshot.last_ad_reset_time,
    totalCoinsUsed: snapshot.total_coins_used,
    ledger: ledgerRows.map((entry) => ({
      id: entry.entry_id,
      kind: entry.kind,
      amount: entry.amount,
      source: entry.source,
      metadata: safeJsonParse(entry.metadata_json, {}),
      balanceAfter: safeJsonParse(entry.balance_after_json, {}),
      createdAt: entry.created_at,
    })),
  };
};

const persistWalletForOwner = (db, ownerKey, identity, wallet) => {
  const parsedOwner = parseOwnerKey(ownerKey);
  const installationId = parsedOwner.installationId || identity.installationId || null;
  const userId = parsedOwner.userId || identity.userId || null;

  db.prepare(`
    INSERT INTO wallet_snapshots (
      owner_key, installation_id, user_id, free_coins, last_refill_time, free_coins_expire_at,
      paid_coins, ads_watched_today, last_ad_reset_time, total_coins_used, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(owner_key) DO UPDATE SET
      installation_id = excluded.installation_id,
      user_id = excluded.user_id,
      free_coins = excluded.free_coins,
      last_refill_time = excluded.last_refill_time,
      free_coins_expire_at = excluded.free_coins_expire_at,
      paid_coins = excluded.paid_coins,
      ads_watched_today = excluded.ads_watched_today,
      last_ad_reset_time = excluded.last_ad_reset_time,
      total_coins_used = excluded.total_coins_used,
      updated_at = excluded.updated_at
  `).run(
    ownerKey,
    installationId,
    userId,
    wallet.freeCoins,
    wallet.lastRefillTime,
    wallet.freeCoinsExpireAt,
    wallet.paidCoins,
    wallet.adsWatchedToday,
    wallet.lastAdResetTime,
    wallet.totalCoinsUsed,
    nowIso(),
  );

  db.prepare('DELETE FROM wallet_ledger WHERE owner_key = ?').run(ownerKey);
  const insertLedger = db.prepare(`
    INSERT INTO wallet_ledger (
      owner_key, entry_id, kind, amount, source, metadata_json, balance_after_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const entry of wallet.ledger || []) {
    insertLedger.run(
      ownerKey,
      entry.id,
      entry.kind,
      entry.amount,
      entry.source,
      JSON.stringify(entry.metadata || {}),
      JSON.stringify(entry.balanceAfter || {}),
      entry.createdAt,
    );
  }
};

const rewardedAdClaimExists = (db, ownerKeys, provider, rewardClaimId) => {
  const statement = db.prepare(`
    SELECT claim_key
    FROM rewarded_ad_claims
    WHERE claim_key = ?
    LIMIT 1
  `);

  return ownerKeys.some((ownerKey) => statement.get(getRewardedAdClaimKey(ownerKey, provider, rewardClaimId)));
};

const persistRewardedAdClaims = (db, ownerKeys, provider, placementId, rewardClaimId, amount) => {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO rewarded_ad_claims (
      claim_key, owner_key, provider, placement_id, reward_claim_id, amount, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const createdAt = nowIso();

  for (const ownerKey of ownerKeys) {
    insert.run(
      getRewardedAdClaimKey(ownerKey, provider, rewardClaimId),
      ownerKey,
      provider,
      placementId,
      rewardClaimId,
      amount,
      createdAt,
    );
  }

  const allClaims = db.prepare(`
    SELECT claim_key
    FROM rewarded_ad_claims
    ORDER BY datetime(created_at) DESC
  `).all();
  if (allClaims.length > REWARDED_AD_CLAIM_LIMIT) {
    const deleteStatement = db.prepare('DELETE FROM rewarded_ad_claims WHERE claim_key = ?');
    for (const row of allClaims.slice(REWARDED_AD_CLAIM_LIMIT)) {
      deleteStatement.run(row.claim_key);
    }
  }
};

const verifiedPurchaseExists = (db, ownerKeys, provider, externalPurchaseId) => {
  const statement = db.prepare(`
    SELECT purchase_key
    FROM verified_purchase_claims
    WHERE purchase_key = ?
    LIMIT 1
  `);

  return ownerKeys.some((ownerKey) => statement.get(getVerifiedPurchaseKey(ownerKey, provider, externalPurchaseId)));
};

const persistVerifiedPurchaseClaims = (db, ownerKeys, purchase) => {
  const insert = db.prepare(`
    INSERT OR REPLACE INTO verified_purchase_claims (
      purchase_key, owner_key, provider, external_purchase_id, bundle_id, product_id,
      order_id, purchase_token, metadata_json, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const createdAt = nowIso();

  for (const ownerKey of ownerKeys) {
    insert.run(
      getVerifiedPurchaseKey(ownerKey, purchase.provider, purchase.externalPurchaseId),
      ownerKey,
      purchase.provider,
      purchase.externalPurchaseId,
      purchase.bundleId,
      purchase.productId,
      purchase.orderId || null,
      purchase.purchaseToken || null,
      JSON.stringify(purchase.metadata || {}),
      createdAt,
    );
  }
};

const readLegacyJsonStore = (filePath) => {
  if (!filePath || !existsSync(filePath)) {
    return null;
  }

  try {
    const raw = readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.wallets !== 'object') {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const migrateLegacyJsonStore = (db, migrationSourcePath) => {
  const snapshotCount = db.prepare('SELECT COUNT(*) AS count FROM wallet_snapshots').get().count;
  if (snapshotCount > 0) {
    return;
  }

  const legacy = readLegacyJsonStore(migrationSourcePath);
  if (!legacy) {
    return;
  }

  for (const [ownerKey, wallet] of Object.entries(legacy.wallets || {})) {
    const identity = parseOwnerKey(ownerKey);
    const normalizedWallet = normalizeWallet(wallet, Date.now()).wallet;
    persistWalletForOwner(db, ownerKey, identity, normalizedWallet);
  }

  for (const claim of Object.values(legacy.rewardedAdClaims || {})) {
    if (!claim || typeof claim !== 'object') continue;
    db.prepare(`
      INSERT OR REPLACE INTO rewarded_ad_claims (
        claim_key, owner_key, provider, placement_id, reward_claim_id, amount, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      claim.ownerKey ? getRewardedAdClaimKey(claim.ownerKey, claim.provider, claim.rewardClaimId) : claim.claimKey,
      claim.ownerKey,
      claim.provider,
      claim.placementId,
      claim.rewardClaimId,
      claim.amount || 1,
      claim.createdAt || nowIso(),
    );
  }
};

export function createWalletStore(dbPath, options = {}) {
  const resolvedPath = path.resolve(dbPath);
  mkdirSync(path.dirname(resolvedPath), { recursive: true });

  const db = new DatabaseSync(resolvedPath);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');
  ensureSchema(db);
  migrateLegacyJsonStore(db, options.migrationSourcePath);

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
    if (caughtError) {
      throw caughtError;
    }
    return result;
  };

  const resolveWallet = (identity, snapshot) => {
    const now = Date.now();
    const ownerKeys = getOwnerKeys(identity);
    const mergedWallet = ownerKeys
      .map((ownerKey) => loadWalletForOwner(db, ownerKey))
      .filter(Boolean)
      .reduce((accumulator, wallet) => mergeWallets(accumulator, wallet, now), snapshot || null);

    const { wallet, lifecycleEntries } = normalizeWallet(mergedWallet, now);
    let nextWallet = wallet;
    for (const entry of lifecycleEntries) {
      nextWallet = appendLedger(nextWallet, entry);
    }

    for (const ownerKey of ownerKeys) {
      persistWalletForOwner(db, ownerKey, identity, nextWallet);
    }

    return nextWallet;
  };

  return {
    starterBundle: STARTER_BUNDLE,
    async getWallet(identity, snapshot) {
      return withMutation(() => resolveWallet(identity, snapshot));
    },
    async getLedger(identity, limit = 50) {
      return withMutation(() => resolveWallet(identity, null).ledger.slice(0, limit));
    },
    async spend(identity, context = 'generic') {
      return withMutation(() => {
        const currentWallet = resolveWallet(identity, null);
        if (currentWallet.freeCoins <= 0 && currentWallet.paidCoins <= 0) {
          const error = new Error('INSUFFICIENT_COINS');
          error.code = 'INSUFFICIENT_COINS';
          throw error;
        }

        const source = currentWallet.freeCoins > 0 ? 'free' : 'paid';
        let nextWallet = {
          ...currentWallet,
          freeCoins: source === 'free' ? currentWallet.freeCoins - 1 : currentWallet.freeCoins,
          paidCoins: source === 'paid' ? currentWallet.paidCoins - 1 : currentWallet.paidCoins,
          totalCoinsUsed: currentWallet.totalCoinsUsed + 1,
        };
        nextWallet = appendLedger(nextWallet, {
          kind: 'spent',
          amount: 1,
          source,
          metadata: { context },
        });

        for (const ownerKey of getOwnerKeys(identity)) {
          persistWalletForOwner(db, ownerKey, identity, nextWallet);
        }

        return {
          wallet: nextWallet,
          source,
        };
      });
    },
    async refund(identity, source, reason = 'request_failed') {
      return withMutation(() => {
        const currentWallet = resolveWallet(identity, null);
        let nextWallet = {
          ...currentWallet,
          freeCoins:
            source === 'free'
              ? Math.min(DAILY_FREE_COINS, currentWallet.freeCoins + 1)
              : currentWallet.freeCoins,
          paidCoins: source === 'paid' ? currentWallet.paidCoins + 1 : currentWallet.paidCoins,
          totalCoinsUsed: Math.max(0, currentWallet.totalCoinsUsed - 1),
        };
        nextWallet = appendLedger(nextWallet, {
          kind: 'refund',
          amount: 1,
          source,
          metadata: { reason },
        });

        for (const ownerKey of getOwnerKeys(identity)) {
          persistWalletForOwner(db, ownerKey, identity, nextWallet);
        }

        return {
          wallet: nextWallet,
          refundedSource: source,
        };
      });
    },
    async purchaseBundle(identity, bundleId) {
      if (bundleId !== STARTER_BUNDLE.id) {
        const error = new Error('INVALID_BUNDLE');
        error.code = 'INVALID_BUNDLE';
        throw error;
      }

      return withMutation(() => {
        const currentWallet = resolveWallet(identity, null);
        let nextWallet = {
          ...currentWallet,
          paidCoins: currentWallet.paidCoins + STARTER_BUNDLE.coinAmount,
        };
        nextWallet = appendLedger(nextWallet, {
          kind: 'purchased',
          amount: STARTER_BUNDLE.coinAmount,
          source: 'bundle',
          metadata: {
            bundleId: STARTER_BUNDLE.id,
            priceKrw: STARTER_BUNDLE.priceKrw,
          },
        });

        for (const ownerKey of getOwnerKeys(identity)) {
          persistWalletForOwner(db, ownerKey, identity, nextWallet);
        }

        return {
          status: 'purchased',
          bundle: STARTER_BUNDLE,
          wallet: nextWallet,
        };
      });
    },
    async credit(identity, amount, reason = 'manual_adjustment') {
      return withMutation(() => {
        const currentWallet = resolveWallet(identity, null);
        let nextWallet = {
          ...currentWallet,
          paidCoins: currentWallet.paidCoins + amount,
        };
        nextWallet = appendLedger(nextWallet, {
          kind: reason,
          amount,
          source: reason,
          metadata: {},
        });

        for (const ownerKey of getOwnerKeys(identity)) {
          persistWalletForOwner(db, ownerKey, identity, nextWallet);
        }

        return {
          wallet: nextWallet,
          amount,
          reason,
        };
      });
    },
    async claimRewardedAd(identity, provider, placementId, rewardClaimId) {
      return withMutation(() => {
        const ownerKeys = getOwnerKeys(identity);
        const currentWallet = resolveWallet(identity, null);

        if (rewardedAdClaimExists(db, ownerKeys, provider, rewardClaimId)) {
          return {
            status: 'duplicate',
            provider,
            rewardAmount: 0,
            rewardClaimId,
            remainingAdsToday: Math.max(0, MAX_ADS_PER_DAY - currentWallet.adsWatchedToday),
            wallet: currentWallet,
          };
        }

        if (currentWallet.adsWatchedToday >= MAX_ADS_PER_DAY) {
          return {
            status: 'limit_reached',
            provider,
            rewardAmount: 0,
            rewardClaimId,
            remainingAdsToday: 0,
            wallet: currentWallet,
          };
        }

        let nextWallet = {
          ...currentWallet,
          paidCoins: currentWallet.paidCoins + 1,
          adsWatchedToday: currentWallet.adsWatchedToday + 1,
        };
        nextWallet = appendLedger(nextWallet, {
          kind: 'earned_from_ads',
          amount: 1,
          source: provider,
          metadata: { placementId, rewardClaimId },
        });

        for (const ownerKey of ownerKeys) {
          persistWalletForOwner(db, ownerKey, identity, nextWallet);
        }
        persistRewardedAdClaims(db, ownerKeys, provider, placementId, rewardClaimId, 1);

        return {
          status: 'claimed',
          provider,
          rewardAmount: 1,
          rewardClaimId,
          remainingAdsToday: Math.max(0, MAX_ADS_PER_DAY - nextWallet.adsWatchedToday),
          wallet: nextWallet,
        };
      });
    },
    async claimVerifiedPurchase(identity, purchase) {
      return withMutation(() => {
        const ownerKeys = getOwnerKeys(identity);
        const currentWallet = resolveWallet(identity, null);

        if (verifiedPurchaseExists(db, ownerKeys, purchase.provider, purchase.externalPurchaseId)) {
          return {
            status: 'duplicate',
            creditedCoins: 0,
            wallet: currentWallet,
            bundleId: purchase.bundleId,
            productId: purchase.productId,
            externalPurchaseId: purchase.externalPurchaseId,
          };
        }

        let nextWallet = {
          ...currentWallet,
          paidCoins: currentWallet.paidCoins + purchase.coinAmount,
        };
        nextWallet = appendLedger(nextWallet, {
          kind: 'purchased_verified',
          amount: purchase.coinAmount,
          source: purchase.provider,
          metadata: {
            bundleId: purchase.bundleId,
            productId: purchase.productId,
            externalPurchaseId: purchase.externalPurchaseId,
            orderId: purchase.orderId || null,
            purchaseToken: purchase.purchaseToken || null,
            verification: purchase.metadata || {},
          },
        });

        for (const ownerKey of ownerKeys) {
          persistWalletForOwner(db, ownerKey, identity, nextWallet);
        }
        persistVerifiedPurchaseClaims(db, ownerKeys, purchase);

        return {
          status: 'verified',
          creditedCoins: purchase.coinAmount,
          wallet: nextWallet,
          bundleId: purchase.bundleId,
          productId: purchase.productId,
          externalPurchaseId: purchase.externalPurchaseId,
        };
      });
    },
  };
}
