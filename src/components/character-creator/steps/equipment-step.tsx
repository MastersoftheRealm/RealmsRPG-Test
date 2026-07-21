/**
 * Equipment Step - Unified List Style
 * ===================================
 * Select starting equipment with real data from Codex.
 * Facade: data/hooks/handlers wire to catalog lib; presentation lives under `./equipment/`.
 */

'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import {
  useEquipment,
  useUserItems,
  useItemProperties,
  useOfficialLibrary,
  usePowerParts,
  useTechniqueParts,
  useMergedSpecies,
  useCodexSkills,
  useTraits,
  useCreatorPathData,
} from '@/hooks';
import { sortByColumn } from '@/hooks/use-sort';
import type { SortState } from '@/components/shared';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { Spinner, Button } from '@/components/ui';
import { useTabGroup } from '@/components/ui/tab-navigation';
import type { Item } from '@/types';
import type { PathItemRecommendation } from '@/types/archetype';
import { PathHelpCard, PathNotes } from '@/components/character-creator/PathHelpCard';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { getValidationIssuesForStep, getStepCompletion } from '@/lib/character-creator-validation';
import {
  computeRemainingCurrency,
  computeSpentCurrency,
  computeStartingCurrency,
} from '@/lib/guided-creator/equipment-currency';
import {
  addAdvancedEquipmentToInventory,
  availableUnarmedProwessLevels,
  buildAdvancedEquipmentCatalog,
  computeAdvancedEquipmentProficiencyTp,
  computeUnarmedProwessTpCost,
  filterAdvancedEquipmentCatalog,
  filterPathRecommendedForPhase,
  pathRecommendedMergeKey,
  recommendationIdSet,
  recommendedItemsInInventory,
  removeAdvancedEquipmentFromInventory,
  replaceRecommendedInventory,
  resolvePathRecommendedEquipment,
  selectedItemsFromInventory,
  type AdvancedEquipmentItem,
  type AdvancedEquipmentTabId,
  type AdvancedLoadoutPhase,
} from '@/lib/creator/advanced-equipment-catalog';
import { EquipmentStepHeader } from './equipment/step-header';
import { PathLoadoutSection } from './equipment/path-loadout-section';
import { UnarmedProwessPanel } from './equipment/unarmed-prowess-panel';
import { SelectedEquipmentList } from './equipment/selected-equipment-list';
import { EquipmentCatalogPanel } from './equipment/equipment-catalog-panel';

const EMPTY_PATH_RECOMMENDATIONS: PathItemRecommendation[] = [];

