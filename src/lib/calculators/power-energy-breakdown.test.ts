import { describe, expect, it } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import { PART_IDS } from '@/lib/id-constants';
import { analyzePowerEnergy, calculatePowerCosts } from './power-calc';
import {
  buildPowerAdvancedCalculationGroups,
  formatDamageEnergyLabel,
  formatDurationPartModifier,
  formatEnergyNumber,
  formatPercentagePartModifier,
  formatSignedPercent,
} from './power-energy-breakdown';

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

const magicDamage = part({
  id: String(PART_IDS.MAGIC_DAMAGE),
  name: 'Magic Damage',
  category: 'Damage',
  base_en: 4,
  base_tp: 2,
});

/** Codex-shaped Sphere: percentage EN (1.25), not flat Energy. */
const sphere = part({
  id: String(PART_IDS.SPHERE_OF_EFFECT),
  name: 'Sphere of Effect',
  category: 'Area of Effect',
  base_en: 1.25,
  base_tp: 0,
  percentage: true,
});

const durationMinute = part({
  id: String(PART_IDS.DURATION_MINUTE),
  name: 'Duration (Minute)',
  category: 'Duration',
  base_en: 0.75,
  duration: true,
});

const focus = part({
  id: String(PART_IDS.DURATION_FOCUS),
  name: 'Focus for Duration',
  category: 'Duration',
  base_en: 0.5,
  duration: true,
});

const quickFree = part({
  id: String(PART_IDS.POWER_QUICK_OR_FREE_ACTION),
  name: 'Power Quick or Free Action',
  category: 'Action',
  base_en: 1.25,
  op_1_en: 0.25,
  percentage: true,
});

const reaction = part({
  id: String(PART_IDS.POWER_REACTION),
  name: 'Power Reaction',
  category: 'Action',
  base_en: 1.25,
  percentage: true,
});

const addWeapon = part({
  id: String(PART_IDS.ADD_WEAPON_TO_POWER),
  name: 'Add Weapon to Power',
  category: 'General',
  mechanic: false,
  base_en: 0,
  base_tp: 1,
});

describe('energy display formatters', () => {
  it('omits trailing zeros on energy numbers', () => {
    expect(formatEnergyNumber(4)).toBe('4');
    expect(formatEnergyNumber(1.5)).toBe('1.5');
    expect(formatEnergyNumber(0.125)).toBe('0.125');
  });

  it('formats signed percents without floor/ceil jargon', () => {
    expect(formatSignedPercent(25)).toBe('+25%');
    expect(formatSignedPercent(-12.5)).toBe('-12.5%');
    expect(formatPercentagePartModifier(1.25)).toBe('+25%');
    expect(formatPercentagePartModifier(1.5)).toBe('+50%');
    expect(formatPercentagePartModifier(0.875)).toBe('-12.5%');
    expect(formatDurationPartModifier('Duration (Minute)', 0.75)).toBe('+75%');
    expect(formatDurationPartModifier('Focus for Duration', 0.5)).toBe('-50%');
  });

  it('capitalizes damage type in labels', () => {
    expect(formatDamageEnergyLabel('fire', 1, 6)).toBe('Fire 1d6');
  });
});

