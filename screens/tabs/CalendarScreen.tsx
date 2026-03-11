import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Calendar, Sparkles, TrendingUp, X, Star } from 'lucide-react';
import { GlassCard, TimeFlowChart } from '../../components';
import { calculateSaju } from '../../utils';
import { AppLanguage, useSajuSettings } from '../../context';

const CALENDAR_COPY: Record<AppLanguage, any> = {
    en: {
        title: 'Mansae Calendar',
        subtitle: 'Cosmic Calendar',
        summaryTitle: 'Today\'s Energy Summary',
        flowTitle: 'Hourly Flow',
        flowBadge: 'Today\'s Flow',
        tipLabel: 'Tip',
        tipText: 'Energy usually peaks around 2 PM. Place key tasks in that window.',
        detailTitle: 'Detailed Scores',
        scores: [
            { title: 'Wealth', score: 85, text: 'A favorable day for practical gains.' },
            { title: 'Love', score: 60, text: 'Keep communication soft and clear.' },
            { title: 'Health', score: 90, text: 'Good physical rhythm. Move your body.' },
        ],
        legendTitle: 'Day Energy Guide',
        luckyDay: 'Lucky Day',
        luckyDesc: 'Aligned with your favorable element',
        elementColor: 'Element Color',
        elementDesc: 'Dominant element of the day',
        close: 'Close',
        dailySuffix: 'day',
        ymdSeparator: '.',
        weekdays: ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'],
    },
    ko: {
        title: '만세력',
        subtitle: '우주 달력',
        summaryTitle: '오늘의 기운 요약',
        flowTitle: '시간대별 운세 흐름',
        flowBadge: '오늘의 흐름',
        tipLabel: 'Tip',
        tipText: '오후 2시 전후로 기운이 상승해요. 중요한 일정을 그 시간대에 배치해보세요.',
        detailTitle: '상세 운세 점수',
        scores: [
            { title: '재물운', score: 85, text: '실속 있는 결과를 기대하기 좋아요.' },
            { title: '연애운', score: 60, text: '부드러운 대화가 중요해요.' },
            { title: '건강운', score: 90, text: '컨디션이 좋아 활동하기 좋은 날이에요.' },
        ],
        legendTitle: '일진(Day Energy) 가이드',
        luckyDay: '행운일',
        luckyDesc: '나의 용신과 잘 맞는 날',
        elementColor: '오행 색상',
        elementDesc: '그날의 중심 오행 기운',
        close: '닫기',
        dailySuffix: '일',
        ymdSeparator: '.',
        weekdays: ['일', '월', '화', '수', '목', '금', '토'],
    },
    ja: {
        title: '万歳暦',
        subtitle: 'コズミックカレンダー',
        summaryTitle: '本日のエネルギー要約',
        flowTitle: '時間帯別の運勢',
        flowBadge: 'Today\'s Flow',
        tipLabel: 'Tip',
        tipText: '14時ごろにエネルギーが上がりやすいです。重要な予定はその時間帯へ。',
        detailTitle: '詳細スコア',
        scores: [
            { title: '金運', score: 85, text: '現実的な成果を狙いやすい日です。' },
            { title: '恋愛運', score: 60, text: 'やわらかな対話を意識しましょう。' },
            { title: '健康運', score: 90, text: '体調が安定し、活動しやすい日です。' },
        ],
        legendTitle: '日運エネルギーガイド',
        luckyDay: 'Lucky Day',
        luckyDesc: '有利な要素と調和する日',
        elementColor: '五行カラー',
        elementDesc: 'その日の中心エレメント',
        close: '閉じる',
        dailySuffix: '日',
        ymdSeparator: '.',
        weekdays: ['日', '月', '火', '水', '木', '金', '土'],
    },
};

