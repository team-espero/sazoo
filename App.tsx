import React, { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { ErrorBoundary } from 'react-error-boundary';
import { GlobalStyles } from './utils';
import { SajuProvider, useSajuData, useSajuSettings } from './context';
import ErrorFallback from './screens/ErrorFallback';
import IntroScreen from './screens/IntroScreen';
import LandingScreen from './screens/LandingScreen';
import MainScreen from './screens/MainScreen';

import { BackgroundLayout } from './components/BackgroundLayout';
import AssetPreloader from './components/AssetPreloader';
import { analytics } from './src/services/analytics';
import { captureInviteFromLocation, getPendingInvite, resolveInviteTargetTab } from './src/services/invite';

// ... (Imports maintained above, remove StarField/TimeBasedBackground/Layout definitions)

const AppContent = () => {
  const [screen, setScreen] = useState('intro');
  const [activeTab, setActiveTab] = useState('chat');
  const { themeMode } = useSajuSettings();
  const { sajuState } = useSajuData();

  useEffect(() => {
    const invitePayload = captureInviteFromLocation();
    const { isFirstInstall } = analytics.initSession({
      source: 'app_boot',
      hasInvite: !!invitePayload,
    });

    if (invitePayload) {
      analytics.track('invite_open', {
        inviteId: invitePayload.inviteId,
        source: invitePayload.source,
        targetTab: invitePayload.targetTab,
        inviterName: invitePayload.inviterName,
      });

      if (isFirstInstall) {
        analytics.track('install_from_invite', {
          inviteId: invitePayload.inviteId,
          source: invitePayload.source,
          targetTab: invitePayload.targetTab,
        });
      }
    }
  }, []);

  const handleIntroComplete = () => {
    setScreen('landing');
  };

  const handleStart = () => {
    if (!sajuState.isOnboardingComplete) {
      analytics.startFirstValueTimer({
        source: 'landing_cta',
        language: document.documentElement.lang || 'ko',
      });
    }

    const pendingInvite = getPendingInvite();
    const nextTab =
      pendingInvite && sajuState.isOnboardingComplete
        ? resolveInviteTargetTab(pendingInvite)
        : 'chat';

    setActiveTab(nextTab);
    setScreen('main');
  };

  return (
    <div className="w-full h-dvh-screen min-h-0 relative flex items-stretch justify-center bg-[#f0f2f5]" data-theme={themeMode}>
      <div className="app-shell w-full max-w-[480px] h-dvh-screen min-h-0 bg-white relative overflow-hidden shadow-2xl flex flex-col">
        <BackgroundLayout isDarkMode={themeMode === 'dark'}>
          <AnimatePresence mode='wait'>
            {screen === 'intro' && (
              <IntroScreen key="intro" onComplete={handleIntroComplete} />
            )}
            {screen === 'landing' && (
              <LandingScreen key="landing" onStart={handleStart} />
            )}
            {screen === 'main' && (
              <MainScreen key="main" activeTab={activeTab} setActiveTab={setActiveTab} />
            )}
          </AnimatePresence>
        </BackgroundLayout>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const updateViewportHeight = () => {
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty('--app-vh', `${viewportHeight * 0.01}px`);
    };

    updateViewportHeight();
    window.addEventListener('resize', updateViewportHeight);
    window.visualViewport?.addEventListener('resize', updateViewportHeight);

    return () => {
      window.removeEventListener('resize', updateViewportHeight);
      window.visualViewport?.removeEventListener('resize', updateViewportHeight);
    };
  }, []);

  return (
    <div className="w-full h-dvh-screen min-h-0 overflow-hidden font-nunito text-slate-900">
      <GlobalStyles />
      <AssetPreloader />
      <ErrorBoundary
        FallbackComponent={ErrorFallback}
        onReset={() => {
          window.location.reload();
        }}
      >
        <SajuProvider>
          <AppContent />
        </SajuProvider>
      </ErrorBoundary>
    </div>
  );
}

