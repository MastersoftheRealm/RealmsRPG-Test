/**
 * Library Section
 * ===============
 * Displays character's powers, techniques, equipment, proficiencies, and notes
 * Supports edit mode for adding/removing items
 * Weapons have clickable attack/damage rolls
 *
 * Data + handlers come from CharacterSheetProvider (TASK-667) — public props are chrome only.
 */

'use client';

import { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';
import { NotesTab } from './notes-tab';
import { ProficienciesTab } from './proficiencies-tab';
import { FeatsTab } from './feats-tab';
import {
  EditSectionToggle,
  TechniquesListSection,
  CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
} from '@/components/patterns';
import { Card } from '@/components/ui';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { useCharacterSheet } from './character-sheet-context';
import type { TabType } from './library-tab-config';
import { useLibrarySectionRows } from './use-library-section-rows';
import { useLibraryTabNavigation } from './use-library-tab-navigation';
import { LibraryPowersPanel } from './library-powers-panel';
import { LibraryInventoryPanel } from './library-inventory-panel';
import { buildLibrarySectionData } from './build-library-section-data';
import type { LibrarySectionProps } from './library-section-props';

export type { LibrarySectionProps, SheetLibraryModel } from './library-section-props';

export function LibrarySection({
  activeTab: activeTabProp,
  onActiveTabChange,
  className,
}: LibrarySectionProps) {
  const ctx = useCharacterSheet();
  const {
    character,
    enrichedData,
    isEditMode,
    libraryModel,
    libraryHandlers,
    setAddModalType,
    setFeatModalType,
  } = ctx;

  const data = useMemo(() => {
    if (!libraryModel) return null;
    return buildLibrarySectionData({
      character,
      enrichedData,
      libraryModel,
      handlers: libraryHandlers,
    });
  }, [character, enrichedData, libraryModel, libraryHandlers]);

  const onAddPower = setAddModalType ? () => setAddModalType('power') : undefined;
  const onAddInnatePower = setAddModalType ? () => setAddModalType('innate-power') : undefined;
  const onAddTechnique = setAddModalType ? () => setAddModalType('technique') : undefined;
  const onAddWeapon = setAddModalType ? () => setAddModalType('weapon') : undefined;
  const onAddShield = setAddModalType ? () => setAddModalType('shield') : undefined;
  const onAddArmor = setAddModalType ? () => setAddModalType('armor') : undefined;
  const onAddEquipment = setAddModalType ? () => setAddModalType('equipment') : undefined;
  const onAddArchetypeFeat = setFeatModalType ? () => setFeatModalType('archetype') : undefined;
  const onAddCharacterFeat = setFeatModalType ? () => setFeatModalType('character') : undefined;
  const onAddStateFeat = setFeatModalType ? () => setFeatModalType('state') : undefined;

  const [isSectionEditing, setIsSectionEditing] = useState(isEditMode);
  const [prevIsEditMode, setPrevIsEditMode] = useState(isEditMode);
  if (isEditMode !== prevIsEditMode) {
    setPrevIsEditMode(isEditMode);
    setIsSectionEditing(isEditMode);
  }

  const showLibraryEditControls = isEditMode && isSectionEditing;
  const archetypeFeatCount = data?.archetypeFeats?.length ?? 0;
  const characterFeatCount = data?.characterFeats?.length ?? 0;
  const archetypeOver =
    data?.maxArchetypeFeats !== undefined && archetypeFeatCount > data.maxArchetypeFeats;
  const characterOver =
    data?.maxCharacterFeats !== undefined && characterFeatCount > data.maxCharacterFeats;
  const libraryEditState = archetypeOver || characterOver ? 'over-budget' : 'normal';

  const { resolvedActiveTab, setActiveTab, navigationTabs } = useLibraryTabNavigation({
    isEditMode,
    activeTabProp,
    onActiveTabChange,
    tabVisibility: data?.tabVisibility,
    onTabVisibilityChange: data?.onTabVisibilityChange,
    onAddPowerProp: onAddPower,
    onAddTechniqueProp: onAddTechnique,
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
    powers: data?.powers ?? [],
    techniques: data?.techniques ?? [],
    weapons: data?.weapons ?? [],
    shields: data?.shields ?? [],
    armor: data?.armor ?? [],
    equipment: data?.equipment ?? [],
    innateEnergy: data?.innateEnergy ?? 0,
    currentInnateEnergy: data?.currentInnateEnergy,
    currentEnergy: data?.currentEnergy ?? 0,
    abilities: data?.abilities,
    powerAttackBonus: data?.powerAttackBonus,
    martialProficiency: data?.martialProficiency,
    powerPartsDb: data?.powerPartsDb ?? [],
    techniquePartsDb: data?.techniquePartsDb ?? [],
    itemPropertiesDb: data?.itemPropertiesDb ?? [],
    proficiencies: data?.proficiencies ?? [],
    showLibraryEditControls,
    onUsePower: data?.onUsePower,
    onRemovePower: data?.onRemovePower,
    onTogglePowerInnate: data?.onTogglePowerInnate,
    onUseTechnique: data?.onUseTechnique,
    onRemoveTechnique: data?.onRemoveTechnique,
    onRemoveWeapon: data?.onRemoveWeapon,
    onToggleEquipWeapon: data?.onToggleEquipWeapon,
    onRemoveShield: data?.onRemoveShield,
    onToggleEquipShield: data?.onToggleEquipShield,
    onRemoveArmor: data?.onRemoveArmor,
    onToggleEquipArmor: data?.onToggleEquipArmor,
    onRemoveEquipment: data?.onRemoveEquipment,
    onEquipmentQuantityChange: data?.onEquipmentQuantityChange,
  });

  if (!data) return null;

  const {
    powers,
    techniques,
    weapons,
    shields = [],
    armor,
    currency = 0,
    innateEnergy = 0,
    innateThreshold = 0,
    innatePools = 0,
    onRemoveTechnique,
    onRemoveWeapon,
    onRemoveShield,
    onRemoveArmor,
    onRemoveEquipment,
    onCurrencyChange,
    visibility = 'private',
    onVisibilityChange,
    speedDisplayUnit = 'spaces',
    weight = 70,
    height = 170,
    appearance = '',
    archetypeDesc = '',
    notes = '',
    abilities,
    onWeightChange,
    onHeightChange,
    onAppearanceChange,
    onArchetypeDescChange,
    onNotesChange,
    namedNotes,
    onAddNote,
    onUpdateNote,
    onDeleteNote,
    level = 1,
    archetypeAbility = 0,
    powerPartsDb = [],
    techniquePartsDb = [],
    itemPropertiesDb = [],
    proficiencies = [],
    onProficienciesChange,
    unarmedProwess = 0,
    onUnarmedProwessChange,
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
  } = data;

  return (
    <Card className={cn('relative flex flex-col p-4 shadow-md md:p-6', className)}>
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

      <div className={cn('mb-4', isEditMode && 'pr-10')}>
        <h2 className="text-lg font-bold text-text-primary">Library</h2>
      </div>

      <TabNavigation
        tabs={navigationTabs}
        activeTab={resolvedActiveTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        variant="underline"
        size="md"
        className="mb-4"
      />

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto">
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
            martialProficiency={data.martialProficiency}
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
          <p className="py-4 text-center text-sm text-text-muted italic">
            Character abilities not loaded
          </p>
        )}
      </div>
    </Card>
  );
}