const DateDetailSheet = ({ date, onClose, language = 'ko' }: any) => {
    const copy = CALENDAR_COPY[language as AppLanguage] ?? CALENDAR_COPY.ko;
    const dailySaju = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0);
    const dayStem = dailySaju.day.stem;
    const dayBranch = dailySaju.day.branch;
    const formattedDate = `${date.getFullYear()}${copy.ymdSeparator} ${String(date.getMonth() + 1).padStart(2, '0')}${copy.ymdSeparator} ${String(date.getDate()).padStart(2, '0')}`;
    const dayOfWeek = copy.weekdays[date.getDay()];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center"
        >
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="bg-white w-full max-w-[480px] rounded-t-[32px] p-6 pb-10 relative z-10 shadow-2xl h-[85vh] overflow-y-auto"
            >
                <div className="w-full flex justify-center mb-6" onClick={onClose}>
                    <div className="w-12 h-1.5 bg-slate-200 rounded-full" />
                </div>

                <div className="flex justify-between items-start mb-6">
                    <div>
                        <div className="flex items-center space-x-2 text-slate-500 font-bold text-sm mb-1">
                            <Calendar size={14} />
                            <span>{formattedDate}</span>
                            <span className="text-[#98FF98] bg-slate-100 px-1.5 rounded text-[10px]">{dayOfWeek}</span>
                        </div>
                        <h2 className="text-2xl font-black text-slate-800">
                            {dayStem.kor}{dayBranch.kor} <span className="text-lg font-normal text-slate-400">({dayStem.hanja}{dayBranch.hanja})</span>
                        </h2>
                        <span className={`text-sm font-bold ${dayStem.text} flex items-center mt-1`}>
                            {dayStem.icon} {dayStem.nameEn} {dayBranch.animal}
                        </span>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-100 rounded-full text-slate-400 hover:bg-slate-200 transition-colors" aria-label={copy.close}>
                        <X size={20} />
                    </button>
                </div>

                <div className="space-y-6">
                    <div className={`p-5 rounded-2xl ${dayStem.bg} bg-opacity-30 border border-white/50 shadow-sm`}>
                        <div className="flex items-start space-x-3">
                            <div className="p-2 bg-white rounded-xl shadow-sm">
                                <Sparkles className={`${dayStem.text}`} size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-700 mb-1">{copy.summaryTitle}</h4>
                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                    "{dayStem.desc}"의 흐름이 강한 날입니다. 실행력을 유지하면 결과가 따르기 좋아요.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-700 flex items-center">
                                <TrendingUp className="mr-2 text-[#98FF98]" size={18} />
                                {copy.flowTitle}
                            </h3>
                            <span className="text-[10px] bg-slate-100 px-2 py-1 rounded-full text-slate-500 font-bold">{copy.flowBadge}</span>
                        </div>
                        <TimeFlowChart date={date} />
                        <div className="mt-4 p-3 bg-slate-50 rounded-xl text-xs text-slate-500 leading-relaxed">
                            <span className="font-bold text-slate-700">{copy.tipLabel}:</span> {copy.tipText}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <h3 className="font-bold text-slate-700 text-lg">{copy.detailTitle}</h3>
                        {copy.scores.map((item: any, idx: number) => (
                            <div key={idx} className="flex items-center p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                                <div className={`w-12 h-12 rounded-full ${idx === 0 ? 'bg-yellow-100 text-yellow-700' : idx === 1 ? 'bg-pink-100 text-pink-700' : 'bg-green-100 text-green-700'} flex flex-col items-center justify-center mr-4 flex-shrink-0`}>
                                    <span className="text-[10px] font-bold opacity-70">{item.title}</span>
                                    <span className="text-lg font-black">{item.score}</span>
                                </div>
                                <p className="text-sm text-slate-600 font-medium">{item.text}</p>
                            </div>
                        ))}
                    </div>

                    <div className="h-10" />
                </div>
                <div className="absolute top-0 left-0 w-full h-8 bg-gradient-to-b from-white/80 to-transparent pointer-events-none rounded-t-[32px]" />
            </motion.div>
        </motion.div>
    );
};

