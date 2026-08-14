import { describe, expect, it } from 'vitest';
import { DEFAULT_ABILITIES } from '@/types';
import { CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import type { GuidedDraft } from '@/stores/guided-creator-store';
import { buildGuidedCharacterPayload } from '@/lib/guided-creator/build-character';
import { cleanForSave } from '@/lib/data-enrichment';
import { calculateProficiencyTP } from '@/lib/proficiencies';
import type { Character } from '@/types';
import type { Item } from '@/types/equipment';
import type { LibraryItem, LibraryPower } from '@/types/library';

function minimalDraft(overrides: Partial<GuidedDraft> = {}): GuidedDraft {
  return {
    creatorEntryMode: 'guided',
    pathLayer: 'l1',
    archetypePathId: '1',
    archetypeType: 'martial',
    pow_abil: null,
    mart_abil: 'strength',
    speciesId: null,
    speciesName: null,
    speciesMixed: false,
    mixedSpeciesIds: null,
    mixedSpeciesNames: null,
    selectedSpeciesSkillIds: [],
    selectedSpeciesTraits: [],
    selectedFlawSpeciesId: null,
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
    powersPhase: 'innate',
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
    expect(payload.equipment?.weapons?.[0]).toMatchObject({ id: 'w1', name: 'Greataxe', equipped: true });

    const lean = cleanForSave(payload as Character);
    expect(lean.proficiencies?.length).toBe(payload.proficiencies?.length);
    expect(lean.powers?.[0]).toMatchObject({ id: 'p1', name: 'Firebolt', innate: false });
    expect((lean.powers?.[0] as { parts?: unknown })?.parts).toBeUndefined();
  });

  it('resolves user-library weapon names by docId when saving', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        loadoutWeapons: [{ id: 'user-weapon-uuid', quantity: 1 }],
        armaments: [{ id: 'stale-official-id', quantity: 1 }],
      }),
      {
        officialItems: [
          {
            id: 'user-row',
            docId: 'user-weapon-uuid',
            name: 'Homebrew Blade',
            type: 'weapon',
            properties: [],
            description: 'A custom sword.',
          },
        ],
      }
    );

    expect(payload.equipment?.weapons?.[0]).toMatchObject({
      id: 'user-weapon-uuid',
      name: 'Homebrew Blade',
    });
  });

  it('resolves user-library power names by docId when saving', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        powerIds: ['user-power-uuid'],
        innatePowerIds: [],
      }),
      {
        officialPowers: [
          {
            id: 'user-row',
            docId: 'user-power-uuid',
            name: 'Homebrew Bolt',
            parts: [],
          },
        ],
      }
    );

    expect(payload.powers?.[0]).toMatchObject({
      id: 'user-power-uuid',
      name: 'Homebrew Bolt',
    });
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

  it('omits archetypePathId and uses type-id archetype when no path', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        pathLayer: 'l3',
        archetypePathId: null,
        archetypeType: 'power',
        pow_abil: 'intelligence',
        mart_abil: null,
      }),
      {}
    );
    expect(payload.creationMode).toBeUndefined();
    expect(payload.archetypePathId).toBeUndefined();
    expect(payload.archetype).toEqual({ id: 'power', type: 'power' });
    expect(payload.pow_abil).toBe('intelligence');
  });

  it('does not persist creatorEntryMode (session-only chooser flag)', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        creatorEntryMode: 'custom',
        pathLayer: 'l3',
        archetypePathId: null,
        archetypeType: 'martial',
        mart_abil: 'strength',
      }),
      {}
    );
    expect((payload as Record<string, unknown>).creatorEntryMode).toBeUndefined();
    const lean = cleanForSave(payload as Character);
    expect((lean as Record<string, unknown>).creatorEntryMode).toBeUndefined();
  });

  it('stores ancestry picks only in selectedTraits (not species traits)', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        speciesId: 'sp1',
        speciesName: 'Elf',
        selectedAncestryTraitIds: ['anc-1', 'anc-1', 'anc-2'],
        selectedCharacteristicId: 'char-1',
        selectedFlawId: 'flaw-1',
      }),
      {
        species: {
          id: 'sp1',
          name: 'Elf',
          species_traits: ['species-trait-a', 'species-trait-b'],
          skills: [],
        } as never,
      }
    );

    expect(payload.ancestry?.selectedTraits).toEqual(['anc-1', 'anc-2']);
    expect(payload.ancestry?.selectedTraits).not.toContain('species-trait-a');
    expect(payload.ancestry?.selectedCharacteristic).toBe('char-1');
    expect(payload.ancestry?.selectedFlaw).toBe('flaw-1');
  });

  it('persists mixed species ancestry fields on save', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        speciesId: 'mixed:elf+dwarf',
        speciesName: 'Elf / Dwarf',
        speciesMixed: true,
        mixedSpeciesIds: ['elf', 'dwarf'],
        mixedSpeciesNames: ['Elf', 'Dwarf'],
        selectedSpeciesTraits: ['st-a', 'st-b'],
        selectedSpeciesSkillIds: ['sk1', 'sk2'],
        selectedFlawSpeciesId: 'elf',
        selectedSize: 'medium',
      }),
      {
        species: null,
        speciesA: { id: 'elf', name: 'Elf', ave_height: 170, ave_weight: 70 } as never,
        speciesB: { id: 'dwarf', name: 'Dwarf', ave_height: 130, ave_weight: 60 } as never,
      }
    );

    expect(payload.ancestry?.mixed).toBe(true);
    expect(payload.ancestry?.speciesIds).toEqual(['elf', 'dwarf']);
    expect(payload.ancestry?.selectedSpeciesTraits).toEqual(['st-a', 'st-b']);
    expect(payload.ancestry?.selectedSpeciesSkillIds).toEqual(['sk1', 'sk2']);
    expect(payload.ancestry?.mixedPhysical).toBeTruthy();
  });

  it('dedupes power and feat ids on save', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        innatePowerIds: ['p1', 'P1'],
        powerIds: ['p1', 'p2', 'p2'],
        techniqueIds: ['t1', 'T1', 't2'],
        archetypeFeatIds: ['feat-a', 'Feat-A', 'feat-b'],
        characterFeatIds: ['feat-c', 'feat-c'],
      }),
      {
        officialPowers: [
          { id: 'p1', docId: 'p1', name: 'Bolt', parts: [] },
          { id: 'p2', docId: 'p2', name: 'Shield', parts: [] },
        ],
        officialTechniques: [
          { id: 't1', docId: 't1', name: 'Slash', parts: [] },
          { id: 't2', docId: 't2', name: 'Parry', parts: [] },
        ],
        codexFeats: [
          { id: 'feat-a', name: 'Weapon Focus' },
          { id: 'feat-b', name: 'Toughness' },
          { id: 'feat-c', name: 'Lucky' },
        ],
      }
    );

    expect(payload.powers?.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(payload.techniques?.map((t) => t.id)).toEqual(['t1', 't2']);
    expect(payload.archetypeFeats?.map((f) => f.id)).toEqual(['feat-a', 'feat-b']);
    expect(payload.feats?.map((f) => f.id)).toEqual(['feat-c']);
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

  it('auto-equips starter gear with a single armor piece by DR', () => {
    const officialItems: LibraryItem[] = [
      { id: 'w1', docId: 'w1', name: 'Sword', type: 'weapon', properties: [] },
      { id: 'a-light', docId: 'a-light', name: 'Leather', type: 'armor', armorValue: 1, properties: [] },
      { id: 'a-heavy', docId: 'a-heavy', name: 'Plate', type: 'armor', armorValue: 4, properties: [] },
      { id: 's1', docId: 's1', name: 'Buckler', type: 'shield', properties: [] },
    ];

    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        loadoutWeapons: [{ id: 'w1', quantity: 1 }],
        loadoutArmor: [
          { id: 'a-light', quantity: 1 },
          { id: 'a-heavy', quantity: 1 },
        ],
        armaments: [
          { id: 'w1', quantity: 1 },
          { id: 'a-light', quantity: 1 },
          { id: 'a-heavy', quantity: 1 },
        ],
        equipment: [{ id: 's1', quantity: 1 }],
      }),
      { officialItems },
    );

    expect(payload.equipment?.weapons?.[0]?.equipped).toBe(true);
    expect(payload.equipment?.shields?.[0]?.equipped).toBe(true);
    expect(Array.isArray(payload.equipment?.armor)).toBe(true);
    const armorRows = payload.equipment!.armor as Item[];
    expect(armorRows.filter((a) => a.equipped).length).toBe(1);
    expect(armorRows.find((a) => a.id === 'a-heavy')?.equipped).toBe(true);
    expect(armorRows.find((a) => a.id === 'a-light')?.equipped).toBe(false);
  });

  it('clamps negative remaining Currency to 0 on save', () => {
    const payload = buildGuidedCharacterPayload(minimalDraft({ currency: -40 }), {});
    expect(payload.currency).toBe(0);
  });

  it('persists the highest linked skill ability so the sheet matches the creator', () => {
    const payload = buildGuidedCharacterPayload(
      minimalDraft({
        abilities: { ...DEFAULT_ABILITIES, agility: 0, intelligence: 3 },
        skills: { '30': 0 },
      }),
      {
        codexSkills: [
          { id: '30', name: 'Lockpick', ability: 'Agility,Intelligence', category: 'mental' },
        ],
      }
    );
    const rows = payload.skills as unknown as Array<{ id?: string; ability?: string }>;
    expect(rows.find((s) => s.id === '30')?.ability).toBe('intelligence');
  });

  it('honours path power_prof_start / martial_prof_start instead of type defaults', () => {
    const payload = buildGuidedCharacterPayload(minimalDraft({ archetypeType: 'power' }), {
      archetype: {
        id: '1',
        name: 'Arcanist',
        type: 'power',
        power_prof_start: 3,
        martial_prof_start: 0,
      },
    });
    expect(payload.pow_prof).toBe(3);
    expect(payload.mart_prof).toBe(0);
    expect(payload.archetype).toMatchObject({
      id: '1',
      type: 'power',
      power_prof_start: 3,
      martial_prof_start: 0,
    });
  });
});