describe('buildPowerAdvancedCalculationGroups', () => {
  it('matches calculatePowerCosts and uses Rounded Up (not ceil)', () => {
    const payload = [
      { id: magicDamage.id, name: magicDamage.name, op_1_lvl: 0 },
      {
        id: quickFree.id,
        name: quickFree.name,
        op_1_lvl: 1,
        displayLabel: 'Free Action',
        calcSection: 'action' as const,
      },
      {
        id: reaction.id,
        name: reaction.name,
        op_1_lvl: 0,
        displayLabel: 'Reaction',
        calcSection: 'action' as const,
      },
    ];
    const db = [magicDamage, quickFree, reaction];
    const costs = calculatePowerCosts(payload, db);
    const analysis = analyzePowerEnergy(payload, db);
    expect(analysis.energyRaw).toBe(costs.energyRaw);
    expect(analysis.totalEnergy).toBe(costs.totalEnergy);

    const groups = buildPowerAdvancedCalculationGroups(analysis);
    const text = JSON.stringify(groups);
    expect(text).not.toMatch(/ceil|floor|toFixed/i);
    expect(text).toContain('Rounded Up');
    expect(text).toContain('Free Action');
    expect(text).toContain('+50%');
    expect(text).toContain('Reaction');
    expect(text).toContain('+25%');

    const action = groups.find((g) => g.title === 'Action Type');
    expect(action).toBeTruthy();
    const damage = groups.find((g) => g.title === 'Damage');
    expect(damage?.rows.some((r) => r.value === '4')).toBe(true);

    const combined = groups.find((g) => g.title === 'Combined Energy');
    const energyCost = combined?.rows.find((r) => r.label === 'Energy Cost');
    expect(energyCost?.value).toBe(String(costs.totalEnergy));
  });

  it('shows duration extra from flat Apply duration; % Sphere only notes when flat Energy is duration-affected', () => {
    const payload = [
      {
        id: magicDamage.id,
        name: magicDamage.name,
        applyDuration: true,
        displayLabel: 'Fire 1d6',
      },
      {
        id: sphere.id,
        name: sphere.name,
        applyDuration: true,
        displayLabel: 'Level 1 Sphere',
      },
      {
        id: durationMinute.id,
        name: durationMinute.name,
        displayLabel: '1 Minute',
      },
      {
        id: focus.id,
        name: focus.name,
        displayLabel: 'Focus',
      },
    ];
    const db = [magicDamage, sphere, durationMinute, focus];
    const costs = calculatePowerCosts(payload, db);
    const groups = buildPowerAdvancedCalculationGroups(analyzePowerEnergy(payload, db));
    const titles = groups.map((g) => g.title);

    expect(titles).toContain('Area of Effect');
    expect(titles).toContain('Duration');
    expect(titles).toContain('Damage');
    expect(titles).not.toContain('Action Type');
    expect(titles).not.toContain('Attack');
    expect(titles).not.toContain('Range');

    const damage = groups.find((g) => g.title === 'Damage');
    expect(
      damage?.rows.some((r) => r.label === 'Fire 1d6' && r.note === 'Applied to duration'),
    ).toBe(true);

    const area = groups.find((g) => g.title === 'Area of Effect');
    expect(area?.rows.some((r) => r.value === '+25%')).toBe(true);
    expect(area?.rows.some((r) => r.note === 'Also scales duration extra')).toBe(true);

    const duration = groups.find((g) => g.title === 'Duration');
    expect(duration?.rows.some((r) => r.label === '1 Minute' && r.value === '+75%')).toBe(true);
    expect(duration?.rows.some((r) => r.label === 'Focus' && r.value === '-50%')).toBe(true);

    const combined = groups.find((g) => g.title === 'Combined Energy');
    expect(combined?.rows.some((r) => r.label === 'Extra Energy from duration')).toBe(true);
    const energyCost = combined?.rows.find((r) => r.label === 'Energy Cost');
    expect(energyCost?.value).toBe(String(costs.totalEnergy));
    expect(JSON.stringify(groups)).not.toMatch(/ceil|floor/i);
  });

  it('omits Also scales duration extra when only percentage parts have Apply duration', () => {
    const payload = [
      {
        id: sphere.id,
        name: sphere.name,
        applyDuration: true,
        displayLabel: 'Level 1 Sphere',
      },
      {
        id: magicDamage.id,
        name: magicDamage.name,
        displayLabel: 'Fire 1d6',
      },
      {
        id: durationMinute.id,
        name: durationMinute.name,
        displayLabel: '1 Minute',
      },
    ];
    const groups = buildPowerAdvancedCalculationGroups(
      analyzePowerEnergy(payload, [sphere, magicDamage, durationMinute]),
    );
    const area = groups.find((g) => g.title === 'Area of Effect');
    expect(area?.rows.some((r) => r.note === 'Also scales duration extra')).toBe(false);
    const combined = groups.find((g) => g.title === 'Combined Energy');
    expect(combined?.rows.some((r) => r.label === 'Extra Energy from duration')).toBe(false);
  });

  it('omits Attack when Weapon Attack adds no Energy', () => {
    const payload = [
      {
        id: addWeapon.id,
        name: addWeapon.name,
        calcSection: 'attack' as const,
        displayLabel: 'Weapon Attack',
      },
      { id: magicDamage.id, name: magicDamage.name },
    ];
    const groups = buildPowerAdvancedCalculationGroups(
      analyzePowerEnergy(payload, [addWeapon, magicDamage]),
    );
    expect(groups.map((g) => g.title)).not.toContain('Attack');
    expect(groups.map((g) => g.title)).toContain('Damage');
  });
});
