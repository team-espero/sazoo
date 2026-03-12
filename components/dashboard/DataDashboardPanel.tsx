import React from 'react';
import { BarChart3, RefreshCw, TimerReset, TrendingUp } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AppLanguage } from '../../context';
import type { LaunchAnalyticsReport } from '../../src/services/api';
import { buildGeminiCostDashboardData } from '../../src/services/geminiCostModel';
import { Button } from '../../components';

type JourneyDebugSnapshot = {
  profileId: string;
  profileName: string;
  memoryQuality: string;
  journeySummary: string;
  recentSummary: string;
  conversationDigest: string;
  updatedAt: string;
  lifecycleStage: string;
  lifecycleMode: string;
  daysSinceFirstReading?: number;
};

type DashboardCopy = {
  badge: string;
  title: string;
  description: string;
  loading: string;
  error: string;
  retry: string;
  totalEvents: string;
  avgTimeToValue: string;
  withinTarget: string;
  dailyInsightsSource: string;
  currentRange: string;
  compareDelta: string;
  funnelTitle: string;
  trendTitle: string;
  qualityTitle: string;
  qualityDescription: string;
  recentEvents: string;
  noRecentEvents: string;
  journeyDebug: string;
  journeyDescription: string;
  productBreakdown: string;
  costTitle: string;
  comparisonTitle: string;
  generatedAt: string;
  previousRange: string;
  noData: string;
};

const buildDashboardCopy = (language: AppLanguage): DashboardCopy => {
  if (language === 'ko') {
    return {
      badge: '운영 리포트',
      title: '데이터 대시보드',
      description: '제품 퍼널, 첫 가치 도달 속도, 최근 추이, 운영 지표를 한 화면에서 확인합니다.',
      loading: '데이터 대시보드를 불러오는 중이에요...',
      error: '지금은 대시보드를 불러오지 못했어요.',
      retry: '다시 시도',
      totalEvents: '전체 이벤트',
      avgTimeToValue: '평균 첫 가치 도달',
      withinTarget: '30초 이내 비율',
      dailyInsightsSource: '오늘의 인사이트 소스',
      currentRange: '현재 조회 기간',
      compareDelta: '이전 기간 대비',
      funnelTitle: '초대 퍼널',
      trendTitle: '기간별 이벤트 추이',
      qualityTitle: '품질 지표',
      qualityDescription: '첫 결과 성공률, 리텐션, 코인 사용 흐름을 빠르게 봅니다.',
      recentEvents: '최근 이벤트',
      noRecentEvents: '최근 이벤트가 아직 없어요.',
      journeyDebug: 'Journey Debug',
      journeyDescription: '현재 저장된 라이프사이클/메모리 상태입니다.',
      productBreakdown: '제품 사용 분포',
      costTitle: 'Gemini 비용 추정',
      comparisonTitle: '이전 기간 비교',
      generatedAt: '생성 시각',
      previousRange: '이전 기간',
      noData: '표시할 데이터가 아직 없어요.',
    };
  }

  if (language === 'ja') {
    return {
      badge: 'Launch Report',
      title: 'Data Dashboard',
      description: 'Track funnel health, first-value speed, recent trends, and operating metrics in one place.',
      loading: 'Loading dashboard...',
      error: 'Could not load the dashboard right now.',
      retry: 'Retry',
      totalEvents: 'Total events',
      avgTimeToValue: 'Avg. time to value',
      withinTarget: 'Within 30s',
      dailyInsightsSource: 'Daily insight source',
      currentRange: 'Current range',
      compareDelta: 'Vs previous period',
      funnelTitle: 'Invite funnel',
      trendTitle: 'Events over time',
      qualityTitle: 'Quality metrics',
      qualityDescription: 'Quickly inspect first-result success, retention, and coin usage signals.',
      recentEvents: 'Recent events',
      noRecentEvents: 'No recent events yet.',
      journeyDebug: 'Journey Debug',
      journeyDescription: 'Current lifecycle and stored memory state.',
      productBreakdown: 'Product breakdown',
      costTitle: 'Gemini cost estimate',
      comparisonTitle: 'Previous-period comparison',
      generatedAt: 'Generated at',
      previousRange: 'Previous range',
      noData: 'No data yet.',
    };
  }

  return {
    badge: 'Launch Report',
    title: 'Data Dashboard',
    description: 'Track funnel health, first-value speed, recent trends, and operating metrics in one place.',
    loading: 'Loading dashboard...',
    error: 'Could not load the dashboard right now.',
    retry: 'Retry',
    totalEvents: 'Total events',
    avgTimeToValue: 'Avg. time to value',
    withinTarget: 'Within 30s',
    dailyInsightsSource: 'Daily insight source',
    currentRange: 'Current range',
    compareDelta: 'Vs previous period',
    funnelTitle: 'Invite funnel',
    trendTitle: 'Events over time',
    qualityTitle: 'Quality metrics',
    qualityDescription: 'Quickly inspect first-result success, retention, and coin usage signals.',
    recentEvents: 'Recent events',
    noRecentEvents: 'No recent events yet.',
    journeyDebug: 'Journey Debug',
    journeyDescription: 'Current lifecycle and stored memory state.',
    productBreakdown: 'Product breakdown',
    costTitle: 'Gemini cost estimate',
    comparisonTitle: 'Previous-period comparison',
    generatedAt: 'Generated at',
    previousRange: 'Previous range',
    noData: 'No data yet.',
  };
};

