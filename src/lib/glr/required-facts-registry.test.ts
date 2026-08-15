import { describe, expect, it } from 'vitest';
import {
  mapArmorRows,
  type LibraryEntityRowContext,
} from '@/components/character-sheet/library-entity-rows';
import { CODEX_FEAT_HEADER_COLUMNS } from '@/lib/codex/feat-list';
import { CODEX_EQUIPMENT_HEADER_COLUMNS } from '@/lib/codex/equipment-list';
import {
  CHARACTER_SHEET_TECHNIQUE_COLUMNS,
  POWER_COLUMNS,
} from '@/components/shared/entity-library-sections-columns';
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
import { OFFICIAL_POWER_HEADER_COLUMNS } from '@/lib/library/official-power-list';
import { OFFICIAL_TECHNIQUE_HEADER_COLUMNS } from '@/lib/library/official-technique-list';
import { buildSelectableItem, getListHeaderColumns } from '@/lib/library-selectable-builders';
import {
  assertRowFactCoverage,
  assertSurfaceColumnConfig,
  chipLabelsFromDetailSections,
  validateRowFactCoverage,
  validateSurfaceColumnConfig,
} from './validate-glr-facts';
import type { Item } from '@/types/equipment';
import type { LibraryItem, LibraryPower } from '@/types/library';
import type { Abilities } from '@/types/abilities';

const propertiesDb: never[] = [];
const emptyCodex = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
};

const sheetCtx: LibraryEntityRowContext = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
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

describe('GLR required-facts registry — surface column configs (TASK-629)', () => {
  it('library-official-power headers satisfy registry', () => {
    assertSurfaceColumnConfig('library-official-power', headerKeys(OFFICIAL_POWER_HEADER_COLUMNS));
  });

  it('library-official-technique headers satisfy registry', () => {
    assertSurfaceColumnConfig(
      'library-official-technique',
      headerKeys(OFFICIAL_TECHNIQUE_HEADER_COLUMNS),
    );
  });

  it('library-official armament headers satisfy registry', () => {
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

  it('character-sheet power play columns satisfy registry (no static Energy column)', () => {
    const keys = headerKeys(POWER_COLUMNS);
    expect(keys).not.toContain('energy');
    const errors = validateRowFactCoverage('character-sheet-power-play', {
      columnKeys: keys,
      chipLabels: [],
      hasRightSlot: true,
    });
    expect(errors).toEqual([]);
  });

  it('character-sheet technique play columns satisfy registry (Energy via rightSlot)', () => {
    const keys = headerKeys(CHARACTER_SHEET_TECHNIQUE_COLUMNS);
    expect(keys).not.toContain('energy');
    const errors = validateRowFactCoverage('character-sheet-technique-play', {
      columnKeys: keys,
      chipLabels: [],
      hasRightSlot: true,
    });
    expect(errors).toEqual([]);
  });

  it('add-modal technique columns satisfy registry', () => {
    assertSurfaceColumnConfig('add-modal-technique', headerKeys(getListHeaderColumns('technique')));
  });

  it('codex feat headers satisfy registry', () => {
    assertSurfaceColumnConfig('codex-feat', headerKeys(CODEX_FEAT_HEADER_COLUMNS));
  });

  it('codex equipment headers satisfy registry', () => {
    assertSurfaceColumnConfig('codex-equipment', headerKeys(CODEX_EQUIPMENT_HEADER_COLUMNS));
  });

  it('fails when a required column fact is removed from armor headers', () => {
    const keys = headerKeys(ARMAMENT_LIBRARY_CONFIG.armor.headers).filter(
      (k) => k !== 'abilityRequirement',
    );
    const errors = validateSurfaceColumnConfig('library-official-armor', keys);
    expect(errors.some((e) => e.includes('abilityRequirement'))).toBe(true);
  });

  it('guided powers/techniques/feats L3 headers satisfy registry (TASK-709 / TASK-758)', () => {
    assertSurfaceColumnConfig('guided-powers-l3', headerKeys(GUIDED_POWERS_L2_HEADER_COLUMNS));
    assertSurfaceColumnConfig(
      'guided-techniques-l3',
      headerKeys(GUIDED_TECHNIQUES_L2_HEADER_COLUMNS),
    );
    assertSurfaceColumnConfig('guided-feats-l3', headerKeys(FEATS_L2_HEADER_COLUMNS));
  });

  it('guided equipment L3 headers satisfy registry (TASK-688)', () => {
    assertSurfaceColumnConfig('guided-equipment-weapon-l3', headerKeys(WEAPON_L2_HEADER_COLUMNS));
    assertSurfaceColumnConfig('guided-equipment-armor-l3', headerKeys(ARMOR_L2_HEADER_COLUMNS));
    assertSurfaceColumnConfig('guided-equipment-gear-l3', headerKeys(GEAR_L2_HEADER_COLUMNS));
    // Shields share the weapon-phase header set; Block lives in the Damage cell.
    assertSurfaceColumnConfig('guided-equipment-shield-l3', headerKeys(WEAPON_L2_HEADER_COLUMNS));
  });
});

describe('GLR required-facts registry — row coverage (TASK-629)', () => {
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
    const [row] = buildOfficialItemRows(catalog, propertiesDb, 'armor');
    const cols = armamentRowColumns(row, 'armor');
    assertRowFactCoverage('library-official-armor', {
      columnKeys: columnValueKeys(cols),
      chipLabels: row.parts.map((p) => p.name),
    });
    expect(row.abilityRequirement).toBe('Strength 3+');
    expect(row.criticalRangeIncrease).toBe(1);
    expect(row.parts.some((p) => /critical range/i.test(p.name))).toBe(false);
  });

  it('add-modal power row exposes Range as expanded chip from buildSelectableItem', () => {
    const selectable = buildSelectableItem(
      {
        id: 'p1',
        name: 'Bolt',
        description: 'A bolt.',
        actionType: 'Action',
        range: { type: 'ranged', distance: 16 } as LibraryPower['range'],
        parts: [],
      },
      'power',
      emptyCodex,
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
  });

  it('character-sheet armor row covers DR/crit columns and requirement chips', () => {
    const [row] = mapArmorRows(
      [
        {
          id: 'a1',
          name: 'Chain Mail',
          abilityRequirement: { name: 'Strength', level: 3 },
          agilityReduction: 1,
          armorValue: 2,
          properties: [{ id: 22, name: 'Critical Range +1', op_1_lvl: 0 }],
        } as unknown as Item,
      ],
      sheetCtx,
    );
    assertRowFactCoverage('character-sheet-armor', {
      columnKeys: columnValueKeys(row.columns ?? []),
      chipLabels: chipLabelsFromDetailSections(row.detailSections),
    });
    expect(chipLabelsFromDetailSections(row.detailSections)).toEqual(
      expect.arrayContaining(['Strength Requirement 3+', 'Agility Reduction -1']),
    );
  });

  it('fails row coverage when chip-only facts are omitted', () => {
    const errors = validateRowFactCoverage('add-modal-power', {
      columnKeys: ['Energy', 'Action', 'Duration', 'Area', 'Damage'],
      chipLabels: [],
      hasRightSlot: false,
    });
    expect(errors.some((e) => e.includes('range'))).toBe(true);
  });
});
