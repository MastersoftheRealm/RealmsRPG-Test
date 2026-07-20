/**
 * Creature Creator — workspace state hook (TASK-381 Phase 5)
 * ==========================================================
 * Owns creature state, draft cache, stats, library selectable builders,
 * modal UI state, save/load, and editor callbacks. Presentational sections
 * stay in creature-creator-editor; CreatorPageShell wiring stays in page.tsx.
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { getSkillPointsHelp } from '../../../../public/tooltip-text';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import type { SelectableItem } from '@/components/shared';
import { useAuthStore } from '@/stores/auth-store';
import {
  useUserPowers,
  useUserTechniques,
  useUserEmpoweredTechniques,
  useUserItems,
  usePowerParts,
  useTechniqueParts,
  useCreatureFeats,
  useItemProperties,
  useCodexSkills,
  useCodexFeats,
  useTraits,
  useAdmin,
  useCreatorSave,
  useLoadModalLibrary,
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
  displayItemToCreaturePower,
  displayItemToCreatureTechnique,
  displayItemToCreatureArmament,
  inferCreatureFeatSource,
  labelCreatureFeatSource,
} from './transformers';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { trainingPointsForItemPropertyRef } from '@/lib/calculators';
import type { ChipData } from '@/components/shared/grid-list-row';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  buildEntityMetadataDetailSections,
  buildPartsAndMetadataDetailSections,
  mergeDetailSections,
  metadataDescriptorChip,
  metadataDetailSection,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import { buildEmpoweredPowerSelectableItem } from '@/hooks/add-library-item/build-empowered-selectable-item';
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
import { formatDamageDisplay, formatListCellLabel, normalizeRangeDisplay } from '@/lib/utils';
import { CREATURE_FEAT_IDS } from '@/lib/id-constants';
import { CREATURE_SIZES } from '@/lib/game/creator-constants';
import type { AbilityName } from '@/types';
import type { DisplayItem } from '@/types/items';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import {
  SENSES,
  MOVEMENT_TYPES,
  SENSE_TO_FEAT_ID,
  MOVEMENT_TO_FEAT_ID,
  initialState,
  CREATURE_CREATOR_CACHE_KEY,
} from './creature-creator-constants';
import { displayItemToSelectableItem } from './CreatureCreatorHelpers';
import {
  allocationsToCreatureSkills,
  creatureSkillsToAllocations,
  rawRecordToCreatureState,
} from './creature-skill-utils';
import { bootstrapCreatureState } from './creature-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import {
  codexFeatToCreatureFeat,
  creatureToFeatRequirementCharacter,
  mergeCreatureFeatsOnAdd,
} from './creature-feat-utils';
import { checkFeatRequirements, getMaxQualifiedFeatLevel } from '@/lib/game/feat-requirements';
import { buildFeatLevelsByFamily, getFeatFamilyId, getFeatLevel } from '@/lib/leveled-feats';

type InventoryTab = 'all' | 'weapon' | 'armor' | 'shield' | 'equipment';
type PowerModalTab = 'powers' | 'empowered';

function normalizeInventoryType(type: string | undefined): Exclude<InventoryTab, 'all'> {
  const normalized = String(type ?? '').toLowerCase().trim();
  if (normalized === 'weapon' || normalized === 'armor' || normalized === 'shield') {
    return normalized;
  }
  return 'equipment';
}

export function useCreatureCreatorWorkspace() {

  const { user } = useAuthStore();
  const { rules } = useGameRules();
  const { isAdmin } = useAdmin();
  const { data: creatureFeatsData = [], isLoading: creatureFeatsLoading } = useCreatureFeats();
  const { data: codexFeatsData = [], isLoading: codexFeatsLoading } = useCodexFeats();
  const { data: codexTraitsData = [], isLoading: traitsLoading } = useTraits();
  const { data: skillsData = [], isLoading: skillsLoading } = useCodexSkills();

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
  const load = useLoadModalLibrary('creature', { prefetch: !!editCreatureId });

  const [creature, setCreature] = useState<CreatureState>(initialState);
  const creatureLevel = Math.max(1, Math.floor(creature.level));
  const skillPointsHelp = useMemo(
    () => getSkillPointsHelp(creatureLevel, rules, 'creature'),
    [creatureLevel, rules],
  );
  const [showPowerModal, setShowPowerModal] = useState(false);
  const [showTechniqueModal, setShowTechniqueModal] = useState(false);
  const [showFeatModal, setShowFeatModal] = useState(false);
  const [showArmamentModal, setShowArmamentModal] = useState(false);
  const [librarySource, setLibrarySource] = useState<SourceFilterValue>('all');
  const [inventoryTab, setInventoryTab] = useState<InventoryTab>('all');
  const [powerModalTab, setPowerModalTab] = useState<PowerModalTab>('powers');

  /** Defer power/technique/item library fetches until their selection modals open. */
  const libraryQueriesEnabled =
    showPowerModal ||
    showTechniqueModal ||
    showArmamentModal;

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

  // Raw lists by source (for building selectable items with parts/properties chips)
  const powerList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userPowers : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? publicPowers : [];
    return [...my, ...pub] as UserPower[];
  }, [userPowers, publicPowers, librarySource]);
  const techniqueList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userTechniques : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? publicTechniques : [];
    return [...my, ...pub] as UserTechnique[];
  }, [userTechniques, publicTechniques, librarySource]);
  const empoweredTechniqueList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userEmpoweredTechniques : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? publicEmpoweredTechniques : [];
    const merged = [...my, ...pub];
    const seen = new Set<string>();
    return merged.filter((technique) => {
      const id = String(technique.docId ?? technique.id ?? '');
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
  }, [librarySource, userEmpoweredTechniques, publicEmpoweredTechniques]);
  const armamentList = useMemo(() => {
    const my = (librarySource === 'my' || librarySource === 'all') ? userItems : [];
    const pub = (librarySource === 'public' || librarySource === 'all') ? publicItems : [];
    const selectedIds = new Set(creature.armaments.map((a: { id: string }) => String(a.id)).filter((id) => id.length > 0));
    return [...my, ...pub].filter((item: UserItem) => !selectedIds.has(item.docId)) as UserItem[];
  }, [userItems, publicItems, librarySource, creature.armaments]);

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
      const partChips = partChipsFromDisplay(display.partChips);
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Damage', 'Area']);
      // Duration omitted from modal columns → labeled chip (Range already chipped)
      const detailSections = buildPartsAndMetadataDetailSections({
        range: display.range,
        duration: display.duration,
        partChips,
      });
      return {
        ...base,
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        totalCost: display.tp > 0 ? display.tp : undefined,
        costLabel: display.tp > 0 ? 'Training Points' : undefined,
        data: displayItem,
      };
    });
  }, [powerList, powerPartsDb]);
  const empoweredTechniqueSelectableItems = useMemo(() => {
    return empoweredTechniqueList.map((technique: UserTechnique) => {
      const empowered = buildEmpoweredPowerSelectableItem(technique);
      const raw = technique as unknown as Record<string, unknown>;
      const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
      const totals = (raw.totals as Record<string, unknown> | undefined) ?? {};
      const energy = Number(totals.energy ?? 0);
      const tp = Number(totals.trainingPoints ?? 0);
      const actionCol = empowered.columns?.find((c) => c.key === 'Action');
      const damageCol = empowered.columns?.find((c) => c.key === 'Damage');
      const areaCol = empowered.columns?.find((c) => c.key === 'Area');
      const durationCol = empowered.columns?.find((c) => c.key === 'Duration');
      const displayItem = transformUserPowerToDisplayItem({
        id: technique.id,
        docId: technique.docId,
        name: technique.name,
        description: technique.description,
        parts: [],
        actionType: String(raw.actionType ?? ''),
        isReaction: raw.isReaction === true,
        area: powerData.area as UserPower['area'],
        range: powerData.range as UserPower['range'],
        duration: powerData.duration as UserPower['duration'],
        damage: powerData.damage as UserPower['damage'],
      }, powerPartsDb);
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Damage', 'Area']);
      const durationFacts = buildEntityMetadataDetailSections({
        duration: durationCol?.value != null ? String(durationCol.value) : undefined,
      });
      return {
        ...empowered,
        ...base,
        columns: [
          { key: 'Energy', value: energy || '-', align: 'center' as const },
          { key: 'Action', value: actionCol?.value ?? '-', align: 'center' as const },
          { key: 'Damage', value: damageCol?.value ?? '-', align: 'center' as const },
          { key: 'Area', value: areaCol?.value ?? '-', align: 'center' as const },
        ],
        detailSections: mergeDetailSections(durationFacts, empowered.detailSections),
        totalCost: tp > 0 ? tp : undefined,
        costLabel: tp > 0 ? 'Training Points' : undefined,
        data: {
          ...displayItem,
          sourceData: {
            id: technique.docId,
            name: technique.name,
            energy,
            tp,
            action: actionCol?.value ?? '-',
            duration: String((powerData.duration as Record<string, unknown> | undefined)?.type ?? '-'),
            range: String((powerData.range as Record<string, unknown> | undefined)?.steps ?? '-'),
            area: areaCol?.value ?? '-',
            damage: damageCol?.value ?? '-',
            innate: false,
            image_id: technique.image_id ?? null,
            image_url: technique.image_url ?? null,
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
      const partChips = partChipsFromDisplay(display.partChips);
      const base = displayItemToSelectableItem(displayItem, ['Energy', 'Action', 'Weapon', 'Training Pts']);
      const detailSections = buildPartsAndMetadataDetailSections({
        damage: display.damageStr !== '-' ? display.damageStr : undefined,
        partChips,
      });
      return {
        ...base,
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        totalCost: typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined,
        costLabel: typeof display.tp === 'number' && display.tp > 0 ? 'Training Points' : undefined,
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
          costLabel: 'Training Points',
          category: cost > 0 ? ('cost' as const) : ('default' as const),
          level: lvl > 1 ? lvl : undefined,
        };
      });
      const propertySection = propertiesProficienciesSection(propertyChips);
      const totalCost = propertyChips.reduce((sum, c) => sum + (c.cost ?? 0), 0) || undefined;
      const base = displayItemToSelectableItem(displayItem, ['Type', 'TP', 'Cost']);
      const source = displayItem.sourceData as {
        type?: string;
        damage?: string;
        range?: string;
        damageReduction?: number;
        armorValue?: number;
      } | undefined;
      const type = String(source?.type ?? '').toLowerCase();
      const dr = source?.damageReduction ?? source?.armorValue;
      const factChips: ChipData[] = [];
      if ((type === 'weapon' || type === 'shield') && source?.damage) {
        factChips.push(metadataDescriptorChip(`Damage: ${source.damage}`));
      }
      if ((type === 'weapon' || type === 'shield') && source?.range) {
        const rangeStr = normalizeRangeDisplay(source.range);
        if (rangeStr) factChips.push(metadataDescriptorChip(`Range: ${rangeStr}`));
      }
      if (type === 'armor' && dr != null) {
        factChips.push(metadataDescriptorChip(`Damage Reduction ${dr}`));
      }
      const factSection = metadataDetailSection(factChips);
      return {
        ...base,
        detailSections: mergeDetailSections(factSection, propertySection),
        totalCost: totalCost ?? undefined,
        costLabel: totalCost != null ? 'Training Points' : undefined,
        data: displayItem,
      };
    });
  }, [armamentList, itemPropertiesDb]);

  const inventoryDisplayFilter = useCallback((item: SelectableItem) => {
    if (inventoryTab === 'all') return true;
    const sourceData = (item.data as DisplayItem | undefined)?.sourceData as { type?: string } | undefined;
    return normalizeInventoryType(sourceData?.type) === inventoryTab;
  }, [inventoryTab]);

  // One-time render adjust per sessionKey: seed creature state exactly once when
  // reference data is ready (no hydrate effect). The creator form is behind the
  // shell's loading flag until then, so nothing user-entered can be clobbered.
  const sessionKey = editCreatureId ?? 'draft';
  const bootstrapReady =
    !skillsLoading &&
    !traitsLoading &&
    !creatureFeatsLoading &&
    !codexFeatsLoading &&
    (!editCreatureId || !load.isLoading);
  const [bootstrapKey, setBootstrapKey] = useState<string | null>(null);
  if (bootstrapReady && bootstrapKey !== sessionKey) {
    setBootstrapKey(sessionKey);
    setCreature(bootstrapCreatureState({ editCreatureId, rawItems: load.rawItems }));
  }
  const bootstrapApplied = bootstrapKey === sessionKey;

  // ?edit= mode: clear any stale draft once on mount (parity with the old edit
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editCreatureId) clearCreatorCache(CREATURE_CREATOR_CACHE_KEY);
  }, [editCreatureId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editCreatureId || !bootstrapApplied) return;
    writeCreatorCache(CREATURE_CREATOR_CACHE_KEY, {
      creature,
      timestamp: Date.now(),
    });
  }, [editCreatureId, bootstrapApplied, creature]);
  
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
              maxQualified: getMaxQualifiedFeatLevel(
                creatureToFeatRequirementCharacter(creature),
                family,
                skillsData,
                codexFeatsData as Feat[]
              ),
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

  /** Enrich armaments with display sort keys so RANGE/ATTACK/DAMAGE headers work. */
  const armamentsWithSortKeys = useMemo(() => {
    const prof = creature.martialProficiency ?? 0;
    const str = creature.abilities.strength ?? 0;
    const agi = creature.abilities.agility ?? 0;
    const acu = creature.abilities.acuity ?? 0;
    return creature.armaments.map((armament) => {
      const isWeapon = String(armament.type ?? '').toLowerCase() === 'weapon';
      const isShield = String(armament.type ?? '').toLowerCase() === 'shield';
      const propNames = (armament.properties || [])
        .map((p: unknown) => (typeof p === 'string' ? p : (p as { name?: string }).name || ''))
        .filter(Boolean);
      const finesse = propNames.some((p: string) => p.toLowerCase() === 'finesse');
      const range =
        normalizeRangeDisplay((armament as { range?: string }).range) ||
        (isWeapon ? 'Melee' : '-');
      const isRanged = range.toLowerCase() !== 'melee';
      const attackBonus = isWeapon ? (finesse ? agi : isRanged ? acu : str) + prof : null;
      const attack =
        attackBonus != null ? `${attackBonus >= 0 ? '+' : ''}${attackBonus}` : '-';
      const damage =
        isWeapon || isShield
          ? formatDamageDisplay((armament as { damage?: unknown }).damage) || '-'
          : '-';
      return {
        ...armament,
        range,
        attack,
        damage,
        type: formatListCellLabel(armament.type),
        tp: armament.tp != null ? armament.tp : '-',
        currency: armament.currency != null ? `${armament.currency}c` : '-',
      };
    });
  }, [creature.armaments, creature.abilities, creature.martialProficiency]);

  const sortedArmaments = useMemo(
    () => sortArmamentItems(armamentsWithSortKeys),
    [armamentsWithSortKeys, sortArmamentItems]
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
    load.closeLoadModal();
    save.setSaveMessage({ type: 'success', text: 'Creature loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [load, save]);

  const handleSave = useCallback(async () => {
    if (isOverBudget) {
      save.setSaveMessage({
        type: 'error',
        text: 'Cannot save: creature exceeds one or more point budgets.',
      });
      setTimeout(() => save.setSaveMessage(null), 3000);
      return;
    }
    await save.handleSave();
  }, [save, isOverBudget]);

  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleReset = () => {
    setShowResetConfirm(true);
  };


  const onRemoveFeat = useCallback((featId: string) => {
    setCreature((prev) => ({
      ...prev,
      feats: prev.feats.filter((f) => f.id !== featId),
    }));
  }, []);

  const onTogglePowerInnate = useCallback((powerId: string) => {
    setCreature((prev) => ({
      ...prev,
      powers: prev.powers.map((p) =>
        p.id === powerId ? { ...p, innate: !(p.innate === true) } : p,
      ),
    }));
  }, []);

  const onRemovePower = useCallback((powerId: string) => {
    setCreature((prev) => ({
      ...prev,
      powers: prev.powers.filter((p) => p.id !== powerId),
    }));
  }, []);

  const onRemoveTechnique = useCallback((techniqueId: string) => {
    setCreature((prev) => ({
      ...prev,
      techniques: prev.techniques.filter((t) => t.id !== techniqueId),
    }));
  }, []);

  const onRemoveArmament = useCallback((armamentId: string) => {
    setCreature((prev) => ({
      ...prev,
      armaments: prev.armaments.filter((a) => a.id !== armamentId),
    }));
  }, []);

  return {
    user,
    isAdmin,
    creature,
    setCreature,
    creatureLevel,
    skillPointsHelp,
    stats,
    isOverBudget,
    bootstrapApplied,
    load,
    save,
    handleSave,
    handleReset,
    handleLoadCreature,
    showResetConfirm,
    setShowResetConfirm,
    showPowerModal,
    setShowPowerModal,
    showTechniqueModal,
    setShowTechniqueModal,
    showFeatModal,
    setShowFeatModal,
    showArmamentModal,
    setShowArmamentModal,
    librarySource,
    setLibrarySource,
    inventoryTab,
    setInventoryTab,
    powerModalTab,
    setPowerModalTab,
    powerSelectableItems,
    empoweredTechniqueSelectableItems,
    techniqueSelectableItems,
    armamentSelectableItems,
    inventoryDisplayFilter,
    codexFeatsById,
    skillAllocations,
    abilityDefenseBonuses,
    senseDescriptions,
    movementDescriptions,
    getSenseCostLabel,
    getMovementCostLabel,
    featsSummary,
    powersSummary,
    techniquesSummary,
    armamentsSummary,
    featSort,
    handleFeatSort,
    sortedFeats,
    armamentSort,
    handleArmamentSort,
    sortedArmaments,
    updateCreature,
    updateAbility,
    addToArray,
    removeFromArray,
    handleSkillAllocationsChange,
    handleDefenseSkillsChange,
    handleCreatureFeatLevelChange,
    onRemoveFeat,
    onTogglePowerInnate,
    onRemovePower,
    onRemoveTechnique,
    onRemoveArmament,
    getCreatureSkillBonus,
    displayItemToCreaturePower,
    displayItemToCreatureTechnique,
    displayItemToCreatureArmament,
    mergeCreatureFeatsOnAdd,
    initialState,
    clearCreatorCache,
    CREATURE_CREATOR_CACHE_KEY,
  };
}
