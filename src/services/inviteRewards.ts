import type { InvitePayload } from './invite';
import { KEYS, storage } from './storage';

export type SpecialReportUnlock = {
  id: string;
  type: 'invite_comparison';
  title: string;
  summary: string;
  sourceInviteId: string;
  unlockedAt: string;
};

export type InviteClaimStatus = 'claimed' | 'duplicate';

export type InviteRewardServerResult = {
  status: InviteClaimStatus;
  coinReward: number;
  claimedAt: string;
  specialReport: SpecialReportUnlock;
};

export type InviteRewardLocalState = {
  claimedInviteIds: string[];
  specialReports: SpecialReportUnlock[];
};

export const getUnlockedSpecialReports = () =>
  storage.get(KEYS.SPECIAL_REPORT_UNLOCKS, []) as SpecialReportUnlock[];

export const getClaimedInviteIds = () =>
  storage.get(KEYS.CLAIMED_INVITE_REWARDS, []) as string[];

export const getOrCreateInstallationId = () => {
  const existing = storage.get(KEYS.INSTALLATION_ID, null) as string | null;
  if (existing) return existing;

  const generated = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `install_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

  storage.set(KEYS.INSTALLATION_ID, generated);
  return generated;
};

export const persistInviteRewardResult = (
  invite: InvitePayload,
  result: InviteRewardServerResult,
): InviteRewardLocalState => {
  const currentClaimedInviteIds = getClaimedInviteIds();
  const nextClaimedInviteIds = currentClaimedInviteIds.includes(invite.inviteId)
    ? currentClaimedInviteIds
    : [...currentClaimedInviteIds, invite.inviteId];

  const currentReports = getUnlockedSpecialReports();
  const nextReports = currentReports.some((report) => report.id === result.specialReport.id)
    ? currentReports
    : [...currentReports, result.specialReport];

  storage.set(KEYS.CLAIMED_INVITE_REWARDS, nextClaimedInviteIds);
  storage.set(KEYS.SPECIAL_REPORT_UNLOCKS, nextReports);

  return {
    claimedInviteIds: nextClaimedInviteIds,
    specialReports: nextReports,
  };
};
