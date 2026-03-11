export type DaroRewardedRequest = {
  placementId: string;
  rewardClaimId: string;
};

export type DaroRewardedBridgeResult =
  | boolean
  | {
      completed: boolean;
      rewardClaimId?: string;
      errorCode?: 'no_fill' | 'network' | 'internal';
    };

export type DaroRewardedBridge = {
  showRewardedAd: (payload: DaroRewardedRequest) => Promise<DaroRewardedBridgeResult>;
};

declare global {
  interface Window {
    __SAZOO_DARO__?: DaroRewardedBridge;
  }
}
