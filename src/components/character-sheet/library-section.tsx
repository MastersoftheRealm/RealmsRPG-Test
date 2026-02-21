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

/** Codex part data for enrichment */
interface CodexPart {
  id: string;
  name: string;
  description?: string;
  base_tp?: number;
  op_1_tp?: number;
  op_2_tp?: number;
  op_3_tp?: number;
}

// Helper to convert power/technique parts to PartData format, with Codex enrichment
// The saved part data only has option levels - TP costs come from Codex
function partsToPartData(
  parts?: CharacterPower['parts'] | CharacterTechnique['parts'],
  codexParts: CodexPart[] = []
): PartData[] {
  if (!parts || parts.length === 0) return [];
  
  return parts.map(part => {
    if (typeof part === 'string') {
      // String-only part - look up in Codex for description and TP
      const codexPart = codexParts.find(p => p.name?.toLowerCase() === part.toLowerCase());
      return { 
        name: part,
        description: codexPart?.description,
        tpCost: codexPart?.base_tp,
      };
    }
    
    // Full part data - look up TP costs from Codex by id or name
    const partName = part.name || part.id || 'Unknown Part';
    const partId = part.id;
    
    // Try to find Codex part by id first, then by name
    let codexPart = codexParts.find(p => partId && String(p.id) === String(partId));
    if (!codexPart) {
      codexPart = codexParts.find(p => p.name?.toLowerCase() === partName.toLowerCase());
    }
    
    // Calculate TP cost using Codex values + saved option levels
    const base_tp = codexPart?.base_tp ?? 0;
    const op_1_tp = codexPart?.op_1_tp ?? 0;
    const op_2_tp = codexPart?.op_2_tp ?? 0;
    const op_3_tp = codexPart?.op_3_tp ?? 0;
    
    const tpCost = base_tp + 
                   op_1_tp * (part.op_1_lvl ?? 0) + 
                   op_2_tp * (part.op_2_lvl ?? 0) + 
                   op_3_tp * (part.op_3_lvl ?? 0);
    
    return {
      name: codexPart?.name || partName,
      description: codexPart?.description,
      tpCost: tpCost > 0 ? tpCost : undefined,
      optionLevels: {
        opt1: part.op_1_lvl,
        opt2: part.op_2_lvl,
        opt3: part.op_3_lvl,
      },
    };
  });
}

/** Codex property data for enrichment */
interface CodexProperty {
  id: string | number;
  name: string;
  description?: string;
  base_tp?: number;
  tp_cost?: number;
}

/** Build full chip description: base description + option level line when present (for expandable chip body) */
function chipDescriptionWithOptionLevels(
  baseDescription: string | undefined,
  optionLevels: PartData['optionLevels']
): string | undefined {
  const parts: string[] = [];
  if (baseDescription?.trim()) parts.push(baseDescription.trim());
  if (optionLevels) {
    const opts: string[] = [];
    if ((optionLevels.opt1 ?? 0) > 0) opts.push(`Option 1: Lv.${optionLevels.opt1}`);
    if ((optionLevels.opt2 ?? 0) > 0) opts.push(`Option 2: Lv.${optionLevels.opt2}`);
    if ((optionLevels.opt3 ?? 0) > 0) opts.push(`Option 3: Lv.${optionLevels.opt3}`);
    if (opts.length > 0) parts.push(opts.join('; '));
  }
  return parts.length > 0 ? parts.join('\n\n') : undefined;
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
  if (hrMatch) return hrMatch[1] === '1' ? '1 HR' : `${hrMatch[1]} HRS`;

  // Days
  const dayMatch = withoutParens.match(/^(\d+)\s*days?$/);
  if (dayMatch) return dayMatch[1] === '1' ? '1 Day' : `${dayMatch[1]} Days`;

  // Permanent
  if (withoutParens === 'permanent') return 'Permanent';

  // Capitalize whatever remains (e.g. "1 Minute" → "1 Minute")
  return capitalizeWords(withoutParens);
}

