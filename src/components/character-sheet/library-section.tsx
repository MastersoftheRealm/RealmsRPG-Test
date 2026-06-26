/**
 * Library Section
 * ===============
 * Displays character's powers, techniques, equipment, proficiencies, and notes
 * Supports edit mode for adding/removing items
 * Weapons have clickable attack/damage rolls
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import { NotesTab, type CharacterNote } from './notes-tab';
import { ProficienciesTab } from './proficiencies-tab';
import { FeatsTab } from './feats-tab';
import {
  EditSectionToggle,
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  PowersListSection,
  TechniquesListSection,
  WeaponsListSection,
  ShieldsListSection,
  ArmorListSection,
  EquipmentListSection,
  type SortState,
} from '@/components/shared';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import { IconButton } from '@/components/ui';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { calculateArmamentProficiency, calculateRemainingInnateEnergy } from '@/lib/game/formulas';
import type {
  CharacterPower,
  CharacterTechnique,
  Item,
  Abilities,
  CharacterProficiency,
  CharacterLibraryTabId,
} from '@/types';
import { buildRequiredProficiencies, getMissingRequiredProficiencies } from '@/lib/proficiencies';
import { useCharacterSheetOptional } from './character-sheet-context';
import {
  mapPowerRows,
  mapTechniqueRows,
  mapWeaponRows,
  mapShieldRows,
  mapArmorRows,
  mapEquipmentRows,
  type LibraryEntityRowContext,
} from './library-entity-rows';


export interface LibrarySectionProps {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  shields: Item[];
  armor: Item[];
  equipment: Item[];
  currency?: number;
  innateEnergy?: number;
  innateThreshold?: number; // Innate energy threshold per pool
  innatePools?: number; // Number of innate pools
  currentInnateEnergy?: number; // Optional override; default = max minus innate power costs
  currentEnergy?: number; // Current energy for use button validation
  isEditMode?: boolean;
  // Power/Technique/Equipment callbacks
  onAddPower?: () => void;
  onRemovePower?: (id: string | number) => void;
  onTogglePowerInnate?: (id: string | number, isInnate: boolean) => void;
  onUsePower?: (id: string | number, energyCost: number) => void;
  onAddTechnique?: () => void;
  onRemoveTechnique?: (id: string | number) => void;
  onUseTechnique?: (id: string | number, energyCost: number) => void;
  onAddWeapon?: () => void;
  onRemoveWeapon?: (id: string | number) => void;
  onToggleEquipWeapon?: (id: string | number) => void;
  onAddShield?: () => void;
  onRemoveShield?: (id: string | number) => void;
  onToggleEquipShield?: (id: string | number) => void;
  onAddArmor?: () => void;
  onRemoveArmor?: (id: string | number) => void;
  onToggleEquipArmor?: (id: string | number) => void;
  onAddEquipment?: () => void;
  onRemoveEquipment?: (id: string | number) => void;
  onEquipmentQuantityChange?: (id: string | number, delta: number) => void;
  onCurrencyChange?: (value: number) => void;
  // Notes tab props
  visibility?: 'private' | 'campaign' | 'public';
  onVisibilityChange?: (value: 'private' | 'campaign' | 'public') => void;
  /** Speed display unit for movement (Jump, Climb, Swim) in Notes tab */
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters';
  weight?: number;
  height?: number;
  appearance?: string;
  archetypeDesc?: string;
  notes?: string;
  abilities?: Abilities;
  /** Power Attack Bonus (power ability + power proficiency) for power damage rolls */
  powerAttackBonus?: number;
  onWeightChange?: (value: number) => void;
  onHeightChange?: (value: number) => void;
  onAppearanceChange?: (value: string) => void;
  onArchetypeDescChange?: (value: string) => void;
  onNotesChange?: (value: string) => void;
  // Named notes (custom notes)
  namedNotes?: CharacterNote[];
  onAddNote?: () => void;
  onUpdateNote?: (id: string, updates: Partial<CharacterNote>) => void;
  onDeleteNote?: (id: string) => void;
  // Proficiencies tab props
  level?: number;
  archetypeAbility?: number;
  martialProficiency?: number; // For armament proficiency display
  // Codex parts data for enrichment (descriptions, TP costs)
  powerPartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  techniquePartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  itemPropertiesDb?: Array<{ id: string | number; name: string; description?: string; base_tp?: number; tp_cost?: number }>;
  proficiencies?: CharacterProficiency[];
  onProficienciesChange?: (next: CharacterProficiency[]) => void;
  unarmedProwess?: number;
  onUnarmedProwessChange?: (level: number) => void;
  tabVisibility?: Partial<Record<TabType, boolean>>;
  onTabVisibilityChange?: (next: Partial<Record<TabType, boolean>>) => void;
  // Feats tab props
  ancestry?: {
    selectedTraits?: string[];
    selectedFlaw?: string | null;
    selectedCharacteristic?: string | null;
  };
  // Vanilla site trait fields (stored at top level)
  vanillaTraits?: {
    ancestryTraits?: string[];
    flawTrait?: string | null;
    characteristicTrait?: string | null;
    speciesTraits?: string[];
  };
  // Species traits from Codex species data (automatically granted based on species)
  speciesTraitsFromCodex?: string[];
  traitsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    uses_per_rec?: number;
    rec_period?: string;
  }>;
  traitUses?: Record<string, number>;
  archetypeFeats?: Array<{
    id?: string | number;
    name: string;
    description?: string;
    maxUses?: number;
    currentUses?: number;
    recovery?: string;
    customName?: string;
    note?: string;
  }>;
  characterFeats?: Array<{
    id?: string | number;
    name: string;
    description?: string;
    maxUses?: number;
    currentUses?: number;
    recovery?: string;
    customName?: string;
    note?: string;
  }>;
  featsDb?: Array<{
    id: string;
    name: string;
    description?: string;
    effect?: string;
    max_uses?: number;
    rec_period?: string;
    category?: string;
  }>;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onFeatLevelChange?: (featId: string, targetLevel: number, listType: 'archetype' | 'character') => void;
  featRequirementCharacter?: import('@/lib/game/feat-requirements').CharacterForFeatRequirement;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
  onAddStateFeat?: () => void;
  onRemoveFeat?: (featId: string) => void;
  traitCustomizations?: Record<string, import('@/types/feats').FeatTraitCustomization>;
  onFeatCustomizationChange?: (
    featId: string,
    listType: 'archetype' | 'character',
    updates: Partial<import('@/types/feats').FeatTraitCustomization>
  ) => void;
  onTraitCustomizationChange?: (
    traitKey: string,
    updates: Partial<import('@/types/feats').FeatTraitCustomization>
  ) => void;
  /** State uses (current/max per recovery; max = proficiency). Restored on full recovery. */
  stateFeats?: Array<{ id?: string | number; name: string; description?: string; maxUses?: number; currentUses?: number; recovery?: string; type?: 'archetype' | 'character' }>;
  stateUsesCurrent?: number;
  stateUsesMax?: number;
  onStateUsesChange?: (delta: number) => void;
  onEnterState?: () => void;
  /** Max archetype feats (for overspend indicator and current/max display) */
  maxArchetypeFeats?: number;
  /** Max character feats (for overspend indicator and current/max display) */
  maxCharacterFeats?: number;
  /** Controlled tab (optional; page context owns tab when provided) */
  activeTab?: TabType;
  onActiveTabChange?: (tab: TabType) => void;
  className?: string;
}

