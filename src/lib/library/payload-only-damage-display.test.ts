import { describe, expect, it } from 'vitest';
import { rowToItem } from '@/lib/library-columnar';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import { buildOfficialPowerRows } from './official-power-list';
import { buildOfficialTechniqueRows } from './official-technique-list';

describe('official list damage from columnar read', () => {
  it('shows power damage when only the payload stores rows', () => {
    const item = rowToItem(
      'powers',
      {
        id: 'spark',
        name: 'Spark',
        action_type: 'basic',
        damage: [],
        payload: {
          parts: [],
          damage: [{ amount: 1, size: 6, type: 'fire' }],
        },
      },
      'official',
    ) as unknown as LibraryPower;

    const row = buildOfficialPowerRows([item], [])[0];
    expect(row?.damage).toBe('1d6 Fire');
  });

  it('shows technique damage when only the payload stores rows', () => {
    const item = rowToItem(
      'techniques',
      {
        id: 'cut',
        name: 'Cut',
        action_type: 'basic',
        damage: [],
        payload: {
          parts: [],
          attackMode: 'unarmed',
          damage: [{ amount: 2, size: 4, type: 'slashing' }],
        },
      },
      'official',
    ) as unknown as LibraryTechnique;

    const row = buildOfficialTechniqueRows([item], [])[0];
    expect(row?.damage).toBe('+2d4');
  });
});
