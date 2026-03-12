import React from 'react';
import { BarChart3, RefreshCw, TimerReset } from 'lucide-react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import type { AppLanguage } from '../../context';
import type { LaunchAnalyticsReport } from '../../src/services/api';
import { Button } from '../../components';

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
  recentEvents: string;
  noRecentEvents: string;
  dailyInsightsSourceLabel: string;
  dailyInsightsSourceDesc: string;
  dailyInsightsSourceModel: string;
  dailyInsightsSourceFallback: string;
  dailyInsightsSourceUnavailable: string;
  metricShare: string;
  metricInviteOpen: string;
  metricInstallFromInvite: string;
  metricD1Retention: string;
  metricInviteRewardClaimed: string;
  metricInviteRewardGranted: string;
  metricInviteRewardDuplicate: string;
  metricInviteRewardSelfBlocked: string;
  metricInviteRewardFailed: string;
  metricFirstReadingSuccess: string;
  metricFirstReadingFailure: string;
  metricCoinSpent: string;
  metricAdRewardGranted: string;
  metricSceneChange: string;
  metricMiniAppOpen: string;
  metricOnboardingViews: string;
  metricOnboardingCompletes: string;
  coinSpendByContext: string;
  adRewardsByPlacement: string;
  miniAppsByApp: string;
  scenesById: string;
  emptyBreakdown: string;
  funnelTitle: string;
  funnelDescription: string;
  funnelShare: string;
  funnelInviteOpen: string;
  funnelInstall: string;
  funnelReward: string;
  rateShareToOpen: string;
  rateOpenToInstall: string;
  rateInstallToReward: string;
  qualityTitle: string;
  qualityDescription: string;
  qualityFirstReadingRate: string;
  qualityInviteFailureRate: string;
  qualityActiveDays: string;
  qualityAvgEventsPerDay: string;
  trendsTitle: string;
  trendsDescription: string;
  trendsNoData: string;
  topSignalsTitle: string;
  topSignalsDescription: string;
  topCoinSpendContext: string;
  topMiniApp: string;
  topScene: string;
  topOnboardingViewStep: string;
  topOnboardingCompleteStep: string;
  topHottestDay: string;
  noTopSignal: string;
};

