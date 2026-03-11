import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Calendar, Chrome, Clock, MessageCircle, User } from 'lucide-react';
import {
  Button,
  GenderCard,
  GlassCard,
  InputField,
  JellyToggle,
  SegmentedControl,
  TagCloud,
  WheelPicker,
} from '../components';
import AssetPreloader from '../components/AssetPreloader';
import { AppLanguage, useSajuActions, useSajuSettings } from '../context';
import { useAuth } from '../src/auth/AuthProvider';
import { analytics } from '../src/services/analytics';

const ONBOARDING_COPY: Record<AppLanguage, any> = {
  en: {
    step0Title: 'Connect in 3 seconds',
    continueKakao: 'Continue with Kakao',
    continueGoogle: 'Continue with Google',
    continueGuest: 'Continue as Guest',
    authConnected: 'Connected. This profile will safely follow your account.',
    kakaoSetupPending: 'Kakao setup pending',
    step1Title: 'What should we call you?',
    step1Desc: 'Create your profile to begin your reading.',
    nameLabel: 'Name',
    namePlaceholder: 'Enter your name',
    genderLabel: 'Gender',
    next: 'Next',
    step2Title: 'What is your top concern?',
    concerns: [
      { id: 'love', label: 'Love', icon: '❤️', color: 'bg-[#FFB7B2]' },
      { id: 'wealth', label: 'Wealth', icon: '💰', color: 'bg-[#FFF4BD]' },
      { id: 'career', label: 'Career', icon: '💼', color: 'bg-[#A0E7E5]' },
      { id: 'health', label: 'Health', icon: '🧘', color: 'bg-[#B4F8C8]' },
    ],
    calendarTypeLabel: 'Calendar Type',
    calendarTypes: ['Solar', 'Lunar', 'Leap Month'],
    birthDateLabel: 'Date of Birth',
    directInputLabel: 'Type directly',
    year: 'Year',
    month: 'Month',
    day: 'Day',
    timeOfBirthLabel: 'Time of Birth',
    timeDirectInputLabel: 'Enter time directly',
    timeUnknown: 'Time unknown',
    knownTime: 'Known time',
    hour: 'Hour',
    minute: 'Min',
    analyze: 'Start Analysis',
  },
  ko: {
    step0Title: '3초 만에 연결하기',
    continueKakao: '카카오로 계속하기',
    continueGoogle: 'Google로 계속하기',
    continueGuest: '게스트로 계속하기',
    authConnected: '연결되었어요. 지금 만드는 프로필은 계정에 안전하게 이어집니다.',
    kakaoSetupPending: '카카오 설정 대기중',
    step1Title: '어떻게 불러드릴까요?',
    step1Desc: '나만의 프로필을 만들어보세요.',
    nameLabel: '이름',
    namePlaceholder: '이름을 입력해주세요',
    genderLabel: '성별',
    next: '다음 단계로',
    step2Title: '요즘 가장 고민인 건 무엇인가요?',
    concerns: [
      { id: 'love', label: '연애', icon: '❤️', color: 'bg-[#FFB7B2]' },
      { id: 'wealth', label: '재물', icon: '💰', color: 'bg-[#FFF4BD]' },
      { id: 'career', label: '진로', icon: '💼', color: 'bg-[#A0E7E5]' },
      { id: 'health', label: '건강', icon: '🧘', color: 'bg-[#B4F8C8]' },
    ],
    calendarTypeLabel: '달력 종류',
    calendarTypes: ['양력', '음력', '윤달'],
    birthDateLabel: '생년월일',
    directInputLabel: '직접 입력',
    year: '년',
    month: '월',
    day: '일',
    timeOfBirthLabel: '태어난 시간',
    timeDirectInputLabel: '시간 직접 입력',
    timeUnknown: '시간 모름',
    knownTime: '시간 알고 있음',
    hour: '시',
    minute: '분',
    analyze: '운세 분석하기',
  },
  ja: {
    step0Title: '3秒で接続',
    continueKakao: 'Kakaoで続行',
    continueGoogle: 'Googleで続行',
    continueGuest: 'ゲストで続行',
    authConnected: '接続できました。今のプロフィールはこのままアカウントへ引き継がれます。',
    kakaoSetupPending: 'Kakao設定待ち',
    step1Title: 'お名前を教えてください',
    step1Desc: 'プロフィールを作成して始めましょう。',
    nameLabel: '名前',
    namePlaceholder: '名前を入力してください',
    genderLabel: '性別',
    next: '次へ',
    step2Title: '今いちばん気になることは？',
    concerns: [
      { id: 'love', label: '恋愛', icon: '❤️', color: 'bg-[#FFB7B2]' },
      { id: 'wealth', label: '金運', icon: '💰', color: 'bg-[#FFF4BD]' },
      { id: 'career', label: '仕事', icon: '💼', color: 'bg-[#A0E7E5]' },
      { id: 'health', label: '健康', icon: '🧘', color: 'bg-[#B4F8C8]' },
    ],
    calendarTypeLabel: '暦タイプ',
    calendarTypes: ['太陽暦', '太陰暦', '閏月'],
    birthDateLabel: '生年月日',
    directInputLabel: '直接入力',
    year: '年',
    month: '月',
    day: '日',
    timeOfBirthLabel: '出生時刻',
    timeDirectInputLabel: '時刻を直接入力',
    timeUnknown: '時間不明',
    knownTime: '時間あり',
    hour: '時',
    minute: '分',
    analyze: '鑑定を開始',
  },
};

