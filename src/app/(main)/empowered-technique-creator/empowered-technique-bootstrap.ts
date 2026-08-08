/**
 * Pure bootstrap helpers for empowered technique creator — cache restore and
 * library load. Used at workspace mount (remount key) so hydrate logic stays
 * out of useEffect. All functions are pure / render-safe (no localStorage writes).
 */

import type { PowerPart, TechniquePart } from '@/hooks';
import type { AreaConfig, DurationConfig } from '@/lib/calculators';
import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { readCreatorCache } from '@/lib/game/creator-cache';
import { deriveEmpoweredAttackMode, normalizeAttackMode, type AttackMode } from '@/lib/attack-mode';

export const EMPOWERED_TECHNIQUE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.EMPOWERED_TECHNIQUE;

export interface EmpoweredDamageConfig {
  amount: number;
  size: number;
  type: string;
  applyDuration?: boolean;
}

export interface EmpoweredRangeConfig {
  steps: number;
}

export interface SelectedPowerPart {
  part: PowerPart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  applyDuration: boolean;
  selectedCategory: string;
}

export interface SelectedTechniquePart {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory: string;
}

export interface EmpoweredTechniqueCache {
  name: string;
  description: string;
  actionType: string;
  isReaction: boolean;
  powerDamages: EmpoweredDamageConfig[];
  techniqueDamage: { amount: number; size: number };
  attackMode: AttackMode;
  range: EmpoweredRangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  selectedPowerParts: Array<{ partId: string | number; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; applyDuration: boolean; selectedCategory: string }>;
  selectedPowerAdvancedParts: Array<{ partId: string | number; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; applyDuration: boolean; selectedCategory: string }>;
  selectedTechniqueParts: Array<{ partId: string | number; op_1_lvl: number; op_2_lvl: number; op_3_lvl: number; selectedCategory: string }>;
  imageId?: string | null;
  imageUrl?: string | null;
  timestamp: number;
}

export interface EmpoweredTechniqueFormState {
  name: string;
  description: string;
  actionType: string;
  isReaction: boolean;
  powerDamages: EmpoweredDamageConfig[];
  techniqueDamage: { amount: number; size: number };
  range: EmpoweredRangeConfig;
  area: AreaConfig;
  duration: DurationConfig;
  attackMode: AttackMode;
  selectedPowerParts: SelectedPowerPart[];
  selectedPowerAdvancedParts: SelectedPowerPart[];
  selectedTechniqueParts: SelectedTechniquePart[];
  imageId: string | null;
  imageUrl: string | null;
}

export type EmpoweredLibraryRecord = {
  name?: string;
  description?: string;
  empoweredTechnique?: boolean;
  actionType?: string;
  isReaction?: boolean;
  attackMode?: unknown;
  imageId?: string | null;
  image_id?: string | null;
  imageUrl?: string | null;
  image_url?: string | null;
  power?: {
    parts?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean }>;
    mechanics?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean }>;
    autoMechanics?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean }>;
    damage?: EmpoweredDamageConfig[];
    range?: EmpoweredRangeConfig;
    area?: AreaConfig;
    duration?: DurationConfig;
    /** @deprecated Legacy persisted weapon reference; read-only for older rows. */
    addWeapon?: { id?: string | number; name?: string } | null;
    addWeaponPowerPart?: { id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number } | null;
  };
  technique?: {
    parts?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }>;
    autoMechanics?: Array<{ id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number }>;
    additionalDamage?: Array<{ amount?: number; size?: number }>;
  };
};

const DEFAULT_DURATION: DurationConfig = {
  type: 'instant',
  value: 1,
  applyDuration: false,
  focus: false,
  noHarm: false,
  endsOnActivation: false,
  sustain: 0,
};

export function emptyEmpoweredTechniqueFormState(): EmpoweredTechniqueFormState {
  return {
    name: '',
    description: '',
    actionType: 'basic',
    isReaction: false,
    powerDamages: [{ amount: 0, size: 6, type: 'none', applyDuration: false }],
    techniqueDamage: { amount: 0, size: 6 },
    range: { steps: 0 },
    area: { type: 'none', level: 1, applyDuration: false },
    duration: DEFAULT_DURATION,
    attackMode: 'none',
    selectedPowerParts: [],
    selectedPowerAdvancedParts: [],
    selectedTechniqueParts: [],
    imageId: null,
    imageUrl: null,
  };
}

function mapPowerRows(
  rows: Array<{ partId?: string | number; id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; applyDuration?: boolean; selectedCategory?: string }>,
  powerParts: PowerPart[],
  matchByName: boolean,
): SelectedPowerPart[] {
  return rows
    .map((row) => {
      const key = row.partId ?? row.id;
      const part = powerParts.find(
        (dbPart) =>
          String(dbPart.id) === String(key) || (matchByName && dbPart.name === row.name),
      );
      if (!part) return null;
      return {
        part,
        op_1_lvl: row.op_1_lvl || 0,
        op_2_lvl: row.op_2_lvl || 0,
        op_3_lvl: row.op_3_lvl || 0,
        applyDuration: row.applyDuration || false,
        selectedCategory: row.selectedCategory ?? (part.category || 'any'),
      } satisfies SelectedPowerPart;
    })
    .filter((row): row is SelectedPowerPart => row !== null);
}

