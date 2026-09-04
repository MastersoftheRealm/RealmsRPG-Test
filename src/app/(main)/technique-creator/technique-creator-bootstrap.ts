/**
 * Pure bootstrap helpers for technique creator — cache restore and library load.
 * Used at workspace mount (remount key) so hydrate logic stays out of useEffect.
 * All functions are pure / render-safe (no localStorage writes).
 */

import type { TechniquePart } from '@/hooks';
import { CREATOR_CACHE_KEYS } from '@/lib/game/creator-constants';
import { readCreatorCache } from '@/lib/game/creator-cache';
import { deriveTechniqueAttackMode, normalizeAttackMode, type AttackMode } from '@/lib/attack-mode';
import { normalizeTargetedDefenses } from '@/lib/game/targeted-defenses';

export const TECHNIQUE_CREATOR_CACHE_KEY = CREATOR_CACHE_KEYS.TECHNIQUE;

export interface TechniqueSelectedPart {
  part: TechniquePart;
  op_1_lvl: number;
  op_2_lvl: number;
  op_3_lvl: number;
  selectedCategory: string;
}

export interface TechniqueDamageConfig {
  amount: number;
  size: number;
  type: string;
}

export interface TechniqueCreatorCache {
  name: string;
  description: string;
  selectedParts: Array<{
    partId: string | number;
    op_1_lvl: number;
    op_2_lvl: number;
    op_3_lvl: number;
    selectedCategory: string;
  }>;
  actionType: string;
  isReaction: boolean;
  damage: TechniqueDamageConfig;
  attackMode: AttackMode;
  imageId?: string | null | undefined;
  imageUrl?: string | null | undefined;
  targetedDefenses?: string[] | undefined;
  timestamp: number;
}

export interface TechniqueCreatorFormState {
  name: string;
  description: string;
  selectedParts: TechniqueSelectedPart[];
  actionType: string;
  isReaction: boolean;
  damage: TechniqueDamageConfig;
  attackMode: AttackMode;
  imageId: string | null;
  imageUrl: string | null;
  targetedDefenses: string[];
}

export type TechniqueLibraryRecord = {
  name?: string | undefined;
  description?: string | undefined;
  parts?: unknown | undefined;
  techniqueParts?: unknown | undefined;
  actionType?: string | undefined;
  actionTypeSelection?: string | undefined;
  isReaction?: boolean | undefined;
  reaction?: boolean | undefined;
  attackMode?: unknown | undefined;
  weapon?: { id?: string | number | undefined; name?: string | undefined } | undefined;
  weaponName?: string | undefined;
  damage?: unknown | undefined;
  imageId?: string | null | undefined;
  image_id?: string | null | undefined;
  imageUrl?: string | null | undefined;
  image_url?: string | null | undefined;
  targetedDefenses?: string[] | undefined;
};

export function emptyTechniqueCreatorFormState(): TechniqueCreatorFormState {
  return {
    name: '',
    description: '',
    selectedParts: [],
    actionType: 'basic',
    isReaction: false,
    damage: { amount: 0, size: 6, type: 'none' },
    attackMode: 'unarmed',
    imageId: null,
    imageUrl: null,
    targetedDefenses: [],
  };
}

export function restoreTechniqueCreatorFromCache(
  techniqueParts: TechniquePart[],
): TechniqueCreatorFormState | null {
  const parsed = readCreatorCache<TechniqueCreatorCache>(TECHNIQUE_CREATOR_CACHE_KEY);
  if (!parsed) return null;

  const selectedParts: TechniqueSelectedPart[] = [];
  for (const savedPart of parsed.selectedParts ?? []) {
    const foundPart = techniqueParts.find((p) => String(p.id) === String(savedPart.partId));
    if (foundPart) {
      selectedParts.push({
        part: foundPart,
        op_1_lvl: savedPart.op_1_lvl,
        op_2_lvl: savedPart.op_2_lvl,
        op_3_lvl: savedPart.op_3_lvl,
        selectedCategory: savedPart.selectedCategory,
      });
    }
  }

  return {
    name: parsed.name || '',
    description: parsed.description || '',
    selectedParts,
    actionType: parsed.actionType || 'basic',
    isReaction: parsed.isReaction || false,
    damage: parsed.damage || { amount: 0, size: 6, type: 'none' },
    attackMode: normalizeAttackMode(parsed.attackMode) ?? 'unarmed',
    imageId: parsed.imageId ?? null,
    imageUrl: parsed.imageUrl ?? null,
    targetedDefenses: normalizeTargetedDefenses(parsed.targetedDefenses),
  };
}

