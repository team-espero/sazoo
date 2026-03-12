import React, { useState, useEffect, useRef, Suspense, useTransition, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardSkeleton, ChatSkeleton, ListSkeleton, OnboardingSkeleton } from '../skeletons';
import { FixedHeader, BottomNavigation } from '../components';
import { AppLanguage, useSajuActions, useSajuData, useSajuSettings } from '../context';
import { analytics } from '../src/services/analytics';
import { api, ApiError, type ShareCardMetadata } from '../src/services/api';
import { useAuth } from '../src/auth/AuthProvider';
import { auth } from '../src/config/firebase';
import { claimWelcomeZodiacGift, type WelcomeZodiacGiftReward } from '../src/services/homeRewards';
import { clearPendingInvite, getPendingInvite, resolveInviteTargetTab, type InvitePayload } from '../src/services/invite';
import { getOrCreateInstallationId, persistInviteRewardResult } from '../src/services/inviteRewards';

const HomeTab = React.lazy(() => import('./tabs/HomeTab'));
const ChatTab = React.lazy(() => import('./tabs/ChatScreen'));
const CalendarTab = React.lazy(() => import('./tabs/CalendarScreen'));
const MiniAppsTab = React.lazy(() => import('./tabs/MiniAppsScreen'));
const ProfileTab = React.lazy(() => import('./tabs/ProfileScreen'));
const OnboardingScreen = React.lazy(() => import('./OnboardingScreen'));
const AnalyzingScreen = React.lazy(() => import('./AnalyzingScreen'));

const NOTIFICATION_COPY: Record<AppLanguage, {
    titleLine1: string;
    titleLine2: string;
    bodyLine1: string;
    bodyLine2: string;
    confirm: string;
    later: string;
}> = {
    en: {
        titleLine1: 'Would you like',
        titleLine2: 'daily fortune alerts?',
        bodyLine1: 'We can send your daily flow every day at 8 AM.',
        bodyLine2: 'Start your day with your destiny briefing.',
        confirm: 'Yes, enable alerts',
        later: 'Maybe later',
    },
    ko: {
        titleLine1: '매일 아침',
        titleLine2: '운세 알림을 받을까요?',
        bodyLine1: '매일 오전 8시에 오늘의 운세를 보내드려요.',
        bodyLine2: '하루를 시작하기 전에 먼저 확인해보세요.',
        confirm: '네, 받을게요',
        later: '괜찮아요',
    },
    ja: {
        titleLine1: '毎朝の',
        titleLine2: '運勢通知を受け取りますか？',
        bodyLine1: '毎日午前8時に今日の運勢をお届けします。',
        bodyLine2: '一日の始まりに先に確認してみましょう。',
        confirm: 'はい、受け取る',
        later: '今は不要',
    },
};

const INVITE_REWARD_COPY: Record<AppLanguage, {
    eyebrow: string;
    title: string;
    body: string;
    rewardRowLabel: string;
    rewardLabel: string;
    reportLabel: string;
    cta: string;
}> = {
    en: {
        eyebrow: 'Invite reward',
        title: 'Your invite reward is ready.',
        body: 'We restored the shared screen and added your invite bonus.',
        rewardRowLabel: 'Reward',
        rewardLabel: '+1 coin',
        reportLabel: 'Unlocked: Comparison report',
        cta: 'Continue',
    },
    ko: {
        eyebrow: '초대 보상',
        title: '초대 보상을 지급했어요.',
        body: '공유된 화면을 복원했고, 초대 보상도 함께 넣어드렸어요.',
        rewardRowLabel: '보상',
        rewardLabel: '+1 엽전',
        reportLabel: '해금됨: 비교 리포트',
        cta: '계속 보기',
    },
    ja: {
        eyebrow: '招待報酬',
        title: '招待報酬を付与しました。',
        body: '共有された画面を復元し、招待報酬も一緒にお渡ししました。',
        rewardRowLabel: '報酬',
        rewardLabel: '+1 コイン',
        reportLabel: '解放: 比較レポート',
        cta: '続ける',
    },
};

