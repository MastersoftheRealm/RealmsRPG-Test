/**
 * Empowered Technique Creator
 * ===========================
 * Combines power + technique authoring into one creator flow.
 *
 * Structure (TASK-601): bootstrap gate in Content → workspace shell here →
 * state in use-empowered-technique-creator-workspace → editor islands.
 */

'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wand2, Zap, Target } from 'lucide-react';
import {
  usePowerParts,
  useTechniqueParts,
  useAdmin,
  useLoadModalLibrary,
  type PowerPart,
  type TechniquePart,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import {
  CreatorPageShell,
  CreatorSummaryPanel,
  AdvancedCalculationsPanel,
} from '@/components/creator';
import { LoadingState } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { SourceFilter, sourceFilterSummary } from '@/components/shared/filters/source-filter';
import { EmpoweredTechniqueCreatorEditor } from './empowered-technique-creator-editor';
import {
  bootstrapEmpoweredTechniqueFormState,
  type EmpoweredTechniqueFormState,
} from './empowered-technique-bootstrap';
import { useEmpoweredTechniqueCreatorWorkspace } from './use-empowered-technique-creator-workspace';

function EmpoweredTechniqueCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const load = useLoadModalLibrary('empowered-technique');

  const { data: powerParts = [], isLoading: powerPartsLoading, error: powerPartsError, refetch: refetchPowerParts } = usePowerParts();
  const { data: techniqueParts = [], isLoading: techniquePartsLoading, error: techniquePartsError, refetch: refetchTechniqueParts } = useTechniqueParts();

  const sessionKey = editId ?? 'draft';
  // Ready once both part databases exist; in ?edit= mode also wait for the
  // library fetch to settle (rawItems may legitimately stay empty — fall back to blank form).
  const bootstrapReady =
    powerParts.length > 0 &&
    techniqueParts.length > 0 &&
    (!editId || !load.isLoading);

  // One-time render adjust per sessionKey: compute the initial form state exactly
  // once when data is ready (no hydrate effect, no recompute on later re-renders).
  const [bootstrapState, setBootstrapState] = useState<{
    key: string;
    form: EmpoweredTechniqueFormState;
  } | null>(null);
  if (bootstrapReady && bootstrapState?.key !== sessionKey) {
    setBootstrapState({
      key: sessionKey,
      form: bootstrapEmpoweredTechniqueFormState({
        editId,
        powerParts,
        techniqueParts,
        rawItems: load.rawItems,
      }),
    });
  }
  const initialFormState = bootstrapState?.key === sessionKey ? bootstrapState.form : null;

  const partsError = powerPartsError ?? techniquePartsError ?? null;
  if (partsError) {
    return (
      <div className="min-h-screen bg-background">
        <ErrorDisplay
          message={`Failed to load empowered technique creator: ${partsError.message}`}
          onRetry={() => {
            void refetchPowerParts();
            void refetchTechniqueParts();
          }}
        />
      </div>
    );
  }

  if (!initialFormState) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Loading empowered technique creator..." padding="lg" />
      </div>
    );
  }

  return (
    <EmpoweredTechniqueWorkspace
      key={sessionKey}
      initialFormState={initialFormState}
      editId={editId}
      user={user}
      isAdmin={isAdmin}
      powerParts={powerParts}
      techniqueParts={techniqueParts}
      load={load}
      powerPartsLoading={powerPartsLoading}
      techniquePartsLoading={techniquePartsLoading}
      powerPartsError={powerPartsError ?? null}
      techniquePartsError={techniquePartsError ?? null}
      refetchPowerParts={refetchPowerParts}
      refetchTechniqueParts={refetchTechniqueParts}
    />
  );
}

interface EmpoweredTechniqueWorkspaceProps {
  initialFormState: EmpoweredTechniqueFormState;
  editId: string | null;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAdmin: boolean;
  powerParts: PowerPart[];
  techniqueParts: TechniquePart[];
  load: UseLoadModalLibraryReturn;
  powerPartsLoading: boolean;
  techniquePartsLoading: boolean;
  powerPartsError: Error | null;
  techniquePartsError: Error | null;
  refetchPowerParts: () => void;
  refetchTechniqueParts: () => void;
}

