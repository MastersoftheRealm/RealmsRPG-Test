/**
 * Creature Creator Page
 * =====================
 * Tool for creating custom creatures and NPCs.
 *
 * Structure (TASK-381): workspace hook owns state/stats/modals data;
 * form section islands in creature-creator-editor; this file wires shell.
 */

'use client';

import { Suspense, useMemo } from 'react';
import {
  UnifiedSelectionModal,
  SourceFilter,
  sourceFilterSummary,
  SegmentedControl,
  type SelectableItem,
} from '@/components/patterns';
import { getListHeaderColumns, getModalGridColumns } from '@/lib/library-selectable-builders';
import { Alert, LoadingState } from '@/components/ui';
import { Skull } from 'lucide-react';
import { RollLog, RollProvider } from '@/components/rolls';
import { formatListCellLabel } from '@/lib/utils';

const CREATURE_ABILITY_ABBRS = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
} as const;
import { formatCreatureLevel } from '@/lib/game';
import {
  creatorPublishSaveAsCopyActions,
  creatorToolbarSaveAsCopyHandler,
} from '@/lib/creator/creator-save-as-copy';
import { CreatorSummaryPanel, CreatorPageShell } from '@/components/creator';
import { getCreatureAbilityBounds } from '@/lib/game/creature-ability-bounds';
import { formatCreatureAbilityPointsValue } from './creature-ability-points-display';
import {
  creatureMovementLabel,
  creaturePickerMaxSelections,
  creatureSenseLabel,
  creatureSizeDisplayLabel,
  formatCreatureGroupedNumber,
  uniqueCreatureLanguages,
} from './creature-trait-labels';
import type { DisplayItem } from '@/types/items';
import type { CreatureSkill } from './creature-creator-types';
import { AddCreatureFeatModal } from './AddCreatureFeatModal';
import { CreatureCreatorEditor } from './creature-creator-editor';
import { useCreatureCreatorWorkspace } from './use-creature-creator-workspace';
import { buildCreatureOverBudgetNotification } from './creature-over-budget-notification';

