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
import { cn } from '@/lib/utils';
import { LoginPromptModal, GridListRow, DecrementButton, IncrementButton, ValueStepper, UnifiedSelectionModal, ItemCard, SkillRow, type SelectableItem, type ColumnValue } from '@/components/shared';
import { useAuthStore } from '@/stores/auth-store';
import { useUserPowers, useUserTechniques, useUserItems, useUserCreatures, usePowerParts, useTechniqueParts, useCreatureFeats, useItemProperties, useRTDBSkills } from '@/hooks';
import {
  transformUserPowerToDisplayItem,
  transformUserTechniqueToDisplayItem,
  transformCreatureFeatToDisplayItem,
  transformUserItemToDisplayItem,
  creaturePowerToDisplayItem,
  creatureTechniqueToDisplayItem,
  creatureFeatToDisplayItem,
  creatureArmamentToDisplayItem,
  displayItemToCreaturePower,
  displayItemToCreatureTechnique,
  displayItemToCreatureFeat,
  displayItemToCreatureArmament,
  type CreaturePower,
  type CreatureTechnique,
  type CreatureFeat,
  type CreatureArmament,
} from './transformers';
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
import { IconButton, Button, Input, Select, PageContainer, PageHeader, Textarea, Modal } from '@/components/ui';
import { X, Trash2, Skull, FolderOpen } from 'lucide-react';
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
import type { DisplayItem } from '@/types/items';

// =============================================================================
// Creature-specific Constants
// =============================================================================

const LEVEL_OPTIONS = [
  { value: '0.25', label: '1/4' },
  { value: '0.5', label: '1/2' },
  { value: '0.75', label: '3/4' },
  ...Array.from({ length: 30 }, (_, i) => ({ value: String(i + 1), label: String(i + 1) })),
];

// Convert CREATURE_TYPES to Select options format
const CREATURE_TYPE_OPTIONS = CREATURE_TYPES.map(type => ({ value: type, label: type }));

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
// Types (remaining local types - others imported from transformers)
// =============================================================================

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
  color = 'bg-surface-alt text-text-secondary' 
}: { 
  items: string[]; 
  onRemove: (item: string) => void;
  color?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-text-muted italic">None</p>;
  
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
            className="text-text-muted hover:text-danger-500"
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
  color = 'bg-surface-alt text-text-secondary',
  rowHoverClass,
  descriptions
}: { 
  items: string[]; 
  onRemove: (item: string) => void;
  color?: string;
  rowHoverClass?: string;
  descriptions: Record<string, string>;
}) {
  if (items.length === 0) return <p className="text-sm text-text-muted italic">None</p>;
  
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
            rowHoverClass={rowHoverClass}
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
    <div className="flex items-center gap-2 mt-2">
      <select
        value={selectedValue}
        onChange={(e) => setSelectedValue(e.target.value)}
        className="flex-1 min-w-0 px-3 py-2 border border-border-light rounded-lg text-sm bg-surface"
      >
        <option value="">{placeholder}</option>
        {availableOptions.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      <Button
        size="sm"
        onClick={handleAdd}
        disabled={!selectedValue}
        className="flex-shrink-0"
      >
        Add
      </Button>
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
    <div className="p-3 bg-surface-alt rounded-lg text-center">
      <label className="block text-xs font-medium text-text-muted mb-1 uppercase">
        {name}
      </label>
      <div className="text-2xl font-bold text-text-primary mb-1">{totalValue}</div>
      <div className="flex items-center justify-center gap-1">
        <DecrementButton
          onClick={() => onChange(Math.max(0, bonusValue - 1))}
          disabled={bonusValue <= 0}
          size="sm"
        />
        <span className="text-xs text-text-muted w-8">+{bonusValue}</span>
        <IncrementButton
          onClick={() => onChange(bonusValue + 1)}
          size="sm"
        />
      </div>
    </div>
  );
}

// =============================================================================
// Modal Components (LoadCreatureModal, UnifiedSelectionModal for add modals)
// =============================================================================