function mapTechniqueRows(
  rows: Array<{ partId?: string | number; id?: string | number; name?: string; op_1_lvl?: number; op_2_lvl?: number; op_3_lvl?: number; selectedCategory?: string }>,
  techniqueParts: TechniquePart[],
  matchByName: boolean,
): SelectedTechniquePart[] {
  return rows
    .map((row) => {
      const key = row.partId ?? row.id;
      const part = techniqueParts.find(
        (dbPart) =>
          String(dbPart.id) === String(key) || (matchByName && dbPart.name === row.name),
      );
      if (!part) return null;
      return {
        part,
        op_1_lvl: row.op_1_lvl || 0,
        op_2_lvl: row.op_2_lvl || 0,
        op_3_lvl: row.op_3_lvl || 0,
        selectedCategory: row.selectedCategory ?? (part.category || 'any'),
      } satisfies SelectedTechniquePart;
    })
    .filter((row): row is SelectedTechniquePart => row !== null);
}

export function restoreEmpoweredTechniqueFromCache(
  powerParts: PowerPart[],
  techniqueParts: TechniquePart[],
): EmpoweredTechniqueFormState | null {
  const parsed = readCreatorCache<EmpoweredTechniqueCache>(EMPOWERED_TECHNIQUE_CREATOR_CACHE_KEY);
  if (!parsed) return null;

  const base = emptyEmpoweredTechniqueFormState();

  return {
    name: parsed.name || '',
    description: parsed.description || '',
    actionType: parsed.actionType || 'basic',
    isReaction: Boolean(parsed.isReaction),
    powerDamages: parsed.powerDamages || base.powerDamages,
    techniqueDamage: parsed.techniqueDamage || base.techniqueDamage,
    range: parsed.range || base.range,
    area: parsed.area || base.area,
    duration: parsed.duration || base.duration,
    attackMode: normalizeAttackMode(parsed.attackMode) ?? 'none',
    selectedPowerParts: mapPowerRows(parsed.selectedPowerParts || [], powerParts, false),
    selectedPowerAdvancedParts: mapPowerRows(
      parsed.selectedPowerAdvancedParts || [],
      powerParts,
      false,
    ),
    selectedTechniqueParts: mapTechniqueRows(
      parsed.selectedTechniqueParts || [],
      techniqueParts,
      false,
    ),
    imageId: parsed.imageId ?? null,
    imageUrl: parsed.imageUrl ?? null,
  };
}

/** Returns null when the record is not an empowered technique (parity with old guard). */
export function empoweredLibraryRecordToFormState(
  doc: unknown,
  powerParts: PowerPart[],
  techniqueParts: TechniquePart[],
): EmpoweredTechniqueFormState | null {
  const data = doc as EmpoweredLibraryRecord;
  if (!data.empoweredTechnique) return null;

  const base = emptyEmpoweredTechniqueFormState();

  const addWeaponPowerPart = data.power?.addWeaponPowerPart;
  const attackMode = deriveEmpoweredAttackMode({
    attackMode: data.attackMode,
    parts: [
      ...(data.power?.parts ?? []),
      ...(data.power?.mechanics ?? []),
      ...(data.power?.autoMechanics ?? []),
      ...(addWeaponPowerPart ? [addWeaponPowerPart] : []),
      ...(data.technique?.parts ?? []),
      ...(data.technique?.autoMechanics ?? []),
    ],
    weapon: data.power?.addWeapon ?? null,
  });

  const additionalDamage = data.technique?.additionalDamage?.[0];

  return {
    name: data.name || '',
    description: data.description || '',
    actionType: data.actionType || 'basic',
    isReaction: Boolean(data.isReaction),
    powerDamages:
      data.power?.damage && data.power.damage.length > 0 ? data.power.damage : base.powerDamages,
    techniqueDamage: {
      amount: additionalDamage?.amount ?? 0,
      size: additionalDamage?.size ?? 6,
    },
    range: data.power?.range || base.range,
    area: data.power?.area || base.area,
    duration: data.power?.duration || base.duration,
    attackMode,
    selectedPowerParts: mapPowerRows(data.power?.parts || [], powerParts, true),
    selectedPowerAdvancedParts: mapPowerRows(data.power?.mechanics || [], powerParts, true),
    selectedTechniqueParts: mapTechniqueRows(data.technique?.parts || [], techniqueParts, true),
    imageId: data.imageId ?? data.image_id ?? null,
    imageUrl: data.imageUrl ?? data.image_url ?? null,
  };
}

export function bootstrapEmpoweredTechniqueFormState(options: {
  editId: string | null;
  powerParts: PowerPart[];
  techniqueParts: TechniquePart[];
  rawItems: unknown[];
}): EmpoweredTechniqueFormState {
  const { editId, powerParts, techniqueParts, rawItems } = options;

  if (editId) {
    const match = rawItems.find(
      (item) =>
        String((item as { docId?: string; id?: string }).docId) === editId ||
        String((item as { docId?: string; id?: string }).id) === editId,
    );
    if (!match) {
      return emptyEmpoweredTechniqueFormState();
    }
    return (
      empoweredLibraryRecordToFormState(
        match,
        powerParts,
        techniqueParts,
      ) ?? emptyEmpoweredTechniqueFormState()
    );
  }

  return (
    restoreEmpoweredTechniqueFromCache(powerParts, techniqueParts) ??
    emptyEmpoweredTechniqueFormState()
  );
}
