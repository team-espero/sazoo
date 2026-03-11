import { createPostgresDatabase, acquireAdvisoryLock, fromJson } from '../db/postgres.js';

const EMPTY_STATE = {
  claimsByInstallation: {},
  claimsByUser: {},
};

const buildSpecialReport = ({ invite, language, claimedAt }) => {
  const titleByLanguage = {
    en: `${invite.inviterName}'s comparison report`,
    ko: `${invite.inviterName} comparison report`,
    ja: `${invite.inviterName} comparison report`,
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

export function createInviteClaimStore(databaseUrl) {
  const db = createPostgresDatabase(databaseUrl);
  const ready = db.query(`
    CREATE TABLE IF NOT EXISTS invite_claim_records (
      invite_id TEXT PRIMARY KEY,
      invite_json JSONB NOT NULL,
      claims_by_installation_json JSONB NOT NULL,
      claims_by_user_json JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const loadState = async (executor, inviteId) => {
    const { rows } = await executor.query(
      `
        SELECT invite_json, claims_by_installation_json, claims_by_user_json
        FROM invite_claim_records
        WHERE invite_id = $1
      `,
      [inviteId],
    );

    if (!rows[0]) {
      return null;
    }

    return {
      invite: fromJson(rows[0].invite_json, null),
      claimsByInstallation: fromJson(rows[0].claims_by_installation_json, {}),
      claimsByUser: fromJson(rows[0].claims_by_user_json, {}),
    };
  };

  const persistState = async (executor, inviteId, invite, state) => {
    await executor.query(
      `
        INSERT INTO invite_claim_records (
          invite_id, invite_json, claims_by_installation_json, claims_by_user_json, updated_at
        ) VALUES ($1, $2::jsonb, $3::jsonb, $4::jsonb, NOW())
        ON CONFLICT (invite_id) DO UPDATE SET
          invite_json = EXCLUDED.invite_json,
          claims_by_installation_json = EXCLUDED.claims_by_installation_json,
          claims_by_user_json = EXCLUDED.claims_by_user_json,
          updated_at = NOW()
      `,
      [
        inviteId,
        JSON.stringify(invite),
        JSON.stringify(state.claimsByInstallation || {}),
        JSON.stringify(state.claimsByUser || {}),
      ],
    );
  };

  return {
    async claim({ invite, installationId, userId, language }) {
      await ready;
      return db.withTransaction(async (client) => {
        await acquireAdvisoryLock(client, `invite:${invite.inviteId}`);

        const claimedAt = new Date().toISOString();
        const current = (await loadState(client, invite.inviteId)) || EMPTY_STATE;
        const claimsByInstallation = { ...(current.claimsByInstallation || {}) };
        const claimsByUser = { ...(current.claimsByUser || {}) };

        const existingClaimByUser = userId ? claimsByUser[userId] || null : null;
        const existingClaimByInstallation = claimsByInstallation[installationId] || null;
        const existingClaim = existingClaimByUser || existingClaimByInstallation;

        if (existingClaim) {
          if (userId && !claimsByUser[userId]) {
            claimsByUser[userId] = existingClaim;
            await persistState(client, invite.inviteId, invite, {
              claimsByInstallation,
              claimsByUser,
            });
          }

          return {
            status: 'duplicate',
            coinReward: 0,
            claimedAt: existingClaim.claimedAt,
            specialReport: existingClaim.specialReport,
          };
        }

        const specialReport = buildSpecialReport({ invite, language, claimedAt });
        const claimRecord = {
          claimedAt,
          coinReward: 1,
          specialReport,
        };

        claimsByInstallation[installationId] = claimRecord;
        if (userId) {
          claimsByUser[userId] = claimRecord;
        }

        await persistState(client, invite.inviteId, invite, {
          claimsByInstallation,
          claimsByUser,
        });

        return {
          status: 'claimed',
          coinReward: 1,
          claimedAt,
          specialReport,
        };
      });
    },
  };
}