export function EquipmentStep() {
  const { tabGroupId, sharedPanelId } = useTabGroup();
  const {
    draft,
    nextStep,
    prevStep,
    updateDraft,
    getStepLayer,
    expandLayer,
    collapseLayer,
  } = useCharacterCreatorStore();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills } = useCodexSkills();
  const { data: allTraits } = useTraits();
  const validationContext = useMemo(
    () => ({ allSpecies, codexSkills: codexSkills ?? null, allTraits: allTraits ?? null }),
    [allSpecies, codexSkills, allTraits]
  );
  const stepIssues = useMemo(
    () => getValidationIssuesForStep('equipment', draft, validationContext),
    [draft, validationContext]
  );
  const completion = useMemo(
    () => getStepCompletion('equipment', draft, validationContext),
    [draft, validationContext]
  );
  const { data: userItems, isLoading: userItemsLoading } = useUserItems();
  const { data: codexEquipment, isLoading: codexLoading, error: codexError } = useEquipment();
  const { data: itemProperties } = useItemProperties();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const [activeTab, setActiveTab] = useState<AdvancedEquipmentTabId>('weapon');
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilterValue>('public');
  const [equipmentSort, setEquipmentSort] = useState<SortState>({ col: 'name', dir: 1 });
  const layer = getStepLayer('equipment');
  const pathMode = draft.creationMode === 'path';
  const showFullEquipmentList = !pathMode || layer >= 2;
  /** Path Layer 1: one decision at a time — weapon, then armor. */
  const [loadoutPhase, setLoadoutPhase] = useState<AdvancedLoadoutPhase>('weapon');
  const pathData = useCreatorPathData();
  const pathArmamentRecommendations =
    pathData?.level1?.armamentRecommendations ?? EMPTY_PATH_RECOMMENDATIONS;
  const pathEquipmentRecommendations =
    pathData?.level1?.equipmentRecommendations ?? EMPTY_PATH_RECOMMENDATIONS;
  const recommendedArmamentRefs = useMemo(
    () => recommendationIdSet(pathArmamentRecommendations),
    [pathArmamentRecommendations]
  );
  const recommendedEquipmentRefs = useMemo(
    () => recommendationIdSet(pathEquipmentRecommendations),
    [pathEquipmentRecommendations]
  );
  const pathRecommendsUnarmedProwess = pathData?.level1?.recommendUnarmedProwess === true;

  const { data: publicItems = [], isLoading: publicItemsLoading } = useOfficialLibrary('items');
  const isLoading = userItemsLoading || codexLoading || publicItemsLoading;
  const error = codexError;

  const currentUnarmedProwess = draft.unarmedProwess || 0;
  const unarmedProwessTPCost = useMemo(
    () => computeUnarmedProwessTpCost(currentUnarmedProwess),
    [currentUnarmedProwess]
  );
  const availableUnarmedLevels = useMemo(
    () => availableUnarmedProwessLevels(draft.level || 1),
    [draft.level]
  );
  const setUnarmedProwessLevel = useCallback(
    (level: number) => updateDraft({ unarmedProwess: level }),
    [updateDraft]
  );

  const allEquipment = useMemo(
    () =>
      buildAdvancedEquipmentCatalog({
        userItems,
        codexEquipment,
        publicItems,
        itemProperties,
      }),
    [userItems, codexEquipment, publicItems, itemProperties]
  );

  const pathRecommendedItems = useMemo(
    () =>
      resolvePathRecommendedEquipment(
        allEquipment,
        pathArmamentRecommendations,
        pathEquipmentRecommendations
      ),
    [allEquipment, pathArmamentRecommendations, pathEquipmentRecommendations]
  );

  const pathRecommendedForPhase = useMemo(
    () =>
      filterPathRecommendedForPhase(pathRecommendedItems, {
        pathMode,
        showFullEquipmentList,
        loadoutPhase,
      }),
    [pathRecommendedItems, pathMode, showFullEquipmentList, loadoutPhase]
  );

  const startingCurrency = useMemo(
    () => computeStartingCurrency(draft.level || 1),
    [draft.level]
  );
  const selectedItems = useMemo(
    () => selectedItemsFromInventory(draft.equipment?.inventory),
    [draft.equipment?.inventory]
  );
  const spentCurrency = useMemo(
    () =>
      computeSpentCurrency(selectedItems.map(({ cost, quantity }) => ({ cost, quantity }))),
    [selectedItems]
  );
  const remainingCurrency = computeRemainingCurrency(startingCurrency, spentCurrency);

  const proficiencyTpSummary = useMemo(
    () =>
      computeAdvancedEquipmentProficiencyTp({
        inventory: draft.equipment?.inventory,
        powers: draft.powers,
        techniques: draft.techniques,
        abilities: draft.abilities,
        powAbil: draft.pow_abil,
        martAbil: draft.mart_abil,
        level: draft.level,
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb: itemProperties,
      }),
    [draft, powerPartsDb, techniquePartsDb, itemProperties]
  );

  const filteredEquipment = useMemo(
    () =>
      filterAdvancedEquipmentCatalog(allEquipment, {
        activeTab,
        searchTerm,
        sourceFilter,
      }),
    [allEquipment, activeTab, searchTerm, sourceFilter]
  );
  const sortedEquipment = useMemo(
    () => sortByColumn(filteredEquipment, equipmentSort),
    [filteredEquipment, equipmentSort]
  );

  const addItemWithQuantity = useCallback(
    (item: AdvancedEquipmentItem, qty: number) => {
      const currentInventory: Item[] = draft.equipment?.inventory || [];
      const next = addAdvancedEquipmentToInventory(
        currentInventory,
        item,
        qty,
        remainingCurrency
      );
      if (!next) return;
      updateDraft({ equipment: { ...draft.equipment, inventory: next } });
    },
    [draft.equipment, remainingCurrency, updateDraft]
  );
  const addItem = useCallback(
    (item: AdvancedEquipmentItem) => addItemWithQuantity(item, 1),
    [addItemWithQuantity]
  );
  const removeItem = useCallback(
    (itemId: string) => {
      const currentInventory: Item[] = draft.equipment?.inventory || [];
      const next = removeAdvancedEquipmentFromInventory(currentInventory, itemId);
      if (next === currentInventory) return;
      updateDraft({ equipment: { ...draft.equipment, inventory: next } });
    },
    [draft.equipment, updateDraft]
  );
  const getItemQuantity = useCallback(
    (itemId: string): number => selectedItems.find((i) => i.id === itemId)?.quantity || 0,
    [selectedItems]
  );
  const addAllRecommendedEquipment = useCallback(() => {
    if (pathRecommendedItems.length === 0) return;
    const currentInventory: Item[] = draft.equipment?.inventory || [];
    updateDraft({
      equipment: {
        ...draft.equipment,
        inventory: replaceRecommendedInventory(currentInventory, pathRecommendedItems),
      },
    });
  }, [pathRecommendedItems, draft.equipment, updateDraft]);

  const pathConfirmMode =
    pathMode && !showFullEquipmentList && pathRecommendedItems.length > 0 && !publicItemsLoading;
  const pathMergeKey = useMemo(
    () => pathRecommendedMergeKey(draft.archetype?.id, pathRecommendedItems),
    [draft.archetype?.id, pathRecommendedItems]
  );
  const hasMergedPathEquipmentRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathConfirmMode || !pathMergeKey) return;
    if (hasMergedPathEquipmentRef.current === pathMergeKey) return;
    addAllRecommendedEquipment();
    hasMergedPathEquipmentRef.current = pathMergeKey;
  }, [pathConfirmMode, pathMergeKey, addAllRecommendedEquipment]);

  const recommendedInInventory = useMemo(
    () => recommendedItemsInInventory(draft.equipment?.inventory, pathRecommendedItems),
    [draft.equipment?.inventory, pathRecommendedItems]
  );

  const canContinue = useMemo(() => {
    const noErrors = !stepIssues.some((i) => i.severity === 'error');
    if (!pathMode || layer !== 1 || !pathConfirmMode) return noErrors;
    const loadoutReady =
      pathRecommendedItems.length === 0 ||
      recommendedInInventory.length >= pathRecommendedItems.length;
    return noErrors && loadoutReady;
  }, [
    stepIssues,
    pathMode,
    layer,
    pathConfirmMode,
    pathRecommendedItems.length,
    recommendedInInventory.length,
  ]);

  const handleContinue = useCallback(() => {
    updateDraft({ currency: remainingCurrency });
    nextStep();
  }, [remainingCurrency, updateDraft, nextStep]);

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto flex items-center justify-center py-12">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto text-center py-12">
        <p className="text-danger-700 dark:text-danger-400 mb-4">Failed to load equipment data.</p>
        <Button variant="secondary" onClick={prevStep}>
          ← Back
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col flex-1 min-h-0">
      <EquipmentStepHeader
        remainingCurrency={remainingCurrency}
        startingCurrency={startingCurrency}
        proficiencyTpSpent={proficiencyTpSummary.spent}
        proficiencyTpLimit={proficiencyTpSummary.limit}
      />

      {pathMode && draft.archetype?.name && (
        <>
          <PathHelpCard pathName={draft.archetype.name}>
            {showFullEquipmentList
              ? 'Browse the full equipment catalog, or return to your path loadout.'
              : loadoutPhase === 'weapon'
                ? 'Choose your weapon first. Included in your path loadout.'
                : 'Now choose armor, one decision at a time.'}
          </PathHelpCard>
          <PathNotes pathName={draft.archetype.name} notes={pathData?.level1?.notes} />
        </>
      )}

      {pathMode && !showFullEquipmentList && (
        <PathLoadoutSection
          loadoutPhase={loadoutPhase}
          onLoadoutPhaseChange={setLoadoutPhase}
          pathConfirmMode={pathConfirmMode}
          pathRecommendedForPhase={pathRecommendedForPhase}
          pathRecommendedItems={pathRecommendedItems}
          pathArmamentRecommendations={pathArmamentRecommendations}
          pathEquipmentRecommendations={pathEquipmentRecommendations}
          recommendedInInventory={recommendedInInventory}
          publicItemsLoading={publicItemsLoading}
          remainingCurrency={remainingCurrency}
          onAddAllRecommended={addAllRecommendedEquipment}
          onAddItemWithQuantity={addItemWithQuantity}
          onExpandFullCatalog={() => expandLayer('equipment')}
        >
          {pathRecommendsUnarmedProwess ? (
            <UnarmedProwessPanel
              variant="path"
              availableLevels={availableUnarmedLevels}
              characterLevel={draft.level || 1}
              currentUnarmedProwess={currentUnarmedProwess}
              unarmedProwessTPCost={unarmedProwessTPCost}
              onSetLevel={setUnarmedProwessLevel}
            />
          ) : null}
        </PathLoadoutSection>
      )}

      <SelectedEquipmentList
        selectedItems={selectedItems}
        allEquipment={allEquipment}
        onAddItemWithQuantity={addItemWithQuantity}
        onRemoveItem={removeItem}
      />

      {(draft.creationMode !== 'path' || showFullEquipmentList) && (
        <EquipmentCatalogPanel
          pathMode={pathMode}
          showBackToPathLoadout={pathRecommendedItems.length > 0}
          onCollapseToPathLoadout={() => collapseLayer('equipment')}
          allEquipment={allEquipment}
          sortedEquipment={sortedEquipment}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          currentUnarmedProwess={currentUnarmedProwess}
          tabGroupId={tabGroupId}
          sharedPanelId={sharedPanelId}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          equipmentSort={equipmentSort}
          onEquipmentSortChange={setEquipmentSort}
          remainingCurrency={remainingCurrency}
          startingCurrency={startingCurrency}
          creationMode={draft.creationMode}
          recommendedArmamentRefs={recommendedArmamentRefs}
          recommendedEquipmentRefs={recommendedEquipmentRefs}
          itemProperties={itemProperties}
          getItemQuantity={getItemQuantity}
          onAddItem={addItem}
          onRemoveItem={removeItem}
          availableUnarmedLevels={availableUnarmedLevels}
          characterLevel={draft.level || 1}
          unarmedProwessTPCost={unarmedProwessTPCost}
          onSetUnarmedProwessLevel={setUnarmedProwessLevel}
        />
      )}

      <CreatorStepFooter
        onBack={prevStep}
        onContinue={handleContinue}
        continueDisabled={!canContinue}
        completionHint={
          pathConfirmMode ? (
            <span>
              Loadout {recommendedInInventory.length} / {pathRecommendedItems.length} confirmed
            </span>
          ) : (
            <span>{completion.label}</span>
          )
        }
      />
    </div>
  );
}