const buildDashboardCopy = (language: AppLanguage): DashboardCopy => {
  if (language === 'ko') {
    return {
      badge: '운영 리포트',
      title: '데이터 대시보드',
      description: '퍼널, 첫 가치 도달 속도, 최근 7일 추이와 핵심 사용 신호를 한 번에 확인합니다.',
      loading: '데이터 대시보드를 불러오는 중이에요...',
      error: '데이터 대시보드를 지금 불러오지 못했어요.',
      retry: '다시 불러오기',
      totalEvents: '전체 이벤트',
      avgTimeToValue: '평균 첫 가치 도달',
      withinTarget: '30초 이내',
      recentEvents: '최근 이벤트',
      noRecentEvents: '아직 기록된 최근 이벤트가 없어요.',
      dailyInsightsSourceLabel: '오늘 인사이트 소스',
      dailyInsightsSourceDesc: '현재 홈 인사이트가 Gemini 모델 응답인지 빠른 fallback인지 보여줍니다.',
      dailyInsightsSourceModel: 'Gemini 모델',
      dailyInsightsSourceFallback: '빠른 Fallback',
      dailyInsightsSourceUnavailable: '없음',
      metricShare: '공유',
      metricInviteOpen: '초대 링크 열기',
      metricInstallFromInvite: '초대 설치 전환',
      metricD1Retention: 'D1 리텐션',
      metricInviteRewardClaimed: '초대 보상 클레임',
      metricInviteRewardGranted: '초대 보상 지급',
      metricInviteRewardDuplicate: '중복 보상 차단',
      metricInviteRewardSelfBlocked: '셀프 초대 차단',
      metricInviteRewardFailed: '초대 보상 실패',
      metricFirstReadingSuccess: '첫 사주 결과 성공',
      metricFirstReadingFailure: '첫 사주 결과 실패',
      metricCoinSpent: '코인 소모',
      metricAdRewardGranted: '광고 보상 지급',
      metricSceneChange: '씬 변경',
      metricMiniAppOpen: '미니앱 진입',
      metricOnboardingViews: '온보딩 조회',
      metricOnboardingCompletes: '온보딩 완료',
      coinSpendByContext: '코인 사용 위치',
      adRewardsByPlacement: '광고 보상 위치',
      miniAppsByApp: '미니앱 진입 분포',
      scenesById: '씬 변경 분포',
      emptyBreakdown: '아직 집계된 세부 항목이 없어요.',
      funnelTitle: '초대 퍼널',
      funnelDescription: '공유 이후 실제 열람과 설치 전환이 어디까지 이어지는지 확인합니다.',
      funnelShare: '공유',
      funnelInviteOpen: '초대 열기',
      funnelInstall: '초대 설치',
      funnelReward: '보상 지급',
      rateShareToOpen: '공유 → 열기',
      rateOpenToInstall: '열기 → 설치',
      rateInstallToReward: '설치 → 보상',
      qualityTitle: '품질 & 유지',
      qualityDescription: '첫 결과 품질과 재방문 기반 체력을 빠르게 점검합니다.',
      qualityFirstReadingRate: '첫 결과 성공률',
      qualityInviteFailureRate: '초대 보상 실패율',
      qualityActiveDays: '활성 일수',
      qualityAvgEventsPerDay: '활성일 평균 이벤트',
      trendsTitle: '최근 7일 추이',
      trendsDescription: '최근 7일 동안 이벤트가 어떻게 움직였는지 보여줍니다.',
      trendsNoData: '최근 7일 데이터가 아직 없어요.',
      topSignalsTitle: 'Top Signals',
      topSignalsDescription: '지금 가장 많이 반복되는 사용 패턴입니다.',
      topCoinSpendContext: '가장 많이 쓰인 코인 위치',
      topMiniApp: '가장 많이 열린 미니앱',
      topScene: '가장 많이 선택된 씬',
      topOnboardingViewStep: '가장 많이 본 온보딩 단계',
      topOnboardingCompleteStep: '가장 많이 완료한 온보딩 단계',
      topHottestDay: '이벤트가 가장 많았던 날',
      noTopSignal: '아직 데이터가 없어요.',
    };
  }

  if (language === 'ja') {
    return {
      badge: '運営レポート',
      title: 'データダッシュボード',
      description: 'ファネル、初回価値到達速度、直近7日の推移と主要シグナルをまとめて確認します。',
      loading: 'データダッシュボードを読み込んでいます...',
      error: 'データダッシュボードを読み込めませんでした。',
      retry: '再読み込み',
      totalEvents: '総イベント',
      avgTimeToValue: '平均初回価値到達',
      withinTarget: '30秒以内',
      recentEvents: '最近のイベント',
      noRecentEvents: 'まだ最近のイベントはありません。',
      dailyInsightsSourceLabel: '本日のインサイト元',
      dailyInsightsSourceDesc: '現在のホームインサイトがGemini応答か高速fallbackかを表示します。',
      dailyInsightsSourceModel: 'Gemini モデル',
      dailyInsightsSourceFallback: '高速 Fallback',
      dailyInsightsSourceUnavailable: '未取得',
      metricShare: '共有',
      metricInviteOpen: '招待リンク開封',
      metricInstallFromInvite: '招待経由インストール',
      metricD1Retention: 'D1 継続率',
      metricInviteRewardClaimed: '招待報酬クレーム',
      metricInviteRewardGranted: '招待報酬付与',
      metricInviteRewardDuplicate: '重複報酬ブロック',
      metricInviteRewardSelfBlocked: 'セルフ招待ブロック',
      metricInviteRewardFailed: '招待報酬失敗',
      metricFirstReadingSuccess: '初回鑑定成功',
      metricFirstReadingFailure: '初回鑑定失敗',
      metricCoinSpent: 'コイン消費',
      metricAdRewardGranted: '広告報酬付与',
      metricSceneChange: 'シーン変更',
      metricMiniAppOpen: 'ミニアプリ起動',
      metricOnboardingViews: 'オンボーディング閲覧',
      metricOnboardingCompletes: 'オンボーディング完了',
      coinSpendByContext: 'コイン消費箇所',
      adRewardsByPlacement: '広告報酬配置',
      miniAppsByApp: 'ミニアプリ分布',
      scenesById: 'シーン変更分布',
      emptyBreakdown: 'まだ詳細データはありません。',
      funnelTitle: '招待ファネル',
      funnelDescription: '共有から閲覧、インストール、報酬到達までの流れを確認します。',
      funnelShare: '共有',
      funnelInviteOpen: '招待開封',
      funnelInstall: '招待インストール',
      funnelReward: '報酬付与',
      rateShareToOpen: '共有 → 開封',
      rateOpenToInstall: '開封 → インストール',
      rateInstallToReward: 'インストール → 報酬',
      qualityTitle: '品質 & 継続',
      qualityDescription: '初回結果の品質と継続利用の基礎体力を確認します。',
      qualityFirstReadingRate: '初回結果成功率',
      qualityInviteFailureRate: '招待報酬失敗率',
      qualityActiveDays: 'アクティブ日数',
      qualityAvgEventsPerDay: 'アクティブ日平均イベント',
      trendsTitle: '直近7日の推移',
      trendsDescription: '直近7日間でイベント量がどう動いたかを表示します。',
      trendsNoData: '直近7日のデータはまだありません。',
      topSignalsTitle: 'Top Signals',
      topSignalsDescription: 'いま最も繰り返されている利用パターンです。',
      topCoinSpendContext: '最も使われたコイン文脈',
      topMiniApp: '最も開かれたミニアプリ',
      topScene: '最も選ばれたシーン',
      topOnboardingViewStep: '最も閲覧されたオンボーディング段階',
      topOnboardingCompleteStep: '最も完了されたオンボーディング段階',
      topHottestDay: 'イベントが最も多かった日',
      noTopSignal: 'まだデータがありません。',
    };
  }

  return {
    badge: 'Launch Report',
    title: 'Data Dashboard',
    description: 'Track funnel health, first-value speed, recent 7-day trends, and product usage signals in one place.',
    loading: 'Loading data dashboard...',
    error: 'Could not load the data dashboard right now.',
    retry: 'Retry',
    totalEvents: 'Total Events',
    avgTimeToValue: 'Avg. First Value',
    withinTarget: 'Within 30s',
    recentEvents: 'Recent Events',
    noRecentEvents: 'No recent events recorded yet.',
    dailyInsightsSourceLabel: 'Daily Insights Source',
    dailyInsightsSourceDesc: 'Shows whether the current home insight came from Gemini or the fast fallback path.',
    dailyInsightsSourceModel: 'Gemini Model',
    dailyInsightsSourceFallback: 'Fast Fallback',
    dailyInsightsSourceUnavailable: 'Unavailable',
    metricShare: 'Shares',
    metricInviteOpen: 'Invite Opens',
    metricInstallFromInvite: 'Installs from Invite',
    metricD1Retention: 'D1 Retention',
    metricInviteRewardClaimed: 'Invite Reward Claims',
    metricInviteRewardGranted: 'Invite Rewards Granted',
    metricInviteRewardDuplicate: 'Duplicate Claims Blocked',
    metricInviteRewardSelfBlocked: 'Self Invites Blocked',
    metricInviteRewardFailed: 'Invite Reward Failures',
    metricFirstReadingSuccess: 'First Reading Success',
    metricFirstReadingFailure: 'First Reading Failures',
    metricCoinSpent: 'Coins Spent',
    metricAdRewardGranted: 'Ad Rewards Granted',
    metricSceneChange: 'Scene Changes',
    metricMiniAppOpen: 'Mini App Opens',
    metricOnboardingViews: 'Onboarding Views',
    metricOnboardingCompletes: 'Onboarding Completions',
    coinSpendByContext: 'Coin Spend by Context',
    adRewardsByPlacement: 'Ad Rewards by Placement',
    miniAppsByApp: 'Mini Apps by App',
    scenesById: 'Scene Changes by Scene',
    emptyBreakdown: 'No breakdown data yet.',
    funnelTitle: 'Invite Funnel',
    funnelDescription: 'See how far users move from share to open, install, and reward.',
    funnelShare: 'Shares',
    funnelInviteOpen: 'Invite Opens',
    funnelInstall: 'Invite Installs',
    funnelReward: 'Rewards Granted',
    rateShareToOpen: 'Share → Open',
    rateOpenToInstall: 'Open → Install',
    rateInstallToReward: 'Install → Reward',
    qualityTitle: 'Quality & Retention',
    qualityDescription: 'Quickly gauge first-result quality and repeat-usage health.',
    qualityFirstReadingRate: 'First Reading Success',
    qualityInviteFailureRate: 'Invite Reward Failure',
    qualityActiveDays: 'Active Days',
    qualityAvgEventsPerDay: 'Avg Events / Active Day',
    trendsTitle: 'Last 7 Days',
    trendsDescription: 'Shows how event volume moved during the last 7 days.',
    trendsNoData: 'No 7-day trend data yet.',
    topSignalsTitle: 'Top Signals',
    topSignalsDescription: 'The strongest usage patterns happening right now.',
    topCoinSpendContext: 'Top Coin Spend Context',
    topMiniApp: 'Top Mini App',
    topScene: 'Top Scene',
    topOnboardingViewStep: 'Top Onboarding View Step',
    topOnboardingCompleteStep: 'Top Onboarding Complete Step',
    topHottestDay: 'Busiest Day',
    noTopSignal: 'No data yet.',
  };
};

