export type GeminiDashboardLanguage = 'en' | 'ko' | 'ja';

type GeminiModelPricing = {
  model: 'gemini-2.5-flash' | 'gemini-2.5-flash-lite' | 'gemini-2.5-pro';
  label: string;
  inputUsdPerMillion: number;
  outputUsdPerMillion: number;
};

type GeminiRequestFootprint = {
  id:
    | 'guided_chat_lite'
    | 'regular_chat_flash'
    | 'daily_guided_lite'
    | 'daily_archive_lite'
    | 'daily_guided_flash'
    | 'daily_archive_flash'
    | 'couple_flash'
    | 'dream_flash'
    | 'rare_pro_fallback';
  inputTokens: number;
  outputTokens: number;
  pricingModel: GeminiModelPricing['model'];
};

type LifecycleCostBucketId =
  | 'day1'
  | 'days2to7'
  | 'days8to14'
  | 'days15to28'
  | 'days29to60'
  | 'days61to180'
  | 'days181to365';

export type GeminiPricingCard = {
  model: string;
  inputRateUsdPerMillion: number;
  outputRateUsdPerMillion: number;
};

export type GeminiStageCostRow = {
  id: LifecycleCostBucketId;
  label: string;
  dayCount: number;
  runtimeDailyCost: number;
  legacyDailyCost: number;
  savingsPerDay: number;
};

export type GeminiScaleEstimateRow = {
  dau: number;
  runtimeMonthlyCost: number;
  legacyMonthlyCost: number;
  monthlySavings: number;
};

export type GeminiCostDashboardData = {
  pricingCards: GeminiPricingCard[];
  stageCostRows: GeminiStageCostRow[];
  monthlyScaleRows: GeminiScaleEstimateRow[];
  runtimeAnnualCostPerUser: number;
  legacyAnnualCostPerUser: number;
  annualSavingsPerUser: number;
  annualSavingsRate: number;
  runtimeAverageDailyCostPerUser: number;
  legacyAverageDailyCostPerUser: number;
  modeledMonthlyCostAt10kDau: number;
  pricingSourceLabel: string;
  note: string;
};

const GEMINI_PRICING: Record<GeminiModelPricing['model'], GeminiModelPricing> = {
  'gemini-2.5-flash': {
    model: 'gemini-2.5-flash',
    label: 'Gemini 2.5 Flash',
    inputUsdPerMillion: 0.3,
    outputUsdPerMillion: 2.5,
  },
  'gemini-2.5-flash-lite': {
    model: 'gemini-2.5-flash-lite',
    label: 'Gemini 2.5 Flash-Lite',
    inputUsdPerMillion: 0.1,
    outputUsdPerMillion: 0.4,
  },
  'gemini-2.5-pro': {
    model: 'gemini-2.5-pro',
    label: 'Gemini 2.5 Pro',
    inputUsdPerMillion: 1.25,
    outputUsdPerMillion: 10,
  },
};

const REQUEST_FOOTPRINTS: GeminiRequestFootprint[] = [
  { id: 'guided_chat_lite', inputTokens: 1398, outputTokens: 62, pricingModel: 'gemini-2.5-flash-lite' },
  { id: 'regular_chat_flash', inputTokens: 1551, outputTokens: 88, pricingModel: 'gemini-2.5-flash' },
  { id: 'daily_guided_lite', inputTokens: 1035, outputTokens: 95, pricingModel: 'gemini-2.5-flash-lite' },
  { id: 'daily_archive_lite', inputTokens: 1145, outputTokens: 94, pricingModel: 'gemini-2.5-flash-lite' },
  { id: 'daily_guided_flash', inputTokens: 1035, outputTokens: 95, pricingModel: 'gemini-2.5-flash' },
  { id: 'daily_archive_flash', inputTokens: 1145, outputTokens: 94, pricingModel: 'gemini-2.5-flash' },
  { id: 'couple_flash', inputTokens: 1155, outputTokens: 81, pricingModel: 'gemini-2.5-flash' },
  { id: 'dream_flash', inputTokens: 1190, outputTokens: 32, pricingModel: 'gemini-2.5-flash' },
  { id: 'rare_pro_fallback', inputTokens: 1559, outputTokens: 72, pricingModel: 'gemini-2.5-pro' },
];

const STAGE_DAY_COUNTS: Record<LifecycleCostBucketId, number> = {
  day1: 1,
  days2to7: 6,
  days8to14: 7,
  days15to28: 14,
  days29to60: 32,
  days61to180: 120,
  days181to365: 185,
};

const MONTHLY_SCALE_DAU = [1000, 10000, 100000];

const COST_BY_REQUEST = Object.fromEntries(
  REQUEST_FOOTPRINTS.map((request) => {
    const pricing = GEMINI_PRICING[request.pricingModel];
    const inputCost = (request.inputTokens / 1_000_000) * pricing.inputUsdPerMillion;
    const outputCost = (request.outputTokens / 1_000_000) * pricing.outputUsdPerMillion;
    return [request.id, inputCost + outputCost];
  }),
) as Record<GeminiRequestFootprint['id'], number>;

