/**
 * Library Section
 * ===============
 * Displays character's powers, techniques, equipment, proficiencies, and notes
 * Supports edit mode for adding/removing items
 * Weapons have clickable attack/damage rolls
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { Plus, X } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import { NotesTab, type CharacterNote } from './notes-tab';
import { ProficienciesTab } from './proficiencies-tab';
import { FeatsTab } from './feats-tab';
import { 
  PartChipList, 
  type PartData, 
  EditSectionToggle, 
  RollButton, 
  SectionHeader, 
  QuantitySelector, 
  QuantityBadge, 
  GridListRow, 
  SelectionToggle, 
  EquipToggle,
  type ColumnValue, 
  type ChipData,
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  ListHeader,
  type ListColumn,
  type SortState,
  InnateToggle,
} from '@/components/shared';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import { Button, IconButton } from '@/components/ui';
import { TabNavigation } from '@/components/ui/tab-navigation';
import { calculateArmamentProficiency } from '@/lib/game/formulas';
import type { CharacterPower, CharacterTechnique, Item, Abilities } from '@/types';

/** RTDB part data for enrichment */
interface RTDBPart {
  id: string;
  name: string;
  description?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

// Helper to convert power/technique parts to PartData format, with RTDB enrichment
// The saved part data only has option levels - TP costs come from RTDB
function partsToPartData(
  parts?: CharacterPower['parts'] | CharacterTechnique['parts'],
  rtdbParts: RTDBPart[] = []
): PartData[] {
  if (!parts || parts.length === 0) return [];
  
  return parts.map(part => {
    if (typeof part === 'string') {
      // String-only part - look up in RTDB for description and TP
      const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === part.toLowerCase());
      return { 
        name: part,
        description: rtdbPart?.description,
        tpCost: rtdbPart?.base_tp,
      };
    }
    
    // Full part data - look up TP costs from RTDB by id or name
    const partName = part.name || part.id || 'Unknown Part';
    const partId = part.id;
    
    // Try to find RTDB part by id first, then by name
    let rtdbPart = rtdbParts.find(p => partId && String(p.id) === String(partId));
    if (!rtdbPart) {
      rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === partName.toLowerCase());
    }
    
    // Calculate TP cost using RTDB values + saved option levels
    const base_tp = rtdbPart?.base_tp ?? 0;
    const op_1_tp = rtdbPart?.op_1_tp ?? 0;
    const op_2_tp = rtdbPart?.op_2_tp ?? 0;
    const op_3_tp = rtdbPart?.op_3_tp ?? 0;
    
    const tpCost = base_tp + 
                   op_1_tp * (part.op_1_lvl ?? 0) + 
                   op_2_tp * (part.op_2_lvl ?? 0) + 
                   op_3_tp * (part.op_3_lvl ?? 0);
    
    return {
      name: rtdbPart?.name || partName,
      description: rtdbPart?.description,
      tpCost: tpCost > 0 ? tpCost : undefined,
      optionLevels: {
        opt1: part.op_1_lvl,
        opt2: part.op_2_lvl,
        opt3: part.op_3_lvl,
      },
    };
  });
}

/** RTDB property data for enrichment */
interface RTDBProperty {
  id: string | number;
  name: string;
  description?: string;
  base_tp?: number;
  tp_cost?: number;
}

// =============================================================================
// Power/Technique Display Formatters
// =============================================================================

/** Capitalize first letter of each word in a string */
function capitalizeWords(str: string): string {
  return str.replace(/\b\w/g, c => c.toUpperCase());
}

/** Format area/target display: "1 target" → "Target", capitalize others */
function formatArea(area: string | undefined): string {
  if (!area) return '-';
  const lower = area.toLowerCase().trim();
  if (lower === '1 target' || lower === 'single target' || lower === 'target') return 'Target';
  return capitalizeWords(area);
}

