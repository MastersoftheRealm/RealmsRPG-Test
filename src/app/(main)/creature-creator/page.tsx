/**
 * Creature Creator Page
 * =====================
 * Tool for creating custom creatures and NPCs
 * Full-featured version matching vanilla functionality
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { addDoc, collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { LoginPromptModal, GridListRow } from '@/components/shared';
import { useAuthStore } from '@/stores/auth-store';
import { useUserPowers, useUserTechniques, useUserItems, useUserCreatures, usePowerParts, useTechniqueParts, useCreatureFeats, useItemProperties, useRTDBSkills } from '@/hooks';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import { deriveItemDisplay } from '@/lib/calculators/item-calc';
import { 
  calculateCreatureTrainingPoints, 
  calculateCreatureCurrency,
  calculateCreatureFeatPoints,
  calculateHealthEnergyPool,
  calculateProficiency,
  calculateAbilityPoints,
  calculateSkillPoints,
  calculateSkillBonusWithProficiency,
} from '@/lib/game/formulas';
import { CREATURE_FEAT_IDS, MECHANICAL_CREATURE_FEAT_IDS } from '@/lib/id-constants';
import {
  CREATURE_TYPES,
  CREATURE_SIZES,
  CONDITIONS,
  CREATOR_CACHE_KEYS,
} from '@/lib/game/creator-constants';
import {
  HealthEnergyAllocator,
  AbilityScoreEditor,
  ArchetypeSelector,
  CollapsibleSection,
  CreatorSummaryPanel,
  type ArchetypeType,
} from '@/components/creator';
import type { AbilityName } from '@/types';

// =============================================================================
// Creature-specific Constants
// =============================================================================

const LEVEL_OPTIONS = [
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '1/2' },
  { value: 0.75, label: '3/4' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
];

// Damage types with proper capitalization for creatures (display only)
const DAMAGE_TYPES = [
  'Bludgeoning', 'Piercing', 'Slashing', 'Magic', 'Fire', 'Ice', 
  'Lightning', 'Spiritual', 'Sonic', 'Poison', 'Necrotic', 'Acid', 'Psychic'
];

const SENSES = [
  { value: 'Darkvision', label: 'Darkvision (6 spaces)', description: 'See in darkness up to 6 spaces as if it were dim light.' },
  { value: 'Darkvision II', label: 'Darkvision II (12 spaces)', description: 'See in darkness up to 12 spaces as if it were dim light.' },
  { value: 'Darkvision III', label: 'Darkvision III (24 spaces)', description: 'See in darkness up to 24 spaces as if it were dim light.' },
  { value: 'Blindsense', label: 'Blindsense (3 spaces)', description: 'Detect creatures within 3 spaces without relying on sight.' },
  { value: 'Blindsense II', label: 'Blindsense II (6 spaces)', description: 'Detect creatures within 6 spaces without relying on sight.' },
  { value: 'Blindsense III', label: 'Blindsense III (12 spaces)', description: 'Detect creatures within 12 spaces without relying on sight.' },
  { value: 'Amphibious', label: 'Amphibious', description: 'Can breathe air and water.' },
  { value: 'All-Surface Climber', label: 'All-Surface Climber', description: 'Can climb difficult surfaces, including upside down on ceilings, without needing to make an ability check.' },
  { value: 'Telepathy', label: 'Telepathy (12 spaces)', description: 'Mentally communicate with creatures within 12 spaces.' },
  { value: 'Telepathy II', label: 'Telepathy II (48 spaces)', description: 'Mentally communicate with creatures within 48 spaces.' },
  { value: 'Waterbreathing', label: 'Waterbreathing', description: 'Can breathe underwater.' },
  { value: 'Unrestrained Movement', label: 'Unrestrained Movement', description: 'Movement is unaffected by difficult terrain, and spells and magical effects can neither reduce speed nor cause paralysis or restraint.' },
];

const MOVEMENT_TYPES = [
  { value: 'Fly Half', label: 'Flying (Half Speed)', description: 'Gains a flying speed equal to half its walking speed.' },
  { value: 'Fly', label: 'Flying II (Full Speed)', description: 'Gains a flying speed equal to its walking speed.' },
  { value: 'Burrow', label: 'Burrow (Half Speed)', description: 'Gains a burrowing speed equal to half its walking speed.' },
  { value: 'Burrow II', label: 'Burrow II (Full Speed)', description: 'Gains a burrowing speed equal to its walking speed.' },
  { value: 'Jump', label: 'Jump (Long 3, High 2)', description: 'Long jump of 3 spaces and high jump of 2 spaces, with or without a running start.' },
  { value: 'Jump II', label: 'Jump II (Long 4, High 3)', description: 'Long jump of 4 spaces and high jump of 3 spaces, with or without a running start.' },
  { value: 'Jump III', label: 'Jump III (Long 5, High 4)', description: 'Long jump of 5 spaces and high jump of 4 spaces, with or without a running start.' },
  { value: 'Speedy', label: 'Speedy (+2 spaces)', description: 'Walking speed is increased by 2 spaces.' },
  { value: 'Speedy II', label: 'Speedy II (+4 spaces)', description: 'Walking speed is increased by 4 spaces.' },
  { value: 'Speedy III', label: 'Speedy III (+6 spaces)', description: 'Walking speed is increased by 6 spaces.' },
  { value: 'Slow', label: 'Slow (-2 spaces)', description: 'Walking speed is reduced by 2 spaces.' },
  { value: 'Hover', label: 'Hover', description: 'Can remain in the air without expending movement (requires a flying speed).' },
];

// CONDITIONS and SKILLS imported from '@/lib/game/creator-constants'

// Map sense/movement values to their creature feat IDs
const SENSE_TO_FEAT_ID: Record<string, number> = {
  'Darkvision': CREATURE_FEAT_IDS.DARKVISION,
  'Darkvision II': CREATURE_FEAT_IDS.DARKVISION_II,
  'Darkvision III': CREATURE_FEAT_IDS.DARKVISION_III,
  'Blindsense': CREATURE_FEAT_IDS.BLINDSENSE,
  'Blindsense II': CREATURE_FEAT_IDS.BLINDSENSE_II,
  'Blindsense III': CREATURE_FEAT_IDS.BLINDSENSE_III,
  'Amphibious': CREATURE_FEAT_IDS.AMPHIBIOUS,
  'All-Surface Climber': CREATURE_FEAT_IDS.ALL_SURFACE_CLIMBER,
  'Telepathy': CREATURE_FEAT_IDS.TELEPATHY,
  'Telepathy II': CREATURE_FEAT_IDS.TELEPATHY_II,
  'Waterbreathing': CREATURE_FEAT_IDS.WATERBREATHING,
  'Unrestrained Movement': CREATURE_FEAT_IDS.UNRESTRAINED_MOVEMENT,
};

const MOVEMENT_TO_FEAT_ID: Record<string, number> = {
  'Fly Half': CREATURE_FEAT_IDS.FLYING,
  'Fly': CREATURE_FEAT_IDS.FLYING_II,
  'Burrow': CREATURE_FEAT_IDS.BURROW,
  'Burrow II': CREATURE_FEAT_IDS.BURROW_II,
  'Jump': CREATURE_FEAT_IDS.JUMP,
  'Jump II': CREATURE_FEAT_IDS.JUMP_II,
  'Jump III': CREATURE_FEAT_IDS.JUMP_III,
  'Speedy': CREATURE_FEAT_IDS.SPEEDY,
  'Speedy II': CREATURE_FEAT_IDS.SPEEDY_II,
  'Speedy III': CREATURE_FEAT_IDS.SPEEDY_III,
  'Slow': CREATURE_FEAT_IDS.SLOW,
  'Hover': CREATURE_FEAT_IDS.HOVER,
};

// =============================================================================
// Types
// =============================================================================

interface CreaturePower {
  id: string;
  name: string;
  energy: number;
  action: string;
  duration: string;
  range: string;
  area: string;
  damage: string;
}

interface CreatureTechnique {
  id: string;
  name: string;
  energy: number;
  tp: number;
  action: string;
  weapon: string;
  damage: string;
}

interface CreatureFeat {
  id: string;
  name: string;
  description?: string;
  points?: number;
}

interface CreatureArmament {
  id: string;
  name: string;
  type: string;
  tp: number;
  currency: number;
  rarity: string;
}

interface CreatureSkill {
  name: string;
  value: number;
  proficient: boolean;
}

interface CreatureState {
  name: string;
  level: number;
  type: string;
  size: string;
  description: string;
  archetypeType: ArchetypeType;
  abilities: {
    strength: number;
    vitality: number;
    agility: number;
    acuity: number;
    intelligence: number;
    charisma: number;
  };
  defenses: {
    might: number;
    fortitude: number;
    reflex: number;
    discernment: number;
    mentalFortitude: number;
    resolve: number;
  };
  hitPoints: number;
  energyPoints: number;
  powerProficiency: number;
  martialProficiency: number;
  resistances: string[];
  weaknesses: string[];
  immunities: string[];
  conditionImmunities: string[];
  senses: string[];
  movementTypes: string[];
  languages: string[];
  skills: CreatureSkill[];
  powers: CreaturePower[];
  techniques: CreatureTechnique[];
  feats: CreatureFeat[];
  armaments: CreatureArmament[];
  // Optional section toggles
  enablePowers: boolean;
  enableTechniques: boolean;
  enableArmaments: boolean;
}

const initialState: CreatureState = {
  name: '',
  level: 1,
  type: 'Humanoid',
  size: 'medium',
  description: '',
  archetypeType: 'power',
  abilities: {
    strength: 0,
    vitality: 0,
    agility: 0,
    acuity: 0,
    intelligence: 0,
    charisma: 0,
  },
  defenses: {
    might: 0,
    fortitude: 0,
    reflex: 0,
    discernment: 0,
    mentalFortitude: 0,
    resolve: 0,
  },
  hitPoints: 0,
  energyPoints: 0,
  powerProficiency: 2,
  martialProficiency: 0,
  enablePowers: false,
  enableTechniques: false,
  enableArmaments: false,
  resistances: [],
  weaknesses: [],
  immunities: [],
  conditionImmunities: [],
  senses: [],
  movementTypes: [],
  languages: [],
  skills: [],
  powers: [],
  techniques: [],
  feats: [],
  armaments: [],
};

// =============================================================================
// Helper Components
// =============================================================================

function ChipList({ 
  items, 
  onRemove, 
  color = 'bg-gray-100' 
}: { 
  items: string[]; 
  onRemove: (item: string) => void;
  color?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-gray-400 italic">None</p>;
  
  return (
    <div className="flex flex-wrap gap-1">
      {items.map(item => (
        <span 
          key={item} 
          className={cn('px-2 py-1 rounded text-sm flex items-center gap-1', color)}
        >
          {item}
          <button 
            onClick={() => onRemove(item)} 
            className="text-gray-500 hover:text-red-500"
          >
            ×
          </button>
        </span>
      ))}
    </div>
  );
}

function ExpandableChipList({ 
  items, 
  onRemove, 
  color = 'bg-gray-100',
  descriptions
}: { 
  items: string[]; 
  onRemove: (item: string) => void;
  color?: string;
  descriptions: Record<string, string>;
}) {
  if (items.length === 0) return <p className="text-sm text-gray-400 italic">None</p>;
  
  return (
    <div className="flex flex-col gap-2">
      {items.map(item => {
        const description = descriptions[item];
        
        return (
          <GridListRow
            key={item}
            id={item}
            name={item}
            description={description}
            onDelete={() => onRemove(item)}
            compact
            className={color}
          />
        );
      })}
    </div>
  );
}

function AddItemDropdown({
  options,
  selectedItems,
  onAdd,
  placeholder,
}: {
  options: readonly { value: string; label: string }[] | readonly string[];
  selectedItems: readonly string[];
  onAdd: (item: string) => void;
  placeholder: string;
}) {
  const [selectedValue, setSelectedValue] = useState('');
  
  const normalizedOptions = [...options].map(opt => 
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  
  const availableOptions = normalizedOptions.filter(
    opt => !selectedItems.includes(opt.value)
  );
  
  const handleAdd = () => {
    if (selectedValue) {
      onAdd(selectedValue);
      setSelectedValue('');
    }
  };
  
  return (
    <div className="flex gap-2 mt-2">
      <select
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
      >
        <option value="">{placeholder}</option>
        {availableOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <button
        onClick={handleAdd}
        disabled={!selectedValue}
        className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
      >
        Add
      </button>
    </div>
  );
}

function DefenseBlock({
  name,
  baseValue,
  bonusValue,
  onChange,
}: {
  name: string;
  baseValue: number;
  bonusValue: number;
  onChange: (value: number) => void;
}) {
  const totalValue = 10 + baseValue + bonusValue;
  
  return (
    <div className="p-3 bg-gray-50 rounded-lg text-center">
      <label className="block text-xs font-medium text-gray-500 mb-1 uppercase">
        {name}
      </label>
      <div className="text-2xl font-bold text-gray-900 mb-1">{totalValue}</div>
      <div className="flex items-center justify-center gap-1">
        <button
          onClick={() => onChange(Math.max(0, bonusValue - 1))}
          disabled={bonusValue <= 0}
          className={cn(
            'w-6 h-6 rounded flex items-center justify-center text-sm',
            bonusValue <= 0 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-red-100 text-red-700 hover:bg-red-200'
          )}
        >
          −
        </button>
        <span className="text-xs text-gray-500 w-8">+{bonusValue}</span>
        <button
          onClick={() => onChange(bonusValue + 1)}
          className="w-6 h-6 rounded bg-green-100 text-green-700 hover:bg-green-200 flex items-center justify-center text-sm"
        >
          +
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Modal Components
// =============================================================================

function LoadPowerModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (power: CreaturePower) => void;
}) {
  const { data: userPowers = [] } = useUserPowers();
  const { data: partsDb = [] } = usePowerParts();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Select a Power</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {userPowers.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No powers in your library</p>
          ) : (
            <div className="space-y-2">
              {userPowers.map(power => {
                const display = derivePowerDisplay(
                  { name: power.name, description: power.description, parts: power.parts || [], damage: power.damage },
                  partsDb
                );
                const damageStr = formatPowerDamage(power.damage);
                
                return (
                  <button
                    key={power.docId}
                    onClick={() => {
                      onSelect({
                        id: power.docId,
                        name: power.name,
                        energy: display.energy,
                        action: display.actionType,
                        duration: display.duration,
                        range: display.range,
                        area: display.area,
                        damage: damageStr,
                      });
                      onClose();
                    }}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200"
                  >
                    <div className="font-medium">{power.name}</div>
                    <div className="text-sm text-gray-500">
                      EN: {display.energy} | {display.actionType} | {display.range}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadTechniqueModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (technique: CreatureTechnique) => void;
}) {
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: partsDb = [] } = useTechniqueParts();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Select a Technique</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {userTechniques.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No techniques in your library</p>
          ) : (
            <div className="space-y-2">
              {userTechniques.map(tech => {
                const display = deriveTechniqueDisplay(
                  { name: tech.name, description: tech.description, parts: tech.parts || [], damage: tech.damage?.[0], weapon: tech.weapon },
                  partsDb
                );
                
                return (
                  <button
                    key={tech.docId}
                    onClick={() => {
                      onSelect({
                        id: tech.docId,
                        name: tech.name,
                        energy: display.energy,
                        tp: display.tp,
                        action: display.actionType,
                        weapon: display.weaponName,
                        damage: display.damageStr,
                      });
                      onClose();
                    }}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200"
                  >
                    <div className="font-medium">{tech.name}</div>
                    <div className="text-sm text-gray-500">
                      EN: {display.energy} | TP: {display.tp} | {display.actionType}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadFeatModal({
  isOpen,
  onClose,
  onSelect,
  selectedFeats,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (feat: CreatureFeat) => void;
  selectedFeats: CreatureFeat[];
}) {
  const { data: allFeats = [] } = useCreatureFeats();
  const [search, setSearch] = useState('');
  
  if (!isOpen) return null;
  
  const selectedIds = new Set(selectedFeats.map(f => f.id));
  const filteredFeats = allFeats.filter(feat => {
    // Exclude already selected feats
    if (selectedIds.has(feat.id)) return false;
    
    // Exclude mechanical feats that are auto-added via basic info
    const numId = parseInt(feat.id, 10);
    if (!isNaN(numId) && MECHANICAL_CREATURE_FEAT_IDS.has(numId)) return false;
    
    // Search filter
    return (feat.name?.toLowerCase().includes(search.toLowerCase()) ||
            feat.description?.toLowerCase().includes(search.toLowerCase()));
  });
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Select a Feat</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-4 border-b">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search feats..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {filteredFeats.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No feats found</p>
          ) : (
            <div className="space-y-2">
              {filteredFeats.slice(0, 50).map(feat => (
                <button
                  key={feat.id}
                  onClick={() => {
                    onSelect({
                      id: feat.id,
                      name: feat.name,
                      description: feat.description,
                      points: feat.points ?? 1, // Use actual feat point cost
                    });
                    onClose();
                  }}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{feat.name}</span>
                    <span className="text-sm text-amber-600 font-medium">{feat.points ?? 1} pt{(feat.points ?? 1) !== 1 ? 's' : ''}</span>
                  </div>
                  {feat.description && (
                    <div className="text-sm text-gray-500 line-clamp-2">{feat.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadArmamentModal({
  isOpen,
  onClose,
  onSelect,
  selectedArmaments,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (armament: CreatureArmament) => void;
  selectedArmaments: CreatureArmament[];
}) {
  const { data: userItems = [] } = useUserItems();
  const { data: propertiesDb = [] } = useItemProperties();
  
  if (!isOpen) return null;
  
  const selectedIds = new Set(selectedArmaments.map(a => a.id));
  const availableItems = userItems.filter(item => !selectedIds.has(item.docId));
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Select an Armament</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {availableItems.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No items in your library</p>
          ) : (
            <div className="space-y-2">
              {availableItems.map(item => {
                // Convert item to expected format for deriveItemDisplay
                const typeMap: Record<string, 'Armor' | 'Weapon' | 'Shield' | 'Accessory'> = {
                  weapon: 'Weapon',
                  armor: 'Armor',
                  equipment: 'Accessory',
                };
                // Convert properties (which may be objects with name property) to ItemPropertyPayload format
                const propertyPayloads = (item.properties || []).map((prop) => ({ 
                  name: typeof prop === 'string' ? prop : prop.name 
                }));
                const itemDoc = {
                  name: item.name,
                  description: item.description,
                  armamentType: typeMap[item.type] || 'Weapon',
                  properties: propertyPayloads,
                  // damage in UserItem is a string, not used for display calculation
                };
                const display = deriveItemDisplay(itemDoc, propertiesDb);
                
                return (
                  <button
                    key={item.docId}
                    onClick={() => {
                      onSelect({
                        id: item.docId,
                        name: item.name,
                        type: item.type || 'equipment',
                        tp: display.totalTP || 0,
                        currency: display.currencyCost || 0,
                        rarity: display.rarity || 'Common',
                      });
                      onClose();
                    }}
                    className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200"
                  >
                    <div className="font-medium">{item.name}</div>
                    <div className="text-sm text-gray-500">
                      {item.type} | TP: {display.totalTP || 0} | {display.currencyCost || 0}c | {display.rarity || 'Common'}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadCreatureModal({
  isOpen,
  onClose,
  onSelect,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (creature: CreatureState) => void;
}) {
  const { data: userCreatures = [] } = useUserCreatures();
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold">Load Creature from Library</h2>
          <button onClick={onClose} className="text-2xl text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="p-4 overflow-y-auto max-h-[60vh]">
          {userCreatures.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No creatures in your library</p>
          ) : (
            <div className="space-y-2">
              {userCreatures.map(c => (
                <button
                  key={c.docId}
                  onClick={() => {
                    // Convert saved creature format to CreatureState
                    const loadedCreature: CreatureState = {
                      name: c.name || '',
                      level: c.level || 1,
                      type: (c as unknown as CreatureState).type || 'Humanoid',
                      size: (c as unknown as CreatureState).size || 'medium',
                      description: c.description || '',
                      archetypeType: (c as unknown as CreatureState).archetypeType || 'power',
                      abilities: (c as unknown as CreatureState).abilities || initialState.abilities,
                      defenses: (c as unknown as CreatureState).defenses || initialState.defenses,
                      hitPoints: (c as unknown as CreatureState).hitPoints || 0,
                      energyPoints: (c as unknown as CreatureState).energyPoints || 0,
                      powerProficiency: (c as unknown as CreatureState).powerProficiency || 0,
                      martialProficiency: (c as unknown as CreatureState).martialProficiency || 0,
                      enablePowers: (c as unknown as CreatureState).enablePowers ?? ((c as unknown as CreatureState).powers?.length > 0),
                      enableTechniques: (c as unknown as CreatureState).enableTechniques ?? ((c as unknown as CreatureState).techniques?.length > 0),
                      enableArmaments: (c as unknown as CreatureState).enableArmaments ?? ((c as unknown as CreatureState).armaments?.length > 0),
                      resistances: (c as unknown as CreatureState).resistances || [],
                      weaknesses: (c as unknown as CreatureState).weaknesses || [],
                      immunities: (c as unknown as CreatureState).immunities || [],
                      conditionImmunities: (c as unknown as CreatureState).conditionImmunities || [],
                      senses: (c as unknown as CreatureState).senses || [],
                      movementTypes: (c as unknown as CreatureState).movementTypes || [],
                      languages: (c as unknown as CreatureState).languages || [],
                      skills: (c as unknown as CreatureState).skills || [],
                      powers: (c as unknown as CreatureState).powers || [],
                      techniques: (c as unknown as CreatureState).techniques || [],
                      feats: (c as unknown as CreatureState).feats || [],
                      armaments: (c as unknown as CreatureState).armaments || [],
                    };
                    onSelect(loadedCreature);
                    onClose();
                  }}
                  className="w-full p-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg border border-gray-200"
                >
                  <div className="font-medium">{c.name}</div>
                  <div className="text-sm text-gray-500">
                    Level {c.level} {(c as unknown as CreatureState).type || 'Creature'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// LocalStorage Cache
// =============================================================================

const CREATURE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.CREATURE;

// =============================================================================
// Main Component
// =============================================================================

function CreatureCreatorContent() {
  const { user } = useAuthStore();
  const { data: creatureFeatsData = [] } = useCreatureFeats();
  const { data: skillsData = [] } = useRTDBSkills();
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [creature, setCreature] = useState<CreatureState>(initialState);
  const [saving, setSaving] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [showArmamentModal, setShowArmamentModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');

  // Load cached state from localStorage on mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem(CREATURE_CREATOR_CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        // Only use cache if it's less than 30 days old
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (parsed.timestamp && Date.now() - parsed.timestamp < thirtyDays) {
          setCreature(parsed.creature || initialState);
        } else {
          localStorage.removeItem(CREATURE_CREATOR_CACHE_KEY);
        }
      }
    } catch (e) {
      console.error('Failed to load creature creator cache:', e);
    }
    setIsInitialized(true);
  }, []);

  // Auto-save to localStorage when creature changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      const cache = {
        creature,
        timestamp: Date.now(),
      };
      localStorage.setItem(CREATURE_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch (e) {
      console.error('Failed to save creature creator cache:', e);
    }
  }, [isInitialized, creature]);
  
  // Create lookup map for feat point costs by ID
  const featPointsMap = useMemo(() => {
    const map = new Map<string, number>();
    creatureFeatsData.forEach(feat => {
      map.set(feat.id, feat.points);
    });
    return map;
  }, [creatureFeatsData]);
  
  // Create lookup map for skill abilities
  const skillAbilityMap = useMemo(() => {
    const map = new Map<string, string>();
    skillsData.forEach(skill => {
      if (skill.ability) {
        map.set(skill.name, skill.ability.toLowerCase());
      }
    });
    return map;
  }, [skillsData]);
  
  // Create description maps for senses and movements
  const senseDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    SENSES.forEach(sense => {
      map[sense.value] = sense.description;
    });
    return map;
  }, []);
  
  const movementDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    MOVEMENT_TYPES.forEach(movement => {
      map[movement.value] = movement.description;
    });
    return map;
  }, []);
  
  // Calculate skill bonus (uses shared utility from formulas.ts)
  const getSkillBonus = useCallback((skillName: string, skillValue: number, proficient: boolean) => {
    const abilityName = skillAbilityMap.get(skillName) || '';
    return calculateSkillBonusWithProficiency(abilityName, skillValue, creature.abilities, proficient);
  }, [skillAbilityMap, creature.abilities]);
  
  // Filter available skills: exclude sub-skills unless their base skill is already added
  const availableSkills = useMemo(() => {
    const addedSkillNames = creature.skills.map(s => s.name);
    
    return skillsData.filter(skill => {
      // If this skill has a base_skill, only show it if the base skill is already added
      if (skill.base_skill) {
        return addedSkillNames.includes(skill.base_skill);
      }
      // Otherwise, show all base skills
      return true;
    }).map(skill => skill.name);
  }, [skillsData, creature.skills]);

  const updateCreature = useCallback((updates: Partial<CreatureState>) => {
    setCreature(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAbility = useCallback((ability: AbilityName, value: number) => {
    setCreature(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: value }
    }));
  }, []);

  const updateDefense = useCallback((defense: keyof CreatureState['defenses'], value: number) => {
    setCreature(prev => ({
      ...prev,
      defenses: { ...prev.defenses, [defense]: value }
    }));
  }, []);

  // Array management helpers
  const addToArray = useCallback((field: keyof CreatureState, item: string) => {
    setCreature(prev => ({
      ...prev,
      [field]: [...(prev[field] as string[]), item]
    }));
  }, []);

  const removeFromArray = useCallback((field: keyof CreatureState, item: string) => {
    setCreature(prev => ({
      ...prev,
      [field]: (prev[field] as string[]).filter(i => i !== item)
    }));
  }, []);

  // Calculate derived stats
  const stats = useMemo(() => {
    const level = creature.level;
    const abilities = creature.abilities;
    
    // Find highest non-vitality ability for TP calculation
    const nonVitalityAbilities = Object.entries(abilities)
      .filter(([key]) => key !== 'vitality')
      .map(([, value]) => value);
    const highestNonVitality = Math.max(...nonVitalityAbilities, 0);
    
    const trainingPoints = calculateCreatureTrainingPoints(level, highestNonVitality);
    const currency = calculateCreatureCurrency(level);
    const hePool = calculateHealthEnergyPool(level, 'CREATURE', true);
    const proficiency = calculateProficiency(level, true);
    const abilityPoints = calculateAbilityPoints(level, true);
    const skillPoints = calculateSkillPoints(level, true);
    
    // Max archetype proficiency points based on level (vanilla formula)
    // level < 1: ceil(2 * level), else: 2 + floor(level / 5)
    const maxProficiencyPoints = level < 1 ? Math.ceil(2 * level) : 2 + Math.floor(level / 5);
    const proficiencySpent = creature.powerProficiency + creature.martialProficiency;
    const proficiencyRemaining = maxProficiencyPoints - proficiencySpent;
    
    // Feat points based on level and martial proficiency
    const featPoints = calculateCreatureFeatPoints(level, creature.martialProficiency);
    
    // Calculate mechanical feat points from resistances, immunities, weaknesses, condition immunities
    // Each counts as one instance of that feat, costing/granting its feat points
    const resistanceFeatCost = featPointsMap.get(String(CREATURE_FEAT_IDS.RESISTANCE)) ?? 1;
    const immunityFeatCost = featPointsMap.get(String(CREATURE_FEAT_IDS.IMMUNITY)) ?? 2;
    const weaknessFeatCost = featPointsMap.get(String(CREATURE_FEAT_IDS.WEAKNESS)) ?? -1;
    const conditionImmunityFeatCost = featPointsMap.get(String(CREATURE_FEAT_IDS.CONDITION_IMMUNITY)) ?? 1;
    
    // Calculate feat points for senses
    const senseFeatPoints = creature.senses.reduce((sum, sense) => {
      const featId = SENSE_TO_FEAT_ID[sense];
      if (featId) {
        const cost = featPointsMap.get(String(featId)) ?? 0;
        return sum + cost;
      }
      return sum;
    }, 0);
    
    // Calculate feat points for movement types
    const movementFeatPoints = creature.movementTypes.reduce((sum, movement) => {
      const featId = MOVEMENT_TO_FEAT_ID[movement];
      if (featId) {
        const cost = featPointsMap.get(String(featId)) ?? 0;
        return sum + cost;
      }
      return sum;
    }, 0);
    
    const mechanicalFeatPoints = 
      (creature.resistances.length * resistanceFeatCost) +
      (creature.immunities.length * immunityFeatCost) +
      (creature.weaknesses.length * weaknessFeatCost) +
      (creature.conditionImmunities.length * conditionImmunityFeatCost) +
      senseFeatPoints +
      movementFeatPoints;
    
    // Total feat spent = manual feats + mechanical feats
    const manualFeatSpent = creature.feats.reduce((sum, f) => sum + (f.points ?? 1), 0);
    const featSpent = manualFeatSpent + mechanicalFeatPoints;
    
    // Health = 8 + (vitality contribution) + hitPoints
    // Negative vitality only applies at level 1, not multiplied by level
    const vitalityContribution = abilities.vitality >= 0 
      ? abilities.vitality * Math.max(1, level) 
      : abilities.vitality; // Negative vitality only applies once (at level 1)
    const maxHealth = 8 + vitalityContribution + creature.hitPoints;
    // Energy minimum = highest non-vitality ability * level
    const minEnergy = highestNonVitality * Math.max(1, level);
    const maxEnergy = minEnergy + creature.energyPoints;
    
    // Speed = 6 + ceil(agility / 2) + size modifier
    const sizeData = CREATURE_SIZES.find(s => s.value === creature.size);
    const sizeModifier = sizeData?.modifier || 0;
    const speed = 6 + Math.ceil(abilities.agility / 2) + sizeModifier;
    
    // Evasion = 10 + agility
    const evasion = 10 + abilities.agility;
    
    // Points spent
    // Negative abilities give points back, positive abilities cost points
    const abilitySpent = Object.values(abilities).reduce((sum, val) => sum + val, 0);
    const heSpent = creature.hitPoints + creature.energyPoints;
    const skillSpent = creature.skills.reduce((sum, s) => sum + s.value + (s.proficient ? 1 : 0), 0);
    const defenseSpent = Object.values(creature.defenses).reduce((sum, val) => sum + (val * 2), 0);
    
    return {
      trainingPoints,
      currency,
      hePool,
      proficiency,
      abilityPoints,
      skillPoints,
      featPoints,
      featSpent,
      featRemaining: featPoints - featSpent,
      maxHealth,
      minEnergy,
      maxEnergy,
      speed,
      evasion,
      abilitySpent,
      abilityRemaining: abilityPoints - abilitySpent,
      heRemaining: hePool - heSpent,
      skillRemaining: skillPoints - skillSpent - defenseSpent,
      maxProficiencyPoints,
      proficiencySpent,
      proficiencyRemaining,
    };
  }, [creature, featPointsMap]);

  // Save creature to Firestore
  const handleSave = async () => {
    if (!creature.name.trim()) {
      alert('Please enter a creature name');
      return;
    }
    if (!user) {
      // Show login prompt modal instead of alert
      setShowLoginPrompt(true);
      return;
    }
    
    setSaving(true);
    try {
      const creaturesRef = collection(db, 'users', user.uid, 'creatureLibrary');
      const q = query(creaturesRef, where('name', '==', creature.name));
      const snapshot = await getDocs(q);
      
      const creatureData = {
        ...creature,
        updatedAt: new Date(),
      };
      
      if (!snapshot.empty) {
        // Update existing
        const docRef = doc(db, 'users', user.uid, 'creatureLibrary', snapshot.docs[0].id);
        await setDoc(docRef, creatureData);
      } else {
        // Create new
        await addDoc(creaturesRef, { ...creatureData, createdAt: new Date() });
      }
      
      alert('Creature saved!');
    } catch (err) {
      console.error('Error saving creature:', err);
      alert('Failed to save creature');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (confirm('Reset all creature data?')) {
      setCreature(initialState);
      // Clear localStorage cache
      try {
        localStorage.removeItem(CREATURE_CREATOR_CACHE_KEY);
      } catch (e) {
        console.error('Failed to clear creature creator cache:', e);
      }
    }
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !creature.languages.includes(newLanguage.trim())) {
      addToArray('languages', newLanguage.trim());
      setNewLanguage('');
    }
  };

  const addSkill = (skillName: string) => {
    if (!creature.skills.find(s => s.name === skillName)) {
      // For creatures, all skills added are automatically proficient (spend that point)
      setCreature(prev => ({
        ...prev,
        skills: [...prev.skills, { name: skillName, value: 0, proficient: true }]
      }));
    }
  };

  const updateSkill = (skillName: string, updates: Partial<CreatureSkill>) => {
    setCreature(prev => ({
      ...prev,
      skills: prev.skills.map(s => {
        if (s.name === skillName) {
          const newSkill = { ...s, ...updates };
          // For creatures, proficiency cannot be removed once added
          // If trying to remove proficiency, also reset skill value to 0
          if ('proficient' in updates && !updates.proficient) {
            return { ...newSkill, proficient: true, value: 0 };
          }
          return newSkill;
        }
        return s;
      })
    }));
  };

  const removeSkill = (skillName: string) => {
    setCreature(prev => ({
      ...prev,
      skills: prev.skills.filter(s => s.name !== skillName)
    }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Creature Creator</h1>
          <p className="text-gray-600">Design custom creatures, monsters, and NPCs</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => user ? setShowLoadModal(true) : setShowLoginPrompt(true)}
            className={cn(
              "px-4 py-2 rounded-lg border transition-colors",
              user 
                ? "border-primary-600 text-primary-600 hover:bg-primary-50"
                : "border-gray-300 text-gray-400 cursor-pointer"
            )}
            title={user ? "Load from library" : "Log in to load from library"}
          >
            Load
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
          >
            Reset
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      {/* Creature Summary Card (Top) */}
      <div className="bg-white rounded-xl shadow-md p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xl font-bold text-gray-900">{creature.name || 'Unnamed Creature'}</div>
              <div className="text-sm text-gray-500">
                Level {creature.level} {creature.size.charAt(0).toUpperCase() + creature.size.slice(1)} {creature.type}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 rounded-lg">
              <span className="text-gray-600">HP</span>
              <span className="font-bold text-red-600">{stats.maxHealth}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-lg">
              <span className="text-gray-600">EN</span>
              <span className="font-bold text-blue-600">{stats.maxEnergy}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-gray-600">SPD</span>
              <span className="font-bold">{stats.speed}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-gray-600">EVA</span>
              <span className="font-bold">{stats.evasion}</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg">
              <span className="text-gray-600">PROF</span>
              <span className="font-bold">+{stats.proficiency}</span>
            </div>
          </div>
        </div>
        {/* Quick feature tags */}
        <div className="flex flex-wrap gap-2 mt-3">
          {creature.resistances.map(r => (
            <span key={r} className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded">{r} Res.</span>
          ))}
          {creature.weaknesses.map(w => (
            <span key={w} className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded">{w} Weak</span>
          ))}
          {creature.immunities.map(i => (
            <span key={i} className="px-2 py-0.5 text-xs bg-purple-100 text-purple-700 rounded">{i} Imm.</span>
          ))}
          {creature.senses.map(s => (
            <span key={s} className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">{s}</span>
          ))}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={creature.name}
                  onChange={(e) => updateCreature({ name: e.target.value })}
                  placeholder="Creature name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
                <select
                  value={creature.level}
                  onChange={(e) => updateCreature({ level: parseFloat(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {LEVEL_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={creature.type}
                  onChange={(e) => updateCreature({ type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CREATURE_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                <select
                  value={creature.size}
                  onChange={(e) => updateCreature({ size: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {CREATURE_SIZES.map(size => (
                    <option key={size.value} value={size.value}>{size.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Archetype Selection */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Archetype</h3>
            <ArchetypeSelector
              value={creature.archetypeType}
              powerProficiency={creature.powerProficiency}
              martialProficiency={creature.martialProficiency}
              maxProficiency={stats.maxProficiencyPoints}
              onTypeChange={(type) => updateCreature({ archetypeType: type })}
              onProficiencyChange={(power, martial) => updateCreature({ 
                powerProficiency: power, 
                martialProficiency: martial 
              })}
            />
          </div>

          {/* HP/EN Allocation */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Health & Energy</h3>
            <HealthEnergyAllocator
              hpBonus={creature.hitPoints}
              energyBonus={creature.energyPoints}
              poolTotal={stats.hePool}
              maxHp={stats.maxHealth}
              maxEnergy={stats.maxEnergy}
              onHpChange={(val) => updateCreature({ hitPoints: val })}
              onEnergyChange={(val) => updateCreature({ energyPoints: val })}
            />
          </div>

          {/* Abilities - Using shared AbilityScoreEditor */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ability Scores</h3>
            <AbilityScoreEditor
              abilities={creature.abilities}
              totalPoints={stats.abilityPoints}
              onAbilityChange={updateAbility}
              maxAbility={7}
              minAbility={-4}
              maxNegativeSum={null}
              isEditMode={true}
              compact={true}
              useHighAbilityCost={true}
            />
          </div>

          {/* Defenses */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Defenses</h3>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              <DefenseBlock
                name="Might"
                baseValue={creature.abilities.strength}
                bonusValue={creature.defenses.might}
                onChange={(val) => updateDefense('might', val)}
              />
              <DefenseBlock
                name="Fortitude"
                baseValue={creature.abilities.vitality}
                bonusValue={creature.defenses.fortitude}
                onChange={(val) => updateDefense('fortitude', val)}
              />
              <DefenseBlock
                name="Reflex"
                baseValue={creature.abilities.agility}
                bonusValue={creature.defenses.reflex}
                onChange={(val) => updateDefense('reflex', val)}
              />
              <DefenseBlock
                name="Discernment"
                baseValue={creature.abilities.acuity}
                bonusValue={creature.defenses.discernment}
                onChange={(val) => updateDefense('discernment', val)}
              />
              <DefenseBlock
                name="Mental Fort"
                baseValue={creature.abilities.intelligence}
                bonusValue={creature.defenses.mentalFortitude}
                onChange={(val) => updateDefense('mentalFortitude', val)}
              />
              <DefenseBlock
                name="Resolve"
                baseValue={creature.abilities.charisma}
                bonusValue={creature.defenses.resolve}
                onChange={(val) => updateDefense('resolve', val)}
              />
            </div>
          </div>

          {/* Resistances, Weaknesses, Immunities */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Damage Modifiers</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Resistances</label>
                <ChipList 
                  items={creature.resistances} 
                  onRemove={(item) => removeFromArray('resistances', item)}
                  color="bg-green-100 text-green-800"
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={[...creature.resistances, ...creature.immunities]}
                  onAdd={(item) => addToArray('resistances', item)}
                  placeholder="Add resistance..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Weaknesses</label>
                <ChipList 
                  items={creature.weaknesses} 
                  onRemove={(item) => removeFromArray('weaknesses', item)}
                  color="bg-red-100 text-red-800"
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={creature.weaknesses}
                  onAdd={(item) => addToArray('weaknesses', item)}
                  placeholder="Add weakness..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Immunities</label>
                <ChipList 
                  items={creature.immunities} 
                  onRemove={(item) => removeFromArray('immunities', item)}
                  color="bg-purple-100 text-purple-800"
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={[...creature.resistances, ...creature.immunities]}
                  onAdd={(item) => addToArray('immunities', item)}
                  placeholder="Add immunity..."
                />
              </div>
            </div>
          </div>

          {/* Senses & Movement */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Senses & Movement</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Senses</label>
                <ExpandableChipList 
                  items={creature.senses} 
                  onRemove={(item) => removeFromArray('senses', item)}
                  color="bg-blue-100 text-blue-800"
                  descriptions={senseDescriptions}
                />
                <AddItemDropdown
                  options={SENSES}
                  selectedItems={creature.senses}
                  onAdd={(item) => addToArray('senses', item)}
                  placeholder="Add sense..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Movement Types</label>
                <ExpandableChipList 
                  items={creature.movementTypes} 
                  onRemove={(item) => removeFromArray('movementTypes', item)}
                  color="bg-amber-100 text-amber-800"
                  descriptions={movementDescriptions}
                />
                <AddItemDropdown
                  options={MOVEMENT_TYPES}
                  selectedItems={creature.movementTypes}
                  onAdd={(item) => addToArray('movementTypes', item)}
                  placeholder="Add movement..."
                />
              </div>
            </div>
          </div>

          {/* Condition Immunities */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Condition Immunities</h3>
            <ChipList 
              items={creature.conditionImmunities} 
              onRemove={(item) => removeFromArray('conditionImmunities', item)}
              color="bg-gray-200 text-gray-800"
            />
            <AddItemDropdown
              options={CONDITIONS}
              selectedItems={creature.conditionImmunities}
              onAdd={(item) => addToArray('conditionImmunities', item)}
              placeholder="Add condition immunity..."
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Skills</h3>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  stats.skillRemaining < 0 
                    ? 'bg-red-100 text-red-700' 
                    : stats.skillRemaining === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                )}>
                  {stats.skillRemaining} remaining
                </span>
              </div>
            </div>
            
            {creature.skills.length === 0 ? (
              <p className="text-sm text-gray-400 italic py-4 text-center">No skills added. Use the dropdown below to add skills.</p>
            ) : (
              <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 mb-4">
                {creature.skills.map(skill => (
                  <div key={skill.name} className="flex items-center justify-between py-2.5 px-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => removeSkill(skill.name)}
                        className="w-5 h-5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 flex items-center justify-center text-sm font-medium transition-colors"
                        title="Remove skill"
                      >
                        ×
                      </button>
                      {/* For creatures, all skills are automatically proficient */}
                      <div className="w-4 h-4 rounded-full border-2 bg-primary-600 border-primary-600" title="Proficient (all creature skills are proficient)" />
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-700">{skill.name}</span>
                        {skillAbilityMap.get(skill.name) && (
                          <span className="text-xs text-gray-400 capitalize">{skillAbilityMap.get(skill.name)}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSkill(skill.name, { value: Math.max(0, skill.value - 1) })}
                          disabled={skill.value <= 0}
                          className="w-7 h-7 rounded bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          −
                        </button>
                        <span className="w-8 text-center font-mono font-medium">{skill.value}</span>
                        <button
                          onClick={() => updateSkill(skill.name, { value: skill.value + 1 })}
                          className="w-7 h-7 rounded bg-primary-600 text-white hover:bg-primary-700 flex items-center justify-center text-sm font-medium transition-colors"
                        >
                          +
                        </button>
                      </div>
                      {/* Show full bonus: ability + skill value (all creature skills are proficient) */}
                      {(() => {
                        const bonus = getSkillBonus(skill.name, skill.value, skill.proficient);
                        return (
                          <span className={cn(
                            'w-12 text-right font-bold',
                            bonus > 0 ? 'text-green-600' : bonus < 0 ? 'text-red-600' : 'text-gray-400'
                          )}>
                            {bonus >= 0 ? '+' : ''}{bonus}
                          </span>
                        );
                      })()}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <AddItemDropdown
              options={availableSkills}
              selectedItems={creature.skills.map(s => s.name)}
              onAdd={addSkill}
              placeholder="Add skill..."
            />
          </div>

          {/* Languages */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Languages</h3>
            <ChipList 
              items={creature.languages} 
              onRemove={(item) => removeFromArray('languages', item)}
              color="bg-teal-100 text-teal-800"
            />
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                placeholder="Enter language..."
                className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm"
              />
              <button
                onClick={addLanguage}
                disabled={!newLanguage.trim()}
                className="px-3 py-1.5 bg-primary-600 text-white rounded text-sm disabled:opacity-50"
              >
                Add
              </button>
            </div>
          </div>

          {/* Powers - Optional */}
          <CollapsibleSection
            title="Powers"
            subtitle="Supernatural abilities and magical effects"
            icon="✨"
            optional
            enabled={creature.enablePowers}
            onEnabledChange={(enabled) => updateCreature({ enablePowers: enabled })}
            itemCount={creature.powers.length}
            defaultExpanded={creature.powers.length > 0}
          >
            {creature.powers.length === 0 ? (
              <p className="text-sm text-gray-400 italic mb-4">No powers added</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">EN</th>
                      <th className="px-3 py-2 text-left">Action</th>
                      <th className="px-3 py-2 text-left">Duration</th>
                      <th className="px-3 py-2 text-left">Range</th>
                      <th className="px-3 py-2 text-left">Area</th>
                      <th className="px-3 py-2 text-left">Damage</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {creature.powers.map(power => (
                      <tr key={power.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{power.name}</td>
                        <td className="px-3 py-2">{power.energy}</td>
                        <td className="px-3 py-2">{power.action}</td>
                        <td className="px-3 py-2">{power.duration}</td>
                        <td className="px-3 py-2">{power.range}</td>
                        <td className="px-3 py-2">{power.area}</td>
                        <td className="px-3 py-2">{formatDamageDisplay(power.damage)}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setCreature(prev => ({
                              ...prev,
                              powers: prev.powers.filter(p => p.id !== power.id)
                            }))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => setShowPowerModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add Power
            </button>
          </CollapsibleSection>

          {/* Techniques - Optional */}
          <CollapsibleSection
            title="Techniques"
            subtitle="Combat maneuvers and martial skills"
            icon="⚔️"
            optional
            enabled={creature.enableTechniques}
            onEnabledChange={(enabled) => updateCreature({ enableTechniques: enabled })}
            itemCount={creature.techniques.length}
            defaultExpanded={creature.techniques.length > 0}
          >
            {creature.techniques.length === 0 ? (
              <p className="text-sm text-gray-400 italic mb-4">No techniques added</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">EN</th>
                      <th className="px-3 py-2 text-left">TP</th>
                      <th className="px-3 py-2 text-left">Action</th>
                      <th className="px-3 py-2 text-left">Weapon</th>
                      <th className="px-3 py-2 text-left">Damage</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {creature.techniques.map(tech => (
                      <tr key={tech.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{tech.name}</td>
                        <td className="px-3 py-2">{tech.energy}</td>
                        <td className="px-3 py-2">{tech.tp}</td>
                        <td className="px-3 py-2">{tech.action}</td>
                        <td className="px-3 py-2">{tech.weapon}</td>
                        <td className="px-3 py-2">{formatDamageDisplay(tech.damage)}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setCreature(prev => ({
                              ...prev,
                              techniques: prev.techniques.filter(t => t.id !== tech.id)
                            }))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => setShowTechniqueModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add Technique
            </button>
          </CollapsibleSection>

          {/* Feats - Always visible, collapsible */}
          <CollapsibleSection
            title="Feats"
            subtitle="Special abilities and traits"
            icon="⭐"
            itemCount={creature.feats.length}
            points={{ spent: stats.featSpent, total: stats.featPoints }}
            defaultExpanded={true}
          >
            {creature.feats.length === 0 ? (
              <p className="text-sm text-gray-400 italic mb-4">No feats added</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creature.feats.map(feat => (
                  <div key={feat.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <button
                      onClick={() => setCreature(prev => ({
                        ...prev,
                        feats: prev.feats.filter(f => f.id !== feat.id)
                      }))}
                      className="text-red-500 hover:text-red-700 mt-0.5"
                    >
                      ×
                    </button>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{feat.name}</span>
                        <span className="text-sm text-amber-600">{feat.points ?? 1} pt{(feat.points ?? 1) !== 1 ? 's' : ''}</span>
                      </div>
                      {feat.description && (
                        <div className="text-sm text-gray-500 line-clamp-2">{feat.description}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => setShowFeatModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add Feat
            </button>
          </CollapsibleSection>

          {/* Armaments - Optional */}
          <CollapsibleSection
            title="Armaments"
            subtitle="Weapons, armor, and equipment"
            icon="🛡️"
            optional
            enabled={creature.enableArmaments}
            onEnabledChange={(enabled) => updateCreature({ enableArmaments: enabled })}
            itemCount={creature.armaments.length}
            defaultExpanded={creature.armaments.length > 0}
          >
            {creature.armaments.length === 0 ? (
              <p className="text-sm text-gray-400 italic mb-4">No armaments added</p>
            ) : (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Name</th>
                      <th className="px-3 py-2 text-left">Type</th>
                      <th className="px-3 py-2 text-left">TP</th>
                      <th className="px-3 py-2 text-left">Currency</th>
                      <th className="px-3 py-2 text-left">Rarity</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {creature.armaments.map(armament => (
                      <tr key={armament.id} className="border-t">
                        <td className="px-3 py-2 font-medium">{armament.name}</td>
                        <td className="px-3 py-2 capitalize">{armament.type}</td>
                        <td className="px-3 py-2">{armament.tp}</td>
                        <td className="px-3 py-2">{armament.currency}c</td>
                        <td className="px-3 py-2">{armament.rarity}</td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => setCreature(prev => ({
                              ...prev,
                              armaments: prev.armaments.filter(a => a.id !== armament.id)
                            }))}
                            className="text-red-500 hover:text-red-700"
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <button
              onClick={() => setShowArmamentModal(true)}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Add Armament
            </button>
          </CollapsibleSection>

          {/* Description */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Description</h3>
            <textarea
              value={creature.description}
              onChange={(e) => updateCreature({ description: e.target.value })}
              placeholder="Describe this creature's appearance, behavior, and special abilities..."
              rows={6}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg resize-none"
            />
          </div>
        </div>

        {/* Creature Summary Sidebar */}
        <CreatorSummaryPanel
          title="Creature Summary"
          quickStats={[
            { label: 'HP', value: stats.maxHealth, color: 'bg-red-50 text-red-600' },
            { label: 'EN', value: stats.maxEnergy, color: 'bg-blue-50 text-blue-600' },
            { label: 'SPD', value: stats.speed, color: 'bg-gray-100' },
            { label: 'EVA', value: stats.evasion, color: 'bg-gray-100' },
          ]}
          items={[
            { label: 'Ability Points', remaining: stats.abilityRemaining },
            { label: 'Skill Points', remaining: stats.skillRemaining },
            { label: 'Feat Points', remaining: stats.featRemaining, variant: 'warning' },
            { label: 'Training Points', remaining: stats.trainingPoints, variant: 'warning' },
            { label: 'Currency', remaining: stats.currency, variant: 'warning' },
          ]}
        />
      </div>

      {/* Modals */}
      <LoadPowerModal
        isOpen={showPowerModal}
        onClose={() => setShowPowerModal(false)}
        onSelect={(power) => setCreature(prev => ({
          ...prev,
          powers: [...prev.powers, power]
        }))}
      />
      <LoadTechniqueModal
        isOpen={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        onSelect={(technique) => setCreature(prev => ({
          ...prev,
          techniques: [...prev.techniques, technique]
        }))}
      />
      <LoadFeatModal
        isOpen={showFeatModal}
        onClose={() => setShowFeatModal(false)}
        onSelect={(feat) => setCreature(prev => ({
          ...prev,
          feats: [...prev.feats, feat]
        }))}
        selectedFeats={creature.feats}
      />
      <LoadArmamentModal
        isOpen={showArmamentModal}
        onClose={() => setShowArmamentModal(false)}
        onSelect={(armament) => setCreature(prev => ({
          ...prev,
          armaments: [...prev.armaments, armament]
        }))}
        selectedArmaments={creature.armaments}
      />
      <LoadCreatureModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        onSelect={(loadedCreature) => setCreature(loadedCreature)}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/creature-creator"
        contentType="creature"
      />
    </div>
  );
}

export default function CreatureCreatorPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <CreatureCreatorContent />
    </div>
  );
}