export function techniqueLibraryRecordToFormState(
  technique: TechniqueLibraryRecord,
  techniqueParts: TechniquePart[],
): TechniqueCreatorFormState {
  const savedParts = (technique.parts || technique.techniqueParts || []) as Array<{
    id?: number | string | undefined;
    name?: string | undefined;
    op_1_lvl?: number | undefined;
    op_2_lvl?: number | undefined;
    op_3_lvl?: number | undefined;
  }>;

  // Skip mechanic-only parts when loading; these are auto-generated from
  // action / damage / attack mode and are re-created by buildMechanicParts.
  const loadedParts: TechniqueSelectedPart[] = [];
  for (const savedPart of savedParts) {
    const matchedPart = techniqueParts.find(
      (p) => p.id === String(savedPart.id) || p.name === savedPart.name,
    );
    if (matchedPart && !matchedPart.mechanic) {
      loadedParts.push({
        part: matchedPart,
        op_1_lvl: savedPart.op_1_lvl || 0,
        op_2_lvl: savedPart.op_2_lvl || 0,
        op_3_lvl: savedPart.op_3_lvl || 0,
        selectedCategory: matchedPart.category || 'any',
      });
    }
  }

  const attackMode = deriveTechniqueAttackMode({
    attackMode: technique.attackMode,
    parts: savedParts,
    weapon: technique.weapon,
  });

  // getPayload persists damage as an array ([{ amount, size }]);
  // tolerate both the array form and a legacy single-object form.
  const rawDamage = Array.isArray(technique.damage) ? technique.damage[0] : technique.damage;
  const d = rawDamage as
    | {
        amount?: number | undefined;
        dice?: number | undefined;
        size?: number | undefined;
        sides?: number | undefined;
        type?: string | undefined;
      }
    | undefined;
  const damage: TechniqueDamageConfig = d
    ? {
        amount: d.amount || d.dice || 0,
        size: d.size || d.sides || 6,
        type: d.type || 'none',
      }
    : { amount: 0, size: 6, type: 'none' };

  return {
    name: technique.name || '',
    description: technique.description || '',
    selectedParts: loadedParts,
    // Saved payloads persist `isReaction` (see getPayload); keep `reaction`
    // as a fallback for legacy/enriched shapes.
    actionType: technique.actionTypeSelection || technique.actionType || 'basic',
    isReaction: technique.isReaction ?? technique.reaction ?? false,
    damage,
    attackMode,
    imageId: technique.imageId ?? technique.image_id ?? null,
    imageUrl: technique.imageUrl ?? technique.image_url ?? null,
    targetedDefenses: normalizeTargetedDefenses(technique.targetedDefenses),
  };
}

export function bootstrapTechniqueCreatorFormState(options: {
  editTechniqueId: string | null;
  techniqueParts: TechniquePart[];
  rawItems: unknown[];
}): TechniqueCreatorFormState {
  const { editTechniqueId, techniqueParts, rawItems } = options;

  if (editTechniqueId) {
    const techniqueToEdit = rawItems.find((t) => {
      const row = t as { docId?: string | undefined; id?: string | undefined };
      return String(row.docId) === editTechniqueId || String(row.id) === editTechniqueId;
    });
    if (!techniqueToEdit) {
      return emptyTechniqueCreatorFormState();
    }
    return techniqueLibraryRecordToFormState(
      techniqueToEdit as TechniqueLibraryRecord,
      techniqueParts,
    );
  }

  return restoreTechniqueCreatorFromCache(techniqueParts) ?? emptyTechniqueCreatorFormState();
}
