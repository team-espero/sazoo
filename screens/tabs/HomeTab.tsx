import React, { Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Wind, Flame, Sun, Star, Droplets, Sparkles, Info, LayoutGrid, Lock, Check } from 'lucide-react';
import { useSajuActions, useSajuCurrency, useSajuData, useSajuSettings } from '../../context';
import { GlassCard, CustomRadarChart, DailyFortuneCard, LuckyItems, SajuGrid, LuckyElementCard } from '../../components';
import { heavenlyStems, earthlyBranches } from '../../utils';
const HomeScene = React.lazy(() => import('../../components/HomeScene'));

const WelcomeSection = () => {
    const { sajuState } = useSajuData();
    const { themeMode, language = 'ko' } = useSajuSettings();
    const isDark = themeMode === 'dark';
    const greetingByLanguage: Record<string, string> = {
        en: 'Hello',
        ko: '안녕하세요',
        ja: 'こんにちは',
    };
    const greeting = greetingByLanguage[language] || greetingByLanguage.ko;
    return (
        <div className="px-6 mb-8 mt-4 relative z-10">
            <div className="flex items-center space-x-2 mb-1"><span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${isDark ? 'bg-slate-800/50 text-slate-400 border-slate-700' : 'bg-white/50 text-slate-500 border-white'}`}>2026.02.07</span></div>
            <h2 className={`typo-h1 leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>{greeting}, <span className="text-holographic">{sajuState.profile.name || "Destiny"}!</span></h2>
        </div>
    );
};

