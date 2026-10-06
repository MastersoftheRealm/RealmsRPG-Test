import { describe, expect, it } from 'vitest';
import type { LibraryPower } from '@/types/library';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import { loadRepoCodexParts } from '@/lib/calculators/codex-parts-csv';
import { libraryItemToPowerDocument } from '@/lib/library-selectable-builders';
import type { CreatureData } from './creature-stat-block-types';
import { buildPowersForDisplay } from './creature-stat-block-display-data';

describe('buildPowersForDisplay energy', () => {
  it('prices Shared apply-to-duration through the same document as the library', () => {
    const partsDb = loadRepoCodexParts();
    const power = {
      id: 'sphere-daze',
      docId: 'sphere-daze',
      name: 'Sphere Daze',
      description: '',
      parts: [{ id: 339, name: 'Daze', applyDuration: true }],
      actionType: 'basic',
      area: { type: 'sphere', level: 1 },
      duration: { type: 'minutes', value: 1 },
      composition: {
        structure: 'modify' as const,
        variants: [{ id: 'extra', label: 'Extra' }],
      },
    } satisfies LibraryPower;

    const priced = derivePowerDisplay(libraryItemToPowerDocument(power), partsDb);
    const stripped = derivePowerDisplay(
      libraryItemToPowerDocument({
        ...power,
        parts: power.parts.map((part) => ({ ...part, applyDuration: false })),
      }),
      partsDb,
    );
    expect(priced.energy).not.toBe(stripped.energy);

    const creature = {
      id: 'c1',
      name: 'Caster',
      powers: [{ id: 'sphere-daze', name: 'Sphere Daze' }],
    } satisfies CreatureData;
    const row = buildPowersForDisplay(creature, [power], [], partsDb)[0];
    expect(row?.energyCost).toBe(priced.energy);
  });
});
