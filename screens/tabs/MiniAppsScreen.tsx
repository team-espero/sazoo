import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Heart, X, User, Plus, Search, Coins } from 'lucide-react';
import { Button, InputField, ProfileAvatar } from '../../components';
import { AppLanguage, useSajuActions, useSajuCurrency, useSajuData, useSajuSettings } from '../../context';
import { api } from '../../src/services/api';
import { analytics } from '../../src/services/analytics';

const MINI_COPY: Record<AppLanguage, any> = {
    en: {
        title: 'Mini Apps',
        subtitle: 'Playground',
        coinShortage: 'Not enough coins. (Need 1 coin)',
        coinUnit: 'coins',
        comingSoon: 'Coming Soon',
        apps: [
            { id: 'couple', title: 'Couple Match', icon: '💞', color: 'bg-pink-100', desc: 'Couple Matching' },
            { id: 'tarot', title: 'Tarot Card', icon: '🃏', color: 'bg-purple-100', desc: 'Today Tarot' },
            { id: 'dream', title: 'Dream Reading', icon: '🌙', color: 'bg-blue-100', desc: 'Dream Search' },
            { id: 'name', title: 'Naming', icon: '📛', color: 'bg-green-100', desc: 'Naming' },
        ],
        couple: {
            header: 'Couple Matching',
            me: 'Me',
            partner: 'Partner',
            selectPartner: 'Select Partner...',
            analyze: 'Analyze Compatibility (1 coin)',
            analyzing: 'Analyzing...',
            matchingScore: 'Matching Score',
            another: 'Try another match',
            selectionTitle: 'Who do you want to match with?',
            noProfiles: 'No additional profiles yet.\nPlease add someone first.',
            checking: '{me} and {partner} are being analyzed...',
            fallbackSummary: 'A naturally resonant pair.',
            fallbackDetail: 'Even with differences, this pair can complement each other well and grow steadily.',
            aiLanguage: 'English',
        },
        dream: {
            header: 'Dream Reading',
            question: 'What dream did you have?',
            placeholder: 'A flying dream, a falling dream, a bright place dream...',
            helper: 'The more details you share, the clearer the interpretation.',
            analyze: 'Interpret Dream (1 coin)',
            analyzing: 'Reading your dream...',
            resultTitle: 'Dream Message',
            another: 'Interpret another dream',
            fallback: 'Your dream energy feels like transition and reset. Let go of tension and move with a calm pace.',
            aiLanguage: 'English',
        },
    },
    ko: {
        title: '미니 앱',
        subtitle: '플레이그라운드',
        coinShortage: '엽전이 부족합니다! (1개 필요)',
        coinUnit: '엽전',
        comingSoon: '준비 중',
        apps: [
            { id: 'couple', title: '궁합 보기', icon: '💞', color: 'bg-pink-100', desc: 'Couple Matching' },
            { id: 'tarot', title: '타로 카드', icon: '🃏', color: 'bg-purple-100', desc: 'Today Tarot' },
            { id: 'dream', title: '해몽', icon: '🌙', color: 'bg-blue-100', desc: 'Dream Search' },
            { id: 'name', title: '작명', icon: '📛', color: 'bg-green-100', desc: 'Naming' },
        ],
        couple: {
            header: '궁합 보기',
            me: '나',
            partner: '상대',
            selectPartner: '상대를 선택하세요...',
            analyze: '궁합 분석하기 (1엽전)',
            analyzing: '분석 중입니다...',
            matchingScore: '궁합 점수',
            another: '다른 궁합 보기',
            selectionTitle: '누구와의 궁합을 볼까요?',
            noProfiles: '다른 프로필이 없습니다.\n먼저 친구를 추가해주세요!',
            checking: '{me}님과 {partner}님의\n기운을 확인 중..',
            fallbackSummary: '인연의 파장이 잘 맞아요.',
            fallbackDetail: '서로 다른 매력을 가진 조합으로, 부족한 부분을 채워주며 균형 있게 발전할 수 있습니다.',
            aiLanguage: 'Korean',
        },
        dream: {
            header: '해몽',
            question: '어떤 꿈을 꾸셨나요?',
            placeholder: '날아다니는 꿈, 떨어지는 꿈, 밝은 장소의 꿈...',
            helper: '구체적으로 적을수록 더 정확한 해석이 가능합니다.',
            analyze: '해몽하기 (1엽전)',
            analyzing: '꿈의 의미를 읽는 중..',
            resultTitle: '꿈의 메시지',
            another: '다른 꿈 해몽하기',
            fallback: '꿈의 기운은 전환과 정리를 뜻해요. 마음을 가볍게 하고 새로운 흐름을 받아들이세요.',
            aiLanguage: 'Korean',
        },
    },
    ja: {
        title: 'ミニアプリ',
        subtitle: 'プレイグラウンド',
        coinShortage: 'コイン不足です。(1コイン必要)',
        coinUnit: 'コイン',
        comingSoon: '準備中',
        apps: [
            { id: 'couple', title: '相性診断', icon: '💞', color: 'bg-pink-100', desc: 'Couple Matching' },
            { id: 'tarot', title: 'タロット', icon: '🃏', color: 'bg-purple-100', desc: 'Today Tarot' },
            { id: 'dream', title: '夢占い', icon: '🌙', color: 'bg-blue-100', desc: 'Dream Search' },
            { id: 'name', title: '命名', icon: '📛', color: 'bg-green-100', desc: 'Naming' },
        ],
        couple: {
            header: '相性診断',
            me: '自分',
            partner: '相手',
            selectPartner: '相手を選択してください...',
            analyze: '相性を分析 (1コイン)',
            analyzing: '分析中です...',
            matchingScore: '相性スコア',
            another: '別の相性を見る',
            selectionTitle: '誰との相性を見ますか？',
            noProfiles: '追加プロフィールがありません。\n先に相手を追加してください。',
            checking: '{me}さんと{partner}さんの\n気の流れを分析中..',
            fallbackSummary: '波長が合いやすい関係です。',
            fallbackDetail: '違いを補い合える関係性で、安定して成長しやすい相性です。',
            aiLanguage: 'Japanese',
        },
        dream: {
            header: '夢占い',
            question: 'どんな夢を見ましたか？',
            placeholder: '飛ぶ夢、落ちる夢、明るい場所の夢など...',
            helper: '具体的に書くほど、解釈の精度が上がります。',
            analyze: '夢を解釈 (1コイン)',
            analyzing: '夢の意味を解析中..',
            resultTitle: '夢のメッセージ',
            another: '別の夢を占う',
            fallback: 'その夢は切り替えと再整備のサインです。焦らず、静かに次の流れへ進みましょう。',
            aiLanguage: 'Japanese',
        },
    },
};

