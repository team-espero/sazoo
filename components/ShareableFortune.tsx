import React, { forwardRef } from 'react';
import { Sparkles, MapPin, ShoppingBag } from 'lucide-react';
import { AppLanguage } from '../context';

interface ShareableFortuneProps {
    userName: string;
    date: string;
    score: number;
    title: string;
    description: string;
    items: {
        color: { name: string; colorCode: string };
        item: { name: string; icon: React.ReactNode };
        place: { name: string; icon: React.ReactNode };
    };
    comparison?: {
        myResultLabel: string;
        friendResultLabel: string;
        friendResultText: string;
        summaryLabel: string;
        summaryText: string;
        inviteLabel: string;
    };
    language?: AppLanguage;
}

const SHARE_COPY: Record<AppLanguage, {
    dailyFortune: string;
    userFortuneSuffix: string;
    luckScore: string;
    color: string;
    item: string;
    place: string;
}> = {
    en: {
        dailyFortune: 'DAILY FORTUNE',
        userFortuneSuffix: "'s Fortune",
        luckScore: 'Luck Score',
        color: 'Color',
        item: 'Item',
        place: 'Place',
    },
    ko: {
        dailyFortune: '오늘의 운세',
        userFortuneSuffix: '님의 운세',
        luckScore: '행운 점수',
        color: '색상',
        item: '아이템',
        place: '장소',
    },
    ja: {
        dailyFortune: '本日の運勢',
        userFortuneSuffix: 'さんの運勢',
        luckScore: '運勢スコア',
        color: 'カラー',
        item: 'アイテム',
        place: '場所',
    },
};

const ShareableFortune = forwardRef<HTMLDivElement, ShareableFortuneProps>(({
    userName,
    date,
    score,
    title,
    description,
    items,
    comparison,
    language = 'ko',
}, ref) => {
    const copy = SHARE_COPY[language] ?? SHARE_COPY.ko;

    return (
        <div
            ref={ref}
            className="w-[375px] h-[640px] bg-gradient-to-b from-[#FFF0F5] to-[#E0F7FA] p-8 flex flex-col justify-between relative overflow-hidden font-outfit text-slate-800"
            style={{ fontFamily: 'Noto Sans KR, sans-serif' }}
        >
            <div className="flex flex-col items-center space-y-2 pt-4">
                <div className="px-4 py-1.5 rounded-full border border-slate-300 bg-white/50 backdrop-blur-sm">
                    <span className="text-[10px] font-black tracking-[0.2em] text-slate-500">{copy.dailyFortune}</span>
                </div>
                <h2 className="text-base font-bold text-slate-600">{date}</h2>
                <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                    <p className="text-lg font-bold">
                        <span className="font-black">{userName}</span>{copy.userFortuneSuffix}
                    </p>
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                </div>
            </div>

            <div className="relative bg-white/40 backdrop-blur-md rounded-[40px] p-8 flex flex-col items-center text-center shadow-lg border border-white/60">
                <div className="flex flex-col items-center mb-6">
                    <span className="text-[5rem] font-black leading-none tracking-tighter text-slate-800">{score}</span>
                    <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-2">{copy.luckScore}</span>
                </div>

                <h3 className="text-xl font-black leading-snug mb-4 word-keep-all text-slate-900">{title}</h3>

                <p className="text-xs font-medium text-slate-600 leading-relaxed mb-5 word-keep-all opacity-90">{description}</p>

                {comparison && (
                    <div className="mb-6 w-full space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="rounded-[24px] border border-white/70 bg-white/75 p-4 text-left shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{comparison.myResultLabel}</p>
                                <p className="mt-2 text-sm font-black leading-snug text-slate-900">{title}</p>
                            </div>
                            <div className="rounded-[24px] bg-slate-900/92 p-4 text-left text-white shadow-sm">
                                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">{comparison.friendResultLabel}</p>
                                <p className="mt-2 text-xs font-medium leading-relaxed text-white/90">{comparison.friendResultText}</p>
                            </div>
                        </div>
                        <div className="rounded-[24px] bg-[#0f172a]/92 p-4 text-left text-white shadow-sm">
                            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-emerald-200">{comparison.summaryLabel}</p>
                            <p className="mt-2 text-xs font-medium leading-relaxed text-white/90">{comparison.summaryText}</p>
                            <p className="mt-3 text-[10px] font-black text-[#98FF98]">{comparison.inviteLabel}</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-center gap-6 w-full">
                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-white">
                            <div className="w-5 h-5 rounded-full" style={{ backgroundColor: items.color.colorCode }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{copy.color}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-white text-slate-700">
                            <ShoppingBag size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{copy.item}</span>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center border border-white text-slate-700">
                            <MapPin size={20} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500">{copy.place}</span>
                    </div>
                </div>
            </div>

            <div className="flex items-center justify-between px-2 pt-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#98FF98] rounded-xl flex items-center justify-center shadow-inner">
                        <Sparkles size={20} className="text-white fill-white" />
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-slate-900">Sazoo</span>
                        <span className="text-[8px] font-bold text-slate-400 tracking-wider">CYBER SHAMANISM</span>
                    </div>
                </div>
                <div className="bg-slate-900 rounded-full px-4 py-1.5">
                    <span className="text-[10px] font-bold text-[#98FF98]">sazoo.app</span>
                </div>
            </div>
        </div>
    );
});

export default ShareableFortune;
