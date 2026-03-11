import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { calculateSaju, isValidDailyInsightsPayload } from './utils';
import { auth } from './src/config/firebase';
import { api, ApiError, type UserStateSnapshot, type WalletBalance, type WalletPurchaseResponse, type WalletRewardedAdResponse, UserProfile } from './src/services/api';
import { CURRENCY_WINDOW_MS, DAILY_FREE_YEOPJEON, MAX_REWARDED_ADS_PER_DAY, YEOPJEON_STARTER_BUNDLE } from './src/services/currencyCatalog';
import { getUnlockedSpecialReports } from './src/services/inviteRewards';
import { storage, KEYS } from './src/services/storage';

export type UserTier = 'FREE' | 'BASIC' | 'PREMIUM';
export type AppLanguage = 'en' | 'ko' | 'ja';

type SajuStateValue = {
  profile: UserProfile;
  concern: string | null;
  saju: any;
  isOnboardingComplete: boolean;
  dailyInsights: any;
  lastDailyInsightsDate: string | null;
  initialAnalysisDone: boolean;
};

type CurrencyValue = {
  freeCoins: number;
  lastRefillTime: number;
  freeCoinsExpireAt: number;
  paidCoins: number;
  adsWatchedToday: number;
  lastAdResetTime: number;
  totalCoinsUsed: number;
};

type CoinSpendSource = 'free' | 'paid';
type CoinUseResult = {
  success: boolean;
  source?: CoinSpendSource;
};

type DataContextValue = {
  sajuState: SajuStateValue;
  profiles: UserProfile[];
  activeProfileId: string;
  userTier: UserTier;
  loading: boolean;
  pendingMessage: string | null;
};

type SettingsContextValue = {
  themeMode: string;
  language: AppLanguage;
};

type CurrencyContextValue = {
  currency: CurrencyValue;
  DAILY_FREE_COINS: number;
  MAX_ADS_PER_DAY: number;
};

type ActionsContextValue = {
  addProfile: (profile: Partial<UserProfile>) => Promise<{ success: boolean; error?: string; profileId?: string }>;
  editProfile: (id: string, updates: Partial<UserProfile>) => Promise<void>;
  deleteProfile: (id: string) => Promise<void>;
  switchProfile: (id: string) => Promise<void>;
  canAddProfile: () => boolean;
  upgradeTier: (tier: UserTier) => void;
  updateProfile: (key: string, value: any) => Promise<void>;
  updateProfileBatch: (updates: Partial<UserProfile> & Record<string, any>) => Promise<void>;
  updateConcern: (concernId: string | null) => void;
  calculateAndSetSaju: (manualBirthDate?: any) => Promise<void>;
  completeOnboarding: () => void;
  markInitialAnalysisDone: () => void;
  setThemeMode: (mode: string) => void;
  setPendingMessage: (message: string | null) => void;
  setLanguage: (language: AppLanguage) => void;
  useCoin: (contextKey?: string) => Promise<CoinUseResult>;
  refundCoin: (source: CoinSpendSource, reason?: string) => Promise<void>;
  canUseCoin: () => boolean;
  getTotalCoins: () => number;
  addCoinFromAd: (provider?: 'DARO', placementId?: string, rewardClaimId?: string) => Promise<WalletRewardedAdResponse>;
  purchaseCoins: (bundleId?: typeof YEOPJEON_STARTER_BUNDLE.id) => Promise<WalletPurchaseResponse>;
  grantPaidCoins: (amount: number, reason?: 'earned_from_invite' | 'manual_adjustment') => Promise<WalletBalance>;
  generateDailyInsights: () => Promise<void>;
};

const SLOT_LIMITS = {
  FREE: 2,
  BASIC: 5,
  PREMIUM: 999,
} as const;

const DAILY_FREE_COINS = DAILY_FREE_YEOPJEON;
const MAX_ADS_PER_DAY = MAX_REWARDED_ADS_PER_DAY;
const MS_IN_24_HOURS = CURRENCY_WINDOW_MS;

