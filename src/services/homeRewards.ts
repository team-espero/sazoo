import { getCurrentAuthUserId } from './authSession';
import { KEYS, storage } from './storage';

type AppLanguage = 'en' | 'ko' | 'ja';

export type HomeNotificationRecord = {
  id: string;
  type: 'welcome_zodiac_gift';
  title: string;
  body: string;
  createdAt: string;
  metadata: {
    modelId: string;
    modelName: string;
    zodiacName: string;
  };
};

export type WelcomeZodiacGiftReward = {
  claimId: string;
  modelId: string;
  modelName: string;
  zodiacName: string;
  notification: HomeNotificationRecord;
};

type ScopedStringArrayMap = Record<string, string[]>;
type ScopedNotificationMap = Record<string, HomeNotificationRecord[]>;

type ZodiacRewardModel = {
  modelId: string;
  zodiacKo: string;
  zodiacEn: string;
  zodiacJa: string;
};

const HOME_REWARD_EVENT = 'sazoo-home-reward-change';
const DEFAULT_HOME_MODEL_ID = 'hanok';

const ZODIAC_REWARD_MODELS: ZodiacRewardModel[] = [
  { modelId: 'rat', zodiacKo: '쥐', zodiacEn: 'Rat', zodiacJa: 'Rat' },
  { modelId: 'ox', zodiacKo: '소', zodiacEn: 'Ox', zodiacJa: 'Ox' },
  { modelId: 'tiger', zodiacKo: '호랑이', zodiacEn: 'Tiger', zodiacJa: 'Tiger' },
  { modelId: 'rabbit', zodiacKo: '토끼', zodiacEn: 'Rabbit', zodiacJa: 'Rabbit' },
  { modelId: 'dragon', zodiacKo: '용', zodiacEn: 'Dragon', zodiacJa: 'Dragon' },
  { modelId: 'snake', zodiacKo: '뱀', zodiacEn: 'Snake', zodiacJa: 'Snake' },
  { modelId: 'horse', zodiacKo: '말', zodiacEn: 'Horse', zodiacJa: 'Horse' },
  { modelId: 'sheep', zodiacKo: '양', zodiacEn: 'Sheep', zodiacJa: 'Sheep' },
  { modelId: 'monkey', zodiacKo: '원숭이', zodiacEn: 'Monkey', zodiacJa: 'Monkey' },
  { modelId: 'rooster', zodiacKo: '닭', zodiacEn: 'Rooster', zodiacJa: 'Rooster' },
  { modelId: 'dog', zodiacKo: '개', zodiacEn: 'Dog', zodiacJa: 'Dog' },
  { modelId: 'pig', zodiacKo: '돼지', zodiacEn: 'Pig', zodiacJa: 'Pig' },
];

const emitHomeRewardChange = () => {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(HOME_REWARD_EVENT));
};

const getOwnerKey = (userId: string | null | undefined = getCurrentAuthUserId()) =>
  userId ? `user:${userId}` : null;

const getScopedStringArray = (key: string, ownerKey: string | null) => {
  if (!ownerKey) return [] as string[];
  const records = storage.get(key, {}) as ScopedStringArrayMap;
  const value = records[ownerKey];
  return Array.isArray(value) ? value : [];
};

const setScopedStringArray = (key: string, ownerKey: string | null, values: string[]) => {
  if (!ownerKey) return [];
  const records = storage.get(key, {}) as ScopedStringArrayMap;
  const nextValues = [...new Set(values.filter(Boolean))];
  storage.set(key, {
    ...records,
    [ownerKey]: nextValues,
  });
  return nextValues;
};

const getScopedNotifications = (ownerKey: string | null) => {
  if (!ownerKey) return [] as HomeNotificationRecord[];
  const records = storage.get(KEYS.HOME_NOTIFICATION_HISTORY, {}) as ScopedNotificationMap;
  const value = records[ownerKey];
  return Array.isArray(value) ? value : [];
};

const setScopedNotifications = (ownerKey: string | null, values: HomeNotificationRecord[]) => {
  if (!ownerKey) return [] as HomeNotificationRecord[];
  const records = storage.get(KEYS.HOME_NOTIFICATION_HISTORY, {}) as ScopedNotificationMap;
  storage.set(KEYS.HOME_NOTIFICATION_HISTORY, {
    ...records,
    [ownerKey]: values,
  });
  return values;
};

const getLocalizedRewardMeta = (reward: ZodiacRewardModel, language: AppLanguage) => {
  const zodiacName = language === 'en'
    ? reward.zodiacEn
    : language === 'ja'
      ? reward.zodiacJa
      : reward.zodiacKo;

  return {
    zodiacName,
    modelName: `12 zodiac signs - ${reward.zodiacEn}`,
  };
};

