/**
 * Empowered Technique Creator
 * ===========================
 * Combines power + technique authoring into one creator flow.
 */

'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Wand2, Zap, Target } from 'lucide-react';
import {
  usePowerParts,
  useTechniqueParts,
  useAdmin,
  useCreatorSave,
  useLoadModalLibrary,
  type PowerPart,
  type TechniquePart,
  type UseLoadModalLibraryReturn,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import { dedupeSavedParts } from '@/lib/library/dedupe-saved-parts';
import {
  buildMechanicParts,
  calculatePowerCosts,
  calculateTechniqueCosts,
  calculateEmpoweredTechniqueCosts,
  computePowerActionTypeFromSelection,
  deriveRange,
  deriveArea,
  deriveDuration,
  type PowerPartPayload,
  type TechniquePartPayload,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import { DURATION_VALUES } from '@/lib/game/creator-constants';
import {
  CreatorPageShell,
  CreatorSummaryPanel,
  AdvancedCalculationsPanel,
} from '@/components/creator';
import { LoadingState } from '@/components/ui';
import { ErrorDisplay } from '@/components/shared';
import { SourceFilter } from '@/components/shared/filters/source-filter';
import { EXCLUDED_PARTS } from '@/app/(main)/power-creator/power-creator-constants';
import { attackModeColumnLabel, type AttackMode } from '@/lib/attack-mode';
import { EmpoweredTechniqueCreatorEditor } from './empowered-technique-creator-editor';

import {
  bootstrapEmpoweredTechniqueFormState,
  empoweredLibraryRecordToFormState,
  EMPOWERED_TECHNIQUE_CREATOR_CACHE_KEY as CACHE_KEY,
  type EmpoweredTechniqueCache,
  type EmpoweredTechniqueFormState,
  type EmpoweredDamageConfig as DamageConfig,
  type EmpoweredRangeConfig as RangeConfig,
  type SelectedPowerPart,
  type SelectedTechniquePart,
} from './empowered-technique-bootstrap';
import { writeCreatorCache, clearCreatorCache } from '@/lib/game/creator-cache';

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
  const [name, setName] = useState(initialFormState.name);
  const [description, setDescription] = useState(initialFormState.description);
  const [actionType, setActionType] = useState(initialFormState.actionType);
  const [isReaction, setIsReaction] = useState(initialFormState.isReaction);
  const [powerDamages, setPowerDamages] = useState<DamageConfig[]>(initialFormState.powerDamages);
  const [techniqueDamage, setTechniqueDamage] = useState<{ amount: number; size: number }>(
    initialFormState.techniqueDamage,
  );
  const [range, setRange] = useState<RangeConfig>(initialFormState.range);
  const [area, setArea] = useState<AreaConfig>(initialFormState.area);
  const [duration, setDuration] = useState<DurationConfig>(initialFormState.duration);
  const [attackMode, setAttackMode] = useState<AttackMode>(initialFormState.attackMode);
  const [selectedPowerParts, setSelectedPowerParts] = useState<SelectedPowerPart[]>(
    initialFormState.selectedPowerParts,
  );
  const [selectedPowerAdvancedParts, setSelectedPowerAdvancedParts] = useState<SelectedPowerPart[]>(
    initialFormState.selectedPowerAdvancedParts,
  );
  const [selectedTechniqueParts, setSelectedTechniqueParts] = useState<SelectedTechniquePart[]>(
    initialFormState.selectedTechniqueParts,
  );
  const [imageId, setImageId] = useState<string | null>(initialFormState.imageId);
  const [imageUrl, setImageUrl] = useState<string | null>(initialFormState.imageUrl);

  // ?edit= mode: clear any stale draft once on mount (parity with the old hydrate
  // effect, which removed the cache after loading the edit target).
  useEffect(() => {
    if (editId) clearCreatorCache(CACHE_KEY);
  }, [editId]);

  const nonMechanicPowerParts = useMemo(
    () => powerParts.filter((part: PowerPart) => !part.mechanic),
    [powerParts]
  );
  const nonMechanicTechniqueParts = useMemo(
    () => techniqueParts.filter((part: TechniquePart) => !part.mechanic),
    [techniqueParts]
  );
  const powerMechanicsForList = useMemo(
    () => powerParts.filter((part: PowerPart) => part.mechanic && !EXCLUDED_PARTS.has(part.name)),
    [powerParts]
  );

  const powerMechanicParts = useMemo(
    () =>
      buildMechanicParts({
        creatorType: 'power',
        partsDb: powerParts,
        action: { type: actionType, isReaction },
        powerDamage: powerDamages.map((damage) => ({
          type: damage.type,
          diceAmount: damage.amount,
          dieSize: damage.size,
          applyDuration: damage.applyDuration ?? false,
        })),
        range: { steps: range.steps },
        area:
          area.type !== 'none'
            ? { type: area.type, level: area.level, applyDuration: area.applyDuration ?? false }
            : undefined,
        duration:
          duration.type !== 'instant'
            ? {
                type: duration.type,
                value: duration.value,
                applyDuration: duration.applyDuration ?? false,
                focus: duration.focus,
                noHarm: duration.noHarm,
                endsOnActivation: duration.endsOnActivation,
                sustain: duration.sustain,
              }
            : undefined,
      }),
    [actionType, area, duration, isReaction, powerDamages, powerParts, range.steps]
  );

  const techniqueDamageMechanicParts = useMemo(
    () =>
      buildMechanicParts({
        creatorType: 'technique',
        partsDb: techniqueParts,
        techniqueDamage:
          techniqueDamage.amount > 0
            ? { diceAmount: techniqueDamage.amount, dieSize: techniqueDamage.size }
            : undefined,
      }),
    [techniqueDamage, techniqueParts]
  );

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
  }, [powerParts, attackMode]);

  const powerPayload: PowerPartPayload[] = useMemo(
    () => [
      ...selectedPowerParts.map((selected) => ({
        part: selected.part,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
      })),
      ...selectedPowerAdvancedParts.map((selected) => ({
        part: selected.part,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
      })),
      ...powerMechanicParts,
      ...(addWeaponToPowerPart ? [addWeaponToPowerPart] : []),
    ],
    [addWeaponToPowerPart, powerMechanicParts, selectedPowerAdvancedParts, selectedPowerParts]
  );

  const techniquePayload: TechniquePartPayload[] = useMemo(
    () => [
      ...selectedTechniqueParts.map((selected) => ({
        part: selected.part,
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
      })),
      ...techniqueDamageMechanicParts.map((part) => ({
        id: Number(part.id),
        name: part.name,
        op_1_lvl: part.op_1_lvl,
        op_2_lvl: part.op_2_lvl,
        op_3_lvl: part.op_3_lvl,
      })),
    ],
    [selectedTechniqueParts, techniqueDamageMechanicParts]
  );

  const costs = useMemo(
    () =>
      calculateEmpoweredTechniqueCosts({
        powerPartsPayload: powerPayload,
        techniquePartsPayload: techniquePayload,
        powerPartsDb: powerParts,
        techniquePartsDb: techniqueParts,
      }),
    [powerPayload, powerParts, techniquePayload, techniqueParts]
  );

  const powerBaseCosts = useMemo(
    () => calculatePowerCosts(powerPayload, powerParts),
    [powerPayload, powerParts]
  );
  const techniqueBaseCosts = useMemo(
    () => calculateTechniqueCosts(techniquePayload, techniqueParts),
    [techniquePayload, techniqueParts]
  );

  const advancedCalcRows = useMemo(() => {
    const powerRawBeforeMultiplier = powerBaseCosts.energyRaw;
    const techniqueRaw = techniqueBaseCosts.energyRaw;
    const techniqueMultiplier = costs.techniquePercentageMultiplier;
    const adjustedPowerRaw = powerRawBeforeMultiplier * techniqueMultiplier;
    const combinedRaw = adjustedPowerRaw + techniqueRaw;
    return [
      {
        label: 'Power side: energy (raw, before technique %)',
        value: powerRawBeforeMultiplier.toFixed(2),
      },
      {
        label: 'Technique % multiplier',
        value: techniqueMultiplier.toFixed(3),
      },
      {
        label: 'Power side: energy (adjusted)',
        value: `${powerRawBeforeMultiplier.toFixed(2)} × ${techniqueMultiplier.toFixed(3)} = ${adjustedPowerRaw.toFixed(2)}`,
      },
      {
        label: 'Technique side: energy (raw)',
        value: techniqueRaw.toFixed(2),
      },
      {
        label: 'Combined energy (raw)',
        value: `${adjustedPowerRaw.toFixed(2)} + ${techniqueRaw.toFixed(2)} = ${combinedRaw.toFixed(2)}`,
      },
      {
        label: 'Energy (final)',
        value: `ceil(${combinedRaw.toFixed(2)}) = ${costs.totalEnergy}`,
      },
      {
        label: 'Training points (power side)',
        value: String(powerBaseCosts.totalTP),
      },
      {
        label: 'Training points (technique side)',
        value: String(techniqueBaseCosts.totalTP),
      },
      {
        label: 'Training points (final)',
        value: `${powerBaseCosts.totalTP} + ${techniqueBaseCosts.totalTP} = ${costs.totalTP}`,
      },
    ];
  }, [costs.techniquePercentageMultiplier, costs.totalEnergy, costs.totalTP, powerBaseCosts.energyRaw, powerBaseCosts.totalTP, techniqueBaseCosts.energyRaw, techniqueBaseCosts.totalTP]);

  const sectionCosts = useMemo(() => {
    const actionPartNames = ['Power Reaction', 'Power Quick or Free Action', 'Power Long Action'];
    const rangePartNames = ['Power Range'];
    const areaPartNames = ['Sphere of Effect', 'Cylinder of Effect', 'Cone of Effect', 'Line of Effect', 'Trail of Effect'];
    const durationPartNames = ['Duration (Round)', 'Duration (Minute)', 'Duration (Hour)', 'Duration (Days)', 'Duration (Permanent)', 'Focus for Duration', 'No Harm or Adaptation for Duration', 'Duration Ends On Activation', 'Sustain for Duration'];
    const powerDamageNames = ['Magic Damage', 'Light Damage', 'Elemental Damage', 'Poison or Necrotic Damage', 'Sonic Damage', 'Spiritual Damage', 'Psychic Damage', 'Physical Damage', 'Power Split Damage Dice'];

    const actionParts = powerMechanicParts.filter((part) => actionPartNames.includes(part.name));
    const rangeParts = powerMechanicParts.filter((part) => rangePartNames.includes(part.name));
    const areaParts = powerMechanicParts.filter((part) => areaPartNames.includes(part.name));
    const durationParts = powerMechanicParts.filter((part) => durationPartNames.includes(part.name));
    const powerDamageParts = powerMechanicParts.filter((part) => powerDamageNames.includes(part.name));
    const techniqueDamageParts: TechniquePartPayload[] = techniqueDamageMechanicParts.map((part) => ({
      id: Number(part.id),
      name: part.name,
      op_1_lvl: part.op_1_lvl,
      op_2_lvl: part.op_2_lvl,
      op_3_lvl: part.op_3_lvl,
    }));

    return {
      action: calculatePowerCosts(actionParts, powerParts),
      weapon: calculatePowerCosts(addWeaponToPowerPart ? [addWeaponToPowerPart] : [], powerParts),
      range: calculatePowerCosts(rangeParts, powerParts),
      area: calculatePowerCosts(areaParts, powerParts),
      duration: calculatePowerCosts(durationParts, powerParts),
      powerDamage: calculatePowerCosts(powerDamageParts, powerParts),
      powerParts: calculatePowerCosts(
        selectedPowerParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
          applyDuration: selected.applyDuration,
        })),
        powerParts
      ),
      powerMechanics: calculatePowerCosts(
        selectedPowerAdvancedParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
          applyDuration: selected.applyDuration,
        })),
        powerParts
      ),
      techniqueParts: calculateTechniqueCosts(
        selectedTechniqueParts.map((selected) => ({
          part: selected.part,
          op_1_lvl: selected.op_1_lvl,
          op_2_lvl: selected.op_2_lvl,
          op_3_lvl: selected.op_3_lvl,
        })),
        techniqueParts
      ),
      techniqueDamage: calculateTechniqueCosts(techniqueDamageParts, techniqueParts),
    };
  }, [
    addWeaponToPowerPart,
    powerMechanicParts,
    powerParts,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamageMechanicParts,
    techniqueParts,
  ]);

  const actionDisplay = useMemo(
    () => computePowerActionTypeFromSelection(actionType, isReaction),
    [actionType, isReaction]
  );
  const rangeDisplay = useMemo(() => deriveRange(powerPayload), [powerPayload]);
  const areaDisplay = useMemo(() => deriveArea(powerPayload), [powerPayload]);
  const durationDisplay = useMemo(() => deriveDuration(powerPayload), [powerPayload]);

  const powerDamageSummary = useMemo(() => {
    const rows = powerDamages.filter((damage) => damage.type !== 'none' && damage.amount > 0);
    if (rows.length === 0) return 'No damage';
    return rows.map((damage) => `${damage.amount}d${damage.size} ${damage.type}`).join(', ');
  }, [powerDamages]);

  const techniqueDamageSummary = useMemo(
    () => (techniqueDamage.amount > 0 ? `+${techniqueDamage.amount}d${techniqueDamage.size}` : 'None'),
    [techniqueDamage.amount, techniqueDamage.size]
  );

  const resetState = useCallback(() => {
    setName('');
    setDescription('');
    setActionType('basic');
    setIsReaction(false);
    setPowerDamages([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
    setTechniqueDamage({ amount: 0, size: 6 });
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
    setSelectedPowerParts([]);
    setSelectedPowerAdvancedParts([]);
    setSelectedTechniqueParts([]);
    setImageId(null);
    setImageUrl(null);
    clearCreatorCache(CACHE_KEY);
  }, []);

  const applyFormState = useCallback((next: EmpoweredTechniqueFormState) => {
    setName(next.name);
    setDescription(next.description);
    setActionType(next.actionType);
    setIsReaction(next.isReaction);
    setPowerDamages(next.powerDamages);
    setTechniqueDamage(next.techniqueDamage);
    setRange(next.range);
    setArea(next.area);
    setDuration(next.duration);
    setAttackMode(next.attackMode);
    setSelectedPowerParts(next.selectedPowerParts);
    setSelectedPowerAdvancedParts(next.selectedPowerAdvancedParts);
    setSelectedTechniqueParts(next.selectedTechniqueParts);
    setImageId(next.imageId);
    setImageUrl(next.imageUrl);
  }, []);

  const getPayload = useCallback(() => {
    const powerPartsToSave = dedupeSavedParts(
      selectedPowerParts.map((selected) => ({
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
      }))
    );
    const powerAdvancedToSave = dedupeSavedParts(
      selectedPowerAdvancedParts.map((selected) => ({
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
        applyDuration: selected.applyDuration,
        isAdvanced: true,
      }))
    );
    const techniquePartsToSave = dedupeSavedParts(
      selectedTechniqueParts.map((selected) => ({
        id: Number(selected.part.id),
        name: selected.part.name,
        op_1_lvl: selected.op_1_lvl,
        op_2_lvl: selected.op_2_lvl,
        op_3_lvl: selected.op_3_lvl,
      }))
    );

    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        empoweredTechnique: true,
        actionType,
        isReaction,
        attackMode,
        ...(imageId ? { imageId } : {}),
        ...(imageUrl ? { imageUrl } : {}),
        power: {
          parts: powerPartsToSave,
          mechanics: powerAdvancedToSave,
          autoMechanics: dedupeSavedParts(powerMechanicParts),
          damage: powerDamages.filter((damage) => damage.type !== 'none' && damage.amount > 0),
          range,
          area,
          duration,
          addWeaponPowerPart: addWeaponToPowerPart,
        },
        technique: {
          parts: techniquePartsToSave,
          additionalDamage: techniqueDamage.amount > 0 ? [{ amount: techniqueDamage.amount, size: techniqueDamage.size }] : [],
          autoMechanics: dedupeSavedParts(techniqueDamageMechanicParts),
        },
        totals: {
          energy: costs.totalEnergy,
          trainingPoints: costs.totalTP,
        },
      },
    };
  }, [
    actionType,
    addWeaponToPowerPart,
    area,
    attackMode,
    costs.totalEnergy,
    costs.totalTP,
    description,
    duration,
    isReaction,
    imageId,
    imageUrl,
    name,
    powerDamages,
    powerMechanicParts,
    range,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamage,
    techniqueDamageMechanicParts,
  ]);

  const save = useCreatorSave({
    type: 'empowered-techniques',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (itemName, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${itemName}" (empowered technique)? The existing public empowered technique with this name will be replaced.`
        : `Are you sure you wish to publish this empowered technique "${itemName}" to the Realms Library?`,
    successMessage: 'Empowered technique saved successfully!',
    publicSuccessMessage: 'Empowered technique saved to Realms Library!',
    onSaveSuccess: resetState,
  });

  const handleLoadEmpoweredTechnique = useCallback(
    (doc: unknown) => {
      const next = empoweredLibraryRecordToFormState(
        doc,
        powerParts,
        techniqueParts,
      );
      if (!next) return;
      applyFormState(next);
      save.setSaveMessage({ type: 'success', text: 'Empowered technique loaded successfully!' });
      setTimeout(() => save.setSaveMessage(null), 2000);
    },
    [powerParts, techniqueParts, applyFormState, save]
  );

  // Auto-save draft to localStorage (skip when editing an existing library row via ?edit=)
  useEffect(() => {
    if (editId) return;
    const cache: EmpoweredTechniqueCache = {
      name,
      description,
      actionType,
      isReaction,
      powerDamages,
      techniqueDamage,
      attackMode,
      range,
      area,
      duration,
      selectedPowerParts: selectedPowerParts.map((row) => ({
        partId: row.part.id,
        op_1_lvl: row.op_1_lvl,
        op_2_lvl: row.op_2_lvl,
        op_3_lvl: row.op_3_lvl,
        applyDuration: row.applyDuration,
        selectedCategory: row.selectedCategory,
      })),
      selectedPowerAdvancedParts: selectedPowerAdvancedParts.map((row) => ({
        partId: row.part.id,
        op_1_lvl: row.op_1_lvl,
        op_2_lvl: row.op_2_lvl,
        op_3_lvl: row.op_3_lvl,
        applyDuration: row.applyDuration,
        selectedCategory: row.selectedCategory,
      })),
      selectedTechniqueParts: selectedTechniqueParts.map((row) => ({
        partId: row.part.id,
        op_1_lvl: row.op_1_lvl,
        op_2_lvl: row.op_2_lvl,
        op_3_lvl: row.op_3_lvl,
        selectedCategory: row.selectedCategory,
      })),
      imageId,
      imageUrl,
      timestamp: Date.now(),
    };
    writeCreatorCache(CACHE_KEY, cache);
  }, [
    actionType,
    area,
    description,
    duration,
    editId,
    isReaction,
    imageId,
    imageUrl,
    name,
    powerDamages,
    range,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamage,
    attackMode,
  ]);

  const addPowerPart = useCallback(() => {
    if (nonMechanicPowerParts.length === 0) return;
    setSelectedPowerParts((previous) => [
      ...previous,
      {
        part: nonMechanicPowerParts[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicPowerParts]);

  const addPowerMechanicPart = useCallback(() => {
    if (powerMechanicsForList.length === 0) return;
    setSelectedPowerAdvancedParts((previous) => [
      ...previous,
      {
        part: powerMechanicsForList[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        applyDuration: false,
        selectedCategory: 'any',
      },
    ]);
  }, [powerMechanicsForList]);

  const addTechniquePart = useCallback(() => {
    if (nonMechanicTechniqueParts.length === 0) return;
    setSelectedTechniqueParts((previous) => [
      ...previous,
      {
        part: nonMechanicTechniqueParts[0],
        op_1_lvl: 0,
        op_2_lvl: 0,
        op_3_lvl: 0,
        selectedCategory: 'any',
      },
    ]);
  }, [nonMechanicTechniqueParts]);

  const updatePowerPart = useCallback((index: number, updates: Partial<SelectedPowerPart>) => {
    setSelectedPowerParts((previous) =>
      previous.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              part: (updates.part as PowerPart) ?? row.part,
              op_1_lvl: updates.op_1_lvl ?? row.op_1_lvl,
              op_2_lvl: updates.op_2_lvl ?? row.op_2_lvl,
              op_3_lvl: updates.op_3_lvl ?? row.op_3_lvl,
              applyDuration: updates.applyDuration ?? row.applyDuration,
              selectedCategory: updates.selectedCategory ?? row.selectedCategory,
            }
          : row,
      ),
    );
  }, []);

  const updatePowerAdvancedPart = useCallback(
    (index: number, updates: Partial<SelectedPowerPart>) => {
      setSelectedPowerAdvancedParts((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                part: (updates.part as PowerPart) ?? row.part,
                op_1_lvl: updates.op_1_lvl ?? row.op_1_lvl,
                op_2_lvl: updates.op_2_lvl ?? row.op_2_lvl,
                op_3_lvl: updates.op_3_lvl ?? row.op_3_lvl,
                applyDuration: updates.applyDuration ?? row.applyDuration,
                selectedCategory: updates.selectedCategory ?? row.selectedCategory,
              }
            : row,
        ),
      );
    },
    [],
  );

  const updateTechniquePart = useCallback(
    (index: number, updates: Partial<SelectedTechniquePart>) => {
      setSelectedTechniqueParts((previous) =>
        previous.map((row, rowIndex) =>
          rowIndex === index
            ? {
                ...row,
                part: (updates.part as TechniquePart) ?? row.part,
                op_1_lvl: updates.op_1_lvl ?? row.op_1_lvl,
                op_2_lvl: updates.op_2_lvl ?? row.op_2_lvl,
                op_3_lvl: updates.op_3_lvl ?? row.op_3_lvl,
                selectedCategory: updates.selectedCategory ?? row.selectedCategory,
              }
            : row,
        ),
      );
    },
    [],
  );

  const handleDurationTypeChange = useCallback((nextType: DurationConfig['type']) => {
    const nextValue = DURATION_VALUES[nextType]?.[0]?.value || 1;
    setDuration((previous) => ({
      ...previous,
      type: nextType,
      value: nextValue,
      focus: nextType === 'instant' ? false : previous.focus,
      noHarm: nextType === 'instant' ? false : previous.noHarm,
      endsOnActivation: nextType === 'instant' ? false : previous.endsOnActivation,
      sustain: nextType === 'instant' ? 0 : previous.sustain,
    }));
  }, []);

  const loadError =
    powerPartsError && techniquePartsError
      ? new Error(
          `Failed to load power parts (${powerPartsError.message}) and technique parts (${techniquePartsError.message}).`
        )
      : powerPartsError
        ? new Error(`Failed to load power parts: ${powerPartsError.message}`)
        : techniquePartsError
          ? new Error(`Failed to load technique parts: ${techniquePartsError.message}`)
          : null;

  return (
    <CreatorPageShell
      icon={<Wand2 className="w-8 h-8 text-primary-link-fg" />}
      title="Empowered Technique Creator"
      description="Build an empowered technique by combining power and technique parts in one shared action profile."
      user={user}
      auth={{ returnPath: '/empowered-technique-creator', contentType: 'empowered technique' }}
      showPublicPrivate={isAdmin}
      saveTarget={save.saveTarget}
      onSaveTargetChange={save.setSaveTarget}
      onSave={save.handleSave}
      onLoad={load.openLoadModal}
      onReset={resetState}
      saving={save.saving}
      saveDisabled={!name.trim()}
      loading={{
        isLoading: powerPartsLoading || techniquePartsLoading,
        loadingMessage: 'Loading empowered technique creator...',
        error: loadError,
        onRetry: () => {
          void refetchPowerParts();
          void refetchTechniqueParts();
        },
        errorMessage: loadError?.message,
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
        searchPlaceholder: 'Search empowered techniques...',
        isLoading: load.isLoading,
        error: load.error,
        title: 'Load Empowered Technique',
        onSelect: (selected) => handleLoadEmpoweredTechnique(selected.data),
      }}
      sidebar={
        <CreatorSummaryPanel
          title="Empowered Technique Summary"
          costStats={[
            { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
            { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
          ]}
          statRows={[
            { label: 'Action', value: actionDisplay },
            { label: 'Attack', value: attackModeColumnLabel(attackMode) },
            { label: 'Range', value: rangeDisplay },
            { label: 'Area', value: areaDisplay },
            { label: 'Duration', value: durationDisplay },
          ]}
          breakdowns={costs.tpSources.length > 0 ? [{ title: 'TP Breakdown', items: costs.tpSources }] : undefined}
        >
          <AdvancedCalculationsPanel
            rows={advancedCalcRows}
            ruleText="Rule: Technique percentage parts multiply the power side before adding technique energy; TP is the sum of both sides."
          />
        </CreatorSummaryPanel>
      }
    >
      <EmpoweredTechniqueCreatorEditor
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
        actionDisplay={actionDisplay}
        actionType={actionType}
        onActionTypeChange={setActionType}
        isReaction={isReaction}
        onIsReactionChange={setIsReaction}
        attackMode={attackMode}
        onAttackModeChange={setAttackMode}
        rangeDisplay={rangeDisplay}
        range={range}
        onRangeStepsChange={(steps) => setRange({ steps })}
        area={area}
        onAreaChange={setArea}
        duration={duration}
        onDurationChange={setDuration}
        onDurationTypeChange={handleDurationTypeChange}
        powerDamages={powerDamages}
        onPowerDamagesChange={setPowerDamages}
        powerDamageSummary={powerDamageSummary}
        selectedPowerParts={selectedPowerParts}
        nonMechanicPowerParts={nonMechanicPowerParts}
        onAddPowerPart={addPowerPart}
        onRemovePowerPart={(index) =>
          setSelectedPowerParts((previous) => previous.filter((_, rowIndex) => rowIndex !== index))
        }
        onUpdatePowerPart={updatePowerPart}
        selectedPowerAdvancedParts={selectedPowerAdvancedParts}
        powerMechanicsForList={powerMechanicsForList}
        onAddPowerMechanicPart={addPowerMechanicPart}
        onRemovePowerAdvancedPart={(index) =>
          setSelectedPowerAdvancedParts((previous) =>
            previous.filter((_, rowIndex) => rowIndex !== index),
          )
        }
        onUpdatePowerAdvancedPart={updatePowerAdvancedPart}
        selectedTechniqueParts={selectedTechniqueParts}
        nonMechanicTechniqueParts={nonMechanicTechniqueParts}
        onAddTechniquePart={addTechniquePart}
        onRemoveTechniquePart={(index) =>
          setSelectedTechniqueParts((previous) =>
            previous.filter((_, rowIndex) => rowIndex !== index),
          )
        }
        onUpdateTechniquePart={updateTechniquePart}
        techniqueDamage={techniqueDamage}
        onTechniqueDamageChange={setTechniqueDamage}
        techniqueDamageSummary={techniqueDamageSummary}
        sectionCosts={sectionCosts}
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
