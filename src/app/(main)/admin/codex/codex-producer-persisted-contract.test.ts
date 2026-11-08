import { describe, expect, it } from 'vitest';
import { featFormToSavePayload, type FeatFormState } from './admin-feat-form';
import { partFormToSavePayload, type PartFormState } from './admin-part-form';
import { speciesFormToSavePayload, type SpeciesFormState } from './admin-species-form';
import { assertCodexAdminPayloadKeys, toColumnarPayload, toDbPayload } from './codex-column-map';
import { mapCodexFeat, mapCodexPart, mapCodexSpecies } from '@/lib/codex/row-map';
import { rowDataWithoutId, stringToCellValue } from './codex-spreadsheet-helpers';

const populatedFeatForm: FeatFormState = {
  name: 'Athletic',
  description: 'Moves well.',
  req_desc: '',
  category: 'General',
  sources: ['Core'],
  ability: ['strength', 'agility'],
  ability_req: ['strength'],
  abil_req_val: [2],
  tags: ['mobility'],
  skill_req: ['athletics'],
  skill_req_val: [1],
  feat_cat_req: '',
  pow_abil_req: undefined,
  mart_abil_req: undefined,
  pow_prof_req: undefined,
  mart_prof_req: undefined,
  speed_req: undefined,
  feat_lvl: 1,
  lvl_req: 2,
  uses_per_rec: undefined,
  rec_period: '',
  char_feat: true,
  state_feat: false,
  base_feat_id: '',
};

const targetedPartForm: PartFormState = {
  name: 'Bolt',
  description: 'Strike',
  category: 'Attack',
  sources: ['Core'],
  type: 'power',
  base_en: 2,
  base_tp: 1,
  mechanic: false,
  percentage: false,
  duration: false,
  defense: ['reflex', 'fortitude'],
  op_1_desc: '',
  op_1_en: undefined,
  op_1_tp: undefined,
  op_2_desc: '',
  op_2_en: undefined,
  op_2_tp: undefined,
  op_3_desc: '',
  op_3_en: undefined,
  op_3_tp: undefined,
};

const speciesWithAges: SpeciesFormState = {
  name: 'Elf',
  description: 'Long-lived',
  type: 'Humanoid',
  size: 'Medium',
  sizes: 'Medium',
  skillIds: ['stealth'],
  speciesTraitIds: [],
  ancestryTraitIds: [],
  flawIds: [],
  characteristicIds: [],
  aveHeight: '180',
  aveWeight: '70',
  adultAge: '20',
  maxAge: '750',
  languages: 'Common',
  isStarter: false,
  sources: ['Core'],
  catalogListing: 'listed',
  imageId: null,
  imageUrl: null,
};