const INVITE_RESTORE_COPY: Record<AppLanguage, {
    eyebrow: string;
    title: string;
    body: string;
    sharedResult: string;
    comparisonSummary: string;
    rewardClaimed: string;
    rewardDuplicate: string;
    rewardSelfBlocked: string;
    cta: string;
}> = {
    en: {
        eyebrow: 'Shared comparison',
        title: 'We restored the comparison sent to you.',
        body: 'This is the exact context attached to the invite link so you can continue from the shared result immediately.',
        sharedResult: 'Shared result',
        comparisonSummary: 'Comparison summary',
        rewardClaimed: 'Invite reward added.',
        rewardDuplicate: 'This invite was already claimed, so no extra reward was added.',
        rewardSelfBlocked: 'Your own invite link opened correctly, but self-invite rewards stay blocked.',
        cta: 'Open restored screen',
    },
    ko: {
        eyebrow: '공유된 비교 결과',
        title: '초대 링크에 담긴 비교 화면을 복원했어요.',
        body: '상대가 보낸 결과 문맥을 그대로 복원해서, 초대한 화면에서 바로 이어볼 수 있게 했어요.',
        sharedResult: '공유된 결과',
        comparisonSummary: '비교 요약',
        rewardClaimed: '초대 보상도 함께 지급했어요.',
        rewardDuplicate: '이미 받은 초대라서 보상은 다시 지급하지 않았어요.',
        rewardSelfBlocked: '내 링크를 다시 연 경우라 화면은 복원되지만 보상은 지급되지 않아요.',
        cta: '복원된 화면 보기',
    },
    ja: {
        eyebrow: '共有比較結果',
        title: '招待リンクに含まれていた比較画面を復元しました。',
        body: '相手が共有した文脈をそのまま戻して、共有された画面からすぐ続けられるようにしました。',
        sharedResult: '共有された結果',
        comparisonSummary: '比較サマリー',
        rewardClaimed: '招待報酬も付与しました。',
        rewardDuplicate: 'すでに受け取った招待なので、報酬は再付与していません。',
        rewardSelfBlocked: '自分の招待リンクを開いたため、画面は復元されますが報酬は付与されません。',
        cta: '復元された画面を開く',
    },
};

const WELCOME_GIFT_COPY: Record<AppLanguage, {
    eyebrow: string;
    title: string;
    body: string;
    giftLabel: string;
    notificationLabel: string;
    cta: string;
}> = {
    en: {
        eyebrow: 'Welcome gift',
        title: 'Your welcome gift has arrived.',
        body: 'We unlocked a zodiac-themed 3D asset for you. You can find it in the home scene picker and notification history.',
        giftLabel: 'Gifted asset',
        notificationLabel: 'Added to notifications',
        cta: 'Open home',
    },
    ko: {
        eyebrow: '환영 선물',
        title: '환영의 선물이 도착했어요.',
        body: '띠에 맞는 3D 에셋을 선물로 해금했어요. 홈 화면 배경 선택과 알림 내역에서 바로 확인할 수 있어요.',
        giftLabel: '선물 받은 에셋',
        notificationLabel: '알림 내역에도 저장했어요',
        cta: '홈에서 보기',
    },
    ja: {
        eyebrow: 'ウェルカムギフト',
        title: 'ウェルカムギフトが届きました。',
        body: '干支に合わせた3Dアセットをプレゼントとして解放しました。ホームのシーン選択と通知履歴で確認できます。',
        giftLabel: '受け取ったアセット',
        notificationLabel: '通知履歴にも保存しました',
        cta: 'ホームで見る',
    },
};

type RestoredInviteContext = {
    invite: InvitePayload & Partial<ShareCardMetadata>;
    claimStatus: 'claimed' | 'duplicate' | 'self_invite_blocked';
};