const formatNumber = (value: number) => new Intl.NumberFormat('en-US').format(value);

const formatDurationMs = (value: number, language: AppLanguage) => {
  const seconds = Math.max(0, Math.round(value / 100) / 10);
  if (language === 'ko') return `${seconds}초`;
  return `${seconds}s`;
};

const formatPercent = (value: number, digits = 0) => `${(Math.max(0, value) * 100).toFixed(digits)}%`;

const formatDateTime = (value: string, language: AppLanguage) => {
  if (!value) return '-';
  try {
    const locale = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US';
    return new Intl.DateTimeFormat(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

const formatDateLabel = (dateKey: string, language: AppLanguage) => {
  try {
    const locale = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : 'en-US';
    return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(`${dateKey}T00:00:00.000Z`));
  } catch {
    return dateKey;
  }
};

const formatUsd = (value: number, digits = 4) => new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: Math.min(2, digits),
  maximumFractionDigits: digits,
}).format(value);

const summarizePayload = (payload: Record<string, unknown>) => {
  const text = JSON.stringify(payload);
  return text.length > 120 ? `${text.slice(0, 117)}...` : text;
};

const deltaTone = (value: number) => {
  if (value > 0) return 'text-emerald-500';
  if (value < 0) return 'text-rose-500';
  return 'text-slate-400';
};

const renderKeyValueRows = (record: Record<string, number>, emptyLabel: string, isDark: boolean) => {
  const entries = Object.entries(record).sort((left, right) => right[1] - left[1]);
  if (entries.length === 0) {
    return <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{emptyLabel}</p>;
  }

  return (
    <div className="space-y-2">
      {entries.slice(0, 6).map(([key, value]) => (
        <div key={key} className={`flex items-center justify-between rounded-2xl px-3 py-2 ${isDark ? 'bg-slate-900/70' : 'bg-slate-50'}`}>
          <span className={`truncate text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{key}</span>
          <span className={`ml-3 text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatNumber(value)}</span>
        </div>
      ))}
    </div>
  );
};