/** Format duration display: abbreviate and capitalize, strip focus/sustain details */
function formatDuration(duration: string | undefined): string {
  if (!duration) return '-';
  const lower = duration.toLowerCase().trim();
  
  // Strip parenthetical details like (Focus), (Sustain) for overview
  const withoutParens = lower.replace(/\s*\(.*?\)\s*/g, '').trim();
  
  // Instant/Instantaneous
  if (withoutParens === 'instant' || withoutParens === 'instantaneous') return 'Instant';
  
  // Concentration
  if (withoutParens === 'concentration') return 'Conc.';
  
  // Minutes
  const minMatch = withoutParens.match(/^(\d+)\s*min(ute)?s?$/);
  if (minMatch) return `${minMatch[1]} MIN`;
  
  // Rounds
  const rndMatch = withoutParens.match(/^(\d+)\s*rounds?$/);
  if (rndMatch) return rndMatch[1] === '1' ? '1 RND' : `${rndMatch[1]} RNDS`;
  
  // Hours
  const hrMatch = withoutParens.match(/^(\d+)\s*hours?$/);
  if (hrMatch) return `${hrMatch[1]} HR`;
  
  // Capitalize whatever remains
  return capitalizeWords(withoutParens);
}

/** Format damage type: capitalize */
function formatDamageType(damage: string | undefined): string {
  if (!damage) return '-';
  return capitalizeWords(damage);
}

// Helper to convert item properties to PartData format, with RTDB enrichment
function propertiesToPartData(
  properties?: Item['properties'],
  rtdbProperties: RTDBProperty[] = []
): PartData[] {
  if (!properties || properties.length === 0) return [];
  
  return properties.map(prop => {
    if (typeof prop === 'string') {
      // String-only property - look up in RTDB for description
      const rtdbProp = rtdbProperties.find(p => p.name?.toLowerCase() === prop.toLowerCase());
      return { 
        name: prop,
        description: rtdbProp?.description,
        tpCost: rtdbProp?.base_tp ?? rtdbProp?.tp_cost,
        category: 'property'
      };
    }
    
    // Property object - look up in RTDB by id or name
    const propId = prop.id;
    const propName = prop.name || 'Unknown Property';
    
    let rtdbProp = rtdbProperties.find(p => propId && String(p.id) === String(propId));
    if (!rtdbProp) {
      rtdbProp = rtdbProperties.find(p => p.name?.toLowerCase() === propName.toLowerCase());
    }
    
    return { 
      name: rtdbProp?.name || propName,
      description: rtdbProp?.description,
      tpCost: rtdbProp?.base_tp ?? rtdbProp?.tp_cost,
      category: 'property' 
    };
  });
}

/**
 * Calculate weapon attack bonus based on weapon properties
 * - Finesse: Use agility instead of strength
 * - Range: Use acuity instead of strength
 * - Default: Use strength
 */
function getWeaponAttackBonus(
  weapon: Item,
  abilities?: Abilities
): { bonus: number; abilityName: string } {
  if (!abilities) return { bonus: 0, abilityName: 'Strength' };
  
  const props = (weapon.properties || []).map(p => 
    typeof p === 'string' ? p : (p as { name?: string }).name || ''
  );
  
  // Finesse uses agility
  if (props.some(p => p.toLowerCase() === 'finesse')) {
    return { bonus: abilities.agility, abilityName: 'Agility' };
  }
  
  // Range uses acuity (also check if weapon has a range property > melee)
  if (props.some(p => p.toLowerCase() === 'range') || 
      (weapon as Item & { range?: string | number }).range) {
    return { bonus: abilities.acuity, abilityName: 'Acuity' };
  }
  
  // Default to strength
  return { bonus: abilities.strength, abilityName: 'Strength' };
}

