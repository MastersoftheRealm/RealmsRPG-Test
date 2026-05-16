/**
 * Empowered Technique Creator
 * ===========================
 * Combines power + technique authoring into one creator flow.
 */

'use client';

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, Wand2, Zap, Target, Info } from 'lucide-react';
import {
  usePowerParts,
  useTechniqueParts,
  useUserItems,
  useItemProperties,
  useAdmin,
  useCreatorSave,
  useLoadModalLibrary,
  usePublicLibrary,
  useCreatorWeaponOptions,
  type PowerPart,
  type TechniquePart,
  type CreatorWeaponOption,
} from '@/hooks';
import { useAuthStore } from '@/stores';
import { findByIdOrName, PART_IDS } from '@/lib/id-constants';
import {
  buildMechanicParts,
  calculatePowerCosts,
  calculateTechniqueCosts,
  calculateEmpoweredTechniqueCosts,
  computePowerActionTypeFromSelection,
  deriveRange,
  deriveArea,
  deriveDuration,
  formatAreaForDisplay,
  formatDurationFromTypeAndValue,
  type PowerPartPayload,
  type TechniquePartPayload,
  type AreaConfig,
  type DurationConfig,
} from '@/lib/calculators';
import {
  ACTION_OPTIONS,
  AREA_TYPES,
  CREATOR_CACHE_KEYS,
  DIE_SIZES,
  DURATION_TYPES,
  DURATION_VALUES,
  POWER_DAMAGE_TYPES,
} from '@/lib/game/creator-constants';
import {
  CreatorLayout,
  CreatorSaveToolbar,
  CollapsibleSection,
  CreatorSummaryPanel,
  LoadFromLibraryModal,
  CreatorWeaponPicker,
  AdvancedCalculationsPanel,
} from '@/components/creator';
import { Button, Checkbox, Input, Textarea, LoadingState, Alert, PageContainer } from '@/components/ui';
import { ValueStepper, SectionCostBadge } from '@/components/shared';
import { SourceFilter } from '@/components/shared/filters/source-filter';
import type { SourceFilterValue } from '@/components/shared/filters/source-filter';
import { ConfirmActionModal, ContextHelpTooltip, LoginPromptModal } from '@/components/shared';
import { PowerPartCard } from '@/app/(main)/power-creator/PowerPartCard';
import { EXCLUDED_PARTS } from '@/app/(main)/power-creator/power-creator-constants';
import {
  inferEmpoweredWeaponTpFromPowerPayload,
  shouldPersistCreatorWeaponId,
} from '@/lib/creator-weapon-persistence';

interface DamageConfig {
  amount: number;
  size: number;
  type: string;
  applyDuration?: boolean;
}

interface RangeConfig {
  steps: number;
}

interface SelectedPowerPart {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
  selectedCategory: string;
}

interface SelectedTechniquePart {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory: string;
}

interface EmpoweredTechniqueCache {
  name: string;
  description: string;
  actionType: string;
  isReaction: boolean;
  powerDamages: DamageConfig[];
  techniqueDamage: { amount: number; size: number };
  weaponId: string | number;
  range: RangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  selectedPowerParts: Array<{ partId: string | number; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; applyDuration: boolean; selectedCategory: string }>;
  selectedPowerAdvancedParts: Array<{ partId: string | number; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; applyDuration: boolean; selectedCategory: string }>;
  selectedTechniqueParts: Array<{ partId: string | number; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; selectedCategory: string }>;
  timestamp: number;
}

const CACHE_KEY = CREATOR_CACHE_KEYS.EMPOWERED_TECHNIQUE;
const DEFAULT_WEAPON_OPTIONS: CreatorWeaponOption[] = [
  { id: 0, name: 'Unarmed Prowess', tp: 0, weaponLibrary: 'builtin' },
];

