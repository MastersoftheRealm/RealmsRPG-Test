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
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  type ColumnValue, 
  type ChipData,
  TabSummarySection,
  SummaryItem,
  SummaryRow,
  ListHeader,
  type ListColumn,
  type SortState,
} from '@/components/shared';
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
  className?: string;
}

type TabType = 'powers' | 'techniques' | 'inventory' | 'feats' | 'proficiencies' | 'notes';

// =============================================================================
// Column Definitions for ListHeader
// =============================================================================

const POWER_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr' },
  { key: 'damage', label: 'Damage', width: '1fr' },
  { key: 'energy', label: 'Energy', width: '0.8fr', align: 'center' },
  { key: 'area', label: 'Area', width: '0.7fr' },
  { key: 'duration', label: 'Duration', width: '0.7fr' },
];
const POWER_GRID = '1.4fr 1fr 1fr 0.8fr 0.7fr 0.7fr';

const TECHNIQUE_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1.4fr' },
  { key: 'action', label: 'Action', width: '1fr' },
  { key: 'weapon', label: 'Weapon', width: '1fr' },
  { key: 'energy', label: 'Energy', width: '0.8fr', align: 'center' },
];
const TECHNIQUE_GRID = '1.4fr 1fr 1fr 0.8fr';

const WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'range', label: 'Range', width: '0.6fr', align: 'center' },
  { key: 'actions', label: 'Actions', width: '8rem', sortable: false, align: 'center' },
];
const WEAPON_GRID = '1fr 0.8fr 0.6fr 8rem';

const ARMOR_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'dr', label: 'DR', width: '0.5fr', align: 'center' },
  { key: 'crit', label: 'Crit', width: '0.5fr', align: 'center' },
];
const ARMOR_GRID = '1fr 0.5fr 0.5fr';

