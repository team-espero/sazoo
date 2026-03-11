import { clientEnv } from '../config/env';
import { auth } from '../config/firebase';
import { COIN_BUNDLES, CURRENCY_WINDOW_MS, DAILY_FREE_YEOPJEON, MAX_REWARDED_ADS_PER_DAY, YEOPJEON_STARTER_BUNDLE, type CoinBundleId } from './currencyCatalog';
import type { InvitePayload } from './invite';
import { getOrCreateInstallationId } from './inviteRewards';
import { storage, KEYS } from './storage';
import type { InviteRewardServerResult, SpecialReportUnlock } from './inviteRewards';

export interface UserProfile {
  id: string;
  name: string;
  gender: 'male' | 'female' | null;
  knowledgeLevel?: 'newbie' | 'intermediate' | 'expert';
  birthDate: {
    year: number;
    month: number;
    day: number;
    hour: number;
    minute: number;
    ampm: 'AM' | 'PM';
  };
  calendarType: string;
  isTimeUnknown: boolean;
  relation: 'me' | 'family' | 'friend' | 'lover' | 'colleague';
  memo: string;
  avatarId?: number;
}

export type AppLanguage = 'en' | 'ko' | 'ja';

export interface DailyInsightItem {
  emoji: string;
  name: string;
  type: string;
}

export interface DailyInsights {
  luckyItems: DailyInsightItem[];
  sajuTip: string;
  elementTip: string;
  energyTip: string;
  cycleTip: string;
}

export interface ChatRequest {
  installationId?: string;
  userId?: string;
  message: string;
  language: AppLanguage;
  profile?: UserProfile;
  saju?: unknown;
  isInitialAnalysis?: boolean;
  promptMode?: 'chat' | 'miniapp_couple' | 'miniapp_dream';
  miniAppContext?: Record<string, unknown>;
  memoryProfile?: {
    version: string;
    knowledgeLevel: 'newbie' | 'intermediate' | 'expert';
    preferredTone: 'mysterious_intimate';
    primaryConcerns: string[];
    recurringTopics: string[];
    relationshipContext?: {
      relation: string;
      focus?: string;
    } | null;
    recentSummary?: string;
    conversationDigest?: string;
    openLoops?: string[];
    lastAssistantGuidance?: string;
    lastUserQuestions?: string[];
  } | null;
  recentMessages?: Array<{
    role: 'user' | 'assistant';
    text: string;
  }>;
}

export interface ChatResponse {
  reply: string;
}

export interface DailyInsightsRequest {
  language: AppLanguage;
  date?: string;
  profile?: UserProfile;
  saju?: unknown;
}

export interface InviteClaimRequest {
  installationId: string;
  userId?: string;
  language: AppLanguage;
  invite: InvitePayload;
}

export interface WalletBalance {
  freeCoins: number;
  lastRefillTime: number;
  freeCoinsExpireAt: number;
  paidCoins: number;
  adsWatchedToday: number;
  lastAdResetTime: number;
  totalCoinsUsed: number;
}

export interface WalletIdentity {
  installationId: string;
  userId?: string;
}

export interface WalletCoinBundle {
  id: CoinBundleId;
  coinAmount: number;
  priceKrw: number;
}

export interface WalletSpendResponse {
  wallet: WalletBalance;
  source: 'free' | 'paid';
}

export interface WalletRefundResponse {
  wallet: WalletBalance;
  refundedSource: 'free' | 'paid';
}

export interface WalletPurchaseResponse {
  status: 'purchased';
  wallet: WalletBalance;
  bundle: WalletCoinBundle;
}

export interface WalletVerifiedPurchaseResponse {
  status: 'verified' | 'duplicate';
  wallet: WalletBalance;
  creditedCoins: number;
  bundleId: CoinBundleId;
  productId: string;
  externalPurchaseId: string;
  provider: 'google_play';
  orderId: string | null;
  purchaseToken: string | null;
}

export interface WalletCreditResponse {
  wallet: WalletBalance;
  amount: number;
  reason: 'earned_from_invite' | 'manual_adjustment';
}

export interface WalletRewardedAdResponse {
  status: 'claimed' | 'duplicate' | 'limit_reached';
  wallet: WalletBalance;
  remainingAdsToday: number;
  provider: 'DARO';
  rewardAmount: number;
  rewardClaimId: string;
}

