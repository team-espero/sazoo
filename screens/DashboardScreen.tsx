import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, LayoutDashboard } from 'lucide-react';
import { motion } from 'framer-motion';
import { DataDashboardPanel, buildDashboardCopy } from '../components/dashboard/DataDashboardPanel';
import { useSajuData, useSajuSettings, type AppLanguage } from '../context';
import { api, type LaunchAnalyticsReport } from '../src/services/api';
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

const DashboardScreen = () => {
  const { themeMode, language = 'ko' } = useSajuSettings();
  const { sajuState, activeProfileId } = useSajuData();
  const [report, setReport] = useState<LaunchAnalyticsReport | null>(null);
  const [journeyDebug, setJourneyDebug] = useState<JourneyDebugSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDark = themeMode === 'dark';
  const dashboardCopy = buildDashboardCopy(language as AppLanguage);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [nextReport] = await Promise.all([
        api.analytics.getLaunchReport(),
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
  }, [activeProfileId, dashboardCopy.error, sajuState.profile?.name]);

  useEffect(() => {
    void loadReport();
  }, [loadReport]);

  const handleBack = () => {
    window.location.assign('/');
  };

  return (
    <div className={`h-full overflow-y-auto px-6 pb-16 pt-8 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      <div className="mx-auto w-full max-w-5xl">
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
              <p className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Current product analytics snapshot</p>
            </div>
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className={`min-w-0 rounded-[36px] border p-5 md:p-6 ${isDark ? 'border-slate-700 bg-slate-950/70' : 'border-white/70 bg-white/90 shadow-xl'}`}
        >
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
        </motion.div>
      </div>
    </div>
  );
};

export default DashboardScreen;
