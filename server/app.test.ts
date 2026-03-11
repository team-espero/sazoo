import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from './app.js';

const env = {
  nodeEnv: 'test',
  port: 8787,
  apiPrefix: '/api/v1',
  corsOrigins: ['*'],
  rateLimitWindowMs: 60000,
  rateLimitMax: 10,
  eventStore: { append: async () => {}, summarize: async () => ({}) },
  inviteClaimStore: { claim: async () => ({ status: 'claimed' }) },
  userStateStore: {
    getState: async (_identity: unknown, snapshot: any) => snapshot || {
      profiles: [],
      activeProfileId: 'me',
      userTier: 'FREE',
      onboardingComplete: false,
    },
    saveState: async (_identity: unknown, snapshot: any) => snapshot,
    promoteToUser: async (_identity: unknown, snapshot: any) => snapshot,
  },
  unlockStore: {
    listSpecialReports: async (_identity: unknown, snapshot: any) => snapshot || [],
    upsertSpecialReport: async (_identity: unknown, report: any) => report,
    promoteToUser: async (_identity: unknown, snapshot: any) => snapshot || [],
  },
  chatSummaryStore: {
    getSummary: async (_identity: unknown, _profileId: string, snapshot: any) => snapshot || {
      recentSummary: '',
      conversationDigest: '',
      openLoops: [],
      lastAssistantGuidance: '',
      updatedAt: new Date().toISOString(),
    },
    upsertSummary: async (_identity: unknown, _profileId: string, snapshot: any) => snapshot,
    promoteToUser: async () => ['me'],
  },
  profileMemoryStore: {
    getMemory: async (_identity: unknown, _profileId: string, snapshot: unknown) => snapshot || {
      version: 'phase4.v2',
      knowledgeLevel: 'newbie',
      preferredTone: 'mysterious_intimate',
      primaryConcerns: [],
      recurringTopics: [],
      relationshipContext: null,
      recentSummary: '',
      conversationDigest: '',
      openLoops: [],
      lastAssistantGuidance: '',
      lastUserQuestions: [],
    },
    upsertMemory: async (_identity: unknown, _profileId: string, snapshot: unknown) => snapshot || {
      version: 'phase4.v2',
      knowledgeLevel: 'newbie',
      preferredTone: 'mysterious_intimate',
      primaryConcerns: [],
      recurringTopics: [],
      relationshipContext: null,
      recentSummary: '',
      conversationDigest: '',
      openLoops: [],
      lastAssistantGuidance: '',
      lastUserQuestions: [],
    },
    promoteToUser: async () => ['me'],
  },
  walletStore: {
    purchaseBundle: async () => ({}),
    claimVerifiedPurchase: async () => ({
      status: 'verified',
      creditedCoins: 3,
      wallet: {
        freeCoins: 3,
        lastRefillTime: Date.now(),
        freeCoinsExpireAt: Date.now() + 86400000,
        paidCoins: 3,
        adsWatchedToday: 0,
        lastAdResetTime: Date.now(),
        totalCoinsUsed: 0,
      },
      bundleId: 'yeopjeon_3_bundle',
      productId: 'yeopjeon_3_bundle',
      externalPurchaseId: 'order_1',
    }),
  },
  receiptVerifier: {
    verifyProductPurchase: async () => ({
      provider: 'google_play',
      bundleId: 'yeopjeon_3_bundle',
      productId: 'yeopjeon_3_bundle',
      coinAmount: 3,
      priceKrw: 500,
      externalPurchaseId: 'order_1',
      orderId: 'order_1',
      purchaseToken: 'token_123456789012',
      metadata: { acknowledged: true },
    }),
  },
};

const aiProvider = {
  async chat(payload: { message: string }) {
    return { reply: `echo:${payload.message}` };
  },
  async dailyInsights() {
    return {
      luckyItems: [{ emoji: '??', name: 'Green tea', type: 'Food' }],
      sajuTip: 'Keep your pace steady.',
      elementTip: 'Add a short walk at noon.',
      energyTip: 'Hydrate and stretch regularly.',
      cycleTip: 'Small wins compound this week.',
    };
  },
};

describe('server app', () => {
  const app = createApp({ env, aiProvider });

  it('returns health status', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });

  it('returns chat reply', async () => {
    const response = await request(app).post('/api/v1/fortune/chat').send({
      message: 'hello',
      language: 'en',
    });
    expect(response.status).toBe(200);
    expect(response.body.data.reply).toBe('echo:hello');
  });

  it('rejects invalid chat payload', async () => {
    const response = await request(app).post('/api/v1/fortune/chat').send({
      message: '',
      language: 'en',
    });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('verifies a Google Play purchase and returns credited wallet data', async () => {
    const response = await request(app).post('/api/v1/wallet/purchase/verify').send({
      installationId: 'install_test_1234',
      provider: 'google_play',
      bundleId: 'yeopjeon_3_bundle',
      productId: 'yeopjeon_3_bundle',
      purchaseToken: 'purchase_token_1234567890',
    });

    expect(response.status).toBe(200);
    expect(response.body.data.status).toBe('verified');
    expect(response.body.data.creditedCoins).toBe(3);
    expect(response.body.data.provider).toBe('google_play');
  });

  it('returns server-backed profile memory state', async () => {
    const response = await request(app).post('/api/v1/memory/profile/state').send({
      installationId: 'install_test_1234',
      profileId: 'me',
      snapshot: {
        version: 'phase4.v2',
        knowledgeLevel: 'newbie',
        preferredTone: 'mysterious_intimate',
        primaryConcerns: ['love'],
        recurringTopics: ['love'],
      },
    });

    expect(response.status).toBe(200);
    expect(response.body.data.version).toBe('phase4.v2');
    expect(response.body.data.primaryConcerns).toContain('love');
  });

  it('promotes installation state into a user-backed record', async () => {
    const response = await request(app).post('/api/v1/auth/promote-installation').send({
      installationId: 'install_test_1234',
      userId: 'firebase_uid_1234',
      snapshot: {
        profiles: [{
          id: 'me',
          name: 'Tester',
          gender: 'female',
          knowledgeLevel: 'newbie',
          birthDate: { year: 1994, month: 4, day: 5, hour: 11, minute: 30, ampm: 'AM' },
          calendarType: 'solar',
          isTimeUnknown: false,
          relation: 'me',
          memo: '',
        }],
        activeProfileId: 'me',
        userTier: 'FREE',
        onboardingComplete: true,
      },
      specialReports: [],
    });

    expect(response.status).toBe(200);
    expect(response.body.data.userState.activeProfileId).toBe('me');
    expect(response.body.data.promotedProfileIds).toContain('me');
  });
});

