import { describe, expect, it, vi } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { resolvePowerComposition, type PowerDocument } from '@/lib/calculators';
import {
  buildPowerVariantChips,
  powerVariantsDetailSection,
  rollPowerRandomizeDie,
  withPowerReverseNote,
} from './power-variant-chips';

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

const burst: PowerDocument = {
  name: 'Elemental Burst',
  actionType: 'basic',
  composition: {
    structure: 'choice',
    variants: [
      { id: 'fire', label: 'Fire', damage: [{ amount: 1, size: 10, type: 'fire' }] },
      { id: 'ice', label: 'Ice', damage: [{ amount: 1, size: 10, type: 'ice' }] },
    ],
  },
};

describe('buildPowerVariantChips', () => {
  it('labels chips with variant names, marks current, and selects the others', () => {
    const res = resolvePowerComposition(burst, partsDb, { selectedVariantId: 'ice' })!;
    const onSelectVariant = vi.fn();
    const chips = buildPowerVariantChips(res, {
      select: { powerName: 'Elemental Burst', onSelectVariant },
    });
    expect(chips.map((c) => c.name)).toEqual(['Fire', 'Ice']);
    expect(chips[1]?.current).toBe(true);
    chips[0]?.onSelect?.();
    expect(onSelectVariant).toHaveBeenCalledWith('fire');
    expect(chips.some((c) => /Level/.test(c.name))).toBe(false);
  });

  it('keeps Modify chips browse-only', () => {
    const res = resolvePowerComposition(
      { ...burst, composition: { ...burst.composition!, structure: 'modify' } },
      partsDb,
    )!;
    const chips = buildPowerVariantChips(res, {
      select: { powerName: 'x', onSelectVariant: () => {} },
    });
    expect(chips.every((c) => c.onSelect === undefined && !c.current)).toBe(true);
  });

  it('has no chip row for a single variant', () => {
    const res = resolvePowerComposition(
      {
        ...burst,
        composition: { structure: 'choice', variants: [burst.composition!.variants[0]!] },
      },
      partsDb,
    )!;
    expect(buildPowerVariantChips(res)).toEqual([]);
    expect(powerVariantsDetailSection(res)).toBeUndefined();
  });

  it('rolls the Randomize die onto the face variant', () => {
    const res = resolvePowerComposition(
      {
        ...burst,
        composition: {
          structure: 'randomize',
          variants: burst.composition!.variants,
          die: { sides: 2, faces: ['fire', 'ice'] },
        },
      },
      partsDb,
    )!;
    expect(rollPowerRandomizeDie(res, () => 0.9)?.variant.id).toBe('ice');
    expect(rollPowerRandomizeDie(res, () => 0)?.face).toBe(1);
  });

  it('puts Reverse drawbacks in the description, never a chip', () => {
    const reverse = { damage: [{ amount: 1, size: 10, type: 'fire' }] };
    const plain = resolvePowerComposition(
      { ...burst, composition: { structure: 'none', variants: [], reverse } },
      partsDb,
    )!;
    expect(powerVariantsDetailSection(plain)).toBeUndefined();
    const res = resolvePowerComposition(
      { ...burst, composition: { ...burst.composition!, reverse } },
      partsDb,
    )!;
    const section = powerVariantsDetailSection(res)!;
    expect(section.chips.map((c) => c.name)).toEqual(['Fire', 'Ice']);
    const text = withPowerReverseNote('Blast.', res);
    expect(text.startsWith('Blast. Reverse Effects (1d10 fire)')).toBe(true);
    expect(text).toContain('cannot be nullified');
    expect(withPowerReverseNote('Blast.', undefined)).toBe('Blast.');
  });

  it('puts the structure rule text on the section label tip', () => {
    const choicePart = {
      ...partsDb[0]!,
      id: String(PART_IDS.POWER_CHOICE),
      name: 'Choice',
      description: 'Pick one portion when you cast.',
    };
    const res = resolvePowerComposition(burst, [...partsDb, choicePart])!;
    expect(powerVariantsDetailSection(res)?.labelHelp).toBe('Pick one portion when you cast.');
    const noCodex = resolvePowerComposition(burst, partsDb)!;
    expect(powerVariantsDetailSection(noCodex)?.labelHelp).toBeUndefined();
  });

  it('renders plain descriptor chips when no select handler is passed (read-only sheet)', () => {
    const res = resolvePowerComposition(burst, partsDb)!;
    const chips = buildPowerVariantChips(res);
    expect(chips.every((c) => c.onSelect === undefined)).toBe(true);
  });

  it('ignores a Modify piece description (one description for the power)', () => {
    const res = resolvePowerComposition(
      {
        ...burst,
        description: 'Cold.',
        composition: {
          structure: 'modify',
          variants: burst.composition!.variants.map((v) => ({ ...v, description: 'Invented.' })),
        },
      },
      partsDb,
    )!;
    expect(res.variants.every((v) => v.description === undefined)).toBe(true);
    expect(res.variants.every((v) => v.doc.description === 'Cold.')).toBe(true);
  });
});
