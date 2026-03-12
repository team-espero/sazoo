export const LIFECYCLE_STAGES = [
  'day1_activation',
  'day2_reopen',
  'day3_question_habit',
  'day4_tone_learning',
  'day5_discovery',
  'day6_pattern_preview',
  'day7_weekly_wrap',
  'pattern_building',
  'decision_support',
  'personal_os',
  'relationship_archive',
  'time_archive',
] as const;

export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];

export const LIFECYCLE_MODES = ['product_led', 'memory_led'] as const;
export type LifecycleMode = (typeof LIFECYCLE_MODES)[number];

export type LifecycleContext = {
  stage: LifecycleStage;
  mode: LifecycleMode;
  daysSinceOnboarding?: number;
  daysSinceFirstReading?: number;
  consecutiveVisitDays?: number;
};
