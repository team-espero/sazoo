import { KEYS, storage } from './storage';
import type { LifecycleContext, LifecycleMode, LifecycleStage } from '../types/lifecycle';

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const clampTimestamp = (value: unknown) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return null;
  }
  return parsed;
};

const toDayIndex = (timestamp: number) => Math.floor(timestamp / DAY_IN_MS);

const getDaysSince = (timestamp: number | null, now: number) => {
  if (!timestamp) return undefined;
  return Math.max(0, toDayIndex(now) - toDayIndex(timestamp));
};

export const resolveLifecycleStageFromDays = (daysSinceReference: number): LifecycleStage => {
  if (daysSinceReference <= 0) return 'day1_activation';
  if (daysSinceReference === 1) return 'day2_reopen';
  if (daysSinceReference === 2) return 'day3_question_habit';
  if (daysSinceReference === 3) return 'day4_tone_learning';
  if (daysSinceReference === 4) return 'day5_discovery';
  if (daysSinceReference === 5) return 'day6_pattern_preview';
  if (daysSinceReference === 6) return 'day7_weekly_wrap';
  if (daysSinceReference <= 27) return 'pattern_building';
  if (daysSinceReference <= 59) return 'decision_support';
  if (daysSinceReference <= 179) return 'personal_os';
  if (daysSinceReference <= 364) return 'relationship_archive';
  return 'time_archive';
};

export const resolveLifecycleMode = (stage: LifecycleStage): LifecycleMode => (
  stage.startsWith('day') ? 'product_led' : 'memory_led'
);

export const resolveStoredLifecycleContext = (now = Date.now()): LifecycleContext => {
  const installAt = clampTimestamp(storage.get(KEYS.APP_INSTALL_AT, null));
  const onboardingCompletedAt = clampTimestamp(storage.get(KEYS.ONBOARDING_COMPLETED_AT, null)) || installAt;
  const firstReadingCompletedAt = clampTimestamp(storage.get(KEYS.FIRST_READING_COMPLETED_AT, null)) || onboardingCompletedAt || installAt;
  const daysSinceOnboarding = getDaysSince(onboardingCompletedAt, now);
  const daysSinceFirstReading = getDaysSince(firstReadingCompletedAt, now);
  const stage = resolveLifecycleStageFromDays(daysSinceFirstReading ?? daysSinceOnboarding ?? 0);

  return {
    stage,
    mode: resolveLifecycleMode(stage),
    daysSinceOnboarding,
    daysSinceFirstReading,
    consecutiveVisitDays: undefined,
  };
};