export interface LaunchAnalyticsReport {
  generatedAt: string;
  totalEvents: number;
  counts: {
    share: number;
    invite_open: number;
    install_from_invite: number;
    d1_retention: number;
    invite_reward_claimed: number;
    invite_reward_duplicate: number;
    invite_reward_claim_failed: number;
    first_reading_success: number;
    first_reading_failure: number;
  };
  timeToFirstValue: {
    samples: number;
    averageMs: number;
    withinTargetCount: number;
    withinTargetRate: number;
  };
  recentEvents: Array<{
    name: string;
    timestamp: string;
    payload: Record<string, unknown>;
  }>;
}

export class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status = 500) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

type ApiEnvelope<T> = {
  data?: T;
  error?: {
    code?: string;
    message?: string;
  };
};

const RETRYABLE_ERROR_CODES = new Set(['TIMEOUT', 'NETWORK_ERROR', 'OFFLINE']);

const clampNonNegativeInt = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(0, Math.floor(parsed));
};

const safeTimestamp = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const getDefaultWalletBalance = (now = Date.now()): WalletBalance => ({
  freeCoins: DAILY_FREE_YEOPJEON,
  paidCoins: 0,
  totalCoinsUsed: 0,
  adsWatchedToday: 0,
  lastRefillTime: now,
  freeCoinsExpireAt: now + CURRENCY_WINDOW_MS,
  lastAdResetTime: now,
});

const normalizeWalletBalance = (value: Partial<WalletBalance> | null | undefined, now = Date.now()): WalletBalance => {
  const defaults = getDefaultWalletBalance(now);
  let freeCoins = Math.min(DAILY_FREE_YEOPJEON, clampNonNegativeInt(value?.freeCoins, defaults.freeCoins));
  let paidCoins = clampNonNegativeInt(value?.paidCoins, defaults.paidCoins);
  let totalCoinsUsed = clampNonNegativeInt(value?.totalCoinsUsed, defaults.totalCoinsUsed);
  let adsWatchedToday = Math.min(MAX_REWARDED_ADS_PER_DAY, clampNonNegativeInt(value?.adsWatchedToday));
  let lastRefillTime = safeTimestamp(value?.lastRefillTime, defaults.lastRefillTime);
  let freeCoinsExpireAt = safeTimestamp(value?.freeCoinsExpireAt, lastRefillTime + CURRENCY_WINDOW_MS);
  let lastAdResetTime = safeTimestamp(value?.lastAdResetTime, defaults.lastAdResetTime);

  if (now >= freeCoinsExpireAt) {
    freeCoins = DAILY_FREE_YEOPJEON;
    lastRefillTime = now;
    freeCoinsExpireAt = now + CURRENCY_WINDOW_MS;
  }

  if (now - lastAdResetTime >= CURRENCY_WINDOW_MS) {
    adsWatchedToday = 0;
    lastAdResetTime = now;
  }

  return {
    freeCoins,
    lastRefillTime,
    freeCoinsExpireAt,
    paidCoins,
    adsWatchedToday,
    lastAdResetTime,
    totalCoinsUsed,
  };
};

const cacheWalletBalance = (wallet: WalletBalance) => {
  const normalized = normalizeWalletBalance(wallet);
  storage.set(KEYS.COINS, normalized);
  return normalized;
};

const getCachedWalletBalance = () => normalizeWalletBalance(storage.get(KEYS.COINS, null));

const getCachedUserState = (): UserStateSnapshot => ({
  profiles: (storage.get(KEYS.SAJU_DATA, []) || []) as UserProfile[],
  activeProfileId: storage.get(KEYS.ACTIVE_PROFILE_ID, storage.get('activeProfileId', 'me')) as string,
  userTier: storage.get(KEYS.USER_TIER, 'FREE') as UserStateSnapshot['userTier'],
  onboardingComplete: Boolean(storage.get(KEYS.ONBOARDING_STATUS, false)),
});

const cacheUserState = (snapshot: Partial<UserStateSnapshot> | null | undefined): UserStateSnapshot => {
  const current = getCachedUserState();
  const next: UserStateSnapshot = {
    profiles: Array.isArray(snapshot?.profiles) ? snapshot.profiles : current.profiles,
    activeProfileId: String(snapshot?.activeProfileId || current.activeProfileId || 'me'),
    userTier: (snapshot?.userTier || current.userTier || 'FREE') as UserStateSnapshot['userTier'],
    onboardingComplete: Boolean(snapshot?.onboardingComplete ?? current.onboardingComplete),
  };

  storage.set(KEYS.SAJU_DATA, next.profiles);
  storage.set(KEYS.ACTIVE_PROFILE_ID, next.activeProfileId);
  storage.set(KEYS.USER_TIER, next.userTier);
  storage.set(KEYS.ONBOARDING_STATUS, next.onboardingComplete);
  return next;
};