function EmpoweredTechniqueWorkspace({
  initialFormState,
  editId,
  user,
  isAdmin,
  powerParts,
  techniqueParts,
  load,
  powerPartsLoading,
  techniquePartsLoading,
  powerPartsError,
  techniquePartsError,
  refetchPowerParts,
  refetchTechniqueParts,
}: EmpoweredTechniqueWorkspaceProps) {
  const ws = useEmpoweredTechniqueCreatorWorkspace({
    initialFormState,
    editId,
    powerParts,
    techniqueParts,
    powerPartsError,
    techniquePartsError,
  });

  return (
    <CreatorPageShell
      icon={<Wand2 className="w-8 h-8 text-primary-link-fg" />}
      title="Empowered Technique Creator"
      description="Build an empowered technique by combining power and technique parts in one shared action profile."
      user={user}
      auth={{ returnPath: '/empowered-technique-creator', contentType: 'empowered technique' }}
      showPublicPrivate={isAdmin}
      saveTarget={ws.save.saveTarget}
      onSaveTargetChange={ws.save.setSaveTarget}
      onSave={ws.save.handleSave}
      onLoad={load.openLoadModal}
      onReset={ws.resetState}
      saving={ws.save.saving}
      saveDisabled={!ws.name.trim()}
      loading={{
        isLoading: powerPartsLoading || techniquePartsLoading,
        loadingMessage: 'Loading empowered technique creator...',
        error: ws.loadError,
        onRetry: () => {
          void refetchPowerParts();
          void refetchTechniqueParts();
        },
        errorMessage: ws.loadError?.message,
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
        searchPlaceholder: 'Search empowered techniques...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Empowered Technique',
        onSelect: (selected) => ws.handleLoadEmpoweredTechnique(selected.data),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Empowered Technique Summary"
          costStats={[
            { label: 'Energy Cost', value: ws.costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
            { label: 'Training Points', value: ws.costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
          ]}
          statRows={[
            { label: 'Action', value: ws.actionDisplay },
            { label: 'Attack', value: ws.attackModeLabel },
            { label: 'Range', value: ws.rangeDisplay },
            { label: 'Area', value: ws.areaDisplay },
            { label: 'Duration', value: ws.durationDisplay },
          ]}
          breakdowns={ws.costs.tpSources.length > 0 ? [{ title: 'TP Breakdown', items: ws.costs.tpSources }] : undefined}
        >
          <AdvancedCalculationsPanel
            rows={ws.advancedCalcRows}
            ruleText="Rule: Technique percentage parts multiply the power side before adding technique energy; TP is the sum of both sides."
          />
        </CreatorSummaryPanel>
      }
    >
      <EmpoweredTechniqueCreatorEditor
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
        actionDisplay={ws.actionDisplay}
        actionType={ws.actionType}
        onActionTypeChange={ws.setActionType}
        isReaction={ws.isReaction}
        onIsReactionChange={ws.setIsReaction}
        attackMode={ws.attackMode}
        onAttackModeChange={ws.setAttackMode}
        rangeDisplay={ws.rangeDisplay}
        range={ws.range}
        onRangeStepsChange={(steps) => ws.setRange({ steps })}
        area={ws.area}
        onAreaChange={ws.setArea}
        duration={ws.duration}
        onDurationChange={ws.setDuration}
        onDurationTypeChange={ws.handleDurationTypeChange}
        powerDamages={ws.powerDamages}
        onPowerDamagesChange={ws.setPowerDamages}
        powerDamageSummary={ws.powerDamageSummary}
        selectedPowerParts={ws.selectedPowerParts}
        nonMechanicPowerParts={ws.nonMechanicPowerParts}
        onAddPowerPart={ws.addPowerPart}
        onRemovePowerPart={(index) =>
          ws.setSelectedPowerParts((previous) => previous.filter((_, rowIndex) => rowIndex !== index))
        }
        onUpdatePowerPart={ws.updatePowerPart}
        selectedPowerAdvancedParts={ws.selectedPowerAdvancedParts}
        powerMechanicsForList={ws.powerMechanicsForList}
        onAddPowerMechanicPart={ws.addPowerMechanicPart}
        onRemovePowerAdvancedPart={(index) =>
          ws.setSelectedPowerAdvancedParts((previous) =>
            previous.filter((_, rowIndex) => rowIndex !== index),
          )
        }
        onUpdatePowerAdvancedPart={ws.updatePowerAdvancedPart}
        selectedTechniqueParts={ws.selectedTechniqueParts}
        nonMechanicTechniqueParts={ws.nonMechanicTechniqueParts}
        onAddTechniquePart={ws.addTechniquePart}
        onRemoveTechniquePart={(index) =>
          ws.setSelectedTechniqueParts((previous) =>
            previous.filter((_, rowIndex) => rowIndex !== index),
          )
        }
        onUpdateTechniquePart={ws.updateTechniquePart}
        techniqueDamage={ws.techniqueDamage}
        onTechniqueDamageChange={ws.setTechniqueDamage}
        techniqueDamageSummary={ws.techniqueDamageSummary}
        sectionCosts={ws.sectionCosts}
      />
    </CreatorPageShell>
  );
}

export default function EmpoweredTechniqueCreatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." padding="md" />}>
      <EmpoweredTechniqueCreatorContent />
    </Suspense>
  );
}
