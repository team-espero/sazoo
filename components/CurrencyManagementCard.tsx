import React, { useEffect, useMemo, useState } from 'react';
import { Coins, PlayCircle, ShoppingBag, TimerReset, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSajuActions, useSajuCurrency, useSajuSettings, type AppLanguage } from '../context';
import { clientEnv } from '../src/config/env';
import { showDaroRewardedAd } from '../src/services/ads/daroRewarded';
import { CURRENCY_WINDOW_MS, YEOPJEON_STARTER_BUNDLE } from '../src/services/currencyCatalog';

const CARD_COPY: Record<AppLanguage, {
  title: string;
  description: string;
  freePool: string;
  paidCoins: string;
  expiresIn: string;
  freePoolFull: string;
  adTitle: string;
  adsRemaining: string;
  adResetIn: string;
  adButton: string;
  adLoading: string;
  adGranted: string;
  adLimit: string;
  adNotReady: string;
  adDismissed: string;
  bundleTitle: string;
  bundleSubtitle: string;
  bundleButton: string;
  purchaseLoading: string;
  purchaseDone: string;
  providerMock: string;
  providerLive: string;
  sandboxNote: string;
}> = {
  en: {
    title: 'Yeopjeon Wallet',
    description: 'Daily free chats, rewarded ads, and the starter paid bundle.',
    freePool: 'Daily free pool',
    paidCoins: 'Paid coins',
    expiresIn: 'Expires in',
    freePoolFull: 'Refills every 24h. Unused free coins do not stack.',
    adTitle: 'Rewarded ad',
    adsRemaining: 'Ads remaining today',
    adResetIn: 'Ad reset in',
    adButton: 'Watch DARO ad',
    adLoading: 'Opening DARO reward...',
    adGranted: '1 paid yeopjeon was added.',
    adLimit: 'Daily DARO reward limit reached.',
    adNotReady: 'DARO rewarded ad is not connected yet.',
    adDismissed: 'Rewarded ad was dismissed before completion.',
    bundleTitle: 'Starter bundle',
    bundleSubtitle: '3 yeopjeon for 500 KRW',
    bundleButton: 'Add bundle',
    purchaseLoading: 'Applying bundle...',
    purchaseDone: 'Starter bundle was added.',
    providerMock: 'DARO mock',
    providerLive: 'DARO live',
    sandboxNote: 'In dev/staging this uses a mock rewarded completion until the DARO SDK bridge is attached.',
  },
  ko: {
    title: '엽전 지갑',
    description: '하루 무료 대화, DARO 보상형 광고, 시작용 유료 패키지를 관리해요.',
    freePool: '하루 무료 엽전',
    paidCoins: '유료 엽전',
    expiresIn: '만료까지',
    freePoolFull: '무료 엽전은 24시간마다 다시 차고, 남은 수량은 누적되지 않아요.',
    adTitle: '보상형 광고',
    adsRemaining: '오늘 남은 광고',
    adResetIn: '광고 리셋까지',
    adButton: 'DARO 광고 보고 받기',
    adLoading: 'DARO 보상형 광고를 여는 중이에요...',
    adGranted: '유료 엽전 1개가 지급됐어요.',
    adLimit: '오늘 받을 수 있는 광고 보상은 모두 사용했어요.',
    adNotReady: 'DARO 보상형 광고 연결이 아직 준비되지 않았어요.',
    adDismissed: '광고 시청이 완료되지 않아 보상이 지급되지 않았어요.',
    bundleTitle: '시작 패키지',
    bundleSubtitle: '엽전 3개 · 500원',
    bundleButton: '패키지 반영',
    purchaseLoading: '패키지를 반영하는 중이에요...',
    purchaseDone: '시작 패키지가 반영됐어요.',
    providerMock: 'DARO 모의 연동',
    providerLive: 'DARO 실연동',
    sandboxNote: '현재 dev/staging에서는 DARO SDK 브리지가 붙기 전까지 모의 완료 흐름으로 동작해요.',
  },
  ja: {
    title: '葉銭ウォレット',
    description: '1日の無料会話、DARO報酬型広告、開始用有料バンドルを管理します。',
    freePool: '1日の無料葉銭',
    paidCoins: '有料葉銭',
    expiresIn: '失効まで',
    freePoolFull: '無料葉銭は24時間ごとに補充され、未使用分は蓄積されません。',
    adTitle: '報酬型広告',
    adsRemaining: '本日の残り広告',
    adResetIn: '広告リセットまで',
    adButton: 'DARO広告を見る',
    adLoading: 'DARO報酬型広告を開いています...',
    adGranted: '有料葉銭1枚が追加されました。',
    adLimit: '本日の広告報酬上限に達しました。',
    adNotReady: 'DARO報酬型広告はまだ接続されていません。',
    adDismissed: '広告が最後まで再生されず、報酬は付与されませんでした。',
    bundleTitle: 'スターターバンドル',
    bundleSubtitle: '葉銭3枚 · 500ウォン',
    bundleButton: 'バンドル追加',
    purchaseLoading: 'バンドルを反映しています...',
    purchaseDone: 'スターターバンドルが追加されました。',
    providerMock: 'DAROモック',
    providerLive: 'DARO本番',
    sandboxNote: '現在 dev/staging では DARO SDK ブリッジ接続前のため、モック完了フローで動作します。',
  },
};