const OnboardingScreen = ({ onComplete }: any) => {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [socialLoginError, setSocialLoginError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [gender, setGender] = useState<any>(null);
  const [concern, setConcern] = useState<string | null>(null);
  const [calendarTypeKey, setCalendarTypeKey] = useState<'solar' | 'lunar' | 'leap'>('solar');
  const [date, setDate] = useState({ year: 1998, month: 5, day: 21 });
  const [time, setTime] = useState({ ampm: 'AM', hour: 10, minute: '30' });
  const [isTimeUnknown, setIsTimeUnknown] = useState(false);
  const knowledgeLevel = 'newbie' as const;

  const { updateProfileBatch, updateConcern, calculateAndSetSaju } = useSajuActions();
  const { language = 'ko' } = useSajuSettings();
  const {
    status: authStatus,
    session,
    error: authError,
    pendingProvider,
    isGoogleReady,
    isKakaoReady,
    signInWithGoogle,
    signInWithKakao,
    clearError,
  } = useAuth();

  const copy = ONBOARDING_COPY[language as AppLanguage] ?? ONBOARDING_COPY.ko;
  const calendarTypeMap = {
    solar: '양력',
    lunar: '음력',
    leap: '윤달',
  } as const;

  const calendarOptions = copy.calendarTypes;
  const selectedCalendarLabel = calendarTypeKey === 'solar'
    ? calendarOptions[0]
    : calendarTypeKey === 'lunar'
      ? calendarOptions[1]
      : calendarOptions[2];

  const years = useMemo(() => Array.from({ length: 100 }, (_, index) => 2026 - index), []);
  const months = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const hours = useMemo(() => Array.from({ length: 12 }, (_, index) => index + 1), []);
  const minutes = useMemo(() => Array.from({ length: 60 }, (_, index) => String(index).padStart(2, '0')), []);
  const ampms = useMemo(() => ['AM', 'PM'], []);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month, 0).getDate();
  const maxDays = getDaysInMonth(date.year, date.month);
  const days = useMemo(() => Array.from({ length: maxDays }, (_, index) => index + 1), [maxDays]);

  useEffect(() => {
    if (date.day > maxDays) {
      setDate((prev) => ({ ...prev, day: maxDays }));
    }
  }, [date.day, maxDays]);

  useEffect(() => {
    const video = document.createElement('video');
    video.src = '/checking_saju.mp4';
    video.preload = 'auto';
    video.load();
  }, []);

  useEffect(() => {
    analytics.trackOnboardingStep(step, 'view', { language });
  }, [language, step]);

  useEffect(() => {
    if (step === 0 && authStatus === 'authenticated') {
      setStep(1);
    }
  }, [authStatus, step]);

  useEffect(() => {
    if (authError) {
      setSocialLoginError(authError);
    }
  }, [authError]);

  const nextStep = () => {
    analytics.trackOnboardingStep(step, 'complete', { language });
    setStep((prev) => prev + 1);
  };

  const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const parseDigits = (value: string) => value.replace(/\D/g, '');

  const updateDateField = (key: 'year' | 'month' | 'day', rawValue: string) => {
    const digits = parseDigits(rawValue);
    if (!digits) return;

    setDate((prev) => {
      if (key === 'year') {
        return { ...prev, year: Number(digits.slice(0, 4)) };
      }

      if (key === 'month') {
        const month = clamp(Number(digits.slice(0, 2)), 1, 12);
        const day = clamp(prev.day, 1, getDaysInMonth(prev.year, month));
        return { ...prev, month, day };
      }

      const nextDay = clamp(Number(digits.slice(0, 2)), 1, getDaysInMonth(prev.year, prev.month));
      return { ...prev, day: nextDay };
    });
  };

  const updateTimeField = (key: 'hour' | 'minute', rawValue: string) => {
    const digits = parseDigits(rawValue);
    if (!digits) return;

    setTime((prev) => {
      if (key === 'hour') {
        return { ...prev, hour: clamp(Number(digits.slice(0, 2)), 1, 12) };
      }

      return {
        ...prev,
        minute: String(clamp(Number(digits.slice(0, 2)), 0, 59)).padStart(2, '0'),
      };
    });
  };

  const handleGoogleLogin = async () => {
    clearError();
    setSocialLoginError(null);
    const result = await signInWithGoogle();
    if (!result.ok && result.error) {
      setSocialLoginError(result.error);
    }
  };

  const handleKakaoLogin = async () => {
    clearError();
    setSocialLoginError(null);
    const result = await signInWithKakao();
    if (!result.ok && result.error) {
      setSocialLoginError(result.error);
    }
  };

  const handleAnalysisStart = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      analytics.trackOnboardingStep(step, 'complete', { language, action: 'start_analysis' });

      const birthDatePayload = {
        ...date,
        ...time,
        hour: isTimeUnknown ? 0 : time.hour,
        minute: isTimeUnknown ? 0 : Number(time.minute),
      };

      await updateProfileBatch({
        name,
        gender,
        birthDate: birthDatePayload,
        calendarType: calendarTypeMap[calendarTypeKey],
        isTimeUnknown,
        knowledgeLevel,
      });
      updateConcern(concern);
      await calculateAndSetSaju(birthDatePayload);
      onComplete();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full w-full flex flex-col p-6 pt-10 pb-24 overflow-y-auto sm:p-8 sm:pt-12 sm:pb-28">
      <div className="flex-1 flex flex-col justify-center max-w-md mx-auto w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div key="login" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="flex flex-col items-center space-y-8">
              <div className="relative mb-4">
                <div className="w-40 h-40 rounded-full glass-panel flex items-center justify-center relative overflow-hidden shadow-2xl">
                  <img src="/12.%20Cyber-Bokjumeoni.png" alt="Bokjumeoni" className="w-32 h-32 object-cover" />
                </div>
              </div>
              <div className="text-center w-full">
                <h2 className="typo-h2 mb-6">{copy.step0Title}</h2>
                <div className="w-full space-y-4">
                  <Button fullWidth onClick={handleKakaoLogin} variant="kakao" disabled={pendingProvider !== null}>
                    <MessageCircle fill="#391B1B" size={24} className="absolute left-6 text-[#391B1B]" />
                    <span className="text-[#391B1B]">{isKakaoReady ? copy.continueKakao : copy.kakaoSetupPending}</span>
                  </Button>
                  <Button fullWidth onClick={handleGoogleLogin} variant="google" disabled={!isGoogleReady || pendingProvider !== null}>
                    <Chrome size={24} className="absolute left-6 text-slate-600" />
                    <span className="text-slate-600">{copy.continueGoogle}</span>
                  </Button>
                  <Button fullWidth onClick={nextStep} variant="glass" disabled={pendingProvider !== null}>
                    <span>{copy.continueGuest}</span>
                  </Button>
                  {authStatus === 'authenticated' && (
                    <p className="px-2 text-xs font-semibold text-emerald-600 text-center">
                      {copy.authConnected}
                      {session?.email ? ` (${session.email})` : ''}
                    </p>
                  )}
                  {socialLoginError && (
                    <p className="px-2 text-xs font-medium text-rose-500 text-center">{socialLoginError}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div key="profile" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full">
              <div className="mb-8">
                <h2 className="typo-h2 mb-2">{copy.step1Title}</h2>
                <p className="text-slate-500 text-sm font-medium">{copy.step1Desc}</p>
              </div>
              <div className="space-y-8">
                <InputField label={copy.nameLabel} icon={User} placeholder={copy.namePlaceholder} value={name} onChange={(event: any) => setName(event.target.value)} />
                <div>
                  <label className="text-xs font-extrabold text-emerald-600 uppercase block mb-3">{copy.genderLabel}</label>
                  <div className="flex gap-4">
                    <GenderCard type="male" selected={gender === 'male'} onClick={() => setGender('male')} />
                    <GenderCard type="female" selected={gender === 'female'} onClick={() => setGender('female')} />
                  </div>
                </div>
              </div>
              <div className="mt-10">
                <Button fullWidth onClick={nextStep} variant="primary" disabled={!name || !gender}>{copy.next}</Button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="concern" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full">
              <div className="mb-8">
                <h2 className="typo-h2 mb-2">{copy.step2Title}</h2>
              </div>
              <div className="flex-1 flex flex-col justify-center py-8">
                <TagCloud tags={copy.concerns} selectedTag={concern} onSelect={setConcern} />
              </div>
              <div className="mt-10">
                <Button fullWidth onClick={nextStep} variant="primary" disabled={!concern}>{copy.next}</Button>
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div key="input" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} className="w-full">
              <GlassCard className="space-y-3 !p-4">
                <div>
                  <label className="text-[10px] font-extrabold text-emerald-600 uppercase mb-1 block">{copy.calendarTypeLabel}</label>
                  <SegmentedControl
                    options={calendarOptions}
                    selected={selectedCalendarLabel}
                    onChange={(selectedLabel: string) => {
                      const index = calendarOptions.indexOf(selectedLabel);
                      if (index === 0) setCalendarTypeKey('solar');
                      if (index === 1) setCalendarTypeKey('lunar');
                      if (index === 2) setCalendarTypeKey('leap');
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <Calendar size={12} className="text-emerald-600" />
                    <label className="text-[10px] font-extrabold text-emerald-600 uppercase">{copy.birthDateLabel}</label>
                  </div>
                  <div className="flex space-x-1">
                    <WheelPicker items={years} value={date.year} onChange={(value: any) => setDate({ ...date, year: value })} className="w-[38%]" label={copy.year} />
                    <WheelPicker items={months} value={date.month} onChange={(value: any) => setDate({ ...date, month: value })} className="w-[28%]" label={copy.month} />
                    <WheelPicker items={days} value={date.day} onChange={(value: any) => setDate({ ...date, day: value })} className="w-[28%]" label={copy.day} />
                  </div>
                  <div className="mt-3">
                    <label className="mb-2 block text-[10px] font-extrabold uppercase text-slate-400">{copy.directInputLabel}</label>
                    <div className="grid grid-cols-3 gap-2">
                      <input type="number" inputMode="numeric" value={date.year} onChange={(event) => updateDateField('year', event.target.value)} className="min-h-[50px] rounded-2xl border border-slate-200/80 bg-white px-3 text-center text-xl font-black tracking-tight text-slate-900 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-300" placeholder="1998" />
                      <input type="number" inputMode="numeric" value={date.month} onChange={(event) => updateDateField('month', event.target.value)} className="min-h-[50px] rounded-2xl border border-slate-200/80 bg-white px-3 text-center text-xl font-black tracking-tight text-slate-900 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-300" placeholder="5" />
                      <input type="number" inputMode="numeric" value={date.day} onChange={(event) => updateDateField('day', event.target.value)} className="min-h-[50px] rounded-2xl border border-slate-200/80 bg-white px-3 text-center text-xl font-black tracking-tight text-slate-900 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-300" placeholder="21" />
                    </div>
                  </div>
                </div>

                <div className="w-full h-[1px] bg-white/40 my-1" />

                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <Clock size={12} className="text-emerald-600" />
                      <label className="text-[10px] font-extrabold text-emerald-600 uppercase">{copy.timeOfBirthLabel}</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[10px] font-bold text-emerald-600/80">{isTimeUnknown ? copy.timeUnknown : copy.knownTime}</span>
                      <JellyToggle isOn={isTimeUnknown} onToggle={() => setIsTimeUnknown(!isTimeUnknown)} />
                    </div>
                  </div>
                  <div className={`flex space-x-1 transition-all duration-500 ${isTimeUnknown ? 'opacity-30 pointer-events-none grayscale' : 'opacity-100'}`}>
                    <WheelPicker items={ampms} value={time.ampm} onChange={(value: any) => setTime({ ...time, ampm: value })} className="w-[30%]" label="AM/PM" />
                    <WheelPicker items={hours} value={time.hour} onChange={(value: any) => setTime({ ...time, hour: value })} className="w-[30%]" label={copy.hour} />
                    <span className="text-2xl font-bold text-slate-400 self-center pt-6">:</span>
                    <WheelPicker items={minutes} value={time.minute} onChange={(value: any) => setTime({ ...time, minute: value })} className="w-[30%]" label={copy.minute} />
                  </div>
                  <div className={`mt-3 ${isTimeUnknown ? 'opacity-30 pointer-events-none grayscale' : ''}`}>
                    <label className="mb-2 block text-[10px] font-extrabold uppercase text-slate-400">{copy.timeDirectInputLabel}</label>
                    <div className="grid grid-cols-[5.25rem_minmax(0,1fr)_5.25rem] gap-2">
                      <select value={time.ampm} onChange={(event) => setTime({ ...time, ampm: event.target.value as 'AM' | 'PM' })} className="min-h-[50px] rounded-2xl border border-slate-200/80 bg-white px-3 text-center text-lg font-black text-slate-900 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] outline-none">
                        {ampms.map((ampm) => (
                          <option key={ampm} value={ampm}>{ampm}</option>
                        ))}
                      </select>
                      <input type="number" inputMode="numeric" value={time.hour} onChange={(event) => updateTimeField('hour', event.target.value)} className="min-h-[50px] min-w-0 rounded-2xl border border-slate-200/80 bg-white px-3 text-center text-xl font-black tracking-tight text-slate-900 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-300" placeholder="10" />
                      <input type="number" inputMode="numeric" value={time.minute} onChange={(event) => updateTimeField('minute', event.target.value)} className="min-h-[50px] rounded-2xl border border-slate-200/80 bg-white px-3 text-center text-xl font-black tracking-tight text-slate-900 shadow-[0_6px_18px_-10px_rgba(15,23,42,0.18)] outline-none placeholder:text-slate-300" placeholder="30" />
                    </div>
                  </div>
                </div>
              </GlassCard>
              <div className="mt-4">
                <Button fullWidth onClick={handleAnalysisStart} variant="primary" disabled={isSubmitting}>
                  {isSubmitting ? '...' : copy.analyze}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AssetPreloader />
    </div>
  );
};

export default OnboardingScreen;
