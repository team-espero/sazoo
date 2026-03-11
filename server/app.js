import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { ZodError } from 'zod';
import {
  chatRequestSchema,
  dailyInsightsRequestSchema,
} from './schemas/fortuneSchemas.js';
import { inviteClaimRequestSchema } from './schemas/inviteSchemas.js';
import { memoryStateRequestSchema } from './schemas/memorySchemas.js';
import {
  authPromotionRequestSchema,
  userStateRequestSchema,
  userStateSaveRequestSchema,
} from './schemas/userSchemas.js';
import {
  chatSummaryStateRequestSchema,
} from './schemas/chatSummarySchemas.js';
import {
  unlockStateRequestSchema,
  unlockUpsertRequestSchema,
} from './schemas/unlockSchemas.js';
import {
  walletCreditRequestSchema,
  walletPurchaseRequestSchema,
  walletRefundRequestSchema,
  walletRewardedAdClaimRequestSchema,
  walletSpendRequestSchema,
  walletStateRequestSchema,
} from './schemas/walletSchemas.js';
import { walletPurchaseVerifyRequestSchema } from './schemas/paymentSchemas.js';

const toChatSummarySnapshot = (memoryProfile) => ({
  recentSummary: memoryProfile?.recentSummary || '',
  conversationDigest: memoryProfile?.conversationDigest || '',
  openLoops: memoryProfile?.openLoops || [],
  lastAssistantGuidance: memoryProfile?.lastAssistantGuidance || '',
  updatedAt: new Date().toISOString(),
});

const mapKnownError = (error) => {
  const message = typeof error?.message === 'string' ? error.message : 'Unexpected error';
  const code = typeof error?.code === 'string' ? error.code : '';

  if (error instanceof ZodError) {
    return {
      status: 400,
      code: 'VALIDATION_ERROR',
      message: 'Request payload is invalid.',
      details: error.issues,
    };
  }

  if (error instanceof SyntaxError && error?.type === 'entity.parse.failed') {
    return {
      status: 400,
      code: 'INVALID_JSON',
      message: 'Request body must be valid JSON.',
    };
  }

  if (message.includes('Model returned invalid daily insights payload')) {
    return {
      status: 502,
      code: 'UPSTREAM_INVALID_PAYLOAD',
      message: 'AI response format is invalid.',
    };
  }

  if (message.includes('timed out')) {
    return {
      status: 504,
      code: 'UPSTREAM_TIMEOUT',
      message: 'AI response took too long.',
    };
  }

  if (message.includes('CORS')) {
    return {
      status: 403,
      code: 'CORS_BLOCKED',
      message: 'Origin is not allowed.',
    };
  }

  if (message.includes('INSUFFICIENT_COINS') || code === 'INSUFFICIENT_COINS') {
    return {
      status: 409,
      code: 'INSUFFICIENT_COINS',
      message: 'Not enough coins are available.',
    };
  }

  if (message.includes('INVALID_BUNDLE') || code === 'INVALID_BUNDLE') {
    return {
      status: 400,
      code: 'INVALID_BUNDLE',
      message: 'Requested coin bundle is invalid.',
    };
  }

  if (code === 'BUNDLE_PRODUCT_MISMATCH') {
    return {
      status: 400,
      code,
      message: 'Bundle id and product id do not match.',
    };
  }

  if (code === 'INVALID_RECEIPT') {
    return {
      status: 400,
      code,
      message: 'Purchase receipt or token is invalid.',
    };
  }

  if (code === 'PURCHASE_VERIFICATION_NOT_CONFIGURED') {
    return {
      status: 503,
      code,
      message: 'Purchase verification is not configured yet.',
    };
  }

  if (code === 'PURCHASE_VERIFICATION_FAILED' || code === 'PURCHASE_ACKNOWLEDGE_FAILED') {
    return {
      status: 502,
      code,
      message: 'Store purchase verification failed upstream.',
    };
  }

  return {
    status: 500,
    code: 'SERVER_ERROR',
    message: 'Internal server error.',
  };
};

