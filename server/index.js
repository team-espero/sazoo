import { createGeminiProvider } from './ai/geminiProvider.js';
import { createEventStore } from './analytics/eventStore.js';
import { createApp } from './app.js';
import { createChatSummaryStore } from './chat/store.js';
import { getServerEnv } from './env.js';
import { createInviteClaimStore } from './invite/claimStore.js';
import { createProfileMemoryStore } from './memory/store.js';
import { createReceiptVerifier } from './payments/receiptVerifier.js';
import { createUnlockStore } from './unlocks/store.js';
import { createUserStateStore } from './user/store.js';
import { createWalletStore } from './wallet/store.js';

const serverEnv = getServerEnv();

const aiProvider = createGeminiProvider({
  apiKey: serverEnv.geminiApiKey,
  chatModel: serverEnv.geminiChatModel,
  insightsModel: serverEnv.geminiInsightsModel,
});

const eventStore = createEventStore(serverEnv.analyticsLogPath);
const inviteClaimStore = createInviteClaimStore(serverEnv.inviteClaimsPath);
const walletStore = createWalletStore(serverEnv.walletDbPath, {
  migrationSourcePath: serverEnv.walletStorePath,
});
const userStateStore = createUserStateStore(serverEnv.launchDbPath);
const unlockStore = createUnlockStore(serverEnv.launchDbPath);
const chatSummaryStore = createChatSummaryStore(serverEnv.launchDbPath);
const profileMemoryStore = createProfileMemoryStore(serverEnv.launchDbPath, {
  migrationSourcePath: serverEnv.profileMemoryDbPath,
});
const receiptVerifier = createReceiptVerifier(serverEnv);

const app = createApp({
  env: {
    ...serverEnv,
    eventStore,
    inviteClaimStore,
    walletStore,
    userStateStore,
    unlockStore,
    chatSummaryStore,
    profileMemoryStore,
    receiptVerifier,
  },
  aiProvider,
});

app.listen(serverEnv.port, () => {
  console.log(`[server] listening on http://localhost:${serverEnv.port}`);
  console.log(`[server] api prefix: ${serverEnv.apiPrefix}`);
});