const INITIAL_PROFILE: UserProfile = {
  id: 'me',
  name: '',
  gender: null,
  knowledgeLevel: 'newbie',
  birthDate: { year: 1998, month: 5, day: 21, hour: 10, minute: 30, ampm: 'AM' },
  calendarType: '양력',
  isTimeUnknown: false,
  relation: 'me',
  memo: '',
  avatarId: 0,
};

const INITIAL_SAJU_STATE: SajuStateValue = {
  profile: INITIAL_PROFILE,
  concern: null,
  saju: null,
  isOnboardingComplete: false,
  dailyInsights: null,
  lastDailyInsightsDate: null,
  initialAnalysisDone: false,
};

const INITIAL_CURRENCY: CurrencyValue = {
  freeCoins: DAILY_FREE_COINS,
  lastRefillTime: Date.now(),
  freeCoinsExpireAt: Date.now() + MS_IN_24_HOURS,
  paidCoins: 0,
  adsWatchedToday: 0,
  lastAdResetTime: Date.now(),
  totalCoinsUsed: 0,
};

const SajuDataContext = createContext<DataContextValue | null>(null);
const SajuSettingsContext = createContext<SettingsContextValue | null>(null);
const SajuCurrencyContext = createContext<CurrencyContextValue | null>(null);
const SajuActionsContext = createContext<ActionsContextValue | null>(null);

const useRequiredContext = <T,>(context: React.Context<T | null>, label: string): T => {
  const value = useContext(context);
  if (!value) {
    throw new Error(`${label} must be used within SajuProvider`);
  }
  return value;
};

const syncThemeToDom = (mode: string) => {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const safeLocalDate = () => new Date().toLocaleDateString();

const clampNonNegativeInt = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 0;
  return Math.max(0, Math.floor(parsed));
};