const EQUIPMENT_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'quantity', label: 'Qty', width: '4rem', align: 'center' },
];
const EQUIPMENT_GRID = '1fr 4rem';

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
  
  // Helper to toggle sort
  const toggleSort = useCallback((current: SortState, col: string): SortState => {
    if (current.col === col) {
      return { col, dir: current.dir === 1 ? -1 : 1 };
    }
    return { col, dir: 1 };
  }, []);
  
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
        size="sm"
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
                <p className="text-xs text-text-muted mt-1">
                  Innate powers use this energy pool instead of regular energy
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
              {powers.filter(p => p.innate === true).length > 0 && (
                <ListHeader
                  columns={POWER_COLUMNS}
                  gridColumns={POWER_GRID}
                  sortState={powerSort}
                  onSort={(col) => setPowerSort(toggleSort(powerSort, col))}
                />
              )}
              {powers.filter(p => p.innate === true).length > 0 ? (
                <div className="space-y-1">
                  {powers
                    .filter(p => p.innate === true)
                    .map((power, i) => {
                      const isInnate = power.innate === true;
                      const energyCost = power.cost ?? 0;
                      const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                      const partChips = partsToPartData(power.parts, powerPartsDb).map(p => ({ ...p, category: 'tag' as const }));
                      
                      const columns: ColumnValue[] = [
                        { key: 'action', value: power.actionType || '-' },
                        { key: 'damage', value: power.damage || '-' },
                        { key: 'energy', value: energyCost > 0 ? energyCost : '-', highlight: energyCost > 0 },
                        { key: 'area', value: power.area || '-' },
                        { key: 'duration', value: power.duration || '-' },
                      ];
                      
                      const useButton = !isEditMode && onUsePower && energyCost > 0 ? (
                        <button
                          onClick={() => onUsePower(power.id || String(i), energyCost)}
                          disabled={!canUse}
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded transition-colors',
                            canUse 
                              ? 'bg-violet-100 text-violet-700 hover:bg-violet-200' 
                              : 'bg-surface text-text-muted cursor-not-allowed'
                          )}
                          title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
                        >
                          Use ({energyCost})
                        </button>
                      ) : undefined;
                      
                      const innateToggle = onTogglePowerInnate ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePowerInnate(power.id || String(i), !isInnate);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-violet-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all text-xl"
                          title="Remove from innate"
                        >
                          ★
                        </button>
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
                          rightSlot={useButton}
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
              {powers.filter(p => p.innate !== true).length > 0 && (
                <ListHeader
                  columns={POWER_COLUMNS}
                  gridColumns={POWER_GRID}
                  sortState={powerSort}
                  onSort={(col) => setPowerSort(toggleSort(powerSort, col))}
                />
              )}
              {powers.filter(p => p.innate !== true).length > 0 ? (
                <div className="space-y-1">
                  {powers
                    .filter(p => p.innate !== true)
                    .map((power, i) => {
                      const isInnate = power.innate === true;
                      const energyCost = power.cost ?? 0;
                      const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                      const partChips = partsToPartData(power.parts, powerPartsDb).map(p => ({ ...p, category: 'tag' as const }));
                      
                      const columns: ColumnValue[] = [
                        { key: 'action', value: power.actionType || '-' },
                        { key: 'damage', value: power.damage || '-' },
                        { key: 'energy', value: energyCost > 0 ? energyCost : '-', highlight: energyCost > 0 },
                        { key: 'area', value: power.area || '-' },
                        { key: 'duration', value: power.duration || '-' },
                      ];
                      
                      const useButton = !isEditMode && onUsePower && energyCost > 0 ? (
                        <button
                          onClick={() => onUsePower(power.id || String(i), energyCost)}
                          disabled={!canUse}
                          className={cn(
                            'px-2 py-1 text-xs font-medium rounded transition-colors',
                            canUse 
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                              : 'bg-surface text-text-muted cursor-not-allowed'
                          )}
                          title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
                        >
                          Use ({energyCost})
                        </button>
                      ) : undefined;
                      
                      const innateToggle = onTogglePowerInnate ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onTogglePowerInnate(power.id || String(i), !isInnate);
                          }}
                          className="w-10 h-10 flex items-center justify-center text-text-muted hover:text-violet-500 hover:bg-violet-50 rounded-lg transition-all text-xl"
                          title="Set as innate"
                        >
                          ☆
                        </button>
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
                          rightSlot={useButton}
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
              {techniques.length > 0 && (
                <ListHeader
                  columns={TECHNIQUE_COLUMNS}
                  gridColumns={TECHNIQUE_GRID}
                  sortState={techniqueSort}
                  onSort={(col) => setTechniqueSort(toggleSort(techniqueSort, col))}
                />
              )}
              {techniques.length > 0 ? (
                <div className="space-y-1">
                  {techniques.map((tech, i) => {
                    // EnrichedTechnique uses 'energyCost', raw CharacterTechnique uses 'cost'
                    const energyCost = (tech as any).energyCost ?? tech.cost ?? 0;
                    const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                    const partChips = partsToPartData(tech.parts, techniquePartsDb).map(p => ({ ...p, category: 'tag' as const }));
                    
                    const columns: ColumnValue[] = [
                      { key: 'action', value: tech.actionType || '-' },
                      { key: 'weapon', value: tech.weaponName || '-', highlight: tech.weaponName !== undefined },
                      { key: 'energy', value: energyCost > 0 ? energyCost : '-', highlight: energyCost > 0 },
                    ];
                    
                    const useButton = !isEditMode && onUseTechnique && energyCost > 0 ? (
                      <button
                        onClick={() => onUseTechnique(tech.id || String(i), energyCost)}
                        disabled={!canUse}
                        className={cn(
                          'px-2 py-1 text-xs font-medium rounded transition-colors',
                          canUse 
                            ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                            : 'bg-surface text-text-muted cursor-not-allowed'
                        )}
                        title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
                      >
                        Use ({energyCost})
                      </button>
                    ) : undefined;
                    
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
                        rightSlot={useButton}
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
            {/* Inventory Summary: Currency + Armament Proficiency */}
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
                    className="w-20 px-2 py-1 text-sm font-bold text-amber-600 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500 bg-white"
                    title="Use +5, -10, or a number"
                  />
                  <span className="text-sm text-text-muted">currency</span>
                </div>
                {martialProficiency !== undefined && (
                  <SummaryItem 
                    icon="⚔️" 
                    label="Armament Proficiency" 
                    value={`${calculateArmamentProficiency(martialProficiency)} TP`}
                    highlight
                    highlightColor="warning"
                  />
                )}
              </SummaryRow>
            </TabSummarySection>

            {/* Weapons Section */}
            <div>
              <SectionHeader 
                title="Weapons" 
                onAdd={onAddWeapon}
                addLabel="Add weapon"
              />
              {weapons.length > 0 && (
                <ListHeader
                  columns={WEAPON_COLUMNS}
                  gridColumns={WEAPON_GRID}
                  sortState={weaponSort}
                  onSort={(col) => setWeaponSort(toggleSort(weaponSort, col))}
                  hasSelectionColumn
                />
              )}
              {weapons.length > 0 ? (
                <div className="space-y-1">
                  {weapons.map((item, i) => {
                    // Calculate attack bonus based on weapon properties (finesse/range/default)
                    const { bonus: attackBonus, abilityName } = getWeaponAttackBonus(item, abilities);
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({ ...p, category: 'tag' as const }));
                    const columns: ColumnValue[] = [
                      { key: 'damage', value: item.damage ? formatDamageDisplay(item.damage) : '-', className: 'text-red-600 font-medium' },
                      { key: 'range', value: (item as Item & { range?: string }).range || 'Melee' },
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
                          <SelectionToggle
                            isSelected={item.equipped || false}
                            onToggle={() => onToggleEquipWeapon(item.id || String(i))}
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
                        onDelete={onRemoveWeapon && isEditMode ? () => onRemoveWeapon(item.id || String(i)) : undefined}
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
              {armor.length > 0 && (
                <ListHeader
                  columns={ARMOR_COLUMNS}
                  gridColumns={ARMOR_GRID}
                  sortState={armorSort}
                  onSort={(col) => setArmorSort(toggleSort(armorSort, col))}
                  hasSelectionColumn
                />
              )}
              {armor.length > 0 ? (
                <div className="space-y-1">
                  {armor.map((item, i) => {
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({ ...p, category: 'tag' as const }));
                    const itemWithCrit = item as Item & { critRange?: string | number };
                    // Get ability requirement from enriched data
                    const abilityReq = (item as Item & { abilityRequirement?: { name?: string; level?: number } }).abilityRequirement;
                    const agilityRed = (item as Item & { agilityReduction?: number }).agilityReduction;
                    
                    const columns: ColumnValue[] = [
                      { key: 'dr', value: item.armor !== undefined ? String(item.armor) : '-', className: 'text-blue-600 font-medium' },
                      { key: 'crit', value: itemWithCrit.critRange ?? '-' },
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
                          <SelectionToggle
                            isSelected={item.equipped || false}
                            onToggle={() => onToggleEquipArmor(item.id || String(i))}
                            label={item.equipped ? 'Unequip' : 'Equip'}
                          />
                        )}
                        onDelete={onRemoveArmor && isEditMode ? () => onRemoveArmor(item.id || String(i)) : undefined}
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
              {equipment.length > 0 && (
                <ListHeader
                  columns={EQUIPMENT_COLUMNS}
                  gridColumns={EQUIPMENT_GRID}
                  sortState={equipmentSort}
                  onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
                />
              )}
              {equipment.length > 0 ? (
                <div className="space-y-1">
                  {equipment.map((item, i) => {
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({ ...p, category: 'tag' as const }));
                    const columns: ColumnValue[] = [
                      { key: 'quantity', value: item.quantity ?? 1 },
                    ];
                    
                    return (
                      <GridListRow
                        key={item.id || i}
                        id={String(item.id || i)}
                        name={item.name}
                        columns={columns}
                        gridColumns={EQUIPMENT_GRID}
                        chips={propertyChips}
                        quantity={item.quantity}
                        onQuantityChange={onEquipmentQuantityChange && isEditMode ? (delta) => onEquipmentQuantityChange(item.id || String(i), delta) : undefined}
                        onDelete={onRemoveEquipment && isEditMode ? () => onRemoveEquipment(item.id || String(i)) : undefined}
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