const LuckCycleTimeline = ({ onInfoClick }: any) => {
    const { sajuState } = useSajuData();
    const { themeMode, language = 'ko' } = useSajuSettings();
    const isDark = themeMode === 'dark';
    const [mode, setMode] = React.useState<'1y' | '10y'>('1y'); // Default to 1-Year
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const birthYear = sajuState.profile.birthDate.year;
    const currentYear = new Date().getFullYear();
    const currentAge = currentYear - birthYear + 1;

    // --- 10-Year Cycle (Daewoon) Calculation ---
    const daewoonNum = 4; // Simplified logic for demo
    const daewoons = Array.from({ length: 9 }, (_, i) => {
        const startAge = daewoonNum + (i * 10);
        const endAge = startAge + 9;
        const startYear = birthYear + startAge - 1;
        const stem = heavenlyStems[(i * 2 + 3) % 10];
        const branch = earthlyBranches[(i * 3 + 1) % 12];
        const isCurrent = currentAge >= startAge && currentAge <= endAge;
        return { label: `${startAge}~${endAge}세`, subLabel: `${startYear}~`, stem, branch, isCurrent, id: i };
    });

    // --- 1-Year Cycle (Seun) Calculation ---
    const seuns = Array.from({ length: 9 }, (_, i) => {
        const year = currentYear - 4 + i;
        const age = year - birthYear + 1;
        const stemIdx = (year - 4) % 10;
        const branchIdx = (year - 4) % 12;
        const stem = heavenlyStems[stemIdx >= 0 ? stemIdx : stemIdx + 10];
        const branch = earthlyBranches[branchIdx >= 0 ? branchIdx : branchIdx + 12];
        const isCurrent = year === currentYear;
        return { label: `${year}년`, subLabel: `${age}세`, stem, branch, isCurrent, id: year };
    });

    const activeItems = mode === '10y' ? daewoons : seuns;
    const cycleTitle = mode === '10y'
        ? (language === 'en' ? '10-Year Luck Cycle' : language === 'ja' ? '10年運の流れ' : '10년 대운 흐름')
        : (language === 'en' ? '1-Year Luck Cycle' : language === 'ja' ? '1年運の流れ' : '1년 운세 흐름');
    const mode1Label = language === 'en' ? '1Y' : language === 'ja' ? '年運' : '연운';
    const mode10Label = language === 'en' ? '10Y' : language === 'ja' ? '大運' : '대운';
    const cycleFallback = language === 'en'
        ? 'Ride the current flow to rise higher.'
        : language === 'ja'
            ? '今の流れに乗るほど、さらに高く伸びます。'
            : '현재 흐름을 잘 타면 더 높이 비상할 수 있습니다.';

    React.useEffect(() => {
        if (scrollRef.current) {
            const activeEl = scrollRef.current.querySelector('.active-luck') as HTMLElement;
            if (activeEl) {
                const container = scrollRef.current;
                const scrollLeft = activeEl.offsetLeft - (container.clientWidth / 2) + (activeEl.clientWidth / 2);
                container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
            }
        }
    }, [sajuState, mode]);

    return (
        <div className="w-full mt-2">
            <div className="flex items-center justify-between px-2 mb-4">
                <div className="flex flex-col">
                    <h4 className={`text-sm font-bold flex items-center ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <Activity size={14} className="mr-1 text-[#98FF98]" />
                        {cycleTitle}
                    </h4>
                </div>

                <div className="flex items-center gap-2">
                    <div className={`flex p-0.5 rounded-full border shadow-inner ${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-100/80 border-slate-200'}`}>
                        <button
                            onClick={() => setMode('1y')}
                            className={`px-3 py-1 text-[9px] font-black rounded-full transition-all duration-300 ${mode === '1y' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-400'}`}
                        >
                            {mode1Label}
                        </button>
                        <button
                            onClick={() => setMode('10y')}
                            className={`px-3 py-1 text-[9px] font-black rounded-full transition-all duration-300 ${mode === '10y' ? (isDark ? 'bg-slate-700 text-white shadow-sm' : 'bg-white text-slate-800 shadow-sm') : 'text-slate-400'}`}
                        >
                            {mode10Label}
                        </button>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={onInfoClick}
                        className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors shadow-sm ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-[#60A5FA]' : 'bg-white/60 border-white/60 text-slate-400 hover:text-[#60A5FA]'}`}
                    >
                        <Info size={12} />
                    </motion.button>
                </div>
            </div>

            {/* Cycle Insight Tip (AI) */}
            <div className={`mx-2 mb-4 p-3 rounded-2xl flex items-start gap-2 border ${isDark ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-50/60 border-white/60'}`}>
                <Activity size={12} className="text-[#98FF98] mt-0.5 flex-shrink-0" />
                <p className={`text-[10px] font-bold leading-relaxed word-keep-all ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    {sajuState.dailyInsights?.cycleTip || cycleFallback}
                </p>
            </div>

            <div ref={scrollRef} className="flex space-x-4 overflow-x-auto px-4 pb-8 pt-4 scrollbar-hide snap-x items-center">
                {activeItems.map((item) => (
                    <motion.div
                        key={item.id}
                        className={`snap-center flex-shrink-0 flex flex-col items-center justify-center p-4 rounded-2xl transition-all duration-500 relative overflow-hidden
                            ${item.isCurrent
                                ? `active-luck w-28 h-36 z-10 ${isDark ? 'bg-slate-800 border-2 border-slate-600 shadow-[0_10px_30px_rgba(152,255,152,0.1)]' : 'bg-white/90 shadow-[0_10px_30px_rgba(152,255,152,0.4)] border-2 border-[#98FF98]'}`
                                : `w-20 h-24 border grayscale opacity-60 hover:opacity-100 hover:grayscale-0 ${isDark ? 'bg-slate-900/40 border-slate-700' : 'bg-white/40 border-white/50'}`
                            }`}
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: item.isCurrent ? 1 : 0.6, x: 0 }}
                    >
                        <div className="mb-2">
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full whitespace-nowrap ${item.isCurrent ? 'bg-[#98FF98] text-white' : `${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200/50 text-slate-400'}`}`}>
                                {item.label}
                            </span>
                        </div>
                        <div className="flex items-center space-x-1 mb-2">
                            <div className={`flex flex-col items-center ${item.isCurrent ? 'scale-110' : 'scale-90'}`}>
                                <span className={`text-xl font-black ${item.stem.text}`}>{item.stem.hanja}</span>
                            </div>
                            <div className={`flex flex-col items-center ${item.isCurrent ? 'scale-110' : 'scale-90'}`}>
                                <span className={`text-xl font-black ${item.branch.text}`}>{item.branch.hanja}</span>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold ${item.isCurrent ? 'text-slate-500' : 'text-slate-300'}`}>
                            {item.subLabel}
                        </span>
                        {item.isCurrent && (
                            <div className="absolute inset-0 border-2 border-[#98FF98]/10 rounded-2xl pointer-events-none" />
                        )}
                    </motion.div>
                ))}
            </div>
            <div className="relative h-1 w-full bg-slate-100 rounded-full mt-[-20px] mx-4 max-w-[calc(100%-32px)] overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-transparent via-[#98FF98] to-transparent w-full opacity-50" />
            </div>
        </div>
    );
};

const FiveElementsChart = ({ onEnergyInfoClick, onDaewoonInfoClick }: any) => {
    const { sajuState } = useSajuData();
    const { themeMode, language = 'ko' } = useSajuSettings();
    const { saju } = sajuState;
    const isDark = themeMode === 'dark';
    const energyTitle = language === 'en' ? 'My Energy Balance' : language === 'ja' ? '私のエネルギーバランス' : '나의 에너지 균형';
    const elementLabels = language === 'en'
        ? ['Wood', 'Fire', 'Earth', 'Metal', 'Water']
        : language === 'ja'
            ? ['木', '火', '土', '金', '水']
            : ['목', '화', '토', '금', '수'];
    const energyFallback = language === 'en'
        ? '* Missing elements are hints for growth. Turn them into your strength.'
        : language === 'ja'
            ? '* 足りない五行は成長のヒントです。強みに変えていきましょう。'
            : '* 부족한 오행은 삶의 힌트입니다. Sazoo에서 나만의 강점으로 완성하세요.';

    const elementsToProcess = saju ? [
        saju.year.stem, saju.year.branch,
        saju.month.stem, saju.month.branch,
        saju.day.stem, saju.day.branch,
        saju.hour.stem, saju.hour.branch
    ] : [
        { element: '목' }, { element: '화' },
        { element: '토' }, { element: '금' },
        { element: '수' }, { element: '목' },
        { element: '화' }, { element: '토' }
    ];

    const counts = elementsToProcess.reduce((acc: any, item: any) => {
        const keyMap: Record<string, string> = { '목': 'wood', '화': 'fire', '토': 'earth', '금': 'metal', '수': 'water' };
        const key = keyMap[item.element];
        if (key) acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, { wood: 0, fire: 0, earth: 0, metal: 0, water: 0 });

    return (
        <div className="px-6 pb-32">
            <div className="flex items-center justify-between mb-4">
                <h3 className={`typo-h2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>{energyTitle}</h3>
                <motion.button
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={onEnergyInfoClick}
                    className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors shadow-sm ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-[#60A5FA]' : 'bg-white/60 border-white/60 text-slate-400 hover:text-[#60A5FA]'}`}
                >
                    <Info size={16} />
                </motion.button>
            </div>
            <GlassCard className={`flex flex-col space-y-8 !py-8 ${isDark ? 'border-slate-700' : ''}`}>
                <div className="flex items-center justify-between px-2">
                    {[{ label: elementLabels[0], color: 'bg-green-400', icon: Wind, count: counts.wood },
                    { label: elementLabels[1], color: 'bg-red-400', icon: Flame, count: counts.fire },
                    { label: elementLabels[2], color: 'bg-yellow-400', icon: Sun, count: counts.earth },
                    { label: elementLabels[3], color: 'bg-slate-400', icon: Star, count: counts.metal },
                    { label: elementLabels[4], color: 'bg-blue-400', icon: Droplets, count: counts.water }]
                        .map((el, idx) => {
                            const Icon = el.icon;
                            return (
                                <div key={idx} className="flex flex-col items-center space-y-3 group">
                                    <div className="relative">
                                        <div className={`w-12 h-12 rounded-[18px] ${el.color} bg-opacity-20 flex items-center justify-center text-slate-600 shadow-sm border border-white group-hover:-translate-y-1 transition-transform`}>
                                            <Icon size={20} className="opacity-80" />
                                        </div>
                                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full flex items-center justify-center text-[10px] font-bold text-slate-600 shadow-sm border border-slate-100">
                                            {el.count}
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-500 uppercase pt-2">{el.label}</span>
                                </div>
                            )
                        })}
                </div>
                <div className="w-full h-[1px] bg-slate-200/50" />
                <div className="flex flex-col items-center">
                    <CustomRadarChart data={counts} />
                    <div className={`${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/40 border-white/80'} backdrop-blur-md rounded-2xl py-3 px-4 flex items-center justify-center gap-2 border shadow-sm mt-[-20px] mb-4 max-w-xs mx-auto`}>
                        <p className={`text-[10px] font-bold text-center leading-tight word-keep-all ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                            {sajuState.dailyInsights?.energyTip || energyFallback}
                        </p>
                    </div>
                </div>
                <div className="w-full h-[1px] bg-slate-200/50" />
                <LuckCycleTimeline onInfoClick={onDaewoonInfoClick} />
            </GlassCard>
        </div>
    );
};

const BASE_MODELS = [
    { id: 'hanok', name: 'Hanok', url: '/sazoo_hanok_web_home_1024.glb', scale: 5.5, position: [0, -2.0, 0], rotationSpeed: 0.25, alwaysUnlocked: true },
    { id: 'cheomseongdae', name: 'Cheomseongdae', url: '/sazoo_cheomseongdae_observatory_web_opt.glb', scale: 4.8, position: [0, -1.8, 0], rotationSpeed: 1.0, alwaysUnlocked: true },
    { id: 'earth', name: '토(土) - 기반', url: '/Five Elements_earth_element_web_opt_web_opt.glb', scale: 5.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'wood', name: '목(木) - 성장', url: '/Five Elements_wood_element_web_opt_web_opt.glb', scale: 5.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'fire', name: '화(火) - 열기', url: '/Five Elements_fire_element_web_opt_web_opt.glb', scale: 5.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'metal', name: '금(金) - 질서', url: '/Five Elements_metal_element_web_opt_web_opt.glb', scale: 5.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'water', name: '수(水) - 지혜', url: '/Five Elements_water_element_web_opt_web_opt.glb', scale: 5.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'rat', name: '12 zodiac signs - 쥐', url: '/twelve_zodiac_signs_rat_web_opt_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'ox', name: '12 zodiac signs - 소', url: '/twelve_zodiac_signs_ox_web_opt_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'tiger', name: '12 zodiac signs - 호랑이', url: '/twelve_zodiac_signs_tiger_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'rabbit', name: '12 zodiac signs - 토끼', url: '/twelve_zodiac_signs_rabbit_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'dragon', name: '12 zodiac signs - 용', url: '/twelve_zodiac_signs_dragon_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'snake', name: '12 zodiac signs - 뱀', url: '/twelve_zodiac_signs_snake_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'horse', name: '12 zodiac signs - 말', url: '/twelve_zodiac_signs_horse_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'sheep', name: '12 zodiac signs - 양', url: '/twelve_zodiac_signs_sheep_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'monkey', name: '12 zodiac signs - 원숭이', url: '/twelve_zodiac_signs_monkey_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'rooster', name: '12 zodiac signs - 닭', url: '/twelve_zodiac_signs_rooster_web_opt_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'dog', name: '12 zodiac signs - 개', url: '/twelve_zodiac_signs_dog_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'pig', name: '12 zodiac signs - 돼지', url: '/twelve_zodiac_signs_pig_web_opt_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    // New Unlocked Assets
    { id: 'magpie', name: 'Magpie (까치)', url: '/sazoo_magpie_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'fox', name: 'Fox (여우)', url: '/sazoo_fox_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'bokjumeoni', name: 'Lucky Pack', url: '/sazoo_cyber_bokjumeoni_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },
    { id: 'yeopjeon_currency', name: 'Yeopjeon Currency Stack', url: '/sazoo_yeopjeon_currency_stack_web_opt.glb', scale: 3.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: true },

    // Locked Assets
    { id: 'yeopjeon', name: 'Yeopjeon', url: '/sazoo_yeopjeon_currency_stack_web_opt.glb', scale: 3.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: false, unlockCondition: 3 },
    { id: 'woman', name: 'Woman Character', url: '/sazoo_woman_character_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: false, unlockCondition: 5 },
    { id: 'moon_rabbit', name: 'Moon Rabbit Badge', url: '/sazoo_moon_rabbit_badge_web_opt.glb', scale: 4.0, position: [0, -1.5, 0], rotationSpeed: 0.5, alwaysUnlocked: false, unlockCondition: 8 },

    ...Array.from({ length: 15 }, (_, i) => ({
        id: `locked-${i}`,
        name: '',
        url: '',
        alwaysUnlocked: false
    }))
];

const HomeTab = ({ setActiveTab }: any) => {
    const { sajuState } = useSajuData();
    const { currency, DAILY_FREE_COINS } = useSajuCurrency();
    const { setPendingMessage, canUseCoin, generateDailyInsights } = useSajuActions();
    const { themeMode, language = 'ko' } = useSajuSettings();
    const isDark = themeMode === 'dark';
    const sceneTitle = language === 'en' ? 'Change Scene' : language === 'ja' ? 'シーン変更' : '배경 변경';
    const premiumLabel = language === 'en' ? 'Sazoo Premium' : language === 'ja' ? 'Sazoo プレミアム' : 'Sazoo 프리미엄';
    const unlockHint = language === 'en'
        ? 'Locked content unlocks as you use Sazoo more.'
        : language === 'ja'
            ? 'ロック中のコンテンツは利用に応じて解放されます。'
            : '잠금된 컨텐츠는 sazoo를 더 열심히 사용하면 해금돼요';
    const lockMessageTemplate = language === 'en'
        ? (count: number) => `Use ${count} coins to unlock this.`
        : language === 'ja'
            ? (count: number) => `コイン${count}枚で解放できます。`
            : (count: number) => `코인 ${count}개를 사용하면 해금돼요!`;
    const promptCopy = {
        daily: language === 'en' ? 'today fortune' : language === 'ja' ? '今日の運勢' : '오늘 운세',
        luckyItems: language === 'en' ? "Explain today's recommended items, color, and place." : language === 'ja' ? '今日のおすすめアイテム、色、場所を説明して。' : '오늘의 추천 아이템과 색상, 장소에 대해서 설명해줘.',
        sajuGrid: language === 'en' ? 'Explain my four pillars (year, month, day, hour) in detail.' : language === 'ja' ? '私の四柱(年・月・日・時)の構成を詳しく説明して。' : '내 사주 팔자(년, 월, 일, 시)의 구성에 대해서 자세히 설명해줘.',
        luckyElement: language === 'en' ? 'What is my lucky element and how can I use it in daily life?' : language === 'ja' ? '私の用神は何で、日常でどう活かせますか？' : '내 용신(Lucky Element)이 무엇인지, 그리고 일상생활에서 이 기운을 어떻게 활용하면 좋을지 자세히 설명해줘.',
        energy: language === 'en' ? 'Analyze my five elements distribution and energy balance.' : language === 'ja' ? '私の五行分布とエネルギーバランスを分析して。' : '내 오행(목, 화, 토, 금, 수)의 분포와 에너지 균형에 대해서 분석해줘.',
        daewoon: language === 'en' ? 'Explain my 10-year luck cycle and current phase.' : language === 'ja' ? '私の10年運の流れと現在のフェーズを説明して。' : '내 대운(10년 주기 운세)의 흐름과 현재 대운에 대해서 설명해줘.',
    };
    const hasRequestedInsights = React.useRef(false);

    React.useEffect(() => {
        if (!sajuState.saju || !sajuState.isOnboardingComplete) {
            hasRequestedInsights.current = false;
            return;
        }

        if (hasRequestedInsights.current) {
            return;
        }

        hasRequestedInsights.current = true;
        void generateDailyInsights();
    }, [sajuState.saju, sajuState.isOnboardingComplete, generateDailyInsights]);
    const [isMenuOpen, setIsMenuOpen] = React.useState(false);
    const [currentModelIdx, setCurrentModelIdx] = React.useState(0);
    const [lockMessage, setLockMessage] = React.useState<string | null>(null);
    const [shouldRenderScene, setShouldRenderScene] = React.useState(false);

    const MODELS = BASE_MODELS.map(m => ({
        ...m,
        unlocked: m.alwaysUnlocked || ((m as any).unlockCondition && currency.totalCoinsUsed >= (m as any).unlockCondition)
    }));

    const activeModel = MODELS[currentModelIdx];

    React.useEffect(() => {
        if (typeof window === 'undefined') return;

        let cancelled = false;
        setShouldRenderScene(false);

        const enableScene = () => {
            if (!cancelled) {
                setShouldRenderScene(true);
            }
        };

        if ('requestIdleCallback' in window) {
            const idleId = (window as Window & { requestIdleCallback: (cb: IdleRequestCallback, options?: IdleRequestOptions) => number; cancelIdleCallback: (id: number) => void; })
                .requestIdleCallback(enableScene, { timeout: 250 });

            return () => {
                cancelled = true;
                (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
            };
        }

        const timer = window.setTimeout(enableScene, 140);
        return () => {
            cancelled = true;
            window.clearTimeout(timer);
        };
    }, [currentModelIdx]);

    const handleInfoClick = (message: string) => {
        if (!canUseCoin()) {
            setPendingMessage("__INSUFFICIENT_COINS__");
        } else {
            setPendingMessage(message);
        }
        setActiveTab('chat');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex-1 pb-24 overflow-y-auto overflow-x-hidden scrollbar-hide pt-14 relative"
        >
            {/* Coin Display - Fixed Top Left */}


            <div className="w-full flex justify-center mb-[-40px]">
                <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="relative w-full h-80 landscape:h-96"
                >
                    <div className={`absolute top-4 left-4 z-50 flex items-center gap-2 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-md transition-all duration-300 ${isDark ? 'bg-slate-900/60 border-slate-700' : 'bg-white/60 border-white/80'}`}>
                        <img src="/yeopjeon.png" alt="Coin" className="w-5 h-5 object-contain" />
                        <div className="flex flex-col leading-none">
                            <span className={`text-sm font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{currency.freeCoins}<span className="text-slate-400 font-bold">/{DAILY_FREE_COINS}</span></span>
                            <span className="mt-1 text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400">
                                {language === 'en' ? 'free' : language === 'ja' ? '無料' : '무료'}
                            </span>
                        </div>
                        {currency.paidCoins > 0 && (
                            <span className="rounded-full bg-slate-900 px-2 py-1 text-[10px] font-black text-[#98FF98]">
                                +{currency.paidCoins} {language === 'en' ? 'paid' : language === 'ja' ? '有料' : '유료'}
                            </span>
                        )}
                    </div>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 blur-3xl rounded-full ${isDark ? 'bg-[#98FF98]/10' : 'bg-[#98FF98]/20'}`} />
                    {shouldRenderScene ? (
                        <Suspense
                            fallback={
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/60 border-t-transparent" />
                                </div>
                            }
                        >
                            <HomeScene
                                modelUrl={(activeModel as any).url}
                                scale={(activeModel as any).scale as number}
                                position={(activeModel as any).position as [number, number, number]}
                                rotationSpeed={(activeModel as any).rotationSpeed}
                            />
                        </Suspense>
                    ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="h-14 w-14 animate-spin rounded-full border-4 border-white/60 border-t-transparent" />
                        </div>
                    )}

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                            setIsMenuOpen(!isMenuOpen);
                            setLockMessage(null);
                        }}
                        className={`absolute top-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-xl border shadow-lg transition-all backdrop-blur-md ${isDark ? 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-700/80' : 'bg-white/60 border-white/60 text-slate-600 hover:bg-white/80'}`}
                    >
                        <LayoutGrid size={20} />
                    </motion.button>

                    <AnimatePresence>
                        {isMenuOpen && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                                className={`absolute top-16 right-4 z-30 w-[min(18rem,calc(100vw-2rem))] backdrop-blur-xl rounded-2xl shadow-2xl border p-4 space-y-3 ${isDark ? 'bg-slate-900/90 border-slate-700' : 'bg-white/90 border-white'}`}
                            >
                                <div className="flex items-center justify-between px-1">
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{sceneTitle}</div>
                                    <div className="text-[8px] font-bold text-[#A2D6FA] bg-blue-50 px-2 py-0.5 rounded-full">{premiumLabel}</div>
                                </div>

                                <div className="grid grid-cols-5 gap-1.5">
                                    {MODELS.map((m, idx) => (
                                        <button
                                            key={m.id}
                                            onClick={() => {
                                                if (m.unlocked) {
                                                    setCurrentModelIdx(idx);
                                                    setIsMenuOpen(false);
                                                    setLockMessage(null);
                                                } else {
                                                    const condition = (m as any).unlockCondition;
                                                    setLockMessage(lockMessageTemplate(condition));

                                                    // Auto clear message after 3 seconds
                                                    setTimeout(() => setLockMessage(null), 3000);
                                                }
                                            }}
                                            className={`relative aspect-square rounded-lg border flex flex-col items-center justify-center transition-all
                                                ${m.unlocked
                                                    ? (currentModelIdx === idx
                                                        ? 'bg-[#98FF98]/20 border-[#98FF98] text-slate-800'
                                                        : `bg-white border-slate-100 hover:border-slate-300 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-400' : 'text-slate-500'}`)
                                                    : 'bg-slate-50 border-transparent opacity-60 hover:opacity-80 hover:bg-slate-100 cursor-not-allowed'
                                                }`}
                                        >
                                            {!m.unlocked ? (
                                                <Lock size={12} className="text-slate-300" />
                                            ) : (
                                                <span className="text-[8px] font-bold truncate max-w-full px-0.5">{m.name}</span>
                                            )}
                                            {m.unlocked && currentModelIdx === idx && (
                                                <div className="absolute -top-1 -right-1 bg-[#98FF98] rounded-full p-0.5 border border-white shadow-sm">
                                                    <Check size={6} strokeWidth={4} className="text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                                <div className="pt-2 border-t border-slate-100 min-h-[24px] flex items-center justify-center">
                                    <p className={`text-[9px] font-medium text-center flex items-center justify-center gap-1 transition-colors duration-300
                                        ${lockMessage ? 'text-rose-500 font-bold' : 'text-slate-400'}
                                    `}>
                                        {lockMessage ? (
                                            <>
                                                <Lock size={10} />
                                                {lockMessage}
                                            </>
                                        ) : (
                                            <>
                                                <Sparkles size={10} className="text-amber-400" />
                                                {unlockHint}
                                            </>
                                        )}
                                    </p>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
            <WelcomeSection />
            <div className="px-6">
                <DailyFortuneCard onViewFullFortune={() => handleInfoClick(promptCopy.daily)} />
            </div>
            <LuckyItems onInfoClick={() => handleInfoClick(promptCopy.luckyItems)} />
            <SajuGrid onInfoClick={() => handleInfoClick(promptCopy.sajuGrid)} />
            <LuckyElementCard onInfoClick={() => handleInfoClick(promptCopy.luckyElement)} />
            <FiveElementsChart
                onEnergyInfoClick={() => handleInfoClick(promptCopy.energy)}
                onDaewoonInfoClick={() => handleInfoClick(promptCopy.daewoon)}
            />
            <div className="h-8" />
        </motion.div>
    );
}

export default HomeTab;

