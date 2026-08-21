import { describe, expect, it } from 'vitest';
import {
  mapCodexCreatureFeat,
  mapCodexEquipment,
  mapCodexFeat,
  mapCodexPart,
  mapCodexProperty,
  mapCodexSkill,
  mapCodexSpecies,
  mapCodexTrait,
  toNum,
  toNumArray,
  toStrArray,
} from './row-map';

describe('toStrArray / toNumArray / toNum', () => {
  it('splits CSV, trims, and drops empties', () => {
    expect(toStrArray('STR, AGI,')).toEqual(['STR', 'AGI']);
    expect(toStrArray(['', 'Perceive'])).toEqual(['Perceive']);
    expect(toStrArray(null)).toEqual([]);
  });

  it('parses number lists and skips NaN', () => {
    expect(toNumArray('1, 2.5, x')).toEqual([1, 2.5]);
    expect(toNumArray([3, Number.NaN])).toEqual([3]);
    expect(toNumArray(4)).toEqual([4]);
  });

  it('treats empty string as missing for toNum', () => {
    expect(toNum('')).toBeUndefined();
    expect(toNum('12')).toBe(12);
    expect(toNum(0)).toBe(0);
  });
});

describe('mapCodexFeat', () => {
  it('reuses normalizeFeatAbilities and leaves missing lvl_req undefined', () => {
    const feat = mapCodexFeat({
      id: 12,
      name: 'Cleave',
      ability: 'Strength / Agility',
      tags: 'Combat, Melee',
      char_feat: true,
    });

    expect(feat.id).toBe('12');
    expect(feat.ability).toEqual(['Strength', 'Agility']);
    expect(feat.tags).toEqual(['Combat', 'Melee']);
    expect(feat.lvl_req).toBeUndefined();
    expect(feat.uses_per_rec).toBeUndefined();
    expect(feat.char_feat).toBe(true);
    expect(feat.state_feat).toBe(false);
  });

  it('keeps a hard lvl_req of 0 distinct from missing', () => {
    expect(mapCodexFeat({ id: '1', name: 'Zero', lvl_req: 0 }).lvl_req).toBe(0);
  });
});

describe('mapCodexSkill', () => {
  it('maps base_skill through mapCodexBaseSkillToId and keeps craft/ds fields', () => {
    const skill = mapCodexSkill({
      id: 's1',
      name: 'Athletics',
      ability: 'STR',
      base_skill: '10',
      ds_calc: 'STR+AGI',
      craft_success_desc: 'ok',
      craft_failure_desc: 'fail',
    });

    expect(skill.base_skill_id).toBe(10);
    expect(skill.ds_calc).toBe('STR+AGI');
    expect(skill.craft_success_desc).toBe('ok');
    expect(skill.craft_failure_desc).toBe('fail');
  });
});

describe('mapCodexSpecies', () => {
  it('maps lifespan, starter, and image fields the compact enrichment mapper dropped', () => {
    const species = mapCodexSpecies({
      id: 'sp-1',
      name: 'Human',
      sizes: 'Medium,Small',
      species_traits: 't1,t2',
      adulthood_lifespan: '18,80',
      is_starter: true,
      ave_hgt_cm: '175',
      image_url: ' https://img/h.png ',
    });

    expect(species.size).toBe('Medium');
    expect(species.sizes).toEqual(['Medium', 'Small']);
    expect(species.species_traits).toEqual(['t1', 't2']);
    expect(species.traits).toEqual(['t1', 't2']);
    expect(species.adulthood_lifespan).toEqual([18, 80]);
    expect(species.is_starter).toBe(true);
    expect(species.ave_height).toBe(175);
    expect(species.image_url).toBe('https://img/h.png');
    expect(species.speed).toBe(6);
  });
});

describe('mapCodexTrait / mapCodexPart / mapCodexProperty / mapCodexEquipment', () => {
  it('maps trait flags and option ids', () => {
    const trait = mapCodexTrait({
      id: 'tr-1',
      name: 'Keen',
      characteristic: true,
      option_trait_ids: 'a,b',
    });
    expect(trait.characteristic).toBe(true);
    expect(trait.flaw).toBe(false);
    expect(trait.option_trait_ids).toEqual(['a', 'b']);
  });

  it('normalizes part type and leaves missing energy undefined', () => {
    const part = mapCodexPart({ id: 'p1', name: 'Damage', type: 'POWER', defense: 'Evasion' });
    expect(part.type).toBe('power');
    expect(part.base_en).toBeUndefined();
    expect(part.defense).toEqual(['Evasion']);
  });

  it('maps property costs and equipment currency/category', () => {
    const property = mapCodexProperty({
      id: 'pr-1',
      name: 'Heavy',
      type: 'weapon',
      base_ip: 2,
    });
    expect(property.type).toBe('weapon');
    expect(property.base_ip).toBe(2);
    expect(property.tp_cost).toBe(0);

    const item = mapCodexEquipment({
      id: 'eq-1',
      name: 'Rope',
      currency: '5',
      category: 'adventuring',
      rarity: 'common',
    });
    expect(item.gold_cost).toBe(5);
    expect(item.currency).toBe(5);
    expect(item.category).toBe('adventuring');
    expect(item.type).toBe('equipment');
  });
});

describe('mapCodexCreatureFeat', () => {
  it('mirrors feat_points onto points', () => {
    const feat = mapCodexCreatureFeat({ id: 'cf-1', name: 'Pounce', feat_points: 2 });
    expect(feat.points).toBe(2);
    expect(feat.feat_points).toBe(2);
  });
});
