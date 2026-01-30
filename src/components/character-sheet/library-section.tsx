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
import { PartChipList, type PartData, EditSectionToggle } from '@/components/shared';
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

// Helper to convert power/technique parts to PartData format, with optional RTDB enrichment
function partsToPartData(
  parts?: CharacterPower['parts'] | CharacterTechnique['parts'],
  rtdbParts: RTDBPart[] = []
): PartData[] {
  if (!parts || parts.length === 0) return [];
  
  return parts.map(part => {
    if (typeof part === 'string') {
      // String-only part - look up in RTDB for description
      const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === part.toLowerCase());
      return { 
        name: part,
        description: rtdbPart?.description,
        tpCost: rtdbPart?.base_tp,
      };
    }
    
    // Full part data with TP info - still try to get description from RTDB
    const partName = part.name || part.id || 'Unknown Part';
    const rtdbPart = rtdbParts.find(p => p.name?.toLowerCase() === partName.toLowerCase());
    
    const tpCost = (part.base_tp ?? 0) + 
                   (part.op_1_tp ?? 0) * (part.op_1_lvl ?? 0) + 
                   (part.op_2_tp ?? 0) * (part.op_2_lvl ?? 0) + 
                   (part.op_3_tp ?? 0) * (part.op_3_lvl ?? 0);
    
    return {
      name: partName,
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

// Helper to convert item properties to PartData format
function propertiesToPartData(properties?: Item['properties']): PartData[] {
  if (!properties || properties.length === 0) return [];
  
  return properties.map(prop => {
    if (typeof prop === 'string') {
      return { name: prop, category: 'property' };
    }
    // ItemProperty has id, name, value - no description
    return { 
      name: prop.name, 
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
  // Parts RTDB data for enrichment (descriptions, TP costs)
  powerPartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  techniquePartsDb?: Array<{ id: string; name: string; description?: string; base_tp?: number; op_1_tp?: number; op_2_tp?: number; op_3_tp?: number }>;
  // Feats tab props
  ancestry?: {
    selectedTraits?: string[];
    selectedFlaw?: string;
    selectedCharacteristic?: string;
  };
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
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onTraitUsesChange?: (traitName: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
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

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      isInnate ? 'border-purple-300 bg-purple-50' : 'border-neutral-200 bg-white'
    )}>
      <div className="flex items-center">
        {/* Innate toggle checkbox in edit mode */}
        {isEditMode && onToggleInnate && (
          <button
            onClick={() => onToggleInnate(!isInnate)}
            className={cn(
              'px-2 py-2 transition-colors border-r',
              isInnate 
                ? 'text-purple-600 bg-purple-100 hover:bg-purple-200' 
                : 'text-text-muted hover:bg-neutral-100'
            )}
            title={isInnate ? 'Remove from innate' : 'Set as innate'}
          >
            {isInnate ? '★' : '☆'}
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-neutral-50 text-left"
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            <span className="font-medium text-text-primary">{power.name}</span>
            {isInnate && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-purple-200 text-purple-700">
                Innate
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            {energyCost > 0 && (
              <span className="text-blue-600 font-medium">{energyCost} EP</span>
            )}
            {power.level && (
              <span>Lvl {power.level}</span>
            )}
          </div>
        </button>
        
        {/* Use button - only show when not in edit mode and has energy cost */}
        {!isEditMode && onUse && energyCost > 0 && (
          <button
            onClick={onUse}
            disabled={!canUse}
            className={cn(
              'px-2 py-1 mx-1 text-xs font-medium rounded transition-colors',
              canUse 
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                : 'bg-neutral-100 text-text-muted cursor-not-allowed'
            )}
            title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
          >
            Use ({energyCost})
          </button>
        )}
        
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove power"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && hasExpandableContent && (
        <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100 space-y-3">
          {power.description && (
            <p className="text-sm text-text-secondary">{power.description}</p>
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
  const hasExpandableContent = technique.description || partChips.length > 0 || technique.weaponName || technique.actionType;

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white">
      <div className="flex items-center">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-neutral-50 text-left"
        >
          <div className="flex items-center gap-2">
            {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
            <span className="font-medium text-text-primary">{technique.name}</span>
            {/* Weapon requirement badge */}
            {technique.weaponName && technique.weaponName !== 'Unarmed' && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">
                ⚔️ {technique.weaponName}
              </span>
            )}
          </div>
          {energyCost > 0 && (
            <span className="text-sm text-blue-600 font-medium">{energyCost} EP</span>
          )}
        </button>
        
        {/* Use button - only show when not in edit mode and has energy cost */}
        {!isEditMode && onUse && energyCost > 0 && (
          <button
            onClick={onUse}
            disabled={!canUse}
            className={cn(
              'px-2 py-1 mx-1 text-xs font-medium rounded transition-colors',
              canUse 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-neutral-100 text-text-muted cursor-not-allowed'
            )}
            title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
          >
            Use ({energyCost})
          </button>
        )}
        
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove technique"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && hasExpandableContent && (
        <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100 space-y-3">
          {/* Action Type and Weapon info */}
          {(technique.actionType || technique.weaponName) && (
            <div className="flex flex-wrap gap-2 text-xs">
              {technique.actionType && (
                <span className="px-2 py-1 rounded bg-blue-100 text-blue-700">
                  ⚡ {technique.actionType}
                </span>
              )}
              {technique.weaponName && (
                <span className="px-2 py-1 rounded bg-orange-100 text-orange-700">
                  ⚔️ {technique.weaponName}
                </span>
              )}
            </div>
          )}
          {technique.description && (
            <p className="text-sm text-text-secondary">{technique.description}</p>
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
  onRemove?: () => void;
  onToggleEquip?: () => void;
  onRollAttack?: () => void;
  onRollDamage?: () => void;
  onQuantityChange?: (delta: number) => void;
}

function ItemCard({ item, type, isEditMode, onRemove, onToggleEquip, onRollAttack, onRollDamage, onQuantityChange }: ItemCardProps) {
  const [expanded, setExpanded] = useState(false);
  
  // Convert properties to PartData format for chips
  const propertyChips = useMemo(() => propertiesToPartData(item.properties), [item.properties]);
  const hasExpandableContent = item.description || propertyChips.length > 0;

  return (
    <div className={cn(
      'border rounded-lg overflow-hidden',
      item.equipped ? 'border-green-300 bg-green-50' : 'border-neutral-200 bg-white'
    )}>
      <div className="flex items-center">
        {isEditMode && onToggleEquip && (type === 'weapon' || type === 'armor') && (
          <button
            onClick={onToggleEquip}
            className={cn(
              'px-2 py-2 transition-colors',
              item.equipped 
                ? 'text-green-600 bg-green-100 hover:bg-green-200' 
                : 'text-text-muted hover:bg-neutral-100'
            )}
            title={item.equipped ? 'Unequip' : 'Equip'}
          >
            {item.equipped ? '✓' : '○'}
          </button>
        )}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex-1 flex items-center justify-between px-3 py-2 hover:bg-neutral-50 text-left"
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
                        ? 'bg-neutral-200 hover:bg-neutral-300 text-text-secondary'
                        : 'bg-neutral-100 text-neutral-300 cursor-not-allowed'
                    )}
                    title="Decrease quantity"
                  >
                    −
                  </button>
                  <span className="text-xs text-text-muted min-w-[1.5rem] text-center">×{item.quantity || 1}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); onQuantityChange(1); }}
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-neutral-200 hover:bg-neutral-300 text-text-secondary transition-colors"
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
        
        {/* Attack/Damage roll buttons for weapons */}
        {type === 'weapon' && !isEditMode && (
          <div className="flex items-center gap-1 pr-2">
            {onRollAttack && (
              <button
                onClick={onRollAttack}
                className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                title="Roll attack"
              >
                ⚔️ Atk
              </button>
            )}
            {onRollDamage && item.damage && (
              <button
                onClick={onRollDamage}
                className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
                title="Roll damage"
              >
                💥 Dmg
              </button>
            )}
          </div>
        )}
        
        {isEditMode && onRemove && (
          <button
            onClick={onRemove}
            className="p-2 text-red-500 hover:bg-red-50 transition-colors"
            title="Remove item"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {expanded && hasExpandableContent && (
        <div className="px-3 py-2 bg-neutral-50 border-t border-neutral-100 space-y-3">
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
  powerPartsDb = [],
  techniquePartsDb = [],
  // Feats props
  ancestry,
  traitsDb = [],
  traitUses = {},
  archetypeFeats = [],
  characterFeats = [],
  onFeatUsesChange,
  onTraitUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
}: LibrarySectionProps) {
  const [activeTab, setActiveTab] = useState<TabType>('powers');
  const [currencyInput, setCurrencyInput] = useState(currency.toString());
  const rollContext = useRollsOptional();
  
  // NOTE: Unarmed Prowess is now shown in the Archetype section, not here

  const tabs: { id: TabType; label: string; count?: number; onAdd?: () => void }[] = [
    { id: 'powers', label: 'Powers', count: powers.length, onAdd: onAddPower },
    { id: 'techniques', label: 'Techniques', count: techniques.length, onAdd: onAddTechnique },
    { id: 'inventory', label: 'Inventory', count: weapons.length + armor.length + equipment.length },
    { id: 'feats', label: 'Feats', count: archetypeFeats.length + characterFeats.length },
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
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6 relative">
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
        tabs={tabs.map(t => ({ id: t.id, label: t.label, count: t.count }))}
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

      {/* Currency + Add Button Row - only show for inventory-related tabs */}
      {['powers', 'techniques', 'inventory'].includes(activeTab) && (
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
          
          {isEditMode && activeTabData?.onAdd && (
            <button
              onClick={activeTabData.onAdd}
              className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 hover:bg-green-200 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
            Add
          </button>
        )}
        </div>
      )}

      {/* Content */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {activeTab === 'powers' && (
          <>
            {/* Innate Energy Tracking Box - shows when character has innate energy */}
            {innateEnergy > 0 && (
              <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-purple-700">✨ Innate Energy</span>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        Threshold: {innateThreshold}
                      </span>
                      <span className="text-text-muted">×</span>
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded">
                        Pools: {innatePools}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-purple-600">
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
                <div className="flex items-center gap-2 px-2 py-1 bg-purple-50 border border-purple-200 rounded">
                  <span className="text-xs font-semibold text-purple-700 uppercase tracking-wide">
                    ★ Innate Powers
                  </span>
                  <span className="text-xs text-purple-600">
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
          techniques.length > 0 ? (
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
          )
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
            {/* Weapons Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Weapons</h4>
                {isEditMode && onAddWeapon && (
                  <button
                    onClick={onAddWeapon}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 text-text-secondary rounded hover:bg-neutral-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
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
                      onRemove={onRemoveWeapon ? () => onRemoveWeapon(item.id || String(i)) : undefined}
                      onToggleEquip={onToggleEquipWeapon ? () => onToggleEquipWeapon(item.id || String(i)) : undefined}
                      onRollAttack={rollContext ? () => rollContext.rollAttack(item.name, attackBonus) : undefined}
                      onRollDamage={rollContext && item.damage ? () => rollContext.rollDamage(item.damage as string) : undefined}
                    />
                  );
                })
              ) : (
                <p className="text-text-muted text-sm italic text-center py-2">No weapons (see Unarmed Prowess in Archetype section)</p>
              )}
            </div>
            
            {/* Armor Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Armor</h4>
                {isEditMode && onAddArmor && (
                  <button
                    onClick={onAddArmor}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 text-text-secondary rounded hover:bg-neutral-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
              {armor.length > 0 ? (
                armor.map((item, i) => (
                  <ItemCard 
                    key={item.id || i} 
                    item={item} 
                    type="armor"
                    isEditMode={isEditMode}
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
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold text-text-muted uppercase tracking-wide">Equipment</h4>
                {isEditMode && onAddEquipment && (
                  <button
                    onClick={onAddEquipment}
                    className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-neutral-100 text-text-secondary rounded hover:bg-neutral-200 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Add
                  </button>
                )}
              </div>
              {equipment.length > 0 ? (
                equipment.map((item, i) => (
                  <ItemCard 
                    key={item.id || i} 
                    item={item} 
                    type="equipment"
                    isEditMode={isEditMode}
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
            traitsDb={traitsDb}
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