const RUNTIME_DAILY_COSTS: Record<LifecycleCostBucketId, number> = {
  day1: (COST_BY_REQUEST.guided_chat_lite * 2) + COST_BY_REQUEST.daily_guided_lite,
  days2to7: COST_BY_REQUEST.guided_chat_lite + COST_BY_REQUEST.daily_guided_lite,
  days8to14: COST_BY_REQUEST.regular_chat_flash + COST_BY_REQUEST.daily_guided_lite,
  days15to28: COST_BY_REQUEST.regular_chat_flash + COST_BY_REQUEST.daily_guided_lite + (COST_BY_REQUEST.couple_flash * 0.2),
  days29to60: (COST_BY_REQUEST.regular_chat_flash * 1.2) + COST_BY_REQUEST.daily_guided_lite + (COST_BY_REQUEST.couple_flash * 0.25) + (COST_BY_REQUEST.dream_flash * 0.1),
  days61to180: (COST_BY_REQUEST.regular_chat_flash * 1.5) + COST_BY_REQUEST.daily_archive_lite + (COST_BY_REQUEST.couple_flash * 0.35) + (COST_BY_REQUEST.dream_flash * 0.15),
  days181to365: (COST_BY_REQUEST.regular_chat_flash * 1.8) + COST_BY_REQUEST.daily_archive_lite + (COST_BY_REQUEST.couple_flash * 0.4) + (COST_BY_REQUEST.dream_flash * 0.2),
};

const LEGACY_DAILY_COSTS: Record<LifecycleCostBucketId, number> = {
  day1: (COST_BY_REQUEST.guided_chat_lite * 2) + COST_BY_REQUEST.daily_guided_flash,
  days2to7: COST_BY_REQUEST.guided_chat_lite + COST_BY_REQUEST.daily_guided_flash,
  days8to14: COST_BY_REQUEST.regular_chat_flash + COST_BY_REQUEST.daily_guided_flash,
  days15to28: COST_BY_REQUEST.regular_chat_flash + COST_BY_REQUEST.daily_guided_flash + (COST_BY_REQUEST.couple_flash * 0.2),
  days29to60: (COST_BY_REQUEST.regular_chat_flash * 1.2) + COST_BY_REQUEST.daily_guided_flash + (COST_BY_REQUEST.couple_flash * 0.25) + (COST_BY_REQUEST.dream_flash * 0.1),
  days61to180: (COST_BY_REQUEST.regular_chat_flash * 1.5) + COST_BY_REQUEST.daily_archive_flash + (COST_BY_REQUEST.couple_flash * 0.35) + (COST_BY_REQUEST.dream_flash * 0.15),
  days181to365: (COST_BY_REQUEST.regular_chat_flash * 1.8) + COST_BY_REQUEST.daily_archive_flash + (COST_BY_REQUEST.couple_flash * 0.4) + (COST_BY_REQUEST.dream_flash * 0.2),
};

const getStageLabel = (stage: LifecycleCostBucketId, language: GeminiDashboardLanguage) => {
  const labels: Record<GeminiDashboardLanguage, Record<LifecycleCostBucketId, string>> = {
    en: {
      day1: 'Day 1',
      days2to7: 'Days 2-7',
      days8to14: 'Days 8-14',
      days15to28: 'Days 15-28',
      days29to60: 'Days 29-60',
      days61to180: 'Days 61-180',
      days181to365: 'Days 181-365',
    },
    ko: {
      day1: '\u0031\uC77C\uCC28',
      days2to7: '\u0032-\u0037\uC77C\uCC28',
      days8to14: '\u0038-\u0031\u0034\uC77C\uCC28',
      days15to28: '\u0031\u0035-\u0032\u0038\uC77C\uCC28',
      days29to60: '\u0032\u0039-\u0036\u0030\uC77C\uCC28',
      days61to180: '\u0036\u0031-\u0031\u0038\u0030\uC77C\uCC28',
      days181to365: '\u0031\u0038\u0031-\u0033\u0036\u0035\uC77C\uCC28',
    },
    ja: {
      day1: '\u0031\u65E5\u76EE',
      days2to7: '\u0032-\u0037\u65E5\u76EE',
      days8to14: '\u0038-\u0031\u0034\u65E5\u76EE',
      days15to28: '\u0031\u0035-\u0032\u0038\u65E5\u76EE',
      days29to60: '\u0032\u0039-\u0036\u0030\u65E5\u76EE',
      days61to180: '\u0036\u0031-\u0031\u0038\u0030\u65E5\u76EE',
      days181to365: '\u0031\u0038\u0031-\u0033\u0036\u0035\u65E5\u76EE',
    },
  };

  return labels[language][stage];
};

