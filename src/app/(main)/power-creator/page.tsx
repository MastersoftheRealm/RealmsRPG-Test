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
import { LoadingState } from '@/components/ui';
import {
  bootstrapPowerCreatorFormState,
  type PowerCreatorFormState,
  type PowerLibraryRecord,
} from './power-creator-bootstrap';
import { PowerCreatorEditor } from './power-creator-editor';
import { usePowerCreatorWorkspace } from './use-power-creator-workspace';
import { PowerCreatorHelp } from './power-creator-help';

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
    powerParts,
  });

  return (
    <CreatorPageShell
      icon={<Wand2 className="h-8 w-8 text-primary-link-fg" />}
      title="Power Creator"
      description="Design custom powers by combining power parts. Each part contributes to the total energy cost and training point requirements."
      user={user}
      auth={{ returnPath: '/power-creator', contentType: 'power' }}
      showPublicPrivate={isAdmin}
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
      saveDisabled={!ws.name.trim()}
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
              value: ws.costs.totalEnergy,
              icon: <Zap className="h-6 w-6" />,
              color: 'energy',
              help: <PowerCreatorHelp topic="energy" tone="current" />,
            },
            {
              label: 'Training Points',
              value: ws.costs.totalTP,
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
            { label: 'Action', value: ws.actionTypeDisplay },
            { label: 'Attack', value: ws.attackModeLabel },
            { label: 'Range', value: ws.rangeDisplay },
            { label: 'Area', value: ws.areaDisplay },
            { label: 'Duration', value: ws.durationDisplay },
            {
              label: 'Targets',
              value:
                ws.targetedDefenses.length > 0 ? ws.targetedDefenses.join(', ') : 'None specified',
            },
          ]}
          breakdowns={
            ws.costs.tpSources.length > 0
              ? [{ title: 'TP Breakdown', items: ws.costs.tpSources }]
              : undefined
          }
        >
          <AdvancedCalculationsPanel
            groups={ws.advancedCalcGroups}
            ruleText="Energy is rounded up at the end. Training Points are listed separately above when a part has them."
          />
        </CreatorSummaryPanel>
      }
    >
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
      />
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