const CalendarScreen = () => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const { language = 'ko' } = useSajuSettings();
    const copy = CALENDAR_COPY[language as AppLanguage] ?? CALENDAR_COPY.ko;

    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDay = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();

    const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
    const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

    const days: any[] = [];
    for (let i = 0; i < startDay; i++) {
        days.push({ day: prevMonthLastDay - startDay + i + 1, type: 'prev' });
    }
    for (let i = 1; i <= daysInMonth; i++) {
        days.push({ day: i, type: 'current', date: new Date(year, month, i) });
    }
    const totalSlots = Math.ceil(days.length / 7) * 7;
    const remaining = totalSlots - days.length;

    for (let i = 1; i <= remaining; i++) {
        days.push({ day: i, type: 'next' });
    }

    const getDotColor = (el: string) => {
        switch (el) {
            case '목': return 'bg-[#86EFAC]';
            case '화': return 'bg-[#FCA5A5]';
            case '토': return 'bg-[#FCD34D]';
            case '금': return 'bg-[#CBD5E1]';
            case '수': return 'bg-[#93C5FD]';
            default: return 'bg-slate-200';
        }
    };

    return (
        <div className="p-6 h-full overflow-y-auto pb-32 relative [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
            <div className="flex items-center justify-between mb-6 px-2">
                <div>
                    <h2 className="text-2xl font-black text-slate-800">{copy.title}</h2>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{copy.subtitle}</p>
                </div>
                <div className="flex items-center gap-2 bg-white/50 rounded-full p-1 border border-white/60 backdrop-blur-md shadow-sm">
                    <button onClick={prevMonth} className="p-2 rounded-full hover:bg-white/60 transition-colors text-slate-600">
                        <ChevronRight className="w-4 h-4 rotate-180" />
                    </button>
                    <span className="text-sm font-bold text-slate-800 min-w-[80px] text-center">
                        {year}.{String(month + 1).padStart(2, '0')}
                    </span>
                    <button onClick={nextMonth} className="p-2 rounded-full hover:bg-white/60 transition-colors text-slate-600">
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <GlassCard className="!p-4 !bg-white/40 !backdrop-blur-xl border-white/60 overflow-hidden">
                <div className="grid grid-cols-7 mb-4">
                    {copy.weekdays.map((d: string, i: number) => (
                        <div key={d + i} className={`text-center text-[10px] font-extrabold tracking-wider ${i === 0 ? 'text-rose-500' : 'text-slate-500'}`}>
                            {d}
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-7 gap-y-2 gap-x-1">
                    {days.map((item, idx) => {
                        if (item.type !== 'current') return <div key={idx} className="min-h-[64px]" />;

                        const { date } = item;
                        const dailySaju = calculateSaju(date.getFullYear(), date.getMonth() + 1, date.getDate(), 12, 0);
                        const dayStem = dailySaju.day.stem;
                        const dayBranch = dailySaju.day.branch;

                        const isLucky = (date.getDate() + month) % 5 === 0;
                        const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

                        return (
                            <motion.div
                                key={`${date.toISOString()}-${idx}`}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setSelectedDate(date)}
                                className={`
                                    flex flex-col items-center justify-start py-2 rounded-xl relative min-h-[64px] cursor-pointer
                                    hover:bg-white/40 transition-colors
                                    ${isSelected ? 'bg-white/80 shadow-inner ring-2 ring-[#6EE7B7] z-10' : ''}
                                `}
                            >
                                <span className={`text-sm font-bold mb-1 ${idx % 7 === 0 ? 'text-rose-500' : 'text-slate-800'}`}>
                                    {item.day}
                                </span>

                                <div className="flex flex-col items-center gap-1">
                                    <div className={`w-2 h-2 rounded-full shadow-[0_0_5px_rgba(0,0,0,0.1)] ${getDotColor(dayStem.element)}`} />
                                    <span className="text-[10px] text-slate-500 font-bold opacity-90">
                                        {dayStem.hanja}{dayBranch.hanja}
                                    </span>
                                </div>

                                <div className="absolute -top-1 -right-1">
                                    {isLucky && (
                                        <motion.div
                                            initial={{ scale: 0 }} animate={{ scale: 1 }}
                                            className="bg-yellow-100 p-0.5 rounded-full border border-yellow-200 shadow-sm"
                                        >
                                            <Star className="w-2.5 h-2.5 text-yellow-500 fill-yellow-500" />
                                        </motion.div>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </GlassCard>

            <div className="mt-6 px-2">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#6EE7B7]" />
                    {copy.legendTitle}
                </h3>
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-white/40 rounded-xl p-3 flex items-center gap-3 border border-white/50 shadow-sm">
                        <div className="bg-yellow-100 p-2 rounded-full text-yellow-500">
                            <Star className="w-4 h-4 fill-yellow-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{copy.luckyDay}</span>
                            <span className="text-[10px] text-slate-500">{copy.luckyDesc}</span>
                        </div>
                    </div>
                    <div className="bg-white/40 rounded-xl p-3 flex items-center gap-3 border border-white/50 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <div className="w-3 h-3 rounded-full bg-[#6EE7B7] shadow-sm" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-800">{copy.elementColor}</span>
                            <span className="text-[10px] text-slate-500">{copy.elementDesc}</span>
                        </div>
                    </div>
                </div>
            </div>

            <AnimatePresence>
                {selectedDate && <DateDetailSheet date={selectedDate} onClose={() => setSelectedDate(null)} language={language} />}
            </AnimatePresence>
        </div>
    );
};

export default CalendarScreen;