const getCachedSpecialReports = () => (
  storage.get(KEYS.SPECIAL_REPORT_UNLOCKS, []) as SpecialReportUnlock[]
);

const cacheSpecialReports = (reports: SpecialReportUnlock[]) => {
  storage.set(KEYS.SPECIAL_REPORT_UNLOCKS, reports);
  return reports;
};

const getWalletIdentity = (): WalletIdentity => ({
  installationId: getOrCreateInstallationId(),
  userId: auth?.currentUser?.uid || undefined,
});

const canFallbackToLocalWallet = (error: unknown) =>
  !(error instanceof ApiError) || RETRYABLE_ERROR_CODES.has(error.code);

const parseJsonSafely = (text: string) => {
  if (!text.trim()) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const resolveError = (status: number, payload: ApiEnvelope<unknown> | null): ApiError => {
  const code = payload?.error?.code || (status === 429 ? 'RATE_LIMITED' : 'API_ERROR');
  const message = payload?.error?.message || `API request failed (${status})`;
  return new ApiError(code, message, status);
};

async function postJson<TResponse, TRequest = unknown>(
  endpointPath: string,
  body: TRequest,
  attempt = 0,
): Promise<TResponse> {
  return requestJson<TResponse, TRequest>('POST', endpointPath, body, attempt);
}

async function getJson<TResponse>(
  endpointPath: string,
  attempt = 0,
): Promise<TResponse> {
  return requestJson<TResponse>('GET', endpointPath, undefined, attempt);
}

async function requestJson<TResponse, TRequest = unknown>(
  method: 'GET' | 'POST',
  endpointPath: string,
  body?: TRequest,
  attempt = 0,
): Promise<TResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), clientEnv.apiTimeoutMs);
  const url = `${clientEnv.apiBaseUrl}${endpointPath}`;

  try {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      throw new ApiError('OFFLINE', 'You are offline right now.', 0);
    }

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: method === 'GET' ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    const text = await response.text();
    const payload = parseJsonSafely(text) as ApiEnvelope<TResponse> | null;

    if (!response.ok) {
      throw resolveError(response.status, payload);
    }

    if (payload?.data) {
      return payload.data;
    }

    if (payload) {
      return payload as TResponse;
    }

    throw new ApiError('INVALID_RESPONSE', 'Server returned an empty response.', response.status || 502);
  } catch (error) {
    if (error instanceof ApiError) {
      if (attempt < 1 && RETRYABLE_ERROR_CODES.has(error.code)) {
        return requestJson(method, endpointPath, body, attempt + 1);
      }
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (attempt < 1) {
        return requestJson(method, endpointPath, body, attempt + 1);
      }
      throw new ApiError('TIMEOUT', 'Request timed out', 408);
    }
    if (attempt < 1) {
      return requestJson(method, endpointPath, body, attempt + 1);
    }
    throw new ApiError('NETWORK_ERROR', 'Failed to connect to API', 503);
  } finally {
    clearTimeout(timeoutId);
  }
}

