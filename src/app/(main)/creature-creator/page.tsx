/**
 * Creature Creator Page
 * =====================
 * Tool for creating custom creatures and NPCs
 * Full-featured version matching vanilla functionality
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LoginPromptModal, ConfirmActionModal, UnifiedSelectionModal, ItemCard, GridListRow, ListHeader, SourceFilter, InnateToggle, SegmentedControl, SkillsAllocationPage, ValueStepper } from '@/components/shared';
import { LoadFromLibraryModal } from '@/components/creator/LoadFromLibraryModal';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { useAuthStore } from '@/stores/auth-store';
import {
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  useUserCreatures,
  usePowerParts,
  useTechniqueParts,
  useCreatureFeats,
  useItemProperties,
  useCodexSkills,
  useCodexFeats,
  useTraits,
  useAdmin,
  useCreatorSave,
  useOfficialLibrary,
  useGameRules,
  type CreatureFeat as CodexCreatureFeatRow,
  type UserPower,
  type UserTechnique,
  type UserItem,
  type Skill,
  type Feat,
  type Trait,
} from '@/hooks';
import {
  transformUserPowerToDisplayItem,
  transformUserTechniqueToDisplayItem,
  transformUserItemToDisplayItem,
  creatureFeatToDisplayItem,
  creatureArmamentToDisplayItem,
  displayItemToCreaturePower,
  displayItemToCreatureTechnique,
  displayItemToCreatureArmament,
  inferCreatureFeatSource,
  labelCreatureFeatSource,
} from './transformers';
import { AddCreatureFeatModal } from './AddCreatureFeatModal';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { trainingPointsForItemPropertyRef } from '@/lib/calculators';
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
  calculateSubSkillBonusWithProficiency,
} from '@/lib/game/formulas';
import { calculateCreatureMaxHealth, calculateCreatureMaxEnergy } from '@/lib/game/encounter-utils';
import { useSort } from '@/hooks/use-sort';
import { Button, Input, Select, Textarea, IconButton } from '@/components/ui';
import { Skull, X } from 'lucide-react';
import { RollLog, RollProvider } from '@/components/character-sheet';
import { formatDamageDisplay, formatListCellLabel, normalizeRangeDisplay } from '@/lib/utils';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
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
  displayItemToSelectableItem,
} from './CreatureCreatorHelpers';
import {
  allocationsToCreatureSkills,
  buildCreatureSelectableItem,
  creatureSkillsToAllocations,
  rawRecordToCreatureState,
} from './creature-skill-utils';
import {
  codexFeatToCreatureFeat,
  creatureToFeatRequirementCharacter,
  getMaxQualifiedFeatLevel,
  mergeCreatureFeatsOnAdd,
} from './creature-feat-utils';
import { checkFeatRequirements } from '@/lib/game/feat-requirements';
import { buildFeatLevelChips, buildFeatLevelsByFamily, getFeatFamilyId, getFeatLevel } from '@/lib/leveled-feats';
import type { SelectableItem } from '@/components/shared';

const CREATURE_FEAT_LIST_GRID = '1.15fr 0.58fr 0.52fr 0.4fr 40px';

type InventoryTab = 'all' | 'weapon' | 'armor' | 'shield' | 'equipment';
type PowerModalTab = 'powers' | 'empowered';

const EMPTY_SPECIES_SKILL_IDS = new Set<string>();

function normalizeInventoryType(type: string | undefined): Exclude<InventoryTab, 'all'> {
  const normalized = String(type ?? '').toLowerCase().trim();
  if (normalized === 'weapon' || normalized === 'armor' || normalized === 'shield') {
    return normalized;
  }
  return 'equipment';
}

// =============================================================================
// Main Component
// =============================================================================

function CreatureCreatorContent() {
  const { user } = useAuthStore();
  const { rules } = useGameRules();
  const { isAdmin } = useAdmin();
  const { data: creatureFeatsData = [] } = useCreatureFeats();
  const { data: codexFeatsData = [] } = useCodexFeats();
  const { data: codexTraitsData = [] } = useTraits();
  const { data: skillsData = [] } = useCodexSkills();

  const creatureFeatSourceLookup = useMemo(
    () => ({
      creatureFeatIds: new Set(
        (creatureFeatsData as CodexCreatureFeatRow[]).map((cf) => String(cf.id))
      ),
      codexFeatById: new Map<string, { char_feat?: boolean }>(
        (codexFeatsData as Feat[]).map((f) => [String(f.id), { char_feat: f.char_feat }])
      ),
      traitById: new Map<string, { flaw?: boolean; characteristic?: boolean }>(
        (codexTraitsData as Trait[]).map((t) => [
          String(t.id),
          { flaw: t.flaw, characteristic: t.characteristic },
        ])
      ),
    }),
    [creatureFeatsData, codexFeatsData, codexTraitsData]
  );

  const searchParams = useSearchParams();
  const editCreatureId = searchParams.get('edit');
  const editLoadedRef = useRef(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [creature, setCreature] = useState<CreatureState>(initialState);
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [showArmamentModal, setShowArmamentModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [loadSource, setLoadSource] = useState<SourceFilterValue>('all');
  const [newLanguage, setNewLanguage] = useState('');
  const [librarySource, setLibrarySource] = useState<SourceFilterValue>('all');
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>('all');
  const [powerModalTab, setPowerModalTab] = useState<PowerModalTab>('powers');

  /** Defer user/public library fetches until a selection or load modal opens (or edit preload). */
  const libraryQueriesEnabled =
    showPowerModal ||
    showTechniqueModal ||
    showArmamentModal ||
    showLoadModal ||
    !!editCreatureId;

  // Data for item selection modals (lazy-enabled)
  const { data: userPowers = [] } = useUserPowers({ enabled: libraryQueriesEnabled });
  const { data: userTechniques = [] } = useUserTechniques({ enabled: libraryQueriesEnabled });
  const { data: userEmpoweredTechniques = [] } = useUserEmpoweredTechniques({ enabled: libraryQueriesEnabled });
  const { data: userItems = [] } = useUserItems({ enabled: libraryQueriesEnabled });
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: publicPowers = [] } = useOfficialLibrary('powers', { enabled: libraryQueriesEnabled });
  const { data: publicTechniques = [] } = useOfficialLibrary('techniques', { enabled: libraryQueriesEnabled });
  const { data: publicEmpoweredTechniques = [] } = useOfficialLibrary('empowered-techniques', {
    enabled: libraryQueriesEnabled,
  });
  const { data: publicItems = [] } = useOfficialLibrary('items', { enabled: libraryQueriesEnabled });
  const { data: publicCreatures = [], isLoading: publicCreaturesLoading, isError: publicCreaturesError } = useOfficialLibrary('creatures', { enabled: libraryQueriesEnabled });
  const { data: userCreatures = [], isLoading: userCreaturesLoading } = useUserCreatures({ enabled: libraryQueriesEnabled });
  
  const creatureLoadItems = useMemo((): SelectableItem[] => {
    const my =
      loadSource === 'my' || loadSource === 'all'
        ? userCreatures
        : [];
    const pub =
      loadSource === 'public' || loadSource === 'all'
        ? (publicCreatures as Array<Record<string, unknown>>).map((c) => ({
            ...c,
            id: String(c.id ?? c.docId ?? ''),
            docId: String(c.id ?? c.docId ?? ''),
          }))
        : [];
    return [...my, ...pub].map((c) => buildCreatureSelectableItem(c));
  }, [loadSource, userCreatures, publicCreatures]);

  const creatureLoadLoading =
    (loadSource !== 'public' && userCreaturesLoading) ||
    (loadSource !== 'my' && publicCreaturesLoading);

  const creatureLoadEmptyMessage =
    creatureLoadItems.length === 0
      ? loadSource === 'public'
        ? 'No public creatures in the Realms Library'
        : loadSource === 'my'
          ? 'No creatures in your library'
          : 'No creatures found'
      : 'No matching creatures';

  const creatureLoadEmptySubMessage =
    creatureLoadItems.length === 0 && loadSource === 'public' && publicCreaturesError
      ? 'Failed to load Realms Library. Try again later.'
      : creatureLoadItems.length === 0 && loadSource === 'public'
        ? 'Official creatures can be added by admins via Admin → Realms Library Editor.'
        : creatureLoadItems.length === 0 && loadSource !== 'public'
          ? 'Create a creature and save it to your library first.'
          : undefined;

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
  const normalizedPublicEmpoweredTechniques = useMemo(() =>
    (publicEmpoweredTechniques as Record<string, unknown>[]).map((t) => ({
      id: String(t.id ?? t.docId ?? ''),
      docId: String(t.id ?? t.docId ?? ''),
      name: String(t.name ?? ''),
      description: String(t.description ?? ''),
      parts: t.parts ?? [],
      weapon: t.weapon,
      damage: t.damage,
      ...t,
    })) as UserTechnique[],
    [publicEmpoweredTechniques]
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
  const empoweredTechniqueList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userEmpoweredTechniques : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? normalizedPublicEmpoweredTechniques : [];
    const merged = [...my, ...pub];
    const seen = new Set<string>();
    return merged.filter((technique) => {
      const id = String(technique.docId ?? technique.id ?? '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [librarySource, userEmpoweredTechniques, normalizedPublicEmpoweredTechniques]);
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
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Damage', 'Area']);
      return {
        ...base,
        detailSections: partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined,
        totalCost: display.tp > 0 ? display.tp : undefined,
        costLabel: display.tp > 0 ? 'TP' : undefined,
        data: displayItem,
      };
    });
  }, [powerList, powerPartsDb]);
  const empoweredTechniqueSelectableItems = useMemo(() => {
    return empoweredTechniqueList.map((technique: UserTechnique) => {
      const raw = technique as unknown as Record<string, unknown>;
      const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
      const totals = (raw.totals as Record<string, unknown> | undefined) ?? {};
      const actionType = String(raw.actionType ?? '');
      const isReaction = raw.isReaction === true;
      const action = actionType
        ? `${actionType.charAt(0).toUpperCase()}${actionType.slice(1)} ${isReaction ? 'Reaction' : 'Action'}`
        : (isReaction ? 'Reaction' : '-');
      const areaRaw = (powerData.area as Record<string, unknown> | undefined)?.type;
      const areaValue = areaRaw ? String(areaRaw).replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
      const damageRows = Array.isArray(powerData.damage) ? (powerData.damage as Array<{ amount?: number; size?: number; type?: string }>) : [];
      const damageValue = damageRows.length > 0
        ? damageRows
            .filter((row) => (row.amount ?? 0) > 0 && row.type && row.type !== 'none')
            .map((row) => `${row.amount}d${row.size} ${row.type}`)
            .join(', ')
        : '-';
      const energy = Number(totals.energy ?? 0);
      const tp = Number(totals.trainingPoints ?? 0);
      const displayItem = transformUserPowerToDisplayItem({
        id: technique.id,
        docId: technique.docId,
        name: technique.name,
        description: technique.description,
        parts: [],
        actionType,
        isReaction,
        area: powerData.area as UserPower['area'],
        range: powerData.range as UserPower['range'],
        duration: powerData.duration as UserPower['duration'],
        damage: powerData.damage as UserPower['damage'],
      }, powerPartsDb);
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Damage', 'Area']);
      return {
        ...base,
        columns: [
          { key: 'Energy', value: energy || '-', align: 'center' as const },
          { key: 'Action', value: action, align: 'center' as const },
          { key: 'Damage', value: damageValue || '-', align: 'center' as const },
          { key: 'Area', value: areaValue, align: 'center' as const },
        ],
        badges: [{ label: 'Empowered', color: 'gray' as const }],
        data: {
          ...displayItem,
          sourceData: {
            id: technique.docId,
            name: technique.name,
            energy,
            tp,
            action,
            duration: String((powerData.duration as Record<string, unknown> | undefined)?.type ?? '-'),
            range: String((powerData.range as Record<string, unknown> | undefined)?.steps ?? '-'),
            area: areaValue,
            damage: damageValue,
            innate: false,
          } as unknown as Record<string, unknown>,
        },
      };
    });
  }, [empoweredTechniqueList, powerPartsDb]);
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
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Weapon', 'Training Pts']);
      return {
        ...base,
        detailSections: partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined,
        totalCost: typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined,
        costLabel: typeof display.tp === 'number' && display.tp > 0 ? 'TP' : undefined,
        data: displayItem,
      };
    });
  }, [techniqueList, techniquePartsDb]);
  const armamentSelectableItems = useMemo(() => {
    return armamentList.map((item: UserItem) => {
      const displayItem = transformUserItemToDisplayItem(item, itemPropertiesDb);
      const props = (Array.isArray(item.properties) ? item.properties : []) as Array<{ id?: string | number; name?: string; op_1_lvl?: number }>;
      const propertyChips: ChipData[] = props.map((prop) => {
        const propName = typeof prop === 'string' ? prop : (prop?.name ?? '');
        const dbProp = itemPropertiesDb.find((p: { name?: string }) => p.name?.toLowerCase() === String(propName).toLowerCase());
        const cost = trainingPointsForItemPropertyRef(prop, itemPropertiesDb);
        const lvl = typeof prop === 'object' && prop?.op_1_lvl != null ? prop.op_1_lvl : 0;
        const baseDesc = dbProp?.description;
        const descWithOpt = baseDesc?.trim()
          ? (lvl > 1 ? `${baseDesc.trim()}\n\nOption 1: Lv.${lvl}` : baseDesc.trim())
          : (lvl > 1 ? `Option 1: Lv.${lvl}` : undefined);
        return {
          name: dbProp?.name || propName,
          description: descWithOpt,
          cost: cost > 0 ? cost : undefined,
          costLabel: 'TP',
          category: cost > 0 ? ('cost' as const) : ('default' as const),
          level: lvl > 1 ? lvl : undefined,
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

  const inventoryDisplayFilter = useCallback((item: SelectableItem) => {
    if (inventoryTab === 'all') return true;
    const sourceData = (item.data as DisplayItem | undefined)?.sourceData as { type?: string } | undefined;
    return normalizeInventoryType(sourceData?.type) === inventoryTab;
  }, [inventoryTab]);

  // Load cached state from localStorage on mount (skip when ?edit= will load from library)
  useEffect(() => {
    if (editCreatureId) return;
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
    } catch {
    }
    setIsInitialized(true);
  }, [editCreatureId]);

  // Auto-save to localStorage when creature changes
  useEffect(() => {
    if (!isInitialized) return;
    
    try {
      const cache = {
        creature,
        timestamp: Date.now(),
      };
      localStorage.setItem(CREATURE_CREATOR_CACHE_KEY, JSON.stringify(cache));
    } catch {
    }
  }, [isInitialized, creature]);
  
  // Create lookup map for feat point costs by ID
  const featPointsMap = useMemo(() => {
    const map = new Map<string, number>();
    creatureFeatsData.forEach((feat: CodexCreatureFeatRow) => {
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

  const subSkillNames = useMemo(() => {
    const set = new Set<string>();
    skillsData.forEach((skill: Skill) => {
      if (skill.base_skill_id !== undefined) {
        set.add(String(skill.name ?? '').toLowerCase());
      }
    });
    return set;
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
  
  const featLevelsByFamily = useMemo(
    () => buildFeatLevelsByFamily(codexFeatsData as Feat[]),
    [codexFeatsData]
  );

  const codexFeatsById = useMemo(
    () => new Map((codexFeatsData as Feat[]).map((f) => [String(f.id), f])),
    [codexFeatsData]
  );

  // Sort state for added feats and armaments (GridListRow-backed lists)
  const {
    sortState: featSort,
    handleSort: handleFeatSort,
    sortItems: sortFeatItems,
  } = useSort('name');
  const {
    sortState: armamentSort,
    handleSort: handleArmamentSort,
    sortItems: sortArmamentItems,
  } = useSort('name');

  const featsWithTypeLabel = useMemo(
    () =>
      creature.feats.map((f) => {
        const src = f.featSourceType ?? inferCreatureFeatSource(f, creatureFeatSourceLookup);
        const codexFeat = codexFeatsById.get(String(f.id));
        const isLibraryFeat = src === 'character' || src === 'archetype';
        let levelMeta:
          | {
              currentLevel: number;
              minLevel: number;
              maxQualified: number;
              family: Feat[];
            }
          | undefined;
        if (isLibraryFeat && codexFeat) {
          const family = featLevelsByFamily.get(getFeatFamilyId(codexFeat)) ?? [];
          if (family.length > 1) {
            levelMeta = {
              currentLevel: getFeatLevel(codexFeat),
              minLevel: getFeatLevel(family[0]),
              maxQualified: getMaxQualifiedFeatLevel(creature, family, skillsData, codexFeatsData as Feat[]),
              family,
            };
          }
        }
        return { ...f, typeLabel: labelCreatureFeatSource(src), levelMeta };
      }),
    [creature, creatureFeatSourceLookup, codexFeatsById, featLevelsByFamily, skillsData, codexFeatsData]
  );

  const handleCreatureFeatLevelChange = useCallback(
    (featId: string, targetLevel: number) => {
      setCreature((prev) => {
        const idx = prev.feats.findIndex((f) => f.id === featId);
        if (idx === -1) return prev;

        const current = prev.feats[idx];
        const src = current.featSourceType ?? inferCreatureFeatSource(current, creatureFeatSourceLookup);
        if (src !== 'character' && src !== 'archetype') return prev;

        const codexFeat = codexFeatsById.get(String(featId));
        if (!codexFeat) return prev;

        const family = featLevelsByFamily.get(getFeatFamilyId(codexFeat));
        if (!family || family.length <= 1) return prev;

        const targetCodex = family.find((f) => getFeatLevel(f) === targetLevel);
        if (!targetCodex || String(targetCodex.id) === String(featId)) return prev;

        const requirementCharacter = creatureToFeatRequirementCharacter(prev);
        const { met } = checkFeatRequirements(
          targetCodex,
          requirementCharacter,
          skillsData,
          codexFeatsData as Feat[]
        );
        if (!met) return prev;

        const nextFeats = [...prev.feats];
        nextFeats[idx] = codexFeatToCreatureFeat(targetCodex);
        return { ...prev, feats: nextFeats };
      });
    },
    [codexFeatsById, featLevelsByFamily, creatureFeatSourceLookup, skillsData, codexFeatsData]
  );

  const sortedFeats = useMemo(
    () => sortFeatItems(featsWithTypeLabel),
    [featsWithTypeLabel, sortFeatItems]
  );

  const sortedArmaments = useMemo(
    () => sortArmamentItems(creature.armaments),
    [creature.armaments, sortArmamentItems]
  );
  
  // Skill bonus: sub-skills add parent base skill value (GAME_RULES)
  const getCreatureSkillBonus = useCallback(
    (skill: CreatureSkill) => {
      const codex = skillsData.find(
        (s: Skill) =>
          (skill.id != null && String(s.id) === String(skill.id)) ||
          String(s.name ?? '').toLowerCase() === String(skill.name).toLowerCase()
      );
      const linked = codex?.ability ?? skillAbilityMap.get(skill.name) ?? '';

      const baseSkillIdRaw =
        skill.baseSkillId ??
        (codex?.base_skill_id != null && Number(codex.base_skill_id) !== 0 ? codex.base_skill_id : undefined);
      const isSubSkill =
        skill.isSubSkill === true ||
        subSkillNames.has(String(skill.name ?? '').toLowerCase()) ||
        (baseSkillIdRaw != null && String(baseSkillIdRaw) !== '' && Number(baseSkillIdRaw) !== 0);

      let parent: CreatureSkill | undefined;
      if (isSubSkill && baseSkillIdRaw != null) {
        const baseDef = skillsData.find((d: Skill) => String(d.id) === String(baseSkillIdRaw));
        parent = baseDef
          ? creature.skills.find(
              (p) =>
                (p.id != null && String(p.id) === String(baseDef.id)) ||
                String(p.name).toLowerCase() === String(baseDef.name ?? '').toLowerCase()
            )
          : undefined;
      }

      if (isSubSkill) {
        return calculateSubSkillBonusWithProficiency(
          linked,
          skill.value,
          parent?.value ?? 0,
          parent ? parent.proficient : false,
          creature.abilities,
          skill.proficient
        );
      }
      return calculateSkillBonusWithProficiency(linked, skill.value, creature.abilities, skill.proficient);
    },
    [skillsData, creature.skills, creature.abilities, subSkillNames, skillAbilityMap]
  );
  
  const updateCreature = useCallback((updates: Partial<CreatureState>) => {
    setCreature(prev => ({ ...prev, ...updates }));
  }, []);

  const updateAbility = useCallback((ability: AbilityName, value: number) => {
    setCreature(prev => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: value }
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
    
    const trainingPoints = calculateCreatureTrainingPoints(level, highestNonVitality, rules);
    const currency = calculateCreatureCurrency(level, rules);
    const hePool = calculateHealthEnergyPool(level, 'CREATURE', true, rules);
    const proficiency = calculateProficiency(level, true, rules);
    const abilityPoints = calculateAbilityPoints(level, true, rules);
    const skillPoints = calculateSkillPointsForEntity(Math.max(1, Math.floor(level)), 'creature', rules);
    
    // Max archetype proficiency points based on level (vanilla formula)
    // level < 1: ceil(2 * level), else: 2 + floor(level / 5)
    const maxProficiencyPoints = level < 1 ? Math.ceil(2 * level) : 2 + Math.floor(level / 5);
    const proficiencySpent = creature.powerProficiency + creature.martialProficiency;
    const proficiencyRemaining = maxProficiencyPoints - proficiencySpent;
    
    // Feat points based on level and martial proficiency
    const featPoints = calculateCreatureFeatPoints(level, creature.martialProficiency, rules);
    
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
    const trainingSpent =
      creature.powers.reduce((sum, power) => sum + ((typeof power.tp === 'number' && Number.isFinite(power.tp)) ? power.tp : 0), 0) +
      creature.techniques.reduce((sum, technique) => sum + ((typeof technique.tp === 'number' && Number.isFinite(technique.tp)) ? technique.tp : 0), 0) +
      creature.armaments.reduce((sum, armament) => sum + ((typeof armament.tp === 'number' && Number.isFinite(armament.tp)) ? armament.tp : 0), 0);
    const currencySpent = creature.armaments.reduce(
      (sum, armament) => sum + ((typeof armament.currency === 'number' && Number.isFinite(armament.currency)) ? armament.currency : 0),
      0
    );
    
    // Max HP / EN — shared with encounter tracker & library (encounter-utils)
    const maxHealth = calculateCreatureMaxHealth(level, abilities, creature.hitPoints);
    const minEnergy = highestNonVitality * Math.max(1, level);
    const maxEnergy = calculateCreatureMaxEnergy(level, abilities, creature.energyPoints);
    
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
    const skillSpent = creature.skills.reduce((sum, s) => {
      const isSubSkill =
        s.isSubSkill === true ||
        (s.baseSkillId != null && s.baseSkillId !== '') ||
        subSkillNames.has(String(s.name ?? '').toLowerCase());
      if (isSubSkill) {
        // Match character creator behavior: sub-skill value starts at 1 as part of
        // proficiency, so that first point does not double-charge skill points.
        return sum + Math.max(1, s.value);
      }
      return sum + s.value + (s.proficient ? 1 : 0);
    }, 0);
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
      trainingSpent,
      trainingRemaining: trainingPoints - trainingSpent,
      currencySpent,
      currencyRemaining: currency - currencySpent,
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
  }, [creature, featPointsMap, subSkillNames, rules]);

  const isOverBudget = useMemo(
    () =>
      stats.featRemaining < 0 ||
      stats.trainingRemaining < 0 ||
      stats.currencyRemaining < 0 ||
      stats.abilityRemaining < 0 ||
      stats.heRemaining < 0 ||
      stats.skillRemaining < 0 ||
      stats.proficiencyRemaining < 0,
    [stats]
  );

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
    if (creature.armaments.length === 0) return 'No inventory items';
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

  const skillAllocations = useMemo(
    () => creatureSkillsToAllocations(creature.skills, skillsData),
    [creature.skills, skillsData]
  );

  const abilityDefenseBonuses = useMemo(
    () => ({
      might: creature.abilities.strength,
      fortitude: creature.abilities.vitality,
      reflex: creature.abilities.agility,
      discernment: creature.abilities.acuity,
      mentalFortitude: creature.abilities.intelligence,
      resolve: creature.abilities.charisma,
    }),
    [creature.abilities]
  );

  const handleSkillAllocationsChange = useCallback(
    (next: Record<string, number>) => {
      setCreature((prev) => ({
        ...prev,
        skills: allocationsToCreatureSkills(next, skillsData),
      }));
    },
    [skillsData]
  );

  const handleDefenseSkillsChange = useCallback((defense: CreatureState['defenses']) => {
    setCreature((prev) => ({ ...prev, defenses: defense }));
  }, []);

  const handleLoadCreature = useCallback((item: SelectableItem) => {
    setCreature(rawRecordToCreatureState(item.data as Record<string, unknown>));
    setLoadSource('all');
  }, []);

  const closeLoadModal = useCallback(() => {
    setShowLoadModal(false);
    setLoadSource('all');
  }, []);

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

  // Load creature for editing from URL (?edit=<id>)
  useEffect(() => {
    if (!editCreatureId || !mergedCreaturesForEdit.length || editLoadedRef.current) return;
    const c = mergedCreaturesForEdit.find(
      (x) => String((x as { id?: string; docId?: string }).id) === editCreatureId || String((x as { id?: string; docId?: string }).docId) === editCreatureId
    ) as Record<string, unknown> | undefined;
    editLoadedRef.current = true;
    if (!c) {
      setIsInitialized(true);
      return;
    }
    const loaded = rawRecordToCreatureState(c);
    setCreature(loaded);
    try {
      localStorage.removeItem(CREATURE_CREATOR_CACHE_KEY);
    } catch (_e) {
      // ignore
    }
    save.setSaveMessage({ type: 'success', text: 'Creature loaded from Realms Library.' });
    setTimeout(() => save.setSaveMessage(null), 2000);
    setIsInitialized(true);
  }, [editCreatureId, mergedCreaturesForEdit, save]);

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    if (isOverBudget) {
      save.setSaveMessage({
        type: 'error',
        text: 'Cannot save: creature exceeds one or more point budgets.',
      });
      setTimeout(() => save.setSaveMessage(null), 3000);
      return;
    }
    await save.handleSave();
  }, [user, save, isOverBudget]);

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

  return (
    <CreatorLayout
      icon={<Skull className="w-8 h-8 text-primary-600" />}
      title="Creature Creator"
      description="Design custom creatures, monsters, and NPCs. Configure abilities, defenses, skills, and combat options."
      actions={
        <div className="flex items-center gap-2">
          <CreatorSaveToolbar
            saveTarget={save.saveTarget}
            onSaveTargetChange={save.setSaveTarget}
            onSave={handleSave}
            onLoad={() => (user ? setShowLoadModal(true) : setShowLoginPrompt(true))}
            onReset={handleReset}
            saving={save.saving}
            saveDisabled={!creature.name.trim() || isOverBudget}
            showPublicPrivate={isAdmin}
            user={user}
          />
        </div>
      }
      sidebar={
        <div className="self-start sticky top-24 space-y-6">
          <CreatorSummaryPanel
            title="Creature Summary"
            badge={creature.name ? { label: creature.name, className: 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300' } : undefined}
            resourceBoxes={[
              { label: 'Ability Pts', value: `${stats.abilityRemaining}/${stats.abilityPoints}`, variant: stats.abilityRemaining < 0 ? 'danger' : stats.abilityRemaining === 0 ? 'success' : 'info' },
              { label: 'Skill Pts', value: `${stats.skillRemaining}/${stats.skillPoints}`, variant: stats.skillRemaining < 0 ? 'danger' : stats.skillRemaining === 0 ? 'success' : 'info' },
              { label: 'Feat Pts', value: `${stats.featRemaining}/${stats.featPoints}`, variant: stats.featRemaining < 0 ? 'danger' : stats.featRemaining === 0 ? 'success' : 'warning' },
              { label: 'Training Pts', value: `${stats.trainingRemaining}/${stats.trainingPoints}`, variant: stats.trainingRemaining < 0 ? 'danger' : stats.trainingRemaining === 0 ? 'success' : 'warning' },
              { label: 'Currency', value: `${stats.currencyRemaining}/${stats.currency}`, variant: stats.currencyRemaining < 0 ? 'danger' : stats.currencyRemaining === 0 ? 'success' : 'warning' },
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
              { label: 'Archetype', value: formatListCellLabel(creature.archetypeType) },
              { label: 'Level', value: creature.level },
              { label: 'Type', value: formatListCellLabel(creature.type) },
              { label: 'Size', value: formatListCellLabel(creature.size) },
            ]}
            lineItems={[
              {
                label: 'Skills',
                items: creature.skills.map((s: CreatureSkill) => {
                  const b = getCreatureSkillBonus(s);
                  return `${s.name} ${b >= 0 ? '+' : ''}${b}`;
                }),
              },
              { label: 'Resistances', items: creature.resistances },
              { label: 'Immunities', items: creature.immunities },
              { label: 'Weaknesses', items: creature.weaknesses },
              { label: 'Senses', items: creature.senses },
              { label: 'Movement', items: creature.movementTypes },
              { label: 'Languages', items: creature.languages },
              { label: 'Inventory Cost', items: [`${stats.currencySpent}c spent / ${stats.currency}c max`] },
            ]}
          />
        </div>
      }
      modals={
        <>
          <UnifiedSelectionModal
            isOpen={showPowerModal}
            onClose={() => setShowPowerModal(false)}
            headerExtra={
              <div className="space-y-3">
                <SourceFilter value={librarySource} onChange={setLibrarySource} />
                <SegmentedControl<PowerModalTab>
                  value={powerModalTab}
                  onChange={setPowerModalTab}
                  aria-label="Power modal type"
                  tabs
                  options={[
                    { value: 'powers', label: 'Powers' },
                    { value: 'empowered', label: 'Empowered Techniques' },
                  ]}
                />
              </div>
            }
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const powers = items.map(displayItemToCreaturePower);
              setCreature(prev => ({ ...prev, powers: [...prev.powers, ...powers] }));
            }}
            items={powerModalTab === 'empowered' ? empoweredTechniqueSelectableItems : powerSelectableItems}
            title={powerModalTab === 'empowered' ? 'Select Empowered Techniques' : 'Select Powers'}
            description={powerModalTab === 'empowered'
              ? 'Choose empowered techniques from your library or Realms Library and add them to the creature power list.'
              : 'Choose powers from your library or Realms Library. Click a row (or the + button) to select, then click Add Selected.'}
            maxSelections={10}
            itemLabel={powerModalTab === 'empowered' ? 'empowered technique' : 'power'}
            searchPlaceholder={powerModalTab === 'empowered' ? 'Search empowered techniques...' : 'Search powers...'}
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'Energy', label: 'Energy', sortable: false },
              { key: 'Action', label: 'Action', sortable: false },
              { key: 'Damage', label: 'Damage', sortable: false },
              { key: 'Area', label: 'Area', sortable: false },
            ]}
            gridColumns="1.15fr 0.42fr 0.62fr 0.62fr 0.55fr"
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
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'Energy', label: 'Energy', sortable: false },
              { key: 'Action', label: 'ACTION', sortable: false },
              { key: 'Weapon', label: 'Weapon', sortable: false },
              { key: 'Training Pts', label: 'Training pts', sortable: false },
            ]}
            gridColumns="1.25fr 0.55fr 0.72fr 0.9fr 0.65fr"
            size="xl"
          />
          <AddCreatureFeatModal
            isOpen={showFeatModal}
            onClose={() => setShowFeatModal(false)}
            creature={creature}
            onAdd={(feats) =>
              setCreature((prev) => ({
                ...prev,
                feats: mergeCreatureFeatsOnAdd(prev.feats, feats, codexFeatsById),
              }))
            }
          />
          <UnifiedSelectionModal
            isOpen={showArmamentModal}
            onClose={() => setShowArmamentModal(false)}
            headerExtra={
              <div className="space-y-3">
                <SourceFilter value={librarySource} onChange={setLibrarySource} />
                <SegmentedControl<InventoryTab>
                  value={inventoryTab}
                  onChange={setInventoryTab}
                  aria-label="Inventory type"
                  tabs
                  options={[
                    { value: 'all', label: 'All' },
                    { value: 'weapon', label: 'Weapons' },
                    { value: 'armor', label: 'Armor' },
                    { value: 'shield', label: 'Shields' },
                    { value: 'equipment', label: 'Equipment' },
                  ]}
                />
              </div>
            }
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const armaments = items.map(displayItemToCreatureArmament);
              setCreature(prev => ({ ...prev, armaments: [...prev.armaments, ...armaments] }));
            }}
            items={armamentSelectableItems}
            displayFilter={inventoryDisplayFilter}
            title="Select Inventory"
            description="Choose inventory items from your library or Realms Library. Filter by type tabs, then click Add Selected."
            maxSelections={10}
            itemLabel="inventory item"
            searchPlaceholder="Search inventory..."
            columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'Type', label: 'Type', sortable: true }, { key: 'TP', label: 'TP', sortable: true }, { key: 'Cost', label: 'Cost', sortable: true }]}
            gridColumns="1.5fr 0.6fr 0.5fr 0.6fr"
            size="xl"
            className="min-h-0"
          />
          <LoadFromLibraryModal
            isOpen={showLoadModal}
            onClose={closeLoadModal}
            selectableItems={creatureLoadItems}
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'level', label: 'Level', sortable: true },
              { key: 'type', label: 'Type', sortable: true },
            ]}
            gridColumns="1.5fr 0.5fr 1fr"
            onSelect={handleLoadCreature}
            isLoading={creatureLoadLoading}
            title="Load Creature"
            headerExtra={<SourceFilter value={loadSource} onChange={setLoadSource} />}
            searchPlaceholder="Search creatures by name, type, or level..."
            emptyMessage={creatureLoadEmptyMessage}
            emptySubMessage={creatureLoadEmptySubMessage}
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
              } catch {
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

          {/* Skills & defense bonuses (shared SkillsAllocationPage) */}
          <SkillsAllocationPage
            entityType="creature"
            level={Math.max(1, Math.floor(creature.level))}
            abilities={creature.abilities}
            allocations={skillAllocations}
            defenseSkills={creature.defenses}
            speciesSkillIds={EMPTY_SPECIES_SKILL_IDS}
            onAllocationsChange={handleSkillAllocationsChange}
            onDefenseChange={handleDefenseSkillsChange}
            abilityDefenseBonuses={abilityDefenseBonuses}
            className="max-w-none"
          />

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
              <div className="border border-border-light rounded-lg overflow-hidden mb-4">
                <ListHeader
                  columns={[
                    { key: 'name', label: 'NAME' },
                    { key: 'typeLabel', label: 'TYPE', width: '0.58fr', align: 'center' },
                    { key: 'level', label: 'LVL', width: '0.52fr', align: 'center' },
                    { key: 'points', label: 'PTS', width: '0.4fr', align: 'center' },
                    { key: '_actions', label: '', sortable: false as const },
                  ]}
                  gridColumns={CREATURE_FEAT_LIST_GRID}
                  sortState={featSort}
                  onSort={handleFeatSort}
                />
                <div className="space-y-1">
                  {sortedFeats.map((feat) => {
                    const levelChips =
                      feat.levelMeta && feat.levelMeta.family.length > 1
                        ? buildFeatLevelChips(feat.levelMeta.family, feat.id)
                        : [];
                    return (
                    <GridListRow
                      key={feat.id}
                      id={feat.id}
                      name={feat.name}
                      description={feat.description}
                      gridColumns={CREATURE_FEAT_LIST_GRID}
                      detailSections={
                        levelChips.length > 0
                          ? [{ label: 'Other feat levels', chips: levelChips }]
                          : undefined
                      }
                      columns={[
                        {
                          key: 'typeLabel',
                          value: formatListCellLabel(feat.typeLabel),
                          align: 'center',
                        },
                        {
                          key: 'level',
                          value: feat.levelMeta ? (
                            <ValueStepper
                              value={feat.levelMeta.currentLevel}
                              onChange={(level) => handleCreatureFeatLevelChange(feat.id, level)}
                              min={feat.levelMeta.minLevel}
                              max={feat.levelMeta.maxQualified}
                              size="sm"
                              variant="inline"
                              decrementTitle={`Decrease ${feat.name} level`}
                              incrementTitle={`Increase ${feat.name} level`}
                            />
                          ) : (
                            '-'
                          ),
                          align: 'center',
                        },
                        {
                          key: 'points',
                          value: feat.points != null ? feat.points : '-',
                          align: 'center',
                        },
                      ]}
                      rightSlot={
                        <IconButton
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setCreature((prev) => ({
                              ...prev,
                              feats: prev.feats.filter((f: { id: string }) => f.id !== feat.id),
                            }))
                          }
                          label="Remove feat"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      }
                      compact
                    />
                    );
                  })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => setShowFeatModal(true)}>Add feat</Button>
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
                    { key: '_innate', label: '', width: '2rem', sortable: false as const },
                    { key: 'name', label: 'NAME', width: '1.4fr' },
                    { key: 'Energy', label: 'ENERGY', width: '0.6fr', align: 'center' },
                    { key: 'Action', label: 'ACTION', width: '0.8fr', align: 'center' },
                    { key: 'Damage', label: 'DAMAGE', width: '0.8fr', align: 'center' },
                    { key: 'Area', label: 'AREA', width: '0.7fr', align: 'center' },
                    { key: 'Duration', label: 'DURATION', width: '0.8fr', align: 'center' },
                  ]}
                  gridColumns="2rem 1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
                />
                <div className="space-y-1">
                  {creature.powers.map((power: { id: string; name: string; energy?: number; action?: string; damage?: string; area?: string; duration?: string; innate?: boolean }) => (
                    <GridListRow
                      key={power.id}
                      id={power.id}
                      name={power.name}
                      columns={[
                        { key: 'Energy', value: power.energy ?? '-', align: 'center' as const },
                        { key: 'Action', value: power.action ?? '-', align: 'center' as const },
                        { key: 'Damage', value: power.damage ?? '-', align: 'center' as const },
                        { key: 'Area', value: power.area ?? '-', align: 'center' as const },
                        { key: 'Duration', value: power.duration ?? '-', align: 'center' as const },
                      ]}
                      gridColumns="1.4fr 0.6fr 0.8fr 0.8fr 0.7fr 0.8fr"
                      innate={power.innate === true}
                      leftSlot={
                        <InnateToggle
                          isInnate={power.innate === true}
                          onToggle={() => setCreature(prev => ({
                            ...prev,
                            powers: prev.powers.map((p) =>
                              p.id === power.id ? { ...p, innate: !(p.innate === true) } : p
                            ),
                          }))}
                          size="md"
                        />
                      }
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

          {/* Inventory - Optional */}
          <CollapsibleSection
            title="Inventory"
            subtitle="Weapons, armor, shields, and equipment"
            collapsedSummary={armamentsSummary}
            icon="🛡️"
            optional
            enabled={creature.enableArmaments}
            onEnabledChange={(enabled) => updateCreature({ enableArmaments: enabled })}
            itemCount={creature.armaments.length}
            defaultExpanded={true}
          >
            {creature.armaments.length === 0 ? (
              <p className="text-sm text-text-muted dark:text-text-secondary italic mb-4">No inventory items added</p>
            ) : (
              <div className="space-y-3 mb-4">
                <div className="rounded-lg border border-border-light bg-surface-alt p-3 text-sm">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-medium text-text-secondary dark:text-text-primary">Currency from inventory</span>
                    <span
                      className={cn(
                        'font-semibold',
                        stats.currencyRemaining < 0 ? 'text-danger-700 dark:text-danger-400' : 'text-text-primary'
                      )}
                    >
                      {stats.currencyRemaining}c / {stats.currency}c
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-text-muted dark:text-text-secondary">
                    Spent {stats.currencySpent}c from selected inventory items.
                  </p>
                </div>
              <div className="border border-border-light rounded-lg overflow-hidden">
                <ListHeader
                  columns={[
                    { key: 'name', label: 'NAME' },
                    { key: 'type', label: 'TYPE', width: 'minmax(72px, 0.55fr)', align: 'center' },
                    { key: 'range', label: 'RANGE', width: 'minmax(92px, 7.5rem)', align: 'center', sortable: false as const },
                    { key: 'attack', label: 'ATTACK', width: 'minmax(64px, 4.25rem)', align: 'center', sortable: false as const },
                    { key: 'damage', label: 'DAMAGE', width: 'minmax(92px, 6.75rem)', align: 'center', sortable: false as const },
                    { key: 'tp', label: 'TP', width: '0.5fr', align: 'center' },
                    { key: 'currency', label: 'COST', width: '0.6fr', align: 'center' },
                    { key: '_actions', label: '', sortable: false as const },
                  ]}
                  gridColumns="minmax(180px, 0.9fr) minmax(72px, 0.55fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem) minmax(56px, 0.45fr) minmax(64px, 0.55fr) 40px"
                  sortState={armamentSort}
                  onSort={handleArmamentSort}
                />
                <div className="space-y-1">
                  {sortedArmaments.map((armament) => {
                    const isWeapon = String(armament.type ?? '').toLowerCase() === 'weapon';
                    const isShield = String(armament.type ?? '').toLowerCase() === 'shield';
                    const prof = creature.martialProficiency ?? 0;
                    const propNames = (armament.properties || [])
                      .map((p: unknown) => (typeof p === 'string' ? p : (p as { name?: string }).name || ''))
                      .filter(Boolean);
                    const finesse = propNames.some((p: string) => p.toLowerCase() === 'finesse');
                    const rangeStr =
                      normalizeRangeDisplay((armament as { range?: string }).range) ||
                      (isWeapon ? 'Melee' : '-');
                    const isRanged = rangeStr.toLowerCase() !== 'melee';
                    const str = creature.abilities.strength ?? 0;
                    const agi = creature.abilities.agility ?? 0;
                    const acu = creature.abilities.acuity ?? 0;
                    const attackBonus = isWeapon ? (finesse ? agi : isRanged ? acu : str) + prof : null;
                    const attackDisplay =
                      attackBonus != null ? `${attackBonus >= 0 ? '+' : ''}${attackBonus}` : '-';
                    const damageDisplay =
                      isWeapon || isShield
                        ? formatDamageDisplay((armament as { damage?: unknown }).damage) || '-'
                        : '-';

                    return (
                    <GridListRow
                      key={armament.id}
                      id={armament.id}
                      name={armament.name}
                      gridColumns="minmax(180px, 0.9fr) minmax(72px, 0.55fr) minmax(88px, 7rem) minmax(60px, 4rem) minmax(110px, 8rem) minmax(56px, 0.45fr) minmax(64px, 0.55fr) 40px"
                      columns={[
                        {
                          key: 'type',
                          value: formatListCellLabel(armament.type),
                          align: 'center',
                        },
                        {
                          key: 'range',
                          value: rangeStr,
                          align: 'center',
                        },
                        {
                          key: 'attack',
                          value: attackDisplay,
                          align: 'center',
                        },
                        {
                          key: 'damage',
                          value: damageDisplay,
                          align: 'center',
                        },
                        {
                          key: 'tp',
                          value: armament.tp != null ? armament.tp : '-',
                          align: 'center',
                        },
                        {
                          key: 'currency',
                          value: armament.currency != null ? `${armament.currency}c` : '-',
                          align: 'center',
                        },
                      ]}
                      rightSlot={
                        <IconButton
                          variant="danger"
                          size="sm"
                          onClick={() =>
                            setCreature((prev) => ({
                              ...prev,
                              armaments: prev.armaments.filter((a: { id: string }) => a.id !== armament.id),
                            }))
                          }
                          label="Remove inventory item"
                        >
                          <X className="w-4 h-4" />
                        </IconButton>
                      }
                      compact
                    />
                    );
                  })}
                </div>
              </div>
              </div>
            )}
            <Button
              onClick={() => setShowArmamentModal(true)}
            >
              Add Inventory Item
            </Button>
          </CollapsibleSection>
    </CreatorLayout>
  );
}

export default function CreatureCreatorPage() {
  return (
    <RollProvider canRoll>
      <div className="min-h-screen bg-background py-8 px-4">
        <CreatureCreatorContent />
        <RollLog />
      </div>
    </RollProvider>
  );
}
