import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, ChevronDown, Menu, X, Home, Calendar, Grid, User, LogOut, Coins, Lock } from 'lucide-react';
import { AppLanguage, useSajuActions, useSajuCurrency, useSajuData, useSajuSettings } from '../../context';
import { Button } from '../../components';
import { api, ApiError } from '../../src/services/api';
import { analytics } from '../../src/services/analytics';
import {
    getPromptMemoryProfile,
    hydrateProgressiveProfileMemory,
    seedProgressiveProfileMemory,
    updateProgressiveProfileMemory,
} from '../../src/services/profileMemory';
import { calculateYongshin, containsBrokenDisplayText, getElementStyle } from '../../utils';

const NAV_COPY: Record<AppLanguage, {
    menu: string;
    explore: string;
    locked: string;
    logout: string;
    home: string;
    calendar: string;
    miniApps: string;
    profile: string;
}> = {
    en: {
        menu: 'Menu',
        explore: 'Explore Sazoo',
        locked: 'Locked',
        logout: 'Logout',
        home: 'Home',
        calendar: 'Calendar',
        miniApps: 'Mini Apps',
        profile: 'Profile',
    },
    ko: {
        menu: '메뉴',
        explore: 'Sazoo 둘러보기',
        locked: '잠김',
        logout: '로그아웃',
        home: '홈',
        calendar: '달력',
        miniApps: '미니 앱',
        profile: '프로필',
    },
    ja: {
        menu: 'メニュー',
        explore: 'Sazooを探す',
        locked: 'ロック',
        logout: 'ログアウト',
        home: 'ホーム',
        calendar: 'カレンダー',
        miniApps: 'ミニアプリ',
        profile: 'プロフィール',
    },
};

const CHAT_COPY: Record<AppLanguage, {
    greeting: string;
    onboardingGuide: string;
    hiddenPrompt: string;
    insufficientCoins: string;
    onboardingButton: string;
    inputPlaceholder: string;
    responseFallback: string;
    networkFallback: string;
    loadingLabel: string;
    freeCoinLabel: string;
    paidCoinLabel: string;
    suggestions: string[];
}> = {
    en: {
        greeting: "Hello. I'm the Sazoo master who will read your flow with warmth and intuition.",
        onboardingGuide: 'To read your saju more clearly, I need a few details first. Shall we begin gently?',
        hiddenPrompt: 'Based on my saju profile, give me a first reading in a mysterious but intimate tone with clear practical guidance.',
        insufficientCoins: 'You are out of coins. Watch an ad or recharge to continue.',
        onboardingButton: 'Enter info and view reading',
        inputPlaceholder: 'Ask anything about your fortune...',
        responseFallback: 'The cosmic signal blurred for a moment. Ask again and I will read it more clearly.',
        networkFallback: 'The connection is wavering for a moment. I can read it again shortly.',
        loadingLabel: 'Reading the weave of your energy...',
        freeCoinLabel: 'free',
        paidCoinLabel: 'paid',
        suggestions: ['Money luck?', 'Love luck?', 'Career move?', 'Health luck?', 'Relationships?'],
    },
    ko: {
        greeting: '안녕하세요. 오늘 당신 곁에서 운명의 결을 함께 읽어드릴 사주 마스터예요.',
        onboardingGuide: '사주를 더 또렷하게 읽으려면 몇 가지 정보가 필요해요. 천천히 알려주실래요?',
        hiddenPrompt: '내 사주 프로필을 바탕으로 첫 해석을 빠르게 전하되, 신비롭고 친밀한 사주 마스터의 말투로 핵심 흐름과 현실적인 조언을 또렷하게 설명해줘.',
        insufficientCoins: '엽전이 부족합니다. 광고를 보거나 충전 후 다시 시도해주세요.',
        onboardingButton: '정보 입력하고 운세 보기',
        inputPlaceholder: '궁금한 점을 물어보세요...',
        responseFallback: '지금은 별의 결이 잠시 흐려졌어요. 다시 물어주시면 더 또렷하게 읽어드릴게요.',
        networkFallback: '연결의 결이 잠시 흔들렸어요. 숨을 고르고 다시 보면 더 정확하게 읽어드릴 수 있어요.',
        loadingLabel: '기운의 결을 가만히 읽고 있어요...',
        freeCoinLabel: '무료',
        paidCoinLabel: '유료',
        suggestions: ['재물운 어때?', '연애운 알려줘', '이직운 봐줘', '건강운은?', '대인관계는?'],
    },
    ja: {
        greeting: 'こんにちは。あなたの運命の流れをそっと読み解くSazooマスターです。',
        onboardingGuide: '四柱をもっと澄んだ形で読むために、いくつか情報を教えてください。ゆっくりで大丈夫です。',
        hiddenPrompt: '私の四柱プロフィールをもとに、最初の鑑定を素早く、神秘的で親しみのある口調で、流れと実用的な助言が伝わるように説明してください。',
        insufficientCoins: 'コインが足りません。広告視聴またはチャージ後にお試しください。',
        onboardingButton: '情報を入力して鑑定を見る',
        inputPlaceholder: '気になることを入力してください...',
        responseFallback: '今は波動が少し揺らいでいます。もう一度聞いていただければ、もっと澄んで読めます。',
        networkFallback: 'つながりが少し揺れています。少し置いてから読むと、より正確にお伝えできます。',
        loadingLabel: '気の流れを静かに読んでいます...',
        freeCoinLabel: '無料',
        paidCoinLabel: '有料',
        suggestions: ['金運は？', '恋愛運は？', '転職運は？', '健康運は？', '対人運は？'],
    },
};

