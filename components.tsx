import React, { useState, useRef, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check, ChevronRight, Sparkles, Bell, Home, MessageCircle, Calendar, Grid, User,
  Wind, Flame, Sun, Star, Droplets, ArrowRight, Share2, ShoppingBag, MapPin, Info, Zap, Lock
} from 'lucide-react';
import {
  getCoordinates, svgPath, bezierCommand, lineCommand,
  heavenlyStems, earthlyBranches, getElementStyle, calculateYongshin, containsBrokenDisplayText
} from './utils';
import { useSajuData, useSajuSettings } from './context';
import { analytics } from './src/services/analytics';
import { api } from './src/services/api';
import { buildInviteLink, createInvitePayload } from './src/services/invite';

/* -------------------------------------------------------------------------- */
/* Basic UI Elements                                                          */
/* -------------------------------------------------------------------------- */

export const Button = ({ children, onClick, className = "", fullWidth = false, variant = "primary", disabled = false }: any) => {
  // Use Universe Button structure for primary actions
  if (variant === 'primary' || variant === 'universe') {
    return (
      <motion.button
        whileHover={{ scale: 1.02, y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={onClick}
        disabled={disabled}
        className={`btn-universe min-h-[52px] rounded-full pl-6 pr-2 py-2.5 flex items-center justify-between transition-all duration-300 ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 grayscale' : ''} ${className}`}
      >
        <span className="font-bold text-base sm:text-lg text-white/90 tracking-wide font-outfit">{children}</span>
        <div className="btn-icon-circle w-11 h-11 rounded-full flex items-center justify-center ml-4 flex-shrink-0">
          <ArrowRight size={20} strokeWidth={2.5} />
        </div>
      </motion.button>
    );
  }

  // Secondary / Other variants
  const variants: any = {
    glass: 'bg-white/40 backdrop-blur-md border border-white/60 text-slate-800 hover:bg-white/60',
    kakao: 'bg-[#FEE500] text-[#391B1B] border border-transparent shadow-sm',
    google: 'bg-white text-slate-700 border border-slate-200 shadow-sm',
    ghost: 'bg-transparent text-slate-500 hover:bg-slate-100/50'
  };

  return (
    <motion.button
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      disabled={disabled}
      className={`min-h-[48px] px-5 py-3.5 rounded-[24px] font-bold text-base tracking-wide transition-all duration-300 flex items-center justify-center relative overflow-hidden ${variants[variant] || variants.glass} ${fullWidth ? 'w-full' : ''} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
    >
      <span className="z-10 flex items-center justify-center gap-2">{children}</span>
    </motion.button>
  );
};

const getInitials = (name: string) => {
  if (!name?.trim()) return '?';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const ProfileAvatar = ({
  name,
  size = 48,
  className = '',
}: {
  name?: string;
  size?: number;
  className?: string;
}) => {
  const initials = getInitials(name || '');

  return (
    <div
      className={`flex items-center justify-center overflow-hidden rounded-full border border-white/80 bg-gradient-to-br from-emerald-100 via-sky-100 to-violet-100 text-slate-700 shadow-sm ${className}`}
      style={{ width: size, height: size }}
      aria-label={name || 'Profile avatar'}
    >
      <span className="text-sm font-black tracking-tight">{initials}</span>
    </div>
  );
};

export const GlassCard = React.memo(({ children, className = "", delay = 0, onClick, noHover = false }: any) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0, transition: { delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] } }}
    whileHover={(onClick && !noHover) ? {
      y: -6,
      transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] }
    } : {}}
    whileTap={onClick ? { scale: 0.98 } : {}}
    onClick={onClick}
    className={`glass-panel noise-overlay rounded-[28px] p-6 ${className} ${onClick ? 'cursor-pointer' : ''}`}
  >
    {children}
  </motion.div>
));

export const InputField = ({ icon: Icon, placeholder, value, onChange, type = "text", label }: any) => (
  <div className="space-y-3">
    {label && <label className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-4">{label}</label>}
    <div className="group flex min-h-[52px] items-center input-premium px-5 py-4 bg-white/50 backdrop-blur-sm">
      {Icon && <Icon size={20} className="text-slate-400 mr-4 group-focus-within:text-[#60A5FA] transition-colors" />}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="bg-transparent w-full outline-none text-slate-800 font-bold text-lg placeholder-slate-400/60 font-outfit"
      />
    </div>
  </div>
);

export const JellyToggle = ({ isOn, onToggle }: any) => (
  <button type="button" onClick={onToggle} className={`relative flex h-9 w-14 items-center rounded-full cursor-pointer p-1 transition-colors duration-300 ${isOn ? 'bg-[#A2D6FA] shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)]' : 'bg-slate-200 shadow-inner'}`}>
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className="w-6 h-6 bg-white rounded-full shadow-md border border-white/50"
    />
  </button>
);

export const GenderCard = ({ type, selected, onClick }: any) => {
  const isMale = type === 'male';
  const imgUrl = isMale
    ? "/static_scholar-man.png"
    : "/static_scholar_woman.png";
  return (
    <motion.button
      type="button"
      whileHover={{ y: -8 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`flex-1 aspect-[4/5] rounded-[36px] cursor-pointer relative overflow-visible transition-all duration-300 
            ${selected ? 'bg-gradient-to-br from-white to-sky-50 shadow-[0_20px_40px_-10px_rgba(14,165,233,0.2)] ring-4 ring-white' : 'bg-white/40 border border-white/40'} 
             flex flex-col items-center justify-center group`}
    >
      {selected && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute top-4 right-4 bg-[#60A5FA] text-white p-1.5 rounded-full shadow-lg z-20"><Check size={14} strokeWidth={4} /></motion.div>}

      <div className="relative">
        {selected && <div className="absolute inset-0 bg-blue-300/20 blur-2xl rounded-full scale-150 animate-pulse" />}
        <motion.img src={imgUrl} alt={isMale ? "Boy" : "Girl"} className="w-32 h-32 mb-4 object-contain relative z-10" animate={selected ? { scale: 1.15 } : { scale: 1 }} />
      </div>

      <span className={`text-xl font-bold font-outfit ${selected ? 'text-slate-800' : 'text-slate-400'}`}>{isMale ? "Male" : "Female"}</span>
    </motion.button>
  );
};

export const SegmentedControl = ({ options, selected, onChange }: any) => (
  <div className="flex bg-slate-200/40 p-1.5 rounded-[24px] w-full relative backdrop-blur-sm">
    {options.map((option: string) => (
      <button key={option} onClick={() => onChange(option)} className={`flex-1 relative min-h-[44px] py-3 rounded-[20px] text-sm font-bold transition-all duration-300 z-10 flex items-center justify-center ${selected === option ? 'text-slate-800' : 'text-slate-400'}`}>
        {selected === option && <motion.div layoutId="segmented-bg" className="absolute inset-0 bg-white shadow-[0_4px_10px_-2px_rgba(0,0,0,0.05)] rounded-[20px] border border-white/60" transition={{ type: "spring", stiffness: 400, damping: 30 }} />}
        <span className="relative z-10">{option}</span>
      </button>
    ))}
  </div>
);

export const TagCloud = ({ tags, selectedTag, onSelect }: any) => (
  <div className="flex flex-wrap gap-3 justify-center">
    {tags.map((tag: any) => {
      const isSelected = selectedTag === tag.id;
      return (
        <motion.button
          key={tag.id}
          onClick={() => onSelect(tag.id)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`min-h-[44px] px-5 py-3 rounded-[20px] text-base font-bold border transition-all duration-300 flex items-center gap-2
                    ${isSelected
              ? `${tag.color} border-transparent text-slate-800 shadow-md`
              : 'bg-white/40 border-white/60 text-slate-500 hover:bg-white/60'
            }`}
        >
          <span>{tag.icon}</span><span>{tag.label}</span>
        </motion.button>
      )
    })}
  </div>
);

export const WheelPicker = ({ items, value, onChange, label, className = "", disabled = false }: any) => {
  const itemHeight = 44;
  const containerRef = useRef<HTMLDivElement>(null);
  const [localValue, setLocalValue] = useState(value);
  const isScrolling = useRef(false);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local value when prop changes externally (but not if we are scrolling)
  useEffect(() => {
    if (!isScrolling.current) {
      setLocalValue(value);
    }
  }, [value]);

  useEffect(() => {
    if (containerRef.current && !disabled) {
      const index = items.indexOf(value);
      if (index !== -1) {
        containerRef.current.scrollTo({
          top: index * itemHeight,
          behavior: 'smooth'
        });
      }
    }
  }, [items, disabled, value]);

  const handleScroll = (e: any) => {
    if (disabled) return;
    isScrolling.current = true;

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    const index = Math.round(e.target.scrollTop / itemHeight);
    const item = items[index];
    if (item !== undefined && item !== localValue) {
      setLocalValue(item);
    }

    // Reduced debounce time for faster response
    scrollTimeoutRef.current = setTimeout(() => {
      isScrolling.current = false;
      if (item !== undefined && item !== value) {
        onChange(item);
      }
    }, 80);
  };

  const handleScrollEnd = () => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
    isScrolling.current = false;
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative h-[140px] flex flex-col items-center ${className} ${disabled ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
      {label && <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2">{label}</div>}
      <div className="relative w-full flex-1 overflow-hidden">
        {/* Selection Highlight - Made semi-transparent to show text */}
        <div className="absolute top-1/2 left-0 w-full h-[44px] -translate-y-1/2 bg-white/70 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] rounded-xl pointer-events-none z-0 border border-slate-100" />

        {/* Gradient Overlays - Reduced opacity */}
        <div className="absolute top-0 left-0 w-full h-6 bg-gradient-to-b from-white/60 to-transparent z-0 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white/60 to-transparent z-0 pointer-events-none" />

        <div
          ref={containerRef}
          className="wheel-container h-full w-full overflow-y-auto snap-y snap-mandatory py-[48px] scrollbar-hide"
          onScroll={handleScroll}
          onScrollEnd={handleScrollEnd}
          style={{
            scrollBehavior: 'auto',
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-y',
            willChange: 'scroll-position',
            transform: 'translateZ(0)',
            backfaceVisibility: 'hidden',
          } as React.CSSProperties}
        >
          {items.map((item: any) => {
            const isSelected = item === localValue;
            return (
              <div key={item} className="h-[44px] flex items-center justify-center snap-center relative z-10">
                <span
                  className={`text-lg ${isSelected ? 'font-black text-slate-900' : 'font-bold text-slate-400'}`}
                  style={{
                    transform: 'translateZ(0)',
                  }}
                >
                  {item}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  )
}

export const StreamingText = ({ text, animate, onComplete, scrollToBottom }: any) => {
  const [displayedText, setDisplayedText] = useState(animate ? '' : text);
  const hasCompleted = useRef(false);

  useEffect(() => {
    if (!animate) {
      setDisplayedText(text);
      return;
    }
    if (hasCompleted.current) return;

    let i = 0;
    const intervalId = setInterval(() => {
      setDisplayedText(text.slice(0, i + 1));
      i++;
      if (scrollToBottom) scrollToBottom();
      if (i >= text.length) {
        clearInterval(intervalId);
        hasCompleted.current = true;
        if (onComplete) onComplete();
      }
    }, 20);

    return () => clearInterval(intervalId);
  }, [animate, text]);

  return (
    <span>
      {displayedText}
      {animate && !hasCompleted.current && (
        <span className="inline-block w-1.5 h-4 ml-0.5 align-middle bg-slate-400 animate-pulse rounded-full" />
      )}
    </span>
  );
};

/* -------------------------------------------------------------------------- */
/* Layout Components                                                          */
/* -------------------------------------------------------------------------- */

export const FixedHeader = ({ scrolled, onBellClick }: any) => (
  <div className={`absolute top-0 left-0 w-full z-50 glass-header safe-pad-top safe-pad-x px-6 py-4 flex justify-between items-center gpu-accelerated ${scrolled ? 'scrolled' : ''}`}>
    <div className="flex items-center space-x-3">
      <motion.div
        whileHover={{ scale: 1.05, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
        className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-transparent"
      >
        <img src="/playstore.png" alt="Sazoo logo" className="h-full w-full object-contain" />
      </motion.div>
      <h1 className="text-2xl font-black text-slate-900 tracking-tight font-outfit">Sazoo</h1>
    </div>
    <div className="flex items-center space-x-3">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.9 }}
        onClick={onBellClick}
        className="w-11 h-11 rounded-xl bg-white/70 hover:bg-white/90 backdrop-blur-md flex items-center justify-center border border-white/60 text-slate-600 shadow-md relative transition-all duration-300"
      >
        <Bell size={20} />
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute top-2 right-2 w-2.5 h-2.5 bg-gradient-to-r from-red-400 to-pink-400 rounded-full border-2 border-white shadow-sm"
        />
      </motion.button>
    </div>
  </div>
);

export const BottomNavigation = ({ activeTab, setActiveTab, isPending }: any) => {
  const { sajuState } = useSajuData();
  const { language = 'ko' } = useSajuSettings();
  const isOnboarded = sajuState.isOnboardingComplete;
  const navLabels = {
    en: { home: 'Home', chat: 'Chat', calendar: 'Calendar', apps: 'Apps', profile: 'My', locked: 'Locked' },
    ko: { home: '홈', chat: '채팅', calendar: '달력', apps: '앱', profile: '마이', locked: '잠김' },
    ja: { home: 'ホーム', chat: 'チャット', calendar: 'カレンダー', apps: 'アプリ', profile: 'マイ', locked: 'ロック' },
  }[language] || { home: '홈', chat: '채팅', calendar: '달력', apps: '앱', profile: '마이', locked: '잠김' };

  return (
    <div
      className="absolute bottom-0 left-0 w-full safe-pad-x px-6 z-50 flex justify-center pointer-events-none"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 0.5rem)' }}
    >
      <div className="glass-pill w-full max-w-[380px] rounded-[28px] p-2.5 flex justify-between items-center shadow-[0_25px_60px_-15px_rgba(0,0,0,0.18)] pointer-events-auto gpu-accelerated">
        {[
          { id: 'home', icon: Home, label: navLabels.home },
          { id: 'chat', icon: MessageCircle, label: navLabels.chat },
          { id: 'calendar', icon: Calendar, label: navLabels.calendar },
          { id: 'miniapps', icon: Grid, label: navLabels.apps },
          { id: 'profile', icon: User, label: navLabels.profile }
        ].map((tab) => {
          const isLocked = !isOnboarded && tab.id !== 'chat';
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => !isLocked && setActiveTab(tab.id)}
              disabled={isPending || isLocked}
              className={`relative flex-1 min-h-[56px] rounded-[20px] flex items-center justify-center transition-all duration-300 
                        ${isActive ? 'text-slate-900' : 'text-slate-400 hover:text-slate-600'}
                        ${(isPending || isLocked) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
                    `}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill-bg"
                  className="absolute inset-1 bg-gradient-to-br from-white via-white to-[#F0FFF0] rounded-[16px] shadow-[0_4px_12px_rgba(0,0,0,0.06),inset_0_1px_2px_rgba(255,255,255,1)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}

              <div className="relative z-10 flex flex-col items-center justify-center gap-1">
                {isLocked ? (
                  <Lock size={16} className="text-slate-300" />
                ) : (
                  <motion.div
                    animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-[#0f172a]" : "text-slate-400"} />
                  </motion.div>
                )}
                {(isActive || isLocked) && (
                  <motion.span
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`text-[9px] font-black uppercase tracking-wide leading-none font-outfit ${isLocked ? 'text-slate-300' : 'text-slate-700'}`}
                  >
                    {isLocked ? navLabels.locked : tab.label}
                  </motion.span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Home Widget Components                                                     */
/* -------------------------------------------------------------------------- */

const copyToClipboardSafe = async (value: string) => {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
    return false;
  }

  try {
    await navigator.clipboard.writeText(value);
    return true;
  } catch {
    return false;
  }
};

const buildFortuneComparisonCopy = (language: string, userName: string, title: string) => {
  const normalizedTitle = title.replace(/\s+/g, ' ').trim();

  if (language === 'en') {
    return {
      myResultLabel: 'My result',
      friendResultLabel: 'Friend result',
      friendResultText: 'Open the invite link and Sazoo will restore this comparison after onboarding.',
      summaryLabel: 'Comparison summary',
      summaryText: `${userName} starts from "${normalizedTitle}" today. Compare your result with a friend and see whose flow aligns first.`,
      inviteLabel: 'Open via invite link to restore this screen instantly.',
      shareText: `${userName}'s Sazoo result is ready. Open the invite link and compare your flow with theirs.`,
      fileName: 'sazoo_compare_card',
    };
  }

  if (language === 'ja') {
    return {
      myResultLabel: '私の結果',
      friendResultLabel: '友だちの結果',
      friendResultText: '招待リンクを開くと、オンボーディング後にこの比較画面へ戻れます。',
      summaryLabel: '比較サマリー',
      summaryText: `${userName}さんの今日の流れは「${normalizedTitle}」から始まっています。リンクを開いて、ふたりの流れをその場で比べられます。`,
      inviteLabel: '招待リンクから開くと、この画面をすぐ復元できます。',
      shareText: `${userName}さんのSazoo結果です。招待リンクを開くと、あなたの流れと並べて比べられます。`,
      fileName: 'sazoo_compare_card',
    };
  }

  return {
    myResultLabel: '내 결과',
    friendResultLabel: '친구 결과',
    friendResultText: '초대 링크를 열면 온보딩 뒤에 이 비교 화면으로 바로 돌아올 수 있어요.',
    summaryLabel: '비교 요약',
    summaryText: `${userName}님의 오늘 흐름은 "${normalizedTitle}"에서 시작되고 있어요. 친구도 링크를 열면 두 사람의 결과를 같은 화면에서 바로 비교할 수 있어요.`,
    inviteLabel: '초대 링크로 열면 이 화면을 바로 복원해드려요.',
    shareText: `${userName}님의 Sazoo 결과예요. 초대 링크를 열면 내 결과와 나란히 비교할 수 있어요.`,
    fileName: 'sazoo_compare_card',
  };
};

/* -------------------------------------------------------------------------- */
/* Home Widget Components                                                     */
/* -------------------------------------------------------------------------- */

export const DailyFortuneCard = ({ onViewFullFortune }: any) => {
  const { sajuState } = useSajuData();
  const { themeMode, language = 'ko' } = useSajuSettings();
  const [isSharing, setIsSharing] = useState(false);
  const userName = sajuState.profile.name || "User";
  const today = new Date();
  const dateString = language === 'en'
    ? `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    : language === 'ja'
      ? `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`
      : `${today.getFullYear()}년 ${today.getMonth() + 1}월 ${today.getDate()}일`;
  const isDark = themeMode === 'dark';
  const cardCopy: any = {
    en: {
      title: `"Your radiant passion\nis drawing a golden orbit"`,
      desc: `Today is ideal for expressing your originality. Practical opportunities can appear when you move with confidence and clarity.`,
      colorName: 'Neon Pink',
      itemName: 'Bag',
      placeName: 'Busy Street',
      header: 'Daily Insight',
      view: 'View Reading',
    },
    ko: {
      title: `"빛나는 당신의 열정이\n황금빛 궤도를 그립니다"`,
      desc: `오늘은 나만의 감각을 드러내기 좋은 날입니다. 차분하게 실행하면 실질적인 기회가 열립니다.`,
      colorName: '네온 핑크',
      itemName: '가방',
      placeName: '번화가',
      header: '오늘의 인사이트',
      view: '전체 보기',
    },
    ja: {
      title: `"輝く情熱が\n黄金の軌道を描きます"`,
      desc: `今日はあなたらしさを出すほど流れが整います。落ち着いた実行が現実的なチャンスを呼びます。`,
      colorName: 'ネオンピンク',
      itemName: 'バッグ',
      placeName: '繁華街',
      header: '今日のインサイト',
      view: '全文を見る',
    },
  }[language] || {
    title: `"빛나는 당신의 열정이\n황금빛 궤도를 그립니다"`,
    desc: `오늘은 나만의 감각을 드러내기 좋은 날입니다. 차분하게 실행하면 실질적인 기회가 열립니다.`,
    colorName: '네온 핑크',
    itemName: '가방',
    placeName: '번화가',
    header: '오늘의 인사이트',
    view: '전체 보기',
  };

  // Mock Data (In a real app, this would come from the AI/Backend based on Saju)
  const fortuneData = {
    score: 92,
    title: cardCopy.title,
    desc: cardCopy.desc,
    color: '#FF69B4', // Neon Pink
    items: {
      color: { name: cardCopy.colorName, colorCode: '#FF69B4' },
      item: { name: cardCopy.itemName, icon: <ShoppingBag /> },
      place: { name: cardCopy.placeName, icon: <MapPin /> }
    }
  };
  const comparisonCopy = buildFortuneComparisonCopy(language, userName, fortuneData.title.replace(/"/g, ''));

  const handleShare = async () => {
    if (isSharing) return;

    setIsSharing(true);
    const invitePayload = createInvitePayload({
      source: 'daily_fortune',
      targetTab: 'home',
      inviterName: userName,
      previewTitle: fortuneData.title.replace(/"/g, ''),
      previewSummary: fortuneData.desc,
      comparisonSummary: comparisonCopy.summaryText,
    });
    const inviteLink = buildInviteLink(invitePayload);

    try {
      await api.shareCards.upsertMetadata({
        ...invitePayload,
        shareUrl: inviteLink,
        language,
      });
    } catch (error) {
      console.warn('Failed to persist share metadata before sharing.', error);
    }

    // 1. Create a container for the hidden element
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.top = '-9999px';
    container.style.left = '-9999px';
    document.body.appendChild(container);

    // 2. Render the ShareableFortune component
    try {
      const [
        { default: html2canvas },
        { default: ShareableFortune },
      ] = await Promise.all([
        import('html2canvas'),
        import('./components/ShareableFortune'),
      ]);
      const root = createRoot(container);

      await new Promise<void>((resolve) => {
        root.render(
          <ShareableFortune
            userName={userName}
            date={dateString}
            score={fortuneData.score}
            title={fortuneData.title.replace(/"/g, '')}
            description={fortuneData.desc}
            items={fortuneData.items}
            comparison={{
              myResultLabel: comparisonCopy.myResultLabel,
              friendResultLabel: comparisonCopy.friendResultLabel,
              friendResultText: comparisonCopy.friendResultText,
              summaryLabel: comparisonCopy.summaryLabel,
              summaryText: comparisonCopy.summaryText,
              inviteLabel: comparisonCopy.inviteLabel,
            }}
            language={language}
          />
        );
        setTimeout(resolve, 350);
      });

      if (container.firstElementChild) {
        const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
          scale: 2,
          useCORS: true,
          backgroundColor: null,
        });
        const shareFileName = `${comparisonCopy.fileName}_${today.toISOString().split('T')[0]}.png`;
        const dataUrl = canvas.toDataURL('image/png');
        const shareText = `${comparisonCopy.shareText}\n${inviteLink}`;

        analytics.track('share', {
          source: 'daily_fortune_card',
          targetTab: invitePayload.targetTab,
          inviteId: invitePayload.inviteId,
          comparisonMode: 'my_vs_friend',
          hasNativeShare: typeof navigator !== 'undefined' && typeof navigator.share === 'function',
        });

        let sharedNatively = false;
        if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
          try {
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], shareFileName, { type: 'image/png' });
            const sharePayload: ShareData = {
              title: 'Sazoo',
              text: comparisonCopy.shareText,
              url: inviteLink,
            };

            if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
              sharePayload.files = [file];
            }

            await navigator.share(sharePayload);
            sharedNatively = true;
          } catch (error) {
            console.warn('Native share failed, falling back to download + clipboard.', error);
          }
        }

        if (!sharedNatively) {
          await copyToClipboardSafe(inviteLink);
          const link = document.createElement('a');
          link.download = shareFileName;
          link.href = dataUrl;
          link.click();
        }
      }

      root.unmount();
    } finally {
      document.body.removeChild(container);
      setIsSharing(false);
    }
  };

  return (
    <GlassCard className={`relative overflow-hidden group !p-0 ${isDark ? 'border-slate-700' : ''}`}>
      <div className="absolute top-0 right-0 p-8 opacity-40 pointer-events-none">
        <Sparkles className="text-[#FEE500] w-40 h-40 blur-3xl opacity-60 animate-pulse" />
      </div>

      {/* Header */}
      <div className="px-7 pt-7 relative z-10 flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <Sparkles size={14} className="text-slate-400" />
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cardCopy.header}</span>
        </div>
        <div className={`${isDark ? 'bg-slate-900/50 border-slate-700' : 'bg-white/50 border-white/60'} backdrop-blur-md px-3 py-1 rounded-full border shadow-sm flex items-center gap-1`}>
          <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-800'}`}>{fortuneData.score}</span>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
          >
            <div className={`w-3 h-3 border-2 ${isDark ? 'border-slate-600 border-t-slate-400' : 'border-slate-300 border-t-slate-500'} rounded-full opacity-50`} />
          </motion.div>
        </div>
      </div>

      <div className="px-7 pb-7 relative z-10">
        {/* Title */}
        <h3 className={`text-[1.35rem] font-extrabold leading-tight mb-4 whitespace-pre-line word-keep-all ${isDark ? 'text-white' : 'text-slate-800'}`}>
          <span className={isDark ? 'text-slate-100' : 'text-slate-800'}>{fortuneData.title.split('\n')[0]}</span><br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">{fortuneData.title.split('\n')[1]}</span>
        </h3>

        {/* Description */}
        <p className={`text-sm font-medium leading-relaxed mb-8 word-keep-all ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
          {fortuneData.desc}
        </p>

        {/* Buttons */}
        <div className="flex gap-3">
          <Button
            fullWidth
            onClick={onViewFullFortune}
            className="!bg-[#6EE7B7] hover:!bg-[#34D399] !text-slate-900 !rounded-2xl !text-sm !py-3 !border-none !shadow-[0_4px_14px_0_rgba(110,231,183,0.39)]"
          >
            {cardCopy.view}
          </Button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleShare}
            disabled={isSharing}
            className={`min-h-[48px] w-14 min-w-[3.5rem] rounded-2xl border flex items-center justify-center shadow-sm transition-colors ${isDark
              ? 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
              : 'bg-white border-slate-100 text-slate-400 hover:text-slate-600'
              }`}
          >
            <Share2 size={20} />
          </motion.button>
        </div>
      </div>
    </GlassCard>
  );
};

export const LuckyItems = React.memo(({ onInfoClick }: any) => {
  const { sajuState } = useSajuData();
  const { themeMode, language = 'ko' } = useSajuSettings();
  const isDark = themeMode === 'dark';
  const luckyTitle = language === 'en' ? "Today's Pick" : language === 'ja' ? '今日のおすすめ' : '오늘의 추천';
  const items = sajuState.dailyInsights?.luckyItems || [
    ...(language === 'en' ? [
      { emoji: '🧣', name: 'Red Scarf', type: 'Item' },
      { emoji: '☕', name: 'Latte', type: 'Food' },
      { emoji: '🌳', name: 'Park', type: 'Place' },
      { emoji: '🔵', name: 'Navy Blue', type: 'Color' }
    ] : language === 'ja' ? [
      { emoji: '🧣', name: '赤いマフラー', type: 'アイテム' },
      { emoji: '☕', name: 'ラテ', type: '食べ物' },
      { emoji: '🌳', name: '公園', type: '場所' },
      { emoji: '🔵', name: 'ネイビーブルー', type: '色' }
    ] : [
      { emoji: '🧣', name: '빨간 머플러', type: '아이템' },
      { emoji: '☕', name: '라테', type: '음식' },
      { emoji: '🌳', name: '공원', type: '장소' },
      { emoji: '🔵', name: '네이비 블루', type: '색상' }
    ])
  ];
  const isLoading = !sajuState.dailyInsights && sajuState.isOnboardingComplete;

  return (
    <div className="py-2 pl-6">
      <h3 className={`typo-h2 mb-4 flex items-center justify-between pr-6 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
        <div className="flex items-center">
          {luckyTitle}
          <span className="ml-2 w-2 h-2 bg-red-400 rounded-full" />
        </div>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onInfoClick}
          className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors shadow-sm ${isDark
            ? 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-[#60A5FA]'
            : 'bg-white/60 border-white/60 text-slate-400 hover:text-[#60A5FA]'
            }`}
        >
          <Info size={16} />
        </motion.button>
      </h3>
      <div className="flex space-x-4 overflow-x-auto pb-8 pr-6 scrollbar-hide">
        {items.map((item: any, idx: number) => (
          <motion.div
            key={idx}
            initial={isLoading ? { opacity: 0.5 } : { opacity: 1 }}
            animate={isLoading ? { opacity: [0.4, 0.7, 0.4] } : { opacity: 1 }}
            transition={isLoading ? { repeat: Infinity, duration: 1.5, delay: idx * 0.1 } : {}}
            whileHover={{ y: -6, rotate: 1 }}
            className={`clay-card min-w-[130px] p-5 flex flex-col items-center justify-center border cursor-pointer group ${isDark
              ? 'bg-slate-800/80 border-slate-700 shadow-lg'
              : 'border-white'
              }`}
          >
            <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform duration-300 ${isDark
              ? 'bg-slate-700/50 text-slate-200'
              : 'bg-slate-50 text-slate-800 shadow-inner'
              }`}>
              {item.emoji}
            </div>
            <span className={`text-sm font-bold mb-1 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{item.name}</span>
            <span className={`text-[10px] font-bold uppercase ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{item.type}</span>
          </motion.div>
        ))}
      </div>
    </div>
  );
});