function CreatureCreatorContent() {
  const ws = useCreatureCreatorWorkspace();
  const {
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
    codexFeatsById,
    skillAllocations,
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
    onAddArmaments,
    getCreatureSkillBonus,
    displayItemToCreaturePower,
    displayItemToCreatureTechnique,
    displayItemToCreatureArmament,
    mergeCreatureFeatsOnAdd,
    initialState,
    clearSessionDraftCache,
    acceptDraft,
  } = ws;

  const overBudgetNotification = useMemo(() => buildCreatureOverBudgetNotification(stats), [stats]);

  return (
    <CreatorPageShell
      icon={<Skull className="h-8 w-8 text-primary-link-fg" />}
      title="Creature Creator"
      description="Design custom creatures, monsters, and NPCs. Configure abilities, defenses, skills, and combat options."
      user={user}
      auth={{ returnPath: '/creature-creator', contentType: 'creature' }}
      showSaveTarget={isAdmin}
      saveTarget={save.saveTarget}
      onSaveTargetChange={save.setSaveTarget}
      onSave={handleSave}
      onSaveAsCopy={creatorToolbarSaveAsCopyHandler(save)}
      onLoad={load.openLoadModal}
      onReset={handleReset}
      unsavedDirty={ws.unsavedDirty}
      onDiscardLocalDraft={ws.discardLocalDraft}
      saving={save.saving}
      saveDisabled={!creature.name.trim() || isOverBudget}
      saveDisabledReason={
        isOverBudget
          ? overBudgetNotification.title
          : !creature.name.trim()
            ? 'Enter a creature name to save.'
            : undefined
      }
      aboveGrid={
        overBudgetNotification.show ? (
          <Alert variant="danger">{overBudgetNotification.title}</Alert>
        ) : undefined
      }
      loading={{
        isLoading: !bootstrapApplied,
        loadingMessage: 'Loading creature creator...',
      }}
      publish={{
        isOpen: save.showPublishConfirm,
        onClose: () => save.setShowPublishConfirm(false),
        onConfirm: () => save.confirmPublish(),
        title: save.publishConfirmTitle,
        confirmLabel: save.publishConfirmLabel,
        description:
          save.publishConfirmDescription?.(creature.name.trim(), {
            existingInPublic: save.publishExistingInPublic,
          }) ?? '',
        ...creatorPublishSaveAsCopyActions(save),
      }}
      resetConfirm={{
        isOpen: showResetConfirm,
        onClose: () => setShowResetConfirm(false),
        onConfirm: () => {
          setCreature(initialState);
          save.forgetLoadedLibraryItem();
          acceptDraft();
          clearSessionDraftCache();
          setShowResetConfirm(false);
        },
        title: 'Restart Creature',
        description:
          'Are you sure you want to reset all creature data? This will clear all fields and cannot be undone.',
        confirmLabel: 'Restart',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        onSelect: handleLoadCreature,
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Creature',
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        optionsSummary: sourceFilterSummary(load.source),
        optionsActiveCount: load.source !== 'all' ? 1 : 0,
        searchPlaceholder: 'Search creatures by name, type, or level...',
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
      }}
      sidebar={
        <CreatorSummaryPanel
          className="creature-creator-summary-fab-clear"
          title="Creature Summary"
          badge={
            creature.name
              ? { label: creature.name, className: 'bg-primary-subtle-bg text-primary-fg' }
              : undefined
          }
          resourceBoxes={[
            {
              label: 'Ability Pts',
              value: formatCreatureAbilityPointsValue(stats.abilityPoints, creature.abilities),
              variant:
                stats.abilityRemaining < 0
                  ? 'danger'
                  : stats.abilityRemaining === 0
                    ? 'success'
                    : 'info',
            },
            {
              label: 'Skill Pts',
              value: `${stats.skillRemaining}/${stats.skillPoints}`,
              variant:
                stats.skillRemaining < 0
                  ? 'danger'
                  : stats.skillRemaining === 0
                    ? 'success'
                    : 'info',
            },
            {
              label: 'Feat Pts',
              value: `${stats.featRemaining}/${stats.featPoints}`,
              variant:
                stats.featRemaining < 0
                  ? 'danger'
                  : stats.featRemaining === 0
                    ? 'success'
                    : 'warning',
            },
            {
              label: 'Training Pts',
              value: `${stats.trainingRemaining}/${stats.trainingPoints}`,
              variant:
                stats.trainingRemaining < 0
                  ? 'danger'
                  : stats.trainingRemaining === 0
                    ? 'success'
                    : 'warning',
            },
            {
              label: 'Currency',
              value: `${formatCreatureGroupedNumber(stats.currencyRemaining)}/${formatCreatureGroupedNumber(stats.currency)}`,
              variant:
                stats.currencyRemaining < 0
                  ? 'danger'
                  : stats.currencyRemaining === 0
                    ? 'success'
                    : 'warning',
            },
          ]}
          quickStats={[
            {
              label: 'Health',
              value: stats.maxHealth,
              color: 'bg-health-light text-health border border-border-light',
            },
            {
              label: 'Energy',
              value: stats.maxEnergy,
              color: 'bg-energy-light text-energy border border-border-light',
            },
            {
              label: 'SPD',
              value: stats.speed,
              color: 'bg-surface-alt border border-border-light',
            },
            {
              label: 'EVA',
              value: stats.evasion,
              color: 'bg-surface-alt border border-border-light',
            },
            {
              label: 'Damage Reduction',
              value: stats.damageReduction,
              color: 'bg-surface-alt border border-border-light',
            },
            {
              label: 'PROF',
              value: `+${stats.proficiency}`,
              color: 'bg-surface-alt border border-border-light',
            },
          ]}
          abilitiesChips={(
            ['strength', 'vitality', 'agility', 'acuity', 'intelligence', 'charisma'] as const
          ).map((k) => ({
            abbr: CREATURE_ABILITY_ABBRS[k],
            value: creature.abilities[k],
          }))}
          statRows={[
            { label: 'Archetype', value: formatListCellLabel(creature.archetypeType) },
            { label: 'Level', value: formatCreatureLevel(creature.level) },
            { label: 'Type', value: formatListCellLabel(creature.type) },
            { label: 'Size', value: creatureSizeDisplayLabel(creature.size) },
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
            { label: 'Condition Immunities', items: creature.conditionImmunities },
            { label: 'Weaknesses', items: creature.weaknesses },
            { label: 'Senses', items: creature.senses.map(creatureSenseLabel) },
            { label: 'Movement', items: creature.movementTypes.map(creatureMovementLabel) },
            { label: 'Languages', items: uniqueCreatureLanguages(creature.languages) },
            {
              label: 'Inventory Cost',
              items: [
                `${formatCreatureGroupedNumber(stats.currencySpent)}c spent / ${formatCreatureGroupedNumber(stats.currency)}c max`,
              ],
            },
          ]}
        />
      }
      extraModals={
        <>
          <UnifiedSelectionModal
            isOpen={showPowerModal}
            onClose={() => setShowPowerModal(false)}
            scopeExtra={
              <SegmentedControl
                value={powerModalTab}
                onChange={setPowerModalTab}
                aria-label="Power modal type"
                tabs
                equalWidth
                options={[
                  { value: 'powers', label: 'Powers' },
                  { value: 'empowered', label: 'Empowered Techniques' },
                ]}
              />
            }
            headerExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
            optionsSummary={sourceFilterSummary(librarySource)}
            optionsActiveCount={librarySource !== 'all' ? 1 : 0}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const powers = items.map(displayItemToCreaturePower);
              setCreature((prev) => ({ ...prev, powers: [...prev.powers, ...powers] }));
            }}
            items={
              powerModalTab === 'empowered'
                ? empoweredTechniqueSelectableItems
                : powerSelectableItems
            }
            title={powerModalTab === 'empowered' ? 'Select Empowered Techniques' : 'Select Powers'}
            maxSelections={creaturePickerMaxSelections(stats.trainingRemaining)}
            itemLabel={powerModalTab === 'empowered' ? 'empowered technique' : 'power'}
            searchPlaceholder={
              powerModalTab === 'empowered' ? 'Search empowered techniques...' : 'Search powers...'
            }
            columns={getListHeaderColumns('power')}
            gridColumns={getModalGridColumns('power')}
            size="xl"
          />
          <UnifiedSelectionModal
            isOpen={showTechniqueModal}
            onClose={() => setShowTechniqueModal(false)}
            headerExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
            optionsSummary={sourceFilterSummary(librarySource)}
            optionsActiveCount={librarySource !== 'all' ? 1 : 0}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              const techniques = items.map(displayItemToCreatureTechnique);
              setCreature((prev) => ({ ...prev, techniques: [...prev.techniques, ...techniques] }));
            }}
            items={techniqueSelectableItems}
            title="Select Techniques"
            maxSelections={creaturePickerMaxSelections(stats.trainingRemaining)}
            itemLabel="technique"
            searchPlaceholder="Search techniques..."
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'Energy', label: 'Energy', sortable: true },
              { key: 'Action', label: 'ACTION', sortable: true },
              { key: 'Weapon', label: 'Attack', sortable: true },
              { key: 'Training Pts', label: 'Training pts', sortable: true },
            ]}
            gridColumns="1.25fr 0.55fr 0.72fr 0.9fr 0.65fr"
            size="xl"
          />
          {showFeatModal ? (
            <AddCreatureFeatModal
              isOpen
              onClose={() => setShowFeatModal(false)}
              creature={creature}
              onAdd={(feats) =>
                setCreature((prev) => ({
                  ...prev,
                  feats: mergeCreatureFeatsOnAdd(prev.feats, feats, codexFeatsById),
                }))
              }
              maxSelections={creaturePickerMaxSelections(stats.featRemaining)}
            />
          ) : null}
          <UnifiedSelectionModal
            isOpen={showArmamentModal}
            onClose={() => setShowArmamentModal(false)}
            scopeExtra={
              <SegmentedControl
                value={inventoryTab}
                onChange={setInventoryTab}
                aria-label="Inventory type"
                tabs
                options={[
                  { value: 'weapon', label: 'Weapons' },
                  { value: 'armor', label: 'Armor' },
                  { value: 'shield', label: 'Shields' },
                  { value: 'equipment', label: 'Equipment' },
                ]}
              />
            }
            headerExtra={<SourceFilter value={librarySource} onChange={setLibrarySource} />}
            optionsSummary={sourceFilterSummary(librarySource)}
            optionsActiveCount={librarySource !== 'all' ? 1 : 0}
            onConfirm={(selected) => {
              const items = selected.map((s: SelectableItem) => s.data as DisplayItem);
              onAddArmaments(items.map(displayItemToCreatureArmament));
            }}
            items={armamentSelectableItems}
            key={inventoryTab}
            title="Select Inventory"
            maxSelections={creaturePickerMaxSelections(stats.currencyRemaining)}
            itemLabel={
              inventoryTab === 'armor'
                ? 'armor'
                : inventoryTab === 'equipment'
                  ? 'equipment'
                  : inventoryTab === 'shield'
                    ? 'shield'
                    : 'weapon'
            }
            searchPlaceholder={`Search ${inventoryTab === 'armor' ? 'armor' : inventoryTab}...`}
            columns={getListHeaderColumns(inventoryTab)}
            gridColumns={getModalGridColumns(inventoryTab)}
            size="xl"
            className="min-h-0"
          />
        </>
      }
    >
      <CreatureCreatorEditor
        isAdmin={isAdmin}
        creature={creature}
        creatureLevel={creatureLevel}
        creatureAbilityMin={getCreatureAbilityBounds(ws.rules).min}
        creatureAbilityMax={getCreatureAbilityBounds(ws.rules).max}
        stats={stats}
        skillPointsHelp={skillPointsHelp}
        skillAllocations={skillAllocations}
        senseDescriptions={senseDescriptions}
        movementDescriptions={movementDescriptions}
        getSenseCostLabel={getSenseCostLabel}
        getMovementCostLabel={getMovementCostLabel}
        featsSummary={featsSummary}
        powersSummary={powersSummary}
        techniquesSummary={techniquesSummary}
        armamentsSummary={armamentsSummary}
        featSort={featSort}
        onFeatSort={handleFeatSort}
        sortedFeats={sortedFeats}
        armamentSort={armamentSort}
        onArmamentSort={handleArmamentSort}
        sortedArmaments={sortedArmaments}
        updateCreature={updateCreature}
        updateAbility={updateAbility}
        addToArray={addToArray}
        removeFromArray={removeFromArray}
        onSkillAllocationsChange={handleSkillAllocationsChange}
        onDefenseChange={handleDefenseSkillsChange}
        onCreatureFeatLevelChange={handleCreatureFeatLevelChange}
        onRemoveFeat={onRemoveFeat}
        onTogglePowerInnate={onTogglePowerInnate}
        onRemovePower={onRemovePower}
        onRemoveTechnique={onRemoveTechnique}
        onRemoveArmament={onRemoveArmament}
        onOpenFeatModal={() => setShowFeatModal(true)}
        onOpenPowerModal={() => setShowPowerModal(true)}
        onOpenTechniqueModal={() => setShowTechniqueModal(true)}
        onOpenArmamentModal={(tab) => {
          if (tab) setInventoryTab(tab);
          setShowArmamentModal(true);
        }}
      />
    </CreatorPageShell>
  );
}

export default function CreatureCreatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." padding="md" />}>
      <RollProvider canRoll>
        <CreatureCreatorContent />
        <RollLog />
      </RollProvider>
    </Suspense>
  );
}
