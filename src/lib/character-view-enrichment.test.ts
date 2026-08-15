import { describe, expect, it } from 'vitest';
import {
  collectCharacterViewRefIds,
  collectNestedIdsFromLibraryRows,
  emptyCharacterViewEnrichment,
  sheetCatalogFromEnrichment,
} from './character-view-enrichment';

describe('collectCharacterViewRefIds', () => {
  it('collects library, feat, skill, species, trait, archetype, part and property ids', () => {
    const refs = collectCharacterViewRefIds({
      archetypePathId: 'path-9',
      archetype: { id: 'power', type: 'power', name: 'Power' },
      powers: [{ id: 'power-1', name: 'Firebolt', parts: [{ id: 'part-p1' }, 'part-p2'] }],
      techniques: [{ docId: 'technique-1', name: 'Riposte', parts: [{ id: 'part-t1' }] }],
      feats: [{ id: 'feat-1', name: 'Tough' }],
      archetypeFeats: [{ id: 7, name: 'Path Feat' }],
      skills: [{ id: 'skill-1', name: 'Athletics' }],
      ancestry: {
        id: 'species-1',
        name: 'Elf',
        speciesIds: ['species-a', 'species-b'],
        selectedSpeciesSkillIds: ['skill-species'],
        selectedTraits: ['trait-ancestry'],
        selectedFlaw: 'trait-flaw',
        selectedCharacteristic: 'trait-char',
        selectedSpeciesTraits: ['trait-sp-a', 'trait-sp-b'],
        selectedSpeciesTraitChoices: { 'trait-parent': 'trait-option' },
        selectedFlawSpeciesId: 'species-a',
      },
      equipment: {
        weapons: [{ id: 'item-weapon', properties: [{ id: 'prop-1' }] }],
      },
      proficiencies: [
        { kind: 'power_part', id: 'part-prof', refId: 'part-prof-ref' },
        { kind: 'item_property', id: 'prop-prof' },
        { kind: 'custom', id: 'custom-ignore' },
      ],
    });

    expect(refs.powers).toEqual(['power-1']);
    expect(refs.techniques).toEqual(['technique-1']);
    expect(refs.items).toEqual(['item-weapon']);
    expect(refs.feats.sort()).toEqual(['7', 'feat-1']);
    expect(refs.skills.sort()).toEqual(['skill-1', 'skill-species']);
    expect(refs.species.sort()).toEqual(['species-1', 'species-a', 'species-b']);
    expect(refs.traits.sort()).toEqual([
      'trait-ancestry',
      'trait-char',
      'trait-flaw',
      'trait-option',
      'trait-parent',
      'trait-sp-a',
      'trait-sp-b',
    ]);
    expect(refs.archetypes).toEqual(['path-9']);
    expect(refs.parts.sort()).toEqual(['part-p1', 'part-p2', 'part-prof-ref', 'part-t1']);
    expect(refs.itemProperties.sort()).toEqual(['prop-1', 'prop-prof']);
    expect(refs.creatures).toEqual([]);
  });

  it('reads legacy skills records and forge archetypes without a path id', () => {
    const refs = collectCharacterViewRefIds({
      skills: { 'skill-legacy': { val: 2 } },
      archetype: { id: 'martial', type: 'martial' },
    });
    expect(refs.skills).toEqual(['skill-legacy']);
    expect(refs.archetypes).toEqual([]);
  });

  it('returns empty sets for a character with no catalog refs', () => {
    expect(collectCharacterViewRefIds({ name: 'Blank' })).toEqual({
      powers: [],
      techniques: [],
      items: [],
      creatures: [],
      feats: [],
      skills: [],
      species: [],
      traits: [],
      archetypes: [],
      parts: [],
      itemProperties: [],
    });
    expect(collectCharacterViewRefIds(null).powers).toEqual([]);
  });
});

describe('collectNestedIdsFromLibraryRows', () => {
  it('picks parts, properties, species traits and skills off fetched rows', () => {
    const nested = collectNestedIdsFromLibraryRows([
      { parts: [{ id: 'part-lib' }], properties: [{ id: 'prop-lib' }] },
      { species_traits: ['trait-from-species'], skills: ['skill-from-species'] },
      null,
    ]);
    expect(nested.parts).toEqual(['part-lib']);
    expect(nested.itemProperties).toEqual(['prop-lib']);
    expect(nested.traits).toEqual(['trait-from-species']);
    expect(nested.skills).toEqual(['skill-from-species']);
  });
});

describe('sheetCatalogFromEnrichment', () => {
  it('wires official rows into publicLibraries and owner empowered into userEmpoweredTechniques', () => {
    const enrichment = emptyCharacterViewEnrichment();
    enrichment.officialPowers = [{ id: 'op', docId: 'op', name: 'Bolt', parts: [] }];
    enrichment.officialTechniques = [{ id: 'ot', docId: 'ot', name: 'Slash', parts: [] }];
    enrichment.empoweredTechniques = [{ id: 'em', docId: 'em', name: 'Boost', parts: [] }];
    enrichment.officialItems = [{ id: 'oi', docId: 'oi', name: 'Sword' } as never];

    const catalog = sheetCatalogFromEnrichment(enrichment);
    expect(catalog.userPowers).toEqual([]);
    expect(catalog.publicLibraries.powers).toEqual(enrichment.officialPowers);
    expect(catalog.publicLibraries.techniques).toEqual(enrichment.officialTechniques);
    expect(catalog.userEmpoweredTechniques).toEqual(enrichment.empoweredTechniques);
    expect(catalog.featsDb).toEqual([]);
  });
});
