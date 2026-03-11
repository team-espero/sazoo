import { clientEnv } from '../config/env';
import { getFirebaseAnalytics } from '../config/firebase';
import { KEYS, storage } from './storage';

export type LaunchEventName =
  | 'share'
  | 'invite_open'
  | 'invite_reward_claimed'
  | 'invite_reward_duplicate'
  | 'invite_reward_self_blocked'
  | 'invite_reward_claim_failed'
  | 'install_from_invite'
  | 'd1_retention'
  | 'time_to_first_value'
  | 'onboarding_step_view'
  | 'onboarding_step_complete'
  | 'first_reading_success'
  | 'first_reading_failure';

export type LaunchEvent = {
  name: LaunchEventName;
  timestamp: string;
  payload: Record<string, unknown>;
};

const SESSION_KEYS = {
  firstValueStartedAt: 'sazoo_first_value_started_at',
  firstValueDone: 'sazoo_first_value_done',
} as const;

const MAX_STORED_EVENTS = 300;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const ANALYTICS_ENDPOINT = `${clientEnv.apiBaseUrl}/client-events`;
const MAX_FIREBASE_PARAMS = 20;
const FIREBASE_DEBUG_PARAMS =
  clientEnv.appEnv === 'prod'
    ? {}
    : {
        debug_mode: 1,
        sazoo_env: clientEnv.appEnv,
      };

let firebaseWarningShown = false;
let firebaseFlushPromise: Promise<void> | null = null;
let firebaseModulePromise: Promise<typeof import('firebase/analytics') | null> | null = null;
let initialFirebaseFlushDelayed = false;
const firebaseEventQueue: LaunchEvent[] = [];

const safeSession = {
  get(key: string) {
    try {
      return window.sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      window.sessionStorage.setItem(key, value);
    } catch {
      // noop
    }
  },
};

const appendEvent = (event: LaunchEvent) => {
  const current = storage.get(KEYS.ANALYTICS_EVENTS, []) as LaunchEvent[];
  const nextEvents = [...current, event].slice(-MAX_STORED_EVENTS);
  storage.set(KEYS.ANALYTICS_EVENTS, nextEvents);
};

const nowIso = () => new Date().toISOString();

const normalizeFirebaseParamKey = (value: string) => value.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40) || 'value';

const normalizeFirebaseParamValue = (value: unknown): string | number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (typeof value === 'string') return value.slice(0, 100);
  if (typeof value === 'boolean') return value ? 1 : 0;

  try {
    return JSON.stringify(value).slice(0, 100);
  } catch {
    return undefined;
  }
};

const toFirebaseParams = (payload: Record<string, unknown>) => {
  const entries = Object.entries({
    ...FIREBASE_DEBUG_PARAMS,
    ...payload,
  })
    .slice(0, MAX_FIREBASE_PARAMS)
    .map(([key, value]) => [normalizeFirebaseParamKey(key), normalizeFirebaseParamValue(value)] as const)
    .filter((entry): entry is readonly [string, string | number] => entry[1] !== undefined);

  return Object.fromEntries(entries);
};

const dispatchToCollector = (event: LaunchEvent) => {
  const body = JSON.stringify(event);

  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon(ANALYTICS_ENDPOINT, blob)) {
        return;
      }
    }
  } catch {
    // fall through to fetch
  }

  if (typeof fetch === 'function') {
    void fetch(ANALYTICS_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => {});
  }
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const flushFirebaseQueue = async () => {
  if (firebaseFlushPromise) {
    return firebaseFlushPromise;
  }

  firebaseFlushPromise = (async () => {
    try {
      const analytics = await getFirebaseAnalytics();
      if (!analytics) {
        firebaseEventQueue.length = 0;
        return;
      }

      firebaseModulePromise ??= import('firebase/analytics').catch((error) => {
        if (!firebaseWarningShown) {
          console.warn('Firebase Analytics module load skipped:', error);
          firebaseWarningShown = true;
        }
        return null;
      });

      const analyticsModule = await firebaseModulePromise;
      if (!analyticsModule) {
        firebaseEventQueue.length = 0;
        return;
      }

      // Give the initial Firebase page_view/config pass a brief head start so early app_boot events are not dropped.
      if (!initialFirebaseFlushDelayed) {
        initialFirebaseFlushDelayed = true;
        await delay(1200);
      }

      while (firebaseEventQueue.length > 0) {
        const nextEvent = firebaseEventQueue.shift();
        if (!nextEvent) continue;
        analyticsModule.logEvent(analytics, nextEvent.name, toFirebaseParams(nextEvent.payload));
      }
    } catch (error) {
      if (!firebaseWarningShown) {
        console.warn('Firebase Analytics dispatch skipped:', error);
        firebaseWarningShown = true;
      }
    } finally {
      firebaseFlushPromise = null;
      if (firebaseEventQueue.length > 0) {
        void flushFirebaseQueue();
      }
    }
  })();

  return firebaseFlushPromise;
};

