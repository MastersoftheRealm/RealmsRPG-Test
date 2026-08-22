import { describe, expect, it } from 'vitest';
import {
  mapArmorRows,
  mapEquipmentRows,
  mapPowerRows,
  type LibraryEntityRowContext,
} from '@/components/character-sheet/library-entity-rows';
import { mapFeatRows } from '@/components/character-sheet/library-feat-rows';
import {
  CODEX_FEAT_HEADER_COLUMNS,
  buildFeatDetailSections,
  buildFeatGridColumns,
  featSelectHeaderColumns,
} from '@/lib/codex/feat-list';
import { CODEX_EQUIPMENT_HEADER_COLUMNS } from '@/lib/codex/equipment-list';
import {
  CHARACTER_SHEET_SHIELD_COLUMNS,
  CHARACTER_SHEET_EQUIPMENT_COLUMNS,
  CHARACTER_SHEET_TECHNIQUE_COLUMNS,
  CHARACTER_SHEET_WEAPON_COLUMNS,
  FEAT_COLUMNS,
  POWER_COLUMNS,
  POWER_COLUMNS_WITH_ENERGY,
  TECHNIQUE_COLUMNS,
} from '@/components/patterns/list/entity-library-sections-columns';
import {
  ARMAMENT_LIBRARY_CONFIG,
  armamentRowColumns,
  buildOfficialItemRows,
} from '@/lib/library/official-item-list';
import {
  ARMOR_L2_HEADER_COLUMNS,
  GEAR_L2_HEADER_COLUMNS,
  WEAPON_L2_HEADER_COLUMNS,
} from '@/components/guided-creator/guided-equipment-l2-grid';
import {
  GUIDED_POWERS_L2_HEADER_COLUMNS,
  GUIDED_TECHNIQUES_L2_HEADER_COLUMNS,
} from '@/lib/guided-creator/powers-techniques-l2';
import { FEATS_L2_HEADER_COLUMNS } from '@/lib/guided-creator/feats-l2';
import {
  OFFICIAL_POWER_HEADER_COLUMNS,
  officialPowerDetailSections,
  officialPowerRowColumns,
  buildOfficialPowerRows,
} from '@/lib/library/official-power-list';
import { OFFICIAL_TECHNIQUE_HEADER_COLUMNS } from '@/lib/library/official-technique-list';
import { buildSelectableItem, getListHeaderColumns } from '@/lib/library-selectable-builders';
import { defined } from '@/lib/utils';
import {
  assertRowFactCoverage,
  assertSurfaceColumnConfig,
  chipLabelsFromDetailSections,
  validateRowFactCoverage,
  validateSurfaceColumnConfig,
} from './validate-glr-facts';
import type { Item } from '@/types/equipment';
import type { LibraryItem } from '@/types/library';
import type { Abilities } from '@/types/abilities';

const propertiesDb: never[] = [];
const emptyCodex = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
};

const sheetCtx: LibraryEntityRowContext = {
  powerPartsDb: [
    {
      id: 1,
      name: 'Spark',
      category: 'Offense',
      mechanic: false,
      base_tp: 2,
      base_en: 1,
      description: '',
    } as never,
  ],
  techniquePartsDb: [],
  itemPropertiesDb: [{ id: 22, name: 'Critical Range +1', base_tp: 1, description: '' }],
  currentEnergy: 20,
  showLibraryEditControls: false,
  rollContext: null,
  hasMissingForEntry: () => false,
  abilities: {
    strength: 0,
    vitality: 0,
    agility: 2,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  } satisfies Abilities,
};

function headerKeys(headers: ReadonlyArray<{ key: string }>, omit: string[] = ['name']): string[] {
  const skip = new Set(omit.map((k) => k.toLowerCase()));
  return headers.filter((h) => !skip.has(h.key.toLowerCase())).map((h) => h.key);
}

function columnValueKeys(columns: Array<{ key: string }>): string[] {
  return columns.map((c) => c.key);
}

