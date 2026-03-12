import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LayoutDashboard, LockKeyhole, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataDashboardPanel, buildDashboardCopy } from '../components/dashboard/DataDashboardPanel';
import { useSajuData, useSajuSettings, type AppLanguage } from '../context';
import { useAuth } from '../src/auth/AuthProvider';
import { api, type DashboardAccessStatus, type LaunchAnalyticsReport } from '../src/services/api';
import { getProgressiveProfileMemory, hydrateProgressiveProfileMemory } from '../src/services/profileMemory';
import { resolveStoredLifecycleContext } from '../src/services/lifecycleStage';

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

type RangePreset = '7d' | '14d' | '30d' | '90d' | 'custom';

type ReportWindow = {
  from: string;
  to: string;
  label: string;
};

const DASHBOARD_ACCESS_STORAGE_KEY = 'sazoo-dashboard-access-key';

const buildGateCopy = (language: AppLanguage) => {
  if (language === 'ko') {
    return {
      title: '운영자 대시보드',
      description: '이 페이지는 운영자 전용입니다. 로그인한 계정과 운영자 패스코드를 함께 확인한 뒤 데이터를 엽니다.',
      passcodeLabel: '운영자 패스코드',
      passcodePlaceholder: 'Vercel에 저장한 대시보드 패스코드',
      unlock: '대시보드 열기',
      verifying: '확인 중...',
      signedInAs: '현재 로그인',
      needsSignIn: '허용 이메일 제한을 쓰는 경우, Google 로그인 상태에서 여는 것이 안전합니다.',
    };
  }

  if (language === 'ja') {
    return {
      title: 'Operator Dashboard',
      description: 'This page is restricted. We verify the signed-in operator and the dashboard passcode before loading analytics.',
      passcodeLabel: 'Operator passcode',
      passcodePlaceholder: 'Dashboard passcode stored in Vercel',
      unlock: 'Unlock dashboard',
      verifying: 'Verifying...',
      signedInAs: 'Signed in as',
      needsSignIn: 'If email allowlists are enabled, open this page after signing in with Google.',
    };
  }

  return {
    title: 'Operator Dashboard',
    description: 'This page is restricted. We verify the signed-in operator and the dashboard passcode before loading analytics.',
    passcodeLabel: 'Operator passcode',
    passcodePlaceholder: 'Dashboard passcode stored in Vercel',
    unlock: 'Unlock dashboard',
    verifying: 'Verifying...',
    signedInAs: 'Signed in as',
    needsSignIn: 'If email allowlists are enabled, open this page after signing in with Google.',
  };
};

const mapAccessReason = (reason: string, language: AppLanguage) => {
  if (language === 'ko') {
    switch (reason) {
      case 'invalid_access_key':
        return '운영자 패스코드가 올바르지 않습니다.';
      case 'operator_email_required':
        return '허용된 이메일 계정으로 로그인한 뒤 다시 시도해 주세요.';
      case 'operator_email_not_allowed':
        return '이 계정은 대시보드 접근 허용 목록에 없습니다.';
      case 'dashboard_not_configured':
        return '대시보드 접근 키가 아직 Vercel에 설정되지 않았습니다.';
      default:
        return '대시보드 접근 권한을 확인하지 못했습니다.';
    }
  }

  if (language === 'ja') {
    switch (reason) {
      case 'invalid_access_key':
        return 'Dashboard passcode is invalid.';
      case 'operator_email_required':
        return 'Sign in with an allowed operator email first.';
      case 'operator_email_not_allowed':
        return 'This account is not allowed to open the dashboard.';
      case 'dashboard_not_configured':
        return 'Dashboard access has not been configured in Vercel yet.';
      default:
        return 'Could not verify dashboard access.';
    }
  }

  switch (reason) {
    case 'invalid_access_key':
      return 'Dashboard passcode is invalid.';
    case 'operator_email_required':
      return 'Sign in with an allowed operator email first.';
    case 'operator_email_not_allowed':
      return 'This account is not allowed to open the dashboard.';
    case 'dashboard_not_configured':
      return 'Dashboard access has not been configured in Vercel yet.';
    default:
      return 'Could not verify dashboard access.';
  }
};

