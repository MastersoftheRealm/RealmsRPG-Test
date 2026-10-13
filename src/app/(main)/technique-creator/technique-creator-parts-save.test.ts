import { describe, expect, it } from 'vitest';
import type { TechniquePart } from '@/hooks';
import { calculateTechniqueCosts } from '@/lib/calculators/technique-calc';
import {
  techniqueLibraryRecordToFormState,
  techniquePartsForSave,
  type TechniqueSelectedPart,
} from './technique-creator-bootstrap';
import { empoweredLibraryRecordToFormState } from '../empowered-technique-creator/empowered-technique-bootstrap';

describe('identical technique parts on save (86e3jx8wv)', () => {
  const potency = {
    id: '4',
    name: 'Potency Increase',
    mechanic: false,
    category: 'Attack',
  } as TechniquePart;
  const reaction = {
    id: '9',
    name: 'Reaction',
    mechanic: true,
    category: 'Action',
  } as TechniquePart;

  function potencyRow(): TechniqueSelectedPart {
    return {
      part: potency,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      selectedCategory: 'Attack',
    };
  }

  it('keeps thirty identical parts and still appends the auto mechanic', () => {
    const saved = techniquePartsForSave(
      Array.from({ length: 30 }, () => potencyRow()),
      [{ id: reaction.id, name: reaction.name, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 }],
    );
    expect(saved).toHaveLength(31);
    expect(saved.filter((part) => part.name === 'Potency Increase')).toHaveLength(30);
    expect(saved.filter((part) => part.name === 'Reaction')).toHaveLength(1);

    const reloaded = techniqueLibraryRecordToFormState({ name: 'QA technique', parts: saved }, [
      potency,
      reaction,
    ]);
    expect(reloaded.selectedParts).toHaveLength(30);
    expect(reloaded.selectedParts.every((row) => row.part.name === 'Potency Increase')).toBe(true);
  });
});

describe('reloading a technique keeps the saved part when names repeat (86e3jpq36)', () => {
  const weapon = {
    id: '7',
    name: 'Add Weapon to Technique',
    category: 'General',
    base_en: 2.5,
    base_tp: 0,
    mechanic: true,
  } as TechniquePart;

  function part(
    id: string,
    name: string,
    category: string,
    base_en: number,
    base_tp: number,
  ): TechniquePart {
    return { id, name, category, base_en, base_tp, mechanic: false } as TechniquePart;
  }

  // The other copy is first, which is what the old name match selected.
  const catalog = [
    part('40', 'Brace', 'Vitality', 2, 2),
    part('211', 'Brace', 'Actions', 2, 1),
    part('52', 'Evade', 'Defense', 2, 2),
    part('407', 'Evade', 'Actions', 2, 1),
    part('63', 'Defend', 'Defensive', 2.5, 2),
    part('351', 'Defend', 'Actions', 2, 1),
    weapon,
  ];

  function row(saved: TechniquePart): TechniqueSelectedPart {
    return {
      part: saved,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      selectedCategory: saved.category,
    };
  }

  it('reloads Actions Brace with weapon attack as 5 Energy and 1 Training Point', () => {
    const actions = catalog.find((entry) => entry.id === '211');
    expect(actions).toBeDefined();
    if (!actions) return;
    const saved = techniquePartsForSave(
      [row(actions)],
      [{ id: weapon.id, name: weapon.name, op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 }],
    );
    const reloaded = techniqueLibraryRecordToFormState(
      { name: 'QA CR Technique', parts: saved },
      catalog,
    );
    const loaded = reloaded.selectedParts[0];

    expect(reloaded.selectedParts).toHaveLength(1);
    expect(loaded?.part.id).toBe('211');
    expect(loaded?.selectedCategory).toBe('Actions');
    expect(reloaded.attackMode).toBe('weapon');

    const costs = calculateTechniqueCosts(
      [
        { id: Number(loaded?.part.id), name: loaded?.part.name },
        { id: Number(weapon.id), name: weapon.name },
      ],
      catalog,
    );
    expect(costs.totalEnergy).toBe(5);
    expect(costs.totalTP).toBe(1);
  });

  it('reloads Actions Evade and Defend instead of the earlier same-name copy', () => {
    for (const id of ['407', '351']) {
      const savedPart = catalog.find((entry) => entry.id === id);
      expect(savedPart).toBeDefined();
      if (!savedPart) continue;
      const saved = techniquePartsForSave([row(savedPart)], []);
      const reloaded = techniqueLibraryRecordToFormState({ name: 'QA', parts: saved }, catalog);
      expect(reloaded.selectedParts[0]?.part.id).toBe(id);
      expect(reloaded.selectedParts[0]?.selectedCategory).toBe('Actions');
    }
  });

  it('still resolves a save that has only a name', () => {
    const reloaded = techniqueLibraryRecordToFormState(
      { name: 'legacy', parts: [{ name: 'Brace', op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 }] },
      catalog,
    );
    expect(reloaded.selectedParts[0]?.part.id).toBe('40');
  });
});

describe('empowered technique reload keeps the saved technique part (86e3jpq36)', () => {
  it('keeps Actions Brace when Vitality Brace is earlier in the catalog', () => {
    const vitality = {
      id: '40',
      name: 'Brace',
      category: 'Vitality',
      mechanic: false,
    } as TechniquePart;
    const actions = {
      id: '211',
      name: 'Brace',
      category: 'Actions',
      mechanic: false,
    } as TechniquePart;
    const reloaded = empoweredLibraryRecordToFormState(
      {
        name: 'QA empowered',
        empoweredTechnique: true,
        technique: { parts: [{ id: 211, name: 'Brace', op_1_lvl: 0, op_2_lvl: 0, op_3_lvl: 0 }] },
      },
      [],
      [vitality, actions],
    );
    expect(reloaded?.selectedTechniqueParts[0]?.part.id).toBe('211');
    expect(reloaded?.selectedTechniqueParts[0]?.selectedCategory).toBe('Actions');
  });
});
