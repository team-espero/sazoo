import { mkdtempSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { writeFileSync } from 'node:fs';
import { createChatSummaryStore } from '../server/chat/store.js';
import { createProfileMemoryStore } from '../server/memory/store.js';
import { createUnlockStore } from '../server/unlocks/store.js';
import { createUserStateStore } from '../server/user/store.js';

const tempDir = mkdtempSync(path.join(os.tmpdir(), 'sazoo-launch-'));
const dbPath = path.join(tempDir, 'launch.sqlite');

const identity = { installationId: 'install_1234' };
const promotedIdentity = { installationId: 'install_1234', userId: 'firebase_uid_1234' };

const userStore = createUserStateStore(dbPath);
const unlockStore = createUnlockStore(dbPath);
const chatSummaryStore = createChatSummaryStore(dbPath);
const memoryStore = createProfileMemoryStore(dbPath);

await userStore.saveState(identity, {
  profiles: [{
    id: 'me',
    name: 'Kim',
    gender: 'female',
    knowledgeLevel: 'newbie',
    birthDate: { year: 1994, month: 4, day: 5, hour: 11, minute: 30, ampm: 'AM' },
    calendarType: 'solar',
    isTimeUnknown: false,
    relation: 'me',
    memo: '',
  }],
  activeProfileId: 'me',
  userTier: 'BASIC',
  onboardingComplete: true,
});
await unlockStore.upsertSpecialReport(identity, {
  id: 'invite_comparison_1',
  type: 'invite_comparison',
  title: 'Comparison report',
  summary: 'A shared reading was unlocked.',
  sourceInviteId: 'invite_1',
  unlockedAt: new Date().toISOString(),
});
await chatSummaryStore.upsertSummary(identity, 'me', {
  recentSummary: 'The user asked about love and work timing.',
  conversationDigest: 'Older dialogue focused on whether to move first or wait.',
  openLoops: ['Should I move first or wait for a better month?'],
  lastAssistantGuidance: 'Choose one priority before trying to carry both.',
});
await memoryStore.upsertMemory(identity, 'me', {
  version: 'phase4.v2',
  knowledgeLevel: 'newbie',
  preferredTone: 'mysterious_intimate',
  primaryConcerns: ['love'],
  recurringTopics: ['love', 'timing'],
  relationshipContext: { relation: 'me', focus: 'love' },
  recentSummary: 'The user wants clarity about love timing.',
  conversationDigest: 'Earlier conversation themes: love, timing.',
  openLoops: ['Should I move first or wait for a better month?'],
  lastAssistantGuidance: 'Move gently and watch how the next week settles.',
  lastUserQuestions: ['Should I move first or wait for a better month?'],
});

const promotedState = await userStore.promoteToUser(promotedIdentity, undefined);
const promotedReports = await unlockStore.promoteToUser(promotedIdentity, undefined);
const promotedSummaries = await chatSummaryStore.promoteToUser(promotedIdentity, ['me']);
const promotedMemoryProfiles = await memoryStore.promoteToUser(promotedIdentity, ['me']);

const canonicalState = await userStore.getState(promotedIdentity, undefined);
const canonicalReports = await unlockStore.listSpecialReports(promotedIdentity, undefined);
const canonicalSummary = await chatSummaryStore.getSummary(promotedIdentity, 'me', undefined);
const canonicalMemory = await memoryStore.getMemory(promotedIdentity, 'me', undefined);

const result = {
  generatedAt: new Date().toISOString(),
  passed: true,
  promotedState,
  promotedReportsCount: promotedReports.length,
  promotedSummaries,
  promotedMemoryProfiles,
  canonicalState,
  canonicalReports,
  canonicalSummary,
  canonicalMemory,
};

if (
  canonicalState.activeProfileId !== 'me'
  || canonicalState.userTier !== 'BASIC'
  || canonicalReports.length !== 1
  || !canonicalSummary.openLoops[0]?.includes('move first')
  || !canonicalMemory.primaryConcerns.includes('love')
) {
  result.passed = false;
  process.exitCode = 1;
}

writeFileSync(path.resolve('qa_launch_db_state_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(result, null, 2));

try {
  rmSync(tempDir, { recursive: true, force: true });
} catch {
  // Best effort cleanup on Windows.
}

