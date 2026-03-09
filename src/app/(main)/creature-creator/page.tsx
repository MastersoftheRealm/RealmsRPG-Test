/**
 * Creature Creator Page
 * =====================
 * Tool for creating custom creatures and NPCs
 * Full-featured version matching vanilla functionality
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LoginPromptModal, ConfirmActionModal, UnifiedSelectionModal, ItemCard, SkillRow, GridListRow, ListHeader, SourceFilter, AddSkillModal, AddSubSkillModal } from '@/components/shared';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { useAuthStore } from '@/stores/auth-store';
import { useUserPowers, useUserTechniques, useUserItems, useUserCreatures, usePowerParts, useTechniqueParts, useCreatureFeats, useItemProperties, useCodexSkills, useAdmin, useCreatorSave, usePublicLibrary, type CreatureFeat, type UserPower, type UserTechnique, type UserItem, type Skill } from '@/hooks';
import {
  transformUserPowerToDisplayItem,
  transformUserTechniqueToDisplayItem,
  transformCreatureFeatToDisplayItem,
  transformUserItemToDisplayItem,
  creatureFeatToDisplayItem,
  creatureArmamentToDisplayItem,
  displayItemToCreaturePower,
  displayItemToCreatureTechnique,
  displayItemToCreatureFeat,
  displayItemToCreatureArmament,
} from './transformers';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { ChipData } from '@/components/shared/grid-list-row';
import { 
  calculateCreatureTrainingPoints, 
  calculateCreatureCurrency,
  calculateCreatureFeatPoints,
  calculateHealthEnergyPool,
  calculateProficiency,
  calculateAbilityPoints,
  calculateSkillPointsForEntity,
  calculateSkillBonusWithProficiency,
} from '@/lib/game/formulas';
import { Button, Input, Select, Textarea, Alert, IconButton } from '@/components/ui';
import { Skull, X } from 'lucide-react';
import { CREATURE_FEAT_IDS, MECHANICAL_CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { CREATURE_SIZES, CONDITIONS } from '@/lib/game/creator-constants';
import {
  HealthEnergyAllocator,
  AbilityScoreEditor,
  ArchetypeSelector,
  CollapsibleSection,
  CreatorSummaryPanel,
  CreatorSaveToolbar,
  CreatorLayout,
  type ArchetypeType,
} from '@/components/creator';
import type { AbilityName } from '@/types';
import type { DisplayItem } from '@/types/items';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import {
  LEVEL_OPTIONS,
  CREATURE_TYPE_OPTIONS,
  DAMAGE_TYPES,
  SENSES,
  MOVEMENT_TYPES,
  SENSE_TO_FEAT_ID,
  MOVEMENT_TO_FEAT_ID,
  initialState,
  CREATURE_CREATOR_CACHE_KEY,
} from './creature-creator-constants';
import {
  ChipList,
  ExpandableChipList,
  AddItemDropdown,
  DefenseBlock,
  displayItemToSelectableItem,
} from './CreatureCreatorHelpers';
import type { SelectableItem } from '@/components/shared';
import { LoadCreatureModal } from './LoadCreatureModal';

// =============================================================================
// Main Component
// =============================================================================

function CreatureCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const { data: creatureFeatsData = [] } = useCreatureFeats();
  const { data: skillsData = [] } = useCodexSkills();
  
  // Data for item selection modals
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: userItems = [] } = useUserItems();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: publicPowers = [] } = usePublicLibrary('powers');
  const { data: publicTechniques = [] } = usePublicLibrary('techniques');
  const { data: publicItems = [] } = usePublicLibrary('items');
  const { data: publicCreatures = [] } = usePublicLibrary('creatures');
  const { data: userCreatures = [] } = useUserCreatures();
  const searchParams = useSearchParams();
  const editCreatureId = searchParams.get('edit');
  
  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [creature, setCreature] = useState<CreatureState>(initialState);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [showNegativeFeatModal, setShowNegativeFeatModal] = useState(false);
  const [showArmamentModal, setShowArmamentModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showAddSkillModal, setShowAddSkillModal] = useState(false);
  const [showAddSubSkillModal, setShowAddSubSkillModal] = useState(false);
  const [newLanguage, setNewLanguage] = useState('');
  const [librarySource, setLibrarySource] = useState<SourceFilterValue>('all');
  
  // Normalize public API item to UserPower/UserTechnique/UserItem shape (with docId for transformers)
  const normalizedPublicPowers = useMemo(() => 
    (publicPowers as Record<string, unknown>[]).map((p) => ({
      id: String(p.id ?? p.docId ?? ''),
      docId: String(p.id ?? p.docId ?? ''),
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      parts: p.parts ?? [],
      actionType: p.actionType,
      isReaction: !!p.isReaction,
      range: p.range,
      area: p.area,
      duration: p.duration,
      damage: p.damage,
    })) as UserPower[],
    [publicPowers]
  );
  const normalizedPublicTechniques = useMemo(() => 
    (publicTechniques as Record<string, unknown>[]).map((t) => ({
      id: String(t.id ?? t.docId ?? ''),
      docId: String(t.id ?? t.docId ?? ''),
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: t.parts ?? [],
      weapon: t.weapon,
      damage: t.damage,
    })) as UserTechnique[],
    [publicTechniques]
  );
  const normalizedPublicItems = useMemo(() => 
    (publicItems as Record<string, unknown>[]).map((i) => ({
      id: String(i.id ?? i.docId ?? ''),
      docId: String(i.id ?? i.docId ?? ''),
      name: String(i.name ?? ''),
      description: String(i.description ?? ''),
      type: (i.type as string) || 'weapon',
      properties: i.properties ?? [],
      damage: i.damage,
      armorValue: i.armorValue,
    })) as UserItem[],
    [publicItems]
  );
  
  // Raw lists by source (for building selectable items with parts/properties chips)
  const powerList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userPowers : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? normalizedPublicPowers : [];
    return [...my, ...pub] as UserPower[];
  }, [userPowers, normalizedPublicPowers, librarySource]);
  const techniqueList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userTechniques : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? normalizedPublicTechniques : [];
    return [...my, ...pub] as UserTechnique[];
  }, [userTechniques, normalizedPublicTechniques, librarySource]);
  const armamentList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userItems : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? normalizedPublicItems : [];
    const selectedIds = new Set(creature.armaments.map((a: { id: string }) => String(a.id)).filter((id) => id.length > 0));
    return [...my, ...pub].filter((item: UserItem) => !selectedIds.has(item.docId)) as UserItem[];
  }, [userItems, normalizedPublicItems, librarySource, creature.armaments]);

  // Transform library data to DisplayItem[] (for onConfirm payload)
  const powerDisplayItems = useMemo(() =>
    powerList.map((p: UserPower) => transformUserPowerToDisplayItem(p, powerPartsDb)),
    [powerList, powerPartsDb]
  );
  const techniqueDisplayItems = useMemo(() =>
    techniqueList.map((t: UserTechnique) => transformUserTechniqueToDisplayItem(t, techniquePartsDb)),
    [techniqueList, techniquePartsDb]
  );
  
  const featDisplayItems = useMemo(() => {
    const selectedIds = new Set(
      creature.feats.map((f: { id: string }) => String(f.id)).filter((id) => id.length > 0)
    );
    return creatureFeatsData
      .map((f: CreatureFeat) => transformCreatureFeatToDisplayItem(f, selectedIds, MECHANICAL_CREATURE_FEAT_IDS))
      .filter((f: DisplayItem | null): f is DisplayItem => f !== null);
  }, [creatureFeatsData, creature.feats]);
  
  const armamentDisplayItems = useMemo(() =>
    armamentList.map((item: UserItem) => transformUserItemToDisplayItem(item, itemPropertiesDb)),
    [armamentList, itemPropertiesDb]
  );

  // Build SelectableItems with detailSections (parts/properties chips) and area/range in expanded view — same logic as add-library-item-modal
  const powerSelectableItems = useMemo(() => {
    return powerList.map((power: UserPower) => {
      const displayItem = transformUserPowerToDisplayItem(power, powerPartsDb);
      const doc: PowerDocument = {
        name: String(power.name ?? ''),
        description: String(power.description ?? ''),
        parts: Array.isArray(power.parts) ? (power.parts as PowerDocument['parts']) : [],
        damage: power.damage as PowerDocument['damage'],
        actionType: power.actionType,
        isReaction: power.isReaction,
        range: power.range as PowerDocument['range'],
        area: power.area as PowerDocument['area'],
        duration: power.duration as PowerDocument['duration'],
      };
      const display = derivePowerDisplay(doc, powerPartsDb);
      const partChips: ChipData[] = display.partChips.map((chip) => ({
        name: chip.text.split(' | TP:')[0].trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
        category: chip.finalTP && chip.finalTP > 0 ? ('cost' as const) : ('default' as const),
      }));
      const base = displayItemToSelectableItem(displayItem, ['Action', 'Damage', 'Area']);
      return {
        ...base,
        detailSections: partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined,
        totalCost: display.tp > 0 ? display.tp : undefined,
        costLabel: display.tp > 0 ? 'TP' : undefined,
        data: displayItem,
      };
    });
  }, [powerList, powerPartsDb]);
  const techniqueSelectableItems = useMemo(() => {
    return techniqueList.map((technique: UserTechnique) => {
      const displayItem = transformUserTechniqueToDisplayItem(technique, techniquePartsDb);
      const doc: TechniqueDocument = {
        name: String(technique.name ?? ''),
        description: String(technique.description ?? ''),
        parts: Array.isArray(technique.parts) ? (technique.parts as TechniqueDocument['parts']) : [],
        damage: Array.isArray(technique.damage) && technique.damage[0] ? technique.damage[0] : (technique.damage as TechniqueDocument['damage']),
        weapon: technique.weapon as TechniqueDocument['weapon'],
      };
      const display = deriveTechniqueDisplay(doc, techniquePartsDb);
      const partChips: ChipData[] = display.partChips.map((chip) => ({
        name: chip.text.split(' | TP:')[0].trim(),
        description: chip.description,
        cost: chip.finalTP,
        costLabel: 'TP',
        category: chip.finalTP && chip.finalTP > 0 ? ('cost' as const) : ('default' as const),
      }));
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Weapon', 'Training Pts']);
      return {
        ...base,
        detailSections: partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined,
        totalCost: typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined,
        costLabel: typeof display.tp === 'number' && display.tp > 0 ? 'TP' : undefined,
        data: displayItem,
      };
    });
  }, [techniqueList, techniquePartsDb]);
  const featSelectableItems = useMemo(() => 
    featDisplayItems
      .filter((f: DisplayItem) => Number(f.cost ?? 0) >= 0)
      .map((f: DisplayItem) => displayItemToSelectableItem(f)),
    [featDisplayItems]
  );
  const featSelectableItemsNegative = useMemo(() => 
    featDisplayItems
      .filter((f: DisplayItem) => Number(f.cost ?? 0) < 0)
      .map((f: DisplayItem) => displayItemToSelectableItem(f)),
    [featDisplayItems]
  );
  const armamentSelectableItems = useMemo(() => {
    return armamentList.map((item: UserItem) => {
      const displayItem = transformUserItemToDisplayItem(item, itemPropertiesDb);
      const props = (Array.isArray(item.properties) ? item.properties : []) as Array<{ id?: string | number; name?: string; op_1_lvl?: number }>;
      const propertyChips: ChipData[] = props.map((prop) => {
        const propName = typeof prop === 'string' ? prop : (prop?.name ?? '');
        const dbProp = itemPropertiesDb.find((p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase());
        const baseTp = dbProp?.base_tp ?? (dbProp as { tp_cost?: number })?.tp_cost ?? 0;
        const optLevel = typeof prop === 'object' && prop?.op_1_lvl != null ? prop.op_1_lvl : 1;
        const cost = baseTp * optLevel;
        const baseDesc = dbProp?.description;
        const descWithOpt = baseDesc?.trim()
          ? (optLevel > 1 ? `${baseDesc.trim()}\n\nOption 1: Lv.${optLevel}` : baseDesc.trim())
          : (optLevel > 1 ? `Option 1: Lv.${optLevel}` : undefined);
        return {
          name: dbProp?.name || propName,
          description: descWithOpt,
          cost: cost > 0 ? cost : undefined,
          costLabel: 'TP',
          category: cost > 0 ? ('cost' as const) : ('default' as const),
          level: optLevel > 1 ? optLevel : undefined,
        };
      });
      const totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
      const base = displayItemToSelectableItem(displayItem, ['Type', 'TP', 'Cost']);
      return {
        ...base,
        detailSections: propertyChips.length > 0 ? [{ label: 'Properties & Proficiencies', chips: propertyChips }] : undefined,
        totalCost: totalCost ?? undefined,
        costLabel: totalCost != null ? 'TP' : undefined,
        data: displayItem,
      };
    });
  }, [armamentList, itemPropertiesDb]);

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
    creatureFeatsData.forEach((feat: CreatureFeat) => {
      map.set(feat.id, feat.points);
    });
    return map;
  }, [creatureFeatsData]);
  
  // Create lookup map for skill abilities
  const skillAbilityMap = useMemo(() => {
    const map = new Map<string, string>();
    skillsData.forEach((skill: Skill) => {
      if (skill.ability) {
        map.set(skill.name, skill.ability.toLowerCase());
      }
    });
    return map;
  }, [skillsData]);
  
  // Feat point cost labels for senses/movement (varies by type)
  const getSenseCostLabel = useCallback((sense: string) => {
    const featId = SENSE_TO_FEAT_ID[sense];
    if (featId == null) return undefined;
    const cost = featPointsMap.get(String(featId));
    return cost != null ? `${cost >= 0 ? '+' : ''}${cost} pt` : undefined;
  }, [featPointsMap]);
  const getMovementCostLabel = useCallback((movement: string) => {
    const featId = MOVEMENT_TO_FEAT_ID[movement];
    if (featId == null) return undefined;
    const cost = featPointsMap.get(String(featId));
    return cost != null ? `${cost >= 0 ? '+' : ''}${cost} pt` : undefined;
  }, [featPointsMap]);

  // Create description maps for senses and movements
  const senseDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    SENSES.forEach((sense: { value: string; description: string }) => {
      map[sense.value] = sense.description;
    });
    return map;
  }, []);
  
  const movementDescriptions = useMemo(() => {
    const map: Record<string, string> = {};
    MOVEMENT_TYPES.forEach((movement: { value: string; description: string }) => {
      map[movement.value] = movement.description;
    });
    return map;
  }, []);
  
  // Calculate skill bonus (uses shared utility from formulas.ts)
  const getSkillBonus = useCallback((skillName: string, skillValue: number, proficient: boolean) => {
    const abilityName = skillAbilityMap.get(skillName) || '';
    return calculateSkillBonusWithProficiency(abilityName, skillValue, creature.abilities, proficient);
  }, [skillAbilityMap, creature.abilities]);
  
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
      [field]: (prev[field] as string[]).filter((i: string) => i !== item)
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
    const skillPoints = calculateSkillPointsForEntity(Math.max(1, Math.floor(level)), 'creature');
    
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
      // Feat point costs for damage modifiers / condition immunities (for UI labels)
      resistanceFeatCost,
      immunityFeatCost,
      weaknessFeatCost,
      conditionImmunityFeatCost,
    };
  }, [creature, featPointsMap]);

  const getPayload = useCallback(() => ({
    name: creature.name.trim(),
    data: { ...creature },
  }), [creature]);

  // Collapsed summaries for CollapsibleSections
  const featsSummary = useMemo(() => {
    if (creature.feats.length === 0) return 'No feats';
    const names = creature.feats.slice(0, 4).map((f: { name?: string }) => f.name || 'Unknown');
    const more = creature.feats.length > 4 ? ` +${creature.feats.length - 4} more` : '';
    return `${names.join(', ')}${more}`;
  }, [creature.feats]);
  const powersSummary = useMemo(() => {
    if (creature.powers.length === 0) return 'No powers';
    const names = creature.powers.slice(0, 4).map((p: { name?: string }) => p.name || 'Unknown');
    const more = creature.powers.length > 4 ? ` +${creature.powers.length - 4} more` : '';
    return `${names.join(', ')}${more}`;
  }, [creature.powers]);
  const techniquesSummary = useMemo(() => {
    if (creature.techniques.length === 0) return 'No techniques';
    const names = creature.techniques.slice(0, 4).map((t: { name?: string }) => t.name || 'Unknown');
    const more = creature.techniques.length > 4 ? ` +${creature.techniques.length - 4} more` : '';
    return `${names.join(', ')}${more}`;
  }, [creature.techniques]);
  const armamentsSummary = useMemo(() => {
    if (creature.armaments.length === 0) return 'No armaments';
    const names = creature.armaments.slice(0, 4).map((a: { name?: string }) => a.name || 'Unknown');
    const more = creature.armaments.length > 4 ? ` +${creature.armaments.length - 4} more` : '';
    return `${names.join(', ')}${more}`;
  }, [creature.armaments]);

  const save = useCreatorSave({
    type: 'creatures',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (creature)? The existing public creature with this name will be replaced.`
        : `Are you sure you wish to publish this creature "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Creature saved!',
    publicSuccessMessage: 'Creature saved to Realms Library!',
  });

  // Merged creatures (user + public) for ?edit= load from admin public library
  const mergedCreaturesForEdit = useMemo(() => {
    const user = (userCreatures ?? []) as unknown as Array<Record<string, unknown> & { id?: string; docId?: string }>;
    const pub = (publicCreatures as Array<Record<string, unknown>>).map((c) => ({
      ...c,
      id: String(c.id ?? c.docId ?? ''),
      docId: String(c.id ?? c.docId ?? ''),
    }));
    return [...user, ...pub];
  }, [userCreatures, publicCreatures]);

  // Load creature for editing from URL (?edit=<id>) when coming from admin public library
  useEffect(() => {
    if (!editCreatureId || !mergedCreaturesForEdit.length || isInitialized) return;
    const c = mergedCreaturesForEdit.find(
      (x) => String((x as { id?: string; docId?: string }).id) === editCreatureId || String((x as { id?: string; docId?: string }).docId) === editCreatureId
    ) as Record<string, unknown> | undefined;
    if (!c) {
      setIsInitialized(true);
      return;
    }
    const loaded: CreatureState = {
      name: String(c.name ?? ''),
      level: Number(c.level ?? 1),
      type: String(c.type ?? 'Humanoid'),
      size: String(c.size ?? 'medium'),
      description: String(c.description ?? ''),
      archetypeType: (c.archetypeType as CreatureState['archetypeType']) ?? 'power',
      abilities: (c.abilities as CreatureState['abilities']) ?? initialState.abilities,
      defenses: (c.defenses as CreatureState['defenses']) ?? initialState.defenses,
      hitPoints: Number(c.hitPoints ?? 0),
      energyPoints: Number(c.energyPoints ?? 0),
      powerProficiency: Number(c.powerProficiency ?? 0),
      martialProficiency: Number(c.martialProficiency ?? 0),
      enablePowers: (c.enablePowers as boolean) ?? Boolean((c.powers as unknown[])?.length),
      enableTechniques: (c.enableTechniques as boolean) ?? Boolean((c.techniques as unknown[])?.length),
      enableArmaments: (c.enableArmaments as boolean) ?? Boolean((c.armaments as unknown[])?.length),
      resistances: (c.resistances as string[]) ?? [],
      weaknesses: (c.weaknesses as string[]) ?? [],
      immunities: (c.immunities as string[]) ?? [],
      conditionImmunities: (c.conditionImmunities as string[]) ?? [],
      senses: (c.senses as string[]) ?? [],
      movementTypes: (c.movementTypes as string[]) ?? [],
      languages: (c.languages as string[]) ?? [],
      skills: (c.skills as CreatureSkill[]) ?? [],
      powers: (c.powers as CreatureState['powers']) ?? [],
      techniques: (c.techniques as CreatureState['techniques']) ?? [],
      feats: (c.feats as CreatureState['feats']) ?? [],
      armaments: (c.armaments as CreatureState['armaments']) ?? [],
    };
    setCreature(loaded);
    try {
      localStorage.removeItem(CREATURE_CREATOR_CACHE_KEY);
    } catch (_e) {
      // ignore
    }
    save.setSaveMessage({ type: 'success', text: 'Creature loaded from Realms Library.' });
    setTimeout(() => save.setSaveMessage(null), 2000);
    setIsInitialized(true);
  }, [editCreatureId, mergedCreaturesForEdit, isInitialized, save]);

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    await save.handleSave();
  }, [user, save]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(true);
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !creature.languages.includes(newLanguage.trim())) {
      addToArray('languages', newLanguage.trim());
      setNewLanguage('');
    }
  };

  const handleAddSkills = useCallback((skills: Skill[]) => {
    setCreature(prev => {
      const existing = new Set(prev.skills.map((s: CreatureSkill) => s.name.toLowerCase()));
      const toAdd = skills.filter((s: Skill) => !existing.has(String(s.name ?? '').toLowerCase()));
      if (toAdd.length === 0) return prev;
      const newSkills: CreatureSkill[] = toAdd.map((s: Skill) => ({
        name: String(s.name ?? ''),
        value: 0,
        proficient: true,
      }));
      return { ...prev, skills: [...prev.skills, ...newSkills] };
    });
    setShowAddSkillModal(false);
  }, []);

  const handleAddSubSkills = useCallback((skills: Array<Skill & { selectedBaseSkillId?: string; autoAddBaseSkill?: Skill }>) => {
    setCreature(prev => {
      const existing = new Set(prev.skills.map((s: CreatureSkill) => s.name.toLowerCase()));
      const next = [...prev.skills];
      skills.forEach((s: Skill & { autoAddBaseSkill?: Skill }) => {
        if (s.autoAddBaseSkill) {
          const baseName = String(s.autoAddBaseSkill.name ?? '');
          if (baseName && !existing.has(baseName.toLowerCase())) {
            next.push({ name: baseName, value: 0, proficient: true });
            existing.add(baseName.toLowerCase());
          }
        }
        const name = String(s.name ?? '');
        if (name && !existing.has(name.toLowerCase())) {
          next.push({ name, value: 1, proficient: true });
          existing.add(name.toLowerCase());
        }
      });
      return { ...prev, skills: next };
    });
    setShowAddSubSkillModal(false);
  }, []);

  const updateSkill = (skillName: string, updates: Partial<CreatureSkill>) => {
    setCreature(prev => ({
      ...prev,
      skills: prev.skills.map((s: CreatureSkill) => {
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
      skills: prev.skills.filter((s: CreatureSkill) => s.name !== skillName)
    }));
  };

  return (
    <CreatorLayout
      icon={<Skull className="w-8 h-8 text-primary-600" />}
      title="Creature Creator"
      description="Design custom creatures, monsters, and NPCs. Configure abilities, defenses, skills, and combat options."
      actions={
        <CreatorSaveToolbar
          saveTarget={save.saveTarget}
          onSaveTargetChange={save.setSaveTarget}
          onSave={handleSave}
          onLoad={() => (user ? setShowLoadModal(true) : setShowLoginPrompt(true))}
          onReset={handleReset}
          saving={save.saving}
          saveDisabled={!creature.name.trim()}
          showPublicPrivate={isAdmin}
          user={user}
        />
      }
      sidebar={
        <div className="self-start sticky top-24 space-y-6">
          <CreatorSummaryPanel
            title="Creature Summary"
            badge={creature.name ? { label: creature.name, className: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' } : undefined}
            resourceBoxes={[
              { label: 'Ability Pts', value: stats.abilityRemaining, variant: stats.abilityRemaining < 0 ? 'danger' : stats.abilityRemaining === 0 ? 'success' : 'info' },
              { label: 'Skill Pts', value: stats.skillRemaining, variant: stats.skillRemaining < 0 ? 'danger' : stats.skillRemaining === 0 ? 'success' : 'info' },
              { label: 'Feat Pts', value: stats.featRemaining, variant: stats.featRemaining < 0 ? 'danger' : stats.featRemaining === 0 ? 'success' : 'warning' },
              { label: 'Training Pts', value: stats.trainingPoints, variant: stats.trainingPoints < 0 ? 'danger' : 'warning' },
              { label: 'Currency', value: stats.currency, variant: stats.currency < 0 ? 'danger' : 'warning' },
            ]}
            quickStats={[
              { label: 'HP', value: stats.maxHealth, color: 'bg-health-light text-health border border-border-light' },
              { label: 'EN', value: stats.maxEnergy, color: 'bg-energy-light text-energy border border-border-light' },
              { label: 'SPD', value: stats.speed, color: 'bg-surface-alt border border-border-light' },
              { label: 'EVA', value: stats.evasion, color: 'bg-surface-alt border border-border-light' },
              { label: 'PROF', value: `+${stats.proficiency}`, color: 'bg-surface-alt border border-border-light' },
            ]}
            abilitiesChips={(['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const).map((k, i) => {
              const abbr = ['STR', 'VIT', 'AGI', 'ACU', 'INT', 'CHA'][i];
              const v = creature.abilities[k];
              return { abbr, value: v };
            })}
            statRows={[
              { label: 'Archetype', value: creature.archetypeType.charAt(0).toUpperCase() + creature.archetypeType.slice(1) },
              { label: 'Level', value: creature.level },
              { label: 'Type', value: creature.type },
              { label: 'Size', value: creature.size.charAt(0).toUpperCase() + creature.size.slice(1) },
            ]}
            lineItems={[
              { label: 'Skills', items: creature.skills.map((s: CreatureSkill) => `${s.name} ${getSkillBonus(s.name, s.value, s.proficient) >= 0 ? '+' : ''}${getSkillBonus(s.name, s.value, s.proficient)}`) },
              { label: 'Resistances', items: creature.resistances },
              { label: 'Immunities', items: creature.immunities },
              { label: 'Weaknesses', items: creature.weaknesses },
              { label: 'Senses', items: creature.senses },
              { label: 'Movement', items: creature.movementTypes },
              { label: 'Languages', items: creature.languages },
            ]}
          >
            {save.saveMessage && (
              <Alert variant={save.saveMessage.type === 'success' ? 'success' : 'danger'}>
                {save.saveMessage.text}
              </Alert>
            )}
          </CreatorSummaryPanel>
        </div>
      }
      modals={
        <>
          <UnifiedSelectionModal
            isOpen={showPowerModal}
            onClose={() => setShowPowerModal(false)}
            headerExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const powers = items.map(displayItemToCreaturePower);
              setCreature(prev => ({ ...prev, powers: [...prev.powers, ...powers] }));
            }}
            items={powerSelectableItems}
            title="Select Powers"
            description="Choose powers from your library or Realms Library. Click a row (or the + button) to select, then click Add Selected."
            maxSelections={10}
            itemLabel="power"
            searchPlaceholder="Search powers..."
            columns={[{ key: 'name', label: 'NAME', sortable: true }, { key: 'Action', label: 'ACTION', sortable: false }, { key: 'Damage', label: 'DAMAGE', sortable: false }, { key: 'Area', label: 'AREA', sortable: false }]}
            gridColumns="1.4fr 0.8fr 0.8fr 0.7fr"
            size="xl"
          />
          <UnifiedSelectionModal
            isOpen={showTechniqueModal}
            onClose={() => setShowTechniqueModal(false)}
            headerExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const techniques = items.map(displayItemToCreatureTechnique);
              setCreature(prev => ({ ...prev, techniques: [...prev.techniques, ...techniques] }));
            }}
            items={techniqueSelectableItems}
            title="Select Techniques"
            description="Choose techniques from your library or Realms Library. Click a row (or the + button) to select, then click Add Selected."
            maxSelections={10}
            itemLabel="technique"
            searchPlaceholder="Search techniques..."
            columns={[{ key: 'name', label: 'NAME', sortable: true }, { key: 'Energy', label: 'ENERGY', sortable: false }, { key: 'Weapon', label: 'WEAPON', sortable: false }, { key: 'Training Pts', label: 'TRAINING PTS', sortable: false }]}
            gridColumns="1.4fr 0.7fr 1fr 0.8fr"
            size="xl"
          />
          <UnifiedSelectionModal
            isOpen={showFeatModal}
            onClose={() => setShowFeatModal(false)}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const feats = items.map(displayItemToCreatureFeat);
              setCreature(prev => ({ ...prev, feats: [...prev.feats, ...feats] }));
            }}
            items={featSelectableItems}
            title="Add Feat"
            description="Choose creature feats (positive or zero feat point cost). Click a row (or the + button) to select, then click Add Selected."
            maxSelections={10}
            itemLabel="feat"
            searchPlaceholder="Search feats..."
            columns={[{ key: 'name', label: 'NAME', sortable: true }, { key: 'Points', label: 'FEAT POINTS', sortable: true }]}
            gridColumns="1.5fr 0.6fr"
            size="xl"
          />
          <UnifiedSelectionModal
            isOpen={showNegativeFeatModal}
            onClose={() => setShowNegativeFeatModal(false)}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const feats = items.map(displayItemToCreatureFeat);
              setCreature(prev => ({ ...prev, feats: [...prev.feats, ...feats] }));
            }}
            items={featSelectableItemsNegative}
            title="Add Negative Feat"
            description="Choose creature feats with negative feat point cost (e.g. weaknesses). Click a row (or the + button) to select, then click Add Selected."
            maxSelections={10}
            itemLabel="feat"
            searchPlaceholder="Search feats..."
            columns={[{ key: 'name', label: 'NAME', sortable: true }, { key: 'Points', label: 'FEAT POINTS', sortable: true }]}
            gridColumns="1.5fr 0.6fr"
            size="xl"
          />
          <UnifiedSelectionModal
            isOpen={showArmamentModal}
            onClose={() => setShowArmamentModal(false)}
            headerExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const armaments = items.map(displayItemToCreatureArmament);
              setCreature(prev => ({ ...prev, armaments: [...prev.armaments, ...armaments] }));
            }}
            items={armamentSelectableItems}
            title="Select Armaments"
            description="Choose items from your library or Realms Library. Click a row (or the + button) to select, then click Add Selected."
            maxSelections={10}
            itemLabel="armament"
            searchPlaceholder="Search items..."
            columns={[{ key: 'name', label: 'NAME', sortable: true }, { key: 'Type', label: 'TYPE', sortable: true }, { key: 'TP', label: 'TP', sortable: true }, { key: 'Cost', label: 'COST', sortable: true }]}
            gridColumns="1.5fr 0.6fr 0.5fr 0.6fr"
            size="xl"
          />
          <AddSkillModal
            isOpen={showAddSkillModal}
            onClose={() => setShowAddSkillModal(false)}
            existingSkillNames={creature.skills.map((s: CreatureSkill) => s.name)}
            onAdd={handleAddSkills}
          />
          <AddSubSkillModal
            isOpen={showAddSubSkillModal}
            onClose={() => setShowAddSubSkillModal(false)}
            characterSkills={creature.skills.map((s: CreatureSkill) => ({ id: s.name, name: s.name, prof: s.proficient }))}
            existingSkillNames={creature.skills.map((s: CreatureSkill) => s.name)}
            onAdd={handleAddSubSkills}
          />
          <LoadCreatureModal
            isOpen={showLoadModal}
            onClose={() => setShowLoadModal(false)}
            onSelect={(loadedCreature) => setCreature(loadedCreature)}
          />
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => setShowLoginPrompt(false)}
            returnPath="/creature-creator"
            contentType="creature"
          />
          <ConfirmActionModal
            isOpen={showResetConfirm}
            onClose={() => setShowResetConfirm(false)}
            onConfirm={() => {
              setCreature(initialState);
              try {
                localStorage.removeItem(CREATURE_CREATOR_CACHE_KEY);
              } catch (e) {
                console.error('Failed to clear creature creator cache:', e);
              }
              setShowResetConfirm(false);
            }}
            title="Restart Creature"
            description="Are you sure you want to reset all creature data? This will clear all fields and cannot be undone."
            confirmLabel="Reset"
            confirmVariant="danger"
          />
          <ConfirmActionModal
            isOpen={save.showPublishConfirm}
            onClose={() => save.setShowPublishConfirm(false)}
            onConfirm={() => save.confirmPublish()}
            title={save.publishConfirmTitle}
            description={save.publishConfirmDescription?.(creature.name.trim(), { existingInPublic: save.publishExistingInPublic }) ?? ''}
            confirmLabel="Publish"
            icon="publish"
          />
        </>
      }
    >
          {/* Basic Info - name, description, level, type, size (matches other creators) */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Basic Information</h2>
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
                    options={CREATURE_SIZES.map((s: { value: string; label: string }) => ({ value: s.value, label: s.label }))}
                />
              </div>
            </div>
          </div>

          {/* Archetype Selection */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Archetype</h2>
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
            <h2 className="text-lg font-bold text-text-primary mb-4">Health & Energy</h2>
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
            <h2 className="text-lg font-bold text-text-primary mb-4">Abilities</h2>
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
            <h2 className="text-lg font-bold text-text-primary mb-4">Defenses</h2>
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
            <h2 className="text-lg font-bold text-text-primary mb-4">Damage Modifiers</h2>
            <p className="text-sm text-text-muted dark:text-text-secondary mb-3">Each type costs feat points as shown. Resistances and immunities cost points; weaknesses grant points.</p>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Resistances <span className="font-normal text-primary-600 dark:text-primary-400">(+{stats.resistanceFeatCost} pt each)</span>
                </label>
                <ChipList 
                  items={creature.resistances} 
                  onRemove={(item) => removeFromArray('resistances', item)}
                  color="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                  costLabel={() => `+${stats.resistanceFeatCost} pt`}
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={[...creature.resistances, ...creature.immunities]}
                  onAdd={(item) => addToArray('resistances', item)}
                  placeholder="Add resistance..."
                  sectionCostLabel={`+${stats.resistanceFeatCost} pt each`}
                  costForOption={() => stats.resistanceFeatCost}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Weaknesses <span className="font-normal text-primary-600 dark:text-primary-400">({stats.weaknessFeatCost} pt each)</span>
                </label>
                <ChipList 
                  items={creature.weaknesses} 
                  onRemove={(item) => removeFromArray('weaknesses', item)}
                  color="bg-danger-light text-danger-700 dark:text-danger-400"
                  costLabel={() => `${stats.weaknessFeatCost} pt`}
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={creature.weaknesses}
                  onAdd={(item) => addToArray('weaknesses', item)}
                  placeholder="Add weakness..."
                  sectionCostLabel={`${stats.weaknessFeatCost} pt each`}
                  costForOption={() => stats.weaknessFeatCost}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  Immunities <span className="font-normal text-primary-600 dark:text-primary-400">(+{stats.immunityFeatCost} pt each)</span>
                </label>
                <ChipList 
                  items={creature.immunities} 
                  onRemove={(item) => removeFromArray('immunities', item)}
                  color="bg-power-light text-power-text dark:text-power-300"
                  costLabel={() => `+${stats.immunityFeatCost} pt`}
                />
                <AddItemDropdown
                  options={DAMAGE_TYPES}
                  selectedItems={[...creature.resistances, ...creature.immunities]}
                  onAdd={(item) => addToArray('immunities', item)}
                  placeholder="Add immunity..."
                  sectionCostLabel={`+${stats.immunityFeatCost} pt each`}
                  costForOption={() => stats.immunityFeatCost}
                />
              </div>
            </div>
          </div>

          {/* Senses & Movement */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Senses & Movement</h2>
            <p className="text-sm text-text-muted dark:text-text-secondary mb-3">Each sense and movement type has a feat point cost shown when adding and on each row.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Senses</label>
                <ExpandableChipList 
                  items={creature.senses} 
                  onRemove={(item) => removeFromArray('senses', item)}
                  color="bg-info-light text-info-700 dark:text-info-300"
                  rowHoverClass="hover:bg-info-200 dark:hover:bg-info-900/40"
                  descriptions={senseDescriptions}
                  costLabel={getSenseCostLabel}
                />
                <AddItemDropdown
                  options={SENSES}
                  selectedItems={creature.senses}
                  onAdd={(item) => addToArray('senses', item)}
                  placeholder="Add sense..."
                  costForOption={(value) => getSenseCostLabel(value)?.replace(' pt', '')}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">Movement Types</label>
                <ExpandableChipList 
                  items={creature.movementTypes} 
                  onRemove={(item) => removeFromArray('movementTypes', item)}
                  color="bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300"
                  rowHoverClass="hover:bg-amber-200 dark:hover:bg-amber-800/40"
                  descriptions={movementDescriptions}
                  costLabel={getMovementCostLabel}
                />
                <AddItemDropdown
                  options={MOVEMENT_TYPES}
                  selectedItems={creature.movementTypes}
                  onAdd={(item) => addToArray('movementTypes', item)}
                  placeholder="Add movement..."
                  costForOption={(value) => getMovementCostLabel(value)?.replace(' pt', '')}
                />
              </div>
            </div>
          </div>

          {/* Condition Immunities */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Condition Immunities</h2>
            <label className="block text-sm font-medium text-text-secondary mb-2">
              Conditions <span className="font-normal text-primary-600 dark:text-primary-400">(+{stats.conditionImmunityFeatCost} pt each)</span>
            </label>
            <ChipList 
              items={creature.conditionImmunities} 
              onRemove={(item) => removeFromArray('conditionImmunities', item)}
              color="bg-surface-alt text-text-primary"
              costLabel={() => `+${stats.conditionImmunityFeatCost} pt`}
            />
            <AddItemDropdown
              options={CONDITIONS}
              selectedItems={creature.conditionImmunities}
              onAdd={(item) => addToArray('conditionImmunities', item)}
              placeholder="Add condition immunity..."
              sectionCostLabel={`+${stats.conditionImmunityFeatCost} pt each`}
              costForOption={() => stats.conditionImmunityFeatCost}
            />
          </div>

          {/* Skills */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-text-primary">Skills</h2>
              <div className="flex items-center gap-3">
                <span className={cn(
                  'px-3 py-1 rounded-full text-sm font-medium',
                  stats.skillRemaining < 0 
                    ? 'bg-red-100 text-red-700 dark:bg-danger-900/30 dark:text-danger-300' 
                    : stats.skillRemaining === 0
                    ? 'bg-green-100 text-green-700 dark:bg-success-900/30 dark:text-success-300'
                    : 'bg-surface-alt text-text-secondary'
                )}>
                  {stats.skillRemaining} remaining
                </span>
              </div>
            </div>
            
            {creature.skills.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-text-secondary italic py-4 text-center">No skills added. Use Add Skill or Add Sub Skill to add from the codex.</p>
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
            <div className="flex flex-wrap gap-2 mt-2">
              <Button
                size="sm"
                onClick={() => setShowAddSkillModal(true)}
                disabled={stats.skillRemaining < 1}
                title={stats.skillRemaining < 1 ? 'No skill points remaining' : 'Add base skill from codex'}
              >
                Add Skill
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setShowAddSubSkillModal(true)}
                disabled={stats.skillRemaining < 1}
                title={stats.skillRemaining < 1 ? 'No skill points remaining' : 'Add sub-skill from codex'}
              >
                Add Sub Skill
              </Button>
            </div>
          </div>

          {/* Languages */}
          <div className="bg-surface rounded-xl shadow-md p-6">
            <h2 className="text-lg font-bold text-text-primary mb-4">Languages</h2>
            <ChipList 
              items={creature.languages} 
              onRemove={(item) => removeFromArray('languages', item)}
              color="bg-teal-100 dark:bg-teal-900/30 text-teal-800 dark:text-teal-300"
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
            collapsedSummary={featsSummary}
            icon="⭐"
            itemCount={creature.feats.length}
            points={{ spent: stats.featSpent, total: stats.featPoints }}
            defaultExpanded={true}
          >
            {creature.feats.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No feats added</p>
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
                        feats: prev.feats.filter((f: { id: string }) => f.id !== feat.id)
                      }))
                    }}
                    compact
                  />
                ))}
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowFeatModal(true)}>
                Add Feat
              </Button>
              <Button variant="secondary" onClick={() => setShowNegativeFeatModal(true)}>
                Add Negative Feat
              </Button>
            </div>
          </CollapsibleSection>

          {/* Powers - Optional */}
          <CollapsibleSection
            title="Powers"
            subtitle="Supernatural abilities and magical effects"
            collapsedSummary={powersSummary}
            icon="✨"
            optional
            enabled={creature.enablePowers}
            onEnabledChange={(enabled) => updateCreature({ enablePowers: enabled })}
            itemCount={creature.powers.length}
            defaultExpanded={true}
          >
            {creature.powers.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No powers added</p>
            ) : (
              <div className="border border-border-light rounded-lg overflow-hidden mb-4">
                <ListHeader
                  columns={[
                    { key: 'name', label: 'Name', width: '1.4fr' },
                    { key: 'Action', label: 'Action', width: '0.8fr', align: 'center' },
                    { key: 'Damage', label: 'Damage', width: '0.8fr', align: 'center' },
                    { key: 'Area', label: 'Area', width: '0.7fr', align: 'center' },
                  ]}
                  gridColumns="1.4fr 0.8fr 0.8fr 0.7fr"
                />
                <div className="space-y-1">
                  {creature.powers.map((power: { id: string; name: string; action?: string; damage?: string; area?: string }) => (
                    <GridListRow
                      key={power.id}
                      id={power.id}
                      name={power.name}
                      columns={[
                        { key: 'Action', value: power.action ?? '-', align: 'center' as const },
                        { key: 'Damage', value: power.damage ?? '-', align: 'center' as const },
                        { key: 'Area', value: power.area ?? '-', align: 'center' as const },
                      ]}
                      gridColumns="1.4fr 0.8fr 0.8fr 0.7fr"
                      rightSlot={
                        <IconButton
                          variant="danger"
                          size="sm"
                          onClick={() => setCreature(prev => ({
                            ...prev,
                            powers: prev.powers.filter((p: { id: string }) => p.id !== power.id)
                          }))}
                          label="Remove power"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      }
                      compact
                    />
                  ))}
                </div>
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
            collapsedSummary={techniquesSummary}
            icon="⚔️"
            optional
            enabled={creature.enableTechniques}
            onEnabledChange={(enabled) => updateCreature({ enableTechniques: enabled })}
            itemCount={creature.techniques.length}
            defaultExpanded={true}
          >
            {creature.techniques.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No techniques added</p>
            ) : (
              <div className="border border-border-light rounded-lg overflow-hidden mb-4">
                <ListHeader
                  columns={[
                    { key: 'name', label: 'Name', width: '1.4fr' },
                    { key: 'Energy', label: 'Energy', width: '0.7fr', align: 'center' },
                    { key: 'Weapon', label: 'Weapon', width: '1fr', align: 'center' },
                    { key: 'Training Pts', label: 'Training Pts', width: '0.8fr', align: 'center' },
                  ]}
                  gridColumns="1.4fr 0.7fr 1fr 0.8fr"
                />
                <div className="space-y-1">
                  {creature.techniques.map((tech: { id: string; name: string; energy?: number; weapon?: string; tp?: number }) => (
                    <GridListRow
                      key={tech.id}
                      id={tech.id}
                      name={tech.name}
                      columns={[
                        { key: 'Energy', value: tech.energy ?? '-', align: 'center' as const },
                        { key: 'Weapon', value: tech.weapon ?? '-', align: 'center' as const },
                        { key: 'Training Pts', value: tech.tp ?? '-', align: 'center' as const },
                      ]}
                      gridColumns="1.4fr 0.7fr 1fr 0.8fr"
                      rightSlot={
                        <IconButton
                          variant="danger"
                          size="sm"
                          onClick={() => setCreature(prev => ({
                            ...prev,
                            techniques: prev.techniques.filter((t: { id: string }) => t.id !== tech.id)
                          }))}
                          label="Remove technique"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      }
                      compact
                    />
                  ))}
                </div>
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
            collapsedSummary={armamentsSummary}
            icon="🛡️"
            optional
            enabled={creature.enableArmaments}
            onEnabledChange={(enabled) => updateCreature({ enableArmaments: enabled })}
            itemCount={creature.armaments.length}
            defaultExpanded={true}
          >
            {creature.armaments.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No armaments added</p>
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
                        armaments: prev.armaments.filter((a: { id: string }) => a.id !== armament.id)
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
    </CreatorLayout>
  );
}

export default function CreatureCreatorPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <CreatureCreatorContent />
    </div>
  );
}