const formatWithVars = (text: string, vars: Record<string, string>) => {
    return text.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? '');
};

const extractJsonObject = (text: string) => {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start === -1 || end === -1 || end <= start) return null;

    try {
        return JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }
};

const TargetSelectionModal = ({ isOpen, onClose, onSelect, copy }: any) => {
    const { profiles, activeProfileId } = useSajuData();
    const availableProfiles = profiles.filter((p: any) => p.id !== activeProfileId);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="relative w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl overflow-hidden"
            >
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-black text-slate-800">{copy.selectionTitle}</h3>
                    <button onClick={onClose}><X className="text-slate-400" /></button>
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide">
                    {availableProfiles.length === 0 ? (
                        <div className="text-center py-8 text-slate-400 whitespace-pre-line">
                            <p>{copy.noProfiles}</p>
                        </div>
                    ) : (
                        availableProfiles.map((p: any) => (
                            <div
                                key={p.id}
                                onClick={() => onSelect(p)}
                                className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 active:scale-95 transition-transform cursor-pointer hover:bg-slate-100"
                            >
                                <ProfileAvatar name={p.name} size={48} className="bg-white border border-slate-200 shadow-sm" />
                                <div className="flex-1">
                                    <div className="font-bold text-slate-800">{p.name}</div>
                                    <div className="text-xs text-slate-400 font-medium capitalize">{p.relation} · {p.birthDate.year}.{p.birthDate.month}.{p.birthDate.day}</div>
                                </div>
                                <ChevronRight className="text-slate-300" size={16} />
                            </div>
                        ))
                    )}
                </div>
            </motion.div>
        </div>
    );
};

