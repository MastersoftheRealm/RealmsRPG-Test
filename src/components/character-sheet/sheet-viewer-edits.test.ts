import { readFileSync } from 'node:fs';
import path from 'node:path';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import type { PowerPart } from '@/hooks/codex-types';
import type { Character, Item } from '@/types';
import { buildLibrarySectionData } from './build-library-section-data';
import { mapEquipmentRows, mapPowerRows, mapWeaponRows } from './library-entity-rows';
import { mapFeatRows } from './library-feat-rows';
import { SheetNoteField } from './notes-tab';
import { ResourceInput } from './sheet-resource-input';
import { sheetLibraryAddActions, whenSheetOwner } from './sheet-viewer-edits';
import type { SheetLibraryModel } from './library-section-props';
import type { CharacterSheetDerivedHandlers } from './use-character-sheet-derived';
import { rollLogShowsDiceBuilder } from '@/components/rolls/roll-log';

const abilities = {
  strength: 0,
  vitality: 0,
  agility: 0,
  acuity: 0,
  intelligence: 0,
  charisma: 0,
};

function sheet(): Character {
  return {
    id: 'sheet-1',
    name: 'Test sheet',
    level: 1,
    abilities,
    appearance: 'Tall',
    backstory: 'From the coast',
    archetypeDesc: 'Warrior',
    notes: 'Watch the gate',
    namedNotes: [{ id: 'n1', name: 'Session', content: 'Met the party' }],
    proficiencies: [],
    actionPoints: 4,
  };
}

function handlers(): CharacterSheetDerivedHandlers {
  const noop = () => {};
  return {
    setCharacter: vi.fn(),
    handleRemovePower: noop,
    handleTogglePowerInnate: noop,
    handleUsePower: vi.fn(),
    handleRemoveTechnique: noop,
    handleUseTechnique: vi.fn(),
    handleRemoveWeapon: noop,
    handleToggleEquipWeapon: vi.fn(),
    handleRemoveShield: noop,
    handleToggleEquipShield: vi.fn(),
    handleRemoveArmor: noop,
    handleToggleEquipArmor: vi.fn(),
    handleRemoveEquipment: noop,
    handleEquipmentQuantityChange: vi.fn(),
    handleCurrencyChange: noop,
    handleStateUsesChange: vi.fn(),
    handleEnterState: noop,
    handleFeatUsesChange: vi.fn(),
    handleFeatLevelChange: noop,
    handleRequestRemoveFeat: noop,
    handleTraitUsesChange: vi.fn(),
    handleFeatCustomizationChange: noop,
    handleTraitCustomizationChange: noop,
  };
}

const libraryModel: SheetLibraryModel = {
  archetypeProgression: null,
  calculatedMaxEnergy: 10,
  characterSpeciesTraits: [],
  archetypeFeatsForDisplay: [],
  characterFeatsForDisplay: [],
  stateFeatsList: [],
  stateUsesCurrent: 0,
  stateUsesMax: 0,
};

function section(isOwner: boolean) {
  return buildLibrarySectionData({
    character: sheet(),
    enrichedData: null,
    libraryModel,
    handlers: handlers(),
    isOwner,
  });
}

type Node = {
  type?: unknown;
  props?: {
    children?: ReactNode;
    'aria-label'?: string;
    disabled?: boolean;
    onClick?: unknown;
    title?: string;
  };
};

function walk(node: ReactNode, visit: (el: Node) => void) {
  if (node == null || typeof node === 'boolean') return;
  if (Array.isArray(node)) {
    node.forEach((child) => walk(child, visit));
    return;
  }
  if (typeof node !== 'object') return;
  const el = node as Node;
  visit(el);
  walk(el.props?.children, visit);
}

function typesIn(node: ReactNode): unknown[] {
  const found: unknown[] = [];
  walk(node, (el) => found.push(el.type));
  return found;
}