export const SajuGrid = React.memo(({ onInfoClick }: any) => {
  const { sajuState } = useSajuData();
  const { themeMode } = useSajuSettings();
  const { saju } = sajuState;
  const isDark = themeMode === 'dark';
  const safeSajuTip =
    sajuState.dailyInsights?.sajuTip && !containsBrokenDisplayText(sajuState.dailyInsights.sajuTip)
      ? sajuState.dailyInsights.sajuTip
      : null;

  const displaySaju = saju || {
    year: { stem: heavenlyStems[0], branch: earthlyBranches[0] },
    month: { stem: heavenlyStems[1], branch: earthlyBranches[1] },
    day: { stem: heavenlyStems[2], branch: earthlyBranches[2] },
    hour: { stem: heavenlyStems[3], branch: earthlyBranches[3] },
  };

  const pillars = [
    { label: 'Time', kr: '시주', val: displaySaju.hour, isDay: false },
    { label: 'Day', kr: '일주', val: displaySaju.day, isDay: true },
    { label: 'Month', kr: '월주', val: displaySaju.month, isDay: false },
    { label: 'Year', kr: '연주', val: displaySaju.year, isDay: false },
  ];

  return (
    <div className="px-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className={`typo-h2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>나의 사주 팔자</h3>
        <motion.button
          whileHover={{ scale: 1.1, rotate: 5 }}
          whileTap={{ scale: 0.9 }}
          onClick={onInfoClick}
          className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors shadow-sm ${isDark
            ? 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-[#60A5FA]'
            : 'bg-white/60 border-white/60 text-slate-400 hover:text-[#60A5FA]'
            }`}
        >
          <Info size={16} />
        </motion.button>
      </div>

      <GlassCard className={`!p-4 ${isDark ? 'bg-slate-900/40 border-slate-700/50' : 'bg-white/30 border-white/40'}`}>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {pillars.map((p, i) => (
            <div key={i} className="flex flex-col items-center">
              {/* Pillar Label */}
              <span className={`text-[10px] font-black mb-3 px-2 py-0.5 rounded-full ${p.isDay ? 'bg-[#98FF98] text-slate-700' : `${isDark ? 'text-slate-400 bg-slate-800' : 'text-slate-400 bg-slate-100/50'}`}`}>
                {p.kr}
              </span>

              <div className="flex flex-col gap-2 w-full">
                {/* Heavenly Stem */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`aspect-square rounded-[28px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-400
                    ${p.val.stem.bg} border ${isDark ? 'border-white/20' : 'border-white/40'}
                    ${p.isDay ? 'shadow-[0_12px_24px_-8px_rgba(152,255,152,0.4),inset_0_-8px_12px_rgba(0,0,0,0.03),inset_0_8px_12px_rgba(255,255,255,0.8)]' : 'shadow-[inset_0_-6px_10px_rgba(0,0,0,0.02),inset_0_6px_10px_rgba(255,255,255,0.7),0_10px_15px_-3px_rgba(0,0,0,0.05)]'}
                  `}
                >
                  <span className="text-[7px] font-black opacity-30 absolute top-2 uppercase tracking-wide">{p.val.stem.nameEn}</span>
                  <span className={`text-[1.65rem] font-black ${p.val.stem.text} drop-shadow-sm`}>{p.val.stem.hanja}</span>
                  {p.isDay && (
                    <motion.div
                      animate={{ opacity: [0.2, 0.4, 0.2] }}
                      transition={{ duration: 3, repeat: Infinity }}
                      className="absolute inset-0 bg-[#98FF98]/10 rounded-[28px]"
                    />
                  )}
                </motion.div>

                {/* Earthly Branch */}
                <motion.div
                  whileHover={{ y: -3, scale: 1.02 }}
                  className={`aspect-square rounded-[28px] flex flex-col items-center justify-center relative overflow-hidden transition-all duration-400
                    ${p.val.branch.bg} border ${isDark ? 'border-white/20' : 'border-white/40'}
                    shadow-[inset_0_-6px_10px_rgba(0,0,0,0.02),inset_0_6px_10px_rgba(255,255,255,0.7),0_10px_15px_-3px_rgba(0,0,0,0.05)]
                  `}
                >
                  <span className="text-[7px] font-black opacity-20 absolute top-2 uppercase tracking-wide">{p.val.branch.animal}</span>
                  <span className={`text-[1.65rem] font-black ${p.val.branch.text} drop-shadow-sm`}>{p.val.branch.hanja}</span>
                </motion.div>
              </div>

              <span className={`text-[8px] font-black mt-2.5 uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-300'}`}>{p.label}</span>
            </div>
          ))}
        </div>

        {/* Pro Insight Tip (AI) */}
        <div className={`${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-white/40 border-white/80'} backdrop-blur-md rounded-2xl py-3 px-4 flex items-start gap-2 border shadow-sm min-h-[50px]`}>
          <Sparkles size={14} className="text-amber-300 mt-0.5 flex-shrink-0" />
          <p className={`text-[11px] font-bold leading-relaxed word-keep-all ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {safeSajuTip || <>
              오늘 흐름은 아직 조용히 정리되는 중이에요. <span className="text-emerald-500/80">당신의 사주 결</span>을 더 또렷하게 읽어오는 대로 바로 전해드릴게요.
            </>}
          </p>
        </div>
      </GlassCard>
    </div>
  )
});

export const LuckyElementCard = ({ onInfoClick }: any) => {
  const { sajuState } = useSajuData();
  const { themeMode } = useSajuSettings();
  const isDark = themeMode === 'dark';
  const activeYongshin = calculateYongshin(sajuState.saju);
  const style = getElementStyle(activeYongshin);
  const safeElementTip =
    sajuState.dailyInsights?.elementTip && !containsBrokenDisplayText(sajuState.dailyInsights.elementTip)
      ? sajuState.dailyInsights.elementTip
      : null;

  return (
    <div className="px-6 mb-8">
      <GlassCard className={`!p-6 overflow-hidden relative ${isDark ? 'border-slate-700 bg-slate-900/30' : 'border-white/40'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap size={18} className="text-yellow-400 fill-yellow-400" />
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-tighter">오늘의 용신 (Lucky Element)</h3>
          </div>
          <motion.button
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={onInfoClick}
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center border transition-colors shadow-sm ${isDark
              ? 'bg-slate-800/60 border-slate-700/60 text-slate-400 hover:text-[#60A5FA]'
              : 'bg-white/60 border-white/60 text-slate-400 hover:text-[#60A5FA]'
              }`}
          >
            <Info size={14} />
          </motion.button>
        </div>

        <div className="flex items-center gap-5 mb-6">
          {/* Claymorphism Icon */}
          <motion.div
            whileHover={{ rotate: 10, scale: 1.1 }}
            className={`w-20 h-20 rounded-[30px] flex items-center justify-center text-3xl shadow-premium ${style.bg} border-2 border-white/60
                        shadow-[inset_0_-8px_12px_rgba(0,0,0,0.05),inset_0_8px_12px_rgba(255,255,255,0.8),0_15px_25px_-5px_rgba(0,0,0,0.05)]`}
          >
            <span className="drop-shadow-md">{style.icon}</span>
          </motion.div>

          <div className="flex flex-col">
            <h4 className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-800'}`}>
              {activeYongshin}({style.nameEn})
            </h4>
            <p className="text-xs font-bold text-slate-400 mt-1">
              {style.yongshinMsg}
            </p>
          </div>
        </div>

        {/* Reason Box (AI Tip) */}
        <div className={`rounded-3xl p-5 border ${isDark ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50/80 border-white/60'}`}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={12} className="text-[#98FF98]" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">오늘의 흐름 조언</span>
          </div>
          <p className={`text-[11px] font-bold leading-relaxed word-keep-all ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
            {safeElementTip || style.yongshinReason}
          </p>
        </div>

        {/* Decorative background element */}
        <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full blur-3xl opacity-10 ${style.bg} pointer-events-none`} />
      </GlassCard>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/* Chart Components                                                           */
/* -------------------------------------------------------------------------- */

export const CustomRadarChart = ({ data }: any) => {
  const elements = [
    { key: 'wood', label: 'Wood', icon: '🌳', color: '#B4F8C8' },
    { key: 'fire', label: 'Fire', icon: '🔥', color: '#FFB7B2' },
    { key: 'earth', label: 'Earth', icon: '🟫', color: '#FFF4BD' },
    { key: 'metal', label: 'Metal', icon: '⚙️', color: '#E2E8F0' },
    { key: 'water', label: 'Water', icon: '💧', color: '#A0E7E5' },
  ];

  const maxVal = 4;
  const center = 150;
  const radius = 110;
  const polyPoints = elements.map((_, i) => getCoordinates(i * 72, maxVal, maxVal, radius, center));

  const dataPoints = elements.map((el, i) => {
    // Increase the visual weight of small values (0.5 minimum)
    const val = Math.max(data[el.key] || 0.5, 0.5);
    return getCoordinates(i * 72, val, maxVal, radius, center);
  });

  return (
    <div className="w-full flex justify-center py-4">
      <div className="relative w-[300px] h-[300px]">
        <svg width="300" height="300" viewBox="0 0 300 300" className="overflow-visible">
          <defs>
            <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
              <stop offset="0%" stopColor="#98FF98" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#A0E7E5" stopOpacity="0.1" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {[1, 2, 3, 4].map((scale) => (
            <path
              key={scale}
              d={svgPath(elements.map((_, i) => getCoordinates(i * 72, scale, maxVal, radius, center)), lineCommand)}
              fill="none"
              stroke="#e2e8f0"
              strokeWidth="1"
              strokeDasharray="4 4"
              className="opacity-60"
            />
          ))}

          {polyPoints.map((p, i) => (
            <line key={i} x1={center} y1={center} x2={p.x} y2={p.y} stroke="#cbd5e1" strokeWidth="1" className="opacity-40" />
          ))}

          <motion.path
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            d={svgPath(dataPoints, bezierCommand)}
            fill="url(#radarGradient)"
            stroke="#2D6A4F"
            strokeWidth="2"
            filter="url(#glow)"
            className="drop-shadow-md"
          />

          {elements.map((el, i) => {
            const p = getCoordinates(i * 72, maxVal + 0.8, maxVal, radius, center);
            return (
              <g key={el.key}>
                <foreignObject x={p.x - 20} y={p.y - 20} width="40" height="40">
                  <div className="flex flex-col items-center justify-center w-full h-full">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-lg shadow-sm border border-white/80 bg-white/90`}>
                      {el.icon}
                    </div>
                  </div>
                </foreignObject>
                <text x={p.x} y={p.y + 24} textAnchor="middle" className="text-[10px] font-bold fill-slate-400 uppercase tracking-wider">
                  {el.label}
                </text>
                <text x={p.x} y={p.y + 36} textAnchor="middle" className="text-[12px] font-extrabold fill-slate-700">
                  {data[el.key] || 0}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

export const TimeFlowChart = ({ date }: any) => {
  const seed = date.getDate() + date.getMonth();
  const dataPoints = Array.from({ length: 12 }, (_, i) => {
    const val = Math.sin((i + seed) * 0.8) * 30 + 50 + (Math.random() * 10);
    return Math.min(100, Math.max(0, val));
  });

  const width = 300;
  const height = 120;
  const padding = 20;
  const effectiveWidth = width - (padding * 2);
  const effectiveHeight = height - (padding * 2);

  const points = dataPoints.map((val, i) => {
    const x = padding + (i / 11) * effectiveWidth;
    const y = height - padding - (val / 100) * effectiveHeight;
    return { x, y, val };
  });

  const pathD = points.reduce((acc, p, i, a) => {
    if (i === 0) return `M ${p.x},${p.y}`;
    const prev = a[i - 1];
    const cp1x = prev.x + (p.x - prev.x) / 2;
    const cp1y = prev.y;
    const cp2x = prev.x + (p.x - prev.x) / 2;
    const cp2y = p.y;
    return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
  }, '');

  const areaD = `${pathD} L ${width - padding},${height} L ${padding},${height} Z`;
  const timeLabels = ['23시', '1시', '3시', '5시', '7시', '9시', '11시', '13시', '15시', '17시', '19시', '21시'];

  return (
    <div className="w-full flex flex-col items-center">
      <div className="w-full overflow-x-auto scrollbar-hide">
        <svg width="100%" viewBox={`0 0 ${width} ${height + 30}`} className="overflow-visible">
          <defs>
            <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#98FF98" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#98FF98" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[20, 50, 80].map(y => (
            <line key={y} x1={padding} y1={height - padding - (y / 100) * effectiveHeight} x2={width - padding} y2={height - padding - (y / 100) * effectiveHeight} stroke="#eee" strokeWidth="1" strokeDasharray="4 4" />
          ))}
          <motion.path initial={{ opacity: 0 }} animate={{ opacity: 1 }} d={areaD} fill="url(#chartGradient)" />
          <motion.path initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.5, ease: "easeInOut" }} d={pathD} fill="none" stroke="#2D6A4F" strokeWidth="3" strokeLinecap="round" />
          {points.map((p, i) => (
            <motion.circle key={i} cx={p.x} cy={p.y} r="3" fill="white" stroke="#2D6A4F" strokeWidth="2" initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 1 + i * 0.05 }} />
          ))}
          {points.map((p, i) => (
            <text key={i} x={p.x} y={height + 15} textAnchor="middle" fontSize="10" fill="#94a3b8" fontWeight="bold">{timeLabels[i]}</text>
          ))}
        </svg>
      </div>
      <div className="text-[10px] text-slate-400 mt-[-10px] mb-2 font-medium bg-slate-50 px-2 py-0.5 rounded-full">
        * 시간 흐름(자시 ~ 해시)에 따른 운세 변화
      </div>
    </div>
  );
};




