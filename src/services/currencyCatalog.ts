export const DAILY_FREE_YEOPJEON = 3;
export const MAX_REWARDED_ADS_PER_DAY = 5;
export const CURRENCY_WINDOW_MS = 24 * 60 * 60 * 1000;

export const YEOPJEON_STARTER_BUNDLE = {
  id: 'yeopjeon_3_bundle',
  coinAmount: 3,
  priceKrw: 500,
} as const;

export type CoinBundleId = typeof YEOPJEON_STARTER_BUNDLE.id;

export const COIN_BUNDLES = [YEOPJEON_STARTER_BUNDLE] as const;