describe('sheet viewers cannot use edit controls (86e3jryyp)', () => {
  it('omits play handlers for a viewer and keeps them for the owner', () => {
    const viewer = section(false);
    const owner = section(true);

    expect(viewer.onUsePower).toBeUndefined();
    expect(viewer.onUseTechnique).toBeUndefined();
    expect(viewer.onToggleEquipWeapon).toBeUndefined();
    expect(viewer.onToggleEquipShield).toBeUndefined();
    expect(viewer.onToggleEquipArmor).toBeUndefined();
    expect(viewer.onEquipmentQuantityChange).toBeUndefined();
    expect(viewer.onFeatUsesChange).toBeUndefined();
    expect(viewer.onTraitUsesChange).toBeUndefined();
    expect(viewer.onStateUsesChange).toBeUndefined();
    expect(viewer.onAddNote).toBeUndefined();
    expect(viewer.onUpdateNote).toBeUndefined();
    expect(viewer.onAppearanceChange).toBeUndefined();
    expect(viewer.onBackstoryChange).toBeUndefined();
    expect(viewer.onArchetypeDescChange).toBeUndefined();
    expect(viewer.onNotesChange).toBeUndefined();
    expect(viewer.onProficienciesChange).toBeUndefined();

    expect(owner.onUsePower).toEqual(expect.any(Function));
    expect(owner.onToggleEquipWeapon).toEqual(expect.any(Function));
    expect(owner.onToggleEquipShield).toEqual(expect.any(Function));
    expect(owner.onToggleEquipArmor).toEqual(expect.any(Function));
    expect(owner.onEquipmentQuantityChange).toEqual(expect.any(Function));
    expect(owner.onFeatUsesChange).toEqual(expect.any(Function));
    expect(owner.onAddNote).toEqual(expect.any(Function));
    expect(owner.onAppearanceChange).toEqual(expect.any(Function));
    expect(owner.onNotesChange).toEqual(expect.any(Function));
    expect(owner.onProficienciesChange).toEqual(expect.any(Function));

    owner.onAddNote?.();
    owner.onProficienciesChange?.([]);
    expect(owner.onUsePower).not.toBe(viewer.onUsePower);
  });

  it('does not open add modals for a viewer', () => {
    const setAdd = vi.fn();
    const viewer = sheetLibraryAddActions(false, setAdd);
    expect(viewer.onAddWeapon).toBeUndefined();
    expect(viewer.onAddShield).toBeUndefined();
    expect(viewer.onAddArmor).toBeUndefined();
    expect(viewer.onAddEquipment).toBeUndefined();
    expect(viewer.onAddPower).toBeUndefined();
    expect(viewer.onAddInnatePower).toBeUndefined();
    expect(viewer.onAddTechnique).toBeUndefined();

    const owner = sheetLibraryAddActions(true, setAdd);
    owner.onAddWeapon?.();
    owner.onAddInnatePower?.();
    expect(setAdd).toHaveBeenCalledWith('weapon');
    expect(setAdd).toHaveBeenCalledWith('innate-power');
  });

  it('keeps header play handlers only for the owner', () => {
    const change = () => {};
    expect(whenSheetOwner(false, change)).toBeUndefined();
    expect(whenSheetOwner(true, change)).toBe(change);
  });

  it('shows Health as text for a viewer and keeps the field for the owner', () => {
    const readout = ResourceInput({
      label: 'Health',
      current: 10,
      max: 20,
      showBar: true,
    });
    const labels: string[] = [];
    walk(readout, (el) => {
      if (el.props?.['aria-label']) labels.push(el.props['aria-label']);
    });
    expect(typesIn(readout)).not.toContain('input');
    expect(labels).toContain('Current Health');

    const editor = ResourceInput({
      label: 'Health',
      current: 10,
      max: 20,
      onChange: () => {},
    });
    expect((editor as Node).type).toEqual(expect.any(Function));
  });

  it('renders a note as text unless the owner can change it', () => {
    const readOnly = SheetNoteField({
      value: 'Watch the gate',
      placeholder: 'Additional notes, goals, and reminders...',
      label: 'General Notes',
    });
    expect((readOnly as Node).type).toBe('p');
    expect(typesIn(readOnly)).not.toContain('textarea');

    const editable = SheetNoteField({
      value: 'Watch the gate',
      onChange: () => {},
      placeholder: 'Additional notes, goals, and reminders...',
      label: 'General Notes',
    });
    expect((editable as Node).type).not.toBe('p');
    expect((editable as { props?: { label?: string } }).props?.label).toBe('General Notes');
  });

  it('hides equip, quantity, feat uses, and Use for a viewer', () => {
    const rowCtx = {
      powerPartsDb: [],
      techniquePartsDb: [],
      itemPropertiesDb: [],
      abilities,
      currentEnergy: 18,
      showLibraryEditControls: false,
      rollContext: null,
      hasMissingForEntry: () => false,
    };
    const charmPart: PowerPart = {
      id: 'charm',
      name: 'Charm',
      description: 'Charm',
      category: 'Effect',
      base_en: 7,
      base_tp: 1,
    };
    const power = mapPowerRows(
      [{ id: 'charm-beast', name: 'Charm Beast', parts: [{ id: 'charm', name: 'Charm' }] }],
      { ...rowCtx, powerPartsDb: [charmPart] },
    )[0];
    const spend = power?.rightSlot as Node;
    expect(spend.props?.disabled).toBe(true);
    expect(spend.props?.onClick).toBeUndefined();
    expect(spend.props?.title).toBe('Energy cost 7');

    const weapon = mapWeaponRows([{ id: 'sword', name: 'Sword' } as Item], rowCtx)[0];
    expect(weapon?.leftSlot).toBeUndefined();

    const gear = mapEquipmentRows([{ id: 'rope', name: 'Rope', quantity: 2 } as Item], rowCtx)[0];
    const quantity = gear?.columns?.find((column) => column.key === 'quantity');
    expect(quantity?.value).toBe(2);

    const feat = mapFeatRows([{ id: 'familiar', name: 'Familiar', maxUses: 3, currentUses: 1 }], {
      showEditControls: false,
      traitUses: {},
    })[0];
    const uses = feat?.columns?.find((column) => column.key === 'uses')?.value as Node;
    expect(uses.type).toBe('span');
  });

  it('hides the roll log dice builder when the viewer cannot roll', () => {
    expect(rollLogShowsDiceBuilder(false)).toBe(false);
    expect(rollLogShowsDiceBuilder(true)).toBe(true);
    const rollLog = readFileSync(path.join(import.meta.dirname, '../rolls/roll-log.tsx'), 'utf8');
    expect(rollLog).toContain('rollLogShowsDiceBuilder(canRoll)');
  });

  it('does not pass header play handlers to a viewer on the sheet page', () => {
    const page = readFileSync(
      path.join(
        import.meta.dirname,
        '../../app/(detail)/characters/[id]/character-sheet-route.tsx',
      ),
      'utf8',
    );
    expect(page).toContain('onHealthChange={whenSheetOwner(isOwner, handleHealthChange)}');
    expect(page).toContain('onEnergyChange={whenSheetOwner(isOwner, handleEnergyChange)}');
    expect(page).toContain(
      'onActionPointsChange={whenSheetOwner(isOwner, handleActionPointsChange)}',
    );
    expect(page).toContain('onExperienceChange={whenSheetOwner(isOwner, handleExperienceChange)}');
    expect(page).toContain('canRoll={isOwner}');
  });
});
