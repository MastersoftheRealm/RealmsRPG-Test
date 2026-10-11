/**
 * Play-sheet edits follow isOwner.
 * The owner, including a guest sheet, keeps the handler.
 * Anyone that check already treats as not the owner is a viewer.
 * Omit the handler. A noop is still a function, so the control stays on screen.
 */

import type { AddModalType } from './character-sheet-context';

export function whenSheetOwner<T>(isOwner: boolean, handler: T): T | undefined {
  return isOwner ? handler : undefined;
}

/** Add buttons that open a library modal. Hidden for a viewer. */
export function sheetLibraryAddActions(
  isOwner: boolean,
  setAddModalType: ((type: AddModalType) => void) | undefined,
): {
  onAddPower: (() => void) | undefined;
  onAddInnatePower: (() => void) | undefined;
  onAddTechnique: (() => void) | undefined;
  onAddWeapon: (() => void) | undefined;
  onAddShield: (() => void) | undefined;
  onAddArmor: (() => void) | undefined;
  onAddEquipment: (() => void) | undefined;
} {
  const open = (type: Exclude<AddModalType, null>) =>
    whenSheetOwner(isOwner && setAddModalType != null, () => setAddModalType!(type));

  return {
    onAddPower: open('power'),
    onAddInnatePower: open('innate-power'),
    onAddTechnique: open('technique'),
    onAddWeapon: open('weapon'),
    onAddShield: open('shield'),
    onAddArmor: open('armor'),
    onAddEquipment: open('equipment'),
  };
}
