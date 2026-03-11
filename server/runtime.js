import { createGeminiProvider } from './ai/geminiProvider.js';
import { createEventStore } from './analytics/eventStore.js';
import { createPostgresEventStore } from './analytics/postgresEventStore.js';
import { createApp } from './app.js';
import { createKakaoAuthService } from './auth/kakaoAuth.js';
import { createAuthIdentityStore } from './authIdentity/store.js';
import { createAuthIdentityStore as createPostgresAuthIdentityStore } from './authIdentity/postgresStore.js';
import { createChatSummaryStore } from './chat/store.js';
import { createChatSummaryStore as createPostgresChatSummaryStore } from './chat/postgresStore.js';
import { getServerEnv } from './env.js';
import { createInviteClaimStore } from './invite/claimStore.js';
import { createInviteClaimStore as createPostgresInviteClaimStore } from './invite/postgresClaimStore.js';
import { createProfileMemoryStore } from './memory/store.js';
import { createProfileMemoryStore as createPostgresProfileMemoryStore } from './memory/postgresStore.js';
import { createReceiptVerifier } from './payments/receiptVerifier.js';
import { createShareMetadataStore } from './share/store.js';
import { createShareMetadataStore as createPostgresShareMetadataStore } from './share/postgresStore.js';
import { createUnlockStore } from './unlocks/store.js';
import { createUnlockStore as createPostgresUnlockStore } from './unlocks/postgresStore.js';
import { createUserStateStore } from './user/store.js';
import { createUserStateStore as createPostgresUserStateStore } from './user/postgresStore.js';
import { createWalletStore } from './wallet/store.js';
import { createWalletStore as createPostgresWalletStore } from './wallet/postgresStore.js';

let cachedRuntime = null;

export function getRuntime() {
  if (cachedRuntime) {
    return cachedRuntime;
  }

  const serverEnv = getServerEnv();

  const aiProvider = createGeminiProvider({
    apiKey: serverEnv.geminiApiKey,
    chatModel: serverEnv.geminiChatModel,
    insightsModel: serverEnv.geminiInsightsModel,
  });

  const usingDurablePostgres = Boolean(serverEnv.databaseUrl);

  const eventStore = usingDurablePostgres
    ? createPostgresEventStore(serverEnv.databaseUrl)
    : createEventStore(serverEnv.analyticsLogPath);
  const inviteClaimStore = usingDurablePostgres
    ? createPostgresInviteClaimStore(serverEnv.databaseUrl)
    : createInviteClaimStore(serverEnv.inviteClaimsPath);
  const walletStore = usingDurablePostgres
    ? createPostgresWalletStore(serverEnv.databaseUrl)
    : createWalletStore(serverEnv.walletDbPath, {
        migrationSourcePath: serverEnv.walletStorePath,
      });
  const userStateStore = usingDurablePostgres
    ? createPostgresUserStateStore(serverEnv.databaseUrl)
    : createUserStateStore(serverEnv.launchDbPath);
  const unlockStore = usingDurablePostgres
    ? createPostgresUnlockStore(serverEnv.databaseUrl)
    : createUnlockStore(serverEnv.launchDbPath);
  const authIdentityStore = usingDurablePostgres
    ? createPostgresAuthIdentityStore(serverEnv.databaseUrl)
    : createAuthIdentityStore(serverEnv.launchDbPath);
  const chatSummaryStore = usingDurablePostgres
    ? createPostgresChatSummaryStore(serverEnv.databaseUrl)
    : createChatSummaryStore(serverEnv.launchDbPath);
  const profileMemoryStore = usingDurablePostgres
    ? createPostgresProfileMemoryStore(serverEnv.databaseUrl)
    : createProfileMemoryStore(serverEnv.launchDbPath, {
        migrationSourcePath: serverEnv.profileMemoryDbPath,
      });
  const shareMetadataStore = usingDurablePostgres
    ? createPostgresShareMetadataStore(serverEnv.databaseUrl)
    : createShareMetadataStore(serverEnv.launchDbPath);
  const receiptVerifier = createReceiptVerifier(serverEnv);
  const kakaoAuthService = createKakaoAuthService(serverEnv);
  const shareMetadataStore = usingDurablePostgres
    ? createPostgresShareMetadataStore(serverEnv.databaseUrl)
    : createShareMetadataStore(serverEnv.launchDbPath);

  const app = createApp({
    env: {
      ...serverEnv,
      eventStore,
      inviteClaimStore,
      walletStore,
      userStateStore,
      unlockStore,
      authIdentityStore,
      chatSummaryStore,
      profileMemoryStore,
      shareMetadataStore,
      receiptVerifier,
      kakaoAuthService,
      shareMetadataStore,
    },
    aiProvider,
  });

  cachedRuntime = {
    serverEnv,
    app,
    services: {
      eventStore,
      inviteClaimStore,
      walletStore,
      userStateStore,
      unlockStore,
      authIdentityStore,
      chatSummaryStore,
      profileMemoryStore,
      receiptVerifier,
      kakaoAuthService,
      shareMetadataStore,
    },
  };

  return cachedRuntime;
}

export function createRuntimeApp() {
  return getRuntime().app;
}
