import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '../components';
import { AppLanguage, useSajuActions, useSajuSettings } from '../context';
import { getPendingInvite } from '../src/services/invite';

const LANDING_COPY: Record<AppLanguage, {
    subtitle: string;
    headlinePrefix: string;
    headlineEmphasis: string;
    cta: string;
    inviteCta: string;
    inviteEyebrow: string;
    inviteTitle: string;
    inviteBodySuffix: string;
    languageLabel: string;
}> = {
    en: {
        subtitle: 'Destiny Design Studio',
        headlinePrefix: 'Design your destiny',
        headlineEmphasis: 'your way',
        cta: 'Start Reading',
        inviteCta: 'Open shared comparison',
        inviteEyebrow: 'Invite link',
        inviteTitle: 'A shared comparison is waiting for you.',
        inviteBodySuffix: 'Start now and Sazoo will restore the shared result after onboarding.',
        languageLabel: 'Language',
    },
    ko: {
        subtitle: '운명 디자인 스튜디오',
        headlinePrefix: '당신만의 운명을',
        headlineEmphasis: '직접 설계해보세요',
        cta: '운세 시작하기',
        inviteCta: '공유된 비교 결과 열기',
        inviteEyebrow: '초대 링크',
        inviteTitle: '공유된 비교 결과가 기다리고 있어요.',
        inviteBodySuffix: '지금 시작하면 온보딩 뒤에 공유된 결과 화면을 바로 복원해드릴게요.',
        languageLabel: '언어 선택',
    },
    ja: {
        subtitle: '運命デザインスタジオ',
        headlinePrefix: 'あなたの運命を',
        headlineEmphasis: '自分らしくデザイン',
        cta: '鑑定を始める',
        inviteCta: '共有された比較結果を開く',
        inviteEyebrow: '招待リンク',
        inviteTitle: '共有された比較結果が届いています。',
        inviteBodySuffix: '今始めると、オンボーディング後に共有画面をすぐ復元します。',
        languageLabel: '言語選択',
    },
};

const LANGUAGE_OPTIONS: { value: AppLanguage; label: string }[] = [
    { value: 'en', label: 'English' },
    { value: 'ko', label: '한국어' },
    { value: 'ja', label: '日本語' },
];

const LandingScreen = ({ onStart }: { onStart: () => void }) => {
    const [isVideoPlaying, setIsVideoPlaying] = useState(false);
    const [pendingInvite, setPendingInvite] = useState<any>(null);
    const { language = 'ko' } = useSajuSettings();
    const { setLanguage } = useSajuActions();
    const copy = LANDING_COPY[language as AppLanguage] ?? LANDING_COPY.ko;

    useEffect(() => {
        setPendingInvite(getPendingInvite());
    }, []);

    return (
        <motion.div
            className="absolute inset-0 flex flex-col overflow-hidden bg-transparent"
            exit={{ opacity: 0 }}
        >
            <div className="absolute top-0 left-0 w-full h-[70%] z-0 bg-[#FFF0F5]">
                <div className="absolute inset-0 bg-gradient-to-b from-[#FFF0F5] via-[#E0F7FA] to-white/0" />

                <motion.video
                    initial={{ scale: 1.05, opacity: 0 }}
                    animate={{ scale: 1, opacity: isVideoPlaying ? 1 : 0 }}
                    transition={{ duration: 0.45 }}
                    src="/login_video.mp4"
                    className="w-full h-full object-cover object-center relative z-10 transition-opacity duration-700"
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls={false}
                    onPlay={() => setIsVideoPlaying(true)}
                />
            </div>

            <div className="absolute bottom-0 w-full z-20 flex flex-col items-center text-center">
                <div className="absolute bottom-0 left-0 w-full h-[150%] bg-gradient-to-t from-[#FFF3E6] via-[#FFF3E6]/90 via-60% to-transparent -z-10 pointer-events-none" />

                <div className="w-full px-6 pb-10 pt-12 sm:px-8 sm:pb-12">
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.8 }}
                        className="mb-8"
                    >
                        <h1 className="mb-2 text-[4rem] leading-none font-black tracking-tighter text-holographic drop-shadow-sm sm:text-[5rem]">Sazoo</h1>
                        <p className="text-lg sm:text-xl text-slate-500 font-extrabold tracking-wide">
                            {copy.subtitle}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.6, duration: 0.5 }}
                        className="w-full space-y-4"
                    >
                        {pendingInvite && (
                            <div className="rounded-[28px] border border-white/80 bg-white/72 p-5 text-left shadow-lg backdrop-blur-md">
                                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-emerald-500">{copy.inviteEyebrow}</p>
                                <h3 className="mb-2 text-lg font-black leading-snug text-slate-900">{copy.inviteTitle}</h3>
                                <p className="text-sm font-medium leading-relaxed text-slate-500">
                                    {pendingInvite.comparisonSummary}
                                    {' '}
                                    {copy.inviteBodySuffix}
                                </p>
                            </div>
                        )}
                        <div className="mb-5 text-left">
                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2">{copy.languageLabel}</p>
                            <div className="grid grid-cols-3 gap-2 rounded-2xl bg-white/60 border border-white/80 p-1.5 backdrop-blur-md">
                                {LANGUAGE_OPTIONS.map((option) => {
                                    const isActive = language === option.value;
                                    return (
                                        <button
                                            key={option.value}
                                            type="button"
                                            onClick={() => setLanguage(option.value)}
                                            className={`min-h-[44px] rounded-xl px-2 text-sm font-bold transition-all ${isActive
                                                ? 'bg-white text-slate-900 shadow-md border border-slate-100'
                                                : 'text-slate-500 hover:text-slate-700'
                                                }`}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <h2 className="text-slate-800 font-bold text-base sm:text-lg mb-6 leading-relaxed">
                            {copy.headlinePrefix}{' '}
                            <span className="text-emerald-500 underline decoration-wavy decoration-2 underline-offset-4">{copy.headlineEmphasis}</span>
                        </h2>
                        <Button fullWidth onClick={onStart} variant="universe" className="!py-3">
                            {pendingInvite ? copy.inviteCta : copy.cta}
                        </Button>
                    </motion.div>
                </div>
            </div>
        </motion.div>
    );
};

export default LandingScreen;

