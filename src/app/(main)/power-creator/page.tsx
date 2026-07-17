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
 */

'use client';

import { useState, useMemo, useCallback, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wand2, Zap, Target } from 'lucide-react';
import {
  usePowerParts,
  useAdmin,
  useCreatorSave,
  useLoadModalLibrary,
  type PowerPart,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import { SourceFilter } from '@/components/shared/filters/source-filter';
import { ErrorDisplay } from '@/components/shared';
import {
  CreatorPageShell,
  AdvancedCalculationsPanel,
  CreatorSummaryPanel,
} from '@/components/creator';
import { LoadingState } from '@/components/ui';
import {
  calculatePowerCosts,
  computePowerActionTypeFromSelection,
  buildMechanicParts,
  deriveRange,
  deriveArea,
  deriveDuration,
  formatPowerRangeFromSteps,
  getAreaPartForDisplay,
  type PowerPartPayload,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import { PART_IDS, findByIdOrName } from '@/lib/id-constants';
import { formatDurationFromTypeAndValue } from '@/lib/utils/duration';
import type {
  SelectedPart,
  AdvancedPart,
  DamageConfig,
  RangeConfig,
} from './power-creator-types';
import { POWER_CREATOR_CACHE_KEY, EXCLUDED_PARTS } from './power-creator-constants';
import {
  bootstrapPowerCreatorFormState,
  powerLibraryRecordToFormState,
  type PowerCreatorCache,
  type PowerCreatorFormState,
} from './power-creator-bootstrap';
import { PowerCreatorEditor } from './power-creator-editor';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';

// =============================================================================
// Main Component
// =============================================================================

function PowerCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editPowerId = searchParams.get('edit');
  const load = useLoadModalLibrary('power');

  const { data: powerParts = [], isLoading, error, refetch } = usePowerParts();

  const sessionKey = editPowerId ?? 'draft';
  // Ready once parts exist; in ?edit= mode also wait for the library fetch to
  // settle (rawItems may legitimately stay empty — fall back to blank form).
  const bootstrapReady =
    powerParts.length > 0 &&
    (!editPowerId || !load.isLoading);

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

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <ErrorDisplay
          message={`Failed to load power parts: ${error.message}`}
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
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [selectedParts, setSelectedParts] = useState<SelectedPart[]>(initialFormState.selectedParts);
  const [selectedAdvancedParts, setSelectedAdvancedParts] = useState<AdvancedPart[]>(
    initialFormState.selectedAdvancedParts,
  );
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [damages, setDamages] = useState<DamageConfig[]>(initialFormState.damages);
  const [range, setRange] = useState<RangeConfig>(initialFormState.range);
  const [area, setArea] = useState<AreaConfig>(initialFormState.area);
  const [duration, setDuration] = useState<DurationConfig>(initialFormState.duration);
  const [attackMode, setAttackMode] = useState<AttackMode>(initialFormState.attackMode);
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editPowerId) clearCreatorCache(POWER_CREATOR_CACHE_KEY);
  }, [editPowerId]);

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editPowerId) return;

    const cache: PowerCreatorCache = {
      name,
      description,
      selectedParts: selectedParts.map((sp) => ({
        partId: sp.part.id,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
        selectedCategory: sp.selectedCategory,
      })),
      selectedAdvancedParts: selectedAdvancedParts.map((ap) => ({
        partId: ap.part.id,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
      })),
      actionType,
      isReaction,
      damage: damages,
      range,
      area,
      duration,
      attackMode,
      imageId,
      imageUrl,
      timestamp: Date.now(),
    };
    writeCreatorCache(POWER_CREATOR_CACHE_KEY, cache);
  }, [
    editPowerId,
    name,
    description,
    selectedParts,
    selectedAdvancedParts,
    actionType,
    isReaction,
    damages,
    range,
    area,
    duration,
    attackMode,
    imageId,
    imageUrl,
  ]);

  // Filter out mechanic parts for the "Add Part" dropdown
  // Mechanic parts are handled by basic mechanics UI (action, damage, range, area, duration)
  // or the Power Mechanics section
  const nonMechanicParts = useMemo(
    () => powerParts.filter((p: PowerPart) => !p.mechanic),
    [powerParts]
  );

  // Mechanic parts for Power Mechanics section (same parts as old Advanced Mechanics, excluded from hardcoded UI)
  const mechanicPartsForList = useMemo(
    () => powerParts.filter((p: PowerPart) => p.mechanic && !EXCLUDED_PARTS.has(p.name)),
    [powerParts]
  );

  // Build mechanic parts using unified builder (powerDamage array supports applyDuration per row)
  const mechanicParts = useMemo(
    () => buildMechanicParts({
      creatorType: 'power',
      partsDb: powerParts,
      action: { type: actionType, isReaction },
      powerDamage: damages.map((d) => ({
        type: d.type,
        diceAmount: d.amount,
        dieSize: d.size,
        applyDuration: d.applyDuration ?? false,
      })),
      range: { steps: range.steps },
      area: area.type !== 'none' ? { type: area.type, level: area.level, applyDuration: area.applyDuration ?? false } : undefined,
      duration: duration.type !== 'instant' ? {
        type: duration.type,
        value: duration.value,
        applyDuration: duration.applyDuration ?? false,
        focus: duration.focus,
        noHarm: duration.noHarm,
        endsOnActivation: duration.endsOnActivation,
        sustain: duration.sustain,
      } : undefined,
    }),
    [actionType, isReaction, damages, range, area, duration, powerParts]
  );

  // Weapon Attack adds a flat-cost "Add Weapon to Power" part (no options, no
  // weapon id). No Weapon/Attack (default) and Unarmed add nothing on powers.
  const addWeaponToPowerPart = useMemo(() => {
    if (attackMode !== 'weapon') return null;
    const part = findByIdOrName(powerParts, {
      id: PART_IDS.ADD_WEAPON_TO_POWER,
      name: 'Add Weapon to Power',
    });
    if (!part) return null;
    return {
      id: part.id,
      name: part.name,
      op_1_lvl: 0,
      op_2_lvl: 0,
      op_3_lvl: 0,
      applyDuration: false,
    };
  }, [attackMode, powerParts]);

  const attackModeLabel = useMemo(() => attackModeColumnLabel(attackMode), [attackMode]);

  // Convert selected parts to payload format for calculator
  const partsPayload: PowerPartPayload[] = useMemo(
    () => [
      // Regular parts
      ...selectedParts.map((sp) => ({
        part: sp.part,
        op_1_lvl: sp.op_1_lvl,
        op_2_lvl: sp.op_2_lvl,
        op_3_lvl: sp.op_3_lvl,
        applyDuration: sp.applyDuration,
      })),
      // Advanced mechanic parts
      ...selectedAdvancedParts.map((ap) => ({
        part: ap.part,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
      })),
      // Auto-generated mechanic parts from action type / damage selections
      ...mechanicParts,
      ...(addWeaponToPowerPart ? [addWeaponToPowerPart] : []),
    ],
    [selectedParts, selectedAdvancedParts, mechanicParts, addWeaponToPowerPart]
  );

  // Calculate costs
  const costs = useMemo(
    () => calculatePowerCosts(partsPayload, powerParts),
    [partsPayload, powerParts]
  );
  const advancedCalcRows = useMemo(
    () => [
      { label: 'Energy (raw)', value: costs.energyRaw.toFixed(2) },
      { label: 'Energy (final)', value: `ceil(${costs.energyRaw.toFixed(2)}) = ${costs.totalEnergy}` },
      { label: 'Training points (raw)', value: costs.tpRaw.toFixed(2) },
      { label: 'Training points (final)', value: `floor per part → ${costs.totalTP}` },
    ],
    [costs.energyRaw, costs.totalEnergy, costs.totalTP, costs.tpRaw]
  );

  // Derived display values
  const actionTypeDisplay = useMemo(
    () => computePowerActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction]
  );

  const rangeDisplay = useMemo(() => deriveRange(partsPayload), [partsPayload]);
  const areaDisplay = useMemo(() => deriveArea(partsPayload), [partsPayload]);
  const durationDisplay = useMemo(() => deriveDuration(partsPayload), [partsPayload]);

  // Format range for collapsed summary (from UI state)
  const rangeSummary = useMemo(() => {
    if (range.steps === 0) return '1 Space / Melee';
    const formatted = formatPowerRangeFromSteps(range.steps);
    return formatted.replace(/\bspaces\b/, 'Spaces').replace(/\bspace\b/, 'Space');
  }, [range.steps]);

  // Area part for description display when area is selected
  const areaPartInfo = useMemo(
    () => (area.type !== 'none' ? getAreaPartForDisplay(area.type, area.level, powerParts) : null),
    [area.type, area.level, powerParts]
  );

  // Format damage for collapsed summary
  const damageSummary = useMemo(() => {
    const valid = damages.filter((d) => d.type !== 'none' && d.amount > 0);
    if (valid.length === 0) return 'No damage';
    return valid.map((d) => `${d.amount}d${d.size} ${d.type}`).join(', ');
  }, [damages]);

  // Power parts summary (first few part names + EN/TP)
  const powerPartsSummary = useMemo(() => {
    if (selectedParts.length === 0) return 'No parts';
    const names = selectedParts.slice(0, 5).map((sp) => sp.part.name);
    const more = selectedParts.length > 5 ? ` +${selectedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedParts]);

  // Power mechanics summary
  const powerMechanicsSummary = useMemo(() => {
    if (selectedAdvancedParts.length === 0) return 'No mechanics';
    const names = selectedAdvancedParts.slice(0, 5).map((ap) => ap.part.name);
    const more = selectedAdvancedParts.length > 5 ? ` +${selectedAdvancedParts.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedAdvancedParts]);

  // Duration summary for collapsed state
  const durationSummary = useMemo(() => {
    if (duration.type === 'instant') return 'Instant';
    if (duration.type === 'permanent') return 'Permanent';
    return formatDurationFromTypeAndValue(duration.type, duration.value);
  }, [duration.type, duration.value]);

  // Section costs for display (EN/TP contribution per section)
  const sectionCosts = useMemo(() => {
    const toPayload = (mp: { id: number | string; name: string; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number }) =>
      ({ id: mp.id, name: mp.name, op_1_lvl: mp.op_1_lvl, op_2_lvl: mp.op_2_lvl, op_3_lvl: mp.op_3_lvl });
    const rangeParts = mechanicParts.filter((mp) => mp.name === 'Power Range').map(toPayload);
    const areaNames = ['Sphere of Effect', 'Cylinder of Effect', 'Cone of Effect', 'Line of Effect', 'Trail of Effect'];
    const areaParts = mechanicParts.filter((mp) => areaNames.includes(mp.name)).map(toPayload);
    const durationNames = ['Duration (Round)', 'Duration (Minute)', 'Duration (Hour)', 'Duration (Days)', 'Duration (Permanent)', 'Focus for Duration', 'No Harm or Adaptation for Duration', 'Duration Ends On Activation', 'Sustain for Duration'];
    const durationParts = mechanicParts.filter((mp) => durationNames.includes(mp.name)).map(toPayload);
    const damageNames = ['Magic Damage', 'Light Damage', 'Elemental Damage', 'Poison or Necrotic Damage', 'Sonic Damage', 'Spiritual Damage', 'Psychic Damage', 'Physical Damage', 'Power Split Damage Dice'];
    const damageParts = mechanicParts.filter((mp) => damageNames.includes(mp.name)).map(toPayload);
    const actionNames = ['Power Reaction', 'Power Quick or Free Action', 'Power Long Action'];
    const actionParts = mechanicParts.filter((mp) => actionNames.includes(mp.name)).map(toPayload);
    const partsPayload = selectedParts.map((sp) => ({
      part: sp.part,
      op_1_lvl: sp.op_1_lvl,
      op_2_lvl: sp.op_2_lvl,
      op_3_lvl: sp.op_3_lvl,
    }));
    const mechanicPayload = selectedAdvancedParts.map((ap) => ({
      part: ap.part,
      op_1_lvl: ap.op_1_lvl,
      op_2_lvl: ap.op_2_lvl,
      op_3_lvl: ap.op_3_lvl,
    }));
    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: calculatePowerCosts(addWeaponToPowerPart ? [addWeaponToPowerPart] : [], powerParts),
      range: calculatePowerCosts(rangeParts, powerParts),
      area: calculatePowerCosts(areaParts, powerParts),
      duration: calculatePowerCosts(durationParts, powerParts),
      damage: calculatePowerCosts(damageParts, powerParts),
      powerParts: calculatePowerCosts(partsPayload, powerParts),
      powerMechanics: calculatePowerCosts(mechanicPayload, powerParts),
    };
  }, [mechanicParts, powerParts, selectedParts, selectedAdvancedParts, addWeaponToPowerPart]);

  // Actions
  const addPart = useCallback(() => {
    if (nonMechanicParts.length === 0) return;
    setSelectedParts((prev) => [
      ...prev,
      {
        part: nonMechanicParts[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicParts]);

  const removePart = useCallback((index: number) => {
    setSelectedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updatePart = useCallback((index: number, updates: Partial<SelectedPart>) => {
    setSelectedParts((prev) =>
      prev.map((sp, i) => (i === index ? { ...sp, ...updates } : sp))
    );
  }, []);

  // Advanced part actions
  const addMechanicPart = useCallback(() => {
    if (mechanicPartsForList.length === 0) return;
    const first = mechanicPartsForList[0];
    if (selectedAdvancedParts.some((ap) => ap.part.id === first.id)) return;
    setSelectedAdvancedParts((prev) => [
      ...prev,
      {
        part: first,
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [mechanicPartsForList, selectedAdvancedParts]);

  const removeAdvancedPart = useCallback((index: number) => {
    setSelectedAdvancedParts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateAdvancedPart = useCallback((index: number, updates: Partial<AdvancedPart>) => {
    setSelectedAdvancedParts((prev) =>
      prev.map((ap, i) => (i === index ? { ...ap, ...updates } : ap))
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
        applyDuration: sp.applyDuration,
      })),
      ...selectedAdvancedParts.map((ap) => ({
        id: Number(ap.part.id),
        name: ap.part.name,
        op_1_lvl: ap.op_1_lvl,
        op_2_lvl: ap.op_2_lvl,
        op_3_lvl: ap.op_3_lvl,
        applyDuration: ap.applyDuration,
        isAdvanced: true,
      })),
      ...mechanicParts.map((mp) => ({
        id: mp.id,
        name: mp.name,
        op_1_lvl: mp.op_1_lvl,
        op_2_lvl: mp.op_2_lvl,
        op_3_lvl: mp.op_3_lvl,
        applyDuration: mp.applyDuration,
        isMechanic: true,
      })),
      ...(addWeaponToPowerPart
        ? [{
            id: addWeaponToPowerPart.id,
            name: addWeaponToPowerPart.name,
            op_1_lvl: addWeaponToPowerPart.op_1_lvl,
            op_2_lvl: addWeaponToPowerPart.op_2_lvl,
            op_3_lvl: addWeaponToPowerPart.op_3_lvl,
            applyDuration: false,
            isMechanic: true,
          }]
        : []),
    ];
    const damageToSave = damages
      .filter((d) => d.type !== 'none' && d.amount > 0)
      .map((d) => ({ amount: d.amount, size: d.size, type: d.type, applyDuration: d.applyDuration ?? false }));
    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        parts: partsToSave,
        damage: damageToSave,
        actionType,
        isReaction,
        range,
        area,
        duration,
        attackMode,
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
      },
    };
  }, [name, description, selectedParts, selectedAdvancedParts, mechanicParts, addWeaponToPowerPart, damages, actionType, isReaction, range, area, duration, attackMode, imageId, imageUrl]);

  const save = useCreatorSave({
    type: 'powers',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (n, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${n}" (power)? The existing public power with this name will be replaced.`
        : `Are you sure you wish to publish this power "${n}" to the Realms Library? All users will be able to see and use it.`,
    successMessage: 'Power saved successfully!',
    publicSuccessMessage: 'Power saved to Realms Library!',
    onSaveSuccess: () => {
      setName('');
      setDescription('');
      setSelectedParts([]);
      setSelectedAdvancedParts([]);
      setActionType('basic');
      setIsReaction(false);
      setDamages([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
      setRange({ steps: 0 });
      setArea({ type: 'none', level: 1, applyDuration: false });
      setDuration({
        type: 'instant',
        value: 1,
        applyDuration: false,
        focus: false,
        noHarm: false,
        endsOnActivation: false,
        sustain: 0,
      });
      setAttackMode('none');
      setImageId(null);
      setImageUrl(null);
    },
  });

  const handleReset = useCallback(() => {    setName('');
    setDescription('');
    setSelectedParts([]);
    setSelectedAdvancedParts([]);
    setActionType('basic');
    setIsReaction(false);
    setDamages([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
    setRange({ steps: 0 });
    setArea({ type: 'none', level: 1, applyDuration: false });
    setDuration({
      type: 'instant',
      value: 1,
      applyDuration: false,
      focus: false,
      noHarm: false,
      endsOnActivation: false,
      sustain: 0,
    });
    setAttackMode('none');
    setImageId(null);
    setImageUrl(null);
    save.setSaveMessage(null);
    clearCreatorCache(POWER_CREATOR_CACHE_KEY);
  }, [save]);

  const applyFormState = useCallback((next: PowerCreatorFormState) => {
    setName(next.name);
    setDescription(next.description);
    setSelectedParts(next.selectedParts);
    setSelectedAdvancedParts(next.selectedAdvancedParts);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setDamages(next.damages);
    setRange(next.range);
    setArea(next.area);
    setDuration(next.duration);
    setAttackMode(next.attackMode);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
  }, []);

  // Load a power from the library
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleLoadPower = useCallback((power: any) => {
    applyFormState(
      powerLibraryRecordToFormState(
        power,
        powerParts,
      ),
    );
    save.setSaveMessage({ type: 'success', text: 'Power loaded successfully!' });
    setTimeout(() => save.setSaveMessage(null), 2000);
  }, [powerParts, applyFormState, save]);

  return (
    <CreatorPageShell
      icon={<Wand2 className="w-8 h-8 text-primary-link-fg" />}
      title="Power Creator"
      description="Design custom powers by combining power parts. Each part contributes to the total energy cost and training point requirements."
      user={user}
      auth={{ returnPath: '/power-creator', contentType: 'power' }}
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
        loadingMessage: 'Loading power parts...',
        error: error ?? null,
        onRetry: () => {
          void refetch();
        },
        errorMessage: error ? `Failed to load power parts: ${error.message}` : undefined,
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
        searchPlaceholder: 'Search powers...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Power from Library',
        onSelect: (selected) =>
          handleLoadPower(selected.data as Parameters<typeof handleLoadPower>[0]),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Power Summary"
          costStats={[
            { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
            { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
          ]}
          statRows={[
            { label: 'Action', value: actionTypeDisplay },
            { label: 'Attack', value: attackModeLabel },
            { label: 'Range', value: rangeDisplay },
            { label: 'Area', value: areaDisplay },
            { label: 'Duration', value: durationDisplay },
          ]}
          breakdowns={
            costs.tpSources.length > 0
              ? [{ title: 'TP Breakdown', items: costs.tpSources }]
              : undefined
          }
        >
          <AdvancedCalculationsPanel
            rows={advancedCalcRows}
            ruleText="Rule: Final energy is the ceiling of raw energy; TP sums part contributions."
          />
        </CreatorSummaryPanel>
      }
    >
      <PowerCreatorEditor
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
        actionType={actionType}
        onActionTypeChange={setActionType}
        isReaction={isReaction}
        onIsReactionChange={setIsReaction}
        actionTypeDisplay={actionTypeDisplay}
        attackMode={attackMode}
        onAttackModeChange={setAttackMode}
        range={range}
        onRangeChange={setRange}
        rangeSummary={rangeSummary}
        area={area}
        onAreaChange={setArea}
        areaPartInfo={areaPartInfo}
        duration={duration}
        onDurationChange={setDuration}
        durationSummary={durationSummary}
        selectedParts={selectedParts}
        nonMechanicParts={nonMechanicParts}
        powerPartsSummary={powerPartsSummary}
        onAddPart={addPart}
        onRemovePart={removePart}
        onUpdatePart={updatePart}
        selectedAdvancedParts={selectedAdvancedParts}
        mechanicPartsForList={mechanicPartsForList}
        powerMechanicsSummary={powerMechanicsSummary}
        onAddMechanicPart={addMechanicPart}
        onRemoveAdvancedPart={removeAdvancedPart}
        onUpdateAdvancedPart={updateAdvancedPart}
        damages={damages}
        onDamagesChange={setDamages}
        damageSummary={damageSummary}
        sectionCosts={sectionCosts}
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