const getPricingSourceLabel = (language: GeminiDashboardLanguage) => {
  if (language === 'ko') return '\uACF5\uC2DD \uAE30\uC900: Gemini API pricing';
  if (language === 'ja') return '\u516C\u5F0F\u57FA\u6E96: Gemini API pricing';
  return 'Official source: Gemini API pricing';
};

const getNote = (language: GeminiDashboardLanguage) => {
  if (language === 'ko') {
    return '\uB300\uD45C \uD504\uB86C\uD504\uD2B8 \uD1A0\uD070 \uC2E4\uCE21\uAC12\uACFC \uD604\uC7AC \uAE30\uBCF8 \uB7F0\uD0C0\uC784 \uAD6C\uC131\uC744 \uBC14\uD0D5\uC73C\uB85C \uACC4\uC0B0\uD55C \uCD94\uC815\uCE58\uC785\uB2C8\uB2E4. Current Runtime\uC740 daily insights\uAC00 Flash-Lite\uB97C \uC6B0\uC120 \uC0AC\uC6A9\uD558\uB294 \uCD5C\uC801\uD654 \uACBD\uB85C\uB97C \uBC18\uC601\uD569\uB2C8\uB2E4.';
  }
  if (language === 'ja') {
    return '\u4EE3\u8868\u7684\u306A\u30D7\u30ED\u30F3\u30D7\u30C8\u306E\u30C8\u30FC\u30AF\u30F3\u5B9F\u6E2C\u5024\u3068\u73FE\u5728\u306E\u30E9\u30F3\u30BF\u30A4\u30E0\u69CB\u6210\u3092\u57FA\u6E96\u306B\u3057\u305F\u63A8\u5B9A\u5024\u3067\u3059\u3002Current Runtime \u306B\u306F daily insights \u304C Flash-Lite \u3092\u512A\u5148\u3059\u308B\u6700\u9069\u5316\u30D1\u30B9\u304C\u53CD\u6620\u3055\u308C\u3066\u3044\u307E\u3059\u3002';
  }
  return 'Estimated from representative prompt token counts and the current default runtime mix. Current Runtime reflects the optimized daily-insights path that prioritizes Flash-Lite.';
};

const sumAnnualCost = (dailyCosts: Record<LifecycleCostBucketId, number>) =>
  Object.entries(dailyCosts).reduce((total, [stage, dailyCost]) => {
    const dayCount = STAGE_DAY_COUNTS[stage as LifecycleCostBucketId];
    return total + (dailyCost * dayCount);
  }, 0);

export const buildGeminiCostDashboardData = (
  language: GeminiDashboardLanguage,
): GeminiCostDashboardData => {
  const runtimeAnnualCostPerUser = sumAnnualCost(RUNTIME_DAILY_COSTS);
  const legacyAnnualCostPerUser = sumAnnualCost(LEGACY_DAILY_COSTS);
  const annualSavingsPerUser = legacyAnnualCostPerUser - runtimeAnnualCostPerUser;
  const annualSavingsRate = legacyAnnualCostPerUser > 0 ? annualSavingsPerUser / legacyAnnualCostPerUser : 0;
  const runtimeAverageDailyCostPerUser = runtimeAnnualCostPerUser / 365;
  const legacyAverageDailyCostPerUser = legacyAnnualCostPerUser / 365;

  return {
    pricingCards: Object.values(GEMINI_PRICING).map((pricing) => ({
      model: pricing.label,
      inputRateUsdPerMillion: pricing.inputUsdPerMillion,
      outputRateUsdPerMillion: pricing.outputUsdPerMillion,
    })),
    stageCostRows: (Object.keys(STAGE_DAY_COUNTS) as LifecycleCostBucketId[]).map((stage) => ({
      id: stage,
      label: getStageLabel(stage, language),
      dayCount: STAGE_DAY_COUNTS[stage],
      runtimeDailyCost: RUNTIME_DAILY_COSTS[stage],
      legacyDailyCost: LEGACY_DAILY_COSTS[stage],
      savingsPerDay: LEGACY_DAILY_COSTS[stage] - RUNTIME_DAILY_COSTS[stage],
    })),
    monthlyScaleRows: MONTHLY_SCALE_DAU.map((dau) => ({
      dau,
      runtimeMonthlyCost: runtimeAverageDailyCostPerUser * dau * 30,
      legacyMonthlyCost: legacyAverageDailyCostPerUser * dau * 30,
      monthlySavings: (legacyAverageDailyCostPerUser - runtimeAverageDailyCostPerUser) * dau * 30,
    })),
    runtimeAnnualCostPerUser,
    legacyAnnualCostPerUser,
    annualSavingsPerUser,
    annualSavingsRate,
    runtimeAverageDailyCostPerUser,
    legacyAverageDailyCostPerUser,
    modeledMonthlyCostAt10kDau: runtimeAverageDailyCostPerUser * 10_000 * 30,
    pricingSourceLabel: getPricingSourceLabel(language),
    note: getNote(language),
  };
};
