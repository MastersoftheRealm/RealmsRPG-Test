import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { buildGuidedCharacterPayload } from '@/lib/guided-creator/build-character';
import { cleanForSave } from '@/lib/data-enrichment';
import { calculateProficiencyTP } from '@/lib/proficiencies';
import type { Character } from '@/types';
import type { LibraryItem, LibraryPower } from '@/types/library';

function minimalDraft(overrides: Partial<GuidedDraft> = {}): GuidedDraft {
  return {
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
    abilities: { ...DEFAULT_ABILITIES, strength: 2, vitality: 1 },
    abilitiesMode: 'recommended',
    skills: {},
    declinedPathSkillIds: [],
    archetypeFeatIds: [],
    characterFeatIds: [],
    equipmentPhase: 'weapon',
    loadoutWeapons: [{ id: 'w1', quantity: 1 }],
    loadoutArmor: [],
    armaments: [{ id: 'w1', quantity: 1 }],
    equipment: [],
    currency: CHARACTER_STARTING_CURRENCY,
    unarmedProwess: 0,
    powerIds: [],
    innatePowerIds: [],
    techniqueIds: [],
    name: 'Test Hero',
    age: '',
    heightCm: null,
    weightKg: null,
    appearanceNotes: '',
    description: '',
    portraitUrl: null,
    hpAllocated: 3,
    energyAllocated: 2,
    ...overrides,
  };
}

describe('buildGuidedCharacterPayload', () => {
  it('persists required proficiencies from armament properties and power parts', () => {
    const officialItems: LibraryItem[] = [
      {
        id: 'w1',
        docId: 'w1',
        name: 'Greataxe',
        type: 'weapon',
        properties: [{ id: 10, name: 'Heavy', op_1_lvl: 0 }],
      },
    ];
    const officialPowers: LibraryPower[] = [
      {
        id: 'p1',
        docId: 'p1',
        name: 'Firebolt',
        parts: [{ id: 20, name: 'Damage', op_1_lvl: 1 }],
        damage: [{ type: 'fire', amount: 1, size: 6 }],
      },
    ];

    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        archetypeType: 'power',
        pow_abil: 'intelligence',
        mart_abil: null,
        powerIds: ['p1'],
        loadoutWeapons: [{ id: 'w1', quantity: 1 }],
        armaments: [{ id: 'w1', quantity: 1 }],
      }),
      {
        officialItems,
        officialPowers,
        itemPropertiesDb: [{ id: 10, name: 'Heavy', base_tp: 2, op_1_tp: 0 }],
        powerPartsDb: [
          { id: 20, name: 'Damage', base_tp: 1, op_1_tp: 1, op_2_tp: 0, op_3_tp: 0 },
        ],
      }
    );

    expect(payload.status).toBe('complete');
    expect(payload.currentHealth).toBeDefined();
    expect(payload.currentEnergy).toBeDefined();
    expect(payload.proficiencies?.length).toBeGreaterThan(0);

    const kinds = new Set((payload.proficiencies ?? []).map((p) => p.kind));
    expect(kinds.has('item_property')).toBe(true);
    expect(kinds.has('power_part')).toBe(true);

    const totalTp = (payload.proficiencies ?? []).reduce(
      (sum, p) => sum + calculateProficiencyTP(p),
      0
    );
    expect(totalTp).toBeGreaterThan(0);

    // Lean power refs keep library names (parts stay off the save shape until cleanForSave).
    expect(payload.powers?.[0]).toMatchObject({ id: 'p1', name: 'Firebolt' });
    expect(payload.equipment?.weapons?.[0]).toMatchObject({ id: 'w1', name: 'Greataxe' });

    const lean = cleanForSave(payload as Character);
    expect(lean.proficiencies?.length).toBe(payload.proficiencies?.length);
    expect(lean.powers?.[0]).toMatchObject({ id: 'p1', name: 'Firebolt', innate: false });
    expect((lean.powers?.[0] as { parts?: unknown })?.parts).toBeUndefined();
  });

  it('returns empty proficiencies when loadout has no TP-costing parts/properties', () => {
    const payload = buildGuidedCharacterPayload(minimalDraft({ loadoutWeapons: [], armaments: [] }), {
      officialItems: [],
      officialPowers: [],
    });
    expect(payload.proficiencies).toEqual([]);
  });

  it('hides the opposite Library tab for power-only and martial-only', () => {
    const powerPayload = buildGuidedCharacterPayload(
      minimalDraft({ archetypeType: 'power', pow_abil: 'intelligence', mart_abil: null }),
      {}
    );
    expect(powerPayload.libraryTabVisibility).toEqual({ techniques: false });

    const martialPayload = buildGuidedCharacterPayload(
      minimalDraft({ archetypeType: 'martial' }),
      {}
    );
    expect(martialPayload.libraryTabVisibility).toEqual({ powers: false });

    const hybridPayload = buildGuidedCharacterPayload(
      minimalDraft({
        archetypeType: 'powered-martial',
        pow_abil: 'intelligence',
        mart_abil: 'strength',
      }),
      {}
    );
    expect(hybridPayload.libraryTabVisibility).toBeUndefined();

    const lean = cleanForSave(powerPayload as Character);
    expect(lean.libraryTabVisibility).toEqual({ techniques: false });
  });

  it('resolves archetype and character feat names from codex', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        archetypeFeatIds: ['feat-a', 'feat-b'],
        characterFeatIds: ['feat-c'],
      }),
      {
        codexFeats: [
          { id: 'feat-a', name: 'Weapon Focus' },
          { id: 'feat-b', name: 'Toughness' },
          { id: 'feat-c', name: 'Lucky' },
        ],
      }
    );

    expect(payload.archetypeFeats).toEqual([
      { id: 'feat-a', name: 'Weapon Focus' },
      { id: 'feat-b', name: 'Toughness' },
    ]);
    expect(payload.feats).toEqual([{ id: 'feat-c', name: 'Lucky' }]);

    const lean = cleanForSave(payload as Character);
    expect(lean.archetypeFeats?.[0]).toMatchObject({ id: 'feat-a', name: 'Weapon Focus' });
    expect(lean.feats?.[0]).toMatchObject({ id: 'feat-c', name: 'Lucky' });
  });
});
