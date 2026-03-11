import { clientEnv } from '../../config/env';
import type { DaroRewardedBridge } from './daroBridge';

export type RewardedAdDisplayResult = {
  provider: 'DARO';
  placementId: string;
  rewardClaimId: string;
  status: 'completed' | 'dismissed' | 'not_ready';
  isMock: boolean;
};

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));
const createRewardClaimId = () =>
  (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function')
    ? `daro_${crypto.randomUUID()}`
    : `daro_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

export const showDaroRewardedAd = async (placementId: string): Promise<RewardedAdDisplayResult> => {
  const bridge = typeof window !== 'undefined' ? window.__SAZOO_DARO__ : undefined;
  const rewardClaimId = createRewardClaimId();

  if (bridge && typeof bridge.showRewardedAd === 'function') {
    const result = await bridge.showRewardedAd({ placementId, rewardClaimId });
    const completed = typeof result === 'boolean' ? result : !!result?.completed;

    return {
      provider: 'DARO',
      placementId,
      rewardClaimId: typeof result === 'object' && result?.rewardClaimId ? result.rewardClaimId : rewardClaimId,
      status: completed ? 'completed' : 'dismissed',
      isMock: false,
    };
  }

  if (clientEnv.appEnv !== 'prod') {
    await delay(900);
    return {
      provider: 'DARO',
      placementId,
      rewardClaimId,
      status: 'completed',
      isMock: true,
    };
  }

  return {
    provider: 'DARO',
    placementId,
    rewardClaimId,
    status: 'not_ready',
    isMock: false,
  };
};
