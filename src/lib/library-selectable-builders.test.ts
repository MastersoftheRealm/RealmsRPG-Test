import { describe, expect, it } from 'vitest';
import type { PowerPart, TechniquePart, ItemProperty } from '@/hooks/codex-types';
import {
  buildPowerTechniqueBudgetDisplay,
  buildSelectableItem,
  derivePowerTechniqueBudgetFacts,
  getItemColumns,
  getListHeaderColumns,
  getModalGridColumns,
  libraryItemToPowerDocument,
} from '@/lib/library-selectable-builders';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import { PART_IDS } from '@/lib/id-constants';
import { buildOfficialPowerRows } from '@/lib/library/official-power-list';
import { buildOfficialTechniqueRows } from '@/lib/library/official-technique-list';
import { buildPowersTechniquesL2Items } from '@/lib/guided-creator/powers-techniques-l2';
import type { LibraryPower, LibraryTechnique } from '@/types/library';

const emptyCodex = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
};

describe('library-selectable-builders (DEV-V-016 parity)', () => {
  it('power headers/columns are Energy, Action, Duration, Area, Damage (DEV-V-016-T001)', () => {
    const headers = getListHeaderColumns('power').map((c) => c.key);
    expect(headers).toEqual(['name', 'Energy', 'Action', 'Duration', 'Area', 'Damage']);

    const cols = getItemColumns({ id: 'p1', name: 'Bolt' }, 'power', undefined, {
      energy: 2,
      actionType: 'Action',
      duration: 'Instant',
      damage: '2d6 Fire',
      area: 'Single',
    });
    expect(cols.map((c) => c.key)).toEqual(['Energy', 'Action', 'Duration', 'Area', 'Damage']);
    expect(cols.find((c) => c.key === 'Damage')?.value).toContain('2d6');
    expect(getModalGridColumns('power')).toMatch(/1\.2fr/);
  });

  it('technique headers/columns are Action, Energy, Attack, Training Pts (DEV-V-016-T002)', () => {
    const headers = getListHeaderColumns('technique').map((c) => c.key);
    expect(headers).toEqual(['name', 'Action', 'Energy', 'Attack', 'Training Pts']);

    const cols = getItemColumns({ id: 't1', name: 'Strike' }, 'technique', {
      energy: 3,
      weaponName: 'Weapon',
      tp: 4,
      actionType: 'Action',
    });
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
      emptyCodex,
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

  it('armament select headers are per-kind catalog facts (DEV-V-016-T003)', () => {
    expect(getListHeaderColumns('weapon').map((c) => c.key)).toEqual(['name', 'Damage']);
    expect(getListHeaderColumns('armor').map((c) => c.key)).toEqual(['name', 'armor']);
    expect(getListHeaderColumns('shield').map((c) => c.key)).toEqual(['name', 'Block', 'Damage']);
    expect(getListHeaderColumns('weapon').map((c) => c.key)).not.toContain('type');
    expect(getListHeaderColumns('weapon').map((c) => c.key)).not.toContain('stat');

    const weapon = buildSelectableItem(
      {
        id: 'w1',
        name: 'Longsword',
        type: 'weapon',
        description: 'A blade.',
        damage: { amount: 1, size: 8, type: 'slashing' },
        properties: [],
      },
      'weapon',
      emptyCodex,
    );
    expect(weapon.columns?.map((c) => c.key)).toEqual(['Damage']);
    expect(String(weapon.columns?.[0]?.value)).toMatch(/1d8/i);

    const armor = buildSelectableItem(
      {
        id: 'a1',
        name: 'Chain',
        type: 'armor',
        description: '',
        armorValue: 3,
        properties: [],
      },
      'armor',
      emptyCodex,
    );
    expect(armor.columns?.map((c) => c.key)).toEqual(['armor']);
    expect(String(armor.columns?.[0]?.value)).toBe('3');

    const shield = buildSelectableItem(
      {
        id: 's1',
        name: 'Shield',
        type: 'shield',
        description: '',
        properties: [],
      },
      'shield',
      emptyCodex,
    );
    expect(shield.columns?.map((c) => c.key)).toEqual(['Block', 'Damage']);
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
    const selectable = buildSelectableItem(weapon, 'weapon', emptyCodex);
    expect(selectable.id).toBe('w1');
    expect(selectable.data).toBe(weapon);
    expect(selectable.columns?.[0]?.key).toBe('Damage');
    expect(String(selectable.columns?.[0]?.value)).toMatch(/1d8/i);
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
      [],
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
      emptyCodex,
    );
    expect(selectable.powerTechniqueFilter).toMatchObject({
      actionTypeRaw: 'basic',
      isReaction: false,
    });
    expect(selectable.data).toMatchObject({ id: 'p1', name: 'Bolt' });
  });

  it('derivePowerTechniqueBudgetFacts matches official list Energy for columnar powers (TASK-708)', () => {
    const elementalDamagePart: PowerPart = {
      id: '294',
      name: 'Elemental Damage',
      description: 'Elemental Damage',
      category: 'Damage',
      mechanic: true,
      base_en: 4,
      base_tp: 2,
      op_1_en: 2,
      op_1_tp: 1,
      percentage: false,
      duration: false,
    };
    const power: LibraryPower = {
      id: 'tri-bolt',
      docId: 'tri-bolt',
      name: 'Tri-Element Bolt',
      description: 'Three elements.',
      actionType: 'basic',
      parts: [],
      damage: [
        { amount: 1, size: 6, type: 'fire' },
        { amount: 1, size: 6, type: 'ice' },
        { amount: 1, size: 6, type: 'lightning' },
      ],
    };
    const partsDb = [elementalDamagePart];

    const officialEnergy = buildOfficialPowerRows([power], partsDb)[0]?.energy;
    const budgetFacts = derivePowerTechniqueBudgetFacts('power', power, partsDb, []);
    const budgetDisplay = buildPowerTechniqueBudgetDisplay('power', power, 'tri-bolt', partsDb, []);
    const directEnergy = derivePowerDisplay(libraryItemToPowerDocument(power), partsDb).energy;

    expect(typeof officialEnergy).toBe('number');
    expect(officialEnergy).toBeGreaterThan(0);
    expect(directEnergy).toBe(officialEnergy);
    expect(budgetFacts.energy).toBe(officialEnergy);
    expect(budgetDisplay.energy).toBe(officialEnergy);
    expect(budgetDisplay.columns.find((c) => c.key === 'energy')?.value).toBe(
      String(officialEnergy),
    );
  });

  it('guided L2 builder Energy column matches budget derive for the same catalog id (TASK-708)', () => {
    const elementalDamagePart: PowerPart = {
      id: '294',
      name: 'Elemental Damage',
      description: 'Elemental Damage',
      category: 'Damage',
      mechanic: true,
      base_en: 4,
      base_tp: 2,
      op_1_en: 2,
      op_1_tp: 1,
      percentage: false,
      duration: false,
    };
    const catalog: LibraryPower[] = [
      {
        id: 'tri-bolt',
        docId: 'tri-bolt',
        name: 'Tri-Element Bolt',
        description: 'Three elements.',
        actionType: 'basic',
        parts: [],
        damage: [
          { amount: 1, size: 6, type: 'fire' },
          { amount: 1, size: 6, type: 'ice' },
          { amount: 1, size: 6, type: 'lightning' },
        ],
      },
    ];
    const partsDb = [elementalDamagePart];
    const officialEnergy = buildOfficialPowerRows(catalog, partsDb)[0]?.energy;
    const rows = buildPowersTechniquesL2Items({
      kind: 'powers',
      mode: 'regular',
      items: catalog,
      powerPartsDb: partsDb,
      techniquePartsDb: [],
      energyInput: { archetypeAbility: 'intelligence', abilities: { intelligence: 4 }, level: 1 },
    });

    expect(rows).toHaveLength(1);
    // Guided L2 reuses the official-list column builders, so the Energy cell carries the
    // numeric value through unchanged. Comparing to the raw value (not a stringified copy)
    // is what actually pins parity between the two surfaces.
    expect(rows[0]?.columns?.find((c) => c.key === 'energy')?.value).toBe(officialEnergy);
    expect(rows[0]?.data).toMatchObject({ energy: officialEnergy });
  });

  it('columnar area/duration scalars required for budget Energy parity (TASK-708)', () => {
    const spherePart: PowerPart = {
      id: String(PART_IDS.SPHERE_OF_EFFECT),
      name: 'Sphere of Effect',
      description: 'Sphere of Effect',
      category: 'Area of Effect',
      mechanic: true,
      base_en: 4,
      base_tp: 1,
      op_1_en: 2,
      op_1_tp: 0.5,
      percentage: false,
      duration: false,
    };
    const durationPart: PowerPart = {
      id: '377',
      name: 'Duration (Minute)',
      description: 'Duration (Minute)',
      category: 'Duration',
      mechanic: true,
      base_en: 2,
      base_tp: 0,
      percentage: false,
      duration: true,
    };
    const partsDb = [spherePart, durationPart];
    const power: LibraryPower = {
      id: 'zone',
      docId: 'zone',
      name: 'Zone',
      description: 'Area with duration.',
      actionType: 'basic',
      area: { type: 'sphere', level: 1, applyDuration: true },
      duration: { type: 'minutes', value: 1 },
      parts: [],
    };

    const officialEnergy = buildOfficialPowerRows([power], partsDb)[0]?.energy;
    const budgetEnergy = derivePowerTechniqueBudgetFacts('power', power, partsDb, []).energy;
    const partialEnergy = derivePowerDisplay(
      {
        name: power.name,
        description: power.description,
        parts: [],
        actionType: power.actionType,
      },
      partsDb,
    ).energy;

    expect(officialEnergy).toBe(12);
    expect(budgetEnergy).toBe(12);
    expect(partialEnergy).toBeLessThan(12);
  });

  it('technique budget derive + guided L2 Energy match official list (TASK-708)', () => {
    const partsDb: TechniquePart[] = [
      {
        id: '7',
        name: 'Add Weapon to Technique',
        description: 'Weapon attack',
        category: 'Attack',
        mechanic: false,
        base_en: 2,
        base_tp: 1,
        percentage: false,
      },
    ];
    const technique: LibraryTechnique = {
      id: 'slash',
      docId: 'slash',
      name: 'Power Slash',
      description: 'A martial strike.',
      actionType: 'basic',
      attackMode: 'weapon',
      parts: [{ id: 7, name: 'Add Weapon to Technique', op_1_lvl: 0 }],
    };

    const officialEnergy = buildOfficialTechniqueRows([technique], partsDb)[0]?.energy;
    const budgetEnergy = derivePowerTechniqueBudgetFacts(
      'technique',
      technique,
      [],
      partsDb,
    ).energy;
    const rows = buildPowersTechniquesL2Items({
      kind: 'techniques',
      mode: 'regular',
      items: [technique],
      powerPartsDb: [],
      techniquePartsDb: partsDb,
      energyInput: { archetypeAbility: 'strength', abilities: { strength: 2 }, level: 1 },
    });

    expect(typeof officialEnergy).toBe('number');
    expect(officialEnergy).toBeGreaterThan(0);
    expect(budgetEnergy).toBe(officialEnergy);
    expect(rows[0]?.columns?.find((c) => c.key === 'energy')?.value).toBe(officialEnergy);
  });

  it('emits Add Power Range chip from select-density chipFacts (TASK-809)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'p1',
        docId: 'p1',
        name: 'Bolt',
        description: 'A bolt.',
        actionType: 'Action',
        range: { steps: 16 },
        parts: [],
      },
      'power',
      emptyCodex,
    );
    expect(selectable.columns?.map((c) => c.key)).not.toContain('Range');
    const chips = (selectable.detailSections ?? []).flatMap((s) => s.chips.map((c) => c.name));
    expect(chips.some((l) => /^range\b/i.test(l))).toBe(true);
  });

  it('emits add-weapon Range chip from chipFacts when Range is not a column (TASK-809)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'w1',
        name: 'Longbow',
        type: 'weapon',
        description: 'A bow.',
        damage: { amount: 1, size: 8, type: 'piercing' },
        range: '16 spaces',
        properties: [{ id: 10, name: 'Range', op_1_lvl: 1 }],
      },
      'weapon',
      emptyCodex,
    );
    expect(selectable.columns?.map((c) => c.key)).toEqual(['Damage']);
    const chips = (selectable.detailSections ?? []).flatMap((s) => s.chips.map((c) => c.name));
    expect(chips.some((l) => /^range\b/i.test(l))).toBe(true);
  });

  it('add-armor select density chips Crit / Abl. Req. / Agility Red. (TASK-809)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'a1',
        name: 'Chain',
        type: 'armor',
        description: '',
        armorValue: 3,
        abilityRequirement: { name: 'Strength', level: 3 },
        agilityReduction: 1,
        properties: [{ id: 22, name: 'Critical Range +1', op_1_lvl: 0 }],
      },
      'armor',
      emptyCodex,
    );
    expect(selectable.columns?.map((c) => c.key)).toEqual(['armor']);
    const chips = (selectable.detailSections ?? []).flatMap((s) => s.chips.map((c) => c.name));
    expect(chips.some((l) => /critical range/i.test(l))).toBe(true);
    expect(chips).toEqual(
      expect.arrayContaining(['Strength Requirement 3+', 'Agility Reduction -1']),
    );
    expect(chips.some((l) => l === 'Critical Range +1')).toBe(true);
  });

  it('add-weapon Currency chip is market cost, not the property C sum (TASK-870)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'axe',
        name: 'Axe',
        type: 'weapon',
        description: 'An axe.',
        properties: [{ id: 1, name: 'Sharp', op_1_lvl: 0 }],
        costs: { totalCurrency: 2, totalIP: 2, totalTP: 4 },
      },
      'weapon',
      {
        ...emptyCodex,
        itemPropertiesDb: [
          {
            id: '1',
            name: 'Sharp',
            description: '',
            base_c: 2,
            op_1_c: 0,
            base_ip: 2,
            op_1_ip: 0,
            base_tp: 4,
          },
        ] as ItemProperty[],
      },
    );
    const chips = (selectable.detailSections ?? []).flatMap((s) => s.chips.map((c) => c.name));
    expect(chips).toContain('Currency 31');
    expect(chips).not.toContain('Currency 2');
  });
});