/** Format damage type: capitalize */
function formatDamageType(damage: string | undefined): string {
  if (!damage) return '-';
  return capitalizeWords(damage);
}

/** Property object may have option levels */
interface PropertyWithLevel {
  id?: string | number;
  name?: string;
  op_1_lvl?: number;
  op_2_lvl?: number;
  op_3_lvl?: number;
}

// Helper to convert item properties to PartData format, with Codex enrichment (includes option levels for chip display)
function propertiesToPartData(
  properties?: Item['properties'],
  codexProperties: CodexProperty[] = []
): PartData[] {
  if (!properties || properties.length === 0) return [];
  
  return properties.map(prop => {
    if (typeof prop === 'string') {
      // String-only property - look up in Codex for description
      const codexProp = codexProperties.find(p => p.name?.toLowerCase() === prop.toLowerCase());
      return { 
        name: prop,
        description: codexProp?.description,
        tpCost: codexProp?.base_tp ?? codexProp?.tp_cost,
        category: 'property'
      };
    }
    
    // Property object - look up in Codex by id or name, include option levels
    const propObj = prop as PropertyWithLevel;
    const propId = propObj.id;
    const propName = propObj.name || 'Unknown Property';
    
    let codexProp = codexProperties.find(p => propId && String(p.id) === String(propId));
    if (!codexProp) {
      codexProp = codexProperties.find(p => p.name?.toLowerCase() === propName.toLowerCase());
    }
    
    const baseTp = codexProp?.base_tp ?? codexProp?.tp_cost ?? 0;
    const optLevel = propObj.op_1_lvl ?? 1;
    const tpCost = baseTp * optLevel;
    
    return { 
      name: codexProp?.name || propName,
      description: codexProp?.description,
      tpCost: tpCost > 0 ? tpCost : undefined,
      category: 'property',
      optionLevels: (propObj.op_1_lvl ?? propObj.op_2_lvl ?? propObj.op_3_lvl) != null
        ? { opt1: propObj.op_1_lvl, opt2: propObj.op_2_lvl, opt3: propObj.op_3_lvl }
        : undefined,
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
  shields: Item[];
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
  onAddStateFeat?: () => void;
  onRemoveFeat?: (featId: string) => void;
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
  className?: string;
}

type TabType = 'powers' | 'techniques' | 'inventory' | 'feats' | 'proficiencies' | 'notes';

// =============================================================================
// Column Definitions for ListHeader
// =============================================================================

// Blank header columns (empty label, same background) to align with row left/right slots. Only include when that slot is visible.
const BLANK_LEFT = { key: '_left', label: '', width: '2rem', sortable: false as const };
const BLANK_RIGHT = { key: '_right', label: '', width: '4rem', sortable: false as const };
const BLANK_DELETE = { key: '_delete', label: '', width: '2.25rem', sortable: false as const };

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
  { key: 'energy', label: 'Energy', width: '0.7fr', align: 'center' },
  { key: 'weapon', label: 'Weapon', width: '1fr', align: 'center' },
  { key: 'tp', label: 'Training Pts', width: '0.8fr', align: 'center' },
];
const TECHNIQUE_GRID = '1.4fr 0.7fr 1fr 0.8fr';

const WEAPON_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'attack', label: 'Attack', width: '0.7fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'range', label: 'Range', width: '0.6fr', align: 'center' },
];
const WEAPON_GRID = '1fr 0.7fr 0.8fr 0.6fr';

const SHIELD_COLUMNS: ListColumn[] = [
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'block', label: 'Block', width: '0.7fr', align: 'center' },
  { key: 'damage', label: 'Damage', width: '0.8fr', align: 'center' },
  { key: 'hands', label: 'Hands', width: '0.5fr', align: 'center' },
];
const SHIELD_GRID = '1fr 0.7fr 0.8fr 0.5fr';