/** Convert DisplayItem to SelectableItem for UnifiedSelectionModal; stores DisplayItem in data for conversion back */
function displayItemToSelectableItem(item: DisplayItem, columns?: string[]): SelectableItem {
  const cols: ColumnValue[] = [];
  if (columns && columns.length > 0) {
    columns.forEach(key => {
      const stat = item.stats?.find((s: { label: string }) => s.label.toLowerCase() === key.toLowerCase());
      const val = stat?.value ?? (key === 'Cost' && item.cost != null ? `${item.cost}${item.costLabel || ''}` : undefined) ?? item[key as keyof DisplayItem];
      cols.push({ key, value: val != null ? String(val) : '-' });
    });
  } else if (item.stats && item.stats.length > 0) {
    item.stats.slice(0, 4).forEach((s: { label: string; value: string | number }) => {
      cols.push({ key: s.label, value: s.value ?? '-' });
    });
  } else if (item.cost != null) {
    cols.push({ key: 'Points', value: `${item.cost}${item.costLabel || ''}` });
  }
  const badges = item.badges?.map(b => ({ label: b.label, color: 'gray' as const })) ?? [];
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    columns: cols.length > 0 ? cols : undefined,
    badges: badges.length > 0 ? badges : undefined,
    data: item,
  };
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
  
  // Custom header for Modal
  const modalHeader = (
    <div className="p-4 border-b flex justify-between items-center">
      <h2 className="text-xl font-bold">Load Creature from Library</h2>
      <IconButton variant="ghost" onClick={onClose} label="Close"><X className="w-5 h-5" /></IconButton>
    </div>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      header={modalHeader}
      showCloseButton={false}
      contentClassName="p-4 overflow-y-auto max-h-[60vh]"
      className="max-h-[80vh]"
    >
      {userCreatures.length === 0 ? (
        <p className="text-text-muted text-center py-8">No creatures in your library</p>
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
              className="w-full p-3 text-left bg-surface-alt hover:bg-primary-50 rounded-lg border border-border-light"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-sm text-text-muted">
                Level {c.level} {(c as unknown as CreatureState).type || 'Creature'}
              </div>
            </button>
          ))}
        </div>
      )}
    </Modal>
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
  
  // Data for item selection modals
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  
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
  
  // Transform user library data to DisplayItem[] for modals
  const powerDisplayItems = useMemo(() => 
    userPowers.map(p => transformUserPowerToDisplayItem(p, powerPartsDb)),
    [userPowers, powerPartsDb]
  );
  
  const techniqueDisplayItems = useMemo(() => 
    userTechniques.map(t => transformUserTechniqueToDisplayItem(t, techniquePartsDb)),
    [userTechniques, techniquePartsDb]
  );
  
  const featDisplayItems = useMemo(() => {
    const selectedIds = new Set(creature.feats.map(f => f.id));
    return creatureFeatsData
      .map(f => transformCreatureFeatToDisplayItem(f, selectedIds, MECHANICAL_CREATURE_FEAT_IDS))
      .filter((f): f is NonNullable<typeof f> => f !== null);
  }, [creatureFeatsData, creature.feats]);
  
  const armamentDisplayItems = useMemo(() => {
    const selectedIds = new Set(creature.armaments.map(a => a.id));
    return userItems
      .filter(item => !selectedIds.has(item.docId))
      .map(item => transformUserItemToDisplayItem(item, itemPropertiesDb));
  }, [userItems, creature.armaments, itemPropertiesDb]);

  // Convert to SelectableItem for UnifiedSelectionModal (GridListRow list style)
  const powerSelectableItems = useMemo(() => 
    powerDisplayItems.map(p => displayItemToSelectableItem(p, ['EN', 'Action', 'Range'])),
    [powerDisplayItems]
  );
  const techniqueSelectableItems = useMemo(() => 
    techniqueDisplayItems.map(t => displayItemToSelectableItem(t, ['EN', 'TP', 'Action'])),
    [techniqueDisplayItems]
  );
  const featSelectableItems = useMemo(() => 
    featDisplayItems.map(f => displayItemToSelectableItem(f)),
    [featDisplayItems]
  );
  const armamentSelectableItems = useMemo(() => 
    armamentDisplayItems.map(a => displayItemToSelectableItem(a, ['Type', 'TP', 'Cost'])),
    [armamentDisplayItems]
  );

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
  
  // Create lookup map for skill ID to name (for base_skill_id lookups)
  const skillIdToName = useMemo(() => {
    return new Map(skillsData.map(s => [s.id, s.name]));
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
      // If this skill has a base_skill_id, only show it if the base skill is already added
      if (skill.base_skill_id !== undefined) {
        const baseSkillName = skillIdToName.get(String(skill.base_skill_id));
        return baseSkillName ? addedSkillNames.includes(baseSkillName) : false;
      }
      // Otherwise, show all base skills
      return true;
    }).map(skill => skill.name);
  }, [skillsData, creature.skills, skillIdToName]);

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
    <PageContainer size="xl">
      <PageHeader
        icon={<Skull className="w-8 h-8 text-primary-600" />}
        title="Creature Creator"
        description="Design custom creatures, monsters, and NPCs. Configure abilities, defenses, skills, and combat options."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => user ? setShowLoadModal(true) : setShowLoginPrompt(true)}
              title={user ? "Load from library" : "Log in to load from library"}
            >
              <FolderOpen className="w-5 h-5" />
              Load
            </Button>
            <Button
              variant="secondary"
              onClick={handleReset}
            >
              Reset
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              isLoading={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </>
        }
        className="mb-6"
      />

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info - name, description, level, type, size (matches other creators) */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Name</label>
                <Input
                  type="text"
                  value={creature.name}
                  onChange={(e) => updateCreature({ name: e.target.value })}
                  placeholder="Creature name..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
                <Textarea
                  value={creature.description}
                  onChange={(e) => updateCreature({ description: e.target.value })}
                  placeholder="Describe this creature's appearance, behavior, and special abilities..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Level"
                    value={String(creature.level)}
                    onChange={(e) => updateCreature({ level: parseFloat(e.target.value) })}
                    options={LEVEL_OPTIONS}
                />
                <Select
                  label="Type"
                    value={creature.type}
                    onChange={(e) => updateCreature({ type: e.target.value })}
                    options={CREATURE_TYPE_OPTIONS}
                />
                <Select
                  label="Size"
                    value={creature.size}
                    onChange={(e) => updateCreature({ size: e.target.value })}
                    options={CREATURE_SIZES.map(s => ({ value: s.value, label: s.label }))}
                />
              </div>
            </div>
          </div>

          {/* Archetype Selection */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Archetype</h3>
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Health & Energy</h3>
            <HealthEnergyAllocator
              hpBonus={creature.hitPoints}
              energyBonus={creature.energyPoints}
              poolTotal={stats.hePool}
              maxHp={stats.maxHealth}
              maxEnergy={stats.maxEnergy}
              onHpChange={(val) => updateCreature({ hitPoints: val })}
              onEnergyChange={(val) => updateCreature({ energyPoints: val })}
              enableHoldRepeat
            />
          </div>

          {/* Abilities - Using shared AbilityScoreEditor */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Abilities</h3>
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Defenses</h3>
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
                name="Reflexes"
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Damage Modifiers</h3>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Resistances</label>
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
                <label className="block text-sm font-medium text-text-secondary mb-2">Weaknesses</label>
                <ChipList 
                  items={creature.weaknesses} 
                  onRemove={(item) => removeFromArray('weaknesses', item)}
                  color="bg-danger-light text-danger-700"
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={creature.weaknesses}
                  onAdd={(item) => addToArray('weaknesses', item)}
                  placeholder="Add weakness..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Immunities</label>
                <ChipList 
                  items={creature.immunities} 
                  onRemove={(item) => removeFromArray('immunities', item)}
                  color="bg-power-light text-power-text"
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Senses & Movement</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Senses</label>
                <ExpandableChipList 
                  items={creature.senses} 
                  onRemove={(item) => removeFromArray('senses', item)}
                  color="bg-info-light text-info-700"
                  rowHoverClass="hover:bg-info-200"
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
                <label className="block text-sm font-medium text-text-secondary mb-2">Movement Types</label>
                <ExpandableChipList 
                  items={creature.movementTypes} 
                  onRemove={(item) => removeFromArray('movementTypes', item)}
                  color="bg-amber-100 text-amber-800"
                  rowHoverClass="hover:bg-amber-200"
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Condition Immunities</h3>
            <ChipList 
              items={creature.conditionImmunities} 
              onRemove={(item) => removeFromArray('conditionImmunities', item)}
              color="bg-surface-alt text-text-primary"
            />
            <AddItemDropdown
              options={CONDITIONS}
              selectedItems={creature.conditionImmunities}
              onAdd={(item) => addToArray('conditionImmunities', item)}
              placeholder="Add condition immunity..."
            />
          </div>

          {/* Skills */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-text-primary">Skills</h3>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  stats.skillRemaining < 0 
                    ? 'bg-red-100 text-red-700' 
                    : stats.skillRemaining === 0
                    ? 'bg-green-100 text-green-700'
                    : 'bg-surface-alt text-text-secondary'
                )}>
                  {stats.skillRemaining} remaining
                </span>
              </div>
            </div>
            
            {creature.skills.length === 0 ? (
              <p className="text-sm text-text-muted italic py-4 text-center">No skills added. Use the dropdown below to add skills.</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creature.skills.map(skill => {
                  const bonus = getSkillBonus(skill.name, skill.value, skill.proficient);
                  const ability = skillAbilityMap.get(skill.name);
                  return (
                    <SkillRow
                      key={skill.name}
                      id={skill.name}
                      name={skill.name}
                      proficient={true} // All creature skills are proficient
                      value={skill.value}
                      bonus={bonus}
                      ability={ability}
                      onValueChange={(delta) => updateSkill(skill.name, { value: skill.value + delta })}
                      canIncrease={stats.skillRemaining > 0}
                      onRemove={() => removeSkill(skill.name)}
                      variant="card"
                    />
                  );
                })}
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
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h3 className="text-lg font-bold text-text-primary mb-4">Languages</h3>
            <ChipList 
              items={creature.languages} 
              onRemove={(item) => removeFromArray('languages', item)}
              color="bg-teal-100 text-teal-800"
            />
            <div className="flex gap-2 mt-2">
              <Input
                type="text"
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLanguage()}
                placeholder="Enter language..."
                className="flex-1"
              />
              <Button
                onClick={addLanguage}
                disabled={!newLanguage.trim()}
                size="sm"
              >
                Add
              </Button>
            </div>
          </div>

          {/* Feats - Always visible, below languages (matches other creator ordering) */}
          <CollapsibleSection
            title="Feats"
            subtitle="Special abilities and traits"
            icon="⭐"
            itemCount={creature.feats.length}
            points={{ spent: stats.featSpent, total: stats.featPoints }}
            defaultExpanded={true}
          >
            {creature.feats.length === 0 ? (
              <p className="text-sm text-text-muted italic mb-4">No feats added</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creature.feats.map(feat => (
                  <ItemCard
                    key={feat.id}
                    item={creatureFeatToDisplayItem(feat)}
                    mode="manage"
                    actions={{
                      onDelete: () => setCreature(prev => ({
                        ...prev,
                        feats: prev.feats.filter(f => f.id !== feat.id)
                      }))
                    }}
                    compact
                  />
                ))}
              </div>
            )}
            <Button
              onClick={() => setShowFeatModal(true)}
            >
              Add Feat
            </Button>
          </CollapsibleSection>

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
              <p className="text-sm text-text-muted italic mb-4">No powers added</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creature.powers.map(power => (
                  <ItemCard
                    key={power.id}
                    item={creaturePowerToDisplayItem(power)}
                    mode="manage"
                    actions={{
                      onDelete: () => setCreature(prev => ({
                        ...prev,
                        powers: prev.powers.filter(p => p.id !== power.id)
                      }))
                    }}
                    compact
                  />
                ))}
              </div>
            )}
            <Button
              onClick={() => setShowPowerModal(true)}
            >
              Add Power
            </Button>
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
              <p className="text-sm text-text-muted italic mb-4">No techniques added</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creature.techniques.map(tech => (
                  <ItemCard
                    key={tech.id}
                    item={creatureTechniqueToDisplayItem(tech)}
                    mode="manage"
                    actions={{
                      onDelete: () => setCreature(prev => ({
                        ...prev,
                        techniques: prev.techniques.filter(t => t.id !== tech.id)
                      }))
                    }}
                    compact
                  />
                ))}
              </div>
            )}
            <Button
              onClick={() => setShowTechniqueModal(true)}
            >
              Add Technique
            </Button>
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
              <p className="text-sm text-text-muted italic mb-4">No armaments added</p>
            ) : (
              <div className="space-y-2 mb-4">
                {creature.armaments.map(armament => (
                  <ItemCard
                    key={armament.id}
                    item={creatureArmamentToDisplayItem(armament)}
                    mode="manage"
                    actions={{
                      onDelete: () => setCreature(prev => ({
                        ...prev,
                        armaments: prev.armaments.filter(a => a.id !== armament.id)
                      }))
                    }}
                    compact
                  />
                ))}
              </div>
            )}
            <Button
              onClick={() => setShowArmamentModal(true)}
            >
              Add Armament
            </Button>
          </CollapsibleSection>
        </div>

        {/* Creature Summary Sidebar - resource boxes at top, summary points, line items (D&D stat block style) */}
        <div className="self-start sticky top-24 space-y-6">
          <CreatorSummaryPanel
            title="Creature Summary"
            badge={creature.name ? { label: creature.name, className: 'bg-primary-100 text-primary-700' } : undefined}
            resourceBoxes={[
              { label: 'Ability Pts', value: stats.abilityRemaining, variant: stats.abilityRemaining < 0 ? 'danger' : stats.abilityRemaining === 0 ? 'success' : 'info' },
              { label: 'Skill Pts', value: stats.skillRemaining, variant: stats.skillRemaining < 0 ? 'danger' : stats.skillRemaining === 0 ? 'success' : 'info' },
              { label: 'Feat Pts', value: stats.featRemaining, variant: stats.featRemaining < 0 ? 'danger' : stats.featRemaining === 0 ? 'success' : 'warning' },
              { label: 'Training Pts', value: stats.trainingPoints, variant: stats.trainingPoints < 0 ? 'danger' : 'warning' },
              { label: 'Currency', value: stats.currency, variant: stats.currency < 0 ? 'danger' : 'warning' },
            ]}
            quickStats={[
              { label: 'HP', value: stats.maxHealth, color: 'bg-health-light text-health' },
              { label: 'EN', value: stats.maxEnergy, color: 'bg-energy-light text-energy' },
              { label: 'SPD', value: stats.speed, color: 'bg-surface-alt' },
              { label: 'EVA', value: stats.evasion, color: 'bg-surface-alt' },
              { label: 'PROF', value: `+${stats.proficiency}`, color: 'bg-surface-alt' },
            ]}
            statRows={[
              { label: 'Abilities', value: (['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const).map((k, i) => {
                const abbr = ['STR', 'VIT', 'AGI', 'ACU', 'INT', 'CHA'][i];
                const v = creature.abilities[k];
                return `${abbr} ${v >= 0 ? '+' : ''}${v}`;
              }).join(', ') },
              { label: 'Archetype', value: creature.archetypeType.charAt(0).toUpperCase() + creature.archetypeType.slice(1) },
              { label: 'Level', value: creature.level },
              { label: 'Type', value: creature.type },
              { label: 'Size', value: creature.size.charAt(0).toUpperCase() + creature.size.slice(1) },
            ]}
            lineItems={[
              { label: 'Skills', items: creature.skills.map(s => `${s.name} ${getSkillBonus(s.name, s.value, s.proficient) >= 0 ? '+' : ''}${getSkillBonus(s.name, s.value, s.proficient)}`) },
              { label: 'Resistances', items: creature.resistances },
              { label: 'Immunities', items: creature.immunities },
              { label: 'Weaknesses', items: creature.weaknesses },
              { label: 'Senses', items: creature.senses },
              { label: 'Movement', items: creature.movementTypes },
              { label: 'Languages', items: creature.languages },
            ]}
          />
        </div>
      </div>

      {/* Modals - UnifiedSelectionModal with GridListRow (matches character sheet/codex list style) */}
      <UnifiedSelectionModal
        isOpen={showPowerModal}
        onClose={() => setShowPowerModal(false)}
        onConfirm={(selected) => {
          const items = selected.map(s => s.data as DisplayItem);
          const powers = items.map(displayItemToCreaturePower);
          setCreature(prev => ({ ...prev, powers: [...prev.powers, ...powers] }));
        }}
        items={powerSelectableItems}
        title="Select Powers"
        description="Choose powers from your library to add to this creature"
        maxSelections={10}
        itemLabel="power"
        searchPlaceholder="Search powers..."
        columns={[{ key: 'EN', label: 'EN', sortable: true }, { key: 'Action', label: 'Action', sortable: true }, { key: 'Range', label: 'Range', sortable: true }]}
        gridColumns="1.5fr 0.6fr 0.6fr 0.8fr"
        size="xl"
      />
      <UnifiedSelectionModal
        isOpen={showTechniqueModal}
        onClose={() => setShowTechniqueModal(false)}
        onConfirm={(selected) => {
          const items = selected.map(s => s.data as DisplayItem);
          const techniques = items.map(displayItemToCreatureTechnique);
          setCreature(prev => ({ ...prev, techniques: [...prev.techniques, ...techniques] }));
        }}
        items={techniqueSelectableItems}
        title="Select Techniques"
        description="Choose techniques from your library to add to this creature"
        maxSelections={10}
        itemLabel="technique"
        searchPlaceholder="Search techniques..."
        columns={[{ key: 'EN', label: 'EN', sortable: true }, { key: 'TP', label: 'TP', sortable: true }, { key: 'Action', label: 'Action', sortable: true }]}
        gridColumns="1.5fr 0.5fr 0.5fr 0.8fr"
        size="xl"
      />
      <UnifiedSelectionModal
        isOpen={showFeatModal}
        onClose={() => setShowFeatModal(false)}
        onConfirm={(selected) => {
          const items = selected.map(s => s.data as DisplayItem);
          const feats = items.map(displayItemToCreatureFeat);
          setCreature(prev => ({ ...prev, feats: [...prev.feats, ...feats] }));
        }}
        items={featSelectableItems}
        title="Select Feats"
        description="Choose creature feats to add"
        maxSelections={10}
        itemLabel="feat"
        searchPlaceholder="Search feats..."
        columns={[{ key: 'Points', label: 'Pts', sortable: true }]}
        gridColumns="1.5fr 0.6fr"
        size="xl"
      />
      <UnifiedSelectionModal
        isOpen={showArmamentModal}
        onClose={() => setShowArmamentModal(false)}
        onConfirm={(selected) => {
          const items = selected.map(s => s.data as DisplayItem);
          const armaments = items.map(displayItemToCreatureArmament);
          setCreature(prev => ({ ...prev, armaments: [...prev.armaments, ...armaments] }));
        }}
        items={armamentSelectableItems}
        title="Select Armaments"
        description="Choose items from your library to equip on this creature"
        maxSelections={10}
        itemLabel="armament"
        searchPlaceholder="Search items..."
        columns={[{ key: 'Type', label: 'Type', sortable: true }, { key: 'TP', label: 'TP', sortable: true }, { key: 'Cost', label: 'Cost', sortable: true }]}
        gridColumns="1.5fr 0.6fr 0.5fr 0.6fr"
        size="xl"
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
    </PageContainer>
  );
}

export default function CreatureCreatorPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <CreatureCreatorContent />
    </div>
  );
}
