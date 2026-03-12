import React, { useState, useEffect } from 'react';
import { UserCog, CreditCard, Palette, Sun, Moon, BellRing, HelpCircle, FileText, ChevronRight, LogOut, Sparkles, Plus, Check, X, Crown, Users, Briefcase, Lock, Gift, Clock3, BarChart3, RefreshCw, TimerReset, Chrome, MessageCircle, ShieldCheck } from 'lucide-react';
import { JellyToggle, Button, InputField, ProfileAvatar } from '../../components';
import CurrencyManagementCard from '../../components/CurrencyManagementCard';
import { AppLanguage, useSajuActions, useSajuData, useSajuSettings } from '../../context';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../../src/auth/AuthProvider';
import { getHomeNotificationHistory, subscribeToHomeRewards, type HomeNotificationRecord } from '../../src/services/homeRewards';
import { getUnlockedSpecialReports, type SpecialReportUnlock } from '../../src/services/inviteRewards';
import { api, type LaunchAnalyticsReport } from '../../src/services/api';


const PROFILE_COPY: Record<AppLanguage, any> = {
    en: {
        settings: 'Settings',
        switchProfile: 'Switch Profile',
        unlockSlots: 'Unlock more slots',
        noName: 'No Name',
        meBadge: 'ME',
        addProfile: 'Add Profile',
        editProfile: 'Edit Profile',
        nameAlias: 'Name (Alias)',
        namePlaceholder: 'e.g. Mom, Bestie',
        relation: 'Relation',
        year: 'Year',
        month: 'Month',
        day: 'Day',
        birthTime: 'Time of Birth',
        unknownTime: 'I do not know the time',
        createProfile: 'Create Profile',
        saveChanges: 'Save Changes',
        unlockTitle: 'Unlock More Slots',
        unlockBody1: 'Manage fortune for your family and friends.',
        unlockBody2: 'Upgrade your plan to add more profiles.',
        basic: 'Basic (5 Slots) - $2.99',
        premium: 'Premium (Unlimited) - $9.99',
        maybeLater: 'Maybe Later',
        account: 'Account',
        appSettings: 'App Settings',
        support: 'Support',
        editProfileItem: 'Edit Profile',
        subscription: 'Subscription',
        subscriptionManage: 'Open subscription settings',
        theme: 'Theme',
        notifications: 'Notifications',
        faq: 'FAQ',
        terms: 'Terms',
        signOut: 'Sign Out',
        guestTitle: 'Guest Mode',
        guestBody: 'Your reading stays on this device for now. Sign in when you want to sync and keep it.',
        linkedTitle: 'Connected Account',
        linkedBody: 'Your guest profile is merged into this account and stays synced across sessions.',
        loginWithGoogle: 'Connect Google',
        loginWithKakao: 'Connect Kakao',
        authRetryHint: 'If a login window closes or a domain is missing, you can retry here.',
        kakaoSetupHint: 'Add the Kakao JavaScript key and allowed domains to enable it.',
        signedInAs: 'Signed in as',
        providerGoogle: 'Google',
        providerKakao: 'Kakao',
        signOutSuccess: 'Signed out. You can keep using Sazoo as a guest.',
        freePlan: 'Free Plan',
        version: 'Version 3.1.0 (Multi-Profile)',
        relationLabels: {
            family: 'Family',
            friend: 'Friend',
            lover: 'Lover',
            colleague: 'Colleague',
            me: 'Me',
        },
        specialReports: 'Special Reports',
        specialReportsDesc: 'Invite rewards and comparison reports you unlocked.',
        noSpecialReports: 'No unlocked reports yet. Invite links will appear here after you open them.',
        reportTypeInvite: 'Invite Comparison',
        unlockedAt: 'Unlocked',
        reportSummary: 'Summary',
        reportSourceId: 'Source Invite ID',
    },
    ko: {
        settings: '설정',
        switchProfile: '프로필 전환',
        unlockSlots: '슬롯 더 열기',
        noName: '이름 없음',
        meBadge: 'ME',
        addProfile: '프로필 추가',
        editProfile: '프로필 편집',
        nameAlias: '이름(별칭)',
        namePlaceholder: '예: 엄마, 베프',
        relation: '관계',
        year: '년',
        month: '월',
        day: '일',
        birthTime: '태어난 시간',
        unknownTime: '태어난 시간을 몰라요',
        createProfile: '프로필 만들기',
        saveChanges: '변경사항 저장',
        unlockTitle: '슬롯 더 열기',
        unlockBody1: '가족과 친구의 운세까지 함께 관리해보세요.',
        unlockBody2: '플랜을 업그레이드하면 더 많은 프로필을 추가할 수 있어요.',
        basic: 'Basic (5 슬롯) - $2.99',
        premium: 'Premium (무제한) - $9.99',
        maybeLater: '나중에 할게요',
        account: '계정',
        appSettings: '앱 설정',
        support: '지원',
        editProfileItem: '프로필 수정',
        subscription: '구독 관리',
        subscriptionManage: '구독 설정 열기',
        theme: '테마',
        notifications: '알림',
        faq: '자주 묻는 질문',
        terms: '이용약관',
        signOut: '로그아웃',
        guestTitle: '게스트 모드',
        guestBody: '현재 정보는 이 기기에 안전하게 저장돼요. 원할 때 로그인해서 그대로 이어갈 수 있어요.',
        linkedTitle: '연결된 계정',
        linkedBody: '게스트 프로필이 계정과 연결되어 세션이 바뀌어도 이어집니다.',
        loginWithGoogle: '구글 연결',
        loginWithKakao: '카카오 연결',
        authRetryHint: '로그인 창이 닫히거나 도메인 설정이 빠졌다면 여기서 다시 시도할 수 있어요.',
        kakaoSetupHint: '카카오 JavaScript 키와 허용 도메인을 연결하면 바로 사용할 수 있어요.',
        signedInAs: '로그인한 계정',
        providerGoogle: 'Google',
        providerKakao: 'Kakao',
        signOutSuccess: '로그아웃되었어요. 이제 게스트 모드로 계속 사용할 수 있어요.',
        freePlan: '무료 플랜',
        version: '버전 3.1.0 (멀티 프로필)',
        relationLabels: {
            family: '가족',
            friend: '친구',
            lover: '연인',
            colleague: '동료',
            me: '나',
        },
        specialReports: '특수 리포트',
        specialReportsDesc: '초대 보상으로 열어 둔 비교 리포트를 여기서 확인해요.',
        noSpecialReports: '아직 열어 둔 리포트가 없어요. 초대 링크를 열면 여기에서 볼 수 있어요.',
        reportTypeInvite: '초대 비교 리포트',
        unlockedAt: '해금 시각',
        reportSummary: '요약',
        reportSourceId: '초대 ID',
    },
    ja: {
        settings: '設定',
        switchProfile: 'プロフィール切り替え',
        unlockSlots: 'スロットを増やす',
        noName: '名前なし',
        meBadge: 'ME',
        addProfile: 'プロフィール追加',
        editProfile: 'プロフィール編集',
        nameAlias: '名前(別名)',
        namePlaceholder: '例: 母, 親友',
        relation: '関係',
        year: '年',
        month: '月',
        day: '日',
        birthTime: '生まれた時間',
        unknownTime: '生まれた時間が分からない',
        createProfile: 'プロフィール作成',
        saveChanges: '変更を保存',
        unlockTitle: 'スロットを増やす',
        unlockBody1: '家族や友だちの運勢までまとめて管理できます。',
        unlockBody2: 'プランをアップグレードすると追加プロフィールを使えます。',
        basic: 'Basic (5スロット) - $2.99',
        premium: 'Premium (無制限) - $9.99',
        maybeLater: 'あとで',
        account: 'アカウント',
        appSettings: 'アプリ設定',
        support: 'サポート',
        editProfileItem: 'プロフィール編集',
        subscription: 'サブスク管理',
        subscriptionManage: 'サブスク設定を開く',
        theme: 'テーマ',
        notifications: '通知',
        faq: 'よくある質問',
        terms: '利用規約',
        signOut: 'ログアウト',
        guestTitle: 'ゲストモード',
        guestBody: '今の内容はこの端末に保存されます。必要なときにログインしてそのまま引き継げます。',
        linkedTitle: '連携済みアカウント',
        linkedBody: 'ゲストプロフィールはこのアカウントに統合され、次回以降も引き継がれます。',
        loginWithGoogle: 'Google連携',
        loginWithKakao: 'Kakao連携',
        authRetryHint: 'ログイン画面が閉じた時やドメイン設定が足りない時は、ここから再試行できます。',
        kakaoSetupHint: 'Kakao JavaScriptキーと許可ドメインを設定すると利用できます。',
        signedInAs: 'ログイン中のアカウント',
        providerGoogle: 'Google',
        providerKakao: 'Kakao',
        signOutSuccess: 'ログアウトしました。ゲストモードで引き続き利用できます。',
        freePlan: '無料プラン',
        version: 'バージョン 3.1.0 (マルチプロフィール)',
        relationLabels: {
            family: '家族',
            friend: '友だち',
            lover: '恋人',
            colleague: '同僚',
            me: '自分',
        },
        specialReports: '特別レポート',
        specialReportsDesc: '招待報酬で解放した比較レポートをここで確認できます。',
        noSpecialReports: 'まだ解放されたレポートはありません。招待リンクを開くとここに表示されます。',
        reportTypeInvite: '招待比較レポート',
        unlockedAt: '解放日時',
        reportSummary: '要約',
        reportSourceId: '招待 ID',
    },
};