describe('GLR fact catalog — surface column configs (ADR-0016)', () => {
  it('library-official-power headers satisfy catalog bindings', () => {
    assertSurfaceColumnConfig('library-official-power', headerKeys(OFFICIAL_POWER_HEADER_COLUMNS));
  });

  it('library-official-technique headers satisfy catalog bindings', () => {
    assertSurfaceColumnConfig(
      'library-official-technique',
      headerKeys(OFFICIAL_TECHNIQUE_HEADER_COLUMNS),
    );
  });

  it('library-official armament headers satisfy catalog bindings', () => {
    assertSurfaceColumnConfig(
      'library-official-weapon',
      headerKeys(ARMAMENT_LIBRARY_CONFIG.weapon.headers),
    );
    assertSurfaceColumnConfig(
      'library-official-armor',
      headerKeys(ARMAMENT_LIBRARY_CONFIG.armor.headers),
    );
    assertSurfaceColumnConfig(
      'library-official-shield',
      headerKeys(ARMAMENT_LIBRARY_CONFIG.shield.headers),
    );
  });

  it('character-sheet power play columns satisfy catalog bindings (no static Energy column)', () => {
    const keys = headerKeys(POWER_COLUMNS);
    expect(keys).not.toContain('energy');
    assertSurfaceColumnConfig('character-sheet-power-play', keys);
  });

  it('character-sheet technique play columns satisfy catalog bindings (Energy via rightSlot)', () => {
    const keys = headerKeys(CHARACTER_SHEET_TECHNIQUE_COLUMNS);
    expect(keys).not.toContain('energy');
    assertSurfaceColumnConfig('character-sheet-technique-play', keys);
  });

  it('add-modal power columns satisfy catalog (Range is a chip)', () => {
    assertSurfaceColumnConfig('add-modal-power', headerKeys(getListHeaderColumns('power')));
  });

  it('add-modal technique columns satisfy catalog bindings', () => {
    assertSurfaceColumnConfig('add-modal-technique', headerKeys(getListHeaderColumns('technique')));
  });

  it('add-modal armament columns satisfy select density', () => {
    assertSurfaceColumnConfig('add-modal-weapon', headerKeys(getListHeaderColumns('weapon')));
    assertSurfaceColumnConfig('add-modal-armor', headerKeys(getListHeaderColumns('armor')));
    assertSurfaceColumnConfig('add-modal-shield', headerKeys(getListHeaderColumns('shield')));
  });

  it('add-modal feat/gear columns satisfy select density', () => {
    assertSurfaceColumnConfig('add-modal-feat', headerKeys(featSelectHeaderColumns()));
    assertSurfaceColumnConfig('add-modal-gear', headerKeys(getListHeaderColumns('equipment')));
  });

  it('creature stat-block power columns match select density', () => {
    assertSurfaceColumnConfig('creature-stat-block-power', headerKeys(POWER_COLUMNS_WITH_ENERGY));
  });

  it('creature stat-block technique columns match select density', () => {
    assertSurfaceColumnConfig('creature-stat-block-technique', headerKeys(TECHNIQUE_COLUMNS));
  });

  it('character-sheet feat play columns satisfy catalog', () => {
    assertSurfaceColumnConfig('character-sheet-feat', headerKeys(FEAT_COLUMNS));
  });

  it('character-sheet weapon play allows Attack roll chrome', () => {
    assertSurfaceColumnConfig(
      'character-sheet-weapon-play',
      headerKeys(CHARACTER_SHEET_WEAPON_COLUMNS),
    );
  });

  it('character-sheet shield play allows Attack/Range chrome', () => {
    assertSurfaceColumnConfig(
      'character-sheet-shield-play',
      headerKeys(CHARACTER_SHEET_SHIELD_COLUMNS),
    );
  });

  it('character-sheet equipment play columns satisfy catalog bindings (TASK-873)', () => {
    const keys = headerKeys(CHARACTER_SHEET_EQUIPMENT_COLUMNS);
    expect(keys).not.toContain('type');
    expect(keys).toEqual(['description', 'category', 'currency', 'rarity', 'quantity']);
    assertSurfaceColumnConfig('character-sheet-gear', keys);
  });

  it('codex feat headers satisfy catalog bindings', () => {
    assertSurfaceColumnConfig('codex-feat', headerKeys(CODEX_FEAT_HEADER_COLUMNS));
  });

  it('codex equipment headers satisfy catalog bindings', () => {
    assertSurfaceColumnConfig('codex-equipment', headerKeys(CODEX_EQUIPMENT_HEADER_COLUMNS));
  });

  it('fails when a required column fact is removed from armor headers', () => {
    const keys = headerKeys(ARMAMENT_LIBRARY_CONFIG.armor.headers).filter(
      (k) => k !== 'abilityRequirement',
    );
    const errors = validateSurfaceColumnConfig('library-official-armor', keys);
    expect(errors.some((e) => e.includes('abilityRequirement'))).toBe(true);
  });

  it('guided powers/techniques/feats L3 headers satisfy catalog bindings (TASK-709 / TASK-758)', () => {
    assertSurfaceColumnConfig('guided-powers-l3', headerKeys(GUIDED_POWERS_L2_HEADER_COLUMNS));
    assertSurfaceColumnConfig(
      'guided-techniques-l3',
      headerKeys(GUIDED_TECHNIQUES_L2_HEADER_COLUMNS),
    );
    assertSurfaceColumnConfig('guided-feats-l3', headerKeys(FEATS_L2_HEADER_COLUMNS));
  });

  it('path More details combat catalogs have no ranked columns (TASK-818)', () => {
    assertSurfaceColumnConfig('detail-option-power', []);
    assertSurfaceColumnConfig('detail-option-technique', []);
  });

  it('guided equipment L3 headers satisfy catalog bindings (TASK-688)', () => {
    assertSurfaceColumnConfig('guided-equipment-weapon-l3', headerKeys(WEAPON_L2_HEADER_COLUMNS));
    assertSurfaceColumnConfig('guided-equipment-armor-l3', headerKeys(ARMOR_L2_HEADER_COLUMNS));
    assertSurfaceColumnConfig('guided-equipment-gear-l3', headerKeys(GEAR_L2_HEADER_COLUMNS));
    // Shields share the weapon-phase header set; Block lives in the Damage cell.
    assertSurfaceColumnConfig('guided-equipment-shield-l3', headerKeys(WEAPON_L2_HEADER_COLUMNS));
  });
});

