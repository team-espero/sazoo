export const storage = {
    get: (key: string, defaultValue: any) => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn(`Error reading ${key} from localStorage`, error);
            return defaultValue;
        }
    },
    set: (key: string, value: any) => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.warn(`Error writing ${key} to localStorage`, error);
        }
    },
    remove: (key: string) => {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.warn(`Error removing ${key} from localStorage`, error);
        }
    },
    clear: () => {
        try {
            localStorage.clear();
        } catch (error) {
            console.warn("Error clearing localStorage", error);
        }
    }
};

export const KEYS = {
    SAJU_DATA: 'saju',
    ONBOARDING_STATUS: 'isOnboardingComplete',
    THEME_MODE: 'themeMode',
    APP_LANGUAGE: 'appLanguage',
    PROFILE_MEMORY: 'profile_memory_v1',
    INITIAL_ANALYSIS_DONE: 'initialAnalysisDone',
    COINS: 'sazoo_coins',
    USER_TIER: 'user_tier_v1',
    ACTIVE_PROFILE_ID: 'active_profile_id_v1',
    LAST_DAILY_REWARD: 'last_daily_reward',
    UNLOCKED_ITEMS: 'unlocked_items_v2',
    DAILY_INSIGHTS: 'daily_insights',
    ANALYTICS_EVENTS: 'analytics_events_v1',
    APP_INSTALL_AT: 'app_install_at',
    APP_LAST_OPEN_AT: 'app_last_open_at',
    INSTALLATION_ID: 'installation_id_v1',
    D1_RETENTION_TRACKED: 'd1_retention_tracked',
    PENDING_INVITE: 'pending_invite_v1',
    CLAIMED_INVITE_REWARDS: 'claimed_invite_rewards_v1',
    SPECIAL_REPORT_UNLOCKS: 'special_report_unlocks_v1',
    AUTH_SESSION: 'auth_session_v1',
    LAUNCH_CACHE_OWNER: 'launch_cache_owner_v1',
    LAUNCH_CACHE_INVALIDATED_AT: 'launch_cache_invalidated_at_v1',
};
