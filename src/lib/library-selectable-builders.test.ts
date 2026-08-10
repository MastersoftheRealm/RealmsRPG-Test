import { describe, expect, it } from 'vitest';
import {
  buildPowerTechniqueBudgetDisplay,
  buildSelectableItem,
  getItemColumns,
  getListHeaderColumns,
  getModalGridColumns,
} from '@/lib/library-selectable-builders';

const emptyCodex = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
};

describe('library-selectable-builders (DEV-V-016 parity)', () => {
  it('power headers/columns are Energy, Action, Duration, Area, Damage (DEV-V-016-T001)', () => {
    const headers = getListHeaderColumns('power').map((c) => c.key);
    expect(headers).toEqual(['name', 'Energy', 'Action', 'Duration', 'Area', 'Damage']);

    const cols = getItemColumns(
      { id: 'p1', name: 'Bolt' },
      'power',
      undefined,
      {
        energy: 2,
        actionType: 'Action',
        duration: 'Instant',
        damage: '2d6 Fire',
        area: 'Single',
      }
    );
    expect(cols.map((c) => c.key)).toEqual([
      'Energy',
      'Action',
      'Duration',
      'Area',
      'Damage',
    ]);
    expect(cols.find((c) => c.key === 'Damage')?.value).toContain('2d6');
    expect(getModalGridColumns('power')).toMatch(/1\.2fr/);
  });

  it('technique headers/columns are Action, Energy, Attack, Training Pts (DEV-V-016-T002)', () => {
    const headers = getListHeaderColumns('technique').map((c) => c.key);
    expect(headers).toEqual(['name', 'Action', 'Energy', 'Attack', 'Training Pts']);

    const cols = getItemColumns(
      { id: 't1', name: 'Strike' },
      'technique',
      {
        energy: 3,
        weaponName: 'Weapon',
        tp: 4,
        actionType: 'Action',
      }
    );
    expect(cols.map((c) => c.key)).toEqual(['Action', 'Energy', 'Attack', 'Training Pts']);
    expect(cols.find((c) => c.key === 'Action')?.value).toBe('Action');
    expect(cols.find((c) => c.key === 'Energy')?.value).toBe('3');
    expect(cols.find((c) => c.key === 'Attack')?.value).toBe('Weapon');
    expect(cols.find((c) => c.key === 'Training Pts')?.value).toBe('4');
    expect(getModalGridColumns('technique')).toMatch(/1\.4fr/);

    const selectable = buildSelectableItem(
      {
        id: 't1',
        name: 'Strike',
        description: 'A strike.',
        actionType: 'basic',
        attackMode: 'weapon',
        parts: [],
      },
      'technique',
      emptyCodex
    );
    expect(selectable.columns?.map((c) => c.key)).toEqual([
      'Action',
      'Energy',
      'Attack',
      'Training Pts',
    ]);
    expect(selectable.columns?.find((c) => c.key === 'Action')?.value).toBe('Basic action');
    expect(selectable.columns?.find((c) => c.key === 'Attack')?.value).toBe('Weapon');
    expect(selectable.data).toMatchObject({ id: 't1', name: 'Strike' });
    expect(selectable.powerTechniqueFilter?.actionTypeRaw).toBe('basic');
  });

  it('mixed armament headers + buildSelectableItem facts (DEV-V-016-T003)', () => {
    // Headers use a combined "stat" column; buildSelectableItem passes effectiveType into
    // getItemColumns so row keys are Damage / Armor / Block (positional grid alignment).
    expect(getListHeaderColumns('item').map((c) => c.key)).toEqual(['name', 'type', 'stat']);

    const weapon = buildSelectableItem(
      {
        id: 'w1',
        name: 'Longsword',
        type: 'weapon',
        description: 'A blade.',
        damage: { amount: 1, size: 8, type: 'slashing' },
        properties: [],
      },
      'item',
      emptyCodex
    );
    expect(weapon.columns?.map((c) => c.key)).toEqual(['type', 'Damage']);
    expect(String(weapon.columns?.[1]?.value)).toMatch(/1d8/i);

    const armor = buildSelectableItem(
      {
        id: 'a1',
        name: 'Chain',
        type: 'armor',
        description: '',
        armorValue: 3,
        properties: [],
      },
      'item',
      emptyCodex
    );
    expect(armor.columns?.map((c) => c.key)).toEqual(['type', 'Armor']);
    expect(String(armor.columns?.[1]?.value)).toBe('3');

    const shield = buildSelectableItem(
      {
        id: 's1',
        name: 'Shield',
        type: 'shield',
        description: '',
        properties: [],
      },
      'item',
      emptyCodex
    );
    expect(shield.columns?.[0]?.key).toBe('type');
    expect(String(shield.columns?.[0]?.value).toLowerCase()).toContain('shield');
  });

  it('buildSelectableItem preserves data for sheet add mapping (DEV-V-016-T006)', () => {
    const weapon = {
      id: 'w1',
      name: 'Longsword',
      type: 'weapon',
      description: 'A blade.',
      damage: { amount: 1, size: 8, type: 'slashing' },
      properties: [],
    };
    const selectable = buildSelectableItem(weapon, 'item', emptyCodex);
    expect(selectable.id).toBe('w1');
    expect(selectable.data).toBe(weapon);
    expect(selectable.columns?.[0]?.key).toBe('type');
    expect(String(selectable.columns?.[0]?.value).toLowerCase()).toContain('weapon');
  });

  it('buildPowerTechniqueBudgetDisplay shapes guided budget columns + chips (TASK-691)', () => {
    const display = buildPowerTechniqueBudgetDisplay(
      'power',
      {
        id: 'p1',
        name: 'Test Bolt',
        description: 'A test power.',
        parts: [],
        actionType: 'quick',
      },
      'p1',
      [],
      []
    );
    expect(display.name).toBe('Test Bolt');
    expect(display.columns.map((c) => c.key)).toEqual(['action', 'energy', 'tp']);
    expect(display.titleChips.some((c) => /^Training Points\b/.test(c.name))).toBe(true);
    expect(display.titleChips.some((c) => /^Energy\b/.test(c.name))).toBe(false);
    expect(display.detailChips.some((c) => /^Training Points\b/.test(c.name))).toBe(false);
  });

  it('buildSelectableItem attaches powerTechniqueFilter for USM filters (TASK-675)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'p1',
        name: 'Bolt',
        description: 'Zap.',
        actionType: 'basic',
        parts: [],
      },
      'power',
      emptyCodex
    );
    expect(selectable.powerTechniqueFilter).toMatchObject({
      actionTypeRaw: 'basic',
      isReaction: false,
    });
    expect(selectable.data).toMatchObject({ id: 'p1', name: 'Bolt' });
  });
});
