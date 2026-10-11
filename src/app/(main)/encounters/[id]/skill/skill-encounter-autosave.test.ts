import { readFileSync } from 'node:fs';
import path from 'node:path';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { flushDirtyAutosave } from '@/hooks/use-auto-save';
import { computeSkillRollResult } from '@/lib/game/encounter-utils';
import { encounterAutosaveBody, persistEncounterSave } from '@/services/encounter-service';
import { createDefaultEncounter, type Encounter, type SkillParticipant } from '@/types/encounter';

/**
 * Repro (86e3jrra4): add a participant, choose Athletics, submit a roll, refresh
 * while the status still says Unsaved changes. Totals, success/failure status,
 * acted count, and the selected skill must be on the save that the unload flush sends.
 */
function athleticsRollBeforeAutosaveFinishes(): Encounter {
  const base = createDefaultEncounter('skill', 'Gate');
  const difficultyScore = 10;
  const rollValue = 15;
  const { successes, failures } = computeSkillRollResult(rollValue, difficultyScore);
  const participant: SkillParticipant = {
    id: 'p-1',
    name: 'Runner',
    hasRolled: true,
    rollValue,
    successCount: successes,
    failureCount: failures,
    isSuccess: successes > 0,
    skillUsed: 'Athletics',
  };
  return {
    ...base,
    id: 'enc-1',
    skillEncounter: {
      difficultyScore,
      participants: [participant],
      currentSuccesses: successes,
      currentFailures: failures,
      additionalSuccesses: 0,
      additionalFailures: 0,
      requiredSuccesses: 1,
      maxFailures: 3,
    },
  };
}

describe('skill encounter unload flush (86e3jrra4)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('a refresh during unsaved changes sends the Athletics roll with keepalive', async () => {
    const encounter = athleticsRollBeforeAutosaveFinishes();
    const saved: Array<{ keepalive: boolean; body: ReturnType<typeof encounterAutosaveBody> }> = [];

    flushDirtyAutosave({
      enabled: true,
      dirty: true,
      data: encounter,
      save: (data, flush) => {
        saved.push({
          keepalive: flush.unload,
          body: encounterAutosaveBody(data),
        });
      },
    });

    expect(saved).toHaveLength(1);
    const request = saved[0]!;
    expect(request.keepalive).toBe(true);
    expect(request.body).not.toHaveProperty('id');
    expect(request.body).not.toHaveProperty('createdAt');

    const skill = request.body.skillEncounter;
    expect(skill).toBeDefined();
    const participant = skill?.participants[0];
    expect(participant?.name).toBe('Runner');
    expect(participant?.skillUsed).toBe('Athletics');
    expect(participant?.hasRolled).toBe(true);
    expect(participant?.successCount).toBe(2);
    expect(participant?.failureCount).toBe(0);
    expect(skill?.currentSuccesses).toBe(2);
    expect(skill?.currentFailures).toBe(0);
    expect(skill?.requiredSuccesses).toBe(1);
    expect(skill?.maxFailures).toBe(3);

    const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
    vi.stubGlobal('fetch', async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      return new Response(null, { status: 204 });
    });
    await persistEncounterSave('enc-1', request.body, { signedIn: true, keepalive: true });

    expect(calls).toHaveLength(1);
    const sentCall = calls[0]!;
    expect(sentCall.url).toBe('/api/encounters/enc-1');
    expect(sentCall.init?.method).toBe('PATCH');
    expect(sentCall.init?.keepalive).toBe(true);
    const sent = JSON.parse(String(sentCall.init?.body)) as {
      skillEncounter: {
        currentSuccesses: number;
        participants: Array<{ skillUsed: string; hasRolled: boolean }>;
      };
    };
    expect(sent.skillEncounter.participants[0]?.skillUsed).toBe('Athletics');
    expect(sent.skillEncounter.participants[0]?.hasRolled).toBe(true);
    expect(sent.skillEncounter.currentSuccesses).toBe(2);
  });

  it('does not flush a skill encounter that already reached Saved to cloud', () => {
    let called = false;
    flushDirtyAutosave({
      enabled: true,
      dirty: false,
      data: athleticsRollBeforeAutosaveFinishes(),
      save: () => {
        called = true;
      },
    });
    expect(called).toBe(false);
  });

  it('the debounced save does not use keepalive', async () => {
    const calls: Array<RequestInit | undefined> = [];
    vi.stubGlobal('fetch', async (_url: string, init?: RequestInit) => {
      calls.push(init);
      return new Response(null, { status: 204 });
    });
    await persistEncounterSave(
      'enc-1',
      encounterAutosaveBody(athleticsRollBeforeAutosaveFinishes()),
      {
        signedIn: true,
      },
    );
    expect(calls[0]?.keepalive).toBeUndefined();
  });

  it('the skill page wires the unload flush to that keepalive save', () => {
    const page = readFileSync(
      path.join(process.cwd(), 'src/app/(main)/encounters/[id]/skill/page.tsx'),
      'utf8',
    );
    const hook = readFileSync(path.join(process.cwd(), 'src/hooks/use-auto-save.ts'), 'utf8');
    expect(page).toContain('persistEncounterSave');
    expect(page).toContain('keepalive: true');
    expect(page).toContain('encounterAutosaveBody(data)');
    expect(hook).toContain("addEventListener('pagehide'");
    expect(hook).toContain('flushDirtyAutosave');
  });
});
