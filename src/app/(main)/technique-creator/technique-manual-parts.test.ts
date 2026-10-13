import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import type { TechniquePart } from '@/hooks';
import { calculateTechniqueCosts } from '@/lib/calculators/technique-calc';
import {
  isManualTechniquePart,
  techniquePartsForSave,
  type TechniqueSelectedPart,
} from './technique-creator-bootstrap';

const editorSource = readFileSync(
  new URL('./technique-creator-editor.tsx', import.meta.url),
  'utf8',
);

const addWeapon = {
  id: '7',
  name: 'Add Weapon to Technique',
  description: 'Add a weapon attack to this technique.',
  mechanic: true,
  base_en: 2,
  base_tp: 0,
  category: 'Attack',
} as TechniquePart;

const potency = {
  id: '4',
  name: 'Potency Increase',
  description: 'Increase potency.',
  mechanic: false,
  base_en: 1,
  base_tp: 0,
  category: 'Attack',
} as TechniquePart;

function row(part: TechniquePart): TechniqueSelectedPart {
  return {
    part,
    op_1_lvl: 0,
    op_2_lvl: 0,
    op_3_lvl: 0,
    selectedCategory: 'Attack',
  };
}

describe('technique manual parts (86e3jwvdk)', () => {
  it('does not treat automatic parts as hand-added parts', () => {
    expect(isManualTechniquePart(addWeapon)).toBe(false);
    expect(isManualTechniquePart(potency)).toBe(true);
    expect(editorSource).toContain('allParts={manualTechniqueParts(techniqueParts)}');
  });

  it('does not charge Add Weapon to Technique while Unarmed', () => {
    const saved = techniquePartsForSave([row(addWeapon), row(potency)], []);
    expect(saved.map((part) => part.name)).toEqual(['Potency Increase']);

    const unarmed = calculateTechniqueCosts(
      saved.map((part) => ({
        id: Number(part.id),
        name: part.name,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
      })),
      [addWeapon, potency],
    );
    const chargedByHand = calculateTechniqueCosts(
      [
        {
          id: 7,
          name: 'Add Weapon to Technique',
          op_1_lvl: 0,
          op_2_lvl: 0,
          op_3_lvl: 0,
        },
      ],
      [addWeapon, potency],
    );

    expect(unarmed.energyRaw).toBe(1);
    expect(chargedByHand.energyRaw).toBe(2);
  });

  it('still keeps the automatic weapon part when attack mode adds it', () => {
    const saved = techniquePartsForSave(
      [row(addWeapon)],
      [{ id: 7, name: 'Add Weapon to Technique', op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 }],
    );
    expect(saved).toEqual([
      { id: 7, name: 'Add Weapon to Technique', op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 },
    ]);
  });
});
