import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { buildOfficialPowerRows, officialPowerDetailSections } from './official-power-list';

const partsDb: PowerPart[] = [
  {
    id: String(PART_IDS.ELEMENTAL_DAMAGE),
    name: 'Elemental Damage',
    description: '',
    category: 'Damage',
    mechanic: true,
    base_en: 3,
    op_1_en: 1,
    base_tp: 2,
    percentage: false,
    duration: false,
  },
];

describe('officialPowerDetailSections', () => {
  it('places choice variants above detail chips (86e3mer39)', () => {
    const row = buildOfficialPowerRows(
      [
        {
          id: 'burst',
          docId: 'burst',
          name: 'Elemental Burst',
          description: 'Pick an element.',
          actionType: 'basic',
          composition: {
            structure: 'choice',
            variants: [
              { id: 'fire', label: 'Fire', damage: [{ amount: 1, size: 10, type: 'fire' }] },
              { id: 'ice', label: 'Ice', damage: [{ amount: 1, size: 10, type: 'ice' }] },
            ],
          },
        },
      ],
      partsDb,
    )[0]!;
    const labels = officialPowerDetailSections(row).map((section) => section.label);
    const variantsIndex = labels.findIndex((label) => label.includes('Variants'));
    const detailsIndex = labels.indexOf('Details');
    expect(variantsIndex).toBeGreaterThanOrEqual(0);
    expect(detailsIndex).toBeGreaterThanOrEqual(0);
    expect(variantsIndex).toBeLessThan(detailsIndex);
  });
});