const NOTIFICATION_HISTORY_COPY: Record<AppLanguage, {
    title: string;
    description: string;
    empty: string;
    badge: string;
}> = {
    en: {
        title: 'Notification History',
        description: 'Gift and system updates you can revisit later.',
        empty: 'No notifications yet. Welcome gifts and future app updates will appear here.',
        badge: 'Saved update',
    },
    ko: {
        title: '?? ??',
        description: '?? ??? ?? ? ??? ???? ?? ??? ? ???.',
        empty: '?? ??? ??? ???. ?? ??? ???? ? ??? ??? ???.',
        badge: '??? ??',
    },
    ja: {
        title: '????',
        description: '??????????????????????????',
        empty: '???????????????????????????????????????????',
        badge: '??????',
    },
};

const ProfileEditModal = ({ isOpen, onClose, isAddMode, initialData, copy }: any) => {
    const { addProfile, editProfile } = useSajuActions();
    const { themeMode } = useSajuSettings();
    const isDark = themeMode === 'dark';

    const [name, setName] = useState('');
    const [relation, setRelation] = useState('friend');
    const [year, setYear] = useState('1998');
    const [month, setMonth] = useState('5');
    const [day, setDay] = useState('21');
    const [hour, setHour] = useState('10');
    const [minute, setMinute] = useState('30');
    const [ampm, setAmpm] = useState<'AM' | 'PM'>('AM');
    const [isTimeUnknown, setIsTimeUnknown] = useState(false);

    useEffect(() => {
        if (initialData) {
            setName(initialData.name);
            setRelation(initialData.relation);
            setYear(initialData.birthDate.year.toString());
            setMonth(initialData.birthDate.month.toString());
            setDay(initialData.birthDate.day.toString());
            setHour(initialData.birthDate.hour.toString());
            setMinute(initialData.birthDate.minute !== undefined ? initialData.birthDate.minute.toString() : '0');
            setAmpm(initialData.birthDate.ampm || 'AM');
            setIsTimeUnknown(initialData.isTimeUnknown || false);
        } else {
            setName('');
            setRelation('friend');
            setYear('1998');
            setMonth('1');
            setDay('1');
            setHour('10');
            setMinute('0');
            setAmpm('AM');
            setIsTimeUnknown(false);
        }
    }, [initialData, isOpen]);

    const handleSave = () => {
        const profileData = {
            name,
            relation: relation as any,
            birthDate: {
                year: Number(year),
                month: Number(month),
                day: Number(day),
                hour: isTimeUnknown ? 0 : Number(hour),
                minute: isTimeUnknown ? 0 : Number(minute),
                ampm,
            },
            calendarType: '?묐젰' as const,
            isTimeUnknown,
        };

        if (isAddMode) {
            addProfile(profileData);
        } else if (initialData) {
            editProfile(initialData.id, profileData);
        }
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative w-full max-w-md p-6 rounded-[32px] shadow-2xl overflow-hidden ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{isAddMode ? copy.addProfile : copy.editProfile}</h3>
                    <button onClick={onClose} className={`p-2 rounded-full ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}><X size={20} className={isDark ? 'text-slate-400' : 'text-slate-600'} /></button>
                </div>

                <div className="space-y-4 max-h-[60vh] overflow-y-auto scrollbar-hide">
                    <div>
                        <label className={`text-xs font-bold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.nameAlias}</label>
                        <InputField value={name} onChange={(e: any) => setName(e.target.value)} placeholder={copy.namePlaceholder} />
                    </div>

                    <div>
                        <label className={`text-xs font-bold mb-2 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.relation}</label>
                        <div className="flex gap-2 flex-wrap">
                            {['family', 'friend', 'lover', 'colleague'].map((r) => (
                                <button
                                    key={r}
                                    onClick={() => setRelation(r)}
                                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition-colors ${relation === r
                                        ? 'bg-[#98FF98] text-[#1a4a1a] shadow-sm'
                                        : `${isDark ? 'bg-slate-800/80 text-slate-400' : 'bg-slate-100 text-slate-500'}`
                                        }`}
                                >
                                    {copy.relationLabels[r]}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className={`text-xs font-bold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.year}</label>
                            <input type="number" value={year} onChange={(e) => setYear(e.target.value)} className={`w-full p-3 rounded-xl outline-none border font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="YYYY" />
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.month}</label>
                            <input type="number" value={month} onChange={(e) => setMonth(e.target.value)} className={`w-full p-3 rounded-xl outline-none border font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="MM" />
                        </div>
                        <div>
                            <label className={`text-xs font-bold mb-1 block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.day}</label>
                            <input type="number" value={day} onChange={(e) => setDay(e.target.value)} className={`w-full p-3 rounded-xl outline-none border font-bold ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="DD" />
                        </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100/10">
                        <div className="flex items-center justify-between mb-2">
                            <label className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.birthTime}</label>
                            <div onClick={() => setIsTimeUnknown(!isTimeUnknown)} className="flex items-center space-x-2 cursor-pointer">
                                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isTimeUnknown ? 'bg-[#98FF98] border-[#98FF98]' : `border-slate-400 ${isDark ? 'bg-slate-800' : 'bg-white'}`}`}>
                                    {isTimeUnknown && <Check size={12} className="text-[#1a4a1a]" strokeWidth={4} />}
                                </div>
                                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.unknownTime}</span>
                            </div>
                        </div>

                        {!isTimeUnknown && (
                            <div className="flex items-center space-x-2">
                                <input type="number" value={hour} onChange={(e) => setHour(e.target.value)} className={`w-20 p-3 rounded-xl outline-none border font-bold text-center ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="HH" />
                                <span className={`font-black ${isDark ? 'text-slate-600' : 'text-slate-300'}`}>:</span>
                                <input type="number" value={minute} onChange={(e) => setMinute(e.target.value)} className={`w-20 p-3 rounded-xl outline-none border font-bold text-center ${isDark ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-50 border-slate-200'}`} placeholder="MM" />
                                <div className={`flex rounded-xl p-1 ml-auto ${isDark ? 'bg-slate-800' : 'bg-slate-100'}`}>
                                    {['AM', 'PM'].map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setAmpm(t as any)}
                                            className={`px-3 py-2 rounded-lg text-xs font-black transition-all ${ampm === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <Button fullWidth onClick={handleSave} className="!bg-[#98FF98] !text-slate-900 !font-black !rounded-2xl !py-4 shadow-lg shadow-[#98FF98]/20">
                        {isAddMode ? copy.createProfile : copy.saveChanges}
                    </Button>
                </div>
            </motion.div>
        </div>
    );
};

const PremiumUpgradeModal = ({ isOpen, onClose, copy }: any) => {
    const { upgradeTier } = useSajuActions();
    const { themeMode } = useSajuSettings();
    const isDark = themeMode === 'dark';

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative w-full max-w-sm p-8 rounded-[40px] shadow-2xl overflow-hidden text-center ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
            >
                <div className="mb-6 flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-yellow-300 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
                        <Crown size={40} className="text-white" />
                    </div>
                </div>
                <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.unlockTitle}</h3>
                <p className={`text-sm mb-8 leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
                    {copy.unlockBody1}
                    <br />
                    {copy.unlockBody2}
                </p>

                <div className="space-y-3">
                    <button
                        onClick={() => { upgradeTier('BASIC'); onClose(); }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-900 text-white font-bold shadow-lg flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                    >
                        <Briefcase size={18} /> {copy.basic}
                    </button>
                    <button
                        onClick={() => { upgradeTier('PREMIUM'); onClose(); }}
                        className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-500 text-slate-900 font-bold shadow-lg shadow-amber-400/30 flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
                    >
                        <Crown size={18} /> {copy.premium}
                    </button>
                </div>
                <button onClick={onClose} className={`mt-6 text-xs font-bold hover:underline ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                    {copy.maybeLater}
                </button>
            </motion.div>
        </div>
    );
};

const formatUnlockedAt = (value: string, language: AppLanguage) => {
    try {
        return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : language === 'ja' ? 'ja-JP' : 'ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        }).format(new Date(value));
    } catch {
        return value;
    }
};

const formatDurationMs = (value: number, language: AppLanguage) => {
    const seconds = Math.max(0, Math.round(value / 100) / 10);
    if (language === 'ja') return `${seconds}秒`;
    if (language === 'en') return `${seconds}s`;
    return `${seconds}초`;
};

const summarizeEventPayload = (payload: Record<string, unknown>) => {
    const keys = Object.keys(payload || {});
    if (keys.length === 0) return '';
    const text = JSON.stringify(payload);
    return text.length > 96 ? `${text.slice(0, 93)}...` : text;
};

const LaunchMetricsModal = ({
    isOpen,
    onClose,
    onRetry,
    report,
    dailyInsightsSource,
    loading,
    error,
    copy,
    language,
    isDark,
}: {
    isOpen: boolean;
    onClose: () => void;
    onRetry: () => void;
    report: LaunchAnalyticsReport | null;
    dailyInsightsSource?: 'model' | 'fallback';
    loading: boolean;
    error: string | null;
    copy: any;
    language: AppLanguage;
    isDark: boolean;
}) => {
    if (!isOpen) return null;

    const launchCopy = language === 'ko'
        ? {
            badge: '운영 리포트',
            title: '런치 메트릭',
            description: '초대 퍼널, 첫 가치 도달 속도, 제품 사용 신호를 한 번에 확인합니다.',
            loading: '런치 메트릭을 불러오는 중이에요...',
            error: '런치 메트릭을 지금 불러오지 못했어요.',
            retry: '다시 불러오기',
            totalEvents: '전체 이벤트',
            avgTimeToValue: '평균 첫 가치 도달',
            withinTarget: '30초 이내',
            recentEvents: '최근 이벤트',
            noRecentEvents: '아직 기록된 최근 이벤트가 없어요.',
            dailyInsightsSourceLabel: '오늘 인사이트 소스',
            dailyInsightsSourceDesc: '현재 홈 인사이트가 Gemini 모델 응답인지 빠른 fallback인지 보여줍니다.',
            dailyInsightsSourceModel: 'Gemini 모델',
            dailyInsightsSourceFallback: '빠른 Fallback',
            dailyInsightsSourceUnavailable: '없음',
            metricShare: '공유',
            metricInviteOpen: '초대 링크 열기',
            metricInstallFromInvite: '초대 설치 전환',
            metricD1Retention: 'D1 리텐션',
            metricInviteRewardClaimed: '초대 보상 클레임',
            metricInviteRewardGranted: '초대 보상 지급',
            metricInviteRewardDuplicate: '중복 보상 차단',
            metricInviteRewardFailed: '초대 보상 실패',
            metricFirstReadingSuccess: '첫 사주 결과 성공',
            metricFirstReadingFailure: '첫 사주 결과 실패',
            metricCoinSpent: '코인 소모',
            metricAdRewardGranted: '광고 보상 지급',
            metricSceneChange: '씬 변경',
            metricMiniAppOpen: '미니앱 진입',
            metricOnboardingViews: '온보딩 조회',
            metricOnboardingCompletes: '온보딩 완료',
            coinSpendByContext: '코인 사용 위치',
            adRewardsByPlacement: '광고 보상 위치',
            miniAppsByApp: '미니앱 진입 분포',
            scenesById: '씬 변경 분포',
            emptyBreakdown: '아직 집계된 세부 항목이 없어요.',
        }
        : language === 'ja'
            ? {
                badge: '運営レポート',
                title: 'ローンチ指標',
                description: '招待ファネル、初回価値到達速度、主要な利用シグナルをまとめて確認します。',
                loading: 'ローンチ指標を読み込んでいます...',
                error: 'ローンチ指標を読み込めませんでした。',
                retry: '再読み込み',
                totalEvents: '総イベント',
                avgTimeToValue: '平均初回価値到達',
                withinTarget: '30秒以内',
                recentEvents: '最近のイベント',
                noRecentEvents: 'まだ最近のイベントはありません。',
                dailyInsightsSourceLabel: '本日のインサイト元',
                dailyInsightsSourceDesc: '現在のホームインサイトがGemini応答か高速fallbackかを表示します。',
                dailyInsightsSourceModel: 'Gemini モデル',
                dailyInsightsSourceFallback: '高速 Fallback',
                dailyInsightsSourceUnavailable: '未取得',
                metricShare: '共有',
                metricInviteOpen: '招待リンク開封',
                metricInstallFromInvite: '招待経由インストール',
                metricD1Retention: 'D1 継続率',
                metricInviteRewardClaimed: '招待報酬クレーム',
                metricInviteRewardGranted: '招待報酬付与',
                metricInviteRewardDuplicate: '重複報酬ブロック',
                metricInviteRewardFailed: '招待報酬失敗',
                metricFirstReadingSuccess: '初回鑑定成功',
                metricFirstReadingFailure: '初回鑑定失敗',
                metricCoinSpent: 'コイン消費',
                metricAdRewardGranted: '広告報酬付与',
                metricSceneChange: 'シーン変更',
                metricMiniAppOpen: 'ミニアプリ起動',
                metricOnboardingViews: 'オンボーディング閲覧',
                metricOnboardingCompletes: 'オンボーディング完了',
                coinSpendByContext: 'コイン消費箇所',
                adRewardsByPlacement: '広告報酬配置',
                miniAppsByApp: 'ミニアプリ分布',
                scenesById: 'シーン変更分布',
                emptyBreakdown: 'まだ詳細データはありません。',
            }
            : {
                badge: 'Launch Report',
                title: 'Launch Metrics',
                description: 'Track invite funnel health, first-value speed, and product usage signals in one place.',
                loading: 'Loading launch metrics...',
                error: 'Could not load launch metrics right now.',
                retry: 'Retry',
                totalEvents: 'Total Events',
                avgTimeToValue: 'Avg. First Value',
                withinTarget: 'Within 30s',
                recentEvents: 'Recent Events',
                noRecentEvents: 'No recent events recorded yet.',
                dailyInsightsSourceLabel: 'Daily Insights Source',
                dailyInsightsSourceDesc: 'Shows whether the current home insight came from Gemini or the fast fallback path.',
                dailyInsightsSourceModel: 'Gemini Model',
                dailyInsightsSourceFallback: 'Fast Fallback',
                dailyInsightsSourceUnavailable: 'Unavailable',
                metricShare: 'Shares',
                metricInviteOpen: 'Invite Opens',
                metricInstallFromInvite: 'Installs from Invite',
                metricD1Retention: 'D1 Retention',
                metricInviteRewardClaimed: 'Invite Reward Claims',
                metricInviteRewardGranted: 'Invite Rewards Granted',
                metricInviteRewardDuplicate: 'Duplicate Claims Blocked',
                metricInviteRewardFailed: 'Invite Reward Failures',
                metricFirstReadingSuccess: 'First Reading Success',
                metricFirstReadingFailure: 'First Reading Failures',
                metricCoinSpent: 'Coins Spent',
                metricAdRewardGranted: 'Ad Rewards Granted',
                metricSceneChange: 'Scene Changes',
                metricMiniAppOpen: 'Mini App Opens',
                metricOnboardingViews: 'Onboarding Views',
                metricOnboardingCompletes: 'Onboarding Completions',
                coinSpendByContext: 'Coin Spend by Context',
                adRewardsByPlacement: 'Ad Rewards by Placement',
                miniAppsByApp: 'Mini Apps by App',
                scenesById: 'Scene Changes by Scene',
                emptyBreakdown: 'No breakdown data yet.',
            };

    const metrics = report ? [
        { label: launchCopy.metricShare, value: report.counts.share },
        { label: launchCopy.metricInviteOpen, value: report.counts.invite_open },
        { label: launchCopy.metricInstallFromInvite, value: report.counts.install_from_invite },
        { label: launchCopy.metricD1Retention, value: report.counts.d1_retention },
        { label: launchCopy.metricInviteRewardClaimed, value: report.counts.invite_reward_claimed },
        { label: launchCopy.metricInviteRewardGranted, value: report.counts.invite_reward_granted },
        { label: launchCopy.metricInviteRewardDuplicate, value: report.counts.invite_reward_duplicate },
        { label: launchCopy.metricInviteRewardFailed, value: report.counts.invite_reward_claim_failed },
        { label: launchCopy.metricFirstReadingSuccess, value: report.counts.first_reading_success },
        { label: launchCopy.metricFirstReadingFailure, value: report.counts.first_reading_failure },
        { label: launchCopy.metricCoinSpent, value: report.counts.coin_spent },
        { label: launchCopy.metricAdRewardGranted, value: report.counts.ad_reward_granted },
        { label: launchCopy.metricSceneChange, value: report.counts.scene_change },
        { label: launchCopy.metricMiniAppOpen, value: report.counts.mini_app_open },
        { label: launchCopy.metricOnboardingViews, value: report.counts.onboarding_step_view },
        { label: launchCopy.metricOnboardingCompletes, value: report.counts.onboarding_step_complete },
    ] : [];
    const breakdownSections = report ? [
        { title: launchCopy.coinSpendByContext, values: report.productHealth.coinSpendByContext },
        { title: launchCopy.adRewardsByPlacement, values: report.productHealth.adRewardsByPlacement },
        { title: launchCopy.miniAppsByApp, values: report.productHealth.miniAppOpenByApp },
        { title: launchCopy.scenesById, values: report.productHealth.sceneChangeByScene },
    ] : [];
    const dailyInsightsSourceValue = dailyInsightsSource === 'model'
        ? launchCopy.dailyInsightsSourceModel
        : dailyInsightsSource === 'fallback'
            ? launchCopy.dailyInsightsSourceFallback
            : launchCopy.dailyInsightsSourceUnavailable;

    return (
        <div className="fixed inset-0 z-[85] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.94, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative w-full max-w-2xl overflow-hidden rounded-[32px] border shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-white/70 bg-white'}`}
            >
                <div className={`flex items-start justify-between border-b px-6 py-5 ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
                    <div>
                        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500">{launchCopy.badge}</p>
                        <h3 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{launchCopy.title}</h3>
                        <p className={`mt-1 text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{launchCopy.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={onRetry}
                            className={`rounded-full p-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}
                            aria-label={launchCopy.retry}
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin text-emerald-500' : isDark ? 'text-slate-400' : 'text-slate-500'} />
                        </button>
                        <button onClick={onClose} className={`rounded-full p-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                            <X size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                        </button>
                    </div>
                </div>

                <div className="max-h-[72vh] overflow-y-auto px-6 py-5">
                    {loading ? (
                        <div className={`rounded-[24px] border p-6 text-center ${isDark ? 'border-slate-700 bg-slate-800/50 text-slate-300' : 'border-slate-100 bg-slate-50 text-slate-600'}`}>
                            <RefreshCw size={18} className="mx-auto mb-3 animate-spin text-emerald-500" />
                            <p className="text-sm font-bold">{launchCopy.loading}</p>
                        </div>
                    ) : error ? (
                        <div className={`rounded-[24px] border p-6 text-center ${isDark ? 'border-red-900/50 bg-red-950/30 text-red-200' : 'border-red-100 bg-red-50 text-red-500'}`}>
                            <p className="mb-4 text-sm font-bold">{error || launchCopy.error}</p>
                            <Button onClick={onRetry} className="!rounded-2xl !bg-slate-900 !px-5 !py-3 !text-white">
                                {launchCopy.retry}
                            </Button>
                        </div>
                    ) : report ? (
                        <div className="space-y-5">
                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
                                    <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{launchCopy.totalEvents}</p>
                                    <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.totalEvents}</p>
                                </div>
                                <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
                                    <div className="flex items-center gap-2">
                                        <TimerReset size={14} className="text-emerald-500" />
                                        <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{launchCopy.avgTimeToValue}</p>
                                    </div>
                                    <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{formatDurationMs(report.timeToFirstValue.averageMs, language)}</p>
                                </div>
                                <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
                                    <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{launchCopy.withinTarget}</p>
                                    <p className={`mt-3 text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{Math.round(report.timeToFirstValue.withinTargetRate * 100)}%</p>
                                </div>
                                <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/70' : 'border-slate-100 bg-slate-50/90'}`}>
                                    <div className="flex items-center gap-2">
                                        <BarChart3 size={14} className="text-emerald-500" />
                                        <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{launchCopy.dailyInsightsSourceLabel}</p>
                                    </div>
                                    <p className={`mt-3 text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{dailyInsightsSourceValue}</p>
                                    <p className={`mt-2 text-xs font-medium leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{launchCopy.dailyInsightsSourceDesc}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                {metrics.map((metric) => (
                                    <div key={metric.label} className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
                                        <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{metric.label}</p>
                                        <p className={`mt-2 text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{metric.value}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                                {breakdownSections.map((section) => {
                                    const entries = Object.entries(section.values || {}).sort((a, b) => b[1] - a[1]).slice(0, 5);

                                    return (
                                        <div key={section.title} className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
                                            <p className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{section.title}</p>
                                            {entries.length === 0 ? (
                                                <p className={`mt-3 text-sm font-medium ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{launchCopy.emptyBreakdown}</p>
                                            ) : (
                                                <div className="mt-3 space-y-2">
                                                    {entries.map(([key, value]) => (
                                                        <div key={key} className="flex items-center justify-between gap-3">
                                                            <span className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{key}</span>
                                                            <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>{value}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            <div className={`rounded-[28px] border p-5 ${isDark ? 'border-slate-700 bg-slate-900/60' : 'border-slate-100 bg-slate-50/60'}`}>
                                <div className="mb-4 flex items-center justify-between gap-4">
                                    <div>
                                        <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{launchCopy.recentEvents}</p>
                                        <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatUnlockedAt(report.generatedAt, language)}</p>
                                    </div>
                                    <div className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm'}`}>
                                        {report.recentEvents.length}
                                    </div>
                                </div>

                                {report.recentEvents.length === 0 ? (
                                    <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{launchCopy.noRecentEvents}</p>
                                ) : (
                                    <div className="space-y-3">
                                        {report.recentEvents.map((event, index) => (
                                            <div key={`${event.name}-${event.timestamp}-${index}`} className={`rounded-[20px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/70' : 'border-slate-100 bg-white'}`}>
                                                <div className="mb-2 flex items-center justify-between gap-3">
                                                    <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{event.name}</span>
                                                    <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatUnlockedAt(event.timestamp, language)}</span>
                                                </div>
                                                <p className={`text-xs font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{summarizeEventPayload(event.payload)}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : null}
                </div>
            </motion.div>
        </div>
    );
};const SpecialReportDetailModal = ({
    report,
    isOpen,
    onClose,
    copy,
    language,
    isDark,
}: {
    report: SpecialReportUnlock | null;
    isOpen: boolean;
    onClose: () => void;
    copy: any;
    language: AppLanguage;
    isDark: boolean;
}) => {
    if (!isOpen || !report) return null;

    return (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />
            <motion.div
                initial={{ scale: 0.92, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative w-full max-w-md overflow-hidden rounded-[32px] border p-6 shadow-2xl ${isDark ? 'border-slate-700 bg-slate-900' : 'border-white/70 bg-white'}`}
            >
                <div className="mb-5 flex items-start justify-between">
                    <div>
                        <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.18em] text-emerald-500">{copy.reportTypeInvite}</p>
                        <h3 className={`text-xl font-black leading-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</h3>
                    </div>
                    <button onClick={onClose} className={`rounded-full p-2 ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'}`}>
                        <X size={18} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
                    </button>
                </div>

                <div className="space-y-4">
                    <div className={`rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-800/80' : 'border-slate-100 bg-slate-50/80'}`}>
                        <div className="mb-2 flex items-center gap-2">
                            <Gift size={16} className="text-emerald-500" />
                            <span className={`text-xs font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.reportSummary}</span>
                        </div>
                        <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{report.summary}</p>
                    </div>

                    <div className={`space-y-3 rounded-[24px] border p-4 ${isDark ? 'border-slate-700 bg-slate-950/60' : 'border-slate-100 bg-white'}`}>
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <Clock3 size={14} className="text-slate-400" />
                                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.unlockedAt}</span>
                            </div>
                            <span className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatUnlockedAt(report.unlockedAt, language)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.reportSourceId}</span>
                            <span className={`max-w-[180px] truncate text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{report.sourceInviteId}</span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

const ProfileSwitcher = ({ isOpen, onClose, copy }: any) => {
    const { profiles, activeProfileId } = useSajuData();
    const { switchProfile, canAddProfile } = useSajuActions();
    const { themeMode } = useSajuSettings();
    const [showLimitDialog, setShowLimitDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const isDark = themeMode === 'dark';

    const handleAddClick = () => {
        if (canAddProfile()) {
            setIsEditing(true);
        } else {
            setShowLimitDialog(true);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className={`relative w-full max-w-sm p-6 rounded-[32px] shadow-2xl ${isDark ? 'bg-slate-900 border border-slate-700' : 'bg-white'}`}
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{copy.switchProfile}</h3>
                    {canAddProfile() && (
                        <button onClick={handleAddClick} className={`p-2 rounded-full transition-colors ${isDark ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>
                            <Plus size={20} />
                        </button>
                    )}
                </div>

                <div className="space-y-3 max-h-[60vh] overflow-y-auto scrollbar-hide mb-4">
                    {profiles.map((p: any) => (
                        <div
                            key={p.id}
                            onClick={() => { switchProfile(p.id); onClose(); }}
                            className={`flex items-center p-3 rounded-2xl cursor-pointer transition-all border ${p.id === activeProfileId
                                ? `${isDark ? 'bg-slate-800 border-slate-600' : 'bg-slate-50 border-slate-200'} ring-1 ring-[#98FF98]`
                                : `${isDark ? 'border-transparent hover:bg-slate-800/50' : 'border-transparent hover:bg-slate-50'}`
                                }`}
                        >
                            <div className={`mr-4 relative`}>
                                <ProfileAvatar name={p.name || copy.noName} size={48} className={isDark ? 'border-slate-600' : 'border-white'} />
                                {p.id === activeProfileId && (
                                    <div className="absolute inset-0 bg-[#98FF98]/20 flex items-center justify-center">
                                        <Check size={16} className="text-slate-800 drop-shadow-md" strokeWidth={4} />
                                    </div>
                                )}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center">
                                    <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.name || copy.noName}</span>
                                    {p.relation === 'me' && <span className="ml-2 px-1.5 py-0.5 bg-slate-200 text-slate-600 text-[9px] font-bold rounded-md">{copy.meBadge}</span>}
                                    {p.relation !== 'me' && <span className="ml-2 px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded-md uppercase">{copy.relationLabels[p.relation] || p.relation}</span>}
                                </div>
                                <div className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                    {p.birthDate.year}.{p.birthDate.month}.{p.birthDate.day}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {!canAddProfile() && (
                    <div onClick={() => setShowLimitDialog(true)} className={`p-4 rounded-xl border border-dashed flex items-center justify-center cursor-pointer transition-colors ${isDark ? 'border-slate-700 bg-slate-800/30 hover:bg-slate-800/50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'}`}>
                        <div className="text-center">
                            <Lock size={20} className="mx-auto mb-1 text-slate-400" />
                            <span className="text-xs font-bold text-slate-400">{copy.unlockSlots}</span>
                        </div>
                    </div>
                )}
            </motion.div>

            <PremiumUpgradeModal isOpen={showLimitDialog} onClose={() => setShowLimitDialog(false)} copy={copy} />
            <ProfileEditModal isOpen={isEditing} onClose={() => setIsEditing(false)} isAddMode={true} copy={copy} />
        </div>
    );
};

const ProfileScreen = () => {
    const { sajuState, userTier } = useSajuData();
    const { themeMode, language = 'ko' } = useSajuSettings();
    const { setThemeMode } = useSajuActions();
    const {
        status: authStatus,
        session,
        error: authError,
        pendingProvider,
        isGoogleReady,
        isKakaoReady,
        signInWithGoogle,
        signInWithKakao,
        signOut,
        clearError,
    } = useAuth();
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
    const [isSwitcherOpen, setIsSwitcherOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isLaunchMetricsOpen, setIsLaunchMetricsOpen] = useState(false);
    const [launchReport, setLaunchReport] = useState<LaunchAnalyticsReport | null>(null);
    const [launchReportLoading, setLaunchReportLoading] = useState(false);
    const [launchReportError, setLaunchReportError] = useState<string | null>(null);
    const [specialReports, setSpecialReports] = useState<SpecialReportUnlock[]>([]);
    const [selectedReport, setSelectedReport] = useState<SpecialReportUnlock | null>(null);
    const [notificationHistory, setNotificationHistory] = useState<HomeNotificationRecord[]>([]);
    const [localAuthMessage, setLocalAuthMessage] = useState<string | null>(null);

    const currentProfile = sajuState.profile;
    const isMe = currentProfile.id === 'me';
    const isDark = themeMode === 'dark';
    const copy = PROFILE_COPY[language as AppLanguage] ?? PROFILE_COPY.ko;
    const notificationCopy = NOTIFICATION_HISTORY_COPY[language as AppLanguage] ?? NOTIFICATION_HISTORY_COPY.ko;
    const launchMetricsMenuLabel = language === 'ko'
        ? '운영 리포트'
        : language === 'ja'
            ? '運営レポート'
            : 'Launch Metrics';
    const launchMetricsErrorText = language === 'ko'
        ? '런치 메트릭을 지금 불러오지 못했어요.'
        : language === 'ja'
            ? 'ローンチ指標を読み込めませんでした。'
            : 'Could not load launch metrics right now.';

    useEffect(() => {
        const syncReports = async () => {
            const localReports = getUnlockedSpecialReports().slice().sort((a, b) => (
                new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
            ));
            setSpecialReports(localReports);

            try {
                const serverReports = await api.unlocks.getSpecialReports(localReports);
                setSpecialReports(serverReports.slice().sort((a, b) => (
                    new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime()
                )));
            } catch (error) {
                console.error('Failed to sync special reports:', error);
            }
        };

        void syncReports();
        window.addEventListener('focus', syncReports);
        document.addEventListener('visibilitychange', syncReports);

        return () => {
            window.removeEventListener('focus', syncReports);
            document.removeEventListener('visibilitychange', syncReports);
        };
    }, []);

    useEffect(() => {
        const syncNotifications = () => {
            setNotificationHistory(getHomeNotificationHistory(session?.userId));
        };

        syncNotifications();
        const unsubscribe = subscribeToHomeRewards(syncNotifications);
        window.addEventListener('focus', syncNotifications);
        document.addEventListener('visibilitychange', syncNotifications);

        return () => {
            unsubscribe();
            window.removeEventListener('focus', syncNotifications);
            document.removeEventListener('visibilitychange', syncNotifications);
        };
    }, [session?.userId]);

    const openLaunchMetrics = async () => {
        setIsLaunchMetricsOpen(true);
        setLaunchReportLoading(true);
        setLaunchReportError(null);
        setLaunchReport(null);

        try {
            const report = await api.analytics.getLaunchReport();
            setLaunchReport(report);
        } catch (error) {
            setLaunchReportError(error instanceof Error ? error.message : launchMetricsErrorText);
        } finally {
            setLaunchReportLoading(false);
        }
    };

    const handleGoogleConnect = async () => {
        clearError();
        setLocalAuthMessage(null);
        const result = await signInWithGoogle();
        if (!result.ok && result.error) {
            setLocalAuthMessage(result.error);
        }
    };

    const handleKakaoConnect = async () => {
        clearError();
        setLocalAuthMessage(null);
        const result = await signInWithKakao();
        if (!result.ok && result.error) {
            setLocalAuthMessage(result.error);
        }
    };

    const handleSignOut = async () => {
        clearError();
        setLocalAuthMessage(null);
        const result = await signOut();
        if (result.ok) {
            setLocalAuthMessage(copy.signOutSuccess);
            return;
        }
        if (result.error) {
            setLocalAuthMessage(result.error);
        }
    };

    const settingsGroups = [
        {
            title: copy.account,
            items: [
                { icon: UserCog, label: copy.editProfileItem, onClick: () => setIsEditModalOpen(true) },
                { icon: CreditCard, label: copy.subscription, value: userTier === 'FREE' ? copy.freePlan : userTier + ' Plan', onClick: () => alert(copy.subscriptionManage) },
            ],
        },
        {
            title: copy.appSettings,
            items: [
                {
                    icon: Palette,
                    label: copy.theme,
                    type: 'segment',
                    options: [
                        { value: 'light', icon: Sun },
                        { value: 'dark', icon: Moon },
                    ],
                    current: themeMode,
                    onChange: setThemeMode,
                },
                {
                    icon: BellRing,
                    label: copy.notifications,
                    type: 'toggle',
                    value: notificationsEnabled,
                    onChange: () => setNotificationsEnabled(!notificationsEnabled),
                },
            ],
        },
        {
            title: copy.support,
            items: [
                { icon: BarChart3, label: launchMetricsMenuLabel, onClick: openLaunchMetrics },
                { icon: HelpCircle, label: copy.faq, onClick: () => { } },
                { icon: FileText, label: copy.terms, onClick: () => { } },
            ],
        },
    ];

    return (
        <div className={`p-6 pb-32 h-full overflow-y-auto transition-colors duration-300 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
            <h2 className={`typo-h1 mb-6 ${isDark ? 'text-white' : 'text-slate-800'}`}>{copy.settings}</h2>

            <motion.div
                whileTap={{ scale: 0.98 }}
                onClick={() => setIsSwitcherOpen(true)}
                className={`flex items-center space-x-4 mb-8 p-4 rounded-[28px] border shadow-sm backdrop-blur-md relative overflow-hidden transition-all duration-300 cursor-pointer group ${isDark
                    ? 'bg-slate-900/40 border-slate-700/50 hover:bg-slate-800/50'
                    : 'bg-white/60 border-white/60 hover:bg-white/80'
                    }`}
            >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#98FF98]/20 to-transparent rounded-full translate-x-10 -translate-y-10" />
                <ProfileAvatar
                    name={currentProfile.name || copy.noName}
                    size={64}
                    className={`shadow-inner border-2 flex-shrink-0 z-10 ${isDark ? 'bg-slate-800 border-slate-600' : 'bg-white border-white'}`}
                />
                <div className="z-10 flex-1">
                    <h3 className={`text-lg font-black flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>
                        {currentProfile.name || copy.noName}
                        {!isMe && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-600 text-[9px] font-bold rounded-md uppercase tracking-wide">{copy.relationLabels[currentProfile.relation] || currentProfile.relation}</span>}
                    </h3>
                    <div className="flex items-center mt-1 space-x-2">
                        {userTier === 'PREMIUM' && (
                            <span className="inline-flex items-center px-2.5 py-0.5 bg-[#391B1B] rounded-full text-[10px] font-bold text-[#FEE500]">
                                <Sparkles size={10} className="mr-1" /> Premium
                            </span>
                        )}
                        {userTier === 'FREE' && (
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.freePlan}</span>
                        )}
                    </div>
                </div>
                <div className="z-10 bg-slate-100/50 p-2 rounded-full">
                    <Users size={18} className="text-slate-400" />
                </div>
            </motion.div>

            <div className="space-y-8">
                <div>
                    <h4 className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ml-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.account}</h4>
                    <div className={`rounded-[28px] border p-5 shadow-sm ${isDark ? 'border-slate-700/30 bg-slate-900/40' : 'border-white/60 bg-white/70'}`}>
                        <div className="flex items-start gap-4">
                            <div className={`rounded-2xl p-3 ${authStatus === 'authenticated'
                                ? (isDark ? 'bg-emerald-500/15 text-emerald-300' : 'bg-emerald-50 text-emerald-500')
                                : (isDark ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-500')
                                }`}>
                                <ShieldCheck size={18} />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                        {authStatus === 'authenticated' ? copy.linkedTitle : copy.guestTitle}
                                    </h4>
                                    {authStatus === 'authenticated' && (
                                        <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-600'}`}>
                                            {session?.provider === 'kakao' ? copy.providerKakao : copy.providerGoogle}
                                        </span>
                                    )}
                                </div>
                                <p className={`mt-2 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                    {authStatus === 'authenticated' ? copy.linkedBody : copy.guestBody}
                                </p>
                                {authStatus === 'authenticated' && (
                                    <p className={`mt-3 text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {copy.signedInAs}: {session?.email || session?.displayName || session?.userId}
                                    </p>
                                )}
                                {(localAuthMessage || authError) && (
                                    <p className={`mt-3 text-xs font-bold ${(localAuthMessage && localAuthMessage === copy.signOutSuccess) ? 'text-emerald-500' : 'text-rose-500'}`}>
                                        {localAuthMessage || authError}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 grid grid-cols-1 gap-3">
                            {authStatus === 'authenticated' ? (
                                <Button fullWidth onClick={handleSignOut} className="!bg-rose-50 !text-rose-500 !border !border-rose-100" disabled={pendingProvider !== null}>
                                    <LogOut size={16} />
                                    <span>{copy.signOut}</span>
                                </Button>
                            ) : (
                                <>
                                    <Button fullWidth onClick={handleGoogleConnect} variant="google" disabled={!isGoogleReady || pendingProvider !== null}>
                                        <Chrome size={18} className="absolute left-6 text-slate-600" />
                                        <span className="text-slate-600">{copy.loginWithGoogle}</span>
                                    </Button>
                                    <Button fullWidth onClick={handleKakaoConnect} variant="kakao" disabled={pendingProvider !== null}>
                                        <MessageCircle fill="#391B1B" size={18} className="absolute left-6 text-[#391B1B]" />
                                        <span className="text-[#391B1B]">{copy.loginWithKakao}</span>
                                    </Button>
                                    <p className={`px-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                        {isKakaoReady ? copy.authRetryHint : copy.kakaoSetupHint}
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {settingsGroups.map((group, idx) => (
                    <div key={idx}>
                        <h4 className={`text-[10px] font-extrabold uppercase tracking-widest mb-3 ml-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{group.title}</h4>
                        <div className={`backdrop-blur-md rounded-[28px] border shadow-sm overflow-hidden transition-all duration-300 ${isDark
                            ? 'bg-slate-900/40 border-slate-700/30 divide-slate-700/50'
                            : 'bg-white/70 border-white/60 divide-slate-100/80'
                            } divide-y`}>
                            {group.items.map((item: any, i: number) => (
                                <div
                                    key={i}
                                    className={`p-4 flex items-center justify-between transition-colors cursor-pointer group ${isDark
                                        ? 'hover:bg-slate-800/50'
                                        : 'hover:bg-white/60'
                                        }`}
                                    onClick={item.onClick}
                                >
                                    <div className="flex items-center space-x-4">
                                        <div className={`p-2.5 rounded-2xl shadow-sm border transition-transform duration-300 group-hover:-translate-y-1 ${isDark
                                            ? 'bg-slate-800 text-slate-300 border-slate-700'
                                            : 'bg-white text-slate-500 border-slate-50'
                                            }`}>
                                            <item.icon size={18} />
                                        </div>
                                        <span className={`text-sm font-bold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{item.label}</span>
                                    </div>

                                    {item.type === 'segment' ? (
                                        <div className={`flex p-1 rounded-xl ${isDark ? 'bg-slate-950/50' : 'bg-slate-100/80'}`}>
                                            {item.options.map((opt: any) => (
                                                <button
                                                    key={opt.value}
                                                    onClick={(e) => { e.stopPropagation(); item.onChange(opt.value); }}
                                                    className={`p-1.5 rounded-lg transition-all duration-300 ${item.current === opt.value
                                                        ? `${isDark ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-800 shadow-sm'} scale-105`
                                                        : 'text-slate-500 hover:text-slate-400'
                                                        }`}
                                                >
                                                    <opt.icon size={14} />
                                                </button>
                                            ))}
                                        </div>
                                    ) : item.type === 'toggle' ? (
                                        <div onClick={(e) => { e.stopPropagation(); item.onChange(); }}>
                                            <JellyToggle isOn={item.value} onToggle={() => { }} />
                                        </div>
                                    ) : (
                                        <div className="flex items-center space-x-2">
                                            {item.value && <span className={`text-xs font-bold px-2 py-1 rounded-lg ${isDark ? 'text-slate-300 bg-slate-800' : 'text-slate-400 bg-slate-100'}`}>{item.value}</span>}
                                            <ChevronRight size={16} className={`transition-transform group-hover:translate-x-1 ${isDark ? 'text-slate-600' : 'text-slate-300'}`} />
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                <CurrencyManagementCard isDark={isDark} />

                <div>
                    <div className="mb-3 flex items-center justify-between px-4">
                        <div>
                            <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{notificationCopy.title}</h4>
                            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{notificationCopy.description}</p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm'}`}>
                            {notificationHistory.length}
                        </div>
                    </div>

                    {notificationHistory.length === 0 ? (
                        <div className={`rounded-[28px] border border-dashed p-6 text-center ${isDark ? 'border-slate-700 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-white/60 text-slate-500'}`}>
                            <BellRing size={20} className="mx-auto mb-3 text-emerald-500" />
                            <p className="text-sm font-medium leading-relaxed">{notificationCopy.empty}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {notificationHistory.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`w-full rounded-[28px] border p-5 text-left shadow-sm ${isDark ? 'border-slate-700 bg-slate-900/40' : 'border-white/70 bg-white/70'}`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-2xl p-3 ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>
                                                <BellRing size={18} />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{notificationCopy.badge}</p>
                                                <h5 className={`text-base font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{notification.title}</h5>
                                            </div>
                                        </div>
                                        <span className={`text-[11px] font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{formatUnlockedAt(notification.createdAt, language as AppLanguage)}</span>
                                    </div>
                                    <p className={`text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{notification.body}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div>
                    <div className="mb-3 flex items-center justify-between px-4">
                        <div>
                            <h4 className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.specialReports}</h4>
                            <p className={`mt-1 text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.specialReportsDesc}</p>
                        </div>
                        <div className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700 shadow-sm'}`}>
                            {specialReports.length}
                        </div>
                    </div>

                    {specialReports.length === 0 ? (
                        <div className={`rounded-[28px] border border-dashed p-6 text-center ${isDark ? 'border-slate-700 bg-slate-900/30 text-slate-400' : 'border-slate-200 bg-white/60 text-slate-500'}`}>
                            <Gift size={20} className="mx-auto mb-3 text-emerald-500" />
                            <p className="text-sm font-medium leading-relaxed">{copy.noSpecialReports}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {specialReports.map((report) => (
                                <motion.button
                                    key={report.id}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setSelectedReport(report)}
                                    className={`w-full rounded-[28px] border p-5 text-left shadow-sm transition-colors ${isDark ? 'border-slate-700 bg-slate-900/40 hover:bg-slate-800/60' : 'border-white/70 bg-white/70 hover:bg-white'}`}
                                >
                                    <div className="mb-3 flex items-start justify-between gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`rounded-2xl p-3 ${isDark ? 'bg-slate-800 text-emerald-400' : 'bg-emerald-50 text-emerald-500'}`}>
                                                <Gift size={18} />
                                            </div>
                                            <div>
                                                <p className={`text-[10px] font-extrabold uppercase tracking-[0.18em] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{copy.reportTypeInvite}</p>
                                                <h5 className={`text-base font-black leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>{report.title}</h5>
                                            </div>
                                        </div>
                                        <ChevronRight size={18} className={isDark ? 'text-slate-600' : 'text-slate-300'} />
                                    </div>

                                    <p className={`mb-4 text-sm font-medium leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{report.summary}</p>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Clock3 size={14} className="text-slate-400" />
                                            <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{copy.unlockedAt}</span>
                                        </div>
                                        <span className={`text-xs font-black ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>{formatUnlockedAt(report.unlockedAt, language as AppLanguage)}</span>
                                    </div>
                                </motion.button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="text-center mt-6">
                <span className="text-[10px] text-slate-500 font-medium">{copy.version}</span>
            </div>

            <AnimatePresence>
                {isSwitcherOpen && <ProfileSwitcher isOpen={isSwitcherOpen} onClose={() => setIsSwitcherOpen(false)} copy={copy} />}
                {isEditModalOpen && <ProfileEditModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} initialData={currentProfile} isAddMode={false} copy={copy} />}
                {selectedReport && (
                    <SpecialReportDetailModal
                        report={selectedReport}
                        isOpen={!!selectedReport}
                        onClose={() => setSelectedReport(null)}
                        copy={copy}
                        language={language as AppLanguage}
                        isDark={isDark}
                    />
                )}
                <LaunchMetricsModal
                    isOpen={isLaunchMetricsOpen}
                    onClose={() => setIsLaunchMetricsOpen(false)}
                    onRetry={openLaunchMetrics}
                    report={launchReport}
                    dailyInsightsSource={sajuState.dailyInsights?.source}
                    loading={launchReportLoading}
                    error={launchReportError}
                    copy={copy}
                    language={language as AppLanguage}
                    isDark={isDark}
                />
            </AnimatePresence>
        </div>
    );
};

export default ProfileScreen;
