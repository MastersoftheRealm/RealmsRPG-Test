/**
 * Pure bootstrap helpers for power creator — cache restore and library load.
 * Used at workspace mount (remount key) so hydrate logic stays out of useEffect.
 */

import type { PowerPart } from '@/hooks';
import type { AreaConfig, DurationConfig } from '@/lib/calculators';
import { derivePowerAttackMode, normalizeAttackMode, type AttackMode } from '@/lib/attack-mode';
import { readCreatorCache } from '@/lib/game/creator-cache';
import {
  ADVANCED_CATEGORIES,
  EXCLUDED_PARTS,
  POWER_CREATOR_CACHE_KEY,
} from './power-creator-constants';
import type { AdvancedPart, DamageConfig, RangeConfig, SelectedPart } from './power-creator-types';

type PowerLibraryRecord = {
  name?: string;
  description?: string;
  parts?: unknown;
  powerParts?: unknown;
  damage?: unknown;
  actionType?: string;
  isReaction?: boolean;
  attackMode?: unknown;
  weapon?: { id?: string | number; name?: string };
  range?: { steps?: number };
  area?: { type?: string; level?: number; applyDuration?: boolean };
  duration?: {
    type?: string;
    value?: number;
    applyDuration?: boolean;
    focus?: boolean;
    noHarm?: boolean;
    endsOnActivation?: boolean;
    sustain?: number;
  };
  imageId?: string | null;
  image_id?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
};

export interface PowerCreatorCache {
  name: string;
  description: string;
  selectedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    applyDuration: boolean;
    selectedCategory: string;
  }>;
  selectedAdvancedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    applyDuration: boolean;
  }>;
  actionType: string;
  isReaction: boolean;
  damage: DamageConfig | DamageConfig[];
  range: RangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  attackMode: AttackMode;
  imageId?: string | null;
  imageUrl?: string | null;
  timestamp: number;
}

export interface PowerCreatorFormState {
  name: string;
  description: string;
  selectedParts: SelectedPart[];
  selectedAdvancedParts: AdvancedPart[];
  actionType: string;
  isReaction: boolean;
  damages: DamageConfig[];
  range: RangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  attackMode: AttackMode;
  imageId: string | null;
  imageUrl: string | null;
}

const DEFAULT_DURATION: DurationConfig = {
  type: 'instant',
  value: 1,
  applyDuration: false,
  focus: false,
  noHarm: false,
  endsOnActivation: false,
  sustain: 0,
};

export function emptyPowerCreatorFormState(): PowerCreatorFormState {
  return {
    name: '',
    description: '',
    selectedParts: [],
    selectedAdvancedParts: [],
    actionType: 'basic',
    isReaction: false,
    damages: [{ amount: 0, size: 6, type: 'none', applyDuration: false }],
    range: { steps: 0 },
    area: { type: 'none', level: 1, applyDuration: false },
    duration: DEFAULT_DURATION,
    attackMode: 'none',
    imageId: null,
    imageUrl: null,
  };
}

function restorePartsFromCache(
  savedParts: PowerCreatorCache['selectedParts'],
  powerParts: PowerPart[],
): SelectedPart[] {
  const restored: SelectedPart[] = [];
  for (const savedPart of savedParts) {
    const foundPart = powerParts.find((p) => String(p.id) === String(savedPart.partId));
    if (foundPart) {
      restored.push({
        part: foundPart,
        op_1_lvl: savedPart.op_1_lvl,
        op_2_lvl: savedPart.op_2_lvl,
        op_3_lvl: savedPart.op_3_lvl,
        applyDuration: savedPart.applyDuration,
        selectedCategory: savedPart.selectedCategory,
      });
    }
  }
  return restored;
}

function restoreAdvancedFromCache(
  savedParts: PowerCreatorCache['selectedAdvancedParts'],
  powerParts: PowerPart[],
): AdvancedPart[] {
  const restored: AdvancedPart[] = [];
  for (const savedPart of savedParts) {
    const foundPart = powerParts.find((p) => String(p.id) === String(savedPart.partId));
    if (foundPart) {
      restored.push({
        part: foundPart,
        op_1_lvl: savedPart.op_1_lvl,
        op_2_lvl: savedPart.op_2_lvl,
        op_3_lvl: savedPart.op_3_lvl,
        applyDuration: savedPart.applyDuration,
        selectedCategory: foundPart.category || 'any',
      });
    }
  }
  return restored;
}

export function restorePowerCreatorFromCache(
  powerParts: PowerPart[],
): PowerCreatorFormState | null {
  const parsed = readCreatorCache<PowerCreatorCache>(POWER_CREATOR_CACHE_KEY);
  if (!parsed) return null;

  const base = emptyPowerCreatorFormState();
  const d = parsed.damage;
  const damages =
    Array.isArray(d) && d.length > 0
      ? d.map((x) => ({ ...x, applyDuration: x.applyDuration ?? false }))
      : d && !Array.isArray(d)
        ? [
            {
              ...d,
              amount: d.amount ?? 0,
              size: d.size ?? 6,
              type: d.type ?? 'none',
              applyDuration: d.applyDuration ?? false,
            },
          ]
        : base.damages;

  return {
    name: parsed.name || '',
    description: parsed.description || '',
    selectedParts: parsed.selectedParts?.length
      ? restorePartsFromCache(parsed.selectedParts, powerParts)
      : [],
    selectedAdvancedParts: parsed.selectedAdvancedParts?.length
      ? restoreAdvancedFromCache(parsed.selectedAdvancedParts, powerParts)
      : [],
    actionType: parsed.actionType || 'basic',
    isReaction: parsed.isReaction || false,
    damages,
    range: parsed.range || base.range,
    area: parsed.area || base.area,
    duration: parsed.duration || base.duration,
    attackMode: normalizeAttackMode(parsed.attackMode) ?? 'none',
    imageId: parsed.imageId ?? null,
    imageUrl: parsed.imageUrl ?? null,
  };
}