const formatDateInputValue = (value: Date) => value.toISOString().slice(0, 10);

const toIsoWindow = (from: Date, to: Date): ReportWindow => ({
  from: new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 0, 0, 0, 0)).toISOString(),
  to: new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate(), 23, 59, 59, 999)).toISOString(),
  label: `${formatDateInputValue(from)} to ${formatDateInputValue(to)}`,
});

const resolvePresetWindow = (preset: Exclude<RangePreset, 'custom'>): ReportWindow => {
  const days = preset === '7d' ? 7 : preset === '14d' ? 14 : preset === '30d' ? 30 : 90;
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - (days - 1));
  return toIsoWindow(start, end);
};

const resolveCustomWindow = (fromDate: string, toDate: string): ReportWindow => {
  const end = toDate ? new Date(`${toDate}T00:00:00.000Z`) : new Date();
  const start = fromDate ? new Date(`${fromDate}T00:00:00.000Z`) : end;
  return start.getTime() <= end.getTime()
    ? toIsoWindow(start, end)
    : toIsoWindow(end, start);
};

const DashboardScreen = () => {
  const { themeMode, language = 'ko' } = useSajuSettings();
  const { sajuState, activeProfileId } = useSajuData();
  const { session } = useAuth();
  const [report, setReport] = useState<LaunchAnalyticsReport | null>(null);
  const [journeyDebug, setJourneyDebug] = useState<JourneyDebugSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangePreset, setRangePreset] = useState<RangePreset>('7d');
  const [comparePrevious, setComparePrevious] = useState(true);
  const [customFrom, setCustomFrom] = useState(() => formatDateInputValue(new Date(Date.now() - (6 * 24 * 60 * 60 * 1000))));
  const [customTo, setCustomTo] = useState(() => formatDateInputValue(new Date()));
  const [accessKeyInput, setAccessKeyInput] = useState('');
  const [verifiedAccessKey, setVerifiedAccessKey] = useState('');
  const [accessStatus, setAccessStatus] = useState<DashboardAccessStatus | null>(null);
  const [accessLoading, setAccessLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);

  const isDark = themeMode === 'dark';
  const dashboardCopy = buildDashboardCopy(language as AppLanguage);
  const gateCopy = buildGateCopy(language as AppLanguage);
  const operatorEmail = session?.email?.trim().toLowerCase() || null;

  const reportWindow = useMemo(() => (
    rangePreset === 'custom'
      ? resolveCustomWindow(customFrom, customTo)
      : resolvePresetWindow(rangePreset)
  ), [customFrom, customTo, rangePreset]);

  const verifyAccess = useCallback(async (candidateKey: string) => {
    const trimmedKey = candidateKey.trim();
    if (!trimmedKey) {
      setAccessError(language === 'ko' ? '운영자 패스코드를 입력해 주세요.' : 'Enter the dashboard passcode.');
      return false;
    }

    setAccessLoading(true);
    setAccessError(null);
    try {
      const nextStatus = await api.analytics.verifyDashboardAccess(trimmedKey, operatorEmail);
      setAccessStatus(nextStatus);
      if (!nextStatus.allowed) {
        setAccessError(mapAccessReason(nextStatus.reason, language as AppLanguage));
        return false;
      }
      setVerifiedAccessKey(trimmedKey);
      setAccessKeyInput(trimmedKey);
      if (typeof window !== 'undefined') {
        window.sessionStorage.setItem(DASHBOARD_ACCESS_STORAGE_KEY, trimmedKey);
      }
      return true;
    } catch (nextError) {
      setAccessError(nextError instanceof Error ? nextError.message : dashboardCopy.error);
      return false;
    } finally {
      setAccessLoading(false);
    }
  }, [dashboardCopy.error, language, operatorEmail]);

  const loadReport = useCallback(async () => {
    if (!verifiedAccessKey) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [nextReport] = await Promise.all([
        api.analytics.getLaunchReport({
          from: reportWindow.from,
          to: reportWindow.to,
          comparePrevious,
          accessKey: verifiedAccessKey,
          operatorEmail,
        }),
        hydrateProgressiveProfileMemory(activeProfileId).catch(() => null),
      ]);
      setReport(nextReport);

      const nextMemory = getProgressiveProfileMemory(activeProfileId);
      const lifecycle = resolveStoredLifecycleContext();
      setJourneyDebug(nextMemory ? {
        profileId: activeProfileId,
        profileName: sajuState.profile?.name || 'me',
        memoryQuality: nextMemory.memoryQuality || 'seed',
        journeySummary: nextMemory.journeySummary || '',
        recentSummary: nextMemory.recentSummary || '',
        conversationDigest: nextMemory.conversationDigest || '',
        updatedAt: nextMemory.updatedAt || '',
        lifecycleStage: lifecycle.stage,
        lifecycleMode: lifecycle.mode,
        daysSinceFirstReading: lifecycle.daysSinceFirstReading,
      } : null);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : dashboardCopy.error);
    } finally {
      setLoading(false);
    }
  }, [activeProfileId, comparePrevious, dashboardCopy.error, operatorEmail, reportWindow.from, reportWindow.to, sajuState.profile?.name, verifiedAccessKey]);

  useEffect(() => {
    let mounted = true;

    const initializeAccess = async () => {
      if (typeof window === 'undefined') {
        setAccessLoading(false);
        return;
      }

      const storedKey = window.sessionStorage.getItem(DASHBOARD_ACCESS_STORAGE_KEY) || '';
      if (!storedKey) {
        if (mounted) {
          setAccessLoading(false);
        }
        return;
      }

      const allowed = await verifyAccess(storedKey);
      if (!allowed && mounted) {
        window.sessionStorage.removeItem(DASHBOARD_ACCESS_STORAGE_KEY);
      }
    };

    void initializeAccess();

    return () => {
      mounted = false;
    };
  }, [verifyAccess]);

  useEffect(() => {
    if (!verifiedAccessKey) {
      return;
    }
    void loadReport();
  }, [loadReport, verifiedAccessKey]);

  const handleBack = () => {
    window.location.assign('/');
  };

  const handleUnlock = async (event: React.FormEvent) => {
    event.preventDefault();
    const allowed = await verifyAccess(accessKeyInput);
    if (allowed) {
      void loadReport();
    }
  };

  const presetButtonClass = (preset: RangePreset) => (
    rangePreset === preset
      ? (isDark ? 'border-emerald-400 bg-emerald-500/15 text-emerald-200' : 'border-emerald-400 bg-emerald-50 text-emerald-700')
      : (isDark ? 'border-slate-700 bg-slate-900 text-slate-300' : 'border-slate-200 bg-white text-slate-600')
  );

  return (
    <div className={`h-full overflow-y-auto px-6 pb-16 pt-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className={`inline-flex h-11 w-11 items-center justify-center rounded-full border transition-colors ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
              aria-label="Back to app"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <p className="mb-1 text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-500">{dashboardCopy.badge}</p>
              <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{dashboardCopy.title}</h1>
              <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{dashboardCopy.description}</p>
            </div>
          </div>

          <div className={`hidden rounded-[24px] border px-4 py-3 md:flex md:items-center md:gap-3 ${isDark ? 'border-slate-700 bg-slate-900/70' : 'border-slate-100 bg-white/90 shadow-sm'}`}>
            <div className={`rounded-2xl p-3 ${isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-500'}`}>
              <LayoutDashboard size={18} />
            </div>
            <div>
              <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>/dashboard</p>
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{reportWindow.label}</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`min-w-0 rounded-[36px] border p-5 md:p-6 ${isDark ? 'border-slate-700 bg-slate-950/70' : 'border-white/70 bg-white/90 shadow-xl'}`}
        >
          {verifiedAccessKey ? null : (
            <form onSubmit={handleUnlock} className={`mb-6 rounded-[28px] border p-5 ${isDark ? 'border-amber-500/30 bg-slate-950/80' : 'border-amber-200 bg-amber-50/80'}`}>
              <div className="flex items-start gap-4">
                <div className={`rounded-2xl p-3 ${isDark ? 'bg-amber-500/15 text-amber-300' : 'bg-white text-amber-500 shadow-sm'}`}>
                  <LockKeyhole size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{gateCopy.title}</h2>
                  <p className={`mt-1 text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{gateCopy.description}</p>
                  <p className={`mt-3 text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    {gateCopy.signedInAs}: {operatorEmail || 'not signed in'}
                  </p>
                  {!operatorEmail ? (
                    <p className={`mt-2 text-xs ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>{gateCopy.needsSignIn}</p>
                  ) : null}
                  <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
                    <div className="flex-1">
                      <label className={`mb-2 block text-xs font-black uppercase tracking-[0.18em] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{gateCopy.passcodeLabel}</label>
                      <input
                        type="password"
                        value={accessKeyInput}
                        onChange={(event) => setAccessKeyInput(event.target.value)}
                        placeholder={gateCopy.passcodePlaceholder}
                        className={`w-full rounded-2xl border px-4 py-3 text-sm font-semibold outline-none transition ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100 placeholder:text-slate-500 focus:border-emerald-400' : 'border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:border-emerald-400'}`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={accessLoading}
                      className={`inline-flex h-12 items-center justify-center rounded-2xl px-5 text-sm font-black transition ${isDark ? 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:bg-slate-700 disabled:text-slate-400' : 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-300'}`}
                    >
                      {accessLoading ? gateCopy.verifying : gateCopy.unlock}
                    </button>
                  </div>
                  {accessError ? (
                    <p className={`mt-3 text-sm font-semibold ${isDark ? 'text-rose-300' : 'text-rose-600'}`}>{accessError}</p>
                  ) : null}
                  {accessStatus && !accessStatus.allowed ? (
                    <p className={`mt-2 text-xs ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Reason: {accessStatus.reason}</p>
                  ) : null}
                </div>
              </div>
            </form>
          )}

          {verifiedAccessKey ? (
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-emerald-200/30 bg-emerald-500/5 p-4 md:flex-row md:items-end md:justify-between">
              <div className="flex-1">
                <p className={`text-[11px] font-black uppercase tracking-[0.18em] ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Dashboard Window</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(['7d', '14d', '30d', '90d', 'custom'] as RangePreset[]).map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setRangePreset(preset)}
                      className={`rounded-full border px-3 py-2 text-xs font-black uppercase tracking-[0.14em] transition ${presetButtonClass(preset)}`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
                {rangePreset === 'custom' ? (
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.14em]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>From</span>
                      <input
                        type="date"
                        value={customFrom}
                        onChange={(event) => setCustomFrom(event.target.value)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}
                      />
                    </label>
                    <label className="flex flex-col gap-2 text-xs font-black uppercase tracking-[0.14em]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>To</span>
                      <input
                        type="date"
                        value={customTo}
                        onChange={(event) => setCustomTo(event.target.value)}
                        className={`rounded-2xl border px-4 py-3 text-sm font-semibold ${isDark ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}
                      />
                    </label>
                  </div>
                ) : null}
              </div>

              <div className="flex flex-col gap-3 md:items-end">
                <label className={`inline-flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-bold ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}>
                  <input
                    type="checkbox"
                    checked={comparePrevious}
                    onChange={(event) => setComparePrevious(event.target.checked)}
                    className="h-4 w-4 accent-emerald-500"
                  />
                  Compare with previous period
                </label>
                <button
                  type="button"
                  onClick={() => void loadReport()}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-black transition ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800' : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                >
                  <RefreshCw size={15} />
                  Refresh window
                </button>
              </div>
            </div>
          ) : null}

          {verifiedAccessKey ? (
            <DataDashboardPanel
              report={report}
              dailyInsightsSource={sajuState.dailyInsights?.source}
              journeyDebug={journeyDebug}
              loading={loading}
              error={error}
              onRetry={loadReport}
              language={language as AppLanguage}
              isDark={isDark}
            />
          ) : null}
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardScreen;