const dispatchToFirebase = (event: LaunchEvent) => {
  firebaseEventQueue.push(event);
  void flushFirebaseQueue();
};

export const analytics = {
  track(name: LaunchEventName, payload: Record<string, unknown> = {}) {
    const event = {
      name,
      timestamp: nowIso(),
      payload,
    } satisfies LaunchEvent;

    appendEvent(event);
    dispatchToCollector(event);
    void dispatchToFirebase(event);
    console.info(`[analytics] ${name}`, payload);
  },

  initSession(payload: Record<string, unknown> = {}) {
    const now = Date.now();
    const installAt = storage.get(KEYS.APP_INSTALL_AT, null) as number | null;
    const lastOpenAt = storage.get(KEYS.APP_LAST_OPEN_AT, null) as number | null;
    const isFirstInstall = !installAt;

    if (!installAt) {
      storage.set(KEYS.APP_INSTALL_AT, now);
    }

    if (
      installAt
      && lastOpenAt
      && now - installAt >= DAY_IN_MS
      && now - lastOpenAt >= DAY_IN_MS
      && !storage.get(KEYS.D1_RETENTION_TRACKED, false)
    ) {
      this.track('d1_retention', {
        ...payload,
        installAt: new Date(installAt).toISOString(),
        previousOpenAt: new Date(lastOpenAt).toISOString(),
      });
      storage.set(KEYS.D1_RETENTION_TRACKED, true);
    }

    storage.set(KEYS.APP_LAST_OPEN_AT, now);
    return { isFirstInstall };
  },

  startFirstValueTimer(payload: Record<string, unknown> = {}) {
    safeSession.set(SESSION_KEYS.firstValueStartedAt, String(Date.now()));
    safeSession.set(SESSION_KEYS.firstValueDone, '0');
    this.track('onboarding_step_view', {
      step: 'landing_cta',
      ...payload,
    });
  },

  completeFirstValueTimer(payload: Record<string, unknown> = {}) {
    if (safeSession.get(SESSION_KEYS.firstValueDone) === '1') {
      return;
    }

    const startedAt = Number(safeSession.get(SESSION_KEYS.firstValueStartedAt) || 0);
    if (!startedAt) {
      return;
    }

    const durationMs = Math.max(0, Date.now() - startedAt);
    this.track('time_to_first_value', {
      durationMs,
      withinTarget: durationMs <= 30000,
      ...payload,
    });
    safeSession.set(SESSION_KEYS.firstValueDone, '1');
  },

  trackOnboardingStep(step: number | string, phase: 'view' | 'complete', payload: Record<string, unknown> = {}) {
    this.track(phase === 'view' ? 'onboarding_step_view' : 'onboarding_step_complete', {
      step,
      ...payload,
    });
  },

  trackFirstReadingSuccess(payload: Record<string, unknown> = {}) {
    this.track('first_reading_success', payload);
    this.completeFirstValueTimer({
      milestone: 'first_reading_success',
      ...payload,
    });
  },

  trackFirstReadingFailure(payload: Record<string, unknown> = {}) {
    this.track('first_reading_failure', payload);
  },

  getEvents() {
    return storage.get(KEYS.ANALYTICS_EVENTS, []) as LaunchEvent[];
  },
};
