/**
 * Inventory tab body for LibrarySection (currency/armament + item list sections).
 */

'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
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
import { formatGroupedInteger } from '@/lib/utils/number';
import { currencyDraftOnBlur, currencyDraftOnEnter } from './currency-field-commit';
import type {
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
} from '@/components/patterns/list/entity-library-sections';
import type { CharacterLibrarySectionId } from '@/types';
import { librarySectionVisibleOutsideEdit } from '@/lib/character-library-section-visibility';
import { LibrarySectionVisibilityToggle } from './library-section-visibility-toggle';
import { cn } from '@/lib/utils';

export type LibraryInventoryPanelProps = {
  currency: number;
  onCurrencyChange?: ((value: number) => void) | undefined;
  martialProficiency?: number | undefined;
  showLibraryEditControls: boolean;
  isEditMode?: boolean | undefined;
  sectionVisibility?: Partial<Record<CharacterLibrarySectionId, boolean>> | undefined;
  onSectionVisibilityChange?:
    | ((next: Partial<Record<CharacterLibrarySectionId, boolean>>) => void)
    | undefined;
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
  isEditMode = false,
  sectionVisibility,
  onSectionVisibilityChange,
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
  const [currencyInput, setCurrencyInput] = useState(String(currency));
  const [isEditing, setIsEditing] = useState(false);
  const editedRef = useRef(false);
  const shownCurrency = isEditing ? currencyInput : formatGroupedInteger(currency);
  const currencyValueCh = Math.max(3, shownCurrency.replace(/^-/, '').length);

  useEffect(() => {
    if (!editedRef.current) setCurrencyInput(String(currency));
  }, [currency]);

  const handleCurrencyFocus = () => {
    editedRef.current = false;
    setCurrencyInput(String(currency));
    setIsEditing(true);
  };

  const sectionToggle = (sectionId: CharacterLibrarySectionId) =>
    isEditMode ? (
      <LibrarySectionVisibilityToggle
        sectionId={sectionId}
        sectionVisibility={sectionVisibility}
        onSectionVisibilityChange={onSectionVisibilityChange}
      />
    ) : undefined;

  const wrapSection = (sectionId: 'weapons' | 'shields' | 'armor', content: ReactNode) => {
    const visibleOutsideEdit = librarySectionVisibleOutsideEdit(sectionId, sectionVisibility);
    if (!isEditMode && !visibleOutsideEdit) return null;
    return (
      <div
        className={cn(isEditMode && !visibleOutsideEdit && 'opacity-60')}
        data-library-section={sectionId}
      >
        {content}
      </div>
    );
  };

  const handleCurrencyBlur = () => {
    const result = currencyDraftOnBlur({
      draft: currencyInput,
      currency,
      edited: editedRef.current,
    });
    editedRef.current = false;
    setIsEditing(false);
    setCurrencyInput(result.display);
    if (result.save != null) onCurrencyChange?.(result.save);
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
              size={currencyValueCh}
              value={shownCurrency}
              onChange={(e) => {
                editedRef.current = true;
                setCurrencyInput(e.target.value);
              }}
              onFocus={handleCurrencyFocus}
              onBlur={handleCurrencyBlur}
              onKeyDown={(e) => {
                if (e.key !== 'Enter') return;
                const result = currencyDraftOnEnter({
                  draft: currencyInput,
                  currency,
                  edited: editedRef.current,
                });
                editedRef.current = false;
                setCurrencyInput(result.display);
                if (result.save != null) onCurrencyChange?.(result.save);
              }}
              className="max-w-[14ch] min-w-[3ch] shrink-0 rounded border border-currency-border bg-surface px-2 py-1 text-sm font-bold text-warning-fg tabular-nums focus:ring-2 focus:ring-currency-border"
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

      {wrapSection(
        'weapons',
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
          expandedWhenEmpty
          headerRightContent={sectionToggle('weapons')}
        />,
      )}

      {wrapSection(
        'shields',
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
          expandedWhenEmpty
          headerRightContent={sectionToggle('shields')}
        />,
      )}

      {wrapSection(
        'armor',
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
          expandedWhenEmpty
          headerRightContent={sectionToggle('armor')}
        />,
      )}

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