type TabType = CharacterLibraryTabId;

const DEFAULT_TAB_VISIBILITY: Record<TabType, boolean> = {
  feats: true,
  powers: true,
  techniques: true,
  inventory: true,
  proficiencies: true,
  notes: true,
};

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
  const onAddPower = onAddPowerProp ?? (ctx ? () => ctx.setAddModalType('power') : undefined);
  const onAddInnatePower = ctx ? () => ctx.setAddModalType('innate-power') : undefined;
  const onAddTechnique = onAddTechniqueProp ?? (ctx ? () => ctx.setAddModalType('technique') : undefined);
  const onAddWeapon = onAddWeaponProp ?? (ctx ? () => ctx.setAddModalType('weapon') : undefined);
  const onAddShield = onAddShieldProp ?? (ctx ? () => ctx.setAddModalType('shield') : undefined);
  const onAddArmor = onAddArmorProp ?? (ctx ? () => ctx.setAddModalType('armor') : undefined);
  const onAddEquipment = onAddEquipmentProp ?? (ctx ? () => ctx.setAddModalType('equipment') : undefined);
  const onAddArchetypeFeat = onAddArchetypeFeatProp ?? (ctx ? () => ctx.setFeatModalType('archetype') : undefined);
  const onAddCharacterFeat = onAddCharacterFeatProp ?? (ctx ? () => ctx.setFeatModalType('character') : undefined);
  const onAddStateFeat = onAddStateFeatProp ?? (ctx ? () => ctx.setFeatModalType('state') : undefined);

  const [internalActiveTab, setInternalActiveTab] = useState<TabType>('feats');
  const activeTab = activeTabProp ?? internalActiveTab;
  const setActiveTab = useCallback(
    (tab: TabType) => {
      onActiveTabChange?.(tab);
      if (activeTabProp === undefined) {
        setInternalActiveTab(tab);
      }
    },
    [activeTabProp, onActiveTabChange]
  );
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  const [currencyInput, setCurrencyInput] = useState(currency.toString());
  const rollContext = useRollsOptional();

  const showLibraryEditControls = isEditMode && isSectionEditing;
  const archetypeFeatCount = archetypeFeats?.length ?? 0;
  const characterFeatCount = characterFeats?.length ?? 0;
  const archetypeOver = maxArchetypeFeats !== undefined && archetypeFeatCount > maxArchetypeFeats;
  const characterOver = maxCharacterFeats !== undefined && characterFeatCount > maxCharacterFeats;
  const libraryEditState = archetypeOver || characterOver ? 'over-budget' : 'normal';
  
  // Sort state for each section
  const [powerSort, setPowerSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [techniqueSort, setTechniqueSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [weaponSort, setWeaponSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [shieldSort, setShieldSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [armorSort, setArmorSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [equipmentSort, setEquipmentSort] = useState<SortState>({ col: 'name', dir: 1 });
  
  const sortedInnatePowers = useMemo(
    () => sortByColumn(powers.filter(p => p.innate === true), powerSort),
    [powers, powerSort]
  );
  const sortedRegularPowers = useMemo(
    () => sortByColumn(powers.filter(p => p.innate !== true), powerSort),
    [powers, powerSort]
  );
  const sortedTechniques = useMemo(
    () => sortByColumn(techniques, techniqueSort),
    [techniques, techniqueSort]
  );
  const sortedWeapons = useMemo(
    () => sortByColumn(weapons, weaponSort),
    [weapons, weaponSort]
  );
  const sortedShields = useMemo(
    () => sortByColumn(shields, shieldSort),
    [shields, shieldSort]
  );
  const sortedArmor = useMemo(
    () => sortByColumn(armor, armorSort),
    [armor, armorSort]
  );
  const sortedEquipment = useMemo(
    () => sortByColumn(equipment, equipmentSort),
    [equipment, equipmentSort]
  );

  const hasMissingForEntry = useCallback((params: { powers?: CharacterPower[]; techniques?: CharacterTechnique[]; weapons?: Item[]; shields?: Item[]; armor?: Item[] }) => {
    const requiredForEntry = buildRequiredProficiencies({
      powers: params.powers || [],
      techniques: params.techniques || [],
      weapons: params.weapons || [],
      shields: params.shields || [],
      armor: params.armor || [],
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
    });
    return getMissingRequiredProficiencies(requiredForEntry, proficiencies).length > 0;
  }, [powerPartsDb, techniquePartsDb, itemPropertiesDb, proficiencies]);

  const entityRowContext = useMemo<LibraryEntityRowContext>(
    () => ({
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
      abilities,
      powerAttackBonus,
      martialProficiency,
      currentEnergy,
      showLibraryEditControls,
      rollContext,
      hasMissingForEntry,
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
    }),
    [
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
      abilities,
      powerAttackBonus,
      martialProficiency,
      currentEnergy,
      showLibraryEditControls,
      rollContext,
      hasMissingForEntry,
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
    ]
  );

  const powerRowChrome = useMemo(
    () => ({
      leftSlot: !!(showLibraryEditControls && onTogglePowerInnate),
      rightSlot: true,
      delete: !!(showLibraryEditControls && onRemovePower),
    }),
    [showLibraryEditControls, onTogglePowerInnate, onRemovePower]
  );

  const innatePowerRows = useMemo(
    () => mapPowerRows(sortedInnatePowers, entityRowContext),
    [sortedInnatePowers, entityRowContext]
  );
  const displayedCurrentInnateEnergy = useMemo(
    () =>
      currentInnateEnergy !== undefined
        ? currentInnateEnergy
        : calculateRemainingInnateEnergy(innateEnergy, powers),
    [currentInnateEnergy, innateEnergy, powers]
  );
  const innateEnergyOverBudget = displayedCurrentInnateEnergy < 0;
  const regularPowerRows = useMemo(
    () => mapPowerRows(sortedRegularPowers, entityRowContext),
    [sortedRegularPowers, entityRowContext]
  );
  const techniqueRows = useMemo(
    () => mapTechniqueRows(sortedTechniques, entityRowContext),
    [sortedTechniques, entityRowContext]
  );
  const weaponRows = useMemo(
    () => mapWeaponRows(sortedWeapons, entityRowContext),
    [sortedWeapons, entityRowContext]
  );
  const shieldRows = useMemo(
    () => mapShieldRows(sortedShields, entityRowContext),
    [sortedShields, entityRowContext]
  );
  const armorRows = useMemo(
    () => mapArmorRows(sortedArmor, entityRowContext),
    [sortedArmor, entityRowContext]
  );
  const equipmentRows = useMemo(
    () => mapEquipmentRows(sortedEquipment, entityRowContext),
    [sortedEquipment, entityRowContext]
  );

  // NOTE: Unarmed Prowess is now shown in the Archetype section, not here

  const tabs: { id: TabType; label: string; onAdd?: () => void }[] = [
    { id: 'feats', label: 'Feats' },
    { id: 'powers', label: 'Powers', onAdd: onAddPower },
    { id: 'techniques', label: 'Techniques', onAdd: onAddTechnique },
    { id: 'inventory', label: 'Inventory' },
    { id: 'proficiencies', label: 'Proficiencies' },
    { id: 'notes', label: 'Notes' },
  ];

  const resolvedTabVisibility = useMemo<Record<TabType, boolean>>(
    () => ({ ...DEFAULT_TAB_VISIBILITY, ...(tabVisibility ?? {}) }),
    [tabVisibility]
  );

  const visibleTabs = useMemo(
    () => (isEditMode ? tabs : tabs.filter((tab) => resolvedTabVisibility[tab.id] !== false)),
    [isEditMode, tabs, resolvedTabVisibility]
  );

  useEffect(() => {
    if (isEditMode) {
      setIsSectionEditing(true);
      return;
    }
    setIsSectionEditing(false);
  }, [isEditMode]);

  useEffect(() => {
    if (visibleTabs.some((tab) => tab.id === activeTab)) return;
    const fallback = visibleTabs[0]?.id ?? 'feats';
    setActiveTab(fallback);
  }, [activeTab, visibleTabs]);

  const handleToggleTabVisibility = useCallback((tabId: TabType) => {
    if (!onTabVisibilityChange) return;
    const current = resolvedTabVisibility[tabId] !== false;
    if (current) {
      const currentlyVisibleCount = Object.values(resolvedTabVisibility).filter((v) => v !== false).length;
      if (currentlyVisibleCount <= 1) return;
    }
    onTabVisibilityChange({
      ...resolvedTabVisibility,
      [tabId]: !current,
    });
  }, [onTabVisibilityChange, resolvedTabVisibility]);

  const navigationTabs = useMemo(() => {
    const source = isEditMode ? tabs : visibleTabs;
    return source.map((tab) => {
      const visibleOutsideEdit = resolvedTabVisibility[tab.id] !== false;
      return {
        id: tab.id,
        label: tab.label,
        dimmed: isEditMode && !visibleOutsideEdit,
        suffix:
          isEditMode && onTabVisibilityChange ? (
            <IconButton
              variant="ghost"
              size="sm"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleToggleTabVisibility(tab.id);
              }}
              label={`${visibleOutsideEdit ? 'Hide' : 'Show'} ${tab.label} tab when not editing`}
              className="min-h-[44px] min-w-[44px] shrink-0 -mr-1"
            >
              {visibleOutsideEdit ? (
                <Eye className="w-4 h-4" />
              ) : (
                <EyeOff className="w-4 h-4 text-text-muted dark:text-text-secondary" />
              )}
            </IconButton>
          ) : undefined,
      };
    });
  }, [
    isEditMode,
    tabs,
    visibleTabs,
    resolvedTabVisibility,
    onTabVisibilityChange,
    handleToggleTabVisibility,
  ]);

  const handleCurrencyBlur = () => {
    const value = parseInt(currencyInput) || 0;
    if (value !== currency && onCurrencyChange) {
      onCurrencyChange(value);
    }
  };

  return (
    <div className={cn("bg-surface rounded-xl shadow-md p-4 md:p-6 relative flex flex-col", className)}>
      {/* Edit Mode Indicator - Pencil toggles library in/out of edit (like other sections) */}
      {isEditMode && (
        <div className="absolute top-3 right-3">
          <EditSectionToggle 
            state={libraryEditState}
            isActive={isSectionEditing}
            onClick={() => setIsSectionEditing(prev => !prev)}
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
      
      {/* Tabs */}
      <TabNavigation
        tabs={navigationTabs}
        activeTab={activeTab}
        onTabChange={(tabId) => setActiveTab(tabId as TabType)}
        variant="underline"
        size="md"
        className="mb-4"
      />

      {/* Content */}
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'powers' && (
          <>
            {/* Innate Energy Summary */}
            {innateEnergy > 0 && (
              <TabSummarySection variant="power">
                <SummaryRow>
                  <SummaryItem 
                    icon="✨" 
                    label="Innate Energy" 
                    value={`${displayedCurrentInnateEnergy} / ${innateEnergy}`}
                    highlight
                    highlightColor={innateEnergyOverBudget ? 'danger' : 'power'}
                  />
                  <SummaryItem 
                    label="Threshold" 
                    value={innateThreshold}
                  />
                  <SummaryItem 
                    label="Pools" 
                    value={innatePools}
                  />
                </SummaryRow>
                <p className="text-xs text-text-muted dark:text-text-secondary mt-1 text-center">
                  Innate powers have no cost to use. You may have powers with energy costs up to your innate energy.
                </p>
              </TabSummarySection>
            )}

                        <div className="mb-4">
              <PowersListSection
                title="Innate Powers"
                items={innatePowerRows}
                onAdd={onAddInnatePower}
                addLabel="Add innate power"
                sortState={powerSort}
                onSort={(col) => setPowerSort(toggleSort(powerSort, col))}
                rowChrome={powerRowChrome}
                emptyMessage="No innate powers. Enter edit mode (click the pencil) to mark powers as innate."
              />
            </div>

            <PowersListSection
              title="Powers"
              items={regularPowerRows}
              onAdd={onAddPower}
              addLabel="Add power"
              sortState={powerSort}
              onSort={(col) => setPowerSort(toggleSort(powerSort, col))}
              rowChrome={powerRowChrome}
              emptyMessage="No powers learned"
            />
          </>
        )}

        {activeTab === 'techniques' && (
          <>
            <TechniquesListSection
              items={techniqueRows}
              onAdd={onAddTechnique}
              addLabel="Add technique"
              includeActionColumn
              sortState={techniqueSort}
              onSort={(col) => setTechniqueSort(toggleSort(techniqueSort, col))}
              rowChrome={{
                rightSlot: true,
                delete: !!(showLibraryEditControls && onRemoveTechnique),
              }}
              emptyMessage="No techniques learned"
            />
          </>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Inventory Summary: Currency */}
            <TabSummarySection variant="currency">
              <SummaryRow>
                <div className="flex items-center gap-2">
                  <span className="text-sm">💰</span>
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
                        else if (raw.startsWith('-')) newValue = currency - (parseInt(raw.substring(1)) || 0);
                        else newValue = parseInt(raw) || 0;
                        newValue = Math.max(0, newValue);
                        setCurrencyInput(String(newValue));
                        onCurrencyChange?.(newValue);
                      }
                    }}
                    className="w-20 px-2 py-1 text-sm font-bold text-warning-600 dark:text-warning-400 border border-warning-300 dark:border-warning-600/50 rounded focus:ring-2 focus:ring-warning-500 bg-white dark:bg-surface"
                    title="Use +5, -10, or a number"
                  />
                  <span className="text-sm font-medium text-text-muted dark:text-text-secondary">Currency</span>
                </div>
              </SummaryRow>
              {martialProficiency !== undefined && (
                <>
                  <div className="border-t border-border-light my-2" />
                  <SummaryRow>
                    <SummaryItem 
                      icon="⚔️" 
                      label="Armament Proficiency" 
                      value={`${calculateArmamentProficiency(martialProficiency)} TP`}
                      highlight
                      highlightColor="warning"
                    />
                  </SummaryRow>
                </>
              )}
            </TabSummarySection>

            <WeaponsListSection
              layout="characterSheet"
              items={weaponRows}
              onAdd={onAddWeapon}
              addLabel="Add weapon"
              sortState={weaponSort}
              onSort={(col) => setWeaponSort(toggleSort(weaponSort, col))}
              rowChrome={{
                leftSlot: true,
                delete: !!(showLibraryEditControls && onRemoveWeapon),
              }}
              emptyMessage="No weapons (see Unarmed Prowess in Archetype section)"
            />

            <ShieldsListSection
              layout="characterSheet"
              items={shieldRows}
              onAdd={onAddShield}
              addLabel="Add shield"
              sortState={shieldSort}
              onSort={(col) => setShieldSort(toggleSort(shieldSort, col))}
              rowChrome={{
                leftSlot: true,
                delete: !!(showLibraryEditControls && onRemoveShield),
              }}
            />

            <ArmorListSection
              layout="characterSheet"
              items={armorRows}
              onAdd={onAddArmor}
              addLabel="Add armor"
              sortState={armorSort}
              onSort={(col) => setArmorSort(toggleSort(armorSort, col))}
              rowChrome={{
                leftSlot: true,
                delete: !!(showLibraryEditControls && onRemoveArmor),
              }}
            />

            <EquipmentListSection
              layout="characterSheet"
              items={equipmentRows}
              onAdd={onAddEquipment}
              addLabel="Add equipment"
              sortState={equipmentSort}
              onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
              rowChrome={{
                delete: !!(showLibraryEditControls && onRemoveEquipment),
              }}
            />

          </div>
        )}

        {activeTab === 'feats' && (
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

        {activeTab === 'proficiencies' && (
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

        {activeTab === 'notes' && abilities && (
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

        {activeTab === 'notes' && !abilities && (
          <p className="text-text-muted dark:text-text-secondary text-sm italic text-center py-4">
            Character abilities not loaded
          </p>
        )}
      </div>
    </div>
  );
}
