import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createProfileMemoryStore } from '../server/memory/store.js';

const tempDir = mkdtempSync(path.join(tmpdir(), 'sazoo-memory-'));

const cleanup = () => {
  try {
    rmSync(tempDir, { recursive: true, force: true });
  } catch {
    // SQLite may still hold a handle briefly on Windows. The temp directory is disposable.
  }
};

try {
  const legacyPath = path.join(tempDir, 'profile-memory.sqlite');
  const launchDbPath = path.join(tempDir, 'sazoo-launch.sqlite');

  execFileSync(process.execPath, [
    '--input-type=module',
    '-e',
    `
      import { DatabaseSync } from 'node:sqlite';
      const db = new DatabaseSync(${JSON.stringify(legacyPath)});
      db.exec(\`
        CREATE TABLE profile_memory (
          owner_key TEXT NOT NULL,
          profile_id TEXT NOT NULL,
          installation_id TEXT,
          user_id TEXT,
          version TEXT NOT NULL,
          knowledge_level TEXT NOT NULL,
          preferred_tone TEXT NOT NULL,
          primary_concerns_json TEXT NOT NULL,
          recurring_topics_json TEXT NOT NULL,
          relationship_context_json TEXT NOT NULL,
          recent_summary TEXT NOT NULL,
          last_user_questions_json TEXT NOT NULL,
          updated_at TEXT NOT NULL,
          PRIMARY KEY (owner_key, profile_id)
        );
      \`);
      db.prepare(\`
        INSERT INTO profile_memory (
          owner_key, profile_id, installation_id, user_id, version, knowledge_level, preferred_tone,
          primary_concerns_json, recurring_topics_json, relationship_context_json, recent_summary,
          last_user_questions_json, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      \`).run(
        'installation:install_legacy',
        'me',
        'install_legacy',
        null,
        'phase4.v2',
        'newbie',
        'mysterious_intimate',
        JSON.stringify(['love']),
        JSON.stringify(['love']),
        JSON.stringify({ relation: 'me', focus: 'love' }),
        'Legacy summary',
        JSON.stringify(['Will love settle first?']),
        new Date().toISOString(),
      );
      db.close();
    `,
  ]);

  const store = createProfileMemoryStore(launchDbPath, { migrationSourcePath: legacyPath });
  const migrated = await store.getMemory({ installationId: 'install_legacy' }, 'me', {});

  if (!migrated.primaryConcerns.includes('love')) {
    throw new Error('Legacy migration did not preserve primary concerns.');
  }

  await store.upsertMemory(
    { installationId: 'install_legacy', userId: 'user_legacy' },
    'me',
    {
      version: 'phase4.v2',
      knowledgeLevel: 'expert',
      preferredTone: 'mysterious_intimate',
      primaryConcerns: ['career', 'timing'],
      recurringTopics: ['career', 'timing'],
      relationshipContext: { relation: 'me', focus: 'career' },
      recentSummary: 'The user is deciding whether to change jobs this quarter.',
      conversationDigest: 'Earlier conversation themes: career, timing. The older thread kept circling back to a possible move.',
      openLoops: ['Should I switch jobs before summer?'],
      lastAssistantGuidance: 'Choose the path that gives you steadier ground before faster expansion.',
      lastUserQuestions: ['Should I switch jobs before summer?'],
    },
  );

  const hydrated = await store.getMemory({ installationId: 'install_legacy', userId: 'user_legacy' }, 'me', {});

  if (!hydrated.conversationDigest.includes('career')) {
    throw new Error('Conversation digest was not persisted.');
  }

  if (!hydrated.openLoops.includes('Should I switch jobs before summer?')) {
    throw new Error('Open loops were not persisted.');
  }

  const result = {
    ok: true,
    launchDbPath,
    migratedPrimaryConcerns: migrated.primaryConcerns,
    hydratedConversationDigest: hydrated.conversationDigest,
    hydratedOpenLoops: hydrated.openLoops,
  };

  writeFileSync(path.resolve('qa_memory_store_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(result, null, 2));
} finally {
  cleanup();
}

