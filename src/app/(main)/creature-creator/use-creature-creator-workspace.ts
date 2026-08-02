/**
 * Creature Creator — workspace state hook (TASK-381 Phase 5; TASK-610 splits)
 * ==========================================================
 * Owns creature state, draft cache, stats, library selectable builders,
 * modal UI state, and editor callbacks. Save/load persistence in
 * creature-creator-workspace-persistence.ts (TASK-615). Presentational sections
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
  useLoadModalLibrary,
  useOfficialLibrary,
  useGameRules,
  type CreatureFeat as CodexCreatureFeatRow,
  type UserPower,
  type UserTechnique,
  type Feat,
  type Trait,
} from '@/hooks';
import {
  displayItemToCreaturePower,
  displayItemToCreatureTechnique,
  displayItemToCreatureArmament,
} from './transformers';
import { useSort } from '@/hooks/use-sort';
import type { AbilityName } from '@/types';
import type { CreatureSkill, CreatureState } from './creature-creator-types';
import {
  SENSES,
  MOVEMENT_TYPES,
  SENSE_TO_FEAT_ID,
  MOVEMENT_TO_FEAT_ID,
  initialState,
  CREATURE_CREATOR_CACHE_KEY,
} from './creature-creator-constants';
import {
  allocationsToCreatureSkills,
  creatureSkillsToAllocations,
} from './creature-skill-utils';
import { bootstrapCreatureState } from './creature-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { mergeCreatureFeatsOnAdd } from './creature-feat-utils';
import {
  buildArmamentLibraryList,
  buildArmamentSelectableItems,
  buildEmpoweredTechniqueLibraryList,
  buildEmpoweredTechniqueSelectableItems,
  buildPowerSelectableItems,
  buildTechniqueSelectableItems,
  filterCreatureInventorySelectable,
  mergeCreatureLibraryBySource,
  selectedArmamentIdsFromCreature,
  type CreatureInventoryTab,
} from './creature-creator-library-selectables';
import {
  calculateCreatureCreatorStats,
  isCreatureOverBudget,
} from './creature-creator-derived-stats';
import {
  applyCreatureFeatLevelChange,
  buildFeatLevelsByFamilyMap,
  buildFeatsWithTypeLabel,
  enrichArmamentsWithSortKeys,
} from './creature-creator-feat-armament-display';
import {
  buildSkillAbilityMap,
  buildSubSkillNames,
  getCreatureSkillBonus as computeCreatureSkillBonus,
} from './creature-creator-skill-bonus';
import {
  buildCreatureArmamentsSummary,
  buildCreatureFeatsSummary,
  buildCreaturePowersSummary,
  buildCreatureTechniquesSummary,
} from './creature-creator-summaries';
import { useCreatureCreatorWorkspacePersistence } from './creature-creator-workspace-persistence';

type PowerModalTab = 'powers' | 'empowered';

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
        (creatureFeatsData as CodexCreatureFeatRow[]).map((cf) => String(cf.id)),
      ),
      codexFeatById: new Map<string, { char_feat?: boolean }>(
        (codexFeatsData as Feat[]).map((f) => [String(f.id), { char_feat: f.char_feat }]),
      ),
      traitById: new Map<string, { flaw?: boolean; characteristic?: boolean }>(
        (codexTraitsData as Trait[]).map((t) => [
          String(t.id),
          { flaw: t.flaw, characteristic: t.characteristic },
        ]),
      ),
    }),
    [creatureFeatsData, codexFeatsData, codexTraitsData],
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
  const [inventoryTab, setInventoryTab] = useState<CreatureInventoryTab>('all');
  const [powerModalTab, setPowerModalTab] = useState<PowerModalTab>('powers');

  const libraryQueriesEnabled = showPowerModal || showTechniqueModal || showArmamentModal;

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

  const powerList = useMemo(
    () => mergeCreatureLibraryBySource(librarySource, userPowers, publicPowers) as UserPower[],
    [userPowers, publicPowers, librarySource],
  );
  const techniqueList = useMemo(
    () => mergeCreatureLibraryBySource(librarySource, userTechniques, publicTechniques) as UserTechnique[],
    [userTechniques, publicTechniques, librarySource],
  );
  const empoweredTechniqueList = useMemo(
    () => buildEmpoweredTechniqueLibraryList(librarySource, userEmpoweredTechniques, publicEmpoweredTechniques),
    [librarySource, userEmpoweredTechniques, publicEmpoweredTechniques],
  );
  const armamentList = useMemo(
    () =>
      buildArmamentLibraryList(
        librarySource,
        userItems,
        publicItems,
        selectedArmamentIdsFromCreature(creature),
      ),
    [userItems, publicItems, librarySource, creature],
  );

  const powerSelectableItems = useMemo(
    () => buildPowerSelectableItems(powerList, powerPartsDb),
    [powerList, powerPartsDb],
  );
  const empoweredTechniqueSelectableItems = useMemo(
    () => buildEmpoweredTechniqueSelectableItems(empoweredTechniqueList, powerPartsDb, techniquePartsDb),
    [empoweredTechniqueList, powerPartsDb, techniquePartsDb],
  );
  const techniqueSelectableItems = useMemo(
    () => buildTechniqueSelectableItems(techniqueList, techniquePartsDb),
    [techniqueList, techniquePartsDb],
  );
  const armamentSelectableItems = useMemo(
    () => buildArmamentSelectableItems(armamentList, itemPropertiesDb),
    [armamentList, itemPropertiesDb],
  );

  const inventoryDisplayFilter = useCallback(
    (item: SelectableItem) => filterCreatureInventorySelectable(inventoryTab, item),
    [inventoryTab],
  );

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

  useEffect(() => {
    if (editCreatureId) clearCreatorCache(CREATURE_CREATOR_CACHE_KEY);
  }, [editCreatureId]);

  useEffect(() => {
    if (editCreatureId || !bootstrapApplied) return;
    writeCreatorCache(CREATURE_CREATOR_CACHE_KEY, {
      creature,
      timestamp: Date.now(),
    });
  }, [editCreatureId, bootstrapApplied, creature]);

  const featPointsMap = useMemo(() => {
    const map = new Map<string, number>();
    creatureFeatsData.forEach((feat: CodexCreatureFeatRow) => {
      map.set(feat.id, feat.points);
    });
    return map;
  }, [creatureFeatsData]);

  const skillAbilityMap = useMemo(() => buildSkillAbilityMap(skillsData), [skillsData]);
  const subSkillNames = useMemo(() => buildSubSkillNames(skillsData), [skillsData]);

  const getSenseCostLabel = useCallback(
    (sense: string) => {
      const featId = SENSE_TO_FEAT_ID[sense];
      if (featId == null) return undefined;
      const cost = featPointsMap.get(String(featId));
      return cost != null ? `${cost >= 0 ? '+' : ''}${cost} pt` : undefined;
    },
    [featPointsMap],
  );
  const getMovementCostLabel = useCallback(
    (movement: string) => {
      const featId = MOVEMENT_TO_FEAT_ID[movement];
      if (featId == null) return undefined;
      const cost = featPointsMap.get(String(featId));
      return cost != null ? `${cost >= 0 ? '+' : ''}${cost} pt` : undefined;
    },
    [featPointsMap],
  );

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
    () => buildFeatLevelsByFamilyMap(codexFeatsData as Feat[]),
    [codexFeatsData],
  );

  const codexFeatsById = useMemo(
    () => new Map((codexFeatsData as Feat[]).map((f) => [String(f.id), f])),
    [codexFeatsData],
  );

  const { sortState: featSort, handleSort: handleFeatSort, sortItems: sortFeatItems } = useSort('name');
  const {
    sortState: armamentSort,
    handleSort: handleArmamentSort,
    sortItems: sortArmamentItems,
  } = useSort('name');

  const featsWithTypeLabel = useMemo(
    () =>
      buildFeatsWithTypeLabel(
        creature,
        creatureFeatSourceLookup,
        codexFeatsById,
        featLevelsByFamily,
        skillsData,
        codexFeatsData as Feat[],
      ),
    [creature, creatureFeatSourceLookup, codexFeatsById, featLevelsByFamily, skillsData, codexFeatsData],
  );

  const handleCreatureFeatLevelChange = useCallback(
    (featId: string, targetLevel: number) => {
      setCreature((prev) =>
        applyCreatureFeatLevelChange(
          prev,
          featId,
          targetLevel,
          creatureFeatSourceLookup,
          codexFeatsById,
          featLevelsByFamily,
          skillsData,
          codexFeatsData as Feat[],
        ),
      );
    },
    [codexFeatsById, featLevelsByFamily, creatureFeatSourceLookup, skillsData, codexFeatsData],
  );

  const sortedFeats = useMemo(() => sortFeatItems(featsWithTypeLabel), [featsWithTypeLabel, sortFeatItems]);

  const armamentsWithSortKeys = useMemo(() => enrichArmamentsWithSortKeys(creature), [creature]);

  const sortedArmaments = useMemo(
    () => sortArmamentItems(armamentsWithSortKeys),
    [armamentsWithSortKeys, sortArmamentItems],
  );

  const getCreatureSkillBonus = useCallback(
    (skill: CreatureSkill) =>
      computeCreatureSkillBonus(skill, creature, skillsData, subSkillNames, skillAbilityMap),
    [skillsData, creature, subSkillNames, skillAbilityMap],
  );

  const updateCreature = useCallback((updates: Partial<CreatureState>) => {
    setCreature((prev) => ({ ...prev, ...updates }));
  }, []);

  const updateAbility = useCallback((ability: AbilityName, value: number) => {
    setCreature((prev) => ({
      ...prev,
      abilities: { ...prev.abilities, [ability]: value },
    }));
  }, []);

  const addToArray = useCallback((field: keyof CreatureState, item: string) => {
    setCreature((prev) => ({
      ...prev,
      [field]: [...(prev[field] as string[]), item],
    }));
  }, []);

  const removeFromArray = useCallback((field: keyof CreatureState, item: string) => {
    setCreature((prev) => ({
      ...prev,
      [field]: (prev[field] as string[]).filter((i: string) => i !== item),
    }));
  }, []);

  const stats = useMemo(
    () => calculateCreatureCreatorStats(creature, featPointsMap, subSkillNames, rules),
    [creature, featPointsMap, subSkillNames, rules],
  );

  const isOverBudget = useMemo(() => isCreatureOverBudget(stats), [stats]);

  const {
    save,
    handleSave,
    handleReset,
    handleLoadCreature,
    showResetConfirm,
    setShowResetConfirm,
    onRemoveFeat,
    onTogglePowerInnate,
    onRemovePower,
    onRemoveTechnique,
    onRemoveArmament,
  } = useCreatureCreatorWorkspacePersistence({
    creature,
    setCreature,
    stats: { isOverBudget },
    load,
  });

  const featsSummary = useMemo(() => buildCreatureFeatsSummary(creature), [creature]);
  const powersSummary = useMemo(() => buildCreaturePowersSummary(creature), [creature]);
  const techniquesSummary = useMemo(() => buildCreatureTechniquesSummary(creature), [creature]);
  const armamentsSummary = useMemo(() => buildCreatureArmamentsSummary(creature), [creature]);

  const skillAllocations = useMemo(
    () => creatureSkillsToAllocations(creature.skills, skillsData),
    [creature.skills, skillsData],
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
    [creature.abilities],
  );

  const handleSkillAllocationsChange = useCallback(
    (next: Record<string, number>) => {
      setCreature((prev) => ({
        ...prev,
        skills: allocationsToCreatureSkills(next, skillsData),
      }));
    },
    [skillsData],
  );

  const handleDefenseSkillsChange = useCallback((defense: CreatureState['defenses']) => {
    setCreature((prev) => ({ ...prev, defenses: defense }));
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