const safeTimestamp = (value: unknown, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

const normalizeCurrencyState = (value: Partial<CurrencyValue> | null | undefined, now = Date.now()): CurrencyValue => {
  const lastRefillTime = safeTimestamp(value?.lastRefillTime, now);
  let freeCoinsExpireAt = safeTimestamp(value?.freeCoinsExpireAt, lastRefillTime + MS_IN_24_HOURS);
  let freeCoins = Math.min(DAILY_FREE_COINS, clampNonNegativeInt(value?.freeCoins));
  let paidCoins = clampNonNegativeInt(value?.paidCoins);
  let adsWatchedToday = Math.min(MAX_ADS_PER_DAY, clampNonNegativeInt(value?.adsWatchedToday));
  let lastAdResetTime = safeTimestamp(value?.lastAdResetTime, now);
  const totalCoinsUsed = clampNonNegativeInt(value?.totalCoinsUsed);
  let normalizedLastRefillTime = lastRefillTime;

  if (now >= freeCoinsExpireAt) {
    freeCoins = DAILY_FREE_COINS;
    normalizedLastRefillTime = now;
    freeCoinsExpireAt = now + MS_IN_24_HOURS;
  }

  if (now - lastAdResetTime >= MS_IN_24_HOURS) {
    adsWatchedToday = 0;
    lastAdResetTime = now;
  }

  return {
    freeCoins,
    lastRefillTime: normalizedLastRefillTime,
    freeCoinsExpireAt,
    paidCoins,
    adsWatchedToday,
    lastAdResetTime,
    totalCoinsUsed,
  };
};

const isSameCurrencyState = (left: CurrencyValue, right: CurrencyValue) => (
  left.freeCoins === right.freeCoins
  && left.lastRefillTime === right.lastRefillTime
  && left.freeCoinsExpireAt === right.freeCoinsExpireAt
  && left.paidCoins === right.paidCoins
  && left.adsWatchedToday === right.adsWatchedToday
  && left.lastAdResetTime === right.lastAdResetTime
  && left.totalCoinsUsed === right.totalCoinsUsed
);

export const SajuProvider = ({ children }: { children: React.ReactNode }) => {
  const [profiles, setProfiles] = useState<UserProfile[]>([INITIAL_PROFILE]);
  const [activeProfileId, setActiveProfileId] = useState('me');
  const [userTier, setUserTier] = useState<UserTier>('FREE');
  const [loading, setLoading] = useState(true);
  const [themeModeState, setThemeModeState] = useState('light');
  const [languageState, setLanguageState] = useState<AppLanguage>('ko');
  const [pendingMessage, setPendingMessageState] = useState<string | null>(null);
  const [sajuState, setSajuState] = useState<SajuStateValue>(INITIAL_SAJU_STATE);
  const [currency, setCurrency] = useState<CurrencyValue>(INITIAL_CURRENCY);

  const profilesRef = useRef(profiles);
  const activeProfileIdRef = useRef(activeProfileId);
  const userTierRef = useRef(userTier);
  const sajuStateRef = useRef(sajuState);
  const currencyRef = useRef(currency);
  const languageRef = useRef(languageState);
  const authPromotionKeyRef = useRef<string | null>(null);

  useEffect(() => {
    profilesRef.current = profiles;
  }, [profiles]);

  useEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);

  useEffect(() => {
    userTierRef.current = userTier;
  }, [userTier]);

  useEffect(() => {
    sajuStateRef.current = sajuState;
  }, [sajuState]);

  useEffect(() => {
    currencyRef.current = currency;
  }, [currency]);

  useEffect(() => {
    languageRef.current = languageState;
  }, [languageState]);

  const calculateSajuForProfile = useCallback((profile: UserProfile) => {
    const { year, month, day, hour, minute, ampm } = profile.birthDate;
    const computedHour =
      ampm === 'PM' && hour !== 12 ? hour + 12 : ampm === 'AM' && hour === 12 ? 0 : hour;
    return calculateSaju(year, month, day, computedHour, Number(minute));
  }, []);

  const updateStoredTheme = useCallback((mode: string) => {
    setThemeModeState(mode);
    storage.set(KEYS.THEME_MODE, mode);
    syncThemeToDom(mode);
  }, []);

  const updateStoredLanguage = useCallback((nextLanguage: AppLanguage) => {
    setLanguageState(nextLanguage);
    storage.set(KEYS.APP_LANGUAGE, nextLanguage);
    document.documentElement.lang = nextLanguage;
  }, []);

  const setPendingMessage = useCallback((message: string | null) => {
    setPendingMessageState(message);
  }, []);

  const buildUserStateSnapshot = useCallback((overrides: Partial<UserStateSnapshot> = {}): UserStateSnapshot => {
    const baseProfiles = overrides.profiles ?? profilesRef.current;
    const fallbackActiveId = baseProfiles.find((profile) => profile.id === activeProfileIdRef.current)?.id
      || baseProfiles[0]?.id
      || 'me';

    return {
      profiles: baseProfiles,
      activeProfileId: overrides.activeProfileId
        || (baseProfiles.find((profile) => profile.id === activeProfileIdRef.current)?.id ? activeProfileIdRef.current : fallbackActiveId),
      userTier: overrides.userTier ?? userTierRef.current,
      onboardingComplete: overrides.onboardingComplete ?? sajuStateRef.current.isOnboardingComplete,
    };
  }, []);

  const applyUserStateSnapshot = useCallback((snapshot: UserStateSnapshot) => {
    const safeProfiles = snapshot.profiles.length > 0 ? snapshot.profiles : [INITIAL_PROFILE];
    const safeActiveId = safeProfiles.some((profile) => profile.id === snapshot.activeProfileId)
      ? snapshot.activeProfileId
      : safeProfiles[0]?.id || 'me';
    const activeProfile = safeProfiles.find((profile) => profile.id === safeActiveId) || safeProfiles[0];

    profilesRef.current = safeProfiles;
    activeProfileIdRef.current = safeActiveId;
    userTierRef.current = snapshot.userTier;
    setProfiles(safeProfiles);
    setActiveProfileId(safeActiveId);
    setUserTier(snapshot.userTier);
    setSajuState((prev) => ({
      ...prev,
      profile: activeProfile,
      saju: activeProfile.name ? calculateSajuForProfile(activeProfile) : prev.saju,
      isOnboardingComplete: snapshot.onboardingComplete || !!activeProfile.name,
    }));
  }, [calculateSajuForProfile]);

  const persistUserStateSafely = useCallback(async (overrides: Partial<UserStateSnapshot> = {}) => {
    try {
      return await api.user.saveState(buildUserStateSnapshot(overrides));
    } catch (error) {
      console.error('Failed to persist user state:', error);
      return buildUserStateSnapshot(overrides);
    }
  }, [buildUserStateSnapshot]);

  const persistProfilesSafely = useCallback(async (nextProfiles: UserProfile[]) => {
    await persistUserStateSafely({
      profiles: nextProfiles,
      activeProfileId: nextProfiles.some((profile) => profile.id === activeProfileIdRef.current)
        ? activeProfileIdRef.current
        : nextProfiles[0]?.id || 'me',
    });
  }, [persistUserStateSafely]);

  const applyCurrencyState = useCallback((nextCurrency: CurrencyValue) => {
    currencyRef.current = nextCurrency;
    setCurrency(nextCurrency);
    storage.set(KEYS.COINS, nextCurrency);
  }, []);

  const syncCurrencyState = useCallback(async () => {
    try {
      const nextCurrency = normalizeCurrencyState(await api.wallet.getBalance(currencyRef.current));
      if (!isSameCurrencyState(currencyRef.current, nextCurrency)) {
        applyCurrencyState(nextCurrency);
      }
      return nextCurrency;
    } catch (error) {
      console.error('Failed to sync wallet balance:', error);
      const normalizedCurrency = normalizeCurrencyState(currencyRef.current);
      if (!isSameCurrencyState(currencyRef.current, normalizedCurrency)) {
        applyCurrencyState(normalizedCurrency);
      }
      return normalizedCurrency;
    }
  }, [applyCurrencyState]);

  const getNormalizedCurrencySnapshot = useCallback(() => {
    const normalizedCurrency = normalizeCurrencyState(currencyRef.current);
    if (!isSameCurrencyState(currencyRef.current, normalizedCurrency)) {
      applyCurrencyState(normalizedCurrency);
    }

    return normalizedCurrency;
  }, [applyCurrencyState]);

  const canAddProfile = useCallback(() => {
    return profilesRef.current.length < SLOT_LIMITS[userTierRef.current];
  }, []);

  const switchProfile = useCallback(async (id: string) => {
    const targetProfile = profilesRef.current.find((profile) => profile.id === id);
    if (!targetProfile) return;

    try {
      await persistUserStateSafely({ activeProfileId: id });
    } catch (error) {
      console.error('Failed to persist active profile:', error);
    }
    setActiveProfileId(id);
    setSajuState((prev) => ({
      ...prev,
      profile: targetProfile,
      saju: calculateSajuForProfile(targetProfile),
      dailyInsights: null,
      lastDailyInsightsDate: null,
    }));
  }, [calculateSajuForProfile, persistUserStateSafely]);

  const addProfile = useCallback(async (newProfileData: Partial<UserProfile>) => {
    if (!canAddProfile()) {
      return { success: false, error: 'LIMIT_REACHED' };
    }

    const newProfile: UserProfile = {
      ...INITIAL_PROFILE,
      ...newProfileData,
      id: Date.now().toString(),
    };

    const updatedProfiles = [...profilesRef.current, newProfile];
    profilesRef.current = updatedProfiles;
    setProfiles(updatedProfiles);
    await persistProfilesSafely(updatedProfiles);

    return { success: true, profileId: newProfile.id };
  }, [canAddProfile, persistProfilesSafely]);

  const updateProfile = useCallback(async (key: string, value: any) => {
    setSajuState((prev) => ({
      ...prev,
      profile: { ...prev.profile, [key]: value },
    }));

    const updatedProfiles = profilesRef.current.map((profile) =>
      profile.id === activeProfileIdRef.current ? { ...profile, [key]: value } : profile,
    );
    profilesRef.current = updatedProfiles;
    setProfiles(updatedProfiles);
    await persistProfilesSafely(updatedProfiles);
  }, [persistProfilesSafely]);

  const updateProfileBatch = useCallback(async (updates: Partial<UserProfile> & Record<string, any>) => {
    setSajuState((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...updates,
      },
    }));

    const updatedProfiles = profilesRef.current.map((profile) =>
      profile.id === activeProfileIdRef.current ? { ...profile, ...updates } : profile,
    );
    profilesRef.current = updatedProfiles;
    setProfiles(updatedProfiles);
    await persistProfilesSafely(updatedProfiles);
  }, [persistProfilesSafely]);

  const editProfile = useCallback(async (id: string, updates: Partial<UserProfile>) => {
    const updatedProfiles = profilesRef.current.map((profile) =>
      profile.id === id ? { ...profile, ...updates } : profile,
    );
    profilesRef.current = updatedProfiles;
    setProfiles(updatedProfiles);
    await persistProfilesSafely(updatedProfiles);

    if (activeProfileIdRef.current === id) {
      setSajuState((prev) => ({
        ...prev,
        profile: { ...prev.profile, ...updates },
      }));
    }
  }, [persistProfilesSafely]);

  const deleteProfile = useCallback(async (id: string) => {
    if (id === 'me') return;

    const filteredProfiles = profilesRef.current.filter((profile) => profile.id !== id);
    profilesRef.current = filteredProfiles;
    setProfiles(filteredProfiles);
    await persistProfilesSafely(filteredProfiles);

    if (activeProfileIdRef.current === id) {
      await switchProfile('me');
    }
  }, [persistProfilesSafely, switchProfile]);

  const upgradeTier = useCallback((tier: UserTier) => {
    setUserTier(tier);
    userTierRef.current = tier;
    void persistUserStateSafely({ userTier: tier });
  }, [persistUserStateSafely]);

  const updateConcern = useCallback((concernId: string | null) => {
    setSajuState((prev) => ({ ...prev, concern: concernId }));
  }, []);

  const completeOnboarding = useCallback(() => {
    setSajuState((prev) => ({ ...prev, isOnboardingComplete: true }));
    storage.set(KEYS.ONBOARDING_STATUS, true);
    void persistUserStateSafely({ onboardingComplete: true });
  }, [persistUserStateSafely]);

  const calculateAndSetSaju = useCallback(async (manualBirthDate?: any) => {
    const birthDateToUse = manualBirthDate || sajuStateRef.current.profile.birthDate;

    const { year, month, day, hour, minute, ampm } = birthDateToUse;
    const computedHour =
      ampm === 'PM' && hour !== 12 ? hour + 12 : ampm === 'AM' && hour === 12 ? 0 : hour;
    const result = calculateSaju(year, month, day, computedHour, Number(minute));

    setSajuState((prev) => ({ ...prev, saju: result }));
  }, []);

  const generateDailyInsights = useCallback(async () => {
    const currentState = sajuStateRef.current;
    if (!currentState.isOnboardingComplete || !currentState.saju) return;

    const today = safeLocalDate();
    if (currentState.lastDailyInsightsDate === today && currentState.dailyInsights) return;

    try {
      const insights = await api.ai.generateDailyInsights({
        language: languageRef.current,
        date: today,
        profile: currentState.profile,
        saju: currentState.saju,
      });

      if (!isValidDailyInsightsPayload(insights)) {
        throw new Error('Daily insights payload is invalid or contains broken text.');
      }

      await api.content.saveDailyInsights(insights);
      setSajuState((prev) => ({
        ...prev,
        dailyInsights: insights,
        lastDailyInsightsDate: today,
      }));
    } catch (error) {
      if (error instanceof ApiError) {
        console.error(`Failed to generate daily insights (${error.code}):`, error.message);
      } else {
        console.error('Failed to generate daily insights:', error);
      }
    }
  }, []);

  const checkDailyCurrencyReset = useCallback(async () => {
    await syncCurrencyState();
  }, [syncCurrencyState]);

  const useCoin = useCallback(async (contextKey = 'generic') => {
    try {
      const result = await api.wallet.spendCoin(contextKey);
      applyCurrencyState(normalizeCurrencyState(result.wallet));
      return { success: true, source: result.source };
    } catch (error) {
      if (error instanceof ApiError && error.code === 'INSUFFICIENT_COINS') {
        return { success: false };
      }
      console.error('Failed to spend coin:', error);
      return { success: false };
    }
  }, [applyCurrencyState]);

  const refundCoin = useCallback(async (source: CoinSpendSource, reason = 'request_failed') => {
    try {
      const result = await api.wallet.refundCoin(source, reason);
      applyCurrencyState(normalizeCurrencyState(result.wallet));
    } catch (error) {
      console.error('Failed to refund coin:', error);
      const currentCurrency = getNormalizedCurrencySnapshot();
      const fallbackCurrency = {
        ...currentCurrency,
        freeCoins: source === 'free'
          ? Math.min(DAILY_FREE_COINS, currentCurrency.freeCoins + 1)
          : currentCurrency.freeCoins,
        paidCoins: source === 'paid'
          ? currentCurrency.paidCoins + 1
          : currentCurrency.paidCoins,
        totalCoinsUsed: Math.max(0, currentCurrency.totalCoinsUsed - 1),
      };
      applyCurrencyState(fallbackCurrency);
    }
  }, [applyCurrencyState, getNormalizedCurrencySnapshot]);

  const canUseCoin = useCallback(() => {
    const currentCurrency = getNormalizedCurrencySnapshot();
    return currentCurrency.freeCoins > 0 || currentCurrency.paidCoins > 0;
  }, [getNormalizedCurrencySnapshot]);

  const getTotalCoins = useCallback(() => {
    const currentCurrency = getNormalizedCurrencySnapshot();
    return currentCurrency.freeCoins + currentCurrency.paidCoins;
  }, [getNormalizedCurrencySnapshot]);

  const addCoinFromAd = useCallback(async (
    provider: 'DARO' = 'DARO',
    placementId = 'daily_reward_default',
    rewardClaimId?: string,
  ) => {
    const result = await api.wallet.claimRewardedAd(provider, placementId, rewardClaimId);
    applyCurrencyState(normalizeCurrencyState(result.wallet));
    return result;
  }, [applyCurrencyState]);

  const purchaseCoins = useCallback(async (bundleId: typeof YEOPJEON_STARTER_BUNDLE.id = YEOPJEON_STARTER_BUNDLE.id) => {
    const result = await api.wallet.purchaseBundle(bundleId);
    applyCurrencyState(normalizeCurrencyState(result.wallet));
    return result;
  }, [applyCurrencyState]);

  const grantPaidCoins = useCallback(async (
    amount: number,
    reason: 'earned_from_invite' | 'manual_adjustment' = 'manual_adjustment',
  ) => {
    const result = await api.wallet.creditPaidCoins(amount, reason);
    const nextCurrency = normalizeCurrencyState(result.wallet);
    applyCurrencyState(nextCurrency);
    return nextCurrency;
  }, [applyCurrencyState]);

  const markInitialAnalysisDone = useCallback(() => {
    setSajuState((prev) => ({ ...prev, initialAnalysisDone: true }));
    storage.set(KEYS.INITIAL_ANALYSIS_DONE, true);
  }, []);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        const [
          userStateResult,
          balanceResult,
          insightsResult,
        ] = await Promise.allSettled([
          api.user.getState(buildUserStateSnapshot()),
          api.wallet.getBalance(storage.get(KEYS.COINS, null)),
          api.content.getDailyInsights(),
        ]);

        const savedUserState =
          userStateResult.status === 'fulfilled'
            ? userStateResult.value
            : buildUserStateSnapshot({ profiles: [INITIAL_PROFILE], activeProfileId: 'me' });
        const savedProfiles = savedUserState.profiles.length > 0 ? savedUserState.profiles : [INITIAL_PROFILE];
        const savedActiveId =
          savedProfiles.some((profile) => profile.id === savedUserState.activeProfileId)
            ? savedUserState.activeProfileId
            : savedProfiles[0]?.id || 'me';
        const savedBalance =
          balanceResult.status === 'fulfilled' && balanceResult.value
            ? normalizeCurrencyState(balanceResult.value)
            : INITIAL_CURRENCY;
        const savedInsights =
          insightsResult.status === 'fulfilled' ? insightsResult.value : null;

        const initialDone = storage.get(KEYS.INITIAL_ANALYSIS_DONE, false) as boolean;
        const savedOnboarding = storage.get(KEYS.ONBOARDING_STATUS, false) as boolean;
        const savedTheme = storage.get(KEYS.THEME_MODE, 'light') as string;
        const savedLanguage = storage.get(KEYS.APP_LANGUAGE, 'ko') as AppLanguage;

        if (!mounted) return;

        profilesRef.current = savedProfiles;
        setProfiles(savedProfiles);
        setActiveProfileId(savedActiveId);
        setUserTier(savedUserState.userTier);
        userTierRef.current = savedUserState.userTier;
        setCurrency(savedBalance);
        currencyRef.current = savedBalance;
        updateStoredTheme(savedTheme);
        updateStoredLanguage(savedLanguage);

        const activeProfile =
          savedProfiles.find((profile) => profile.id === savedActiveId) || savedProfiles[0];
        const validSavedInsights =
          savedInsights
          && savedInsights.date === safeLocalDate()
          && isValidDailyInsightsPayload(savedInsights.data)
            ? savedInsights
            : null;

        setSajuState((prev) => ({
          ...prev,
          profile: activeProfile,
          saju: activeProfile.name ? calculateSajuForProfile(activeProfile) : prev.saju,
          dailyInsights: validSavedInsights ? validSavedInsights.data : null,
          lastDailyInsightsDate: validSavedInsights ? validSavedInsights.date : null,
          isOnboardingComplete: savedUserState.onboardingComplete || savedOnboarding || !!activeProfile.name,
          initialAnalysisDone: initialDone,
        }));

        await checkDailyCurrencyReset();
      } catch (error) {
        console.error('Failed to initialize app state:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [buildUserStateSnapshot, calculateSajuForProfile, checkDailyCurrencyReset, updateStoredLanguage, updateStoredTheme]);

  useEffect(() => {
    if (!auth) {
      return undefined;
    }

    let cancelled = false;

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        authPromotionKeyRef.current = null;
        return;
      }

      const promotionKey = `${user.uid}:${profilesRef.current.length}:${activeProfileIdRef.current}`;
      if (authPromotionKeyRef.current === promotionKey) {
        return;
      }

      authPromotionKeyRef.current = promotionKey;
      void (async () => {
        try {
          const result = await api.auth.promoteInstallation(
            buildUserStateSnapshot(),
            getUnlockedSpecialReports(),
          );

          if (cancelled) {
            return;
          }

          storage.set(KEYS.SPECIAL_REPORT_UNLOCKS, result.specialReports || []);
          applyUserStateSnapshot(result.userState);
        } catch (error) {
          console.error('Failed to promote installation state after login:', error);
          authPromotionKeyRef.current = null;
        }
      })();
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [applyUserStateSnapshot, buildUserStateSnapshot]);

  useEffect(() => {
    const handleResume = () => {
      void checkDailyCurrencyReset();
    };

    window.addEventListener('focus', handleResume);
    document.addEventListener('visibilitychange', handleResume);
    const intervalId = window.setInterval(handleResume, 60000);

    return () => {
      window.removeEventListener('focus', handleResume);
      document.removeEventListener('visibilitychange', handleResume);
      window.clearInterval(intervalId);
    };
  }, [checkDailyCurrencyReset]);

  const dataContextValue = useMemo<DataContextValue>(() => ({
    sajuState,
    profiles,
    activeProfileId,
    userTier,
    loading,
    pendingMessage,
  }), [sajuState, profiles, activeProfileId, userTier, loading, pendingMessage]);

  const settingsContextValue = useMemo<SettingsContextValue>(() => ({
    themeMode: themeModeState,
    language: languageState,
  }), [themeModeState, languageState]);

  const currencyContextValue = useMemo<CurrencyContextValue>(() => ({
    currency,
    DAILY_FREE_COINS,
    MAX_ADS_PER_DAY,
  }), [currency]);

  const actionsContextValue = useMemo<ActionsContextValue>(() => ({
    addProfile,
    editProfile,
    deleteProfile,
    switchProfile,
    canAddProfile,
    upgradeTier,
    updateProfile,
    updateProfileBatch,
    updateConcern,
    calculateAndSetSaju,
    completeOnboarding,
    markInitialAnalysisDone,
    setThemeMode: updateStoredTheme,
    setPendingMessage,
    setLanguage: updateStoredLanguage,
    useCoin,
    refundCoin,
    canUseCoin,
    getTotalCoins,
    addCoinFromAd,
    purchaseCoins,
    grantPaidCoins,
    generateDailyInsights,
  }), [
    addCoinFromAd,
    addProfile,
    calculateAndSetSaju,
    canAddProfile,
    canUseCoin,
    completeOnboarding,
    deleteProfile,
    editProfile,
    generateDailyInsights,
    getTotalCoins,
    grantPaidCoins,
    markInitialAnalysisDone,
    purchaseCoins,
    refundCoin,
    setPendingMessage,
    switchProfile,
    updateConcern,
    updateProfile,
    updateProfileBatch,
    updateStoredLanguage,
    updateStoredTheme,
    upgradeTier,
    useCoin,
  ]);

  return (
    <SajuDataContext.Provider value={dataContextValue}>
      <SajuSettingsContext.Provider value={settingsContextValue}>
        <SajuCurrencyContext.Provider value={currencyContextValue}>
          <SajuActionsContext.Provider value={actionsContextValue}>
            {children}
          </SajuActionsContext.Provider>
        </SajuCurrencyContext.Provider>
      </SajuSettingsContext.Provider>
    </SajuDataContext.Provider>
  );
};

export const useSajuData = () => useRequiredContext(SajuDataContext, 'useSajuData');
export const useSajuSettings = () => useRequiredContext(SajuSettingsContext, 'useSajuSettings');
export const useSajuCurrency = () => useRequiredContext(SajuCurrencyContext, 'useSajuCurrency');
export const useSajuActions = () => useRequiredContext(SajuActionsContext, 'useSajuActions');

export const useSaju = () => {
  const data = useSajuData();
  const settings = useSajuSettings();
  const currencyState = useSajuCurrency();
  const actions = useSajuActions();

  return useMemo(() => ({
    ...data,
    ...settings,
    ...currencyState,
    ...actions,
  }), [actions, currencyState, data, settings]);
};