describe('codex producer payloads through assertCodexAdminPayloadKeys', () => {
  it('accepts feat editor save output with ability lists', () => {
    const payload = featFormToSavePayload(populatedFeatForm);
    expect(() => assertCodexAdminPayloadKeys('codex_feats', payload)).not.toThrow();
    const columnar = toColumnarPayload('codex_feats', payload);
    expect(columnar.ability).toBe('strength, agility');
    expect(columnar.abilityReq).toBe('strength');
  });

  it('accepts part editor save output with defense lists', () => {
    const payload = partFormToSavePayload(targetedPartForm);
    expect(() => assertCodexAdminPayloadKeys('codex_parts', payload)).not.toThrow();
    const columnar = toColumnarPayload('codex_parts', payload);
    expect(columnar.defense).toBe('reflex, fortitude');
  });

  it('accepts species editor save output with adulthood lifespan tuple', () => {
    const payload = speciesFormToSavePayload(speciesWithAges);
    expect(() => assertCodexAdminPayloadKeys('codex_species', payload)).not.toThrow();
    const dbRow = toDbPayload('codex_species', toColumnarPayload('codex_species', payload));
    expect(dbRow.adulthood_lifespan).toBe('20, 750');
  });

  it('accepts a spreadsheet row round-trip with only the name changed', () => {
    const dbRow = {
      id: '12',
      name: 'Riposte',
      description: 'Old',
      category: 'Combat',
      sources: 'Core',
      ability: ['martial', 'power'],
      ability_req: 'strength',
      abil_req_val: '2, 4',
    };
    const mappedFeat = mapCodexFeat(dbRow);
    const featSpreadsheetPayload = rowDataWithoutId({
      ...dbRow,
      name: 'Riposte Prime',
      ability: mappedFeat.ability,
      ability_req: mappedFeat.ability_req,
      abil_req_val: mappedFeat.abil_req_val,
    });
    expect(() => assertCodexAdminPayloadKeys('codex_feats', featSpreadsheetPayload)).not.toThrow();

    const mappedPart = mapCodexPart({ ...dbRow, type: 'power', base_en: 1, base_tp: 1 });
    const partPayload = rowDataWithoutId({
      name: mappedPart.name,
      defense: mappedPart.defense,
      type: mappedPart.type,
    });
    expect(() => assertCodexAdminPayloadKeys('codex_parts', partPayload)).not.toThrow();

    const mappedSpecies = mapCodexSpecies({
      id: '1',
      name: 'Dwarf',
      type: 'Humanoid',
      adulthood_lifespan: '18, 90',
    });
    const speciesPayload = rowDataWithoutId({
      name: 'Dwarf',
      adulthood_lifespan: mappedSpecies.adulthood_lifespan,
    });
    expect(() => assertCodexAdminPayloadKeys('codex_species', speciesPayload)).not.toThrow();
  });

  it('rejects JSON string scalars for archetype loadouts (no mapper write)', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_archetypes', {
        name: 'Fighter',
        level1_loadouts: 'false',
      }),
    ).toThrow(/JSON object or array/i);
    expect(() =>
      assertCodexAdminPayloadKeys('codex_archetypes', {
        name: 'Fighter',
        level1_loadouts: false,
      }),
    ).toThrow(/JSON object or array/i);
    expect(() =>
      assertCodexAdminPayloadKeys('codex_archetypes', {
        name: 'Fighter',
        level1_recommended_abilities: '42',
      }),
    ).toThrow(/JSON object/i);
  });

  it('accepts spreadsheet cell edits for feat lists through guard and mapper', () => {
    const abilityOriginal = ['strength', 'agility'];
    const abilReqValOriginal = [2, 4];
    const ability = stringToCellValue('strength, vitality', abilityOriginal);
    const abilReqVal = stringToCellValue('2', abilReqValOriginal);
    const skillReqVal = stringToCellValue('3', [1]);

    const payload = rowDataWithoutId({
      name: 'Cell edit feat',
      feat_lvl: 1,
      ability,
      abil_req_val: abilReqVal,
      skill_req_val: skillReqVal,
    });

    expect(() => assertCodexAdminPayloadKeys('codex_feats', payload)).not.toThrow();
    const columnar = toColumnarPayload('codex_feats', payload);
    expect(columnar.ability).toBe('strength, vitality');
    expect(columnar.abilReqVal).toBe(2);
    expect(columnar.skillReqVal).toBe(3);
  });

  it('rejects spreadsheet species lifespan cells with invalid tokens', () => {
    const lifespan = stringToCellValue('20, Infinity', [20, 750]);
    expect(() =>
      assertCodexAdminPayloadKeys('codex_species', {
        name: 'Elf',
        adulthood_lifespan: lifespan,
      }),
    ).toThrow(/numeric range/i);
  });

  it('rejects nested archetype JSON from parsed spreadsheet strings', () => {
    const guidance = stringToCellValue('[false]', []);
    expect(() =>
      assertCodexAdminPayloadKeys('codex_archetypes', {
        name: 'Fighter',
        level1_guidance_groups: guidance,
      }),
    ).toThrow(/must be an object/i);

    const abilities = stringToCellValue('{"strength":{}}', { strength: 3 });
    expect(() =>
      assertCodexAdminPayloadKeys('codex_archetypes', {
        name: 'Fighter',
        level1_recommended_abilities: abilities,
      }),
    ).toThrow(/finite number/i);
  });

  it('rejects object values on scalar numeric feat fields', () => {
    expect(() =>
      assertCodexAdminPayloadKeys('codex_feats', { name: 'X', feat_lvl: { n: 1 } }),
    ).toThrow(/numeric/i);
    expect(() => assertCodexAdminPayloadKeys('codex_parts', { name: 'X', base_en: [] })).toThrow(
      /numeric/i,
    );
  });
});