const NotificationPermissionModal = ({ isOpen, onClose, onConfirm, language = 'ko' }: any) => {
    const copy = NOTIFICATION_COPY[language as AppLanguage] ?? NOTIFICATION_COPY.ko;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[100] flex items-center justify-center px-6 safe-pad-x"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, y: 30, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.95, y: 10, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        className="bg-white/90 backdrop-blur-2xl w-full max-w-sm rounded-[28px] p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)] relative z-10 border border-white/80 overflow-hidden"
                    >
                        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent" />

                        <div className="text-center space-y-3 mb-8 mt-4">
                            <h3 className="text-2xl font-black text-slate-900 leading-tight">
                                {copy.titleLine1}
                                <br />
                                <span className="text-gradient-mint">{copy.titleLine2}</span> ✨
                            </h3>
                            <p className="text-sm text-slate-500 font-medium leading-relaxed px-2">
                                {copy.bodyLine1}
                                <br />
                                {copy.bodyLine2}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={onConfirm}
                                className="w-full py-4 rounded-2xl bg-gradient-to-r from-[#84fab0] to-[#8fd3f4] text-slate-900 font-black text-base shadow-lg shadow-[#84fab0]/30 transition-all"
                            >
                                {copy.confirm}
                            </motion.button>
                            <button
                                onClick={onClose}
                                className="w-full py-3 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {copy.later}
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const InviteRewardModal = ({ reward, onClose, language = 'ko' }: any) => {
    const copy = INVITE_REWARD_COPY[language as AppLanguage] ?? INVITE_REWARD_COPY.ko;

    return (
        <AnimatePresence>
            {reward && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[110] flex items-center justify-center px-6 safe-pad-x"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.92, y: 24, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.96, y: 8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/80 bg-white/92 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]"
                    >
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">{copy.eyebrow}</p>
                        <h3 className="mb-3 text-2xl font-black leading-tight text-slate-900">{copy.title}</h3>
                        <p className="mb-6 text-sm font-medium leading-relaxed text-slate-500">{copy.body}</p>
                        <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
                            <div className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-sm">
                                <span className="text-sm font-bold text-slate-500">{copy.rewardRowLabel}</span>
                                <span className="text-sm font-black text-slate-900">{copy.rewardLabel}</span>
                            </div>
                            <div className="rounded-2xl bg-slate-900 px-4 py-3">
                                <span className="text-sm font-black text-[#98FF98]">{copy.reportLabel}</span>
                                <p className="mt-1 text-xs font-medium leading-relaxed text-white/80">{reward.specialReport.title}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#84fab0] to-[#8fd3f4] py-4 text-base font-black text-slate-900 shadow-lg shadow-[#84fab0]/30"
                        >
                            {copy.cta}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const InviteRestoreModal = ({
    restore,
    onClose,
    language = 'ko',
}: {
    restore: RestoredInviteContext | null;
    onClose: () => void;
    language?: AppLanguage;
}) => {
    const copy = INVITE_RESTORE_COPY[language as AppLanguage] ?? INVITE_RESTORE_COPY.ko;

    if (!restore) return null;

    const statusMessage = restore.claimStatus === 'claimed'
        ? copy.rewardClaimed
        : restore.claimStatus === 'self_invite_blocked'
            ? copy.rewardSelfBlocked
            : copy.rewardDuplicate;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-[109] flex items-center justify-center px-6 safe-pad-x"
            >
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/40 backdrop-blur-md"
                    onClick={onClose}
                />
                <motion.div
                    initial={{ scale: 0.92, y: 24, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.96, y: 8, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                    className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/80 bg-white/92 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]"
                >
                    <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">{copy.eyebrow}</p>
                    <h3 className="mb-3 text-2xl font-black leading-tight text-slate-900">{copy.title}</h3>
                    <p className="mb-4 text-sm font-medium leading-relaxed text-slate-500">{copy.body}</p>

                    <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
                        <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{copy.sharedResult}</p>
                            <p className="mt-2 text-base font-black leading-snug text-slate-900">{restore.invite.previewTitle}</p>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-slate-600">{restore.invite.previewSummary}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-900 px-4 py-3">
                            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">{copy.comparisonSummary}</p>
                            <p className="mt-2 text-sm font-medium leading-relaxed text-white/85">{restore.invite.comparisonSummary}</p>
                        </div>
                    </div>

                    <p className="mt-4 text-xs font-bold text-emerald-600">{statusMessage}</p>
                    <button
                        type="button"
                        onClick={onClose}
                        className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#84fab0] to-[#8fd3f4] py-4 text-base font-black text-slate-900 shadow-lg shadow-[#84fab0]/30"
                    >
                        {copy.cta}
                    </button>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

const WelcomeGiftModal = ({
    reward,
    onClose,
    language = 'ko',
}: {
    reward: WelcomeZodiacGiftReward | null;
    onClose: () => void;
    language?: AppLanguage;
}) => {
    const copy = WELCOME_GIFT_COPY[language as AppLanguage] ?? WELCOME_GIFT_COPY.ko;
    const zodiacGiftCaption = language === 'en'
        ? `${reward?.zodiacName || ''} zodiac welcome gift`
        : language === 'ja'
            ? `${reward?.zodiacName || ''}のウェルカムギフト`
            : `${reward?.zodiacName || ''}띠 전용 환영 선물`;

    return (
        <AnimatePresence>
            {reward && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-[111] flex items-center justify-center px-6 safe-pad-x"
                >
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/40 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.92, y: 24, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.96, y: 8, opacity: 0 }}
                        transition={{ type: 'spring', stiffness: 280, damping: 24 }}
                        className="relative z-10 w-full max-w-sm overflow-hidden rounded-[28px] border border-white/80 bg-white/92 p-8 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.25)]"
                    >
                        <p className="mb-3 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">{copy.eyebrow}</p>
                        <h3 className="mb-3 text-2xl font-black leading-tight text-slate-900">{copy.title}</h3>
                        <p className="mb-6 text-sm font-medium leading-relaxed text-slate-500">{copy.body}</p>
                        <div className="space-y-3 rounded-[24px] bg-slate-50 p-4">
                            <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
                                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">{copy.giftLabel}</p>
                                <p className="mt-2 text-base font-black leading-snug text-slate-900">{reward.modelName}</p>
                                <p className="mt-1 text-sm font-medium text-slate-500">{zodiacGiftCaption}</p>
                            </div>
                            <div className="rounded-2xl bg-slate-900 px-4 py-3">
                                <p className="text-sm font-black text-[#98FF98]">{copy.notificationLabel}</p>
                                <p className="mt-1 text-xs font-medium leading-relaxed text-white/80">{reward.notification.body}</p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-6 w-full rounded-2xl bg-gradient-to-r from-[#84fab0] to-[#8fd3f4] py-4 text-base font-black text-slate-900 shadow-lg shadow-[#84fab0]/30"
                        >
                            {copy.cta}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const OnboardingModal = ({ isOpen, onComplete }: any) => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    const handleOnboardingFinish = useCallback(() => {
        setIsAnalyzing(true);
    }, []);

    const handleAnalysisFinish = useCallback(() => {
        setIsAnalyzing(false);
        onComplete();
    }, [onComplete]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute inset-0 z-[60] bg-gradient-to-br from-[#FFDAB9] via-[#FFF0F5] to-[#E6E6FA] flex flex-col"
                >
                    <Suspense fallback={<OnboardingSkeleton />}>
                        {!isAnalyzing ? (
                            <OnboardingScreen onComplete={handleOnboardingFinish} />
                        ) : (
                            <AnalyzingScreen onFinish={handleAnalysisFinish} />
                        )}
                    </Suspense>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

const MainScreen = ({ activeTab, setActiveTab }: any) => {
    const [scrolled, setScrolled] = useState(false);
    const [showNotificationModal, setShowNotificationModal] = useState(false);
    const [showOnboardingModal, setShowOnboardingModal] = useState(false);
    const [inviteRewardState, setInviteRewardState] = useState<any>(null);
    const [inviteRestoreState, setInviteRestoreState] = useState<RestoredInviteContext | null>(null);
    const [welcomeGiftState, setWelcomeGiftState] = useState<WelcomeZodiacGiftReward | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const { sajuState, profiles } = useSajuData();
    const { completeOnboarding, grantPaidCoins } = useSajuActions();
    const { language = 'ko' } = useSajuSettings();
    const { status: authStatus, session } = useAuth();

    const [isPending] = useTransition();
    const mainContentStyle = activeTab !== 'chat'
        ? {
            paddingTop: 'calc(5rem + env(safe-area-inset-top, 0px))',
            paddingBottom: 'calc(7rem + env(safe-area-inset-bottom, 0px))',
        }
        : undefined;

    const handleTabChange = useCallback((tabId: string) => {
        if (!sajuState.isOnboardingComplete && tabId !== 'chat') {
            return;
        }

        setActiveTab((prev: string) => {
            if (prev === tabId) return prev;
            return tabId;
        });
    }, [setActiveTab, sajuState.isOnboardingComplete]);

    const handleOpenOnboarding = useCallback(() => {
        if (sajuState.isOnboardingComplete) return;
        setShowOnboardingModal(true);
    }, [sajuState.isOnboardingComplete]);

    const handleOnboardingComplete = useCallback(() => {
        completeOnboarding();
        setShowOnboardingModal(false);
        setActiveTab('chat');
    }, [completeOnboarding, setActiveTab]);

    const handleNotificationClose = useCallback(() => setShowNotificationModal(false), []);
    const handleNotificationConfirm = useCallback(() => setShowNotificationModal(false), []);
    const handleBellClick = useCallback(() => setShowNotificationModal(true), []);

    useEffect(() => {
        if (sajuState.isOnboardingComplete && showOnboardingModal) {
            setShowOnboardingModal(false);
        }
    }, [sajuState.isOnboardingComplete, showOnboardingModal]);

    useEffect(() => {
        if (activeTab !== 'home') {
            return;
        }

        if (!sajuState.isOnboardingComplete || authStatus !== 'authenticated' || !session?.userId) {
            return;
        }

        const primaryProfile = profiles.find((profile) => profile.relation === 'me') || sajuState.profile;
        const reward = claimWelcomeZodiacGift({
            userId: session.userId,
            birthYear: primaryProfile.birthDate.year,
            profileName: primaryProfile.name,
            language,
        });

        if (!reward) {
            return;
        }

        analytics.track('welcome_zodiac_gift_unlocked', {
            modelId: reward.modelId,
            modelName: reward.modelName,
            zodiacName: reward.zodiacName,
        });
        setWelcomeGiftState(reward);
    }, [
        activeTab,
        authStatus,
        language,
        profiles,
        sajuState.isOnboardingComplete,
        sajuState.profile,
        session?.userId,
    ]);

    useEffect(() => {
        let cancelled = false;

        const applyPendingInvite = async () => {
            const pendingInvite = getPendingInvite();
            if (!pendingInvite || !sajuState.isOnboardingComplete) return;

            let resolvedInvite = pendingInvite;

            try {
                const metadata = await api.shareCards.getMetadata(pendingInvite.inviteId);
                if (metadata) {
                    resolvedInvite = {
                        ...pendingInvite,
                        ...metadata,
                        createdAt: metadata.createdAt || pendingInvite.createdAt,
                    };
                }
            } catch (error) {
                console.warn('Invite metadata restore fallback:', error);
            }

            try {
                const claimResult = await api.invites.claimReward({
                    installationId: getOrCreateInstallationId(),
                    userId: session?.userId || auth?.currentUser?.uid || undefined,
                    language,
                    invite: resolvedInvite,
                });

                persistInviteRewardResult(resolvedInvite, claimResult);

                if (claimResult.status === 'claimed') {
                    await grantPaidCoins(claimResult.coinReward, 'earned_from_invite');
                    analytics.track('invite_reward_claimed', {
                        inviteId: resolvedInvite.inviteId,
                        coinReward: claimResult.coinReward,
                        specialReportId: claimResult.specialReport?.id,
                    });
                    if (!cancelled) {
                        setInviteRewardState(claimResult);
                    }
                } else if (claimResult.status === 'self_invite_blocked') {
                    analytics.track('invite_reward_self_blocked', {
                        inviteId: resolvedInvite.inviteId,
                        reason: 'SELF_INVITE_BLOCKED',
                    });
                } else {
                    analytics.track('invite_reward_duplicate', {
                        inviteId: resolvedInvite.inviteId,
                        specialReportId: claimResult.specialReport?.id,
                    });
                }

                if (!cancelled) {
                    setInviteRestoreState({
                        invite: resolvedInvite,
                        claimStatus: claimResult.status,
                    });
                }
            } catch (error) {
                console.error('Invite reward claim failed:', error);
                analytics.track('invite_reward_claim_failed', {
                    inviteId: resolvedInvite.inviteId,
                    reason: error instanceof ApiError ? error.code : 'CLAIM_FAILED',
                });
            }

            const targetTab = resolveInviteTargetTab(resolvedInvite);
            if (!cancelled) {
                setActiveTab((prev: string) => (prev === targetTab ? prev : targetTab));
            }
            clearPendingInvite();
        };

        void applyPendingInvite();

        return () => {
            cancelled = true;
        };
    }, [grantPaidCoins, language, sajuState.isOnboardingComplete, session?.userId, setActiveTab]);

    useEffect(() => {
        let rafId: number | null = null;

        const handleScroll = () => {
            if (!scrollRef.current) return;
            if (rafId) return;

            rafId = requestAnimationFrame(() => {
                setScrolled(scrollRef.current!.scrollTop > 20);
                rafId = null;
            });
        };

        const div = scrollRef.current;
        if (div) div.addEventListener('scroll', handleScroll);

        const timer = setTimeout(() => {
            if (sajuState.isOnboardingComplete) {
                setShowNotificationModal(true);
            }
        }, 10000);

        return () => {
            div?.removeEventListener('scroll', handleScroll);
            clearTimeout(timer);
            if (rafId) cancelAnimationFrame(rafId);
        };
    }, [sajuState.isOnboardingComplete]);

    return (
        <motion.div key="main" className="absolute inset-0 flex flex-col z-30" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {activeTab !== 'chat' && <FixedHeader scrolled={scrolled} onBellClick={handleBellClick} />}

            <div
                ref={scrollRef}
                className={`flex-1 overflow-y-auto scrollbar-hide relative z-10 ${activeTab !== 'chat' ? '' : 'h-full'}`}
                style={mainContentStyle}
            >
                <Suspense fallback={
                    activeTab === 'home' ? <DashboardSkeleton /> :
                        activeTab === 'chat' ? <ChatSkeleton /> :
                            <ListSkeleton />
                }>
                    {activeTab === 'home' && <HomeTab setActiveTab={handleTabChange} />}
                    {activeTab === 'chat' && <ChatTab onNavigate={handleTabChange} onRequestOnboarding={handleOpenOnboarding} />}
                    {activeTab === 'calendar' && <CalendarTab />}
                    {activeTab === 'miniapps' && <MiniAppsTab />}
                    {activeTab === 'profile' && <ProfileTab />}
                </Suspense>
            </div>

            {activeTab !== 'chat' && (
                <BottomNavigation activeTab={activeTab} setActiveTab={handleTabChange} isPending={isPending} />
            )}

            <NotificationPermissionModal
                isOpen={showNotificationModal}
                onClose={handleNotificationClose}
                onConfirm={handleNotificationConfirm}
                language={language}
            />
            <InviteRewardModal
                reward={inviteRewardState}
                onClose={() => setInviteRewardState(null)}
                language={language}
            />
            <InviteRestoreModal
                restore={inviteRestoreState}
                onClose={() => setInviteRestoreState(null)}
                language={language}
            />
            <WelcomeGiftModal
                reward={welcomeGiftState}
                onClose={() => setWelcomeGiftState(null)}
                language={language}
            />
            <OnboardingModal isOpen={showOnboardingModal} onComplete={handleOnboardingComplete} />
        </motion.div>
    );
};

export default MainScreen;