export function powerLibraryRecordToFormState(
  power: PowerLibraryRecord,
  powerParts: PowerPart[],
): PowerCreatorFormState {
  const savedParts = (power.parts || power.powerParts || []) as Array<{
    id?: number | string;
    name?: string;
    op_1_lvl?: number;
    op_2_lvl?: number;
    op_3_lvl?: number;
    applyDuration?: boolean;
    isAdvanced?: boolean;
  }>;

  const loadedParts: SelectedPart[] = [];
  const loadedAdvancedParts: AdvancedPart[] = [];

  for (const savedPart of savedParts) {
    const matchedPart = powerParts.find(
      (p) => p.id === String(savedPart.id) || p.name === savedPart.name,
    );

    if (matchedPart) {
      if (EXCLUDED_PARTS.has(matchedPart.name)) continue;

      const partData = {
        part: matchedPart,
        op_1_lvl: savedPart.op_1_lvl || 0,
        op_2_lvl: savedPart.op_2_lvl || 0,
        op_3_lvl: savedPart.op_3_lvl || 0,
        applyDuration: savedPart.applyDuration || false,
      };

      if (
        savedPart.isAdvanced ||
        (matchedPart.mechanic &&
          ADVANCED_CATEGORIES.includes(matchedPart.category as (typeof ADVANCED_CATEGORIES)[number]))
      ) {
        loadedAdvancedParts.push({
          ...partData,
          selectedCategory: matchedPart.category || 'any',
        });
      } else if (!matchedPart.mechanic) {
        loadedParts.push({
          ...partData,
          selectedCategory: matchedPart.category || 'any',
        });
      }
    }
  }

  let damageData: Array<{ amount?: number; size?: number; type?: string; applyDuration?: boolean }> =
    [];
  if (Array.isArray(power.damage)) {
    damageData = power.damage;
  } else if (power.damage && typeof power.damage === 'object') {
    const d = power.damage as {
      dice?: number;
      amount?: number;
      sides?: number;
      size?: number;
      type?: string;
      applyDuration?: boolean;
    };
    damageData = [
      {
        amount: d.dice ?? d.amount ?? 0,
        size: d.sides ?? d.size ?? 6,
        type: d.type ?? 'none',
        applyDuration: d.applyDuration ?? false,
      },
    ];
  }

  const damages =
    damageData.length > 0
      ? damageData.map((dmg) => ({
          amount: dmg.amount ?? 0,
          size: dmg.size ?? 6,
          type: dmg.type ?? 'none',
          applyDuration: dmg.applyDuration ?? false,
        }))
      : [{ amount: 0, size: 6, type: 'none', applyDuration: false }];

  const attackMode = derivePowerAttackMode({
    attackMode: power.attackMode,
    parts: savedParts,
    weapon: power.weapon,
  });

  return {
    name: power.name || '',
    description: power.description || '',
    selectedParts: loadedParts,
    selectedAdvancedParts: loadedAdvancedParts,
    actionType: power.actionType || 'basic',
    isReaction: power.isReaction || false,
    damages,
    range: power.range ? { steps: power.range.steps || 0 } : { steps: 0 },
    area: power.area
      ? {
          type: (power.area.type || 'none') as AreaConfig['type'],
          level: power.area.level || 1,
          applyDuration: power.area.applyDuration || false,
        }
      : { type: 'none', level: 1, applyDuration: false },
    duration: power.duration
      ? {
          type: (power.duration.type || 'instant') as DurationConfig['type'],
          value: power.duration.value || 1,
          applyDuration: power.duration.applyDuration || false,
          focus: power.duration.focus || false,
          noHarm: power.duration.noHarm || false,
          endsOnActivation: power.duration.endsOnActivation || false,
          sustain: power.duration.sustain || 0,
        }
      : DEFAULT_DURATION,
    attackMode,
    imageId: power.imageId ?? power.image_id ?? null,
    imageUrl: power.imageUrl ?? power.image_url ?? null,
  };
}

/**
 * Pure — safe to call during render. The ?edit= draft-cache clear happens in a
 * workspace mount effect, not here.
 */
export function bootstrapPowerCreatorFormState(options: {
  editPowerId: string | null;
  powerParts: PowerPart[];
  rawItems: unknown[];
}): PowerCreatorFormState {
  const { editPowerId, powerParts, rawItems } = options;

  if (editPowerId) {
    const powerToEdit = rawItems.find((p) => {
      const row = p as { docId?: string; id?: string };
      return String(row.docId) === editPowerId || String(row.id) === editPowerId;
    });
    if (!powerToEdit) {
      return emptyPowerCreatorFormState();
    }
    return powerLibraryRecordToFormState(
      powerToEdit as PowerLibraryRecord,
      powerParts,
    );
  }

  return (
    restorePowerCreatorFromCache(powerParts) ??
    emptyPowerCreatorFormState()
  );
}