type ChatMessage = {
    role: 'user' | 'assistant';
    text: string;
};

const buildRecentPromptWindow = (history: ChatMessage[]) =>
    history
        .slice(-6)
        .map((message) => ({
            role: message.role,
            text: message.text.trim().slice(0, 320),
        }))
        .filter((message) => message.text);

const chunkText = (text: string, limit = 92) => {
    if (!text) return [];
    const sentences = text.match(/[^.!?~]+[.!?~]+(?:\s+|$)|[^.!?~]+$/g) || [text];
    const chunks: string[] = [];
    let current = '';

    for (const sentence of sentences) {
        const next = sentence.trim();
        if (!next) continue;
        if ((current.length + next.length) > limit && current) {
            chunks.push(current.trim());
            current = next;
        } else {
            current += `${current ? ' ' : ''}${next}`;
        }
    }

    if (current) chunks.push(current.trim());
    return chunks;
};

const readKor = (value: any) => {
    if (!value) return '';
    return typeof value === 'string' ? value : value.kor || '';
};

const readElement = (value: any) => {
    if (!value || typeof value === 'string') return '';
    return value.element || '';
};

const buildLocalInitialReading = (language: AppLanguage, saju: any) => {
    const centerStem = readKor(saju?.day?.stem);
    const centerBranch = readKor(saju?.day?.branch);
    const centerElement = readElement(saju?.day?.stem) || readElement(saju?.day?.branch) || '수';
    const supportElement = calculateYongshin(saju);
    const centerStyle = getElementStyle(centerElement);
    const supportStyle = getElementStyle(supportElement);

    if (language === 'en') {
        return `I have taken a quiet first look at your chart. The center of your saju leans on the ${centerStem}${centerBranch || ''} pillar, so your core energy carries the mood of ${centerStyle.desc || centerStyle.nameEn}. Right now, your flow opens best when you stop scattering your focus and choose one practical priority with calm commitment. Your chart also asks for more ${supportStyle.nameEn} energy, so steady routines, softer pacing, and clearer boundaries will help your luck move more smoothly. We can go deeper together from here.`;
    }

    if (language === 'ja') {
        return `まずは静かにあなたの四柱の結を読んでみました。中心には${centerStem}${centerBranch || ''}の気があり、根本の流れには${centerStyle.desc || centerStyle.nameEn}の雰囲気が強く流れています。今はあれこれ広げるより、ひとつの優先順位を落ち着いて育てるほど運が整いやすい時です。さらに${supportStyle.nameEn}の気を意識すると、気持ちの流れと現実の動きがもっとなめらかにつながっていきます。ここから先は、必要な分だけもう少し深く読んでいきます。`;
    }

    return `먼저 당신 사주의 결을 조용히 한번 읽어봤어요. 중심에는 ${centerStem}${centerBranch}의 기운이 서 있어서, 본래 결은 ${centerStyle.desc} 쪽으로 또렷하게 흐르는 편이에요. 지금은 여러 갈래로 마음을 흩뜨리기보다 가장 현실적인 한 가지를 붙잡고 차분히 밀어갈수록 운의 흐름이 안정돼요. 또 사주에는 ${supportElement} 기운이 더해질수록 균형이 좋아지니, ${supportStyle.desc}을 의식한 생활 리듬을 만들면 답답하던 부분도 조금씩 풀릴 거예요. 여기서부터는 제가 한 겹 더 깊게 읽어드릴게요.`;
};

