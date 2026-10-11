import type { PowerPart } from '@/hooks/codex-types';
import { chipLabelsFromDetailSections } from '@/lib/glr';
import { defined } from '@/lib/utils';
import { describe, expect, it } from 'vitest';
import {
  mapPowerRows,
  mapTechniqueRows,
  type LibraryEntityRowContext,
} from './library-entity-rows';
import type { CharacterPower, CharacterTechnique } from '@/types';
import type { LibraryPower } from '@/types/library';

const baseCtx: LibraryEntityRowContext = {
  powerPartsDb: [],
  techniquePartsDb: [],
  itemPropertiesDb: [],
  currentEnergy: 20,
  showLibraryEditControls: false,
  rollContext: null,
  hasMissingForEntry: () => false,
  onUsePower: () => {},
  onUseTechnique: () => {},
};

function columnKeys(row: { columns?: Array<{ key: string }> | undefined }): string[] {
  return (row.columns ?? []).map((c) => c.key);
}

describe('mapPowerRows / mapTechniqueRows — Energy is rightSlot only (TASK-502)', () => {
  it('powers: no Energy column when spend handler is present', () => {
    const powers: CharacterPower[] = [
      {
        id: 'p1',
        name: 'Bolt',
        cost: 4,
        actionType: 'Action',
        damage: '1d8',
      } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, baseCtx)[0]);
    expect(columnKeys(row)).not.toContain('energy');
    expect(columnKeys(row)).toEqual(['action', 'damage', 'area', 'duration']);
    expect(row.rightSlot).toBeTruthy();
  });

  it('techniques: no Energy column when spend handler is present', () => {
    const techniques: CharacterTechnique[] = [
      {
        id: 't1',
        name: 'Strike',
        cost: 3,
        actionType: 'Action',
        weaponName: 'Sword',
        tp: 2,
      } as CharacterTechnique,
    ];
    const row = defined(mapTechniqueRows(techniques, baseCtx)[0]);
    expect(columnKeys(row)).not.toContain('energy');
    expect(columnKeys(row)).toEqual(['action', 'weapon']);
    expect(row.totalTp).toBeUndefined();
    const chips = chipLabelsFromDetailSections(row.detailSections);
    expect(chips.some((l) => /training points\s+2/i.test(l))).toBe(true);
    expect(row.rightSlot).toBeTruthy();
  });

  it('a power with no energy shows a dash instead of a 1 EN spend control', () => {
    const powers: CharacterPower[] = [
      { id: 'innate', name: 'Innate', cost: 0, innate: true } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, baseCtx)[0]);
    const slot = row.rightSlot as { props?: { 'aria-label'?: string; children?: string } } | null;
    expect(slot?.props?.['aria-label']).toBe('No energy cost');
    expect(slot?.props?.children).toBe('—');
  });

  it('shows a partless power as its saved quick action and 2 rounds', () => {
    const libraryItem = {
      id: 'glance',
      docId: 'glance',
      name: 'Glance',
      parts: [],
      actionType: 'quick',
      duration: { type: 'rounds', value: 2 },
    } as LibraryPower;
    const powers: CharacterPower[] = [
      {
        id: 'glance',
        name: 'Glance',
        parts: [],
        actionType: 'Basic action',
        duration: 'Instant',
        libraryItem,
      } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, baseCtx)[0]);
    expect(row.columns?.find((c) => c.key === 'action')?.value).toBe('Quick action');
    expect(row.columns?.find((c) => c.key === 'duration')?.value).toBe('2 Rounds');
  });

  it('keeps a saved action and duration when the library row is missing', () => {
    const powers: CharacterPower[] = [
      {
        id: 'glance',
        name: 'Glance',
        parts: [],
        actionType: 'Quick Action',
        duration: '2 Rounds',
      } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, baseCtx)[0]);
    expect(row.columns?.find((c) => c.key === 'action')?.value).toBe('Quick action');
    expect(row.columns?.find((c) => c.key === 'duration')?.value).toBe('2 RNDS');
  });

  it('an innate power shows its Energy without a Spend control (86e3jvfmf)', () => {
    const charmPart: PowerPart = {
      id: 'charm',
      name: 'Charm',
      description: 'Charm',
      category: 'Effect',
      base_en: 7,
      base_tp: 1,
    };
    const charm: CharacterPower = {
      id: 'charm-beast',
      name: 'Charm Beast',
      innate: true,
      parts: [{ id: 'charm', name: 'Charm' }],
    } as CharacterPower;
    const ctx: LibraryEntityRowContext = {
      ...baseCtx,
      powerPartsDb: [charmPart],
      currentEnergy: 18,
    };
    const innate = defined(mapPowerRows([charm], ctx)[0]);
    const mark = innate.rightSlot as {
      type?: unknown;
      props?: { 'aria-label'?: string; title?: string; onClick?: () => void; children?: number };
    };
    expect(mark.type).toBe('span');
    expect(mark.props?.onClick).toBeUndefined();
    expect(mark.props?.children).toBe(7);
    expect(mark.props?.['aria-label']).toBe('Innate, 7 Energy, no Energy spent');
    expect(mark.props?.title).toBe('Innate — no Energy spent');

    const spent: Array<number> = [];
    const regular = defined(
      mapPowerRows([{ ...charm, innate: false }], {
        ...ctx,
        onUsePower: (_id, cost) => spent.push(cost),
      })[0],
    );
    const button = regular.rightSlot as {
      props?: { title?: string; onClick?: () => void };
    };
    expect(button.props?.title).toBe('Spend 7 Energy');
    button.props?.onClick?.();
    expect(spent).toEqual([7]);
  });

  it('view-only (no onUse): still renders disabled spend chrome, not a static column', () => {
    const powers: CharacterPower[] = [
      { id: 'p2', name: 'View', cost: 5, actionType: 'Action' } as CharacterPower,
    ];
    const row = defined(mapPowerRows(powers, { ...baseCtx, onUsePower: undefined })[0]);
    expect(columnKeys(row)).not.toContain('energy');
    expect(row.rightSlot).toBeTruthy();
  });
});