describe('GLR fact catalog — row coverage (ADR-0016)', () => {
  const catalog: LibraryItem[] = [
    {
      id: 'a1',
      docId: 'a1',
      name: 'Chain Mail',
      type: 'armor',
      abilityRequirement: { name: 'Strength', level: 3 },
      properties: [
        { id: 1, name: 'Damage Reduction', op_1_lvl: 1 },
        { id: 5, name: 'Agility Reduction', op_1_lvl: 1 },
        { id: 22, name: 'Critical Range +1', op_1_lvl: 0 },
      ],
    },
  ];

  it('armor official row exposes ability req and crit + in columns (TASK-628 regression)', () => {
    const row = defined(buildOfficialItemRows(catalog, propertiesDb, 'armor')[0]);
    const cols = armamentRowColumns(row, 'armor');
    assertRowFactCoverage('library-official-armor', {
      columnKeys: columnValueKeys(cols),
      chipLabels: row.parts.map((p) => p.name),
    });
    expect(row.abilityRequirement).toBe('Strength 3+');
    expect(row.criticalRangeIncrease).toBe(1);
    expect(row.parts.some((p) => /critical range/i.test(p.name))).toBe(false);
  });

  it('add-modal power row exposes Range / Category / TP chips from buildSelectableItem', () => {
    const selectable = buildSelectableItem(
      {
        id: 'p1',
        docId: 'p1',
        name: 'Bolt',
        description: 'A bolt.',
        actionType: 'Action',
        range: { steps: 16 },
        parts: [{ id: 1, name: 'Spark', op_1_lvl: 0 }],
      },
      'power',
      {
        ...emptyCodex,
        powerPartsDb: sheetCtx.powerPartsDb as never[],
      },
    );
    const columnKeys = selectable.columns?.map((c) => c.key) ?? [];
    expect(columnKeys).not.toContain('Range');
    const chipLabels = chipLabelsFromDetailSections(selectable.detailSections);
    const errors = validateRowFactCoverage('add-modal-power', {
      columnKeys,
      chipLabels,
      hasRightSlot: false,
    });
    expect(errors).toEqual([]);
    expect(chipLabels.some((l) => /^range\b/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /^offense\b/i.test(l) || /^category\b/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /training points\s+\d+/i.test(l))).toBe(true);
  });

  it('add-modal weapon row covers Damage column and Range chip (TASK-808 / TASK-809)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'w1',
        name: 'Longbow',
        type: 'weapon',
        description: 'A bow.',
        damage: { amount: 1, size: 8, type: 'piercing' },
        range: '16 spaces',
        rarity: 'uncommon',
        costs: { totalCurrency: 25, totalTP: 2 },
        properties: [{ id: 10, name: 'Range', op_1_lvl: 1 }],
      },
      'weapon',
      emptyCodex,
    );
    assertRowFactCoverage('add-modal-weapon', {
      columnKeys: selectable.columns?.map((c) => c.key) ?? [],
      chipLabels: chipLabelsFromDetailSections(selectable.detailSections),
    });
  });

  it('add-modal armor row covers DR column and Crit / Abl. Req. / Agility chips (TASK-808 / TASK-809)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'a1',
        name: 'Chain',
        type: 'armor',
        description: '',
        armorValue: 3,
        abilityRequirement: { name: 'Strength', level: 3 },
        agilityReduction: 1,
        rarity: 'uncommon',
        costs: { totalCurrency: 40, totalTP: 1 },
        properties: [{ id: 22, name: 'Critical Range +1', op_1_lvl: 0 }],
      },
      'armor',
      emptyCodex,
    );
    const chipLabels = chipLabelsFromDetailSections(selectable.detailSections);
    assertRowFactCoverage('add-modal-armor', {
      columnKeys: selectable.columns?.map((c) => c.key) ?? [],
      chipLabels,
    });
    expect(chipLabels.some((l) => /critical range/i.test(l))).toBe(true);
    expect(chipLabels).toEqual(
      expect.arrayContaining(['Strength Requirement 3+', 'Agility Reduction -1']),
    );
  });

  it('character-sheet armor row covers DR/crit columns and requirement chips', () => {
    const row = defined(
      mapArmorRows(
        [
          {
            id: 'a1',
            name: 'Chain Mail',
            abilityRequirement: { name: 'Strength', level: 3 },
            agilityReduction: 1,
            armorValue: 2,
            rarity: 'uncommon',
            cost: 40,
            properties: [{ id: 22, name: 'Critical Range +1', op_1_lvl: 0 }],
          } as unknown as Item,
        ],
        sheetCtx,
      )[0],
    );
    assertRowFactCoverage('character-sheet-armor', {
      columnKeys: columnValueKeys(row.columns ?? []),
      chipLabels: chipLabelsFromDetailSections(row.detailSections),
    });
    expect(chipLabelsFromDetailSections(row.detailSections)).toEqual(
      expect.arrayContaining(['Strength Requirement 3+', 'Agility Reduction -1']),
    );
    expect(
      chipLabelsFromDetailSections(row.detailSections).some((l) => /critical range/i.test(l)),
    ).toBe(false);
  });

  it('fails row coverage when chip-only facts are omitted', () => {
    const errors = validateRowFactCoverage('add-modal-power', {
      columnKeys: ['Energy', 'Action', 'Duration', 'Area', 'Damage'],
      chipLabels: [],
      hasRightSlot: false,
    });
    expect(errors.some((e) => e.includes('range'))).toBe(true);
  });

  it('allows a chip-only fact without a matching column (TASK-808)', () => {
    const errors = validateRowFactCoverage('add-modal-power', {
      columnKeys: ['Energy', 'Action', 'Duration', 'Area', 'Damage'],
      chipLabels: ['Offense', 'Range 16 Spaces', 'Training Points 2'],
      hasRightSlot: false,
    });
    expect(errors).toEqual([]);
  });

  it('fails when a column fact is also a descriptor chip (TASK-808 never-both)', () => {
    const errors = validateRowFactCoverage('add-modal-power', {
      columnKeys: ['Energy', 'Action', 'Duration', 'Area', 'Damage', 'Range'],
      chipLabels: ['Range 16 Spaces'],
      hasRightSlot: false,
    });
    expect(errors.some((e) => e.includes('range') && e.includes('column and chip'))).toBe(true);
  });

  it('codex feat Ability column plus Ability Requirements extra-chrome is not dual facts', () => {
    const feat = {
      id: 'f1',
      name: 'Iron Body',
      description: '',
      category: 'Utility',
      ability: 'Vitality',
      ability_req: ['Vitality'],
      abil_req_val: [3],
      tags: [],
      skill_req: [],
      skill_req_val: [],
      lvl_req: 1,
      uses_per_rec: 1,
      rec_period: 'Rest',
      char_feat: true,
      state_feat: false,
    };
    const sections = buildFeatDetailSections(feat as never, new Map(), []);
    const chipLabels = chipLabelsFromDetailSections(sections);
    expect(chipLabels).toEqual(expect.arrayContaining(['Vitality 3+']));
    expect(chipLabels.some((l) => /requirement\s+\d+\+/i.test(l))).toBe(false);
    assertRowFactCoverage('codex-feat', {
      columnKeys: columnValueKeys(buildFeatGridColumns(feat as never, 'codex')),
      chipLabels,
    });
  });

  it('official power browse chips Training Points (not a dense column)', () => {
    const row = defined(
      buildOfficialPowerRows(
        [
          {
            id: 'p1',
            docId: 'p1',
            name: 'Bolt',
            description: 'A bolt.',
            actionType: 'Action',
            range: { steps: 16 },
            parts: [{ id: 1, name: 'Spark', op_1_lvl: 0 }],
            damage: [{ amount: 1, size: 8, type: 'fire' }],
          },
        ],
        sheetCtx.powerPartsDb as never[],
      )[0],
    );
    const chipLabels = chipLabelsFromDetailSections(officialPowerDetailSections(row));
    assertRowFactCoverage('library-official-power', {
      columnKeys: columnValueKeys(officialPowerRowColumns(row)),
      chipLabels,
    });
    expect(chipLabels.some((l) => /training points\s+\d+/i.test(l))).toBe(true);
    expect(columnValueKeys(officialPowerRowColumns(row))).toContain('category');
    expect(chipLabels.some((l) => /^category\b/i.test(l))).toBe(false);
  });

  it('character-sheet power play chips category / range / TP', () => {
    const row = defined(
      mapPowerRows(
        [
          {
            id: 'p1',
            name: 'Bolt',
            cost: 4,
            actionType: 'Action',
            range: '16 Spaces',
            parts: [{ id: 1, name: 'Spark', op_1_lvl: 0 }],
            damage: [{ amount: 1, size: 8, type: 'fire' }],
          } as never,
        ],
        { ...sheetCtx, onUsePower: () => {} },
      )[0],
    );
    const chipLabels = chipLabelsFromDetailSections(row.detailSections);
    assertRowFactCoverage('character-sheet-power-play', {
      columnKeys: columnValueKeys(row.columns ?? []),
      chipLabels,
      hasRightSlot: true,
    });
    expect(chipLabels.some((l) => /^offense\b/i.test(l) || /^category\b/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /^range\b/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /training points\s+\d+/i.test(l))).toBe(true);
  });

  it('character-sheet gear play columns category / currency / rarity; chips TP when valued (TASK-873)', () => {
    const row = defined(
      mapEquipmentRows(
        [
          {
            id: 'e1',
            name: 'Spyglass',
            type: 'equipment',
            category: 'Adventuring',
            rarity: 'uncommon',
            cost: 20,
            tp: 2,
          } as Item,
        ],
        sheetCtx,
      )[0],
    );
    expect(row.totalTp).toBeUndefined();
    expect(columnValueKeys(row.columns ?? [])).not.toContain('tp');
    expect(columnValueKeys(row.columns ?? [])).not.toContain('type');
    expect(columnValueKeys(row.columns ?? [])).toEqual([
      'description',
      'category',
      'currency',
      'rarity',
      'quantity',
    ]);
    const chipLabels = chipLabelsFromDetailSections(row.detailSections);
    assertRowFactCoverage('character-sheet-gear', {
      columnKeys: columnValueKeys(row.columns ?? []),
      chipLabels,
    });
    expect(chipLabels.some((l) => /training points\s+2/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /^category\b/i.test(l))).toBe(false);
    expect(chipLabels.some((l) => /^currency\s+20$/i.test(l))).toBe(false);
  });

  it('character-sheet gear play omits Training Points chip when TP is 0', () => {
    const row = defined(
      mapEquipmentRows(
        [
          {
            id: 'e1',
            name: 'Rope',
            type: 'equipment',
            category: 'Adventuring',
            rarity: 'common',
            cost: 5,
          } as Item,
        ],
        sheetCtx,
      )[0],
    );
    const chipLabels = chipLabelsFromDetailSections(row.detailSections);
    expect(chipLabels.some((l) => /training points/i.test(l))).toBe(false);
  });

  it('add-modal gear chips TP and keeps Category / Currency / Rarity columns (TASK-825)', () => {
    const selectable = buildSelectableItem(
      {
        id: 'e1',
        docId: 'e1',
        name: 'Spyglass',
        type: 'equipment',
        description: 'A glass.',
        rarity: 'uncommon',
        properties: [],
        costs: { totalCurrency: 20, totalTP: 2 },
      },
      'equipment',
      emptyCodex,
    );
    const columnKeys = selectable.columns?.map((c) => c.key) ?? [];
    expect(columnKeys).not.toContain('tp');
    expect(columnKeys).not.toContain('Training Pts');
    const chipLabels = chipLabelsFromDetailSections(selectable.detailSections);
    assertRowFactCoverage('add-modal-gear', {
      columnKeys,
      chipLabels,
    });
    expect(chipLabels.some((l) => /training points\s+2/i.test(l))).toBe(true);
  });

  it('character-sheet feat play chips Req. Level / Category / Ability', () => {
    const row = defined(
      mapFeatRows(
        [
          {
            name: 'Focused',
            category: 'Utility',
            ability: 'Vitality',
            reqLevel: 1,
            maxUses: 1,
            recovery: 'Rest',
          },
        ],
        { showEditControls: false, traitUses: {} },
      )[0],
    );
    const chipLabels = chipLabelsFromDetailSections(row.detailSections);
    assertRowFactCoverage('character-sheet-feat', {
      columnKeys: columnValueKeys(row.columns ?? []),
      chipLabels,
    });
    expect(chipLabels.some((l) => /^req\.\s+level\b/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /^category\b/i.test(l))).toBe(true);
    expect(chipLabels.some((l) => /^ability\b/i.test(l))).toBe(true);
  });
});