const makeCorsOptions = (origins) => {
  const allowAll = origins.includes('*');
  const allowed = new Set(origins);

  return {
    origin(origin, callback) {
      if (allowAll || !origin || allowed.has(origin)) {
        callback(null, true);
        return;
      }
      callback(new Error('CORS blocked'));
    },
  };
};

export function createApp({ env, aiProvider }) {
  const app = express();

  app.disable('x-powered-by');
  app.use(
    helmet({
      contentSecurityPolicy: false,
    }),
  );
  app.use(cors(makeCorsOptions(env.corsOrigins)));
  app.use(express.json({ limit: '1mb' }));
  app.use((req, res, next) => {
    req.setTimeout(70000);
    res.setTimeout(70000);
    next();
  });

  const limiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: env.rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => {
      res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests. Try again shortly.',
        },
      });
    },
  });

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      env: env.nodeEnv,
    });
  });

  app.use(`${env.apiPrefix}/fortune`, limiter);

  app.post(`${env.apiPrefix}/client-events`, async (req, res) => {
    try {
      const event = {
        ...req.body,
        receivedAt: new Date().toISOString(),
      };
      await env.eventStore.append(event);
      res.status(202).json({ ok: true });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'EVENT_WRITE_FAILED',
          message: 'Failed to write client event.',
        },
      });
    }
  });

  app.get(`${env.apiPrefix}/client-events/report`, async (_req, res) => {
    try {
      const data = await env.eventStore.summarize();
      res.status(200).json({ data });
    } catch (error) {
      res.status(500).json({
        error: {
          code: 'EVENT_REPORT_FAILED',
          message: 'Failed to summarize client events.',
        },
      });
    }
  });

  app.post(`${env.apiPrefix}/invites/claim`, async (req, res, next) => {
    try {
      const payload = inviteClaimRequestSchema.parse(req.body);
      const data = await env.inviteClaimStore.claim(payload);
      if (env.unlockStore?.upsertSpecialReport && data?.specialReport) {
        await env.unlockStore.upsertSpecialReport(payload, data.specialReport);
      }
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/user/state`, async (req, res, next) => {
    try {
      const payload = userStateRequestSchema.parse(req.body);
      const data = await env.userStateStore.getState(payload, payload.snapshot);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/user/state/save`, async (req, res, next) => {
    try {
      const payload = userStateSaveRequestSchema.parse(req.body);
      const data = await env.userStateStore.saveState(payload, payload.snapshot);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/auth/promote-installation`, async (req, res, next) => {
    try {
      const payload = authPromotionRequestSchema.parse(req.body);
      const userState = await env.userStateStore.promoteToUser(payload, payload.snapshot);
      const profileIds = (userState?.profiles || []).map((profile) => profile.id);
      const specialReports = env.unlockStore?.promoteToUser
        ? await env.unlockStore.promoteToUser(payload, payload.specialReports || [])
        : [];
      const promotedProfileIds = env.profileMemoryStore?.promoteToUser
        ? await env.profileMemoryStore.promoteToUser(payload, profileIds)
        : [];
      const promotedSummaryIds = env.chatSummaryStore?.promoteToUser
        ? await env.chatSummaryStore.promoteToUser(payload, profileIds)
        : [];

      res.status(200).json({
        data: {
          userState,
          specialReports,
          promotedProfileIds,
          promotedSummaryIds,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/memory/profile/state`, async (req, res, next) => {
    try {
      const payload = memoryStateRequestSchema.parse(req.body);
      const data = await env.profileMemoryStore.getMemory(payload, payload.profileId, payload.snapshot);
      if (env.chatSummaryStore?.upsertSummary) {
        await env.chatSummaryStore.upsertSummary(payload, payload.profileId, toChatSummarySnapshot(data));
      }
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/memory/profile/upsert`, async (req, res, next) => {
    try {
      const payload = memoryStateRequestSchema.parse(req.body);
      const data = await env.profileMemoryStore.upsertMemory(payload, payload.profileId, payload.snapshot);
      if (env.chatSummaryStore?.upsertSummary) {
        await env.chatSummaryStore.upsertSummary(payload, payload.profileId, toChatSummarySnapshot(data));
      }
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/chat-summaries/profile/state`, async (req, res, next) => {
    try {
      const payload = chatSummaryStateRequestSchema.parse(req.body);
      const data = await env.chatSummaryStore.getSummary(payload, payload.profileId, payload.snapshot);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/unlocks/special-reports/state`, async (req, res, next) => {
    try {
      const payload = unlockStateRequestSchema.parse(req.body);
      const data = await env.unlockStore.listSpecialReports(payload, payload.snapshot);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/unlocks/special-reports/upsert`, async (req, res, next) => {
    try {
      const payload = unlockUpsertRequestSchema.parse(req.body);
      const data = await env.unlockStore.upsertSpecialReport(payload, payload.report);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/state`, async (req, res, next) => {
    try {
      const payload = walletStateRequestSchema.parse(req.body);
      const data = await env.walletStore.getWallet(payload, payload.snapshot);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/spend`, async (req, res, next) => {
    try {
      const payload = walletSpendRequestSchema.parse(req.body);
      const data = await env.walletStore.spend(payload, payload.context);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/refund`, async (req, res, next) => {
    try {
      const payload = walletRefundRequestSchema.parse(req.body);
      const data = await env.walletStore.refund(payload, payload.source, payload.reason);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/purchase`, async (req, res, next) => {
    try {
      const payload = walletPurchaseRequestSchema.parse(req.body);
      const data = await env.walletStore.purchaseBundle(payload, payload.bundleId);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/purchase/verify`, async (req, res, next) => {
    try {
      const payload = walletPurchaseVerifyRequestSchema.parse(req.body);
      const verification = await env.receiptVerifier.verifyProductPurchase(payload);
      const data = await env.walletStore.claimVerifiedPurchase(payload, verification);
      res.status(200).json({
        data: {
          ...data,
          provider: verification.provider,
          orderId: verification.orderId,
          purchaseToken: verification.purchaseToken,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/credit`, async (req, res, next) => {
    try {
      const payload = walletCreditRequestSchema.parse(req.body);
      const data = await env.walletStore.credit(payload, payload.amount, payload.reason);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/wallet/rewarded-ad/claim`, async (req, res, next) => {
    try {
      const payload = walletRewardedAdClaimRequestSchema.parse(req.body);
      const data = await env.walletStore.claimRewardedAd(
        payload,
        payload.provider,
        payload.placementId,
        payload.rewardClaimId,
      );
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/fortune/chat`, async (req, res, next) => {
    try {
      const payload = chatRequestSchema.parse(req.body);
      const shouldPersistMemory = !!(
        env.profileMemoryStore
        && payload.installationId
        && payload.profile?.id
        && payload.memoryProfile
      );

      const mergedMemoryProfile = shouldPersistMemory
        ? await env.profileMemoryStore.upsertMemory(payload, payload.profile.id, payload.memoryProfile)
        : payload.memoryProfile;
      if (env.chatSummaryStore?.upsertSummary && mergedMemoryProfile && payload.profile?.id) {
        await env.chatSummaryStore.upsertSummary(payload, payload.profile.id, toChatSummarySnapshot(mergedMemoryProfile));
      }

      const data = await aiProvider.chat({
        ...payload,
        memoryProfile: mergedMemoryProfile,
      });
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.post(`${env.apiPrefix}/fortune/daily-insights`, async (req, res, next) => {
    try {
      const payload = dailyInsightsRequestSchema.parse(req.body);
      const data = await aiProvider.dailyInsights(payload);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  });

  app.use((error, _req, res, _next) => {
    console.error('[server] request failed', {
      code: error?.code || '',
      message: error?.message || 'Unexpected error',
      stack: error?.stack || '',
    });

    const mapped = mapKnownError(error);
    res.status(mapped.status).json({
      error: {
        code: mapped.code,
        message: mapped.message,
        details: mapped.details,
      },
    });
  });

  return app;
}
