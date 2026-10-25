import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { formatCreatorPartEnergy } from '@/components/creator/power-part-card';
import { PART_IDS } from '@/lib/id-constants';
import { deriveArea, formatAreaForDisplay } from '@/lib/calculators/power-calc';
import {
  analyzePowerEnergy,
  buildPowerAdvancedCalculationGroups,
} from '@/lib/calculators';
import type { PowerPart } from '@/hooks/codex-types';
import { powerCreatorSummaryArea } from '@/app/(main)/power-creator/power-creator-from-shared';
import { formatCanTargetLine } from '@/lib/game/targeted-defenses';

const panel = readFileSync(
  new URL('../components/creator/advanced-calculations-panel.tsx', import.meta.url),
  'utf8',
);
const partCard = readFileSync(
  new URL('../components/creator/power-part-card.tsx', import.meta.url),
  'utf8',
);

function part(partial: Partial<PowerPart> & Pick<PowerPart, 'id' | 'name'>): PowerPart {
  return {
    description: partial.name,
    category: 'Test',
    mechanic: true,
    base_en: 0,
    base_tp: 0,
    percentage: false,
    duration: false,
    ...partial,
  };
}

describe('86e3jx9gj Duration extra wrap', () => {
  it('keeps the percent on its own and the phrase on the note line', () => {
    const damage = part({ id: '1', name: 'Magic Damage', base_en: 4 });
    const minute = part({
      id: String(PART_IDS.DURATION_MINUTE),
      name: 'Duration (Minute)',
      base_en: 0.75,
      duration: true,
    });
    const groups = buildPowerAdvancedCalculationGroups(
      analyzePowerEnergy(
        [
          { id: damage.id, name: damage.name, applyDuration: true },
          { id: minute.id, name: minute.name },
        ],
        [damage, minute],
      ),
    );
    const row = groups
      .find((group) => group.title === 'Combined Energy')
      ?.rows.find((item) => item.label === 'Duration extra');
    expect(row?.value).toBe('+75%');
    expect(row?.note).toBe('of duration-affected Energy');
    expect(row?.value).not.toMatch(/duration/i);
  });

  it('lets a long calculation value wrap instead of staying shrink-0', () => {
    expect(panel).toContain('flex flex-wrap items-baseline justify-between');
    expect(panel).toContain('max-w-full min-w-0 text-right');
    expect(panel).not.toContain('shrink-0 text-right');
  });
});

describe('86e3jx9ge part can-target vs summary targets', () => {
  it('labels a part defense as can-target, not as the power target', () => {
    expect(formatCanTargetLine(['Might'])).toBe('Can target: Might');
    expect(partCard).toContain('formatCanTargetLine(defensesFromPart(part))');
    expect(partCard).not.toContain('formatTargetsFact');
  });
});

describe('86e3jwt6c Area summary includes the level', () => {
  it('formats a stored area level on the summary', () => {
    expect(formatAreaForDisplay('cone', 3)).toBe('Level 3 Cone');
    expect(
      powerCreatorSummaryArea({
        area: { type: 'cone', level: 3 },
        fallback: 'Cone',
      }),
    ).toBe('Level 3 Cone');
    expect(
      powerCreatorSummaryArea({
        area: { type: 'none', level: 1 },
        inheritedLabel: 'Level 2 Sphere',
        inheritedOverridden: false,
        fallback: '1 target',
      }),
    ).toBe('Level 2 Sphere');
    expect(
      powerCreatorSummaryArea({
        area: { type: 'none', level: 1 },
        fallback: '1 target',
      }),
    ).toBe('1 target');
  });

  it('reads the level from the area part option', () => {
    expect(
      deriveArea([
        { id: PART_IDS.SPHERE_OF_EFFECT, name: 'Sphere of Effect', op_1_lvl: 0 },
      ]),
    ).toBe('Level 1 Sphere');
    expect(
      deriveArea([
        { id: PART_IDS.LINE_OF_EFFECT, name: 'Line of Effect', op_1_lvl: 4 },
      ]),
    ).toBe('Level 5 Line');
    expect(deriveArea([])).toBe('1 target');
  });
});

describe('86e3jtt7p percentage parts are not flat Energy', () => {
  it('shows a percentage base and option as percents, and a flat part as Energy', () => {
    expect(formatCreatorPartEnergy(1.25, true, 'multiplier')).toBe('+25%');
    expect(formatCreatorPartEnergy(0.125, true, 'option')).toBe('+12.5%');
    expect(formatCreatorPartEnergy(0.875, true, 'multiplier')).toBe('-12.5%');
    expect(formatCreatorPartEnergy(4, false, 'multiplier')).toBe('4');
    expect(formatCreatorPartEnergy(2, false, 'option')).toBe('+2');
    expect(partCard).toContain("formatCreatorPartEnergy(part.base_en, part.percentage, 'multiplier')");
    expect(partCard).toContain("formatCreatorPartEnergy(part.op_1_en, part.percentage, 'option')");
    expect(partCard).not.toContain('formatCost(part.base_en');
    expect(partCard).not.toContain('formatCost(part.op_1_en');
  });
});