interface LibrarySectionProps {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  armor: Item[];
  equipment: Item[];
  currency?: number;
  innateEnergy?: number;
  innateThreshold?: number; // Innate energy threshold per pool
  innatePools?: number; // Number of innate pools
  currentInnateEnergy?: number; // Current innate energy (if tracked separately)
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
  weight?: number;
  height?: number;
  appearance?: string;
  archetypeDesc?: string;
  notes?: string;
  abilities?: Abilities;
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
  unarmedProwess?: number; // 0 means not selected, 1-5 = prowess level
  onUnarmedProwessChange?: (level: number) => void;
  // Parts RTDB data for enrichment (descriptions, TP costs)
  powerPartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  techniquePartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  itemPropertiesDb?: Array<{ id: string | number; name: string; description?: string; base_tp?: number; tp_cost?: number }>;
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
  // Species traits from RTDB species data (automatically granted based on species)
  speciesTraitsFromRTDB?: string[];
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
  }>;
  characterFeats?: Array<{
    id?: string | number;
    name: string;
    description?: string;
    maxUses?: number;
    currentUses?: number;
    recovery?: string;
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
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
  onRemoveFeat?: (featId: string) => void;
  className?: string;
}

type TabType = 'powers' | 'techniques' | 'inventory' | 'feats' | 'proficiencies' | 'notes';

// =============================================================================
// Column Definitions for ListHeader
// =============================================================================

const POWER_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '1fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr', align: 'center' },
  { key: 'duration', label: 'Duration', width: '0.7fr', align: 'center' },
];
const POWER_GRID = '1.4fr 1fr 1fr 0.7fr 0.7fr';

const TECHNIQUE_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr', align: 'center' },
  { key: 'weapon', label: 'Weapon', width: '1fr', align: 'center' },
];
const TECHNIQUE_GRID = '1.4fr 1fr 1fr';

const WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'attack', label: 'Attack', width: '0.7fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'range', label: 'Range', width: '0.6fr', align: 'center' },
];
const WEAPON_GRID = '1fr 0.7fr 0.8fr 0.6fr';

const ARMOR_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'dr', label: 'DR', width: '0.5fr', align: 'center' },
  { key: 'crit', label: 'Crit', width: '0.5fr', align: 'center' },
];
const ARMOR_GRID = '1fr 0.5fr 0.5fr';

const EQUIPMENT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'type', label: 'Type', width: '0.6fr', align: 'center' },
  { key: 'quantity', label: 'Qty', width: '4rem', align: 'center' },
];
const EQUIPMENT_GRID = '1fr 0.6fr 4rem';

