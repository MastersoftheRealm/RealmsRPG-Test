/**
 * Technique Creator Page
 * ======================
 * Tool for creating custom martial techniques using the technique parts system.
 *
 * Features:
 * - Select technique parts from Codex API (Supabase)
 * - Configure option levels for each part
 * - Calculate energy and training point costs
 * - Save to user's library (Supabase)
 *
 * Structure (TASK-601): bootstrap gate in Content → workspace shell here →
 * state in use-technique-creator-workspace → editor islands in technique-creator-editor.
 */

'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Swords, Zap, Target } from 'lucide-react';
import {
  useTechniqueParts,
  useAdmin,
  useLoadModalLibrary,
  type TechniquePart,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import { LoadingState } from '@/components/ui';
import {
  CreatorPageShell,
  AdvancedCalculationsPanel,
  CreatorSummaryPanel,
} from '@/components/creator';
import { SourceFilter, sourceFilterSummary } from '@/components/shared/filters/source-filter';
import {
  bootstrapTechniqueCreatorFormState,
  type TechniqueCreatorFormState,
  type TechniqueLibraryRecord,
} from './technique-creator-bootstrap';
import { TechniqueCreatorEditor } from './technique-creator-editor';
import { useTechniqueCreatorWorkspace } from './use-technique-creator-workspace';

function TechniqueCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editTechniqueId = searchParams.get('edit');
  const load = useLoadModalLibrary('technique');

  const { data: techniqueParts = [], isLoading, error, refetch } = useTechniqueParts();

  const sessionKey = editTechniqueId ?? 'draft';
  // Settle when the parts query finishes (empty/error OK — shell chrome must still
  // render for chrome audits / secret-less CI). In ?edit= mode also wait for library.
  const bootstrapReady = !isLoading && (!editTechniqueId || !load.isLoading);

  // One-time render adjust per sessionKey: compute the initial form state exactly
  // once when data is ready (no hydrate effect, no recompute on later re-renders).
  const [bootstrapState, setBootstrapState] = useState<{
    key: string;
    form: TechniqueCreatorFormState;
  } | null>(null);
  if (bootstrapReady && bootstrapState?.key !== sessionKey) {
    setBootstrapState({
      key: sessionKey,
      form: bootstrapTechniqueCreatorFormState({
        editTechniqueId,
        techniqueParts,
        rawItems: load.rawItems,
      }),
    });
  }
  const initialFormState = bootstrapState?.key === sessionKey ? bootstrapState.form : null;

  if (!initialFormState) {
    return (
      <div className="min-h-screen bg-background">
        <LoadingState message="Loading technique parts..." padding="lg" />
      </div>
    );
  }

  return (
    <TechniqueCreatorWorkspace
      key={sessionKey}
      initialFormState={initialFormState}
      editTechniqueId={editTechniqueId}
      user={user}
      isAdmin={isAdmin}
      techniqueParts={techniqueParts}
      load={load}
      isLoading={isLoading}
      error={error}
      refetch={refetch}
    />
  );
}

interface TechniqueCreatorWorkspaceProps {
  initialFormState: TechniqueCreatorFormState;
  editTechniqueId: string | null;
  user: ReturnType<typeof useAuthStore.getState>['user'];
  isAdmin: boolean;
  techniqueParts: TechniquePart[];
  load: UseLoadModalLibraryReturn;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

function TechniqueCreatorWorkspace({
  initialFormState,
  editTechniqueId,
  user,
  isAdmin,
  techniqueParts,
  load,
  isLoading,
  error,
  refetch,
}: TechniqueCreatorWorkspaceProps) {
  const ws = useTechniqueCreatorWorkspace({
    initialFormState,
    editTechniqueId,
    techniqueParts,
  });

  return (
    <CreatorPageShell
      icon={<Swords className="w-8 h-8 text-energy-text" />}
      title="Technique Creator"
      description="Design custom martial techniques by combining technique parts. Each part contributes to the total energy cost and training point requirements."
      user={user}
      auth={{ returnPath: '/technique-creator', contentType: 'technique' }}
      showPublicPrivate={isAdmin}
      saveTarget={ws.save.saveTarget}
      onSaveTargetChange={ws.save.setSaveTarget}
      onSave={ws.save.handleSave}
      onLoad={load.openLoadModal}
      onReset={ws.handleReset}
      saving={ws.save.saving}
      saveDisabled={!ws.name.trim()}
      loading={{
        isLoading,
        loadingMessage: 'Loading technique parts...',
        error: error ?? null,
        onRetry: () => {
          void refetch();
        },
        errorMessage: error ? `Failed to load technique parts: ${error.message}` : undefined,
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
        searchPlaceholder: 'Search techniques...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Technique from Library',
        onSelect: (selected) =>
          ws.handleLoadTechnique(selected.data as TechniqueLibraryRecord),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Technique Summary"
          costStats={[
            { label: 'Energy Cost', value: ws.costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
            { label: 'Training Points', value: ws.costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
          ]}
          statRows={[
            { label: 'Action', value: ws.actionTypeDisplay },
            { label: 'Attack', value: ws.attackModeLabel },
            ...(ws.damageDisplay ? [{ label: 'Damage', value: ws.damageDisplay }] : []),
          ]}
          breakdowns={ws.costs.tpSources.length > 0 ? [
            { title: 'TP Breakdown', items: ws.costs.tpSources }
          ] : undefined}
        >
          <AdvancedCalculationsPanel
            rows={ws.advancedCalcRows}
            ruleText="Rule: Mechanic parts are auto-generated from action, reaction, damage, and attack mode; costs match standalone technique math."
          />
        </CreatorSummaryPanel>
      }
    >
      <TechniqueCreatorEditor
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
        combatConfigSummary={ws.combatConfigSummary}
        combatConfigCost={ws.combatConfigCost}
        attackMode={ws.attackMode}
        onAttackModeChange={ws.setAttackMode}
        weaponCost={ws.weaponCost}
        actionType={ws.actionType}
        onActionTypeChange={ws.setActionType}
        actionTypeCost={ws.actionTypeCost}
        isReaction={ws.isReaction}
        onIsReactionChange={ws.setIsReaction}
        reactionCost={ws.reactionCost}
        selectedParts={ws.selectedParts}
        techniqueParts={techniqueParts}
        techniquePartsSummary={ws.techniquePartsSummary}
        onAddPart={ws.addPart}
        onRemovePart={ws.removePart}
        onUpdatePart={ws.updatePart}
        damage={ws.damage}
        onDamageChange={ws.setDamage}
        damageSummary={ws.damageSummary}
        damageSectionCost={ws.damageSectionCost}
      />
    </CreatorPageShell>
  );
}

export default function TechniqueCreatorPage() {
  return (
    <Suspense fallback={<LoadingState message="Loading..." padding="md" />}>
      <TechniqueCreatorContent />
    </Suspense>
  );
}
