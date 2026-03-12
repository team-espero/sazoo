import { acquireAdvisoryLock, createPostgresDatabase, fromJson } from '../db/postgres.js';
import { getOwnerKeys, getPrimaryOwnerKey } from '../db/identity.js';

const DAILY_FREE_COINS = 3;
const MAX_ADS_PER_DAY = 5;
const WINDOW_MS = 24 * 60 * 60 * 1000;
const LEDGER_LIMIT = 300;

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

const createLedgerId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `ledger_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

const createLedgerEntry = ({ kind, amount, source, metadata, wallet }) => ({
  id: createLedgerId(),
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

const getRewardedAdClaimKey = (ownerKey, provider, rewardClaimId) => `${ownerKey}:${provider}:${rewardClaimId}`;
const getVerifiedPurchaseKey = (ownerKey, provider, externalPurchaseId) => `${ownerKey}:${provider}:${externalPurchaseId}`;

export function createWalletStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = (async () => {
    await db.query(`
      CREATE TABLE IF NOT EXISTS wallet_snapshots (
        owner_key TEXT PRIMARY KEY,
        installation_id TEXT,
        user_id TEXT,
        wallet_json JSONB NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS rewarded_ad_claims (
        claim_key TEXT PRIMARY KEY,
        owner_key TEXT NOT NULL,
        provider TEXT NOT NULL,
        placement_id TEXT NOT NULL,
        reward_claim_id TEXT NOT NULL,
        amount INTEGER NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS verified_purchase_claims (
        purchase_key TEXT PRIMARY KEY,
        owner_key TEXT NOT NULL,
        provider TEXT NOT NULL,
        external_purchase_id TEXT NOT NULL,
        bundle_id TEXT NOT NULL,
        product_id TEXT NOT NULL,
        order_id TEXT,
        purchase_token TEXT,
        metadata_json JSONB NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
  })();

  const loadWalletForOwner = async (executor, ownerKey) => {
    const { rows } = await executor.query(
      'SELECT wallet_json FROM wallet_snapshots WHERE owner_key = $1',
      [ownerKey],
    );
    return rows[0] ? fromJson(rows[0].wallet_json, null) : null;
  };

  const persistWalletForOwner = async (executor, ownerKey, identity, wallet) => {
    await executor.query(
      `
        INSERT INTO wallet_snapshots (owner_key, installation_id, user_id, wallet_json, updated_at)
        VALUES ($1, $2, $3, $4::jsonb, NOW())
        ON CONFLICT (owner_key) DO UPDATE SET
          installation_id = EXCLUDED.installation_id,
          user_id = EXCLUDED.user_id,
          wallet_json = EXCLUDED.wallet_json,
          updated_at = NOW()
      `,
      [
        ownerKey,
        identity.installationId || null,
        identity.userId || null,
        JSON.stringify(wallet),
      ],
    );
  };

  const rewardedAdClaimExists = async (executor, ownerKeys, provider, rewardClaimId) => {
    const claimKeys = ownerKeys.map((ownerKey) => getRewardedAdClaimKey(ownerKey, provider, rewardClaimId));
    const { rows } = await executor.query(
      'SELECT claim_key FROM rewarded_ad_claims WHERE claim_key = ANY($1::text[]) LIMIT 1',
      [claimKeys],
    );
    return rows.length > 0;
  };

  const persistRewardedAdClaims = async (executor, ownerKeys, provider, placementId, rewardClaimId, amount) => {
    for (const ownerKey of ownerKeys) {
      await executor.query(
        `
          INSERT INTO rewarded_ad_claims (
            claim_key, owner_key, provider, placement_id, reward_claim_id, amount, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, NOW())
          ON CONFLICT (claim_key) DO NOTHING
        `,
        [getRewardedAdClaimKey(ownerKey, provider, rewardClaimId), ownerKey, provider, placementId, rewardClaimId, amount],
      );
    }
  };

  const verifiedPurchaseExists = async (executor, ownerKeys, provider, externalPurchaseId) => {
    const purchaseKeys = ownerKeys.map((ownerKey) => getVerifiedPurchaseKey(ownerKey, provider, externalPurchaseId));
    const { rows } = await executor.query(
      'SELECT purchase_key FROM verified_purchase_claims WHERE purchase_key = ANY($1::text[]) LIMIT 1',
      [purchaseKeys],
    );
    return rows.length > 0;
  };

  const persistVerifiedPurchaseClaims = async (executor, ownerKeys, purchase) => {
    for (const ownerKey of ownerKeys) {
      await executor.query(
        `
          INSERT INTO verified_purchase_claims (
            purchase_key, owner_key, provider, external_purchase_id, bundle_id, product_id,
            order_id, purchase_token, metadata_json, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, NOW())
          ON CONFLICT (purchase_key) DO NOTHING
        `,
        [
          getVerifiedPurchaseKey(ownerKey, purchase.provider, purchase.externalPurchaseId),
          ownerKey,
          purchase.provider,
          purchase.externalPurchaseId,
          purchase.bundleId,
          purchase.productId,
          purchase.orderId || null,
          purchase.purchaseToken || null,
          JSON.stringify(purchase.metadata || {}),
        ],
      );
    }
  };

  const resolveWallet = async (identity, snapshot, executor) => {
    const now = Date.now();
    const ownerKeys = getOwnerKeys(identity);
    let mergedWallet = snapshot || null;

    for (const ownerKey of ownerKeys) {
      const current = await loadWalletForOwner(executor, ownerKey);
      if (current) {
        mergedWallet = mergeWallets(mergedWallet, current, now);
      }
    }

    const { wallet, lifecycleEntries } = normalizeWallet(mergedWallet, now);
    let nextWallet = wallet;
    for (const entry of lifecycleEntries) {
      nextWallet = appendLedger(nextWallet, entry);
    }

    for (const ownerKey of ownerKeys) {
      await persistWalletForOwner(executor, ownerKey, identity, nextWallet);
    }

    return nextWallet;
  };

  const mutateWallet = async (identity, handler) => {
    await ready;
    return db.withTransaction(async (client) => {
      await acquireAdvisoryLock(client, `wallet:${getPrimaryOwnerKey(identity)}`);
      return handler(client);
    });
  };

  return {
    starterBundle: STARTER_BUNDLE,
    async getWallet(identity, snapshot) {
      await ready;
      return db.withTransaction((client) => resolveWallet(identity, snapshot, client));
    },
    async getLedger(identity, limit = 50) {
      await ready;
      return db.withTransaction(async (client) => {
        const wallet = await resolveWallet(identity, null, client);
        return wallet.ledger.slice(0, limit);
      });
    },
    async spend(identity, context = 'generic') {
      return mutateWallet(identity, async (client) => {
        const currentWallet = await resolveWallet(identity, null, client);
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
          await persistWalletForOwner(client, ownerKey, identity, nextWallet);
        }

        return {
          wallet: nextWallet,
          source,
        };
      });
    },
    async refund(identity, source, reason = 'request_failed') {
      return mutateWallet(identity, async (client) => {
        const currentWallet = await resolveWallet(identity, null, client);
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
          await persistWalletForOwner(client, ownerKey, identity, nextWallet);
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

      return mutateWallet(identity, async (client) => {
        const currentWallet = await resolveWallet(identity, null, client);
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
          await persistWalletForOwner(client, ownerKey, identity, nextWallet);
        }

        return {
          status: 'purchased',
          bundle: STARTER_BUNDLE,
          wallet: nextWallet,
        };
      });
    },
    async credit(identity, amount, reason = 'manual_adjustment') {
      return mutateWallet(identity, async (client) => {
        const currentWallet = await resolveWallet(identity, null, client);
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
          await persistWalletForOwner(client, ownerKey, identity, nextWallet);
        }

        return {
          wallet: nextWallet,
          amount,
          reason,
        };
      });
    },
    async claimRewardedAd(identity, provider, placementId, rewardClaimId) {
      return mutateWallet(identity, async (client) => {
        const ownerKeys = getOwnerKeys(identity);
        const currentWallet = await resolveWallet(identity, null, client);

        if (await rewardedAdClaimExists(client, ownerKeys, provider, rewardClaimId)) {
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
          await persistWalletForOwner(client, ownerKey, identity, nextWallet);
        }
        await persistRewardedAdClaims(client, ownerKeys, provider, placementId, rewardClaimId, 1);

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
      return mutateWallet(identity, async (client) => {
        const ownerKeys = getOwnerKeys(identity);
        const currentWallet = await resolveWallet(identity, null, client);

        if (await verifiedPurchaseExists(client, ownerKeys, purchase.provider, purchase.externalPurchaseId)) {
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
          await persistWalletForOwner(client, ownerKey, identity, nextWallet);
        }
        await persistVerifiedPurchaseClaims(client, ownerKeys, purchase);

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
