import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { compareDurationDisplayLabels } from '@/lib/utils/duration';
import { sortByColumn } from '@/hooks/use-sort';
import { getItemColumns, getModalGridColumns } from '@/lib/library-selectable-builders';
import {
  CLOUD_SYNC_SERVER_UNREACHABLE_BODY,
  CLOUD_SYNC_SERVER_UNREACHABLE_TITLE,
} from '@/components/patterns/chrome/cloud-sync-offline-banner';

const loginPrompt = readFileSync(
  new URL('../components/patterns/chrome/login-prompt-modal.tsx', import.meta.url),
  'utf8',
);
const powerPage = readFileSync(new URL('./(main)/power-creator/page.tsx', import.meta.url), 'utf8');
const powerWorkspace = readFileSync(
  new URL('./(main)/power-creator/use-power-creator-workspace.ts', import.meta.url),
  'utf8',
);
const libraryPage = readFileSync(new URL('./(main)/library/page.tsx', import.meta.url), 'utf8');
const creatorSave = readFileSync(new URL('../hooks/use-creator-save.ts', import.meta.url), 'utf8');
const offlineBanner = readFileSync(
  new URL('../components/patterns/chrome/cloud-sync-offline-banner.tsx', import.meta.url),
  'utf8',
);

describe('website bugs batch 19 — power creator save/load', () => {
  it('uses CloudSyncOfflineBanner copy for offline save (86e3jwurv)', () => {
    expect(CLOUD_SYNC_SERVER_UNREACHABLE_TITLE).toBe('Could not reach the server');
    expect(CLOUD_SYNC_SERVER_UNREACHABLE_BODY).toBe(
      'Your latest changes are not saved to the cloud. Check your connection and try again.',
    );
    expect(offlineBanner).toContain('CLOUD_SYNC_SERVER_UNREACHABLE_TITLE');
    expect(powerPage).toContain('CloudSyncOfflineBanner');
    expect(powerPage).toContain('saveSyncBlocked');
    expect(creatorSave).toContain('isLikelyNetworkFailure');
    expect(creatorSave).toContain('setSaveSyncBlocked(true)');
    expect(creatorSave).toContain("saveMessage.type !== 'success'");
  });

  it('holds the library delete success sentence pending confirmation of Deleted "${name}" (86e3jwuru)', () => {
    expect(libraryPage).not.toContain('Deleted "');
    expect(libraryPage).not.toMatch(/showToast\([^)]*Deleted/);
  });

  it('guest load prompt says load a power (86e3jwurr)', () => {
    expect(loginPrompt).toContain("contentType === 'power' ? 'a power' : contentType");
    expect(loginPrompt).toContain('load ${loadContentLabel} from your library');
  });

  it('clears ?edit= after the unsaved-guard sentinel pop, not before it (86e3jwurq)', () => {
    expect(powerWorkspace).toContain('creatorEditClearPlan');
    expect(powerWorkspace).toContain('bindCreatorEditClear');
    expect(powerWorkspace).toContain('acceptDraft()');
    expect(powerPage).toContain('router.replace(href, { scroll: false })');
    expect(powerPage).not.toContain("router.replace('/power-creator'");
  });

  it('sorts duration by game order, not alphabetically (86e3jwurm)', () => {
    expect(compareDurationDisplayLabels('Instant', '1 Round')).toBeLessThan(0);
    expect(compareDurationDisplayLabels('1 Round', '1 Minute')).toBeLessThan(0);
    expect(compareDurationDisplayLabels('1 Minute', 'Permanent')).toBeLessThan(0);
    const rows = [
      { name: 'b', columns: [{ key: 'Duration', value: 'Permanent' }] },
      { name: 'a', columns: [{ key: 'Duration', value: 'Instant' }] },
      { name: 'c', columns: [{ key: 'Duration', value: '1 Round' }] },
    ];
    const sorted = sortByColumn(rows, { col: 'Duration', dir: 1 });
    expect(sorted.map((r) => r.name)).toEqual(['a', 'c', 'b']);
  });

  it('load modal power rows keep action and name readable and chip damage (86e3jwurj)', () => {
    const cols = getItemColumns({ id: 'p1', name: 'Bolt' }, 'power', undefined, {
      energy: 2,
      actionType: 'Long (4 AP) Reaction',
      duration: '30 Minutes (Focus)',
      damage: '2d6 Fire',
      area: 'Single',
    });
    expect(cols.find((c) => c.key === 'Duration')?.allowMultiline).toBe(true);
    expect(cols.find((c) => c.key === 'Action')?.allowMultiline).toBe(true);
    expect(cols.map((c) => c.key)).not.toContain('Damage');
    const grid = getModalGridColumns('power');
    expect(grid).toContain('minmax(16ch, 1.45fr)');
    expect(grid).toContain('minmax(20ch, 1.2fr)');
    expect(grid).not.toContain('minmax(0,');
  });
});