const ARMOR_COLUMNS: ListColumn[] = [
  { key: '_equip', label: '', width: '2rem', sortable: false as const },
  { key: 'name', label: 'Name', width: '1fr' },
  { key: 'dr', label: 'Dmg. Red.', width: '0.6fr', align: 'center' as const },
  { key: 'crit', label: 'Crit Range', width: '0.6fr', align: 'center' as const },
];
const ARMOR_HEADER_GRID = '2rem 1fr 0.6fr 0.6fr';
const ARMOR_ROW_GRID = '1fr 0.6fr 0.6fr'; // row content only (leftSlot is separate)

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
  shields = [],
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
  onAddShield,
  onRemoveShield,
  onToggleEquipShield,
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
  speciesTraitsFromCodex = [],
  traitsDb = [],
  featsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  onFeatUsesChange,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
  onAddStateFeat,
  onRemoveFeat,
  stateFeats = [],
  stateUsesCurrent,
  stateUsesMax,
  onStateUsesChange,
  onEnterState,
  maxArchetypeFeats,
  maxCharacterFeats,
  className,
}: LibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('feats');
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
                  ? 'Click to edit library — feats over limit'
                  : 'Click to edit library (powers, techniques, inventory, feats)'
            }
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
                onAdd={onAddPower}
                addLabel="Add innate power"
              />
              {sortedInnatePowers.length > 0 && (
                <ListHeader
                  columns={[
                    ...(showLibraryEditControls && onTogglePowerInnate ? [BLANK_LEFT] : []),
                    ...POWER_COLUMNS,
                    BLANK_RIGHT,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={[
                    showLibraryEditControls && onTogglePowerInnate ? '2rem' : '',
                    POWER_GRID,
                    '4rem',
                    showLibraryEditControls ? '2.25rem' : '',
                  ].filter(Boolean).join(' ')}
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
                      const partChips = partsToPartData(power.parts, powerPartsDb).map(p => ({
                        name: p.name,
                        description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                        cost: p.tpCost,
                        costLabel: 'TP',
                        category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                        level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                      }));
                      const powerTotalTP = partChips.reduce((sum, p) => sum + (p.cost ?? 0), 0);
                      
                      const damageCell = power.damage && rollContext?.rollDamage ? (
                        <RollButton
                          value={0}
                          displayValue={formatDamageType(power.damage)}
                          variant="danger"
                          size="sm"
                          onClick={() => rollContext.rollDamage(power.damage as string)}
                          title="Roll damage"
                        />
                      ) : formatDamageType(power.damage);
                      const columns: ColumnValue[] = [
                        { key: 'action', value: power.actionType || '-', align: 'center' },
                        { key: 'damage', value: damageCell, align: 'center' },
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
                      
                      const innateToggle = showLibraryEditControls && onTogglePowerInnate ? (
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
                          totalCost={powerTotalTP > 0 ? powerTotalTP : undefined}
                          costLabel="TP"
                          requirements={power.range ? (
                            <div className="text-sm text-text-secondary">
                              <span className="font-medium">Range:</span> {power.range}
                            </div>
                          ) : undefined}
                          innate={isInnate}
                          leftSlot={innateToggle}
                          rightSlot={energyButton}
                          onDelete={showLibraryEditControls && onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
                          compact
                        />
                      );
                    })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">
                  No innate powers. Enter edit mode (click the pencil) to mark powers as innate.
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
                  columns={[
                    ...(showLibraryEditControls && onTogglePowerInnate ? [BLANK_LEFT] : []),
                    ...POWER_COLUMNS,
                    BLANK_RIGHT,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={[
                    showLibraryEditControls && onTogglePowerInnate ? '2rem' : '',
                    POWER_GRID,
                    '4rem',
                    showLibraryEditControls ? '2.25rem' : '',
                  ].filter(Boolean).join(' ')}
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
                      const partChips = partsToPartData(power.parts, powerPartsDb).map(p => ({
                        name: p.name,
                        description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                        cost: p.tpCost,
                        costLabel: 'TP',
                        category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                        level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                      }));
                      const powerTotalTP = partChips.reduce((sum, p) => sum + (p.cost ?? 0), 0);
                      
                      const damageCellRegular = power.damage && rollContext?.rollDamage ? (
                        <RollButton
                          value={0}
                          displayValue={formatDamageType(power.damage)}
                          variant="danger"
                          size="sm"
                          onClick={() => rollContext.rollDamage(power.damage as string)}
                          title="Roll damage"
                        />
                      ) : formatDamageType(power.damage);
                      const columnsRegular: ColumnValue[] = [
                        { key: 'action', value: power.actionType || '-', align: 'center' },
                        { key: 'damage', value: damageCellRegular, align: 'center' },
                        { key: 'area', value: formatArea(power.area), align: 'center' },
                        { key: 'duration', value: formatDuration(power.duration), align: 'center' },
                      ];
                      
                      // Energy button in rightmost column - styled like roll button
                      const energyButtonRegular = onUsePower && energyCost > 0 ? (
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
                      
                      const innateToggleRegular = showLibraryEditControls && onTogglePowerInnate ? (
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
                          columns={columnsRegular}
                          gridColumns={POWER_GRID}
                          chips={partChips}
                          chipsLabel="Parts"
                          totalCost={powerTotalTP > 0 ? powerTotalTP : undefined}
                          costLabel="TP"
                          requirements={power.range ? (
                            <div className="text-sm text-text-secondary">
                              <span className="font-medium">Range:</span> {power.range}
                            </div>
                          ) : undefined}
                          innate={isInnate}
                          leftSlot={innateToggleRegular}
                          rightSlot={energyButtonRegular}
                          onDelete={showLibraryEditControls && onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
                          compact
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
                  columns={[
                    ...TECHNIQUE_COLUMNS,
                    BLANK_RIGHT,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={[TECHNIQUE_GRID, '4rem', ...(showLibraryEditControls ? ['2.25rem'] : [])].join(' ')}
                  sortState={techniqueSort}
                  onSort={(col) => setTechniqueSort(toggleSort(techniqueSort, col))}
                />
              )}
              {sortedTechniques.length > 0 ? (
                <div className="space-y-1">
                  {sortedTechniques.map((tech, i) => {
                    const energyCost = tech.cost ?? 0;
                    const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
                    const partChips = partsToPartData(tech.parts, techniquePartsDb).map(p => ({
                      name: p.name,
                      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                      cost: p.tpCost,
                      costLabel: 'TP',
                      category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                      level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                    }));
                    const techTP = (tech as { tp?: number }).tp;
                    const totalTP = typeof techTP === 'number' ? techTP : (typeof techTP === 'string' ? parseFloat(techTP) : undefined);
                    
                    const columns: ColumnValue[] = [
                      { key: 'energy', value: energyCost, align: 'center' },
                      { key: 'weapon', value: tech.weaponName || '-', highlight: tech.weaponName !== undefined, align: 'center' },
                      { key: 'tp', value: techTP ?? '-', align: 'center' },
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
                    
                    const rangeOrDamage = (tech.range || tech.damage) && (
                      <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
                        {tech.range && (
                          <span><span className="font-medium">Range:</span> {tech.range}</span>
                        )}
                        {tech.damage && (
                          <span><span className="font-medium">Damage:</span> {tech.damage}</span>
                        )}
                      </div>
                    );
                    
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
                        totalCost={totalTP && totalTP > 0 ? totalTP : undefined}
                        costLabel="TP"
                        requirements={rangeOrDamage}
                        rightSlot={energyButton}
                        onDelete={showLibraryEditControls && onRemoveTechnique ? () => onRemoveTechnique(tech.id || String(i)) : undefined}
                        compact
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
                    className="w-20 px-2 py-1 text-sm font-bold text-warning-600 dark:text-warning-400 border border-warning-300 dark:border-warning-600/50 rounded focus:ring-2 focus:ring-warning-500 bg-white dark:bg-surface"
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
                  columns={[
                    BLANK_LEFT,
                    ...WEAPON_COLUMNS,
                    BLANK_RIGHT,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={['2rem', WEAPON_GRID, '4rem', ...(showLibraryEditControls ? ['2.25rem'] : [])].join(' ')}
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
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({
                      name: p.name,
                      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                      cost: p.tpCost,
                      costLabel: 'TP',
                      category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                      level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                    }));
                    const columns: ColumnValue[] = [
                      { key: 'attack', value: attackDisplay, className: 'font-medium', align: 'center' },
                      { key: 'damage', value: item.damage ? formatDamageDisplay(item.damage) : '-', className: 'text-danger-600 font-medium', align: 'center' },
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
                        chipsLabel="Properties"
                        description={item.description}
                        equipped={item.equipped}
                        leftSlot={onToggleEquipWeapon && (
                          <EquipToggle
                            isEquipped={item.equipped || false}
                            onToggle={() => onToggleEquipWeapon(item.id ?? item.name ?? i)}
                            label={item.equipped ? 'Unequip' : 'Equip'}
                          />
                        )}
                        rightSlot={rollContext?.canRoll !== false && rollContext && (
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
                        onDelete={showLibraryEditControls && onRemoveWeapon ? () => onRemoveWeapon(item.id ?? item.name ?? i) : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">No weapons (see Unarmed Prowess in Archetype section)</p>
              )}
            </div>

            {/* Shields Section — below weapons, above armor */}
            <div>
              <SectionHeader 
                title="Shields" 
                onAdd={onAddShield}
                addLabel="Add shield"
              />
              {sortedShields.length > 0 && (
                <ListHeader
                  columns={[
                    BLANK_LEFT,
                    ...SHIELD_COLUMNS,
                    BLANK_RIGHT,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={['2rem', SHIELD_GRID, '4rem', ...(showLibraryEditControls ? ['2.25rem'] : [])].join(' ')}
                  sortState={shieldSort}
                  onSort={(col) => setShieldSort(toggleSort(shieldSort, col))}
                />
              )}
              {sortedShields.length > 0 ? (
                <div className="space-y-1">
                  {sortedShields.map((item, i) => {
                    const enriched = item as Item & { shieldAmount?: string; shieldDamage?: string | null };
                    const shieldBlock = enriched.shieldAmount ?? '-';
                    const shieldDamageStr = enriched.shieldDamage ?? (item.damage ? formatDamageDisplay(item.damage) : '-');
                    const props = (item.properties || []).map(p => typeof p === 'string' ? p : (p as { name?: string }).name || '');
                    const isTwoHanded = props.some(p => p?.toLowerCase() === 'two-handed');
                    const handedness = isTwoHanded ? 'Two' : 'One';
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({
                      name: p.name,
                      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                      cost: p.tpCost,
                      costLabel: 'TP',
                      category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                      level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                    }));
                    const columns: ColumnValue[] = [
                      { key: 'block', value: shieldBlock, className: 'text-primary-600 dark:text-primary-400 font-medium', align: 'center' },
                      { key: 'damage', value: shieldDamageStr !== '-' ? shieldDamageStr : '-', className: shieldDamageStr !== '-' ? 'text-danger-600 font-medium' : '', align: 'center' },
                      { key: 'hands', value: handedness, align: 'center' },
                    ];
                    const hasShieldDamage = shieldDamageStr !== '-';
                    const { bonus: attackBonus, abilityName } = getWeaponAttackBonus(item, abilities);
                    return (
                      <GridListRow
                        key={item.id || i}
                        id={String(item.id || i)}
                        name={item.name}
                        columns={columns}
                        gridColumns={SHIELD_GRID}
                        chips={propertyChips}
                        chipsLabel="Properties"
                        description={item.description}
                        equipped={item.equipped}
                        leftSlot={onToggleEquipShield && (
                          <EquipToggle
                            isEquipped={item.equipped || false}
                            onToggle={() => onToggleEquipShield(item.id ?? item.name ?? i)}
                            label={item.equipped ? 'Unequip' : 'Equip'}
                          />
                        )}
                        rightSlot={rollContext?.canRoll !== false && rollContext && (
                          <div className="flex flex-wrap items-center gap-1 justify-end">
                            {hasShieldDamage && (
                              <>
                                <RollButton
                                  value={attackBonus}
                                  onClick={() => rollContext.rollAttack(item.name, attackBonus)}
                                  size="sm"
                                  title={`Roll attack (${abilityName})`}
                                />
                                <RollButton
                                  value={0}
                                  displayValue="💥"
                                  variant="danger"
                                  onClick={() => rollContext.rollDamage(typeof item.damage === 'string' ? item.damage : shieldDamageStr)}
                                  size="sm"
                                  title="Roll damage"
                                />
                              </>
                            )}
                            {shieldBlock !== '-' && (
                              <RollButton
                                value={0}
                                displayValue={shieldBlock}
                                variant="primary"
                                onClick={() => rollContext.rollDamage(shieldBlock + ' Bludgeoning', 0, 'Shield block')}
                                size="sm"
                                title="Roll shield block amount"
                              />
                            )}
                          </div>
                        )}
                        onDelete={showLibraryEditControls && onRemoveShield ? () => onRemoveShield(item.id ?? item.name ?? i) : undefined}
                      />
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-text-muted italic text-center py-4">No shields</p>
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
                  columns={[
                    ...ARMOR_COLUMNS,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={[ARMOR_HEADER_GRID, ...(showLibraryEditControls ? ['2.25rem'] : [])].join(' ')}
                  sortState={armorSort}
                  onSort={(col) => setArmorSort(toggleSort(armorSort, col))}
                />
              )}
              {sortedArmor.length > 0 ? (
                <div className="space-y-1">
                  {sortedArmor.map((item, i) => {
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({
                      name: p.name,
                      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                      cost: p.tpCost,
                      costLabel: 'TP',
                      category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                      level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                    }));
                    // Get ability requirement from enriched data
                    const abilityReq = (item as Item & { abilityRequirement?: { name?: string; level?: number } }).abilityRequirement;
                    const agilityRed = (item as Item & { agilityReduction?: number }).agilityReduction;
                    
                    // Damage reduction: 1 (base) + 1 per op_1_lvl. Use enriched armorValue when present, else derive from properties.
                    const itemWithArmor = item as { armorValue?: number; armor?: number };
                    let damageReduction = itemWithArmor.armorValue ?? itemWithArmor.armor ?? 0;
                    let critRangeBonus = 0;
                    if (item.properties) {
                      for (const prop of item.properties) {
                        if (!prop) continue;
                        const propName = typeof prop === 'string' ? prop : prop.name || '';
                        const op1Lvl = typeof prop === 'object' && 'op_1_lvl' in prop ? Number((prop as Record<string, unknown>).op_1_lvl) || 0 : 0;
                        if (propName === 'Damage Reduction' && damageReduction === 0) {
                          damageReduction = 1 + op1Lvl;
                        }
                        if (propName === 'Critical Range +1') {
                          critRangeBonus = 1 + op1Lvl;
                        }
                      }
                    }
                    // Critical range = base evasion + 10 + bonus (per game rules)
                    const agility = abilities?.agility ?? 0;
                    const baseEvasion = 10 + agility;
                    const critThreshold = critRangeBonus > 0 ? baseEvasion + 10 + critRangeBonus : undefined;
                    
                    const columns: ColumnValue[] = [
                      { key: 'dr', value: damageReduction > 0 ? String(damageReduction) : '-', className: 'text-primary-600 dark:text-primary-400 font-medium', align: 'center' },
                      { key: 'crit', value: critThreshold ?? '-', align: 'center' },
                    ];
                    
                    // Requirements line for expanded view (ability req, agility reduction)
                    const armorRequirements = (abilityReq?.name && abilityReq?.level) || (agilityRed && agilityRed > 0) ? (
                      <div className="space-y-1 text-sm text-text-secondary">
                        {abilityReq?.name && abilityReq?.level && (
                          <p><span className="font-medium">Requires:</span> {abilityReq.name} {abilityReq.level}+</p>
                        )}
                        {agilityRed && agilityRed > 0 && (
                          <p><span className="font-medium">Agility Reduction:</span> -{agilityRed}</p>
                        )}
                      </div>
                    ) : undefined;
                    
                    return (
                      <GridListRow
                        key={item.id || i}
                        id={String(item.id || i)}
                        name={item.name}
                        description={item.description}
                        columns={columns}
                        gridColumns={ARMOR_ROW_GRID}
                        chips={propertyChips}
                        chipsLabel="Properties"
                        requirements={armorRequirements}
                        equipped={item.equipped}
                        leftSlot={onToggleEquipArmor && (
                          <EquipToggle
                            isEquipped={item.equipped || false}
                            onToggle={() => onToggleEquipArmor(item.id ?? item.name ?? i)}
                            label={item.equipped ? 'Unequip' : 'Equip'}
                          />
                        )}
                        onDelete={showLibraryEditControls && onRemoveArmor ? () => onRemoveArmor(item.id ?? item.name ?? i) : undefined}
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
                  columns={[
                    ...EQUIPMENT_COLUMNS,
                    ...(showLibraryEditControls ? [BLANK_DELETE] : []),
                  ]}
                  gridColumns={[EQUIPMENT_GRID, ...(showLibraryEditControls ? ['2.25rem'] : [])].join(' ')}
                  sortState={equipmentSort}
                  onSort={(col) => setEquipmentSort(toggleSort(equipmentSort, col))}
                />
              )}
              {sortedEquipment.length > 0 ? (
                <div className="space-y-1">
                  {sortedEquipment.map((item, i) => {
                    const propertyChips = propertiesToPartData(item.properties, itemPropertiesDb).map(p => ({
                      name: p.name,
                      description: chipDescriptionWithOptionLevels(p.description, p.optionLevels),
                      cost: p.tpCost,
                      costLabel: 'TP',
                      category: p.tpCost && p.tpCost > 0 ? ('cost' as const) : ('default' as const),
                      level: p.optionLevels ? Math.max(p.optionLevels.opt1 ?? 0, p.optionLevels.opt2 ?? 0, p.optionLevels.opt3 ?? 0) || undefined : undefined,
                    }));
                    
                    // Capitalize item type for display
                    const itemType = item.type ? item.type.charAt(0).toUpperCase() + item.type.slice(1) : '-';
                    
                    // Qty column: universal stepper (same pattern as feats Uses column). Editable outside edit mode; going to 0 removes the item.
                    const itemId = item.id ?? item.name ?? i;
                    const qty = item.quantity ?? 1;
                    const quantityStepper = onEquipmentQuantityChange ? (
                      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
                        <QuantitySelector
                          quantity={qty}
                          min={0}
                          max={99}
                          size="sm"
                          onChange={(newVal) => onEquipmentQuantityChange(itemId, newVal - qty)}
                        />
                      </div>
                    ) : (
                      qty
                    );
                    
                    const columns: ColumnValue[] = [
                      { key: 'type', value: itemType, align: 'center' },
                      { key: 'quantity', value: quantityStepper, align: 'center' },
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
                        chipsLabel="Properties"
                        badges={badges}
                        onDelete={showLibraryEditControls && onRemoveEquipment ? () => onRemoveEquipment(itemId) : undefined}
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
            onTraitUsesChange={onTraitUsesChange}
            onAddArchetypeFeat={onAddArchetypeFeat}
            onAddCharacterFeat={onAddCharacterFeat}
            onAddStateFeat={onAddStateFeat}
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
          <p className="text-text-muted text-sm italic text-center py-4">
            Character abilities not loaded
          </p>
        )}
      </div>
    </div>
  );
}