const formatRemaining = (ms: number, language: AppLanguage) => {
  if (ms <= 0) {
    return language === 'en' ? 'soon' : language === 'ja' ? 'まもなく' : '곧';
  }

  const totalMinutes = Math.ceil(ms / 60000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (language === 'en') return `${hours}h ${minutes}m`;
  if (language === 'ja') return `${hours}時間 ${minutes}分`;
  return `${hours}시간 ${minutes}분`;
};

export const CurrencyManagementCard = ({ isDark }: { isDark: boolean }) => {
  const { language = 'ko' } = useSajuSettings();
  const { currency, DAILY_FREE_COINS, MAX_ADS_PER_DAY } = useSajuCurrency();
  const { addCoinFromAd, purchaseCoins } = useSajuActions();
  const copy = CARD_COPY[language as AppLanguage] ?? CARD_COPY.ko;

  const [now, setNow] = useState(Date.now());
  const [actionState, setActionState] = useState<'idle' | 'ad' | 'purchase'>('idle');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  const freePoolRemainingMs = Math.max(0, currency.freeCoinsExpireAt - now);
  const adResetRemainingMs = Math.max(0, (currency.lastAdResetTime + CURRENCY_WINDOW_MS) - now);
  const remainingAdsToday = Math.max(0, MAX_ADS_PER_DAY - currency.adsWatchedToday);
  const providerLabel = clientEnv.appEnv === 'prod' ? copy.providerLive : copy.providerMock;

  const statusTone = useMemo(() => {
    if (!statusMessage) return '';
    if (
      statusMessage === copy.adLimit
      || statusMessage === copy.adNotReady
      || statusMessage === copy.adDismissed
    ) {
      return isDark ? 'border-rose-900/50 bg-rose-950/30 text-rose-200' : 'border-rose-200 bg-rose-50 text-rose-600';
    }
    return isDark ? 'border-emerald-900/50 bg-emerald-950/30 text-emerald-200' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  }, [copy.adDismissed, copy.adLimit, copy.adNotReady, isDark, statusMessage]);

  const handleWatchAd = async () => {
    if (actionState !== 'idle') return;
    if (remainingAdsToday <= 0) {
      setStatusMessage(copy.adLimit);
      return;
    }

    setActionState('ad');
    setStatusMessage(copy.adLoading);

    try {
      const adResult = await showDaroRewardedAd('profile_daily_reward');
      if (adResult.status === 'not_ready') {
        setStatusMessage(copy.adNotReady);
        return;
      }
      if (adResult.status !== 'completed') {
        setStatusMessage(copy.adDismissed);
        return;
      }

      const rewardResult = await addCoinFromAd('DARO', adResult.placementId, adResult.rewardClaimId);
      setStatusMessage(
        rewardResult.status === 'limit_reached'
          ? copy.adLimit
          : copy.adGranted,
      );
    } catch (error) {
      setStatusMessage(copy.adNotReady);
    } finally {
      setActionState('idle');
    }
  };

  const handlePurchaseBundle = async () => {
    if (actionState !== 'idle') return;
    setActionState('purchase');
    setStatusMessage(copy.purchaseLoading);

    try {
      await purchaseCoins(YEOPJEON_STARTER_BUNDLE.id);
      setStatusMessage(copy.purchaseDone);
    } catch (error) {
      setStatusMessage(copy.adNotReady);
    } finally {
      setActionState('idle');
    }
  };

  return (
    <div className={`rounded-[28px] border p-5 shadow-sm ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-white/70 bg-white/70'}`} data-testid="currency-wallet-card">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.title}</p>
          <h4 className={`mt-2 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.description}</h4>
        </div>
        <div className={`rounded-full px-3 py-1 text-[10px] font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm'}`}>
          {providerLabel}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="mb-3 flex items-center gap-2">
            <Coins size={16} className="text-amber-500" />
            <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{copy.freePool}</span>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} data-testid="currency-free-badge">
            {currency.freeCoins}
            <span className="text-lg text-slate-400">/{DAILY_FREE_COINS}</span>
          </div>
          <p className={`mt-2 text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.freePoolFull}</p>
          <div className={`mt-3 text-[11px] font-bold ${isDark ? 'text-[#98FF98]' : 'text-emerald-600'}`}>
            {copy.expiresIn} {formatRemaining(freePoolRemainingMs, language as AppLanguage)}
          </div>
        </div>

        <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="mb-3 flex items-center gap-2">
            <Zap size={16} className="text-sky-500" />
            <span className={`text-xs font-black ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{copy.paidCoins}</span>
          </div>
          <div className={`text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`} data-testid="currency-paid-badge">
            {currency.paidCoins}
          </div>
          <div className={`mt-3 text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {copy.adResetIn} {formatRemaining(adResetRemainingMs, language as AppLanguage)}
          </div>
          <div className={`mt-2 text-[11px] font-bold ${isDark ? 'text-[#98FF98]' : 'text-emerald-600'}`} data-testid="currency-ads-remaining">
            {copy.adsRemaining} {remainingAdsToday}/{MAX_ADS_PER_DAY}
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.adTitle}</p>
              <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.sandboxNote}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-[10px] font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'}`}>{providerLabel}</div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handleWatchAd}
            disabled={actionState !== 'idle'}
            data-testid="currency-ad-button"
            className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-colors ${actionState === 'idle' ? 'bg-[#0f172a] text-[#98FF98]' : 'bg-slate-300 text-slate-600'}`}
          >
            <PlayCircle size={18} />
            {copy.adButton}
          </motion.button>
        </div>

        <div className={`rounded-3xl border p-4 ${isDark ? 'border-slate-700 bg-slate-950/40' : 'border-slate-100 bg-slate-50/70'}`}>
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <p className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.bundleTitle}</p>
              <p className={`mt-1 text-sm font-black ${isDark ? 'text-[#98FF98]' : 'text-emerald-600'}`}>{copy.bundleSubtitle}</p>
            </div>
            <div className={`rounded-full px-3 py-1 text-[10px] font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'}`}>
              {YEOPJEON_STARTER_BUNDLE.coinAmount}x
            </div>
          </div>
          <motion.button
            whileTap={{ scale: 0.98 }}
            type="button"
            onClick={handlePurchaseBundle}
            disabled={actionState !== 'idle'}
            data-testid="currency-purchase-button"
            className={`flex min-h-[52px] w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-black transition-colors ${actionState === 'idle' ? 'bg-white text-slate-900 shadow-sm' : 'bg-slate-300 text-slate-600'}`}
          >
            <ShoppingBag size={18} />
            {copy.bundleButton}
          </motion.button>
        </div>
      </div>

      {statusMessage && (
        <div className={`mt-4 rounded-2xl border px-4 py-3 text-sm font-bold ${statusTone}`} data-testid="currency-status-message">
          <div className="flex items-center gap-2">
            <TimerReset size={16} />
            <span>{statusMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CurrencyManagementCard;
