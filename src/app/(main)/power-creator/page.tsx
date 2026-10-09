/**
 * Power Creator Page
 * ==================
 * Tool for creating custom powers using the power parts system.
 *
 * Features:
 * - Select power parts from Codex API (Supabase)
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's library (Supabase)
 *
 * Structure (TASK-381): bootstrap gate in Content → workspace shell here →
 * state in use-power-creator-workspace → editor islands in power-creator-editor.
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wand2, Zap, Target } from 'lucide-react';
import {
  usePowerParts,
  useAdmin,
  useLoadModalLibrary,
  type PowerPart,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import { SourceFilter, sourceFilterSummary } from '@/components/patterns/filters/source-filter';
import {
  CreatorPageShell,
  AdvancedCalculationsPanel,
  CreatorSummaryPanel,
} from '@/components/creator';
import { LoadingState, TabContentPanel, useTabGroup } from '@/components/ui';
import {
  formatEnergyStat,
  formatPowerCompositionSummary,
  powerCompositionEnergyLines,
  powerCreatorSaveBlockReason,
} from '@/lib/calculators';
import { PowerCreatorCompositionBand } from './power-creator-composition-band';
import {
  emptyTabForm,
  showsFieldOverride,
  REVERSE_TAB_ID,
  SHARED_TAB_ID,
  type PowerTabForm,
} from './power-creator-composition';
import type { PowerCreatorInheritance } from './power-creator-editor-config';
import {
  actionIsOverride,
  areaIsOverride,
  attackIsOverride,
  damageIsOverride,
  durationIsOverride,
  rangeIsOverride,
  sharedActionLabel,
  sharedAreaLabel,
  sharedAttackLabel,
  sharedDamageLabel,
  sharedDurationLabel,
  sharedRangeLabel,
  type InheritedField,
} from './power-creator-from-shared';
import {
  bootstrapPowerCreatorFormState,
  type PowerCreatorFormState,
  type PowerLibraryRecord,
} from './power-creator-bootstrap';
import { PowerCreatorEditor } from './power-creator-editor';
import { usePowerCreatorWorkspace } from './use-power-creator-workspace';
import { PowerCreatorHelp } from './power-creator-help';
import {
  creatorEditReplacesDraft,
  findLoadedLibraryItem,
  resolveCreatorSaveTargetFromItem,
} from '@/lib/library/catalog-listing';

function inheritField(
  overridden: boolean,
  label: string,
  onOverride: () => void,
  onUseShared: () => void,
): InheritedField {
  return { overridden, label, onOverride, onUseShared };
}

function PowerCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editPowerId = searchParams.get('edit');
  const load = useLoadModalLibrary('power');

  const { data: powerParts = [], isLoading, error, refetch } = usePowerParts();

  const sessionKey = editPowerId ?? 'draft';
  // Settle when the parts query finishes (empty/error OK — shell chrome must still
  // render for chrome audits / offline-less CI). In ?edit= mode also wait for library.
  const bootstrapReady = !isLoading && (!editPowerId || !load.isLoading);

  // One-time render adjust per sessionKey: compute the initial form state exactly
  // once when data is ready (no hydrate effect, no recompute on later re-renders).
  const [bootstrapState, setBootstrapState] = useState<{
    key: string;
    form: PowerCreatorFormState;
  } | null>(null);
  if (bootstrapReady && bootstrapState?.key !== sessionKey) {
    setBootstrapState({
      key: sessionKey,
      form: bootstrapPowerCreatorFormState({
        editPowerId,
        powerParts,
        rawItems: load.rawItems,
      }),
    });
  }
  const initialFormState = bootstrapState?.key === sessionKey ? bootstrapState.form : null;

  if (!initialFormState) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Loading power parts..." padding="lg" />
      </div>
    );
  }

  return (
    <PowerCreatorWorkspace
      key={sessionKey}
      initialFormState={initialFormState}
      editPowerId={editPowerId}
      editReplacesDraft={creatorEditReplacesDraft(editPowerId, load.rawItems)}
      user={user}
      isAdmin={isAdmin}
      powerParts={powerParts}
      load={load}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}

interface PowerCreatorWorkspaceProps {
  initialFormState: PowerCreatorFormState;
  editPowerId: string | null;
  editReplacesDraft: boolean;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAdmin: boolean;
  powerParts: PowerPart[];
  load: UseLoadModalLibraryReturn;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function PowerCreatorWorkspace({
  initialFormState,
  editPowerId,
  editReplacesDraft,
  user,
  isAdmin,
  powerParts,
  load,
  isLoading,
  error,
  refetch,
}: PowerCreatorWorkspaceProps) {
  const ws = usePowerCreatorWorkspace({
    initialFormState,
    editPowerId,
    editReplacesDraft,
    powerParts,
    initialSaveTarget: resolveCreatorSaveTargetFromItem(
      findLoadedLibraryItem(load.rawItems, editPowerId),
    ),
  });

  const variantTabGroup = useTabGroup('power-variants');
  const composed = ws.composedSummary;
  const tabDisplay = composed?.tabDisplay ?? null;
  const randomizeSharedUnpriced =
    ws.variants.structure === 'randomize' && ws.variants.activeTabId === SHARED_TAB_ID;
  const showVariantTabs = ws.variants.structure !== 'none' || ws.variants.reverseEnabled;
  const onRandomizeFace =
    ws.variants.structure === 'randomize' &&
    ws.variants.activeTabId !== SHARED_TAB_ID &&
    ws.variants.activeTabId !== REVERSE_TAB_ID;
  const onOverlayTab =
    ws.variants.activeTabId === REVERSE_TAB_ID ||
    (ws.variants.activeTabId !== SHARED_TAB_ID &&
      ws.variants.structure !== 'alternate' &&
      ws.variants.structure !== 'randomize' &&
      ws.variants.structure !== 'none');

  const shared = ws.variants.collected.shared;
  const live: PowerTabForm = {
    ...emptyTabForm(),
    actionType: ws.actionType,
    isReaction: ws.isReaction,
    attackMode: ws.attackMode,
    range: ws.range,
    area: ws.area,
    duration: ws.duration,
    damages: ws.damages,
    selectedParts: ws.selectedParts,
    selectedAdvancedParts: ws.selectedAdvancedParts,
  };
  const overlayTabId = ws.variants.activeTabId;
  const actionLocked =
    onRandomizeFace ||
    (onOverlayTab &&
      (overlayTabId === REVERSE_TAB_ID ||
        ws.variants.structure === 'modify' ||
        ws.variants.structure === 'choice'));
  const inheritance: PowerCreatorInheritance | null = onRandomizeFace
    ? {
        action: {
          label: sharedActionLabel(shared),
          overridden: false,
          locked: true,
          onOverride: () => {},
          onUseShared: () => {},
        },
      }
    : onOverlayTab
      ? {
          action: {
            ...inheritField(
              showsFieldOverride(
                actionIsOverride(live),
                ws.variants.isFieldForcedOverride(overlayTabId, 'action'),
              ),
              sharedActionLabel(shared),
              () => {
                ws.variants.markFieldOverridden(overlayTabId, 'action');
                ws.setActionType(shared.actionType);
                ws.setIsReaction(shared.isReaction);
              },
              () => {
                ws.variants.clearFieldOverridden(overlayTabId, 'action');
                const blank = emptyTabForm();
                ws.setActionType(blank.actionType);
                ws.setIsReaction(blank.isReaction);
              },
            ),
            ...(actionLocked ? { locked: true, overridden: false } : {}),
          },
          attack: inheritField(
            showsFieldOverride(
              attackIsOverride(live),
              ws.variants.isFieldForcedOverride(overlayTabId, 'attack'),
            ),
            sharedAttackLabel(shared),
            () => {
              ws.variants.markFieldOverridden(overlayTabId, 'attack');
              ws.setAttackMode(shared.attackMode);
            },
            () => {
              ws.variants.clearFieldOverridden(overlayTabId, 'attack');
              ws.setAttackMode(emptyTabForm().attackMode);
            },
          ),
          range: inheritField(
            showsFieldOverride(
              rangeIsOverride(live),
              ws.variants.isFieldForcedOverride(overlayTabId, 'range'),
            ),
            sharedRangeLabel(shared),
            () => {
              ws.variants.markFieldOverridden(overlayTabId, 'range');
              ws.setRange(shared.range);
            },
            () => {
              ws.variants.clearFieldOverridden(overlayTabId, 'range');
              ws.setRange(emptyTabForm().range);
            },
          ),
          area: inheritField(
            showsFieldOverride(
              areaIsOverride(live),
              ws.variants.isFieldForcedOverride(overlayTabId, 'area'),
            ),
            sharedAreaLabel(shared),
            () => {
              ws.variants.markFieldOverridden(overlayTabId, 'area');
              ws.setArea(shared.area);
            },
            () => {
              ws.variants.clearFieldOverridden(overlayTabId, 'area');
              ws.setArea(emptyTabForm().area);
            },
          ),
          duration: inheritField(
            showsFieldOverride(
              durationIsOverride(live),
              ws.variants.isFieldForcedOverride(overlayTabId, 'duration'),
            ),
            sharedDurationLabel(shared),
            () => {
              ws.variants.markFieldOverridden(overlayTabId, 'duration');
              ws.setDuration(shared.duration);
            },
            () => {
              ws.variants.clearFieldOverridden(overlayTabId, 'duration');
              ws.setDuration(emptyTabForm().duration);
            },
          ),
          damage: inheritField(
            showsFieldOverride(
              damageIsOverride(live.damages),
              ws.variants.isFieldForcedOverride(overlayTabId, 'damage'),
            ),
            sharedDamageLabel(shared),
            () => {
              ws.variants.markFieldOverridden(overlayTabId, 'damage');
              ws.setDamages(shared.damages);
            },
            () => {
              ws.variants.clearFieldOverridden(overlayTabId, 'damage');
              ws.setDamages(emptyTabForm().damages);
            },
          ),
          sharedPartNames: shared.selectedParts.map((p) => p.part.name),
          sharedMechanicNames: shared.selectedAdvancedParts.map((p) => p.part.name),
        }
      : null;

  const editor = (
    <PowerCreatorEditor
      isAdmin={isAdmin}
      name={ws.name}
      onNameChange={ws.setName}
      description={ws.description}
      onDescriptionChange={ws.setDescription}
      imageId={ws.imageId}
      imageUrl={ws.imageUrl}
      onImageChange={(selection) => {
        ws.setImageId(selection.imageId);
        ws.setImageUrl(selection.imageUrl);
      }}
      actionType={ws.actionType}
      onActionTypeChange={ws.setActionType}
      isReaction={ws.isReaction}
      onIsReactionChange={ws.setIsReaction}
      actionTypeDisplay={ws.actionTypeDisplay}
      attackMode={ws.attackMode}
      onAttackModeChange={ws.setAttackMode}
      targetedDefenses={ws.targetedDefenses}
      onTargetedDefensesChange={ws.setTargetedDefenses}
      suggestionPartsDb={ws.powerParts}
      suggestionSelectedParts={ws.suggestionSelectedParts}
      range={ws.range}
      onRangeChange={ws.setRange}
      rangeSummary={ws.rangeSummary}
      area={ws.area}
      onAreaChange={ws.setArea}
      areaPartInfo={ws.areaPartInfo}
      duration={ws.duration}
      onDurationChange={ws.setDuration}
      durationSummary={ws.durationSummary}
      selectedParts={ws.selectedParts}
      nonMechanicParts={ws.nonMechanicParts}
      powerPartsSummary={ws.powerPartsSummary}
      onAddPart={ws.addPart}
      onRemovePart={ws.removePart}
      onUpdatePart={ws.updatePart}
      selectedAdvancedParts={ws.selectedAdvancedParts}
      mechanicPartsForList={ws.mechanicPartsForList}
      powerMechanicsSummary={ws.powerMechanicsSummary}
      onAddMechanicPart={ws.addMechanicPart}
      onRemoveAdvancedPart={ws.removeAdvancedPart}
      onUpdateAdvancedPart={ws.updateAdvancedPart}
      damages={ws.damages}
      onDamagesChange={ws.setDamages}
      damageSummary={ws.damageSummary}
      sectionCosts={ws.sectionCosts}
      sectionsUnpriced={randomizeSharedUnpriced}
      hidePartsAndDamage={randomizeSharedUnpriced}
      inheritance={inheritance}
    />
  );

  return (
    <CreatorPageShell
      icon={<Wand2 className="h-8 w-8 text-primary-link-fg" />}
      title="Power Creator"
      description="Design custom powers by combining power parts. Each part contributes to the total energy cost and training point requirements."
      user={user}
      auth={{ returnPath: '/power-creator', contentType: 'power' }}
      showSaveTarget={isAdmin}
      saveTarget={ws.save.saveTarget}
      onSaveTargetChange={ws.save.setSaveTarget}
      onSave={ws.save.handleSave}
      onLoad={load.openLoadModal}
      onReset={ws.handleReset}
      toolbarHelp={{
        load: <PowerCreatorHelp topic="load" />,
        reset: <PowerCreatorHelp topic="reset" />,
      }}
      saving={ws.save.saving}
      saveDisabled={!ws.name.trim() || ws.dieIncomplete || ws.reverseIncomplete}
      saveDisabledReason={
        powerCreatorSaveBlockReason({
          composition: ws.variants.composition,
          reverseIncomplete: ws.reverseIncomplete,
        }) ?? undefined
      }
      aboveGrid={
        <PowerCreatorCompositionBand
          state={ws.variants}
          tabGroupId={variantTabGroup.tabGroupId}
          sharedPanelId={variantTabGroup.sharedPanelId}
        />
      }
      loading={{
        isLoading,
        loadingMessage: 'Loading power parts...',
        error: error ?? null,
        onRetry: () => {
          void refetch();
        },
        errorMessage: error ? `Failed to load power parts: ${error.message}` : undefined,
      }}
      publish={{
        isOpen: ws.save.showPublishConfirm,
        onClose: () => ws.save.setShowPublishConfirm(false),
        onConfirm: () => ws.save.confirmPublish(),
        title: ws.save.publishConfirmTitle,
        confirmLabel: ws.save.publishConfirmLabel,
        description:
          ws.save.publishConfirmDescription?.(ws.name.trim(), {
            existingInPublic: ws.save.publishExistingInPublic,
          }) ?? '',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        optionsSummary: sourceFilterSummary(load.source),
        optionsActiveCount: load.source !== 'all' ? 1 : 0,
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
        searchPlaceholder: 'Search powers...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Power from Library',
        onSelect: (selected) => ws.handleLoadPower(selected.data as PowerLibraryRecord),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Power Summary"
          costStats={[
            {
              label: 'Energy Cost',
              value: formatEnergyStat(composed ? composed.res.energy : ws.costs.totalEnergy),
              icon: <Zap className="h-6 w-6" />,
              color: 'energy',
              help: <PowerCreatorHelp topic="energy" tone="current" />,
            },
            {
              label: 'Training Points',
              value: composed ? composed.res.tp : ws.costs.totalTP,
              icon: <Target className="h-6 w-6" />,
              color: 'tp',
              help: <PowerCreatorHelp topic="tp" tone="current" />,
            },
          ]}
          costHelp={
            <div className="flex items-center gap-1.5 text-sm text-text-secondary">
              <span>Innate Power</span>
              <PowerCreatorHelp topic="innate" />
            </div>
          }
          statRows={[
            ...(composed
              ? [{ label: 'Structure', value: formatPowerCompositionSummary(composed.res) }]
              : []),
            { label: 'Action', value: tabDisplay?.actionType ?? ws.actionTypeDisplay },
            { label: 'Attack', value: ws.attackModeLabel },
            { label: 'Range', value: tabDisplay?.range ?? ws.rangeDisplay },
            { label: 'Area', value: tabDisplay?.area ?? ws.areaDisplay },
            { label: 'Duration', value: tabDisplay?.duration ?? ws.durationDisplay },
            {
              label: 'Targets',
              value:
                ws.targetedDefenses.length > 0 ? ws.targetedDefenses.join(', ') : 'None specified',
            },
          ]}
          breakdowns={[
            ...(composed
              ? [{ title: 'Variant Energy', items: powerCompositionEnergyLines(composed.res) }]
              : []),
            ...((composed ? composed.res.tpSources : ws.costs.tpSources).length > 0
              ? [
                  {
                    title: 'TP Breakdown',
                    items: composed ? composed.res.tpSources : ws.costs.tpSources,
                  },
                ]
              : []),
          ]}
        >
          <AdvancedCalculationsPanel
            groups={
              randomizeSharedUnpriced
                ? [{ title: 'Energy', rows: [{ label: 'Shared tab', value: 'Not priced' }] }]
                : ws.advancedCalcGroups
            }
            ruleText={
              randomizeSharedUnpriced
                ? 'Shared holds the action type plus range, area, and duration defaults. Those defaults pre-fill a new face and add no energy. Parts and damage are added on each face. Changing Shared later does not change a face that already exists.'
                : 'Energy is rounded up at the end. Training Points are listed separately above when a part has them.'
            }
          />
        </CreatorSummaryPanel>
      }
    >
      {showVariantTabs ? (
        <TabContentPanel
          tabGroupId={variantTabGroup.tabGroupId}
          activeTab={ws.variants.activeTabId}
          id={variantTabGroup.sharedPanelId}
          className="space-y-6"
        >
          {editor}
        </TabContentPanel>
      ) : (
        editor
      )}
    </CreatorPageShell>
  );
}

export default function PowerCreatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." padding="md" />}>
      <PowerCreatorContent />
    </Suspense>
  );
}
