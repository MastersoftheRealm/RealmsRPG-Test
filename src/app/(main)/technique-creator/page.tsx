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
 */

'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Swords, Zap, Target } from 'lucide-react';
import {
  useTechniqueParts,
  useAdmin,
  useCreatorSave,
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
import { SourceFilter } from '@/components/shared/filters/source-filter';
import { ErrorDisplay } from '@/components/shared';
import {
  calculateTechniqueCosts,
  computeTechniqueActionTypeFromSelection,
  buildMechanicParts,
  formatTechniqueDamage,
  type TechniquePartPayload,
} from '@/lib/calculators';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import { TechniqueCreatorEditor } from './technique-creator-editor';

// =============================================================================
// Types
// =============================================================================

import {
  bootstrapTechniqueCreatorFormState,
  techniqueLibraryRecordToFormState,
  TECHNIQUE_CREATOR_CACHE_KEY,
  type TechniqueCreatorCache,
  type TechniqueCreatorFormState,
  type TechniqueSelectedPart as SelectedPart,
  type TechniqueDamageConfig as DamageConfig,
} from './technique-creator-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';

function toTechniquePartPayload(part: {
  id: string | number;
  name: string;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
}): TechniquePartPayload {
  return {
    id: Number(part.id),
    name: part.name,
    op_1_lvl: part.op_1_lvl,
    op_2_lvl: part.op_2_lvl,
    op_3_lvl: part.op_3_lvl,
  };
}

// =============================================================================
// Main Component
// =============================================================================

function TechniqueCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editTechniqueId = searchParams.get('edit');
  const load = useLoadModalLibrary('technique');

  const { data: techniqueParts = [], isLoading, error, refetch } = useTechniqueParts();

  const sessionKey = editTechniqueId ?? 'draft';
  // Ready once parts exist; in ?edit= mode also wait for the library fetch to
  // settle (rawItems may legitimately stay empty — fall back to blank form).
  const bootstrapReady =
    techniqueParts.length > 0 &&
    (!editTechniqueId || !load.isLoading);

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ErrorDisplay
          message={`Failed to load technique parts: ${error.message}`}
          onRetry={() => {
            void refetch();
          }}
        />
      </div>
    );
  }

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
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(initialFormState.selectedParts);
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [damage, setDamage] = useState<DamageConfig>(initialFormState.damage);
  const [attackMode, setAttackMode] = useState<AttackMode>(initialFormState.attackMode);
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editTechniqueId) clearCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY);
  }, [editTechniqueId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editTechniqueId) return;

    const cache: TechniqueCreatorCache = {
      name,
      description,
      selectedParts: selectedParts.map(sp => ({
        partId: sp.part.id,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        selectedCategory: sp.selectedCategory,
      })),
      actionType,
      isReaction,
      damage,
      attackMode,
      imageId,
      imageUrl,
      timestamp: Date.now(),
    };
    writeCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY, cache);
  }, [editTechniqueId, name, description, selectedParts, actionType, isReaction, damage, attackMode, imageId, imageUrl]);

  // Build mechanic parts from action type, damage, and attack mode.
  const mechanicParts = useMemo(
    () => buildMechanicParts({
      creatorType: 'technique',
      partsDb: techniqueParts,
      action: { type: actionType, isReaction },
      techniqueDamage: { diceAmount: damage.amount, dieSize: damage.size },
      attackMode,
    }),
    [actionType, isReaction, damage.amount, damage.size, attackMode, techniqueParts]
  );

  // Convert selected parts to payload format for calculator
  const partsPayload: TechniquePartPayload[] = useMemo(
    () => [
      ...selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        part: sp.part,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
      })),
      ...mechanicParts.map(toTechniquePartPayload),
    ],
    [selectedParts, mechanicParts]
  );

  // Calculate costs - using technique parts as the database
  const costs = useMemo(
    () => calculateTechniqueCosts(partsPayload, techniqueParts),
    [partsPayload, techniqueParts]
  );
  const advancedCalcRows = useMemo(
    () => [
      { label: 'Energy (raw)', value: costs.energyRaw.toFixed(2) },
      { label: 'Energy (final)', value: `ceil(${costs.energyRaw.toFixed(2)}) = ${costs.totalEnergy}` },
      { label: 'Training points (final)', value: String(costs.totalTP) },
    ],
    [costs.energyRaw, costs.totalEnergy, costs.totalTP]
  );

  // Derived display values
  const actionTypeDisplay = useMemo(
    () => computeTechniqueActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction]
  );

  const damageDisplay = useMemo(
    () => formatTechniqueDamage(damage.amount > 0 ? damage : undefined),
    [damage]
  );

  // Collapsed summaries for collapsible sections
  const attackModeLabel = useMemo(() => attackModeColumnLabel(attackMode), [attackMode]);
  const combatConfigSummary = useMemo(
    () => `${attackModeLabel} • ${actionTypeDisplay}`,
    [attackModeLabel, actionTypeDisplay]
  );
  const techniquePartsSummary = useMemo(() => {
    if (selectedParts.length === 0) return 'No parts';
    const names = selectedParts.slice(0, 5).map((sp) => sp.part.name);
    const more = selectedParts.length > 5 ? ` +${selectedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedParts]);
  const damageSummary = useMemo(
    () => (damage.amount > 0 ? `+${damage.amount}d${damage.size}` : 'None'),
    [damage.amount, damage.size]
  );

  // Section cost for Additional Damage
  const damageSectionCost = useMemo(() => {
    const damageParts = mechanicParts.filter(
      (mp) => mp.name === 'Additional Damage' || mp.name === 'Split Damage Dice'
    );
    return calculateTechniqueCosts(damageParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  // Section cost for Combat Configuration (weapon + action type + reaction)
  const combatConfigCost = useMemo(() => {
    const combatParts = mechanicParts.filter(
      (mp) => mp.name !== 'Additional Damage' && mp.name !== 'Split Damage Dice'
    );
    return calculateTechniqueCosts(combatParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const weaponCost = useMemo(() => {
    const weaponParts = mechanicParts.filter(
      (mp) => mp.name === 'Add Weapon to Technique' || mp.name === 'Add Weapon Attack' || mp.name === 'No Attack'
    );
    return calculateTechniqueCosts(weaponParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const actionTypeCost = useMemo(() => {
    const actionParts = mechanicParts.filter(
      (mp) => mp.name === 'Quick or Free Action' || mp.name === 'Long Action'
    );
    return calculateTechniqueCosts(actionParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  const reactionCost = useMemo(() => {
    const reactionParts = mechanicParts.filter((mp) => mp.name === 'Reaction');
    return calculateTechniqueCosts(reactionParts.map(toTechniquePartPayload), techniqueParts);
  }, [mechanicParts, techniqueParts]);

  // Actions
  const addPart = useCallback(() => {
    // Seed from the first selectable (non-mechanic) part; mechanic parts are
    // auto-generated from action/damage/weapon and must not appear as editable rows.
    const firstSelectable = techniqueParts.find((p) => !p.mechanic);
    if (!firstSelectable) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: firstSelectable,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        selectedCategory: firstSelectable.category || 'any',
      },
    ]);
  }, [techniqueParts]);

  const removePart = useCallback((index: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePart = useCallback((index: number, updates: Partial<SelectedPart>) => {
    setSelectedParts((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp))
    );
  }, []);

  const getPayload = useCallback(() => {
    const partsToSave = [
      ...selectedParts.map((sp) => ({
        id: Number(sp.part.id),
        name: sp.part.name,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
      })),
      ...mechanicParts.map((mp) => ({
        id: mp.id,
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
      })),
    ];
    const damageToSave = damage.amount > 0 ? [{ amount: damage.amount, size: damage.size }] : [];
    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        attackMode,
        actionType,
        isReaction,
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
    };
  }, [name, description, selectedParts, mechanicParts, damage, attackMode, actionType, isReaction, imageId, imageUrl]);

  const save = useCreatorSave({
    type: 'techniques',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (technique)? The existing public technique with this name will be replaced.`
        : `Are you sure you wish to publish this technique "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Technique saved successfully!',
    publicSuccessMessage: 'Technique saved to Realms Library!',
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedParts([]);
      setActionType('basic');
      setIsReaction(false);
      setDamage({ amount: 0, size: 6, type: 'none' });
      setAttackMode('unarmed');
      setImageId(null);
      setImageUrl(null);
    },
  });

  const handleReset = useCallback(() => {
    setName('');
    setDescription('');
    setSelectedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamage({ amount: 0, size: 6, type: 'none' });
    setAttackMode('unarmed');
    setImageId(null);
    setImageUrl(null);
    save.setSaveMessage(null);
    clearCreatorCache(TECHNIQUE_CREATOR_CACHE_KEY);
  }, [save]);

  const applyFormState = useCallback((next: TechniqueCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setSelectedParts(next.selectedParts);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setDamage(next.damage);
    setAttackMode(next.attackMode);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
  }, []);

  // Load a technique from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadTechnique = useCallback((technique: any) => {
    applyFormState(
      techniqueLibraryRecordToFormState(
        technique,
        techniqueParts,
      ),
    );
    save.setSaveMessage({ type: 'success', text: 'Technique loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [techniqueParts, applyFormState, save]);

  return (
    <CreatorPageShell
      icon={<Swords className="w-8 h-8 text-energy-text" />}
      title="Technique Creator"
      description="Design custom martial techniques by combining technique parts. Each part contributes to the total energy cost and training point requirements."
      user={user}
      auth={{ returnPath: '/technique-creator', contentType: 'technique' }}
      showPublicPrivate={isAdmin}
      saveTarget={save.saveTarget}
      onSaveTargetChange={save.setSaveTarget}
      onSave={save.handleSave}
      onLoad={load.openLoadModal}
      onReset={handleReset}
      saving={save.saving}
      saveDisabled={!name.trim()}
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
        isOpen: save.showPublishConfirm,
        onClose: () => save.setShowPublishConfirm(false),
        onConfirm: () => save.confirmPublish(),
        title: save.publishConfirmTitle,
        description:
          save.publishConfirmDescription?.(name.trim(), {
            existingInPublic: save.publishExistingInPublic,
          }) ?? '',
      }}
      loadModal={{
        isOpen: load.showLoadModal,
        onClose: load.closeLoadModal,
        selectableItems: load.selectableItems,
        columns: load.columns,
        gridColumns: load.gridColumns,
        headerExtra: <SourceFilter value={load.source} onChange={load.setSource} />,
        emptyMessage: load.emptyMessage,
        emptySubMessage: load.emptySubMessage,
        searchPlaceholder: 'Search techniques...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Technique from Library',
        onSelect: (selected) => handleLoadTechnique(selected.data),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Technique Summary"
          costStats={[
            { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
            { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
          ]}
          statRows={[
            { label: 'Action', value: actionTypeDisplay },
            { label: 'Attack', value: attackModeLabel },
            ...(damageDisplay ? [{ label: 'Damage', value: damageDisplay }] : []),
          ]}
          breakdowns={costs.tpSources.length > 0 ? [
            { title: 'TP Breakdown', items: costs.tpSources }
          ] : undefined}
        >
          <AdvancedCalculationsPanel
            rows={advancedCalcRows}
            ruleText="Rule: Mechanic parts are auto-generated from action, reaction, damage, and attack mode; costs match standalone technique math."
          />
        </CreatorSummaryPanel>
      }
    >
      <TechniqueCreatorEditor
        isAdmin={isAdmin}
        name={name}
        onNameChange={setName}
        description={description}
        onDescriptionChange={setDescription}
        imageId={imageId}
        imageUrl={imageUrl}
        onImageChange={(selection) => {
          setImageId(selection.imageId);
          setImageUrl(selection.imageUrl);
        }}
        combatConfigSummary={combatConfigSummary}
        combatConfigCost={combatConfigCost}
        attackMode={attackMode}
        onAttackModeChange={setAttackMode}
        weaponCost={weaponCost}
        actionType={actionType}
        onActionTypeChange={setActionType}
        actionTypeCost={actionTypeCost}
        isReaction={isReaction}
        onIsReactionChange={setIsReaction}
        reactionCost={reactionCost}
        selectedParts={selectedParts}
        techniqueParts={techniqueParts}
        techniquePartsSummary={techniquePartsSummary}
        onAddPart={addPart}
        onRemovePart={removePart}
        onUpdatePart={updatePart}
        damage={damage}
        onDamageChange={setDamage}
        damageSummary={damageSummary}
        damageSectionCost={damageSectionCost}
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
