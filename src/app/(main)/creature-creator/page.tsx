/**
 * Creature Creator Page
 * =====================
 * Tool for creating custom creatures and NPCs
 * Full-featured version matching vanilla functionality
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { addDoc, collection, getDocs, query, where, doc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { ProtectedRoute } from '@/components/layout';
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

// =============================================================================
// Constants
// =============================================================================

const CREATURE_TYPES = [
  'Beast', 'Humanoid', 'Undead', 'Construct', 'Elemental', 
  'Aberration', 'Dragon', 'Fiend', 'Celestial', 'Fey', 'Plant', 'Ooze', 'Other'
];

const CREATURE_SIZES = [
  { value: 'tiny', label: 'Tiny', modifier: -2 },
  { value: 'small', label: 'Small', modifier: -1 },
  { value: 'medium', label: 'Medium', modifier: 0 },
  { value: 'large', label: 'Large', modifier: 1 },
  { value: 'huge', label: 'Huge', modifier: 2 },
  { value: 'gargantuan', label: 'Gargantuan', modifier: 3 },
];

const LEVEL_OPTIONS = [
  { value: 0.25, label: '1/4' },
  { value: 0.5, label: '1/2' },
  { value: 0.75, label: '3/4' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
];

const DAMAGE_TYPES = [
  'Bludgeoning', 'Piercing', 'Slashing', 'Magic', 'Fire', 'Ice', 
  'Lightning', 'Spiritual', 'Sonic', 'Poison', 'Necrotic', 'Acid', 'Psychic'
];

const SENSES = [
  { value: 'Darkvision', label: 'Darkvision (6 spaces)' },
  { value: 'Darkvision II', label: 'Darkvision II (12 spaces)' },
  { value: 'Darkvision III', label: 'Darkvision III (24 spaces)' },
  { value: 'Blindsense', label: 'Blindsense (3 spaces)' },
  { value: 'Blindsense II', label: 'Blindsense II (6 spaces)' },
  { value: 'Blindsense III', label: 'Blindsense III (12 spaces)' },
  { value: 'Amphibious', label: 'Amphibious' },
  { value: 'All-Surface Climber', label: 'All-Surface Climber' },
  { value: 'Telepathy', label: 'Telepathy (12 spaces)' },
  { value: 'Telepathy II', label: 'Telepathy II (48 spaces)' },
  { value: 'Waterbreathing', label: 'Waterbreathing' },
  { value: 'Unrestrained Movement', label: 'Unrestrained Movement' },
];

const MOVEMENT_TYPES = [
  { value: 'Fly Half', label: 'Flying (Half Speed)' },
  { value: 'Fly', label: 'Flying II (Full Speed)' },
  { value: 'Burrow', label: 'Burrow (Half Speed)' },
  { value: 'Burrow II', label: 'Burrow II (Full Speed)' },
  { value: 'Jump', label: 'Jump (Long 3, High 2)' },
  { value: 'Jump II', label: 'Jump II (Long 4, High 3)' },
  { value: 'Jump III', label: 'Jump III (Long 5, High 4)' },
  { value: 'Speedy', label: 'Speedy (+2 spaces)' },
  { value: 'Speedy II', label: 'Speedy II (+4 spaces)' },
  { value: 'Speedy III', label: 'Speedy III (+6 spaces)' },
  { value: 'Slow', label: 'Slow (-2 spaces)' },
  { value: 'Hover', label: 'Hover' },
];

const CONDITIONS = [
  'Bleeding', 'Blinded', 'Charmed', 'Restrained', 'Dazed', 'Deafened',
  'Dying', 'Exhausted', 'Exposed', 'Faint', 'Frightened', 'Grappled',
  'Hidden', 'Immobile', 'Invisible', 'Prone', 'Resilient', 'Slowed',
  'Stunned', 'Susceptible', 'Terminal', 'Weakened'
];

const SKILLS = [
  'Acrobatics', 'Animal Handling', 'Arcana', 'Athletics', 'Deception',
  'History', 'Insight', 'Intimidation', 'Investigation', 'Medicine',
  'Nature', 'Perception', 'Performance', 'Persuasion', 'Religion',
  'Sleight of Hand', 'Stealth', 'Survival'
];

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
}

const initialState: CreatureState = {
  name: '',
  level: 1,
  type: 'Humanoid',
  size: 'medium',
  description: '',
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

function AddItemDropdown({
  options,
  selectedItems,
  onAdd,
  placeholder,
}: {
  options: { value: string; label: string }[] | string[];
  selectedItems: string[];
  onAdd: (item: string) => void;
  placeholder: string;
}) {
  const [selectedValue, setSelectedValue] = useState('');
  
  const normalizedOptions = options.map(opt => 
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
                // Convert property names to ItemPropertyPayload format
                const propertyPayloads = (item.properties || []).map((propName: string) => ({ name: propName }));
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
                      abilities: (c as unknown as CreatureState).abilities || initialState.abilities,
                      defenses: (c as unknown as CreatureState).defenses || initialState.defenses,
                      hitPoints: (c as unknown as CreatureState).hitPoints || 0,
                      energyPoints: (c as unknown as CreatureState).energyPoints || 0,
                      powerProficiency: (c as unknown as CreatureState).powerProficiency || 0,
                      martialProficiency: (c as unknown as CreatureState).martialProficiency || 0,
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
// Main Component
// =============================================================================

function CreatureCreatorContent() {
  const { user } = useAuthStore();
  const { data: creatureFeatsData = [] } = useCreatureFeats();
  const { data: skillsData = [] } = useRTDBSkills();
  const [creature, setCreature] = useState<CreatureState>(initialState);
  const [saving, setSaving] = useState(false);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [showArmamentModal, setShowArmamentModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  
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
  
  // Calculate skill bonus (uses shared utility from formulas.ts)
  const getSkillBonus = useCallback((skillName: string, skillValue: number, proficient: boolean) => {
    const abilityName = skillAbilityMap.get(skillName) || '';
    return calculateSkillBonusWithProficiency(abilityName, skillValue, creature.abilities, proficient);
  }, [skillAbilityMap, creature.abilities]);

  const updateCreature = useCallback((updates: Partial<CreatureState>) => {
    setCreature(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAbility = useCallback((ability: keyof CreatureState['abilities'], value: number) => {
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
    
    const mechanicalFeatPoints = 
      (creature.resistances.length * resistanceFeatCost) +
      (creature.immunities.length * immunityFeatCost) +
      (creature.weaknesses.length * weaknessFeatCost) +
      (creature.conditionImmunities.length * conditionImmunityFeatCost);
    
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
    if (!user) {
      alert('Please log in to save creatures');
      return;
    }
    if (!creature.name.trim()) {
      alert('Please enter a creature name');
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
      setCreature(prev => ({
        ...prev,
        skills: [...prev.skills, { name: skillName, value: 0, proficient: false }]
      }));
    }
  };

  const updateSkill = (skillName: string, updates: Partial<CreatureSkill>) => {
    setCreature(prev => ({
      ...prev,
      skills: prev.skills.map(s => s.name === skillName ? { ...s, ...updates } : s)
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
            onClick={() => setShowLoadModal(true)}
            className="px-4 py-2 rounded-lg border border-primary-600 text-primary-600 hover:bg-primary-50"
          >
            Load Creature
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
            {saving ? 'Saving...' : 'Save Creature'}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Power Prof</label>
                <input
                  type="number"
                  value={creature.powerProficiency}
                  onChange={(e) => updateCreature({ powerProficiency: Math.max(0, parseInt(e.target.value) || 0) })}
                  min={0}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg",
                    stats.proficiencyRemaining < 0 ? "border-red-500 bg-red-50" : "border-gray-300"
                  )}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Martial Prof</label>
                <input
                  type="number"
                  value={creature.martialProficiency}
                  onChange={(e) => updateCreature({ martialProficiency: Math.max(0, parseInt(e.target.value) || 0) })}
                  min={0}
                  className={cn(
                    "w-full px-3 py-2 border rounded-lg",
                    stats.proficiencyRemaining < 0 ? "border-red-500 bg-red-50" : "border-gray-300"
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Proficiency Points</label>
                <div className={cn(
                  "px-3 py-2 rounded-lg text-sm font-medium",
                  stats.proficiencyRemaining < 0 ? "bg-red-100 text-red-700" : stats.proficiencyRemaining === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
                )}>
                  {stats.proficiencySpent} / {stats.maxProficiencyPoints} used
                  {stats.proficiencyRemaining < 0 && <span className="ml-2">({stats.proficiencyRemaining} over!)</span>}
                </div>
              </div>
              
              {/* HP and EN in Basic Info */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  HP ({stats.maxHealth})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCreature({ hitPoints: Math.max(0, creature.hitPoints - 1) })}
                    disabled={creature.hitPoints <= 0}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium text-sm',
                      creature.hitPoints <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    )}
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-lg font-bold text-gray-900">+{creature.hitPoints}</span>
                    <span className="text-sm text-gray-500 ml-1">bonus</span>
                  </div>
                  <button
                    onClick={() => updateCreature({ hitPoints: creature.hitPoints + 1 })}
                    className="px-3 py-1.5 rounded-lg font-medium text-sm bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy ({stats.maxEnergy})
                </label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateCreature({ energyPoints: Math.max(0, creature.energyPoints - 1) })}
                    disabled={creature.energyPoints <= 0}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-medium text-sm',
                      creature.energyPoints <= 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-red-100 text-red-700 hover:bg-red-200'
                    )}
                  >
                    −
                  </button>
                  <div className="flex-1 text-center">
                    <span className="text-lg font-bold text-gray-900">+{creature.energyPoints}</span>
                    <span className="text-sm text-gray-500 ml-1">bonus</span>
                  </div>
                  <button
                    onClick={() => updateCreature({ energyPoints: creature.energyPoints + 1 })}
                    className="px-3 py-1.5 rounded-lg font-medium text-sm bg-green-100 text-green-700 hover:bg-green-200"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>
            
            {/* HP/EN Pool Status */}
            <div className={cn(
              "mt-4 px-3 py-2 rounded-lg text-sm font-medium",
              stats.heRemaining < 0 ? "bg-red-100 text-red-700" : stats.heRemaining === 0 ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"
            )}>
              HP/EN Pool: {creature.hitPoints + creature.energyPoints} / {stats.hePool} used
              {stats.heRemaining < 0 && <span className="ml-2">({stats.heRemaining} over!)</span>}
            </div>
          </div>

          {/* Abilities */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Ability Scores</h3>
              <span className={cn('text-sm font-medium', stats.abilityRemaining < 0 ? 'text-red-600' : 'text-gray-500')}>
                Remaining: {stats.abilityRemaining}
              </span>
            </div>
            <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
              {(Object.keys(creature.abilities) as Array<keyof typeof creature.abilities>).map((ability) => (
                <div key={ability} className="p-3 bg-gray-50 rounded-lg text-center">
                  <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                    {ability}
                  </label>
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => updateAbility(ability, Math.max(-4, creature.abilities[ability] - 1))}
                      className="btn-stepper btn-stepper-danger"
                    >
                      −
                    </button>
                    <span className={cn(
                      'w-10 text-center text-xl font-bold',
                      creature.abilities[ability] > 0 ? 'text-green-600' :
                      creature.abilities[ability] < 0 ? 'text-red-600' : 'text-gray-600'
                    )}>
                      {creature.abilities[ability] >= 0 ? '+' : ''}{creature.abilities[ability]}
                    </span>
                    <button
                      onClick={() => updateAbility(ability, Math.min(7, creature.abilities[ability] + 1))}
                      className="btn-stepper btn-stepper-success"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>
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
                <ChipList 
                  items={creature.senses} 
                  onRemove={(item) => removeFromArray('senses', item)}
                  color="bg-blue-100 text-blue-800"
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
                <ChipList 
                  items={creature.movementTypes} 
                  onRemove={(item) => removeFromArray('movementTypes', item)}
                  color="bg-amber-100 text-amber-800"
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
                      <button
                        onClick={() => updateSkill(skill.name, { proficient: !skill.proficient })}
                        className={cn(
                          'w-4 h-4 rounded-full border-2 transition-colors cursor-pointer',
                          skill.proficient 
                            ? 'bg-primary-600 border-primary-600' 
                            : 'bg-white border-gray-300 hover:border-primary-400'
                        )}
                        title={skill.proficient ? 'Proficient (+1)' : 'Not proficient'}
                      />
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
                      {/* Show full bonus: ability + skill value + proficiency */}
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
              options={SKILLS}
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

          {/* Powers */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Powers</h3>
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
          </div>

          {/* Techniques */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Techniques</h3>
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
          </div>

          {/* Feats */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">Feats</h3>
              {creature.feats.length > 0 && (
                <span className="text-sm text-amber-600 font-medium">
                  Total: {creature.feats.reduce((sum, f) => sum + (f.points ?? 1), 0)} pts
                </span>
              )}
            </div>
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
          </div>

          {/* Armaments */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Armaments</h3>
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
          </div>

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

        {/* Resource Summary Sidebar (scrolls with user) */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-md p-6 sticky top-24">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Resource Points</h3>
            
            <div className="space-y-3">
              <div className={cn(
                'flex justify-between p-3 rounded-lg',
                stats.abilityRemaining < 0 ? 'bg-red-50' : 'bg-blue-50'
              )}>
                <span className="text-gray-700">Ability Points</span>
                <span className={cn(
                  'font-bold',
                  stats.abilityRemaining < 0 ? 'text-red-600' : 'text-blue-600'
                )}>
                  {stats.abilityRemaining}
                </span>
              </div>
              
              <div className={cn(
                'flex justify-between p-3 rounded-lg',
                stats.heRemaining < 0 ? 'bg-red-50' : 'bg-blue-50'
              )}>
                <span className="text-gray-700">HP/EN Points</span>
                <span className={cn(
                  'font-bold',
                  stats.heRemaining < 0 ? 'text-red-600' : 'text-blue-600'
                )}>
                  {stats.heRemaining}
                </span>
              </div>
              
              <div className={cn(
                'flex justify-between p-3 rounded-lg',
                stats.skillRemaining < 0 ? 'bg-red-50' : 'bg-blue-50'
              )}>
                <span className="text-gray-700">Skill Points</span>
                <span className={cn(
                  'font-bold',
                  stats.skillRemaining < 0 ? 'text-red-600' : 'text-blue-600'
                )}>
                  {stats.skillRemaining}
                </span>
              </div>
              
              <div className={cn(
                'flex justify-between p-3 rounded-lg',
                stats.featRemaining < 0 ? 'bg-red-50' : 'bg-amber-50'
              )}>
                <span className="text-gray-700">Feat Points</span>
                <span className={cn(
                  'font-bold',
                  stats.featRemaining < 0 ? 'text-red-600' : 'text-amber-600'
                )}>
                  {stats.featRemaining}
                </span>
              </div>
              
              <div className="flex justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-gray-700">Training Points</span>
                <span className="font-bold text-amber-600">{stats.trainingPoints}</span>
              </div>
              
              <div className="flex justify-between p-3 bg-amber-50 rounded-lg">
                <span className="text-gray-700">Currency</span>
                <span className="font-bold text-amber-600">{stats.currency}c</span>
              </div>

              <hr className="my-4 border-gray-200" />

              {/* Proficiency Points Section */}
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="text-sm font-medium text-gray-700 mb-2">Proficiency Allocation</div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Power Prof</span>
                  <span className="font-medium">{creature.powerProficiency}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Martial Prof</span>
                  <span className="font-medium">{creature.martialProficiency}</span>
                </div>
                <div className="flex justify-between text-sm mt-1 pt-1 border-t border-gray-200">
                  <span className="text-gray-600">Total</span>
                  <span className={cn(
                    'font-bold',
                    (creature.powerProficiency + creature.martialProficiency) > stats.proficiency
                      ? 'text-red-600' : 'text-green-600'
                  )}>
                    {creature.powerProficiency + creature.martialProficiency} / {stats.proficiency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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
    </div>
  );
}

export default function CreatureCreatorPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <CreatureCreatorContent />
      </div>
    </ProtectedRoute>
  );
}
