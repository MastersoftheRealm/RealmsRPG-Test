/**
 * Library Section
 * ===============
 * Displays character's powers, techniques, equipment, proficiencies, and notes
 * Supports edit mode for adding/removing items
 * Weapons have clickable attack/damage rolls
 */

'use client';

import { useState, useMemo } from 'react';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { useRollsOptional } from './roll-context';
import { NotesTab } from './notes-tab';
import { ProficienciesTab } from './proficiencies-tab';
import { FeatsTab } from './feats-tab';
import { PartChipList, type PartData, EditSectionToggle, RollButton, SectionHeader } from '@/components/shared';
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

interface PowerCardProps {
  power: CharacterPower;
  innateEnergy?: number;
  currentEnergy?: number;
  isEditMode?: boolean;
  partsDb?: RTDBPart[];
  onRemove?: () => void;
  onToggleInnate?: (isInnate: boolean) => void;
  onUse?: () => void;
}

function PowerCard({ power, innateEnergy, currentEnergy, isEditMode, partsDb = [], onRemove, onToggleInnate, onUse }: PowerCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isInnate = power.innate === true;
  const energyCost = power.cost ?? 0;
  const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
  
  // Convert parts to PartData format for chips, enriched with RTDB descriptions
  const partChips = useMemo(() => partsToPartData(power.parts, partsDb), [power.parts, partsDb]);
  const hasExpandableContent = power.description || partChips.length > 0;

  // Display values for vanilla-style columns
  const actionType = power.actionType || '-';
  const damage = power.damage || '-';
  const energy = energyCost > 0 ? `${energyCost}` : '-';
  const area = power.area || '-';
  const duration = power.duration || '-';

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      isInnate ? 'border-violet-300 bg-violet-50' : 'border-border-light bg-surface'
    )}>
      {/* Header row with vanilla-style grid layout */}
      <div className="flex items-stretch">
        {/* Innate toggle checkbox - always visible if handler provided */}
        {onToggleInnate && (
          <button
            onClick={() => onToggleInnate(!isInnate)}
            className={cn(
              'px-2 py-2 transition-colors border-r flex-shrink-0',
              isInnate 
                ? 'text-violet-600 bg-violet-100 hover:bg-violet-200' 
                : 'text-text-muted hover:bg-surface-alt'
            )}
            title={isInnate ? 'Remove from innate' : 'Set as innate'}
          >
            {isInnate ? '★' : '☆'}
          </button>
        )}
        
        {/* Main clickable area with grid columns */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr_0.7fr] gap-1 items-center px-2 py-2 hover:bg-surface-alt text-left min-w-0"
        >
          {/* NAME column */}
          <div className="flex items-center gap-1.5 min-w-0">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
            <span className="font-medium text-text-primary text-sm truncate">{power.name}</span>
            {isInnate && (
              <span className="text-[10px] px-1 py-0.5 rounded bg-violet-200 text-violet-600 flex-shrink-0">
                ★
              </span>
            )}
          </div>
          {/* ACTION column */}
          <span className="text-xs text-text-secondary truncate">{actionType}</span>
          {/* DAMAGE column */}
          <span className="text-xs text-text-secondary truncate">{damage}</span>
          {/* ENERGY column */}
          <span className={cn(
            'text-xs truncate',
            energyCost > 0 ? 'text-blue-600 font-medium' : 'text-text-muted'
          )}>{energy}</span>
          {/* AREA column */}
          <span className="text-xs text-text-secondary truncate">{area}</span>
          {/* DURATION column */}
          <span className="text-xs text-text-secondary truncate">{duration}</span>
        </button>
        
        {/* Use button - only show when not in edit mode and has energy cost */}
        {!isEditMode && onUse && energyCost > 0 && (
          <button
            onClick={onUse}
            disabled={!canUse}
            className={cn(
              'px-2 py-1 mx-1 text-xs font-medium rounded transition-colors flex-shrink-0 self-center',
              canUse 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-surface text-text-muted cursor-not-allowed'
            )}
            title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
          >
            Use ({energyCost})
          </button>
        )}
        
        {isEditMode && onRemove && (
          <div className="flex-shrink-0 self-center">
            <IconButton
              variant="danger"
              size="sm"
              onClick={onRemove}
              label="Remove power"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
      </div>

      {expanded && hasExpandableContent && (
        <div className="px-3 py-2 bg-surface-alt border-t border-border-light space-y-3">
          {power.description && (
            <p className="text-sm text-text-secondary">{power.description}</p>
          )}
          {/* Range info if available */}
          {power.range && (
            <div className="text-xs text-text-muted">
              <span className="font-medium">Range:</span> {power.range}
            </div>
          )}
          {partChips.length > 0 && (
            <PartChipList 
              parts={partChips} 
              label="Parts" 
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface TechniqueCardProps {
  technique: CharacterTechnique;
  currentEnergy?: number;
  isEditMode?: boolean;
  partsDb?: RTDBPart[];
  onRemove?: () => void;
  onUse?: () => void;
}

function TechniqueCard({ technique, currentEnergy, isEditMode, partsDb = [], onRemove, onUse }: TechniqueCardProps) {
  const [expanded, setExpanded] = useState(false);
  const energyCost = technique.cost ?? 0;
  const canUse = currentEnergy !== undefined && currentEnergy >= energyCost;
  
  // Convert parts to PartData format for chips, enriched with RTDB descriptions
  const partChips = useMemo(() => partsToPartData(technique.parts, partsDb), [technique.parts, partsDb]);
  const hasExpandableContent = technique.description || partChips.length > 0;

  // Display values for vanilla-style columns
  const actionType = technique.actionType || '-';
  const weapon = technique.weaponName || '-';
  const energy = energyCost > 0 ? `${energyCost}` : '-';

  return (
    <div className="border border-border-light rounded-lg overflow-hidden bg-surface">
      {/* Header row with vanilla-style grid layout */}
      <div className="flex items-stretch">
        {/* Main clickable area with grid columns */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-1 items-center px-2 py-2 hover:bg-surface-alt text-left min-w-0"
        >
          {/* NAME column */}
          <div className="flex items-center gap-1.5 min-w-0">
            {expanded ? <ChevronUp className="w-3.5 h-3.5 text-text-muted flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />}
            <span className="font-medium text-text-primary text-sm truncate">{technique.name}</span>
          </div>
          {/* ACTION column */}
          <span className="text-xs text-text-secondary truncate">{actionType}</span>
          {/* WEAPON column */}
          <span className={cn(
            'text-xs truncate',
            weapon !== '-' ? 'text-orange-600' : 'text-text-muted'
          )}>{weapon}</span>
          {/* ENERGY column */}
          <span className={cn(
            'text-xs truncate',
            energyCost > 0 ? 'text-blue-600 font-medium' : 'text-text-muted'
          )}>{energy}</span>
        </button>
        
        {/* Use button - only show when not in edit mode and has energy cost */}
        {!isEditMode && onUse && energyCost > 0 && (
          <button
            onClick={onUse}
            disabled={!canUse}
            className={cn(
              'px-2 py-1 mx-1 text-xs font-medium rounded transition-colors flex-shrink-0 self-center',
              canUse 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-surface text-text-muted cursor-not-allowed'
            )}
            title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
          >
            Use ({energyCost})
          </button>
        )}
        
        {isEditMode && onRemove && (
          <div className="flex-shrink-0 self-center">
            <IconButton
              variant="danger"
              size="sm"
              onClick={onRemove}
              label="Remove technique"
            >
              <X className="w-4 h-4" />
            </IconButton>
          </div>
        )}
      </div>

      {expanded && hasExpandableContent && (
        <div className="px-3 py-2 bg-surface-alt border-t border-border-light space-y-3">
          {technique.description && (
            <p className="text-sm text-text-secondary">{technique.description}</p>
          )}
          {/* Range/Damage info if available */}
          {(technique.range || technique.damage) && (
            <div className="flex flex-wrap gap-3 text-xs text-text-muted">
              {technique.range && (
                <span><span className="font-medium">Range:</span> {technique.range}</span>
              )}
              {technique.damage && (
                <span><span className="font-medium">Damage:</span> {technique.damage}</span>
              )}
            </div>
          )}
          {partChips.length > 0 && (
            <PartChipList 
              parts={partChips} 
              label="Parts" 
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface ItemCardProps {
  item: Item;
  type: 'weapon' | 'armor' | 'equipment';
  isEditMode?: boolean;
  propertiesDb?: RTDBProperty[];
  onRemove?: () => void;
  onToggleEquip?: () => void;
  onRollAttack?: () => void;
  onRollDamage?: () => void;
  onQuantityChange?: (delta: number) => void;
}

function ItemCard({ item, type, isEditMode, propertiesDb = [], onRemove, onToggleEquip, onRollAttack, onRollDamage, onQuantityChange }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Convert properties to PartData format for chips, enriched with RTDB descriptions
  const propertyChips = useMemo(() => propertiesToPartData(item.properties, propertiesDb), [item.properties, propertiesDb]);
  const hasExpandableContent = item.description || propertyChips.length > 0;

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      item.equipped ? 'border-green-300 bg-green-50' : 'border-border-light bg-surface'
    )}>
      <div className="flex items-center">
        {onToggleEquip && (type === 'weapon' || type === 'armor') && (
          <button
            onClick={onToggleEquip}
            className={cn(
              'px-2 py-2 transition-colors',
              item.equipped 
                ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                : 'text-text-muted hover:bg-surface-alt'
            )}
            title={item.equipped ? 'Unequip' : 'Equip'}
          >
            {item.equipped ? '✓' : '○'}
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-surface-alt text-left"
        >
          <div className="flex items-center gap-2">
            {!isEditMode && item.equipped && (
              <span className="text-green-600">✓</span>
            )}
            <span className="font-medium text-text-primary">{item.name}</span>
            {/* Quantity display with optional +/- controls for equipment */}
            {type === 'equipment' && (item.quantity || 1) >= 1 && (
              isEditMode && onQuantityChange ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuantityChange(-1); }}
                    disabled={(item.quantity || 1) <= 1}
                    className={cn(
                      'w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold transition-colors',
                      (item.quantity || 1) > 1
                        ? 'bg-surface hover:bg-surface-alt text-text-secondary'
                        : 'bg-surface text-border-light cursor-not-allowed'
                    )}
                    title="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="text-xs text-text-muted min-w-[1.5rem] text-center">×{item.quantity || 1}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuantityChange(1); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-surface hover:bg-surface-alt text-text-secondary transition-colors"
                    title="Increase quantity"
                  >
                    +
                  </button>
                </div>
              ) : (
                (item.quantity || 1) > 1 && (
                  <span className="text-xs text-text-muted">×{item.quantity}</span>
                )
              )
            )}
            {/* For weapons/armor, show quantity only if > 1 */}
            {type !== 'equipment' && item.quantity && item.quantity > 1 && (
              <span className="text-xs text-text-muted">×{item.quantity}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            {type === 'weapon' && item.damage && (
              <span className="text-red-600 font-medium">{formatDamageDisplay(item.damage)}</span>
            )}
            {type === 'armor' && item.armor !== undefined && (
              <span className="text-blue-600 font-medium">DR {item.armor}</span>
            )}
          </div>
        </button>
        
        {/* Attack/Damage roll buttons for weapons - always visible */}
        {type === 'weapon' && (
          <div className="flex items-center gap-1 pr-2">
            {onRollAttack && (
              <RollButton
                value={0}
                displayValue="⚔️ Atk"
                onClick={onRollAttack}
                size="sm"
                title="Roll attack"
              />
            )}
            {onRollDamage && item.damage && (
              <RollButton
                value={0}
                displayValue="💥 Dmg"
                variant="danger"
                onClick={onRollDamage}
                size="sm"
                title="Roll damage"
              />
            )}
          </div>
        )}
        
        {isEditMode && onRemove && (
          <IconButton
            variant="danger"
            size="sm"
            onClick={onRemove}
            label="Remove item"
          >
            <X className="w-4 h-4" />
          </IconButton>
        )}
      </div>

      {expanded && hasExpandableContent && (
        <div className="px-3 py-2 bg-surface-alt border-t border-border-light space-y-3">
          {item.description && (
            <p className="text-sm text-text-secondary">{item.description}</p>
          )}
          {propertyChips.length > 0 && (
            <PartChipList 
              parts={propertyChips} 
              label="Properties" 
              size="sm"
            />
          )}
        </div>
      )}
    </div>
  );
}

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
    <div className={cn("bg-surface rounded-xl shadow-md p-4 md:p-6 relative", className)}>
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

      {/* Armament Proficiency Display - only for weapons/armor/equipment tabs */}
      {activeTab === 'inventory' && martialProficiency !== undefined && (
        <div className="mb-3 px-3 py-2 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-secondary">⚔️ Armament Proficiency:</span>
            <span className="font-bold text-orange-600">{calculateArmamentProficiency(martialProficiency)} TP</span>
            <span className="text-xs text-text-muted">(Max training points)</span>
          </div>
        </div>
      )}

      {/* Currency + Add Button Row - only show for inventory tab */}
      {activeTab === 'inventory' && (
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-muted">💰</span>
            {/* Currency is ALWAYS editable, not just in edit mode */}
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
              className="w-20 px-2 py-1 text-sm font-bold text-amber-600 border border-amber-300 rounded focus:ring-2 focus:ring-amber-500"
              title="Use +5, -10, or a number"
            />
            <span className="text-sm text-text-muted">currency</span>
          </div>
          
          {activeTabData?.onAdd && (
            <Button
              variant="success"
              size="sm"
              onClick={activeTabData.onAdd}
            >
              <Plus className="w-4 h-4" />
              Add
            </Button>
          )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 flex-1 min-h-0 overflow-y-auto">
        {activeTab === 'powers' && (
          <>
            {/* Add Power button - always visible at top of tab */}
            {activeTabData?.onAdd && (
              <div className="flex justify-end mb-3">
                <Button
                  variant="success"
                  size="sm"
                  onClick={activeTabData.onAdd}
                >
                  <Plus className="w-4 h-4" />
                  Add Power
                </Button>
              </div>
            )}

            {/* Powers Column Headers - like vanilla site */}
            {powers.length > 0 && (
              <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr_0.7fr_0.7fr] gap-1 px-2 py-1.5 bg-surface-alt border-b border-border-light text-xs font-semibold text-text-muted uppercase tracking-wide">
                <span className="pl-5">Name</span>
                <span>Action</span>
                <span>Damage</span>
                <span>Energy</span>
                <span>Area</span>
                <span>Duration</span>
              </div>
            )}

            {/* Innate Energy Tracking Box - shows when character has innate energy */}
            {innateEnergy > 0 && (
              <div className="p-3 bg-gradient-to-r from-violet-50 to-indigo-50 border border-violet-200 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-violet-600">✨ Innate Energy</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-violet-100 text-violet-600 rounded">
                        Threshold: {innateThreshold}
                      </span>
                      <span className="text-text-muted">×</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                        Pools: {innatePools}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-violet-600">
                      {currentInnateEnergy !== undefined ? currentInnateEnergy : innateEnergy}
                    </span>
                    <span className="text-sm text-text-muted">/ {innateEnergy}</span>
                  </div>
                </div>
                <p className="text-xs text-text-muted mt-1">
                  Innate powers use this energy pool instead of regular energy
                </p>
              </div>
            )}

            {/* Innate Powers Section */}
            {powers.filter(p => p.innate === true).length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 px-2 py-1 bg-violet-50 border border-violet-200 rounded">
                  <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">
                    ★ Innate Powers
                  </span>
                  <span className="text-xs text-violet-500">
                    ({powers.filter(p => p.innate === true).length} power{powers.filter(p => p.innate === true).length !== 1 ? 's' : ''})
                  </span>
                </div>
                {powers
                  .filter(p => p.innate === true)
                  .map((power, i) => (
                    <PowerCard 
                      key={power.id || `innate-${i}`} 
                      power={power} 
                      innateEnergy={innateEnergy}
                      currentEnergy={currentEnergy}
                      isEditMode={isEditMode}
                      partsDb={powerPartsDb}
                      onRemove={onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
                      onToggleInnate={onTogglePowerInnate ? (isInnate) => onTogglePowerInnate(power.id || String(i), isInnate) : undefined}
                      onUse={onUsePower && power.cost ? () => onUsePower(power.id || String(i), power.cost!) : undefined}
                    />
                  ))}
              </div>
            )}

            {/* Regular Powers Section */}
            {powers.filter(p => p.innate !== true).length > 0 && (
              <div className="space-y-2">
                {powers.filter(p => p.innate === true).length > 0 && (
                  <div className="flex items-center gap-2 px-2 py-1 bg-blue-50 border border-blue-200 rounded">
                    <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                      Regular Powers
                    </span>
                  </div>
                )}
                {powers
                  .filter(p => p.innate !== true)
                  .map((power, i) => (
                    <PowerCard 
                      key={power.id || `regular-${i}`} 
                      power={power} 
                      innateEnergy={innateEnergy}
                      currentEnergy={currentEnergy}
                      isEditMode={isEditMode}
                      partsDb={powerPartsDb}
                      onRemove={onRemovePower ? () => onRemovePower(power.id || String(i)) : undefined}
                      onToggleInnate={onTogglePowerInnate ? (isInnate) => onTogglePowerInnate(power.id || String(i), isInnate) : undefined}
                      onUse={onUsePower && power.cost ? () => onUsePower(power.id || String(i), power.cost!) : undefined}
                    />
                  ))}
              </div>
            )}

            {/* Empty state */}
            {powers.length === 0 && (
              <p className="text-text-muted text-sm italic text-center py-4">
                No powers learned
              </p>
            )}
          </>
        )}

        {activeTab === 'techniques' && (
          <>
            {/* Add Technique button - always visible at top of tab */}
            {activeTabData?.onAdd && (
              <div className="flex justify-end mb-3">
                <Button
                  variant="success"
                  size="sm"
                  onClick={activeTabData.onAdd}
                >
                  <Plus className="w-4 h-4" />
                  Add Technique
                </Button>
              </div>
            )}

            {/* Techniques Column Headers - like vanilla site */}
            {techniques.length > 0 && (
              <div className="grid grid-cols-[1.4fr_1fr_1fr_0.8fr] gap-1 px-2 py-1.5 bg-surface-alt border-b border-border-light text-xs font-semibold text-text-muted uppercase tracking-wide">
                <span className="pl-5">Name</span>
                <span>Action</span>
                <span>Weapon</span>
                <span>Energy</span>
              </div>
            )}
            {techniques.length > 0 ? (
              techniques.map((tech, i) => (
                <TechniqueCard 
                  key={tech.id || i} 
                  technique={tech}
                  currentEnergy={currentEnergy}
                  isEditMode={isEditMode}
                  partsDb={techniquePartsDb}
                  onRemove={onRemoveTechnique ? () => onRemoveTechnique(tech.id || String(i)) : undefined}
                  onUse={onUseTechnique && tech.cost ? () => onUseTechnique(tech.id || String(i), tech.cost!) : undefined}
                />
              ))
            ) : (
              <p className="text-text-muted text-sm italic text-center py-4">
                No techniques learned
              </p>
            )}
          </>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Weapons Section */}
            <div>
              <SectionHeader 
                title="Weapons" 
                count={weapons.length}
                onAdd={onAddWeapon}
                addLabel="Add weapon"
              />
              {/* Column headers for weapon actions */}
              {weapons.length > 0 && (
                <div className="flex items-center justify-end gap-2 text-xs text-text-muted mb-1 pr-2">
                  <span className="w-16 text-center">Attack</span>
                  <span className="w-16 text-center">Damage</span>
                </div>
              )}
              {/* Weapons list */}
              {weapons.length > 0 ? (
                weapons.map((item, i) => {
                  const attackBonus = (item as Item & { attackBonus?: number }).attackBonus ?? 0;
                  return (
                    <ItemCard 
                      key={item.id || i} 
                      item={item} 
                      type="weapon"
                      isEditMode={isEditMode}
                      propertiesDb={itemPropertiesDb}
                      onRemove={onRemoveWeapon ? () => onRemoveWeapon(item.id || String(i)) : undefined}
                      onToggleEquip={onToggleEquipWeapon ? () => onToggleEquipWeapon(item.id || String(i)) : undefined}
                      onRollAttack={rollContext ? () => rollContext.rollAttack(item.name, attackBonus) : undefined}
                      onRollDamage={rollContext && item.damage && typeof item.damage === 'string' ? () => rollContext.rollDamage(item.damage as string) : undefined}
                    />
                  );
                })
              ) : (
                <p className="text-text-muted text-sm italic text-center py-2">No weapons (see Unarmed Prowess in Archetype section)</p>
              )}
            </div>
            
            {/* Armor Section */}
            <div>
              <SectionHeader 
                title="Armor" 
                count={armor.length}
                onAdd={onAddArmor}
                addLabel="Add armor"
              />
              {armor.length > 0 ? (
                armor.map((item, i) => (
                  <ItemCard 
                    key={item.id || i} 
                    item={item} 
                    type="armor"
                    isEditMode={isEditMode}
                    propertiesDb={itemPropertiesDb}
                    onRemove={onRemoveArmor ? () => onRemoveArmor(item.id || String(i)) : undefined}
                    onToggleEquip={onToggleEquipArmor ? () => onToggleEquipArmor(item.id || String(i)) : undefined}
                  />
                ))
              ) : (
                <p className="text-text-muted text-sm italic text-center py-2">No armor</p>
              )}
            </div>
            
            {/* Equipment Section */}
            <div>
              <SectionHeader 
                title="Equipment" 
                count={equipment.length}
                onAdd={onAddEquipment}
                addLabel="Add equipment"
              />
              {equipment.length > 0 ? (
                equipment.map((item, i) => (
                  <ItemCard 
                    key={item.id || i} 
                    item={item} 
                    type="equipment"
                    isEditMode={isEditMode}
                    propertiesDb={itemPropertiesDb}
                    onRemove={onRemoveEquipment ? () => onRemoveEquipment(item.id || String(i)) : undefined}
                    onQuantityChange={onEquipmentQuantityChange ? (delta) => onEquipmentQuantityChange(item.id || String(i), delta) : undefined}
                  />
                ))
              ) : (
                <p className="text-text-muted text-sm italic text-center py-2">No equipment</p>
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
            abilities={abilities}
            isEditMode={isEditMode}
            onWeightChange={onWeightChange}
            onHeightChange={onHeightChange}
            onAppearanceChange={onAppearanceChange}
            onArchetypeDescChange={onArchetypeDescChange}
            onNotesChange={onNotesChange}
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
