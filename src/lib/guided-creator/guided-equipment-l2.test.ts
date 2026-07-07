import { describe, expect, it } from 'vitest';
import {
  applyGuidedEquipmentL2Selection,
  computeL2TpSpent,
} from '@/lib/guided-creator/guided-equipment-l2';
import type { EligibleEquipmentRow } from '@/lib/guided-creator/equipment-eligibility';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { PROPERTY_IDS } from '@/lib/id-constants';

const baseDraft: GuidedDraft = {
  archetypePathId: '1',
  archetypeType: 'martial',
  pow_abil: null,
  mart_abil: 'strength',
  speciesId: null,
  speciesName: null,
  selectedSize: null,
  selectedSpeciesTraitChoices: {},
  selectedAncestryTraitIds: [],
  selectedCharacteristicId: null,
  selectedFlawId: null,
  abilities: {
    strength: 3,
    vitality: 2,
    agility: 1,
    acuity: 1,
    intelligence: 0,
    charisma: 0,
  },
  abilitiesMode: null,
  skills: {},
  declinedPathSkillIds: [],
  archetypeFeatIds: [],
  characterFeatIds: [],
  loadoutId: 'custom',
  equipmentPhase: 'weapon',
  loadoutWeapons: [],
  loadoutArmor: [],
  armaments: [],
  equipment: [],
  currency: 200,
  unarmedProwess: 0,
  powerIds: [],
  techniqueIds: [],
  name: '',
  age: '',
  heightCm: null,
  weightKg: null,
  appearanceNotes: '',
  portraitUrl: null,
  hpAllocated: null,
  energyAllocated: null,
};

describe('guided-equipment-l2', () => {
  const catalog = new Map<string, EligibleEquipmentRow>([
    ['w1', { id: 'w1', name: 'Axe', type: 'weapon', trainingPoints: 4, properties: [] }],
    [
      'w2',
      {
        id: 'w2',
        name: 'Greataxe',
        type: 'weapon',
        trainingPoints: 6,
        properties: [{ id: PROPERTY_IDS.TWO_HANDED, name: 'Two-Handed' }],
      },
    ],
    ['s1', { id: 's1', name: 'Shield', type: 'shield', trainingPoints: 2, properties: [] }],
  ]);

  it('rejects two-handed weapon with shield', () => {
    const selected = [
      {
        id: 'w2',
        name: 'Greataxe',
        data: { ref: { id: 'w2', quantity: 1 }, category: 'weapon', row: catalog.get('w2')! },
      },
      {
        id: 's1',
        name: 'Shield',
        data: { ref: { id: 's1', quantity: 1 }, category: 'weapon', row: catalog.get('s1')! },
      },
    ];
    const result = applyGuidedEquipmentL2Selection(
      'weapon',
      baseDraft,
      selected,
      catalog,
      30,
      200
    );
    expect(result.ok).toBe(false);
  });

  it('includes armor TP when evaluating weapon phase spend', () => {
    const draft = {
      ...baseDraft,
      loadoutArmor: [{ id: 'a1', quantity: 1 }],
    };
    const catalogWithArmor = new Map(catalog);
    catalogWithArmor.set('a1', {
      id: 'a1',
      name: 'Chain',
      type: 'armor',
      trainingPoints: 10,
      properties: [],
    });
    const spent = computeL2TpSpent(
      'weapon',
      draft,
      [
        {
          id: 'w1',
          name: 'Axe',
          data: { ref: { id: 'w1', quantity: 1 }, category: 'weapon', row: catalog.get('w1')! },
        },
      ],
      catalogWithArmor
    );
    expect(spent).toBe(14);
  });
});