const getWelcomeGiftCopy = (
  language: AppLanguage,
  zodiacName: string,
  modelName: string,
  profileName?: string | null,
) => {
  if (language === 'en' || language === 'ja') {
    return {
      title: 'Your welcome gift has arrived.',
      body: `${profileName || 'You'} received the ${zodiacName} zodiac 3D asset "${modelName}".`,
    };
  }

  return {
    title: '환영의 선물이 도착했어요.',
    body: `${profileName ? `${profileName}님께 ` : ''}${zodiacName}띠 3D 에셋 ${modelName}을 선물했어요.`,
  };
};

export const getZodiacRewardByBirthYear = (birthYear: number) => {
  const normalizedIndex = ((birthYear - 4) % 12 + 12) % 12;
  return ZODIAC_REWARD_MODELS[normalizedIndex];
};

export const getUnlockedHomeModelIds = (userId?: string | null) => {
  const ownerKey = getOwnerKey(userId);
  const stored = getScopedStringArray(KEYS.HOME_UNLOCKED_MODELS, ownerKey);
  return [...new Set([DEFAULT_HOME_MODEL_ID, ...stored])];
};

export const unlockHomeModel = (modelId: string, userId?: string | null) => {
  const ownerKey = getOwnerKey(userId);
  if (!ownerKey) {
    return [DEFAULT_HOME_MODEL_ID];
  }

  const next = setScopedStringArray(
    KEYS.HOME_UNLOCKED_MODELS,
    ownerKey,
    [...getUnlockedHomeModelIds(userId), modelId],
  );
  emitHomeRewardChange();
  return next;
};

export const getHomeNotificationHistory = (userId?: string | null) => {
  const ownerKey = getOwnerKey(userId);
  return getScopedNotifications(ownerKey).slice().sort((left, right) => (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  ));
};

export const addHomeNotification = (notification: HomeNotificationRecord, userId?: string | null) => {
  const ownerKey = getOwnerKey(userId);
  if (!ownerKey) return [];

  const current = getScopedNotifications(ownerKey);
  const deduped = current.filter((item) => item.id !== notification.id);
  const next = [notification, ...deduped].slice(0, 24);
  setScopedNotifications(ownerKey, next);
  emitHomeRewardChange();
  return next;
};

export const subscribeToHomeRewards = (listener: () => void) => {
  if (typeof window === 'undefined') {
    return () => {};
  }

  const handler = () => listener();
  window.addEventListener(HOME_REWARD_EVENT, handler);
  return () => {
    window.removeEventListener(HOME_REWARD_EVENT, handler);
  };
};

export const claimWelcomeZodiacGift = ({
  userId,
  birthYear,
  profileName,
  language = 'ko',
}: {
  userId?: string | null;
  birthYear: number;
  profileName?: string | null;
  language?: AppLanguage;
}): WelcomeZodiacGiftReward | null => {
  const ownerKey = getOwnerKey(userId);
  if (!ownerKey) return null;

  const claimId = `welcome_zodiac_gift:${ownerKey}`;
  const claimed = getScopedStringArray(KEYS.HOME_WELCOME_GIFT_CLAIMS, ownerKey);
  if (claimed.includes(claimId)) {
    return null;
  }

  const rewardBase = getZodiacRewardByBirthYear(birthYear);
  const rewardMeta = getLocalizedRewardMeta(rewardBase, language);
  const copy = getWelcomeGiftCopy(language, rewardMeta.zodiacName, rewardMeta.modelName, profileName);
  const createdAt = new Date().toISOString();

  const notification: HomeNotificationRecord = {
    id: `${claimId}:${rewardBase.modelId}`,
    type: 'welcome_zodiac_gift',
    title: copy.title,
    body: copy.body,
    createdAt,
    metadata: {
      modelId: rewardBase.modelId,
      modelName: rewardMeta.modelName,
      zodiacName: rewardMeta.zodiacName,
    },
  };

  setScopedStringArray(KEYS.HOME_WELCOME_GIFT_CLAIMS, ownerKey, [...claimed, claimId]);
  setScopedStringArray(
    KEYS.HOME_UNLOCKED_MODELS,
    ownerKey,
    [...getUnlockedHomeModelIds(userId), rewardBase.modelId],
  );
  addHomeNotification(notification, userId);
  emitHomeRewardChange();

  return {
    claimId,
    modelId: rewardBase.modelId,
    modelName: rewardMeta.modelName,
    zodiacName: rewardMeta.zodiacName,
    notification,
  };
};
