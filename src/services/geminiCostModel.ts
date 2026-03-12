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
      day1: '1일차',
      days2to7: '2-7일차',
      days8to14: '8-14일차',
      days15to28: '15-28일차',
      days29to60: '29-60일차',
      days61to180: '61-180일차',
      days181to365: '181-365일차',
    },
    ja: {
      day1: '1日目',
      days2to7: '2-7日目',
      days8to14: '8-14日目',
      days15to28: '15-28日目',
      days29to60: '29-60日目',
      days61to180: '61-180日目',
      days181to365: '181-365日目',
    },
  };

  return labels[language][stage];
};

const getPricingSourceLabel = (language: GeminiDashboardLanguage) => {
  if (language === 'ko') return '공식 기준: Gemini API pricing';
  if (language === 'ja') return '公式基準: Gemini API pricing';
  return 'Official source: Gemini API pricing';
};

const getNote = (language: GeminiDashboardLanguage) => {
  if (language === 'ko') {
    return '대표 토큰 실측값과 현재 기본 런타임 가정을 기준으로 계산한 추정치입니다. Current Runtime은 daily insights가 Flash-Lite를 우선 사용하는 최적화 적용 상태를 뜻합니다.';
  }
  if (language === 'ja') {
    return '代表的なトークン実測値と現在のデフォルト実行構成をもとにした推定値です。Current Runtime は daily insights が Flash-Lite を優先する最適化後の状態を示します。';
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