export function LibrarySection({
  powers,
  techniques,
  weapons,
  armor,
  equipment,
  currency = 0,
  innateEnergy = 0,
  innateThreshold = 0,
  innatePools = 0,
  currentInnateEnergy,
  currentEnergy = 0,
  isEditMode = false,
  onAddPower,
  onRemovePower,
  onTogglePowerInnate,
  onUsePower,
  onAddTechnique,
  onRemoveTechnique,
  onUseTechnique,
  onAddWeapon,
  onRemoveWeapon,
  onToggleEquipWeapon,
  onAddArmor,
  onRemoveArmor,
  onToggleEquipArmor,
  onAddEquipment,
  onRemoveEquipment,
  onEquipmentQuantityChange,
  onCurrencyChange,
  // Notes props
  visibility = 'private',
  onVisibilityChange,
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
  // Custom notes props
  namedNotes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  // Proficiencies props
  level = 1,
  archetypeAbility = 0,
  martialProficiency,
  unarmedProwess,
  onUnarmedProwessChange,
  powerPartsDb = [],
  techniquePartsDb = [],
  itemPropertiesDb = [],
  // Feats props
  ancestry,
  vanillaTraits,
  speciesTraitsFromRTDB = [],
  traitsDb = [],
  featsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  onFeatUsesChange,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
  onRemoveFeat,
  className,
}: LibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('feats');
  const [currencyInput, setCurrencyInput] = useState(currency.toString());
  const rollContext = useRollsOptional();
  
  // Sort state for each section
  const [powerSort, setPowerSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [techniqueSort, setTechniqueSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [weaponSort, setWeaponSort] = useState<SortState>({ col: 'name', dir: 1 });
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
  const sortedArmor = useMemo(
    () => sortByColumn(armor, armorSort),
    [armor, armorSort]
  );
  const sortedEquipment = useMemo(
    () => sortByColumn(equipment, equipmentSort),
    [equipment, equipmentSort]
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

  const activeTabData = tabs.find(t => t.id === activeTab);

  const handleCurrencyBlur = () => {
    const value = parseInt(currencyInput) || 0;
    if (value !== currency && onCurrencyChange) {
      onCurrencyChange(value);
    }
  };

  return (
    <div className={cn("bg-surface rounded-xl shadow-md p-4 md:p-6 relative flex flex-col", className)}>
      {/* Edit Mode Indicator - Blue Pencil Icon in top-right */}
      {isEditMode && (
        <div className="absolute top-3 right-3">
          <EditSectionToggle 
            state="normal"
            title="Editing library (powers, techniques, inventory, feats)"
          />
        </div>
      )}
      
      {/* Tabs */}
      <TabNavigation
        tabs={tabs.map(t => ({ id: t.id, label: t.label }))}
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
                    value={`${currentInnateEnergy !== undefined ? currentInnateEnergy : innateEnergy} / ${innateEnergy}`}
                    highlight
                    highlightColor="power"
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
                <p className="text-xs text-text-muted mt-1 text-center">
                  Innate powers have no cost to use. You may have powers with energy costs up to your innate energy.
                </p>
              </TabSummarySection>
            )}

            {/* Innate Powers Section */}
            <div className="mb-4">
              <SectionHeader 
                title="Innate Powers" 
                onAdd={onTogglePowerInnate ? undefined : onAddPower}
                addLabel="Add innate power"
              />
              {sortedInnatePowers.length > 0 && (
                <ListHeader
                  columns={POWER_COLUMNS}
                  gridColumns={POWER_GRID}
                  sortState={powerSort}
                  onSort={(col) => setPowerSort(toggleSort(powerSort, col))}
                />
              )}
              {sortedInnatePowers.length > 0 ? (
                <div className="space-y-1">
                  {sortedInnatePowers
                    .map((power, i) => {
                      const isInnate = power.innate === true;
                      const energyCost = power.cost ?? 0;
                      const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                      const partChips = partsToPartData(power.parts, powerPartsDb).map(p => ({ ...p, category: 'tag' as const }));
                      
                      const columns: ColumnValue[] = [
                        { key: 'action', value: power.actionType || '-', align: 'center' },
                        { key: 'damage', value: formatDamageType(power.damage), align: 'center' },
                        { key: 'area', value: formatArea(power.area), align: 'center' },
                        { key: 'duration', value: formatDuration(power.duration), align: 'center' },
                      ];
                      
                      // Energy button in rightmost column - styled like roll button
                      const energyButton = onUsePower && energyCost > 0 ? (
                        <RollButton
                          value={energyCost}
                          displayValue={String(energyCost)}
                          onClick={() => onUsePower(power.id || String(i), energyCost)}
                          disabled={!canUse}
                          variant="primary"
                          size="sm"
                          title={canUse ? `Use power (costs ${energyCost} EP)` : 'Not enough energy'}
                        />
                      ) : energyCost > 0 ? (
                        <span className="text-sm font-medium text-text-secondary">{energyCost}</span>
                      ) : null;
                      
                      const innateToggle = onTogglePowerInnate ? (
                        <InnateToggle
                          isInnate={isInnate}
                          onToggle={() => onTogglePowerInnate(power.id || String(i), !isInnate)}
                          size="md"
                        />
                      ) : undefined;
                      
                      return (
                        <GridListRow
                          key={power.id || `innate-${i}`}
                          id={String(power.id || i)}
                          name={power.name}
                          description={power.description}
                          columns={columns}
                          gridColumns={POWER_GRID}
                          chips={partChips}
                          chipsLabel="Parts"
                          innate={isInnate}
                          leftSlot={innateToggle}
                          rightSlot={energyButton}
                          onDelete={isEditMode && onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
                          compact
                          expandedContent={
                            power.range ? (
                              <div className="text-xs text-text-muted">
                                <span className="font-medium">Range:</span> {power.range}
                              </div>
                            ) : undefined
                          }
                        />
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">
                  No innate powers — click ☆ on a power to mark it as innate
                </p>
              )}
            </div>

            {/* Regular Powers Section */}
            <div>
              <SectionHeader 
                title="Powers" 
                onAdd={onAddPower}
                addLabel="Add power"
              />
              {sortedRegularPowers.length > 0 && (
                <ListHeader
                  columns={POWER_COLUMNS}
                  gridColumns={POWER_GRID}
                  sortState={powerSort}
                  onSort={(col) => setPowerSort(toggleSort(powerSort, col))}
                />
              )}
              {sortedRegularPowers.length > 0 ? (
                <div className="space-y-1">
                  {sortedRegularPowers
                    .map((power, i) => {
                      const isInnate = power.innate === true;
                      const energyCost = power.cost ?? 0;
                      const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                      const partChips = partsToPartData(power.parts, powerPartsDb).map(p => ({ ...p, category: 'tag' as const }));
                      
                      const columns: ColumnValue[] = [
                        { key: 'action', value: power.actionType || '-', align: 'center' },
                        { key: 'damage', value: formatDamageType(power.damage), align: 'center' },
                        { key: 'area', value: formatArea(power.area), align: 'center' },
                        { key: 'duration', value: formatDuration(power.duration), align: 'center' },
                      ];
                      
                      // Energy button in rightmost column - styled like roll button
                      const energyButton = onUsePower && energyCost > 0 ? (
                        <RollButton
                          value={energyCost}
                          displayValue={String(energyCost)}
                          onClick={() => onUsePower(power.id || String(i), energyCost)}
                          disabled={!canUse}
                          variant="primary"
                          size="sm"
                          title={canUse ? `Use power (costs ${energyCost} EP)` : 'Not enough energy'}
                        />
                      ) : energyCost > 0 ? (
                        <span className="text-sm font-medium text-text-secondary">{energyCost}</span>
                      ) : null;
                      
                      const innateToggle = onTogglePowerInnate ? (
                        <InnateToggle
                          isInnate={isInnate}
                          onToggle={() => onTogglePowerInnate(power.id || String(i), !isInnate)}
                          size="md"
                        />
                      ) : undefined;
                      
                      return (
                        <GridListRow
                          key={power.id || `regular-${i}`}
                          id={String(power.id || i)}
                          name={power.name}
                          description={power.description}
                          columns={columns}
                          gridColumns={POWER_GRID}
                          chips={partChips}
                          chipsLabel="Parts"
                          innate={isInnate}
                          leftSlot={innateToggle}
                          rightSlot={energyButton}
                          onDelete={isEditMode && onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
                          compact
                          expandedContent={
                            power.range ? (
                              <div className="text-xs text-text-muted">
                                <span className="font-medium">Range:</span> {power.range}
                              </div>
                            ) : undefined
                          }
                        />
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">
                  No powers learned
                </p>
              )}
            </div>
          </>
        )}

        {activeTab === 'techniques' && (
          <>
            {/* Techniques Section */}
            <div>
              <SectionHeader 
                title="Techniques" 
                onAdd={onAddTechnique}
                addLabel="Add technique"
              />
              {sortedTechniques.length > 0 && (
                <ListHeader
                  columns={TECHNIQUE_COLUMNS}
                  gridColumns={TECHNIQUE_GRID}
                  sortState={techniqueSort}
                  onSort={(col) => setTechniqueSort(toggleSort(techniqueSort, col))}
                />
              )}
              {sortedTechniques.length > 0 ? (
                <div className="space-y-1">
                  {sortedTechniques.map((tech, i) => {
                    const energyCost = tech.cost ?? 0;
                    const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                    const partChips = partsToPartData(tech.parts, techniquePartsDb).map(p => ({ ...p, category: 'tag' as const }));
                    
                    const columns: ColumnValue[] = [
                      { key: 'action', value: tech.actionType || '-', align: 'center' },
                      { key: 'weapon', value: tech.weaponName || '-', highlight: tech.weaponName !== undefined, align: 'center' },
                    ];
                    
                    // Energy button in rightmost column - styled like roll button
                    const energyButton = onUseTechnique && energyCost > 0 ? (
                      <RollButton
                        value={energyCost}
                        displayValue={String(energyCost)}
                        onClick={() => onUseTechnique(tech.id || String(i), energyCost)}
                        disabled={!canUse}
                        variant="success"
                        size="sm"
                        title={canUse ? `Use technique (costs ${energyCost} EP)` : 'Not enough energy'}
                      />
                    ) : energyCost > 0 ? (
                      <span className="text-sm font-medium text-text-secondary">{energyCost}</span>
                    ) : null;
                    
                    const extraInfo = (tech.range || tech.damage) ? (
                      <div className="flex flex-wrap gap-3 text-xs text-text-muted">
                        {tech.range && (
                          <span><span className="font-medium">Range:</span> {tech.range}</span>
                        )}
                        {tech.damage && (
                          <span><span className="font-medium">Damage:</span> {tech.damage}</span>
                        )}
                      </div>
                    ) : undefined;
                    
                    return (
                      <GridListRow
                        key={tech.id || i}
                        id={String(tech.id || i)}
                        name={tech.name}
                        description={tech.description}
                        columns={columns}
                        gridColumns={TECHNIQUE_GRID}
                        chips={partChips}
                        chipsLabel="Parts"
                        rightSlot={energyButton}
                        onDelete={isEditMode && onRemoveTechnique ? () => onRemoveTechnique(tech.id || String(i)) : undefined}
                        compact
                        expandedContent={extraInfo}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">
                  No techniques learned
                </p>
              )}
            </div>
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
                    className="w-20 px-2 py-1 text-sm font-bold text-amber-600 dark:text-amber-400 border border-amber-300 dark:border-amber-600/50 rounded focus:ring-2 focus:ring-amber-500 bg-white dark:bg-surface"
                    title="Use +5, -10, or a number"
                  />
                  <span className="text-sm font-medium text-text-muted">Currency</span>
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

            {/* Weapons Section */}
            <div>
              <SectionHeader 
                title="Weapons" 
                onAdd={onAddWeapon}
                addLabel="Add weapon"
              />
              {sortedWeapons.length > 0 && (
                <ListHeader
                  columns={WEAPON_COLUMNS}
                  gridColumns={WEAPON_GRID}
                  sortState={weaponSort}
                  onSort={(col) => setWeaponSort(toggleSort(weaponSort, col))}
                />
              )}
              {sortedWeapons.length > 0 ? (
                <div className="space-y-1">
                  {sortedWeapons.map((item, i) => {
                    // Calculate attack bonus based on weapon properties (finesse/range/default)
                    const { bonus: attackBonus, abilityName } = getWeaponAttackBonus(item, abilities);
                    const abilityAbbr = abilityName === 'Strength' ? 'Str' : abilityName === 'Agility' ? 'Agi' : abilityName === 'Acuity' ? 'Acu' : abilityName.slice(0, 3);
                    const attackDisplay = `+${attackBonus} (${abilityAbbr})`;
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({ ...p, category: 'tag' as const }));
                    const columns: ColumnValue[] = [
                      { key: 'attack', value: attackDisplay, className: 'font-medium', align: 'center' },
                      { key: 'damage', value: item.damage ? formatDamageDisplay(item.damage) : '-', className: 'text-red-600 font-medium', align: 'center' },
                      { key: 'range', value: (item as Item & { range?: string }).range || 'Melee', align: 'center' },
                    ];
                    
                    return (
                      <GridListRow
                        key={item.id || i}
                        id={String(item.id || i)}
                        name={item.name}
                        columns={columns}
                        gridColumns={WEAPON_GRID}
                        chips={propertyChips}
                        equipped={item.equipped}
                        leftSlot={onToggleEquipWeapon && (
                          <EquipToggle
                            isEquipped={item.equipped || false}
                            onToggle={() => onToggleEquipWeapon(item.id || item.name || String(i))}
                            label={item.equipped ? 'Unequip' : 'Equip'}
                          />
                        )}
                        rightSlot={rollContext && (
                          <div className="flex items-center gap-1">
                            <RollButton
                              value={attackBonus}
                              onClick={() => rollContext.rollAttack(item.name, attackBonus)}
                              size="sm"
                              title={`Roll attack (${abilityName})`}
                            />
                            {item.damage && typeof item.damage === 'string' && (
                              <RollButton
                                value={0}
                                displayValue="💥"
                                variant="danger"
                                onClick={() => rollContext.rollDamage(item.damage as string)}
                                size="sm"
                                title="Roll damage"
                              />
                            )}
                          </div>
                        )}
                        onDelete={onRemoveWeapon ? () => onRemoveWeapon(item.id || item.name || String(i)) : undefined}
                        expandedContent={item.description ? (
                          <p className="text-sm text-text-muted italic whitespace-pre-wrap">
                            {item.description}
                          </p>
                        ) : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">No weapons (see Unarmed Prowess in Archetype section)</p>
              )}
            </div>
            
            {/* Armor Section */}
            <div>
              <SectionHeader 
                title="Armor" 
                onAdd={onAddArmor}
                addLabel="Add armor"
              />
              {sortedArmor.length > 0 && (
                <ListHeader
                  columns={ARMOR_COLUMNS}
                  gridColumns={ARMOR_GRID}
                  sortState={armorSort}
                  onSort={(col) => setArmorSort(toggleSort(armorSort, col))}
                />
              )}
              {sortedArmor.length > 0 ? (
                <div className="space-y-1">
                  {sortedArmor.map((item, i) => {
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({ ...p, category: 'tag' as const }));
                    const itemWithCrit = item as Item & { critRange?: string | number };
                    // Get ability requirement from enriched data
                    const abilityReq = (item as Item & { abilityRequirement?: { name?: string; level?: number } }).abilityRequirement;
                    const agilityRed = (item as Item & { agilityReduction?: number }).agilityReduction;
                    
                    const columns: ColumnValue[] = [
                      { key: 'dr', value: item.armor !== undefined ? String(item.armor) : '-', className: 'text-blue-600 font-medium', align: 'center' },
                      { key: 'crit', value: itemWithCrit.critRange ?? '-', align: 'center' },
                    ];
                    
                    // Build expanded content with requirements
                    const expandedDetails: string[] = [];
                    if (abilityReq?.name && abilityReq?.level) {
                      expandedDetails.push(`Requires ${abilityReq.name} ${abilityReq.level}+`);
                    }
                    if (agilityRed && agilityRed > 0) {
                      expandedDetails.push(`Agility Reduction: -${agilityRed}`);
                    }
                    if (item.description) {
                      expandedDetails.push(item.description);
                    }
                    
                    return (
                      <GridListRow
                        key={item.id || i}
                        id={String(item.id || i)}
                        name={item.name}
                        columns={columns}
                        gridColumns={ARMOR_GRID}
                        chips={propertyChips}
                        equipped={item.equipped}
                        leftSlot={onToggleEquipArmor && (
                          <EquipToggle
                            isEquipped={item.equipped || false}
                            onToggle={() => onToggleEquipArmor(item.id || item.name || String(i))}
                            label={item.equipped ? 'Unequip' : 'Equip'}
                          />
                        )}
                        onDelete={onRemoveArmor ? () => onRemoveArmor(item.id || item.name || String(i)) : undefined}
                        expandedContent={expandedDetails.length > 0 ? (
                          <div className="space-y-1">
                            {expandedDetails.map((detail, idx) => (
                              <p key={idx} className={cn(
                                "text-sm whitespace-pre-wrap",
                                idx < expandedDetails.length - 1 || !item.description 
                                  ? "text-text-secondary font-medium" 
                                  : "text-text-muted italic"
                              )}>
                                {detail}
                              </p>
                            ))}
                          </div>
                        ) : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">No armor</p>
              )}
            </div>
            
            {/* Equipment Section */}
            <div>
              <SectionHeader 
                title="Equipment" 
                onAdd={onAddEquipment}
                addLabel="Add equipment"
              />
              {sortedEquipment.length > 0 && (
                <ListHeader
                  columns={EQUIPMENT_COLUMNS}
                  gridColumns={EQUIPMENT_GRID}
                  sortState={equipmentSort}
                  onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
                />
              )}
              {sortedEquipment.length > 0 ? (
                <div className="space-y-1">
                  {sortedEquipment.map((item, i) => {
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({ ...p, category: 'tag' as const }));
                    
                    // Capitalize item type for display
                    const itemType = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '-';
                    
                    const columns: ColumnValue[] = [
                      { key: 'type', value: itemType, align: 'center' },
                      { key: 'quantity', value: item.quantity ?? 1, align: 'center' },
                    ];
                    
                    // Build badges from item metadata
                    const badges: Array<{ label: string; color?: 'blue' | 'purple' | 'green' | 'amber' | 'gray' | 'red' }> = [];
                    if (item.rarity && item.rarity !== 'common') {
                      const rarityColor = item.rarity === 'legendary' ? 'amber' : item.rarity === 'epic' ? 'purple' : item.rarity === 'rare' ? 'blue' : 'green';
                      badges.push({ label: item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1), color: rarityColor });
                    }
                    if (item.cost !== undefined && item.cost > 0) {
                      badges.push({ label: `${item.cost}g`, color: 'amber' });
                    }
                    
                    return (
                      <GridListRow
                        key={item.id || i}
                        id={String(item.id || i)}
                        name={item.name}
                        description={item.description}
                        columns={columns}
                        gridColumns={EQUIPMENT_GRID}
                        chips={propertyChips}
                        badges={badges}
                        quantity={item.quantity}
                        onQuantityChange={onEquipmentQuantityChange ? (delta) => onEquipmentQuantityChange(item.id || item.name || String(i), delta) : undefined}
                        onDelete={onRemoveEquipment ? () => onRemoveEquipment(item.id || item.name || String(i)) : undefined}
                        compact
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">No equipment</p>
              )}
            </div>
          </div>
        )}

        {activeTab === 'feats' && (
          <FeatsTab
            ancestry={ancestry}
            vanillaTraits={vanillaTraits}
            speciesTraitsFromRTDB={speciesTraitsFromRTDB}
            traitsDb={traitsDb}
            featsDb={featsDb}
            traitUses={traitUses}
            archetypeFeats={archetypeFeats}
            characterFeats={characterFeats}
            isEditMode={isEditMode}
            onFeatUsesChange={onFeatUsesChange}
            onTraitUsesChange={onTraitUsesChange}
            onAddArchetypeFeat={onAddArchetypeFeat}
            onAddCharacterFeat={onAddCharacterFeat}
            onRemoveFeat={onRemoveFeat}
          />
        )}

        {activeTab === 'proficiencies' && (
          <ProficienciesTab
            powers={powers}
            techniques={techniques}
            weapons={weapons}
            armor={armor}
            level={level}
            archetypeAbility={archetypeAbility}
            powerPartsDb={powerPartsDb}
            techniquePartsDb={techniquePartsDb}
            unarmedProwess={unarmedProwess}
            isEditMode={isEditMode}
            onUnarmedProwessChange={onUnarmedProwessChange}
          />
        )}

        {activeTab === 'notes' && abilities && (
          <NotesTab
            visibility={visibility}
            onVisibilityChange={onVisibilityChange}
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
          <p className="text-text-muted text-sm italic text-center py-4">
            Character abilities not loaded
          </p>
        )}
      </div>
    </div>
  );
}
