/**
 * Library Section
 * ===============
 * Displays character's powers, techniques, equipment, proficiencies, and notes
 * Supports edit mode for adding/removing items
 * Weapons have clickable attack/damage rolls
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { NotesTab } from './notes-tab';
import { ProficienciesTab } from './proficiencies-tab';
import { FeatsTab } from './feats-tab';
import {
  EditSectionToggle,
  TechniquesListSection,
  CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
} from '@/components/shared';
import { Card } from '@/components/ui';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { useCharacterSheetOptional } from './character-sheet-context';
import type { TabType } from './library-tab-config';
import { useLibrarySectionRows } from './use-library-section-rows';
import { useLibraryTabNavigation } from './use-library-tab-navigation';
import { LibraryPowersPanel } from './library-powers-panel';
import { LibraryInventoryPanel } from './library-inventory-panel';
import type { LibrarySectionProps } from './library-section-props';

export type { LibrarySectionProps };

export function LibrarySection({
  powers,
  techniques,
  weapons,
  shields = [],
  armor,
  equipment,
  currency = 0,
  innateEnergy = 0,
  innateThreshold = 0,
  innatePools = 0,
  currentInnateEnergy,
  currentEnergy = 0,
  isEditMode: isEditModeProp = false,
  onAddPower: onAddPowerProp,
  onRemovePower,
  onTogglePowerInnate,
  onUsePower,
  onAddTechnique: onAddTechniqueProp,
  onRemoveTechnique,
  onUseTechnique,
  onAddWeapon: onAddWeaponProp,
  onRemoveWeapon,
  onToggleEquipWeapon,
  onAddShield: onAddShieldProp,
  onRemoveShield,
  onToggleEquipShield,
  onAddArmor: onAddArmorProp,
  onRemoveArmor,
  onToggleEquipArmor,
  onAddEquipment: onAddEquipmentProp,
  onRemoveEquipment,
  onEquipmentQuantityChange,
  onCurrencyChange,
  // Notes props
  visibility = 'private',
  onVisibilityChange,
  speedDisplayUnit = 'spaces',
  weight = 70,
  height = 170,
  appearance = '',
  archetypeDesc = '',
  notes = '',
  abilities,
  powerAttackBonus,
  onWeightChange,
  onHeightChange,
  onAppearanceChange,
  onArchetypeDescChange,
  onNotesChange,
  // Custom notes props
  namedNotes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  // Proficiencies props
  level = 1,
  archetypeAbility = 0,
  martialProficiency,
  powerPartsDb = [],
  techniquePartsDb = [],
  itemPropertiesDb = [],
  proficiencies = [],
  onProficienciesChange,
  unarmedProwess = 0,
  onUnarmedProwessChange,
  tabVisibility,
  onTabVisibilityChange,
  // Feats props
  ancestry,
  vanillaTraits,
  speciesTraitsFromCodex = [],
  traitsDb = [],
  featsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  onFeatUsesChange,
  onFeatLevelChange,
  featRequirementCharacter,
  onTraitUsesChange,
  onAddArchetypeFeat: onAddArchetypeFeatProp,
  onAddCharacterFeat: onAddCharacterFeatProp,
  onAddStateFeat: onAddStateFeatProp,
  onRemoveFeat,
  traitCustomizations = {},
  onFeatCustomizationChange,
  onTraitCustomizationChange,
  stateFeats = [],
  stateUsesCurrent,
  stateUsesMax,
  onStateUsesChange,
  onEnterState,
  maxArchetypeFeats,
  maxCharacterFeats,
  activeTab: activeTabProp,
  onActiveTabChange,
  className,
}: LibrarySectionProps) {
  const ctx = useCharacterSheetOptional();
  const isEditMode = ctx?.isEditMode ?? isEditModeProp;
  const setAddModalType = ctx?.setAddModalType;
  const setFeatModalType = ctx?.setFeatModalType;
  const onAddPower = onAddPowerProp ?? (setAddModalType ? () => setAddModalType('power') : undefined);
  const onAddInnatePower = setAddModalType ? () => setAddModalType('innate-power') : undefined;
  const onAddTechnique = onAddTechniqueProp ?? (setAddModalType ? () => setAddModalType('technique') : undefined);
  const onAddWeapon = onAddWeaponProp ?? (setAddModalType ? () => setAddModalType('weapon') : undefined);
  const onAddShield = onAddShieldProp ?? (setAddModalType ? () => setAddModalType('shield') : undefined);
  const onAddArmor = onAddArmorProp ?? (setAddModalType ? () => setAddModalType('armor') : undefined);
  const onAddEquipment = onAddEquipmentProp ?? (setAddModalType ? () => setAddModalType('equipment') : undefined);
  const onAddArchetypeFeat = onAddArchetypeFeatProp ?? (setFeatModalType ? () => setFeatModalType('archetype') : undefined);
  const onAddCharacterFeat = onAddCharacterFeatProp ?? (setFeatModalType ? () => setFeatModalType('character') : undefined);
  const onAddStateFeat = onAddStateFeatProp ?? (setFeatModalType ? () => setFeatModalType('state') : undefined);

  const [isSectionEditing, setIsSectionEditing] = useState(isEditMode);
  const [prevIsEditMode, setPrevIsEditMode] = useState(isEditMode);
  if (isEditMode !== prevIsEditMode) {
    setPrevIsEditMode(isEditMode);
    setIsSectionEditing(isEditMode);
  }

  const showLibraryEditControls = isEditMode && isSectionEditing;
  const archetypeFeatCount = archetypeFeats?.length ?? 0;
  const characterFeatCount = characterFeats?.length ?? 0;
  const archetypeOver = maxArchetypeFeats !== undefined && archetypeFeatCount > maxArchetypeFeats;
  const characterOver = maxCharacterFeats !== undefined && characterFeatCount > maxCharacterFeats;
  const libraryEditState = archetypeOver || characterOver ? 'over-budget' : 'normal';

  const { resolvedActiveTab, setActiveTab, navigationTabs } = useLibraryTabNavigation({
    isEditMode,
    activeTabProp,
    onActiveTabChange,
    tabVisibility,
    onTabVisibilityChange,
    onAddPowerProp,
    onAddTechniqueProp,
    setAddModalType,
  });

  const {
    powerSort,
    techniqueSort,
    weaponSort,
    shieldSort,
    armorSort,
    equipmentSort,
    handlePowerSort,
    handleTechniqueSort,
    handleWeaponSort,
    handleShieldSort,
    handleArmorSort,
    handleEquipmentSort,
    powerRowChrome,
    innatePowerRows,
    regularPowerRows,
    techniqueRows,
    weaponRows,
    shieldRows,
    armorRows,
    equipmentRows,
    displayedCurrentInnateEnergy,
    innateEnergyOverBudget,
  } = useLibrarySectionRows({
    powers,
    techniques,
    weapons,
    shields,
    armor,
    equipment,
    innateEnergy,
    currentInnateEnergy,
    currentEnergy,
    abilities,
    powerAttackBonus,
    martialProficiency,
    powerPartsDb,
    techniquePartsDb,
    itemPropertiesDb,
    proficiencies,
    showLibraryEditControls,
    onUsePower,
    onRemovePower,
    onTogglePowerInnate,
    onUseTechnique,
    onRemoveTechnique,
    onRemoveWeapon,
    onToggleEquipWeapon,
    onRemoveShield,
    onToggleEquipShield,
    onRemoveArmor,
    onToggleEquipArmor,
    onRemoveEquipment,
    onEquipmentQuantityChange,
  });

  // NOTE: Unarmed Prowess is now shown in the Archetype section, not here

  return (
    <Card className={cn('shadow-md p-4 md:p-6 relative flex flex-col', className)}>
      {/* Edit Mode Indicator - Pencil toggles library in/out of edit (like other sections) */}
      {isEditMode && (
        <div className="absolute top-3 right-3 z-10">
          <EditSectionToggle
            state={libraryEditState}
            isActive={isSectionEditing}
            onClick={() => setIsSectionEditing((prev) => !prev)}
            title={
              isSectionEditing
                ? 'Click to close library editing'
                : libraryEditState === 'over-budget'
                  ? 'Click to edit library (feats over limit)'
                  : 'Click to edit library (powers, techniques, inventory, feats)'
            }
          />
        </div>
      )}

      {/* Card title — peer of Skills / Archetype & Attacks (DESIGN_SYSTEM sheet section headers) */}
      <div className={cn('mb-4', isEditMode && 'pr-10')}>
        <h2 className="text-lg font-bold text-text-primary">Library</h2>
      </div>

      {/* Tabs */}
      <TabNavigation
        tabs={navigationTabs}
        activeTab={resolvedActiveTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        variant="underline"
        size="md"
        className="mb-4"
      />

      {/* Content */}
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
        {resolvedActiveTab === 'powers' && (
          <LibraryPowersPanel
            innateEnergy={innateEnergy}
            innateThreshold={innateThreshold}
            innatePools={innatePools}
            displayedCurrentInnateEnergy={displayedCurrentInnateEnergy}
            innateEnergyOverBudget={innateEnergyOverBudget}
            innatePowerRows={innatePowerRows}
            regularPowerRows={regularPowerRows}
            powerSort={powerSort}
            onPowerSort={handlePowerSort}
            powerRowChrome={powerRowChrome}
            onAddInnatePower={onAddInnatePower}
            onAddPower={onAddPower}
          />
        )}

        {resolvedActiveTab === 'techniques' && (
          <TechniquesListSection
            items={techniqueRows}
            onAdd={onAddTechnique}
            addLabel="Add technique"
            includeActionColumn
            sortState={techniqueSort}
            onSort={handleTechniqueSort}
            rowChrome={{
              ...CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
              delete: !!(showLibraryEditControls && onRemoveTechnique),
            }}
            emptyMessage="No techniques learned"
          />
        )}

        {resolvedActiveTab === 'inventory' && (
          <LibraryInventoryPanel
            currency={currency}
            onCurrencyChange={onCurrencyChange}
            martialProficiency={martialProficiency}
            showLibraryEditControls={showLibraryEditControls}
            weaponRows={weaponRows}
            shieldRows={shieldRows}
            armorRows={armorRows}
            equipmentRows={equipmentRows}
            weaponSort={weaponSort}
            shieldSort={shieldSort}
            armorSort={armorSort}
            equipmentSort={equipmentSort}
            onWeaponSort={handleWeaponSort}
            onShieldSort={handleShieldSort}
            onArmorSort={handleArmorSort}
            onEquipmentSort={handleEquipmentSort}
            onAddWeapon={onAddWeapon}
            onRemoveWeapon={onRemoveWeapon}
            onAddShield={onAddShield}
            onRemoveShield={onRemoveShield}
            onAddArmor={onAddArmor}
            onRemoveArmor={onRemoveArmor}
            onAddEquipment={onAddEquipment}
            onRemoveEquipment={onRemoveEquipment}
          />
        )}

        {resolvedActiveTab === 'feats' && (
          <FeatsTab
            ancestry={ancestry}
            vanillaTraits={vanillaTraits}
            speciesTraitsFromCodex={speciesTraitsFromCodex}
            traitsDb={traitsDb}
            featsDb={featsDb}
            traitUses={traitUses}
            archetypeFeats={archetypeFeats}
            characterFeats={characterFeats}
            stateFeats={stateFeats}
            stateUsesCurrent={stateUsesCurrent}
            stateUsesMax={stateUsesMax}
            onStateUsesChange={onStateUsesChange}
            onEnterState={onEnterState}
            isEditMode={isEditMode}
            showEditControls={showLibraryEditControls}
            maxArchetypeFeats={maxArchetypeFeats}
            maxCharacterFeats={maxCharacterFeats}
            onFeatUsesChange={onFeatUsesChange}
            onFeatLevelChange={onFeatLevelChange}
            featRequirementCharacter={featRequirementCharacter}
            onTraitUsesChange={onTraitUsesChange}
            onAddArchetypeFeat={onAddArchetypeFeat}
            onAddCharacterFeat={onAddCharacterFeat}
            onAddStateFeat={onAddStateFeat}
            onRemoveFeat={onRemoveFeat}
            traitCustomizations={traitCustomizations}
            onFeatCustomizationChange={onFeatCustomizationChange}
            onTraitCustomizationChange={onTraitCustomizationChange}
          />
        )}

        {resolvedActiveTab === 'proficiencies' && (
          <ProficienciesTab
            powers={powers}
            techniques={techniques}
            weapons={weapons}
            shields={shields}
            armor={armor}
            level={level}
            archetypeAbility={archetypeAbility}
            powerPartsDb={powerPartsDb}
            techniquePartsDb={techniquePartsDb}
            itemPropertiesDb={itemPropertiesDb}
            proficiencies={proficiencies}
            isEditMode={isEditMode}
            onProficienciesChange={onProficienciesChange}
            unarmedProwess={unarmedProwess}
            onUnarmedProwessChange={onUnarmedProwessChange}
          />
        )}

        {resolvedActiveTab === 'notes' && abilities && (
          <NotesTab
            visibility={visibility}
            onVisibilityChange={onVisibilityChange}
            speedDisplayUnit={speedDisplayUnit}
            weight={weight}
            height={height}
            appearance={appearance}
            archetypeDesc={archetypeDesc}
            notes={notes}
            namedNotes={namedNotes}
            abilities={abilities}
            isEditMode={isEditMode}
            onWeightChange={onWeightChange}
            onHeightChange={onHeightChange}
            onAppearanceChange={onAppearanceChange}
            onArchetypeDescChange={onArchetypeDescChange}
            onNotesChange={onNotesChange}
            onAddNote={onAddNote}
            onUpdateNote={onUpdateNote}
            onDeleteNote={onDeleteNote}
          />
        )}

        {resolvedActiveTab === 'notes' && !abilities && (
          <p className="text-text-muted dark:text-text-secondary text-sm italic text-center py-4">
            Character abilities not loaded
          </p>
        )}
      </div>
    </Card>
  );
}
