/**
 * Creature Creator Page
 * =====================
 * Tool for creating custom creatures and NPCs.
 *
 * Structure (TASK-381): workspace hook owns state/stats/modals data;
 * form section islands in creature-creator-editor; this file wires shell.
 */

'use client';

import { Suspense } from 'react';
import { UnifiedSelectionModal, SourceFilter, sourceFilterSummary, SegmentedControl, type SelectableItem } from '@/components/shared';
import { LoadingState } from '@/components/ui';
import { Skull } from 'lucide-react';
import { RollLog, RollProvider } from '@/components/character-sheet';
import { formatListCellLabel } from '@/lib/utils';
import {
  CreatorSummaryPanel,
  CreatorPageShell,
} from '@/components/creator';
import type { DisplayItem } from '@/types/items';
import type { CreatureSkill } from './creature-creator-types';
import { AddCreatureFeatModal } from './AddCreatureFeatModal';
import { CreatureCreatorEditor } from './creature-creator-editor';
import { useCreatureCreatorWorkspace } from './use-creature-creator-workspace';

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
  } = ws;

  return (
    <CreatorPageShell
      icon={<Skull className="w-8 h-8 text-primary-link-fg" />}
      title="Creature Creator"
      description="Design custom creatures, monsters, and NPCs. Configure abilities, defenses, skills, and combat options."
      user={user}
      auth={{ returnPath: '/creature-creator', contentType: 'creature' }}
      showPublicPrivate={isAdmin}
      saveTarget={save.saveTarget}
      onSaveTargetChange={save.setSaveTarget}
      onSave={handleSave}
      onLoad={load.openLoadModal}
      onReset={handleReset}
      saving={save.saving}
      saveDisabled={!creature.name.trim() || isOverBudget}
      loading={{
        isLoading: !bootstrapApplied,
        loadingMessage: 'Loading creature creator...',
      }}
      publish={{
        isOpen: save.showPublishConfirm,
        onClose: () => save.setShowPublishConfirm(false),
        onConfirm: () => save.confirmPublish(),
        title: save.publishConfirmTitle,
        description:
          save.publishConfirmDescription?.(creature.name.trim(), {
            existingInPublic: save.publishExistingInPublic,
          }) ?? '',
      }}
      resetConfirm={{
        isOpen: showResetConfirm,
        onClose: () => setShowResetConfirm(false),
        onConfirm: () => {
          setCreature(initialState);
          clearCreatorCache(CREATURE_CREATOR_CACHE_KEY);
          setShowResetConfirm(false);
        },
        title: 'Restart Creature',
        description: 'Are you sure you want to reset all creature data? This will clear all fields and cannot be undone.',
        confirmLabel: 'Reset',
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
          title="Creature Summary"
          badge={creature.name ? { label: creature.name, className: 'bg-primary-subtle-bg text-primary-fg' } : undefined}
          resourceBoxes={[
            { label: 'Ability Pts', value: `${stats.abilityRemaining}/${stats.abilityPoints}`, variant: stats.abilityRemaining < 0 ? 'danger' : stats.abilityRemaining === 0 ? 'success' : 'info' },
            { label: 'Skill Pts', value: `${stats.skillRemaining}/${stats.skillPoints}`, variant: stats.skillRemaining < 0 ? 'danger' : stats.skillRemaining === 0 ? 'success' : 'info' },
            { label: 'Feat Pts', value: `${stats.featRemaining}/${stats.featPoints}`, variant: stats.featRemaining < 0 ? 'danger' : stats.featRemaining === 0 ? 'success' : 'warning' },
            { label: 'Training Pts', value: `${stats.trainingRemaining}/${stats.trainingPoints}`, variant: stats.trainingRemaining < 0 ? 'danger' : stats.trainingRemaining === 0 ? 'success' : 'warning' },
            { label: 'Currency', value: `${stats.currencyRemaining}/${stats.currency}`, variant: stats.currencyRemaining < 0 ? 'danger' : stats.currencyRemaining === 0 ? 'success' : 'warning' },
          ]}
          quickStats={[
            { label: 'Health', value: stats.maxHealth, color: 'bg-health-light text-health border border-border-light' },
            { label: 'Energy', value: stats.maxEnergy, color: 'bg-energy-light text-energy border border-border-light' },
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
            items={powerModalTab === 'empowered' ? empoweredTechniqueSelectableItems : powerSelectableItems}
            title={powerModalTab === 'empowered' ? 'Select Empowered Techniques' : 'Select Powers'}
            maxSelections={10}
            itemLabel={powerModalTab === 'empowered' ? 'empowered technique' : 'power'}
            searchPlaceholder={powerModalTab === 'empowered' ? 'Search empowered techniques...' : 'Search powers...'}
            columns={[
              { key: 'name', label: 'Name', sortable: true },
              { key: 'Energy', label: 'Energy', sortable: true },
              { key: 'Action', label: 'Action', sortable: true },
              { key: 'Damage', label: 'Damage', sortable: true },
              { key: 'Area', label: 'Area', sortable: true },
            ]}
            gridColumns="1.15fr 0.42fr 0.62fr 0.62fr 0.55fr"
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
            maxSelections={10}
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
                  { value: 'all', label: 'All' },
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
              const armaments = items.map(displayItemToCreatureArmament);
              setCreature((prev) => ({ ...prev, armaments: [...prev.armaments, ...armaments] }));
            }}
            items={armamentSelectableItems}
            displayFilter={inventoryDisplayFilter}
            title="Select Inventory"
            maxSelections={10}
            itemLabel="inventory item"
            searchPlaceholder="Search inventory..."
            columns={[{ key: 'name', label: 'Name', sortable: true }, { key: 'Type', label: 'Type', sortable: true }, { key: 'TP', label: 'TP', sortable: true }, { key: 'Cost', label: 'Cost', sortable: true }]}
            gridColumns="1.5fr 0.6fr 0.5fr 0.6fr"
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
        stats={stats}
        skillPointsHelp={skillPointsHelp}
        skillAllocations={skillAllocations}
        abilityDefenseBonuses={abilityDefenseBonuses}
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
        onOpenArmamentModal={() => setShowArmamentModal(true)}
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