function EmpoweredTechniqueCreatorContent() {
  const { user } = useAuthStore();
  const { isAdmin } = useAdmin();
  const searchParams = useSearchParams();
  const editId = searchParams.get('edit');
  const editLoadedRef = useRef(false);
  const load = useLoadModalLibrary('empowered-technique');

  const [isInitialized, setIsInitialized] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [actionType, setActionType] = useState('basic');
  const [isReaction, setIsReaction] = useState(false);
  const [powerDamages, setPowerDamages] = useState<DamageConfig[]>([{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
  const [techniqueDamage, setTechniqueDamage] = useState<{ amount: number; size: number }>({ amount: 0, size: 6 });
  const [range, setRange] = useState<RangeConfig>({ steps: 0 });
  const [area, setArea] = useState<AreaConfig>({ type: 'none', level: 1, applyDuration: false });
  const [duration, setDuration] = useState<DurationConfig>({
    type: 'instant',
    value: 1,
    applyDuration: false,
    focus: false,
    noHarm: false,
    endsOnActivation: false,
    sustain: 0,
  });
  const [weapon, setWeapon] = useState<CreatorWeaponOption>(DEFAULT_WEAPON_OPTIONS[0]);
  const [weaponLibrarySource, setWeaponLibrarySource] = useState<SourceFilterValue>('my');
  const [selectedPowerParts, setSelectedPowerParts] = useState<SelectedPowerPart[]>([]);
  const [selectedPowerAdvancedParts, setSelectedPowerAdvancedParts] = useState<SelectedPowerPart[]>([]);
  const [selectedTechniqueParts, setSelectedTechniqueParts] = useState<SelectedTechniquePart[]>([]);

  const { data: powerParts = [], isLoading: powerPartsLoading, error: powerPartsError } = usePowerParts();
  const { data: techniqueParts = [], isLoading: techniquePartsLoading, error: techniquePartsError } = useTechniqueParts();
  const { data: userItems = [] } = useUserItems();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  const { data: officialItems = [] } = usePublicLibrary('items');

  const { fullOptions: allWeaponOptions, visibleOptions } = useCreatorWeaponOptions({
    defaults: DEFAULT_WEAPON_OPTIONS,
    userItems,
    officialWeaponItems: officialItems as Record<string, unknown>[],
    itemPropertiesDb,
    librarySource: weaponLibrarySource,
  });

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
    if ((weapon.tp ?? 0) < 1) return null;
    const part = findByIdOrName(powerParts, {
      id: PART_IDS.ADD_WEAPON_TO_POWER,
      name: 'Add Weapon to Power',
    });
    if (!part) return null;
    return {
      id: part.id,
      name: part.name,
      op_1_lvl: Math.max(0, (weapon.tp ?? 1) - 1),
      op_2_lvl: 0,
      op_3_lvl: 0,
      applyDuration: false,
    };
  }, [powerParts, weapon.tp]);

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
  const rangeDisplay = useMemo(() => deriveRange(powerPayload, powerParts), [powerParts, powerPayload]);
  const areaDisplay = useMemo(() => deriveArea(powerPayload, powerParts), [powerParts, powerPayload]);
  const durationDisplay = useMemo(() => deriveDuration(powerPayload, powerParts), [powerParts, powerPayload]);

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
    setWeapon(DEFAULT_WEAPON_OPTIONS[0]);
    setSelectedPowerParts([]);
    setSelectedPowerAdvancedParts([]);
    setSelectedTechniqueParts([]);
    localStorage.removeItem(CACHE_KEY);
  }, []);

  const getPayload = useCallback(() => {
    const powerPartsToSave = selectedPowerParts.map((selected) => ({
      id: Number(selected.part.id),
      name: selected.part.name,
      op_1_lvl: selected.op_1_lvl,
      op_2_lvl: selected.op_2_lvl,
      op_3_lvl: selected.op_3_lvl,
      applyDuration: selected.applyDuration,
    }));
    const powerAdvancedToSave = selectedPowerAdvancedParts.map((selected) => ({
      id: Number(selected.part.id),
      name: selected.part.name,
      op_1_lvl: selected.op_1_lvl,
      op_2_lvl: selected.op_2_lvl,
      op_3_lvl: selected.op_3_lvl,
      applyDuration: selected.applyDuration,
      isAdvanced: true,
    }));
    const techniquePartsToSave = selectedTechniqueParts.map((selected) => ({
      id: Number(selected.part.id),
      name: selected.part.name,
      op_1_lvl: selected.op_1_lvl,
      op_2_lvl: selected.op_2_lvl,
      op_3_lvl: selected.op_3_lvl,
    }));

    return {
      name: name.trim(),
      data: {
        name: name.trim(),
        description: description.trim(),
        empoweredTechnique: true,
        actionType,
        isReaction,
        power: {
          parts: powerPartsToSave,
          mechanics: powerAdvancedToSave,
          autoMechanics: powerMechanicParts,
          damage: powerDamages.filter((damage) => damage.type !== 'none' && damage.amount > 0),
          range,
          area,
          duration,
          addWeapon:
            shouldPersistCreatorWeaponId({
              weaponId: weapon.id,
              allowNoAttack: true,
            })
              ? weapon
              : null,
          addWeaponPowerPart: addWeaponToPowerPart,
        },
        technique: {
          parts: techniquePartsToSave,
          additionalDamage: techniqueDamage.amount > 0 ? [{ amount: techniqueDamage.amount, size: techniqueDamage.size }] : [],
          autoMechanics: techniqueDamageMechanicParts,
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
    costs.totalEnergy,
    costs.totalTP,
    description,
    duration,
    name,
    powerDamages,
    powerMechanicParts,
    range,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamage,
    techniqueDamageMechanicParts,
    weapon,
  ]);

  const save = useCreatorSave({
    type: 'empowered-techniques',
    getPayload,
    requirePublishConfirm: true,
    publishConfirmTitle: 'Publish to Realms Library',
    publishConfirmDescription: (itemName, { existingInPublic }) =>
      existingInPublic
        ? `Are you sure you want to override "${itemName}" (empowered technique)? The existing public technique with this name will be replaced.`
        : `Are you sure you wish to publish this empowered technique "${itemName}" to the Realms Library?`,
    successMessage: 'Empowered technique saved successfully!',
    publicSuccessMessage: 'Empowered technique saved to Realms Library!',
    onSaveSuccess: resetState,
  });

  const handleSave = useCallback(async () => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    await save.handleSave();
  }, [save, user]);

  const empoweredSelectableItems = load.selectableItems;

  const handleLoadEmpoweredTechnique = useCallback(
    (doc: unknown) => {
      const data = doc as {
        name?: string;
        description?: string;
        empoweredTechnique?: boolean;
        actionType?: string;
        isReaction?: boolean;
        power?: {
          parts?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean }>;
          mechanics?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean }>;
          autoMechanics?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean }>;
          damage?: DamageConfig[];
          range?: RangeConfig;
          area?: AreaConfig;
          duration?: DurationConfig;
          addWeapon?: CreatorWeaponOption | null;
          addWeaponPowerPart?: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number } | null;
        };
        technique?: {
          parts?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }>;
          additionalDamage?: Array<{ amount?: number; size?: number }>;
        };
      };

      if (!data.empoweredTechnique) return;
      resetState();
      setName(data.name || '');
      setDescription(data.description || '');
      setActionType(data.actionType || 'basic');
      setIsReaction(Boolean(data.isReaction));
      setPowerDamages(data.power?.damage && data.power.damage.length > 0 ? data.power.damage : [{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
      setRange(data.power?.range || { steps: 0 });
      setArea(data.power?.area || { type: 'none', level: 1, applyDuration: false });
      setDuration(
        data.power?.duration || {
          type: 'instant',
          value: 1,
          applyDuration: false,
          focus: false,
          noHarm: false,
          endsOnActivation: false,
          sustain: 0,
        }
      );

      const additionalDamage = data.technique?.additionalDamage?.[0];
      setTechniqueDamage({
        amount: additionalDamage?.amount ?? 0,
        size: additionalDamage?.size ?? 6,
      });

      if (data.power?.addWeapon) {
        const foundWeapon = allWeaponOptions.find(
          (option) => String(option.id) === String(data.power?.addWeapon?.id) || option.name === data.power?.addWeapon?.name
        );
        if (foundWeapon) setWeapon(foundWeapon);
      } else {
        const requiredWeaponTp = inferEmpoweredWeaponTpFromPowerPayload(data.power);
        if (requiredWeaponTp > 0) {
          const tpMatch = allWeaponOptions.find((option) => (option.tp ?? 0) === requiredWeaponTp);
          if (tpMatch) setWeapon(tpMatch);
        }
      }

      const loadedPowerParts = (data.power?.parts || []).map((part) => {
        const match = powerParts.find((dbPart) => String(dbPart.id) === String(part.id) || dbPart.name === part.name);
        if (!match) return null;
        return {
          part: match,
          op_1_lvl: part.op_1_lvl || 0,
          op_2_lvl: part.op_2_lvl || 0,
          op_3_lvl: part.op_3_lvl || 0,
          applyDuration: part.applyDuration || false,
          selectedCategory: match.category || 'any',
        } satisfies SelectedPowerPart;
      }).filter((row): row is SelectedPowerPart => row !== null);
      setSelectedPowerParts(loadedPowerParts);

      const loadedPowerMechanics = (data.power?.mechanics || []).map((part) => {
        const match = powerParts.find((dbPart) => String(dbPart.id) === String(part.id) || dbPart.name === part.name);
        if (!match) return null;
        return {
          part: match,
          op_1_lvl: part.op_1_lvl || 0,
          op_2_lvl: part.op_2_lvl || 0,
          op_3_lvl: part.op_3_lvl || 0,
          applyDuration: part.applyDuration || false,
          selectedCategory: match.category || 'any',
        } satisfies SelectedPowerPart;
      }).filter((row): row is SelectedPowerPart => row !== null);
      setSelectedPowerAdvancedParts(loadedPowerMechanics);

      const loadedTechniqueParts = (data.technique?.parts || []).map((part) => {
        const match = techniqueParts.find((dbPart) => String(dbPart.id) === String(part.id) || dbPart.name === part.name);
        if (!match) return null;
        return {
          part: match,
          op_1_lvl: part.op_1_lvl || 0,
          op_2_lvl: part.op_2_lvl || 0,
          op_3_lvl: part.op_3_lvl || 0,
          selectedCategory: match.category || 'any',
        } satisfies SelectedTechniquePart;
      }).filter((row): row is SelectedTechniquePart => row !== null);
      setSelectedTechniqueParts(loadedTechniqueParts);
    },
    [allWeaponOptions, powerParts, resetState, techniqueParts]
  );

  useEffect(() => {
    if (isInitialized || powerParts.length === 0 || techniqueParts.length === 0 || editId) return;
    try {
      const raw = localStorage.getItem(CACHE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as EmpoweredTechniqueCache;
        const thirtyDays = 30 * 24 * 60 * 60 * 1000;
        if (Date.now() - parsed.timestamp < thirtyDays) {
          setName(parsed.name || '');
          setDescription(parsed.description || '');
          setActionType(parsed.actionType || 'basic');
          setIsReaction(Boolean(parsed.isReaction));
          setPowerDamages(parsed.powerDamages || [{ amount: 0, size: 6, type: 'none', applyDuration: false }]);
          setTechniqueDamage(parsed.techniqueDamage || { amount: 0, size: 6 });
          setRange(parsed.range || { steps: 0 });
          setArea(parsed.area || { type: 'none', level: 1, applyDuration: false });
          setDuration(parsed.duration || {
            type: 'instant',
            value: 1,
            applyDuration: false,
            focus: false,
            noHarm: false,
            endsOnActivation: false,
            sustain: 0,
          });
          const selectedWeapon = allWeaponOptions.find((option) => String(option.id) === String(parsed.weaponId));
          if (selectedWeapon) setWeapon(selectedWeapon);

          setSelectedPowerParts(
            (parsed.selectedPowerParts || [])
              .map((row) => {
                const part = powerParts.find((dbPart) => String(dbPart.id) === String(row.partId));
                if (!part) return null;
                return {
                  part,
                  op_1_lvl: row.op_1_lvl,
                  op_2_lvl: row.op_2_lvl,
                  op_3_lvl: row.op_3_lvl,
                  applyDuration: row.applyDuration,
                  selectedCategory: row.selectedCategory,
                } satisfies SelectedPowerPart;
              })
              .filter((row): row is SelectedPowerPart => row !== null)
          );
          setSelectedPowerAdvancedParts(
            (parsed.selectedPowerAdvancedParts || [])
              .map((row) => {
                const part = powerParts.find((dbPart) => String(dbPart.id) === String(row.partId));
                if (!part) return null;
                return {
                  part,
                  op_1_lvl: row.op_1_lvl,
                  op_2_lvl: row.op_2_lvl,
                  op_3_lvl: row.op_3_lvl,
                  applyDuration: row.applyDuration,
                  selectedCategory: row.selectedCategory,
                } satisfies SelectedPowerPart;
              })
              .filter((row): row is SelectedPowerPart => row !== null)
          );
          setSelectedTechniqueParts(
            (parsed.selectedTechniqueParts || [])
              .map((row) => {
                const part = techniqueParts.find((dbPart) => String(dbPart.id) === String(row.partId));
                if (!part) return null;
                return {
                  part,
                  op_1_lvl: row.op_1_lvl,
                  op_2_lvl: row.op_2_lvl,
                  op_3_lvl: row.op_3_lvl,
                  selectedCategory: row.selectedCategory,
                } satisfies SelectedTechniquePart;
              })
              .filter((row): row is SelectedTechniquePart => row !== null)
          );
        } else {
          localStorage.removeItem(CACHE_KEY);
        }
      }
    } catch (error) {
      console.error('Failed to restore empowered technique cache:', error);
    } finally {
      setIsInitialized(true);
    }
  }, [allWeaponOptions, editId, isInitialized, powerParts, techniqueParts]);

  useEffect(() => {
    if (!isInitialized) return;
    const cache: EmpoweredTechniqueCache = {
      name,
      description,
      actionType,
      isReaction,
      powerDamages,
      techniqueDamage,
      weaponId: weapon.id,
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
      timestamp: Date.now(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  }, [
    actionType,
    area,
    description,
    duration,
    isInitialized,
    isReaction,
    name,
    powerDamages,
    range,
    selectedPowerAdvancedParts,
    selectedPowerParts,
    selectedTechniqueParts,
    techniqueDamage,
    weapon.id,
  ]);

  useEffect(() => {
    if (!editId || !load.rawItems.length || powerParts.length === 0 || techniqueParts.length === 0 || editLoadedRef.current) return;
    const match = load.rawItems.find((item: { docId?: string; id?: string }) => String(item.docId) === editId || String(item.id) === editId);
    editLoadedRef.current = true;
    if (!match) {
      setIsInitialized(true);
      return;
    }
    handleLoadEmpoweredTechnique(match);
    localStorage.removeItem(CACHE_KEY);
    setIsInitialized(true);
  }, [editId, handleLoadEmpoweredTechnique, load.rawItems, powerParts.length, techniqueParts.length]);

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

  if (powerPartsLoading || techniquePartsLoading) {
    return (
      <PageContainer size="xl">
        <LoadingState message="Loading empowered technique creator..." />
      </PageContainer>
    );
  }
  if (powerPartsError || techniquePartsError) {
    return (
      <PageContainer size="xl">
        <Alert variant="danger">
          Failed to load creator data: {(powerPartsError || techniquePartsError)?.message}
        </Alert>
      </PageContainer>
    );
  }

  return (
    <CreatorLayout
      icon={<Wand2 className="w-8 h-8 text-primary-600" />}
      title="Empowered Technique Creator"
      description="Build an empowered technique by combining power and technique parts in one shared action profile."
      actions={
        <div className="flex items-center gap-2">
          <ContextHelpTooltip
            tooltipKey="creators.empowered.headerHelp"
            scope="page:/empowered-technique-creator"
            label="Empowered technique creator help"
            placement="left"
          />
          <CreatorSaveToolbar
            saveTarget={save.saveTarget}
            onSaveTargetChange={save.setSaveTarget}
            onSave={handleSave}
            onLoad={() => (user ? load.openLoadModal() : setShowLoginPrompt(true))}
            onReset={resetState}
            saving={save.saving}
            saveDisabled={!name.trim()}
            showPublicPrivate={isAdmin}
            user={user}
          />
        </div>
      }
      sidebar={
        <div className="self-start sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto space-y-6">
          <CreatorSummaryPanel
            title="Empowered Technique Summary"
            costStats={[
              { label: 'Energy Cost', value: costs.totalEnergy, icon: <Zap className="w-6 h-6" />, color: 'energy' },
              { label: 'Training Points', value: costs.totalTP, icon: <Target className="w-6 h-6" />, color: 'tp' },
            ]}
            statRows={[
              { label: 'Action', value: actionDisplay },
              { label: 'Weapon', value: weapon.name },
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
        </div>
      }
      modals={
        <>
          <LoadFromLibraryModal
            isOpen={load.showLoadModal}
            onClose={load.closeLoadModal}
            selectableItems={empoweredSelectableItems}
            columns={load.columns}
            gridColumns={load.gridColumns}
            headerExtra={<SourceFilter value={load.source} onChange={load.setSource} />}
            emptyMessage="No empowered techniques found."
            emptySubMessage="Save an empowered technique from this creator to load it later."
            searchPlaceholder="Search empowered techniques..."
            isLoading={load.isLoading}
            error={load.error}
            title="Load Empowered Technique"
            onSelect={(selected) => handleLoadEmpoweredTechnique(selected.data)}
          />
          <LoginPromptModal
            isOpen={showLoginPrompt}
            onClose={() => setShowLoginPrompt(false)}
            returnPath="/empowered-technique-creator"
            contentType="technique"
          />
          <ConfirmActionModal
            isOpen={save.showPublishConfirm}
            onClose={() => save.setShowPublishConfirm(false)}
            onConfirm={() => save.confirmPublish()}
            title={save.publishConfirmTitle}
            description={save.publishConfirmDescription?.(name.trim(), { existingInPublic: save.publishExistingInPublic }) ?? ''}
            confirmLabel="Publish"
            icon="publish"
          />
        </>
      }
    >
      <div className="bg-surface rounded-xl shadow-md p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Empowered Technique Name *</label>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter empowered technique name..." />
        </div>
        <div>
          <label className="block text-sm font-medium text-text-secondary mb-1">Description</label>
          <Textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Describe your empowered technique..." />
        </div>
      </div>

      <CollapsibleSection
        title="Shared Action Profile"
        collapsedSummary={`${actionDisplay} • ${weapon.name}`}
        defaultExpanded={true}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.action.energyRaw} tp={sectionCosts.action.totalTP} />
            <SectionCostBadge en={sectionCosts.weapon.energyRaw} tp={sectionCosts.weapon.totalTP} />
          </>
        }
      >
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-1">Action Type</label>
            <select
              value={actionType}
              onChange={(event) => setActionType(event.target.value)}
              className="w-full px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              aria-label="Empowered technique action type"
            >
              {ACTION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <CreatorWeaponPicker
            librarySource={weaponLibrarySource}
            onLibrarySourceChange={setWeaponLibrarySource}
            fullOptions={allWeaponOptions}
            visibleOptions={visibleOptions}
            weapon={weapon}
            onWeaponChange={setWeapon}
            label="Weapon (Add Weapon to Power)"
            ariaLabel="Empowered technique weapon"
          />
        </div>
        <div className="mt-4">
          <Checkbox checked={isReaction} onChange={(event) => setIsReaction(event.target.checked)} label="Can be used as a Reaction" />
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Power Configuration"
        collapsedSummary={`${rangeDisplay} • ${area.type === 'none' ? 'Single target' : formatAreaForDisplay(area.type, area.level)} • ${duration.type === 'instant' ? 'Instant' : formatDurationFromTypeAndValue(duration.type, duration.value)}`}
        defaultExpanded={true}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-4">
            <SectionCostBadge en={sectionCosts.range.energyRaw} tp={sectionCosts.range.totalTP} />
            <ValueStepper value={range.steps} onChange={(value) => setRange({ steps: value })} label="Range:" min={0} max={10} />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <SectionCostBadge en={sectionCosts.area.energyRaw} tp={sectionCosts.area.totalTP} />
            <select
              value={area.type}
              onChange={(event) => setArea((previous) => ({ ...previous, type: event.target.value as AreaConfig['type'] }))}
              className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              aria-label="Empowered technique area type"
            >
              {AREA_TYPES.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {area.type !== 'none' && (
              <>
                <ValueStepper value={area.level} onChange={(value) => setArea((previous) => ({ ...previous, level: value }))} label="Area Level:" min={1} max={10} />
                <Checkbox
                  checked={area.applyDuration ?? false}
                  onChange={(event) => setArea((previous) => ({ ...previous, applyDuration: event.target.checked }))}
                  label="Apply duration"
                />
              </>
            )}
          </div>
          <div className="space-y-3 pt-2 border-t border-border-light">
            <div className="flex flex-wrap items-center gap-4">
              <SectionCostBadge en={sectionCosts.duration.energyRaw} tp={sectionCosts.duration.totalTP} />
              <select
                value={duration.type}
                onChange={(event) => {
                  const nextType = event.target.value as DurationConfig['type'];
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
                }}
                className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
                aria-label="Empowered technique duration type"
              >
                {DURATION_TYPES.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {duration.type !== 'instant' && duration.type !== 'permanent' && DURATION_VALUES[duration.type] && (
                <select
                  value={duration.value}
                  onChange={(event) => setDuration((previous) => ({ ...previous, value: Number(event.target.value) }))}
                  className="px-4 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
                  aria-label="Empowered technique duration value"
                >
                  {DURATION_VALUES[duration.type].map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
            </div>
            {duration.type !== 'instant' && (
              <div className="flex flex-wrap items-center gap-4">
                <Checkbox checked={duration.focus || false} onChange={(event) => setDuration((previous) => ({ ...previous, focus: event.target.checked }))} label="Focus" />
                <Checkbox checked={duration.noHarm || false} onChange={(event) => setDuration((previous) => ({ ...previous, noHarm: event.target.checked }))} label="No Harm or Adaptation Parts" />
                <Checkbox checked={duration.endsOnActivation || false} onChange={(event) => setDuration((previous) => ({ ...previous, endsOnActivation: event.target.checked }))} label="Ends on Activation" />
                <select
                  value={duration.sustain || 0}
                  onChange={(event) => setDuration((previous) => ({ ...previous, sustain: Number(event.target.value) }))}
                  className="px-2 py-1 border border-border-light rounded text-sm text-text-primary bg-surface"
                  aria-label="Empowered technique sustain action points"
                >
                  <option value={0}>Sustain: None</option>
                  <option value={1}>Sustain: 1 AP</option>
                  <option value={2}>Sustain: 2 AP</option>
                  <option value={3}>Sustain: 3 AP</option>
                  <option value={4}>Sustain: 4 AP</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection
        title="Power Damage (Add Damage)"
        collapsedSummary={powerDamageSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.powerDamage.energyRaw} tp={sectionCosts.powerDamage.totalTP} />}
      >
        {powerDamages.map((damage, index) => (
          <div key={index} className="flex flex-wrap items-center gap-4 mb-4 p-3 rounded-lg bg-surface-alt border border-border-light">
            {damage.type !== 'none' && damage.amount > 0 && (
              <Checkbox
                checked={damage.applyDuration ?? false}
                onChange={(event) =>
                  setPowerDamages((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, applyDuration: event.target.checked } : row)))
                }
                label="Apply duration"
              />
            )}
            <ValueStepper
              value={damage.amount}
              onChange={(value) => setPowerDamages((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, amount: value } : row)))}
              label="Dice:"
              min={0}
              max={20}
            />
            <div className="flex items-center gap-1">
              <span className="font-bold text-lg">d</span>
              <select
                value={damage.size}
                onChange={(event) => setPowerDamages((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, size: Number(event.target.value) } : row)))}
                className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
                aria-label={`Power damage die size row ${index + 1}`}
              >
                {DIE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </div>
            <select
              value={damage.type}
              onChange={(event) => setPowerDamages((previous) => previous.map((row, rowIndex) => (rowIndex === index ? { ...row, type: event.target.value } : row)))}
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              aria-label={`Power damage type row ${index + 1}`}
            >
              {POWER_DAMAGE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'none' ? 'No damage' : type.charAt(0).toUpperCase() + type.slice(1)}
                </option>
              ))}
            </select>
            {powerDamages.length > 1 && (
              <Button type="button" variant="danger" size="sm" onClick={() => setPowerDamages((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}>
                Remove
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => setPowerDamages((previous) => [...previous, { amount: 0, size: 6, type: 'none', applyDuration: false }])}
          className="min-h-[44px]"
        >
          <Plus className="w-4 h-4 mr-1 inline" aria-hidden />
          Add damage type
        </Button>
      </CollapsibleSection>

      <CollapsibleSection
        title={`Power Parts (${selectedPowerParts.length})`}
        collapsedSummary={selectedPowerParts.length > 0 ? `${selectedPowerParts.slice(0, 3).map((row) => row.part.name).join(', ')}${selectedPowerParts.length > 3 ? ` +${selectedPowerParts.length - 3} more` : ''}` : 'No parts'}
        defaultExpanded={true}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.powerParts.energyRaw} tp={sectionCosts.powerParts.totalTP} />
            <Button type="button" variant="primary" size="sm" className="flex items-center gap-1" onClick={addPowerPart}>
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedPowerParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No power parts added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedPowerParts.map((selected, index) => (
              <PowerPartCard
                key={`power-part-${index}`}
                selectedPart={selected}
                _index={index}
                onRemove={() => setSelectedPowerParts((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
                onUpdate={(updates) =>
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
                        : row
                    )
                  )
                }
                allParts={nonMechanicPowerParts}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Power Mechanics (${selectedPowerAdvancedParts.length})`}
        collapsedSummary={selectedPowerAdvancedParts.length > 0 ? `${selectedPowerAdvancedParts.slice(0, 3).map((row) => row.part.name).join(', ')}${selectedPowerAdvancedParts.length > 3 ? ` +${selectedPowerAdvancedParts.length - 3} more` : ''}` : 'No mechanics'}
        defaultExpanded={true}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.powerMechanics.energyRaw} tp={sectionCosts.powerMechanics.totalTP} />
            <Button type="button" variant="primary" size="sm" className="flex items-center gap-1" onClick={addPowerMechanicPart}>
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedPowerAdvancedParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No additional power mechanics added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedPowerAdvancedParts.map((selected, index) => (
              <PowerPartCard
                key={`power-mechanic-${index}`}
                selectedPart={selected}
                _index={index}
                onRemove={() => setSelectedPowerAdvancedParts((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
                onUpdate={(updates) =>
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
                        : row
                    )
                  )
                }
                allParts={powerMechanicsForList}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title={`Technique Parts (${selectedTechniqueParts.length})`}
        collapsedSummary={selectedTechniqueParts.length > 0 ? `${selectedTechniqueParts.slice(0, 3).map((row) => row.part.name).join(', ')}${selectedTechniqueParts.length > 3 ? ` +${selectedTechniqueParts.length - 3} more` : ''}` : 'No parts'}
        defaultExpanded={true}
        rightSlot={
          <>
            <SectionCostBadge en={sectionCosts.techniqueParts.energyRaw} tp={sectionCosts.techniqueParts.totalTP} />
            <Button type="button" variant="primary" size="sm" className="flex items-center gap-1" onClick={addTechniquePart}>
              <Plus className="w-4 h-4" />
              Add Part
            </Button>
          </>
        }
      >
        {selectedTechniqueParts.length === 0 ? (
          <div className="text-center py-8 text-text-muted dark:text-text-secondary">
            <Info className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No technique parts added yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {selectedTechniqueParts.map((selected, index) => (
              <PowerPartCard
                key={`technique-part-${index}`}
                selectedPart={{ ...selected, applyDuration: false }}
                _index={index}
                onRemove={() => setSelectedTechniqueParts((previous) => previous.filter((_, rowIndex) => rowIndex !== index))}
                onUpdate={(updates) =>
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
                        : row
                    )
                  )
                }
                allParts={nonMechanicTechniqueParts}
                showApplyDuration={false}
              />
            ))}
          </div>
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="Additional Damage (Technique)"
        collapsedSummary={techniqueDamageSummary}
        defaultExpanded={true}
        rightSlot={<SectionCostBadge en={sectionCosts.techniqueDamage.energyRaw} tp={sectionCosts.techniqueDamage.totalTP} />}
      >
        <p className="text-sm text-text-secondary mb-4">This is the technique additional-damage mechanic (separate from power Add Damage).</p>
        <div className="flex flex-wrap items-center gap-4">
          <ValueStepper value={techniqueDamage.amount} onChange={(value) => setTechniqueDamage((previous) => ({ ...previous, amount: value }))} label="Dice:" min={0} max={20} />
          <div className="flex items-center gap-1">
            <span className="font-bold text-lg">d</span>
            <select
              value={techniqueDamage.size}
              onChange={(event) => setTechniqueDamage((previous) => ({ ...previous, size: Number(event.target.value) }))}
              className="px-3 py-2 border border-border-light rounded-lg text-text-primary bg-surface"
              aria-label="Technique additional damage die size"
            >
              {DIE_SIZES.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        </div>
      </CollapsibleSection>
    </CreatorLayout>
  );
}

export default function EmpoweredTechniqueCreatorPage() {
  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
        <EmpoweredTechniqueCreatorContent />
      </Suspense>
    </div>
  );
}