const CoupleMatchingApp = ({ onBack, appLanguage }: any) => {
    const { sajuState } = useSajuData();
    const { currency } = useSajuCurrency();
    const { useCoin, canUseCoin } = useSajuActions();
    const [status, setStatus] = useState('input');
    const [resultData, setResultData] = useState<any>(null);
    const [partner, setPartner] = useState<any>(null);
    const [showSelection, setShowSelection] = useState(true);
    const [isLoading, setIsLoading] = useState(false);

    const currentUser = sajuState.profile;
    const totalCoins = currency ? (currency.freeCoins + currency.paidCoins) : 0;
    const rootCopy = MINI_COPY[appLanguage as AppLanguage] ?? MINI_COPY.ko;
    const copy = rootCopy.couple;

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (status === 'analyzing') {
            timer = setTimeout(() => {
                if (status === 'analyzing') {
                    setResultData({
                        score: Math.floor(Math.random() * 15) + 80,
                        summary: copy.fallbackSummary,
                        detail: copy.fallbackDetail,
                    });
                    setStatus('result');
                    setIsLoading(false);
                }
            }, 7000);
        }
        return () => clearTimeout(timer);
    }, [status, copy.fallbackSummary, copy.fallbackDetail]);

    const handleAnalyze = async () => {
        if (!partner) {
            setShowSelection(true);
            return;
        }
        if (totalCoins < 1 || !canUseCoin()) {
            alert(rootCopy.coinShortage);
            return;
        }

        setIsLoading(true);
        setStatus('analyzing');
            const coinUseResult = await useCoin('miniapp_couple_matching');
        if (!coinUseResult.success) {
            setIsLoading(false);
            alert(rootCopy.coinShortage);
            return;
        }

        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000));
            const apiCall = api.ai.chat({
                message: `${currentUser.name} x ${partner.name} compatibility`,
                language: appLanguage as AppLanguage,
                profile: currentUser,
                saju: { currentUser, partner },
                promptMode: 'miniapp_couple',
                miniAppContext: {
                    app: 'couple',
                    partnerProfile: partner,
                },
            });

            const response: any = await Promise.race([apiCall, timeoutPromise]);
            const text = response.reply || '';
            const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = extractJsonObject(cleanText);
            if (!data) {
                throw new Error('Invalid compatibility payload');
            }

            setTimeout(() => {
                setResultData(data);
                setStatus('result');
                setIsLoading(false);
            }, 1000);
        } catch (error) {
            setTimeout(() => {
                setResultData({
                    score: Math.floor(Math.random() * 20) + 75,
                    summary: copy.fallbackSummary,
                    detail: copy.fallbackDetail,
                });
                setStatus('result');
                setIsLoading(false);
            }, 1500);
        }
    };

    const handleSelectPartner = (p: any) => {
        setPartner(p);
        setShowSelection(false);
    };

    return (
        <div className="h-full flex flex-col p-6 relative">
            <TargetSelectionModal
                isOpen={showSelection}
                onClose={() => { if (!partner) onBack(); else setShowSelection(false); }}
                onSelect={handleSelectPartner}
                copy={copy}
            />

            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/40 text-slate-600">
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h2 className="text-xl font-black text-slate-800 ml-2">{copy.header}</h2>
                </div>
                <div className="flex bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 items-center space-x-1 border border-white/20 shadow-sm">
                    <Coins className="text-yellow-500" size={16} />
                    <span className="font-bold text-slate-700 text-sm">{totalCoins} {rootCopy.coinUnit}</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {status === 'input' && (
                    <motion.div key="input" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="flex-1 flex flex-col space-y-6">
                        <div className="flex-1 space-y-4">
                            <div className="bg-white/60 backdrop-blur-md rounded-[24px] p-5 border border-white shadow-sm flex items-center space-x-4 relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-3 opacity-10">
                                    <User size={60} />
                                </div>
                                <ProfileAvatar name={currentUser.name} size={64} className="bg-blue-100 shadow-inner border-2 border-white" />
                                <div>
                                    <div className="text-xs font-bold text-slate-400 uppercase">{copy.me}</div>
                                    <div className="text-lg font-black text-slate-700">{currentUser.name}</div>
                                    <div className="text-xs font-medium text-slate-500">{currentUser.birthDate.year}. {currentUser.birthDate.month}. {currentUser.birthDate.day}</div>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-400 shadow-sm animate-pulse">
                                    <Heart size={20} fill="currentColor" />
                                </div>
                            </div>

                            <div
                                onClick={() => setShowSelection(true)}
                                className={`bg-white/60 backdrop-blur-md rounded-[24px] p-5 border border-white shadow-sm flex items-center space-x-4 relative overflow-hidden cursor-pointer transition-colors hover:bg-white/80 ${!partner ? 'border-dashed border-slate-300' : ''}`}
                            >
                                {partner ? (
                                    <>
                                        <ProfileAvatar name={partner.name} size={64} className="bg-pink-100 shadow-inner border-2 border-white" />
                                        <div>
                                            <div className="text-xs font-bold text-slate-400 uppercase">{copy.partner}</div>
                                            <div className="text-lg font-black text-slate-700">{partner.name}</div>
                                            <div className="text-xs font-medium text-slate-500">{partner.birthDate.year}. {partner.birthDate.month}. {partner.birthDate.day}</div>
                                        </div>
                                        <div className="absolute right-6 text-slate-400">
                                            <Search size={16} />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center space-x-4 w-full opacity-60">
                                        <div className="w-16 h-16 rounded-full bg-slate-200 flex items-center justify-center text-slate-400">
                                            <Plus />
                                        </div>
                                        <div className="font-bold text-slate-500">{copy.selectPartner}</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button fullWidth onClick={handleAnalyze} variant="primary" className="shadow-lg shadow-green-200" disabled={!partner || isLoading}>
                            {isLoading ? copy.analyzing : copy.analyze}
                        </Button>
                    </motion.div>
                )}

                {(status === 'analyzing' || status === 'result') && (
                    <motion.div key="analysis" className="flex-1 flex flex-col items-center justify-center relative w-full">
                        <div className="flex items-center justify-center space-x-8 w-full h-32 relative mb-4">
                            <motion.div initial={{ x: -100, opacity: 0 }} animate={{ x: status === 'result' ? 20 : 0, opacity: 1 }} className="z-10">
                                <ProfileAvatar name={currentUser.name} size={80} className="bg-blue-100 shadow-xl border-4 border-white" />
                            </motion.div>

                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0">
                                <Heart size={60} fill="currentColor" className="text-red-400" />
                            </div>

                            <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: status === 'result' ? -20 : 0, opacity: 1 }} className="z-10">
                                {partner && <ProfileAvatar name={partner.name} size={80} className="bg-pink-100 shadow-xl border-4 border-white" />}
                            </motion.div>
                        </div>

                        {status === 'analyzing' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-8 text-center">
                                <h3 className="text-lg font-bold text-slate-600 animate-pulse whitespace-pre-line">
                                    {formatWithVars(copy.checking, { me: currentUser.name, partner: partner?.name || '' })}
                                </h3>
                            </motion.div>
                        )}

                        {status === 'result' && resultData && (
                            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full">
                                <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[32px] shadow-xl border border-white/60 text-center space-y-4">
                                    <div>
                                        <div className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">{copy.matchingScore}</div>
                                        <div className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-pink-500">
                                            {resultData.score}%
                                        </div>
                                    </div>

                                    <div className="bg-red-50 text-red-500 font-bold px-4 py-2 rounded-xl text-sm inline-block">
                                        "{resultData.summary}"
                                    </div>

                                    <div className="text-left bg-white/50 rounded-2xl p-4 text-slate-700 font-medium text-sm leading-relaxed max-h-[30vh] overflow-y-auto">
                                        {resultData.detail}
                                    </div>
                                </div>

                                <Button onClick={() => setStatus('input')} variant="glass" className="!mt-6 !text-sm !py-3 w-full">
                                    {copy.another}
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const DreamInterpretationApp = ({ onBack, appLanguage }: any) => {
    const { currency } = useSajuCurrency();
    const { useCoin, canUseCoin } = useSajuActions();
    const [dream, setDream] = useState('');
    const [result, setResult] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const totalCoins = currency ? (currency.freeCoins + currency.paidCoins) : 0;
    const rootCopy = MINI_COPY[appLanguage as AppLanguage] ?? MINI_COPY.ko;
    const copy = rootCopy.dream;

    const handleAnalyze = async () => {
        if (!dream.trim()) return;
        if (totalCoins < 1 || !canUseCoin()) {
            alert(rootCopy.coinShortage);
            return;
        }

        setIsLoading(true);
            const coinUseResult = await useCoin('miniapp_dream_reading');
        if (!coinUseResult.success) {
            setIsLoading(false);
            alert(rootCopy.coinShortage);
            return;
        }

        try {
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 10000));
            const apiCall = api.ai.chat({
                message: dream,
                language: appLanguage as AppLanguage,
                promptMode: 'miniapp_dream',
                miniAppContext: {
                    app: 'dream',
                    dreamText: dream,
                },
            });

            const response: any = await Promise.race([apiCall, timeoutPromise]);
            setResult(response.reply || copy.fallback);
        } catch {
            setTimeout(() => {
                setResult(copy.fallback);
            }, 1000);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="h-full flex flex-col p-6 relative">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                    <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/40 text-slate-600">
                        <ChevronRight className="rotate-180" size={24} />
                    </button>
                    <h2 className="text-xl font-black text-slate-800 ml-2">{copy.header}</h2>
                </div>
                <div className="flex bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 items-center space-x-1 border border-white/20 shadow-sm">
                    <Coins className="text-yellow-500" size={16} />
                    <span className="font-bold text-slate-700 text-sm">{totalCoins} {rootCopy.coinUnit}</span>
                </div>
            </div>

            <AnimatePresence mode="wait">
                {!result ? (
                    <motion.div key="input" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex-1 flex flex-col">
                        <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-700 mb-4">{copy.question}</h3>
                            <InputField
                                placeholder={copy.placeholder}
                                value={dream}
                                onChange={(e: any) => setDream(e.target.value)}
                            />
                            <p className="text-xs text-slate-400 mt-4 px-2">* {copy.helper}</p>
                        </div>
                        <Button fullWidth onClick={handleAnalyze} disabled={!dream.trim() || isLoading} variant="primary">
                            {isLoading ? copy.analyzing : copy.analyze}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center space-y-6">
                        <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-4xl shadow-inner mb-4">🌙</div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-500 mb-2">{copy.resultTitle}</h3>
                            <p className="text-xl font-medium text-slate-800 leading-relaxed word-keep-all px-4">{result}</p>
                        </div>
                        <Button onClick={() => { setResult(null); setDream(''); }} variant="glass" className="!mt-12">
                            {copy.another}
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const MiniAppsScreen = () => {
    const { currency } = useSajuCurrency();
    const { language = 'ko' } = useSajuSettings();
    const [selectedApp, setSelectedApp] = useState<string | null>(null);
    const totalCoins = currency ? (currency.freeCoins + currency.paidCoins) : 0;
    const copy = MINI_COPY[language as AppLanguage] ?? MINI_COPY.ko;

    const handleSelectApp = (appId: string) => {
        if (appId !== 'couple' && appId !== 'dream') {
            return;
        }

        analytics.trackMiniAppOpen({
            appId,
            screen: 'miniapps',
            freeCoins: currency?.freeCoins ?? 0,
            paidCoins: currency?.paidCoins ?? 0,
        });
        setSelectedApp(appId);
    };

    if (selectedApp === 'couple') {
        return <CoupleMatchingApp onBack={() => setSelectedApp(null)} appLanguage={language} />;
    }
    if (selectedApp === 'dream') {
        return <DreamInterpretationApp onBack={() => setSelectedApp(null)} appLanguage={language} />;
    }

    return (
        <div className="p-6 h-full overflow-y-auto pb-32">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="typo-h1 text-slate-800">{copy.title}</h2>
                    <span className="text-sm font-medium text-slate-400 block mt-1">{copy.subtitle}</span>
                </div>
                <div className="flex bg-white/50 backdrop-blur-sm rounded-full px-3 py-1 items-center space-x-1 border border-white/20 shadow-sm">
                    <Coins className="text-yellow-500" size={16} />
                    <span className="font-bold text-slate-700 text-sm">{totalCoins} {copy.coinUnit}</span>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {copy.apps.map((app: any) => (
                    <motion.button
                        key={app.id}
                        onClick={() => handleSelectApp(app.id)}
                        whileHover={{ y: -8, rotateX: 2, rotateY: -2, boxShadow: '0 20px 30px rgba(0,0,0,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        className={`aspect-square rounded-[28px] bg-white border border-white/60 shadow-lg p-5 flex flex-col items-center justify-center text-center space-y-3 relative overflow-hidden group ${app.id !== 'couple' && app.id !== 'dream' ? 'opacity-50 grayscale cursor-not-allowed' : ''}`}
                    >
                        <div className={`w-14 h-14 rounded-full ${app.color} flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform`}>
                            {app.icon}
                        </div>
                        <div>
                            <div className="font-extrabold text-slate-700 text-sm">{app.title}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-1">{app.desc}</div>
                        </div>
                        {app.id !== 'couple' && app.id !== 'dream' && (
                            <div className="absolute top-3 right-3 text-[10px] font-bold bg-slate-100 text-slate-400 px-2 py-1 rounded-full">{copy.comingSoon}</div>
                        )}
                    </motion.button>
                ))}
            </div>
        </div>
    );
};

export default MiniAppsScreen;


