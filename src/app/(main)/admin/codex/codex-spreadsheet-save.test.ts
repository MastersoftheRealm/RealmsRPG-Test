import { describe, expect, it } from 'vitest';
import { toColumnarPayload, toDbPayload } from './codex-column-map';
import { spreadsheetSourceRow, visibleSpreadsheetColumns } from './codex-spreadsheet-config';
import { rowDataWithoutId } from './codex-spreadsheet-helpers';

describe('spreadsheet saves every real column (86e3mezkn)', () => {
  it('writes archetype fields the grid shows and list mode already saves', () => {
    const db = toDbPayload(
      'codex_archetypes',
      toColumnarPayload('codex_archetypes', {
        name: 'Blade',
        level1_innate_powers: ['12', '15'],
        level1_recommend_unarmed_prowess: true,
        level1_guidance_groups: [{ id: 'g', title: 'Goal' }],
        level1_recommended_abilities: { strength: 3 },
        level1_loadouts: { armorStep: 1 },
        path_data: { levels: [{ level: 2, feats: ['9'] }] },
      }),
    );

    expect(db.level1_innate_powers).toBe('12, 15');
    expect(db.level1_recommend_unarmed_prowess).toBe(true);
    expect(db.level1_guidance_groups).toEqual([{ id: 'g', title: 'Goal' }]);
    expect(db.level1_recommended_abilities).toEqual({ strength: 3 });
    expect(db.level1_loadouts).toEqual({ armorStep: 1 });
    expect(db).not.toHaveProperty('path_data');
    expect(JSON.stringify(db.level1_guidance_groups)).not.toContain('[object Object]');
  });

  it('lifts nested archetype fields onto editable columns and hides display copies', () => {
    const row = spreadsheetSourceRow('archetypes', {
      id: '1',
      name: 'Blade',
      path_data: {
        level1: {
          recommendUnarmedProwess: true,
          recommended_abilities: { strength: 3 },
          loadouts: { armorStep: 1 },
        },
        levels: [{ level: 2 }],
      },
    });

    expect(row.level1_recommend_unarmed_prowess).toBe(true);
    expect(row.level1_recommended_abilities).toEqual({ strength: 3 });
    expect(
      visibleSpreadsheetColumns('archetypes', [...Object.keys(row), 'level1_feats']),
    ).not.toContain('path_data');
    expect(visibleSpreadsheetColumns('archetypes', Object.keys(row))).toContain(
      'level1_recommend_unarmed_prowess',
    );

    expect(
      visibleSpreadsheetColumns('species', ['id', 'name', 'size', 'speed', 'traits', 'sizes']),
    ).toEqual(['id', 'name', 'sizes']);
    expect(
      visibleSpreadsheetColumns('equipment', ['id', 'name', 'type', 'gold_cost', 'currency']),
    ).toEqual(['id', 'name', 'currency']);
    expect(
      visibleSpreadsheetColumns('creature_feats', [
        'id',
        'name',
        'points',
        'feat_points',
        'prereqs',
      ]),
    ).toEqual(['id', 'name', 'feat_points']);
    expect(visibleSpreadsheetColumns('properties', ['id', 'name', 'tp_cost', 'base_tp'])).toEqual([
      'id',
      'name',
      'base_tp',
    ]);
  });

  it('stores a cleared cell as null so the edit is not dropped on the way to the server', () => {
    expect(rowDataWithoutId({ id: '4', base_en: undefined, name: 'Bolt' })).toEqual({
      base_en: null,
      name: 'Bolt',
    });
  });
});