export const DataDashboardPanel = ({
  report,
  dailyInsightsSource,
  journeyDebug,
  loading,
  error,
  onRetry,
  language,
  isDark,
}: {
  report: LaunchAnalyticsReport | null;
  dailyInsightsSource?: 'model' | 'fallback';
  journeyDebug?: JourneyDebugSnapshot | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  language: AppLanguage;
  isDark: boolean;
}) => {
  const copy = buildDashboardCopy(language);
  const geminiCost = buildGeminiCostDashboardData(language);

  if (loading) {
    return (
      <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 text-center">
        <TimerReset className={`h-8 w-8 animate-spin ${isDark ? 'text-emerald-300' : 'text-emerald-500'}`} />
        <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{copy.loading}</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className={`rounded-[28px] border p-6 text-center ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50'}`}>
        <p className={`text-sm font-semibold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{error || copy.error}</p>
        <div className="mt-4 flex justify-center">
          <Button onClick={onRetry} variant="secondary" icon={<RefreshCw size={16} />}>
            {copy.retry}
          </Button>
        </div>
      </div>
    );
  }

  const summaryCards = [
    { label: copy.totalEvents, value: formatNumber(report.totalEvents) },
    { label: copy.avgTimeToValue, value: formatDurationMs(report.timeToFirstValue.averageMs, language) },
    { label: copy.withinTarget, value: formatPercent(report.timeToFirstValue.withinTargetRate) },
    { label: copy.dailyInsightsSource, value: dailyInsightsSource === 'fallback' ? 'fallback' : dailyInsightsSource === 'model' ? 'model' : 'n/a' },
    { label: copy.currentRange, value: report.range?.label || '-' },
  ];

  const comparisonCards = report.comparison.enabled && report.comparison.deltas
    ? [
        { label: copy.totalEvents, value: report.comparison.deltas.totalEvents, suffix: '' },
        { label: copy.avgTimeToValue, value: report.comparison.deltas.averageMs, suffix: 'ms' },
        { label: copy.withinTarget, value: report.comparison.deltas.withinTargetRate * 100, suffix: 'pp' },
        { label: 'Coins spent', value: report.comparison.deltas.coinSpent, suffix: '' },
      ]
    : [];

  const funnelData = [
    { step: 'Share', count: report.funnel.shareCount },
    { step: 'Open', count: report.funnel.inviteOpenCount },
    { step: 'Install', count: report.funnel.installCount },
    { step: 'Reward', count: report.funnel.rewardGrantedCount },
  ];

  const trendData = report.comparison.enabled && report.comparison.trends.length > 0
    ? report.comparison.trends.map((item, index) => ({
        label: formatDateLabel(item.currentDateKey || item.previousDateKey || String(index + 1), language),
        current: item.currentCount,
        previous: item.previousCount,
      }))
    : report.trends.eventsByDay.map((item) => ({
        label: formatDateLabel(item.dateKey, language),
        current: item.count,
        previous: 0,
      }));

  const breakdownSections = [
    { title: 'Coin spend contexts', values: report.productHealth.coinSpendByContext },
    { title: 'Ad reward placements', values: report.productHealth.adRewardsByPlacement },
    { title: 'Mini apps opened', values: report.productHealth.miniAppOpenByApp },
    { title: 'Scenes changed', values: report.productHealth.sceneChangeByScene },
  ];

  const journeyRows = journeyDebug ? [
    ['Profile', journeyDebug.profileName],
    ['Stage', journeyDebug.lifecycleStage],
    ['Mode', journeyDebug.lifecycleMode],
    ['Memory quality', journeyDebug.memoryQuality],
    ['Days since first reading', String(journeyDebug.daysSinceFirstReading ?? '-')],
    ['Updated at', formatDateTime(journeyDebug.updatedAt, language)],
  ] : [];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-5">
        {summaryCards.map((card) => (
          <div key={card.label} className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-200 bg-slate-50/80'}`}>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{card.label}</p>
            <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.generatedAt}</p>
            <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatDateTime(report.generatedAt, language)}</p>
          </div>
          {report.comparison.enabled && report.comparison.previousRange ? (
            <div>
              <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.previousRange}</p>
              <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{report.comparison.previousRange.label}</p>
            </div>
          ) : null}
        </div>
      </div>

      {comparisonCards.length > 0 ? (
        <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${isDark ? 'text-emerald-300' : 'text-emerald-500'}`} />
            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.comparisonTitle}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-4">
            {comparisonCards.map((item) => (
              <div key={item.label} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{item.label}</p>
                <p className={`mt-2 text-2xl font-black ${deltaTone(item.value)}`}>{item.value > 0 ? '+' : ''}{item.value}{item.suffix}</p>
                <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.compareDelta}</p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex items-center gap-2">
            <BarChart3 className={`h-4 w-4 ${isDark ? 'text-emerald-300' : 'text-emerald-500'}`} />
            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.funnelTitle}</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="step" stroke={isDark ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#10b981" radius={[12, 12, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Share → Open</p>
              <p className="mt-1 text-xl font-black">{formatPercent(report.funnel.shareToOpenRate)}</p>
            </div>
            <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Open → Install</p>
              <p className="mt-1 text-xl font-black">{formatPercent(report.funnel.openToInstallRate)}</p>
            </div>
            <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Install → Reward</p>
              <p className="mt-1 text-xl font-black">{formatPercent(report.funnel.installToRewardRate)}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className={`h-4 w-4 ${isDark ? 'text-emerald-300' : 'text-emerald-500'}`} />
            <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.trendTitle}</h2>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} allowDecimals={false} />
                <Tooltip />
                <Area type="monotone" dataKey="current" stroke="#10b981" fill="#10b981" fillOpacity={0.2} strokeWidth={3} />
                {report.comparison.enabled ? (
                  <Area type="monotone" dataKey="previous" stroke="#64748b" fill="#64748b" fillOpacity={0.12} strokeWidth={2} />
                ) : null}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.qualityTitle}</h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.qualityDescription}</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">First reading success</p>
              <p className="mt-2 text-2xl font-black">{formatPercent(report.quality.firstReadingSuccessRate)}</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Invite reward failure</p>
              <p className="mt-2 text-2xl font-black">{formatPercent(report.quality.inviteRewardFailureRate)}</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Active days</p>
              <p className="mt-2 text-2xl font-black">{formatNumber(report.quality.activeDays)}</p>
            </div>
            <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
              <p className="text-xs font-bold uppercase tracking-[0.14em]">Avg events / active day</p>
              <p className="mt-2 text-2xl font-black">{report.quality.averageEventsPerActiveDay}</p>
            </div>
          </div>
        </section>

        <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.productBreakdown}</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {breakdownSections.map((section) => (
              <div key={section.title} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`mb-3 text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.title}</p>
                {renderKeyValueRows(section.values, copy.noData, isDark)}
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
        <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.costTitle}</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-4">
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Runtime annual / user</p>
            <p className="mt-2 text-2xl font-black">{formatUsd(geminiCost.runtimeAnnualCostPerUser)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Legacy annual / user</p>
            <p className="mt-2 text-2xl font-black">{formatUsd(geminiCost.legacyAnnualCostPerUser)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Annual savings / user</p>
            <p className="mt-2 text-2xl font-black text-emerald-500">{formatUsd(geminiCost.annualSavingsPerUser)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${isDark ? 'bg-slate-950/70' : 'bg-slate-50'}`}>
            <p className="text-xs font-bold uppercase tracking-[0.14em]">Monthly @ 10k DAU</p>
            <p className="mt-2 text-2xl font-black">{formatUsd(geminiCost.modeledMonthlyCostAt10kDau, 2)}</p>
          </div>
        </div>
        <div className="mt-5 grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={geminiCost.stageCostRows.map((row) => ({ label: row.label, runtime: Number(row.runtimeDailyCost.toFixed(4)), legacy: Number(row.legacyDailyCost.toFixed(4)) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="label" stroke={isDark ? '#94a3b8' : '#64748b'} />
                <YAxis stroke={isDark ? '#94a3b8' : '#64748b'} />
                <Tooltip />
                <Bar dataKey="runtime" fill="#10b981" radius={[10, 10, 0, 0]} />
                <Bar dataKey="legacy" fill="#94a3b8" radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3">
            {geminiCost.monthlyScaleRows.map((row) => (
              <div key={row.dau} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.14em]">{formatNumber(row.dau)} DAU</p>
                    <p className={`mt-1 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatUsd(row.runtimeMonthlyCost, 2)}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Legacy {formatUsd(row.legacyMonthlyCost, 2)}</p>
                    <p className="mt-1 text-sm font-black text-emerald-500">Save {formatUsd(row.monthlySavings, 2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.recentEvents}</h2>
          <div className="mt-4 space-y-3">
            {report.recentEvents.length === 0 ? (
              <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.noRecentEvents}</p>
            ) : report.recentEvents.map((event, index) => (
              <div key={`${event.name}-${index}`} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.name}</p>
                    <p className={`mt-1 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>{formatDateTime(event.timestamp, language)}</p>
                  </div>
                  <p className={`max-w-[60%] text-right text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{summarizePayload(event.payload)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-200 bg-white'}`}>
          <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.journeyDebug}</h2>
          <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.journeyDescription}</p>
          {!journeyDebug ? (
            <p className={`mt-4 text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.noData}</p>
          ) : (
            <div className="mt-4 space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                {journeyRows.map(([label, value]) => (
                  <div key={label} className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                    <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{label}</p>
                    <p className={`mt-2 text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{value}</p>
                  </div>
                ))}
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Journey summary</p>
                <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{journeyDebug.journeySummary || copy.noData}</p>
              </div>
              <div className={`rounded-2xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-black uppercase tracking-[0.14em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Conversation digest</p>
                <p className={`mt-2 whitespace-pre-wrap text-sm leading-6 ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{journeyDebug.conversationDigest || journeyDebug.recentSummary || copy.noData}</p>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export { buildDashboardCopy };
