import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const EMPTY_STATE = {
  claims: {},
};

const clone = (value) => JSON.parse(JSON.stringify(value));

const safeReadJson = async (filePath) => {
  try {
    const raw = await readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.claims !== 'object') {
      return clone(EMPTY_STATE);
    }
    return parsed;
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      return clone(EMPTY_STATE);
    }
    throw error;
  }
};

const buildSpecialReport = ({ invite, language, claimedAt }) => {
  const titleByLanguage = {
    en: `${invite.inviterName}'s comparison report`,
    ko: `${invite.inviterName} \ube44\uad50 \ub9ac\ud3ec\ud2b8`,
    ja: `${invite.inviterName} \u6bd4\u8f03\u30ec\u30dd\u30fc\u30c8`,
  };

  return {
    id: `invite_comparison_${invite.inviteId}`,
    type: 'invite_comparison',
    title: titleByLanguage[language] || titleByLanguage.ko,
    summary: invite.comparisonSummary,
    sourceInviteId: invite.inviteId,
    unlockedAt: claimedAt,
  };
};

export function createInviteClaimStore(filePath) {
  const resolvedPath = path.resolve(filePath);
  const directory = path.dirname(resolvedPath);
  let writeQueue = Promise.resolve();

  const mutate = async (mutator) => {
    const current = await safeReadJson(resolvedPath);
    const next = await mutator(current);
    await mkdir(directory, { recursive: true });
    await writeFile(resolvedPath, JSON.stringify(next, null, 2), 'utf8');
    return next;
  };

  return {
    async claim({ invite, installationId, userId, language }) {
      const claimedAt = new Date().toISOString();

      let response;
      writeQueue = writeQueue.then(() =>
        mutate((state) => {
          const claimsByInvite = state.claims || {};
          const inviteEntry = claimsByInvite[invite.inviteId] || {
            invite,
            claimsByInstallation: {},
            claimsByUser: {},
          };

          inviteEntry.claimsByInstallation ||= {};
          inviteEntry.claimsByUser ||= {};

          const existingClaimByUser = userId ? inviteEntry.claimsByUser[userId] || null : null;
          const existingClaimByInstallation = inviteEntry.claimsByInstallation[installationId] || null;
          const existingClaim = existingClaimByUser || existingClaimByInstallation;

          if (existingClaim) {
            if (userId && !inviteEntry.claimsByUser[userId]) {
              inviteEntry.claimsByUser[userId] = existingClaim;
            }

            response = {
              status: 'duplicate',
              coinReward: 0,
              claimedAt: existingClaim.claimedAt,
              specialReport: existingClaim.specialReport,
            };
            claimsByInvite[invite.inviteId] = inviteEntry;
            return {
              claims: claimsByInvite,
            };
          }

          const specialReport = buildSpecialReport({ invite, language, claimedAt });
          const claimRecord = {
            claimedAt,
            coinReward: 1,
            specialReport,
          };

          inviteEntry.claimsByInstallation[installationId] = claimRecord;
          if (userId) {
            inviteEntry.claimsByUser[userId] = claimRecord;
          }

          claimsByInvite[invite.inviteId] = inviteEntry;
          response = {
            status: 'claimed',
            coinReward: 1,
            claimedAt,
            specialReport,
          };

          return {
            claims: claimsByInvite,
          };
        }),
      );

      await writeQueue;
      return response;
    },
  };
}