export const api = {
  user: {
    getState: async (snapshot?: Partial<UserStateSnapshot>): Promise<UserStateSnapshot> => {
      const cached = getCachedUserState();
      try {
        const data = await postJson<UserStateSnapshot, WalletIdentity & { snapshot?: Partial<UserStateSnapshot> }>(
          '/user/state',
          {
            ...getWalletIdentity(),
            snapshot: snapshot ?? cached,
          },
        );
        return cacheUserState(data);
      } catch (error) {
        return cacheUserState(snapshot || cached);
      }
    },
    saveState: async (snapshot: UserStateSnapshot): Promise<UserStateSnapshot> => {
      try {
        const data = await postJson<UserStateSnapshot, WalletIdentity & { snapshot: UserStateSnapshot }>(
          '/user/state/save',
          {
            ...getWalletIdentity(),
            snapshot,
          },
        );
        return cacheUserState(data);
      } catch (error) {
        return cacheUserState(snapshot);
      }
    },
    getProfiles: async (): Promise<UserProfile[]> => {
      return (await api.user.getState()).profiles;
    },
    saveProfiles: async (profiles: UserProfile[]) => {
      const current = getCachedUserState();
      const saved = await api.user.saveState({
        ...current,
        profiles,
        activeProfileId: profiles.some((profile) => profile.id === current.activeProfileId)
          ? current.activeProfileId
          : profiles[0]?.id || 'me',
      });
      return saved.profiles;
    },
    getActiveProfileId: async (): Promise<string> => {
      return (await api.user.getState()).activeProfileId;
    },
    setActiveProfileId: async (id: string) => {
      const current = getCachedUserState();
      await api.user.saveState({
        ...current,
        activeProfileId: id,
      });
    },
    getUserTier: async (): Promise<UserStateSnapshot['userTier']> => {
      return (await api.user.getState()).userTier;
    },
    setUserTier: async (userTier: UserStateSnapshot['userTier']) => {
      const current = getCachedUserState();
      return api.user.saveState({
        ...current,
        userTier,
      });
    },
    getOnboardingComplete: async (): Promise<boolean> => {
      return (await api.user.getState()).onboardingComplete;
    },
    setOnboardingComplete: async (onboardingComplete: boolean) => {
      const current = getCachedUserState();
      return api.user.saveState({
        ...current,
        onboardingComplete,
      });
    },
    resetProfile: async () => {
      storage.remove(KEYS.SAJU_DATA);
      storage.remove(KEYS.ONBOARDING_STATUS);
      storage.remove(KEYS.INITIAL_ANALYSIS_DONE);
      storage.remove(KEYS.ACTIVE_PROFILE_ID);
      storage.remove('activeProfileId');
      storage.remove(KEYS.USER_TIER);
      return true;
    },
  },
  wallet: {
    getBalance: async (snapshot?: Partial<WalletBalance> | null): Promise<WalletBalance> => {
      const cached = getCachedWalletBalance();
      try {
        const data = await postJson<WalletBalance, WalletIdentity & { snapshot?: Partial<WalletBalance> | null }>(
          '/wallet/state',
          {
            ...getWalletIdentity(),
            snapshot: snapshot ?? cached,
          },
        );
        return cacheWalletBalance(data);
      } catch (error) {
        return cacheWalletBalance(snapshot || cached);
      }
    },
    updateBalance: async (balanceData: Partial<WalletBalance> | null | undefined) => {
      return api.wallet.getBalance(balanceData);
    },
    spendCoin: async (context = 'generic'): Promise<WalletSpendResponse> => {
      try {
        const data = await postJson<WalletSpendResponse, WalletIdentity & { context: string }>(
          '/wallet/spend',
          {
            ...getWalletIdentity(),
            context,
          },
        );
        return {
          ...data,
          wallet: cacheWalletBalance(data.wallet),
        };
      } catch (error) {
        if (!canFallbackToLocalWallet(error)) {
          throw error;
        }

        const current = getCachedWalletBalance();
        if (current.freeCoins <= 0 && current.paidCoins <= 0) {
          throw new ApiError('INSUFFICIENT_COINS', 'Not enough coins are available.', 409);
        }

        const source = current.freeCoins > 0 ? 'free' : 'paid';
        const nextWallet = cacheWalletBalance({
          ...current,
          freeCoins: source === 'free' ? current.freeCoins - 1 : current.freeCoins,
          paidCoins: source === 'paid' ? current.paidCoins - 1 : current.paidCoins,
          totalCoinsUsed: current.totalCoinsUsed + 1,
        });
        return { wallet: nextWallet, source };
      }
    },
    refundCoin: async (source: 'free' | 'paid', reason = 'request_failed'): Promise<WalletRefundResponse> => {
      try {
        const data = await postJson<WalletRefundResponse, WalletIdentity & { source: 'free' | 'paid'; reason: string }>(
          '/wallet/refund',
          {
            ...getWalletIdentity(),
            source,
            reason,
          },
        );
        return {
          ...data,
          wallet: cacheWalletBalance(data.wallet),
        };
      } catch (error) {
        if (!canFallbackToLocalWallet(error)) {
          throw error;
        }

        const current = getCachedWalletBalance();
        const nextWallet = cacheWalletBalance({
          ...current,
          freeCoins: source === 'free'
            ? Math.min(DAILY_FREE_YEOPJEON, current.freeCoins + 1)
            : current.freeCoins,
          paidCoins: source === 'paid' ? current.paidCoins + 1 : current.paidCoins,
          totalCoinsUsed: Math.max(0, current.totalCoinsUsed - 1),
        });
        return { wallet: nextWallet, refundedSource: source };
      }
    },
    purchaseBundle: async (bundleId: CoinBundleId = YEOPJEON_STARTER_BUNDLE.id): Promise<WalletPurchaseResponse> => {
      try {
        const data = await postJson<WalletPurchaseResponse, WalletIdentity & { bundleId: CoinBundleId }>(
          '/wallet/purchase',
          {
            ...getWalletIdentity(),
            bundleId,
          },
        );
        return {
          ...data,
          wallet: cacheWalletBalance(data.wallet),
        };
      } catch (error) {
        if (!canFallbackToLocalWallet(error)) {
          throw error;
        }

        const bundle = COIN_BUNDLES.find((candidate) => candidate.id === bundleId) || YEOPJEON_STARTER_BUNDLE;
        const current = getCachedWalletBalance();
        const nextWallet = cacheWalletBalance({
          ...current,
          paidCoins: current.paidCoins + bundle.coinAmount,
        });
        return {
          status: 'purchased',
          bundle,
          wallet: nextWallet,
        };
      }
    },
    verifyGooglePlayPurchase: async (
      purchaseToken: string,
      bundleId: CoinBundleId = YEOPJEON_STARTER_BUNDLE.id,
      productId: CoinBundleId = YEOPJEON_STARTER_BUNDLE.id,
      packageName?: string,
    ): Promise<WalletVerifiedPurchaseResponse> => {
      const data = await postJson<
        WalletVerifiedPurchaseResponse,
        WalletIdentity & {
          provider: 'google_play';
          bundleId: CoinBundleId;
          productId: CoinBundleId;
          purchaseToken: string;
          packageName?: string;
        }
      >('/wallet/purchase/verify', {
        ...getWalletIdentity(),
        provider: 'google_play',
        bundleId,
        productId,
        purchaseToken,
        packageName,
      });

      return {
        ...data,
        wallet: cacheWalletBalance(data.wallet),
      };
    },
    creditPaidCoins: async (
      amount: number,
      reason: 'earned_from_invite' | 'manual_adjustment' = 'manual_adjustment',
    ): Promise<WalletCreditResponse> => {
      try {
        const data = await postJson<
          WalletCreditResponse,
          WalletIdentity & { amount: number; reason: 'earned_from_invite' | 'manual_adjustment' }
        >('/wallet/credit', {
          ...getWalletIdentity(),
          amount,
          reason,
        });
        return {
          ...data,
          wallet: cacheWalletBalance(data.wallet),
        };
      } catch (error) {
        if (!canFallbackToLocalWallet(error)) {
          throw error;
        }

        const current = getCachedWalletBalance();
        const nextWallet = cacheWalletBalance({
          ...current,
          paidCoins: current.paidCoins + amount,
        });
        return {
          wallet: nextWallet,
          amount,
          reason,
        };
      }
    },
    claimRewardedAd: async (
      provider: 'DARO' = 'DARO',
      placementId = 'daily_reward_default',
      rewardClaimId = `daro_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    ): Promise<WalletRewardedAdResponse> => {
      try {
        const data = await postJson<
          WalletRewardedAdResponse,
          WalletIdentity & { provider: 'DARO'; placementId: string; rewardClaimId: string }
        >('/wallet/rewarded-ad/claim', {
          ...getWalletIdentity(),
          provider,
          placementId,
          rewardClaimId,
        });
        return {
          ...data,
          wallet: cacheWalletBalance(data.wallet),
        };
      } catch (error) {
        if (!canFallbackToLocalWallet(error)) {
          throw error;
        }

        const current = getCachedWalletBalance();
        if (current.adsWatchedToday >= MAX_REWARDED_ADS_PER_DAY) {
          return {
            status: 'limit_reached',
            wallet: current,
            remainingAdsToday: 0,
            provider,
            rewardAmount: 0,
            rewardClaimId,
          };
        }

        const nextWallet = cacheWalletBalance({
          ...current,
          paidCoins: current.paidCoins + 1,
          adsWatchedToday: current.adsWatchedToday + 1,
        });
        return {
          status: 'claimed',
          wallet: nextWallet,
          remainingAdsToday: Math.max(0, MAX_REWARDED_ADS_PER_DAY - nextWallet.adsWatchedToday),
          provider,
          rewardAmount: 1,
          rewardClaimId,
        };
      }
    },
  },
  content: {
    getDailyInsights: async () => {
      return storage.get(KEYS.DAILY_INSIGHTS, null);
    },
    saveDailyInsights: async (insights: DailyInsights) => {
      storage.set(KEYS.DAILY_INSIGHTS, {
        date: new Date().toLocaleDateString(),
        data: insights,
      });
      return insights;
    },
  },
  ai: {
    chat: async (request: ChatRequest) => {
      return postJson<ChatResponse, ChatRequest>('/fortune/chat', {
        ...getWalletIdentity(),
        ...request,
      });
    },
    generateDailyInsights: async (request: DailyInsightsRequest) => {
      return postJson<DailyInsights, DailyInsightsRequest>('/fortune/daily-insights', request);
    },
  },
  memory: {
    getProfileMemory: async (
      profileId: string,
      snapshot?: ChatRequest['memoryProfile'],
    ) => {
      return postJson<NonNullable<ChatRequest['memoryProfile']>, WalletIdentity & {
        profileId: string;
        snapshot?: ChatRequest['memoryProfile'];
      }>('/memory/profile/state', {
        ...getWalletIdentity(),
        profileId,
        snapshot,
      });
    },
    upsertProfileMemory: async (
      profileId: string,
      snapshot: NonNullable<ChatRequest['memoryProfile']>,
    ) => {
      return postJson<NonNullable<ChatRequest['memoryProfile']>, WalletIdentity & {
        profileId: string;
        snapshot: NonNullable<ChatRequest['memoryProfile']>;
      }>('/memory/profile/upsert', {
        ...getWalletIdentity(),
        profileId,
        snapshot,
      });
    },
  },
  invites: {
    claimReward: async (request: InviteClaimRequest) => {
      return postJson<InviteRewardServerResult, InviteClaimRequest>('/invites/claim', request);
    },
  },
  unlocks: {
    getSpecialReports: async (snapshot?: SpecialReportUnlock[]) => {
      const cached = getCachedSpecialReports();
      try {
        const data = await postJson<SpecialReportUnlock[], WalletIdentity & { snapshot?: SpecialReportUnlock[] }>(
          '/unlocks/special-reports/state',
          {
            ...getWalletIdentity(),
            snapshot: snapshot ?? cached,
          },
        );
        return cacheSpecialReports(data);
      } catch (error) {
        return cacheSpecialReports(snapshot || cached);
      }
    },
    upsertSpecialReport: async (report: SpecialReportUnlock) => {
      try {
        const data = await postJson<SpecialReportUnlock, WalletIdentity & { report: SpecialReportUnlock }>(
          '/unlocks/special-reports/upsert',
          {
            ...getWalletIdentity(),
            report,
          },
        );
        const nextReports = cacheSpecialReports(
          [...getCachedSpecialReports().filter((item) => item.id !== data.id), data]
            .sort((left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime()),
        );
        return nextReports.find((item) => item.id === data.id) || data;
      } catch (error) {
        const nextReports = cacheSpecialReports(
          [...getCachedSpecialReports().filter((item) => item.id !== report.id), report]
            .sort((left, right) => new Date(right.unlockedAt).getTime() - new Date(left.unlockedAt).getTime()),
        );
        return nextReports.find((item) => item.id === report.id) || report;
      }
    },
  },
  chatSummaries: {
    getProfileSummary: async (profileId: string, snapshot?: Partial<ChatSummaryState>) => {
      return postJson<ChatSummaryState, WalletIdentity & { profileId: string; snapshot?: Partial<ChatSummaryState> }>(
        '/chat-summaries/profile/state',
        {
          ...getWalletIdentity(),
          profileId,
          snapshot,
        },
      );
    },
  },
  auth: {
    promoteInstallation: async (snapshot: UserStateSnapshot, specialReports: SpecialReportUnlock[] = []) => {
      const data = await postJson<AuthPromotionResponse, WalletIdentity & {
        userId: string;
        snapshot: UserStateSnapshot;
        specialReports?: SpecialReportUnlock[];
      }>('/auth/promote-installation', {
        ...getWalletIdentity(),
        userId: auth?.currentUser?.uid || '',
        snapshot,
        specialReports,
      });
      cacheUserState(data.userState);
      cacheSpecialReports(data.specialReports || []);
      return data;
    },
  },
  analytics: {
    getLaunchReport: async () => {
      return getJson<LaunchAnalyticsReport>('/client-events/report');
    },
  },
};
