/**
 * Inventory tab body for LibrarySection (currency/armament + item list sections).
 */

'use client';

import { useState } from 'react';
import {
  TabSummarySection,
  SummaryItem,
  InfoTippy,
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  EquipmentListSection,
  type SortState,
} from '@/components/patterns';
import { armamentProficiencyHelp } from '../../../public/tooltip-text';
import { calculateArmamentProficiency } from '@/lib/game/formulas';
import type {
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
} from '@/components/patterns/list/entity-library-sections';

export type LibraryInventoryPanelProps = {
  currency: number;
  onCurrencyChange?: ((value: number) => void) | undefined;
  martialProficiency?: number | undefined;
  showLibraryEditControls: boolean;
  weaponRows: EntityWeaponRow[];
  shieldRows: EntityShieldRow[];
  armorRows: EntityArmorRow[];
  equipmentRows: EntityEquipmentRow[];
  weaponSort: SortState;
  shieldSort: SortState;
  armorSort: SortState;
  equipmentSort: SortState;
  onWeaponSort: (col: string) => void;
  onShieldSort: (col: string) => void;
  onArmorSort: (col: string) => void;
  onEquipmentSort: (col: string) => void;
  onAddWeapon?: (() => void) | undefined;
  onRemoveWeapon?: ((id: string | number) => void) | undefined;
  onAddShield?: (() => void) | undefined;
  onRemoveShield?: ((id: string | number) => void) | undefined;
  onAddArmor?: (() => void) | undefined;
  onRemoveArmor?: ((id: string | number) => void) | undefined;
  onAddEquipment?: (() => void) | undefined;
  onRemoveEquipment?: ((id: string | number) => void) | undefined;
};

export function LibraryInventoryPanel({
  currency,
  onCurrencyChange,
  martialProficiency,
  showLibraryEditControls,
  weaponRows,
  shieldRows,
  armorRows,
  equipmentRows,
  weaponSort,
  shieldSort,
  armorSort,
  equipmentSort,
  onWeaponSort,
  onShieldSort,
  onArmorSort,
  onEquipmentSort,
  onAddWeapon,
  onRemoveWeapon,
  onAddShield,
  onRemoveShield,
  onAddArmor,
  onRemoveArmor,
  onAddEquipment,
  onRemoveEquipment,
}: LibraryInventoryPanelProps) {
  const [currencyInput, setCurrencyInput] = useState(currency.toString());

  const handleCurrencyBlur = () => {
    const value = parseInt(currencyInput) || 0;
    if (value !== currency && onCurrencyChange) {
      onCurrencyChange(value);
    }
  };

  return (
    <div className="space-y-2">
      {/* Inventory Summary: Currency + Armament Proficiency (stack on mobile to avoid overlap) */}
      <TabSummarySection variant="currency">
        <div className="flex w-full flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
          <div className="flex min-w-0 items-center gap-2 sm:flex-1 sm:justify-start">
            <span aria-hidden="true" className="text-sm">
              💰
            </span>
            <input
              type="text"
              value={currencyInput}
              onChange={(e) => setCurrencyInput(e.target.value)}
              onBlur={handleCurrencyBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  const raw = currencyInput.trim();
                  let newValue = currency;
                  if (raw.startsWith('+')) newValue = currency + (parseInt(raw.substring(1)) || 0);
                  else if (raw.startsWith('-'))
                    newValue = currency - (parseInt(raw.substring(1)) || 0);
                  else newValue = parseInt(raw) || 0;
                  newValue = Math.max(0, newValue);
                  setCurrencyInput(String(newValue));
                  onCurrencyChange?.(newValue);
                }
              }}
              className="w-20 rounded border border-currency-border bg-surface px-2 py-1 text-sm font-bold text-warning-fg focus:ring-2 focus:ring-currency-border"
              title="Use +5, -10, or a number"
              aria-label="Currency"
            />
            <span className="text-sm font-medium text-text-muted">Currency</span>
          </div>
          {martialProficiency !== undefined && (
            <>
              <div
                aria-hidden="true"
                className="mx-2 hidden h-6 w-px shrink-0 self-center bg-border-light sm:block"
              />
              <div className="flex min-w-0 items-center sm:flex-1 sm:justify-end">
                <SummaryItem
                  icon="⚔️"
                  label="Armament Proficiency"
                  labelAccessory={
                    <InfoTippy
                      content={armamentProficiencyHelp}
                      label="About Armament Proficiency"
                    />
                  }
                  value={`${calculateArmamentProficiency(martialProficiency)} TP`}
                  highlight
                  highlightColor="warning"
                />
              </div>
            </>
          )}
        </div>
      </TabSummarySection>

      <WeaponsListSection
        layout="characterSheet"
        items={weaponRows}
        onAdd={onAddWeapon}
        addLabel="Add weapon"
        sortState={weaponSort}
        onSort={onWeaponSort}
        rowChrome={{
          leftSlot: true,
          delete: !!(showLibraryEditControls && onRemoveWeapon),
        }}
        emptyMessage="No weapons (see Unarmed Prowess in Archetype section)"
        collapsible
      />

      <ShieldsListSection
        layout="characterSheet"
        items={shieldRows}
        onAdd={onAddShield}
        addLabel="Add shield"
        sortState={shieldSort}
        onSort={onShieldSort}
        rowChrome={{
          leftSlot: true,
          delete: !!(showLibraryEditControls && onRemoveShield),
        }}
        collapsible
      />

      <ArmorListSection
        layout="characterSheet"
        items={armorRows}
        onAdd={onAddArmor}
        addLabel="Add armor"
        sortState={armorSort}
        onSort={onArmorSort}
        rowChrome={{
          leftSlot: true,
          delete: !!(showLibraryEditControls && onRemoveArmor),
        }}
        collapsible
      />

      <EquipmentListSection
        layout="characterSheet"
        items={equipmentRows}
        onAdd={onAddEquipment}
        addLabel="Add equipment"
        sortState={equipmentSort}
        onSort={onEquipmentSort}
        rowChrome={{
          delete: !!(showLibraryEditControls && onRemoveEquipment),
        }}
        collapsible
      />
    </div>
  );
}