const formatUnlockedAt = (value: string, language: AppLanguage) => {
  try {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'ko-KR', {
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

const formatDurationMs = (value: number, language: AppLanguage) => {
  const seconds = Math.max(0, Math.round(value / 100) / 10);
  if (language === 'ja') return `${seconds}秒`;
  if (language === 'en') return `${seconds}s`;
  return `${seconds}초`;
};

const formatPercent = (value: number, digits = 0) => `${(Math.max(0, value) * 100).toFixed(digits)}%`;

const formatDayLabel = (dateKey: string, language: AppLanguage) => {
  try {
    return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'ko-KR', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(`${dateKey}T00:00:00.000Z`));
  } catch {
    return dateKey;
  }
};

const summarizeEventPayload = (payload: Record<string, unknown>) => {
  const keys = Object.keys(payload || {});
  if (keys.length === 0) return '';
  const text = JSON.stringify(payload);
  return text.length > 96 ? `${text.slice(0, 93)}...` : text;
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
  journeyDebug?: {
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
  } | null;
  loading: boolean;
  error: string | null;
  onRetry: () => void;
  language: AppLanguage;
  isDark: boolean;
}) => {
  const copy = buildDashboardCopy(language);

  const metrics = report
    ? [
        { label: copy.metricShare, value: report.counts.share },
        { label: copy.metricInviteOpen, value: report.counts.invite_open },
        { label: copy.metricInstallFromInvite, value: report.counts.install_from_invite },
        { label: copy.metricD1Retention, value: report.counts.d1_retention },
        { label: copy.metricInviteRewardClaimed, value: report.counts.invite_reward_claimed },
        { label: copy.metricInviteRewardGranted, value: report.counts.invite_reward_granted },
        { label: copy.metricInviteRewardDuplicate, value: report.counts.invite_reward_duplicate },
        { label: copy.metricInviteRewardSelfBlocked, value: report.counts.invite_reward_self_blocked },
        { label: copy.metricInviteRewardFailed, value: report.counts.invite_reward_claim_failed },
        { label: copy.metricFirstReadingSuccess, value: report.counts.first_reading_success },
        { label: copy.metricFirstReadingFailure, value: report.counts.first_reading_failure },
        { label: copy.metricCoinSpent, value: report.counts.coin_spent },
        { label: copy.metricAdRewardGranted, value: report.counts.ad_reward_granted },
        { label: copy.metricSceneChange, value: report.counts.scene_change },
        { label: copy.metricMiniAppOpen, value: report.counts.mini_app_open },
        { label: copy.metricOnboardingViews, value: report.counts.onboarding_step_view },
        { label: copy.metricOnboardingCompletes, value: report.counts.onboarding_step_complete },
      ]
    : [];

  const breakdownSections = report
    ? [
        { title: copy.coinSpendByContext, values: report.productHealth.coinSpendByContext },
        { title: copy.adRewardsByPlacement, values: report.productHealth.adRewardsByPlacement },
        { title: copy.miniAppsByApp, values: report.productHealth.miniAppOpenByApp },
        { title: copy.scenesById, values: report.productHealth.sceneChangeByScene },
      ]
    : [];

  const funnelStages = report
    ? [
        { label: copy.funnelShare, value: report.funnel.shareCount },
        { label: copy.funnelInviteOpen, value: report.funnel.inviteOpenCount },
        { label: copy.funnelInstall, value: report.funnel.installCount },
        { label: copy.funnelReward, value: report.funnel.rewardGrantedCount },
      ]
    : [];

  const funnelRates = report
    ? [
        { label: copy.rateShareToOpen, value: formatPercent(report.funnel.shareToOpenRate) },
        { label: copy.rateOpenToInstall, value: formatPercent(report.funnel.openToInstallRate) },
        { label: copy.rateInstallToReward, value: formatPercent(report.funnel.installToRewardRate) },
      ]
    : [];

  const qualityCards = report
    ? [
        { label: copy.qualityFirstReadingRate, value: formatPercent(report.quality.firstReadingSuccessRate) },
        { label: copy.qualityInviteFailureRate, value: formatPercent(report.quality.inviteRewardFailureRate) },
        { label: copy.qualityActiveDays, value: String(report.quality.activeDays) },
        { label: copy.qualityAvgEventsPerDay, value: String(report.quality.averageEventsPerActiveDay) },
      ]
    : [];

  const trendMax = report ? Math.max(1, ...report.trends.eventsByDay.map((item) => item.count || 0)) : 1;
  const trendData =
    report?.trends.eventsByDay.map((item) => ({
      ...item,
      label: formatDayLabel(item.dateKey, language),
    })) ?? [];

  const topSignals = report
    ? [
        {
          label: copy.topCoinSpendContext,
          value: report.topSignals.topCoinSpendContext.key || copy.noTopSignal,
          count: report.topSignals.topCoinSpendContext.count,
        },
        {
          label: copy.topMiniApp,
          value: report.topSignals.topMiniApp.key || copy.noTopSignal,
          count: report.topSignals.topMiniApp.count,
        },
        {
          label: copy.topScene,
          value: report.topSignals.topScene.key || copy.noTopSignal,
          count: report.topSignals.topScene.count,
        },
        {
          label: copy.topOnboardingViewStep,
          value: report.topSignals.topOnboardingViewStep.key || copy.noTopSignal,
          count: report.topSignals.topOnboardingViewStep.count,
        },
        {
          label: copy.topOnboardingCompleteStep,
          value: report.topSignals.topOnboardingCompletionStep.key || copy.noTopSignal,
          count: report.topSignals.topOnboardingCompletionStep.count,
        },
        {
          label: copy.topHottestDay,
          value: report.topSignals.hottestDay.key ? formatDayLabel(report.topSignals.hottestDay.key, language) : copy.noTopSignal,
          count: report.topSignals.hottestDay.count,
        },
      ]
    : [];

  const dailyInsightsSourceValue =
    dailyInsightsSource === 'model'
      ? copy.dailyInsightsSourceModel
      : dailyInsightsSource === 'fallback'
        ? copy.dailyInsightsSourceFallback
        : copy.dailyInsightsSourceUnavailable;

  if (loading) {
    return (
      <div className={`rounded-[24px] border p-6 text-center ${isDark ? 'border-slate-700 bg-slate-800/50 text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
        <RefreshCw size={18} className="mx-auto mb-3 animate-spin text-emerald-500" />
        <p className="text-sm font-bold">{copy.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`rounded-[24px] border p-6 text-center ${isDark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-100 bg-red-50 text-red-500'}`}>
        <p className="mb-4 text-sm font-bold">{error || copy.error}</p>
        <Button onClick={onRetry} className="!rounded-2xl !bg-slate-900 !px-5 !py-3 !text-white">
          {copy.retry}
        </Button>
      </div>
    );
  }

  if (!report) {
    return null;
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.totalEvents}</p>
          <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.totalEvents}</p>
        </div>
        <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
          <div className="flex items-center gap-2">
            <TimerReset size={14} className="text-emerald-500" />
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.avgTimeToValue}</p>
          </div>
          <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDurationMs(report.timeToFirstValue.averageMs, language)}</p>
        </div>
        <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.withinTarget}</p>
          <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatPercent(report.timeToFirstValue.withinTargetRate)}</p>
        </div>
        <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-emerald-500" />
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.dailyInsightsSourceLabel}</p>
          </div>
          <p className={`mt-3 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{dailyInsightsSourceValue}</p>
          <p className={`mt-2 text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.dailyInsightsSourceDesc}</p>
        </div>
      </div>

      <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className="mb-4">
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.funnelTitle}</p>
          <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.funnelDescription}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className={`min-w-0 rounded-[24px] border p-3 ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-100 bg-white'}`}>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={funnelStages}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: isDark ? '#CBD5E1' : '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: isDark ? '#CBD5E1' : '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill={isDark ? '#34D399' : '#10B981'} radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {funnelRates.map((rate) => (
              <div key={rate.label} className={`rounded-[22px] border p-4 ${isDark ? 'border-emerald-900/40 bg-emerald-950/20' : 'border-emerald-100 bg-emerald-50/80'}`}>
                <p className={`text-xs font-bold ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>{rate.label}</p>
                <p className={`mt-2 text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{rate.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        <div className={`min-w-0 rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
          <div className="mb-4">
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.qualityTitle}</p>
            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.qualityDescription}</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {qualityCards.map((metric) => (
              <div key={metric.label} className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
                <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</p>
                <p className={`mt-2 text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metric.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
          <div className="mb-4">
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.trendsTitle}</p>
            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.trendsDescription}</p>
          </div>

          {trendData.every((item) => item.count === 0) ? (
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.trendsNoData}</p>
          ) : (
            <div className={`min-w-0 rounded-[24px] border p-3 ${isDark ? 'border-slate-700 bg-slate-950/50' : 'border-slate-100 bg-white'}`}>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#E2E8F0'} vertical={false} />
                    <XAxis dataKey="label" tick={{ fill: isDark ? '#CBD5E1' : '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: isDark ? '#CBD5E1' : '#64748B', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} domain={[0, trendMax]} />
                    <Tooltip />
                    <Area type="monotone" dataKey="count" stroke={isDark ? '#34D399' : '#10B981'} fill={isDark ? 'rgba(52, 211, 153, 0.22)' : 'rgba(16, 185, 129, 0.18)'} strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className="mb-4">
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.topSignalsTitle}</p>
          <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.topSignalsDescription}</p>
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-3">
          {topSignals.map((signal) => (
            <div key={signal.label} className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{signal.label}</p>
              <p className={`mt-2 text-sm font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{signal.value}</p>
              <p className={`mt-2 text-[11px] font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>{signal.count}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <div key={metric.label} className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
            <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</p>
            <p className={`mt-2 text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
        {breakdownSections.map((section) => {
          const entries = Object.entries(section.values || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

          return (
            <div key={section.title} className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.title}</p>
              {entries.length === 0 ? (
                <p className={`mt-3 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.emptyBreakdown}</p>
              ) : (
                <div className="mt-3 space-y-2">
                  {entries.map(([key, value]) => (
                    <div key={key} className="flex items-center justify-between gap-3">
                      <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{key}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {journeyDebug && (
        <div className={`rounded-[28px] border p-5 ${isDark ? 'border-amber-900/40 bg-amber-950/15' : 'border-amber-100 bg-amber-50/80'}`}>
          <div className="mb-4">
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-amber-300/70' : 'text-amber-700/70'}`}>Journey Memory Debug</p>
            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Current lifecycle and long-arc memory snapshot for the active profile.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Profile</p>
              <p className={`mt-2 text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{journeyDebug.profileName || journeyDebug.profileId}</p>
              <p className={`mt-1 text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{journeyDebug.profileId}</p>
            </div>
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Lifecycle</p>
              <p className={`mt-2 text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{journeyDebug.lifecycleStage}</p>
              <p className={`mt-1 text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {journeyDebug.lifecycleMode}
                {typeof journeyDebug.daysSinceFirstReading === 'number' ? ` · day ${journeyDebug.daysSinceFirstReading + 1}` : ''}
              </p>
            </div>
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Memory Quality</p>
              <p className={`mt-2 text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{journeyDebug.memoryQuality}</p>
              <p className={`mt-1 text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{formatUnlockedAt(journeyDebug.updatedAt, language)}</p>
            </div>
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Journey Summary Status</p>
              <p className={`mt-2 text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {journeyDebug.journeySummary ? 'Available' : 'Empty'}
              </p>
              <p className={`mt-1 text-[11px] font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {journeyDebug.journeySummary ? `${journeyDebug.journeySummary.length} chars` : 'Waiting for richer history'}
              </p>
            </div>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-3 xl:grid-cols-3">
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Recent Summary</p>
              <p className={`mt-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {journeyDebug.recentSummary || 'No recent summary yet.'}
              </p>
            </div>
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Conversation Digest</p>
              <p className={`mt-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {journeyDebug.conversationDigest || 'No long-thread digest yet.'}
              </p>
            </div>
            <div className={`rounded-[22px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-white/80 bg-white'}`}>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Journey Summary</p>
              <p className={`mt-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                {journeyDebug.journeySummary || 'Journey summary will appear once the user builds enough layered history.'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.recentEvents}</p>
            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatUnlockedAt(report.generatedAt, language)}</p>
          </div>
          <div className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm'}`}>
            {report.recentEvents.length}
          </div>
        </div>

        {report.recentEvents.length === 0 ? (
          <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.noRecentEvents}</p>
        ) : (
          <div className="space-y-3">
            {report.recentEvents.map((event, index) => (
              <div key={`${event.name}-${event.timestamp}-${index}`} className={`rounded-[20px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-100 bg-white'}`}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.name}</span>
                  <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatUnlockedAt(event.timestamp, language)}</span>
                </div>
                <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{summarizeEventPayload(event.payload)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export { buildDashboardCopy };