const sanitizeAssistantText = (text: string | undefined | null, fallback: string) => {
    const normalized = String(text || '').trim();
    if (!normalized || containsBrokenDisplayText(normalized)) {
        return fallback;
    }
    return normalized;
};

const DEEP_READING_PREFIX: Record<AppLanguage, string> = {
    en: 'If we unfold this one layer deeper,',
    ko: '이 흐름을 한 겹 더 펼쳐보면,',
    ja: 'この流れをもう一段深くひらくと、',
};

const DEEP_READING_STARTERS: Record<AppLanguage, RegExp[]> = {
    en: [/^if we /i, /^looking a little deeper/i, /^one layer deeper/i, /^from this flow/i],
    ko: [/^이 흐름을 /, /^조금 더 깊이 /, /^한 겹 더 /, /^조용히 더 /],
    ja: [/^この流れを /, /^もう少し深く /, /^一段深く /, /^静かにさらに /],
};

const GENERIC_DEEP_READING_OPENERS: Record<AppLanguage, RegExp[]> = {
    en: [/^hello[.! ]*/i, /^hi[.! ]*/i, /^i(?: am|'m) the sazoo master[,.! ]*/i],
    ko: [/^안녕하세요[.! ]*/u, /^안녕[.! ]*/u, /^저는\s*사주\s*마스터(?:예요|입니다)?[.! ]*/u, /^사주\s*마스터(?:예요|입니다)?[.! ]*/u],
    ja: [/^こんにちは[。!！ ]*/u, /^私はSazooマスター(?:です|でございます)?[。!！ ]*/u, /^Sazooマスター(?:です|でございます)?[。!！ ]*/u],
};

const shapeDeepReadingText = (language: AppLanguage, text: string | undefined | null, fallback: string) => {
    let normalized = sanitizeAssistantText(text, fallback).replace(/\s+/g, ' ').trim();

    for (const pattern of GENERIC_DEEP_READING_OPENERS[language] ?? GENERIC_DEEP_READING_OPENERS.ko) {
        normalized = normalized.replace(pattern, '').trim();
    }

    if (!normalized || containsBrokenDisplayText(normalized)) {
        return fallback;
    }

    const starters = DEEP_READING_STARTERS[language] ?? DEEP_READING_STARTERS.ko;
    if (!starters.some((pattern) => pattern.test(normalized))) {
        const prefix = DEEP_READING_PREFIX[language] ?? DEEP_READING_PREFIX.ko;
        const continuedText = language === 'en' ? normalized.replace(/^[A-Z]/, (match) => match.toLowerCase()) : normalized;
        normalized = `${prefix} ${continuedText}`.trim();
    }

    return normalized;
};

const PagedBubble = ({ text, onTypingComplete }: { text: string; onTypingComplete?: () => void }) => {
    const [pageIndex, setPageIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState('');
    const [isTyping, setIsTyping] = useState(true);
    const pages = useMemo(() => chunkText(text), [text]);
    const currentPageText = pages[pageIndex] || '';
    const isLastPage = pageIndex >= pages.length - 1;

    useEffect(() => {
        setPageIndex(0);
        setDisplayedText('');
        setIsTyping(true);
    }, [text]);

    useEffect(() => {
        let frame = 0;
        const step = Math.max(2, Math.ceil(currentPageText.length / 36));
        setDisplayedText('');
        setIsTyping(true);

        const interval = window.setInterval(() => {
            frame += step;
            setDisplayedText(currentPageText.slice(0, frame));
            if (frame >= currentPageText.length) {
                window.clearInterval(interval);
                setIsTyping(false);
                if (isLastPage) onTypingComplete?.();
            }
        }, 10);

        return () => window.clearInterval(interval);
    }, [currentPageText, isLastPage, onTypingComplete, pageIndex]);

    const handleClick = () => {
        if (isTyping) {
            setDisplayedText(currentPageText);
            setIsTyping(false);
            if (isLastPage) onTypingComplete?.();
            return;
        }

        if (!isLastPage) {
            setPageIndex((prev) => prev + 1);
        }
    };

    return (
        <div className="relative flex min-h-[92px] w-full cursor-pointer flex-col items-center justify-center" onClick={handleClick}>
            <p className="text-center text-base font-bold leading-relaxed text-slate-800 sm:text-lg">
                {displayedText}
                {isTyping && <span className="ml-1 inline-block h-4 w-1.5 animate-pulse rounded-full bg-emerald-400 align-middle" />}
            </p>

            {!isTyping && !isLastPage && (
                <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ repeat: Infinity, duration: 0.8, repeatType: 'reverse' }}
                    className="absolute bottom-[-10px] text-slate-400"
                >
                    <ChevronDown size={18} />
                </motion.div>
            )}
        </div>
    );
};

const NavigationDrawer = ({ isOpen, onClose, onNavigate }: { isOpen: boolean; onClose: () => void; onNavigate: (tab: string) => void }) => {
    const { sajuState } = useSajuData();
    const { language = 'ko' } = useSajuSettings();
    const copy = NAV_COPY[language as AppLanguage] ?? NAV_COPY.ko;
    const menuItems = [
        { id: 'home', label: copy.home, icon: Home },
        { id: 'calendar', label: copy.calendar, icon: Calendar },
        { id: 'miniapps', label: copy.miniApps, icon: Grid },
        { id: 'profile', label: copy.profile, icon: User },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.button
                        type="button"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
                        aria-label="Close menu"
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
                        className="fixed right-0 top-0 z-[60] flex h-full w-[280px] max-w-[84vw] flex-col bg-white/92 p-6 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="mb-8 flex justify-end">
                            <button onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100">
                                <X size={22} />
                            </button>
                        </div>

                        <div className="mb-8 px-2">
                            <h2 className="text-2xl font-black text-slate-800">{copy.menu}</h2>
                            <p className="text-sm font-medium text-slate-400">{copy.explore}</p>
                        </div>

                        <div className="flex-1 space-y-3">
                            {menuItems.map((item) => {
                                const isLocked = !sajuState.isOnboardingComplete;
                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            if (isLocked) return;
                                            onNavigate(item.id);
                                            onClose();
                                        }}
                                        data-testid={`chat-menu-${item.id}`}
                                        className={`flex min-h-[52px] w-full items-center gap-4 rounded-2xl p-4 text-left transition-colors ${isLocked ? 'cursor-not-allowed opacity-50' : 'hover:bg-white'}`}
                                    >
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isLocked ? 'bg-slate-50 text-slate-300' : 'bg-slate-100 text-slate-500'}`}>
                                            {isLocked ? <Lock size={18} /> : <item.icon size={20} />}
                                        </div>
                                        <span className={`text-lg font-bold ${isLocked ? 'text-slate-300' : 'text-slate-700'}`}>
                                            {isLocked ? copy.locked : item.label}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        <div className="border-t border-slate-200 pt-6">
                            <button onClick={() => alert('Logout')} className="flex min-h-[44px] items-center gap-2 px-2 font-bold text-slate-400 hover:text-red-400">
                                <LogOut size={18} />
                                <span>{copy.logout}</span>
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const ChatScreen = ({ onNavigate, onRequestOnboarding }: { onNavigate: (tab: string) => void; onRequestOnboarding: () => void }) => {
    const { sajuState, pendingMessage } = useSajuData();
    const { language = 'ko' } = useSajuSettings();
    const { currency, DAILY_FREE_COINS } = useSajuCurrency();
    const { setPendingMessage, useCoin, refundCoin, canUseCoin, markInitialAnalysisDone } = useSajuActions();

    const copy = CHAT_COPY[language as AppLanguage] ?? CHAT_COPY.ko;
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showUserBubble, setShowUserBubble] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showOnboardingBtn, setShowOnboardingBtn] = useState(false);
    const [isIdleMotionEnabled, setIsIdleMotionEnabled] = useState(true);

    const latestUserMessage = [...messages].reverse().find((message) => message.role === 'user');
    const latestAssistantMessage = [...messages].reverse().find((message) => message.role === 'assistant');
    const processedPendingMessage = useRef<string | null>(null);
    const previousOnboardingState = useRef(sajuState.isOnboardingComplete);
    const initialAnalysisRunningRef = useRef(false);
    const firstReadingTrackedRef = useRef(false);
    const localInitialReading = useMemo(
        () => buildLocalInitialReading(language, sajuState.saju),
        [language, sajuState.saju],
    );

    const resolveApiErrorMessage = (error: ApiError) => {
        if (
            error.code === 'RATE_LIMITED'
            || error.code === 'TIMEOUT'
            || error.code === 'NETWORK_ERROR'
            || error.code === 'OFFLINE'
            || error.code === 'UPSTREAM_TIMEOUT'
        ) {
            return copy.networkFallback;
        }
        return copy.responseFallback;
    };

    const appendAssistantMessage = useCallback((text: string, fallback?: string) => {
        const safeText = sanitizeAssistantText(text, fallback || copy.responseFallback);
        setMessages((prev) => [...prev, { role: 'assistant', text: safeText }]);
    }, [copy.responseFallback]);

    const requestInitialAnalysis = useCallback(async () => {
        if (initialAnalysisRunningRef.current || !sajuState.isOnboardingComplete || sajuState.initialAnalysisDone) {
            return;
        }

        await hydrateProgressiveProfileMemory(sajuState.profile.id);
        seedProgressiveProfileMemory({
            profile: sajuState.profile,
            concern: sajuState.concern,
        });

        initialAnalysisRunningRef.current = true;
        setMessages([{ role: 'assistant', text: localInitialReading }]);
        setShowOnboardingBtn(false);
        setIsLoading(false);
        markInitialAnalysisDone();

        if (!firstReadingTrackedRef.current) {
            firstReadingTrackedRef.current = true;
            analytics.trackFirstReadingSuccess({
                source: 'initial_local_reading',
                language,
                concern: sajuState.concern || null,
            });
        }

        try {
            const memoryProfile = getPromptMemoryProfile(sajuState.profile.id, copy.hiddenPrompt);
            const response = await api.ai.chat({
                message: copy.hiddenPrompt,
                language,
                profile: sajuState.profile,
                saju: sajuState.saju,
                isInitialAnalysis: true,
                memoryProfile,
                recentMessages: [{ role: 'assistant', text: localInitialReading }],
            });

            const enrichedReply = shapeDeepReadingText(language, response.reply || localInitialReading, localInitialReading);
            if (enrichedReply !== localInitialReading) {
                setMessages((prev) => {
                    if (prev.some((message) => message.role === 'assistant' && message.text === enrichedReply)) {
                        return prev;
                    }
                    return [...prev, { role: 'assistant', text: enrichedReply }];
                });
            }
        } catch (error) {
            console.error('Initial analysis error:', error);
            if (!firstReadingTrackedRef.current) {
                analytics.trackFirstReadingFailure({
                    source: 'initial_analysis',
                    language,
                    errorCode: error instanceof ApiError ? error.code : 'UNKNOWN',
                });
            }
        } finally {
            initialAnalysisRunningRef.current = false;
            setIsLoading(false);
        }
    }, [
        copy.hiddenPrompt,
        language,
        localInitialReading,
        markInitialAnalysisDone,
        sajuState.initialAnalysisDone,
        sajuState.isOnboardingComplete,
        sajuState.profile,
        sajuState.saju,
    ]);

    const handleSend = async (manualText?: string, isHiddenUserMessage = false) => {
        const textToSend = typeof manualText === 'string' ? manualText : input;
        if (!textToSend.trim() || isLoading) return;
        let spentCoinSource: 'free' | 'paid' | undefined;
        const optimisticHistory = !isHiddenUserMessage
            ? [...messages, { role: 'user' as const, text: textToSend }]
            : messages;
        const recentMessages = buildRecentPromptWindow(optimisticHistory);
        if (!isHiddenUserMessage) {
            updateProgressiveProfileMemory({
                profile: sajuState.profile,
                concern: sajuState.concern,
                language,
                message: textToSend,
                conversationHistory: optimisticHistory,
            });
        }
        const memoryProfile = getPromptMemoryProfile(sajuState.profile.id, textToSend);

        if (!isHiddenUserMessage) {
            if (!canUseCoin()) {
                appendAssistantMessage(copy.insufficientCoins);
                return;
            }

            const coinUseResult = await useCoin('chat_message');
            if (!coinUseResult.success) {
                appendAssistantMessage(copy.insufficientCoins);
                return;
            }

            setMessages((prev) => [...prev, { role: 'user', text: textToSend }]);
            spentCoinSource = coinUseResult.source;
        }

        setInput('');
        setIsLoading(true);

        try {
            const response = await api.ai.chat({
                message: textToSend,
                language,
                profile: sajuState.profile,
                saju: sajuState.saju,
                isInitialAnalysis: isHiddenUserMessage,
                memoryProfile,
                recentMessages,
            });

            appendAssistantMessage(response.reply || copy.responseFallback, copy.responseFallback);
        } catch (error) {
            console.error('Chat error:', error);
            if (!isHiddenUserMessage && spentCoinSource) {
                await refundCoin(spentCoinSource, 'chat_request_failed');
            }
            appendAssistantMessage(
                error instanceof ApiError ? resolveApiErrorMessage(error) : copy.networkFallback,
                copy.networkFallback,
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!latestUserMessage) return;
        setShowUserBubble(true);
        const timer = window.setTimeout(() => setShowUserBubble(false), 3200);
        return () => window.clearTimeout(timer);
    }, [latestUserMessage]);

    useEffect(() => {
        if (sajuState.isOnboardingComplete) {
            setShowOnboardingBtn(false);
            return;
        }

        setMessages([{ role: 'assistant', text: copy.greeting }]);
        setShowOnboardingBtn(false);

        const secondLineTimer = window.setTimeout(() => {
            setMessages((prev) => [...prev, { role: 'assistant', text: copy.onboardingGuide }]);
            window.setTimeout(() => setShowOnboardingBtn(true), 900);
        }, 2200);

        return () => window.clearTimeout(secondLineTimer);
    }, [copy.greeting, copy.onboardingGuide, sajuState.isOnboardingComplete]);

    useEffect(() => {
        if (!sajuState.isOnboardingComplete || sajuState.initialAnalysisDone) return;
        void requestInitialAnalysis();
    }, [requestInitialAnalysis, sajuState.initialAnalysisDone, sajuState.isOnboardingComplete]);

    useEffect(() => {
        const wasOnboarded = previousOnboardingState.current;
        if (!wasOnboarded && sajuState.isOnboardingComplete) {
            setShowOnboardingBtn(false);
        }
        previousOnboardingState.current = sajuState.isOnboardingComplete;
    }, [sajuState.isOnboardingComplete]);

    useEffect(() => {
        if (!pendingMessage || !sajuState.isOnboardingComplete) return;
        if (processedPendingMessage.current === pendingMessage) {
            setPendingMessage(null);
            return;
        }

        processedPendingMessage.current = pendingMessage;
        if (pendingMessage === '__INSUFFICIENT_COINS__') {
            appendAssistantMessage(copy.insufficientCoins);
        } else {
            void handleSend(pendingMessage);
        }
        setPendingMessage(null);
    }, [copy.insufficientCoins, pendingMessage, sajuState.isOnboardingComplete, setPendingMessage]);

    return (
        <div className="relative flex h-full flex-col overflow-hidden bg-transparent">
            <div className="absolute left-4 z-40 flex items-center gap-2 sm:left-6" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
                <div className="flex min-h-[44px] items-center gap-2 rounded-full border border-white/80 bg-white/70 px-3 py-1.5 shadow-md backdrop-blur-md">
                    <img src="/yeopjeon.png" alt="Coin" className="h-5 w-5 object-contain" />
                    <div className="flex flex-col leading-none">
                        <span className="text-sm font-black text-slate-700">{currency.freeCoins}<span className="font-bold text-slate-400">/{DAILY_FREE_COINS}</span></span>
                        <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">{copy.freeCoinLabel}</span>
                    </div>
                    {currency.paidCoins > 0 && (
                        <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-[#98FF98]">
                            +{currency.paidCoins} {copy.paidCoinLabel}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={() => setIsIdleMotionEnabled((prev) => !prev)}
                    className={`flex min-h-[40px] items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[10px] font-bold shadow-sm ${isIdleMotionEnabled ? 'border-emerald-200 bg-white/85 text-emerald-600' : 'border-slate-200 bg-slate-100/90 text-slate-400'}`}
                >
                    <span>{isIdleMotionEnabled ? 'MOTION ON' : 'MOTION OFF'}</span>
                    <div className={`h-2.5 w-2.5 rounded-full ${isIdleMotionEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-300'}`} />
                </button>
            </div>

            <div className="absolute right-4 z-40 sm:right-6" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 1rem)' }}>
                <button
                    type="button"
                    onClick={() => setIsMenuOpen(true)}
                    data-testid="chat-menu-button"
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/55 text-slate-600 shadow-sm backdrop-blur-md"
                >
                    <Menu size={20} />
                </button>
            </div>

            <NavigationDrawer isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} onNavigate={onNavigate} />

            <div className="pointer-events-none absolute inset-x-0 top-[22%] z-0 flex justify-center sm:top-[20%]">
                {!sajuState.isOnboardingComplete ? (
                    <img
                        src="/webp/greeting2.webp"
                        className="w-[82%] max-w-[360px] object-contain drop-shadow-2xl"
                        alt="Greeting character"
                    />
                ) : (
                    <div className="relative flex w-[110%] max-w-[520px] items-center justify-center">
                        <img src="/static_scholar_woman.png" className="pointer-events-none relative z-0 h-auto w-full object-contain opacity-0" alt="" aria-hidden="true" />
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                            {isLoading ? (
                                <motion.img
                                    key="loading-animation"
                                    src="/webp/reading_saju_pink.webp"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full w-full object-contain drop-shadow-2xl"
                                    alt="Reading animation"
                                />
                            ) : isIdleMotionEnabled ? (
                                <motion.img
                                    key="idle-motion"
                                    src="/webp/idle motion.webp"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full w-full object-contain drop-shadow-2xl"
                                    alt="Idle motion"
                                />
                            ) : (
                                <motion.img
                                    key="static-scholar-idle"
                                    src="/static_scholar_woman.png"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.2 }}
                                    className="h-full w-full object-contain drop-shadow-2xl"
                                    alt="Character static"
                                />
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="pointer-events-none absolute inset-x-0 top-[8%] z-10 flex flex-col items-center space-y-4 px-5 sm:px-6">
                <AnimatePresence mode="wait">
                    {latestAssistantMessage && (
                        <motion.div
                            key={`${latestAssistantMessage.role}-${latestAssistantMessage.text.slice(0, 24)}`}
                            initial={{ opacity: 0, y: 10, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -8 }}
                            className="pointer-events-auto relative flex min-h-[168px] w-full max-w-[92%] items-center justify-center rounded-[32px] rounded-b-lg border border-white/70 bg-white/82 p-6 text-center shadow-[0_20px_50px_-15px_rgba(0,0,0,0.15)] backdrop-blur-xl sm:p-8"
                        >
                            <div className="absolute left-[10%] right-[10%] top-0 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent" />

                            {isLoading ? (
                                <div className="flex flex-col items-center gap-3">
                                    <div className="flex space-x-1.5">
                                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#84fab0] to-[#8fd3f4]" />
                                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.15 }} className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#a18cd1] to-[#fbc2eb]" />
                                        <motion.div animate={{ y: [0, -8, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.3 }} className="h-2.5 w-2.5 rounded-full bg-gradient-to-r from-[#fbc2eb] to-[#84fab0]" />
                                    </div>
                                    <p className="text-sm font-bold text-slate-500">{copy.loadingLabel}</p>
                                </div>
                            ) : (
                                <PagedBubble text={latestAssistantMessage.text} />
                            )}

                            <div className="absolute -bottom-2 left-1/2 h-5 w-5 -translate-x-1/2 rotate-45 border-b border-r border-white/50 bg-white/85 backdrop-blur-xl" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-[18%] z-20 flex justify-center sm:bottom-[17%]">
                <AnimatePresence>
                    {showOnboardingBtn && !isLoading && (
                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.94 }} className="pointer-events-auto">
                            <Button onClick={onRequestOnboarding} variant="primary" className="shadow-xl shadow-emerald-200/40 !px-6 !py-3">
                                {copy.onboardingButton}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="pointer-events-none absolute bottom-0 z-40 flex w-full flex-col justify-end bg-gradient-to-t from-white via-white/85 to-transparent pt-24" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 1.5rem)' }}>
                <div className="relative mb-4 flex min-h-[40px] justify-end px-4 pointer-events-auto">
                    <AnimatePresence>
                        {showUserBubble && latestUserMessage && (
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0 }}
                                className="relative max-w-[88%] rounded-[24px] rounded-br-none bg-[#1f2937]/92 p-4 shadow-xl backdrop-blur-md"
                            >
                                <div className="text-sm font-medium text-white">{latestUserMessage.text}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {sajuState.isOnboardingComplete && (
                    <>
                        <div className="mb-3 flex w-full gap-2 overflow-x-auto px-4 py-1 pointer-events-auto scrollbar-hide">
                            {copy.suggestions.map((chip) => (
                                <button
                                    key={chip}
                                    onClick={() => void handleSend(chip)}
                                    className="min-h-[40px] flex-shrink-0 rounded-full border border-white/60 bg-white/92 px-4 py-2.5 text-xs font-bold text-slate-700 shadow-md backdrop-blur-md transition-all hover:bg-white"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                        <div className="px-4 pointer-events-auto">
                            <div className="flex items-center rounded-[24px] border border-white/70 bg-white/82 p-1.5 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.12)] backdrop-blur-xl transition-all duration-300 focus-within:border-[#84fab0]/30 focus-within:bg-white/95 focus-within:shadow-[0_15px_50px_-10px_rgba(132,250,176,0.25)]">
                                <input
                                    type="text"
                                    value={input}
                                    onChange={(event) => setInput(event.target.value)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter') {
                                            event.preventDefault();
                                            void handleSend();
                                        }
                                    }}
                                    placeholder={copy.inputPlaceholder}
                                    className="flex-1 bg-transparent px-4 py-3 text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => void handleSend()}
                                    disabled={isLoading}
                                    className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${input.trim()
                                        ? 'bg-gradient-to-br from-[#1e293b] to-[#0f172a] text-[#98FF98] shadow-lg'
                                        : 'bg-slate-100 text-slate-400'
                                        }`}
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default ChatScreen;
