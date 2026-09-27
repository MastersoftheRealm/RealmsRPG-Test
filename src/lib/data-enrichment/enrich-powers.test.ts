import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import type { UserPower } from '@/hooks/use-user-library';
import { PART_IDS } from '@/lib/id-constants';
import { buildRequiredProficiencies } from '@/lib/proficiencies';
import type { CharacterPower, CharacterProficiency } from '@/types';
import { enrichPowers } from './enrich-powers';

function part(p: Partial<PowerPart> & Pick<PowerPart, 'id' | 'name'>): PowerPart {
  return {
    description: p.name,
    category: 'General',
    mechanic: false,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    duration: false,
    ...p,
  };
}

const partsDb: PowerPart[] = [
  part({
    id: String(PART_IDS.ELEMENTAL_DAMAGE),
    name: 'Elemental Damage',
    category: 'Damage',
    mechanic: true,
    base_en: 3,
    op_1_en: 1,
    base_tp: 2,
    op_1_tp: 0.5,
  }),
  part({
    id: String(PART_IDS.POWER_RANGE),
    name: 'Power Range',
    mechanic: true,
    base_en: 1,
    op_1_en: 1,
    base_tp: 1,
  }),
  part({ id: '900', name: 'Immobile', base_en: 4, base_tp: 1 }),
  part({ id: '901', name: 'Slow', base_en: 2, op_1_en: 1, base_tp: 1 }),
];

const d10 = (type: string) => [{ amount: 1, size: 10, type }];

const burst = {
  id: 'burst',
  name: 'Elemental Burst',
  actionType: 'basic',
  range: { steps: 3 },
  parts: [],
  composition: {
    structure: 'choice',
    variants: [
      { id: 'fire', label: 'Fire', damage: d10('fire') },
      { id: 'ice', label: 'Ice', damage: d10('ice') },
      { id: 'lightning', label: 'Lightning', damage: d10('lightning') },
    ],
  },
} as unknown as UserPower;

const frostField = {
  id: 'frost',
  name: 'Frost Field',
  actionType: 'basic',
  range: { steps: 4 },
  parts: [],
  composition: {
    structure: 'modify',
    variants: [
      { id: 'freeze', label: 'Freeze', damage: d10('ice'), parts: [{ id: 900, name: 'Immobile' }] },
      { id: 'chill', label: 'Chill', parts: [{ id: 901, name: 'Slow', op_1_lvl: 1 }] },
    ],
  },
} as unknown as UserPower;

const flame = {
  id: 'flame',
  name: 'Flame',
  parts: [],
  composition: {
    structure: 'alternate',
    variants: [
      {
        id: 'inferno',
        label: 'Inferno',
        actionType: 'basic',
        range: { steps: 4 },
        damage: d10('fire'),
        parts: [{ id: 900, name: 'Immobile' }],
      },
      { id: 'frost', label: 'Frost', actionType: 'basic', damage: d10('ice') },
    ],
  },
} as unknown as UserPower;

function requiredFor(power: UserPower, selectedVariantId?: string): CharacterProficiency[] {
  const enriched = enrichPowers(
    [{ id: String(power.id), name: power.name, selectedVariantId } as CharacterPower],
    [power],
    partsDb,
  );
  return buildRequiredProficiencies({
    powers: enriched,
    techniques: [],
    weapons: [],
    armor: [],
    powerPartsDb: partsDb,
  });
}

const damageTypes = (list: CharacterProficiency[]) =>
  list
    .map((p) => p.damageType)
    .filter(Boolean)
    .sort();

const summary = (list: CharacterProficiency[]) =>
  list.map((p) => `${p.name}|${p.damageType ?? ''}|${p.op1Level ?? 0}`).sort();

describe('enrichPowers → buildRequiredProficiencies (composed powers, TASK-934)', () => {
  it('Choice requires every variant damage type, whichever chip is picked', () => {
    expect(damageTypes(requiredFor(burst, 'ice'))).toEqual(['fire', 'ice', 'lightning']);
  });

  it('switching the Choice chip does not change the required set', () => {
    const baseline = summary(requiredFor(burst));
    expect(baseline.filter((s) => s.startsWith('Elemental Damage|'))).toHaveLength(3);
    expect(baseline.filter((s) => s.startsWith('Power Range|'))).toHaveLength(1);
    for (const pick of ['fire', 'ice', 'lightning']) {
      expect(summary(requiredFor(burst, pick))).toEqual(baseline);
    }
  });

  it('Modify requires the shared range once and every piece', () => {
    const required = requiredFor(frostField);
    expect(required.filter((p) => p.name === 'Power Range')).toHaveLength(1);
    expect(required.map((p) => p.name)).toEqual(expect.arrayContaining(['Immobile', 'Slow']));
    expect(damageTypes(required)).toEqual(['ice']);
  });

  it('Alternate requires every version, whichever chip is picked', () => {
    const baseline = summary(requiredFor(flame));
    expect(damageTypes(requiredFor(flame))).toEqual(['fire', 'ice']);
    expect(requiredFor(flame).map((p) => p.name)).toEqual(
      expect.arrayContaining(['Immobile', 'Power Range']),
    );
    for (const pick of ['inferno', 'frost']) {
      expect(summary(requiredFor(flame, pick))).toEqual(baseline);
    }
  });

  it("the row's damage still follows the Choice pick", () => {
    const [enriched] = enrichPowers(
      [{ id: 'burst', name: 'Elemental Burst', selectedVariantId: 'ice' } as CharacterPower],
      [burst],
      partsDb,
    );
    expect(String(enriched?.damage)).toContain('ice');
    expect(String(enriched?.damage)).not.toContain('fire');
  });
});
