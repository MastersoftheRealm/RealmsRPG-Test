/**
 * Shared power/technique library filter state + apply logic (TASK-673 / TASK-676).
 * UI: `PowerTechniqueFilters` in `@/components/patterns/filters`.
 */

import { ACTION_OPTIONS } from '@/lib/game/creator-constants';
import { isPowerInnateEligible, type InnatePowerSnapshot } from '@/lib/game/innate-eligibility';
import type { PowerTechniqueCharacterContext } from '@/lib/library/power-technique-character-context';

export type PowerTechniqueFilterKind = 'power' | 'technique';

export type ReactionFilterMode = 'all' | 'action' | 'reaction';

export interface PowerTechniqueFilterState {
  categories: string[];
  energyMax: number | null;
  /** Max Training Points cost (always available). */
  tpMax: number | null;
  /**
   * When a character is selected: keep only rows whose TP ≤ character remaining TP.
   */
  affordableTpOnly: boolean;
  actionTypes: string[];
  reactionMode: ReactionFilterMode;
  /** Power-only: selected Innate Threshold from core rules (or character). */
  innateThreshold: number | null;
  /** Power-only: keep only Appendix G innate-eligible powers. */
  innateEligibleOnly: boolean;
}

export const EMPTY_POWER_TECHNIQUE_FILTERS: PowerTechniqueFilterState = {
  categories: [],
  energyMax: null,
  tpMax: null,
  affordableTpOnly: false,
  actionTypes: [],
  reactionMode: 'all',
  innateThreshold: null,
  innateEligibleOnly: false,
};

export const POWER_TECHNIQUE_ACTION_FILTER_OPTIONS = ACTION_OPTIONS.map((opt) => ({
  value: opt.value,
  label: opt.label,
}));

export const REACTION_FILTER_OPTIONS: { value: ReactionFilterMode; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'action', label: 'Actions only' },
  { value: 'reaction', label: 'Reactions only' },
];

export interface PowerTechniqueFilterableRow {
  categories?: string[];
  energy?: string | number | null;
  /** Training Points cost for Max TP / affordable filters. */
  tp?: number | null;
  /** Raw action type key or display string. */
  actionTypeRaw?: string | null;
  /** Display action (fallback when raw missing). */
  action?: string | null;
  isReaction?: boolean;
  partIds?: string[];
  partNames?: string[];
}

/** Normalize display/persisted action labels to ACTION_OPTIONS values. */
export function normalizeActionTypeFilterKey(actionType?: string | null): string {
  const raw = String(actionType ?? '')
    .trim()
    .toLowerCase();
  if (!raw) return '';
  if (raw === 'long3' || /\blong\s*\(?\s*3\b/.test(raw)) return 'long3';
  if (raw === 'long4' || /\blong\s*\(?\s*4\b/.test(raw)) return 'long4';
  if (raw.startsWith('quick') || raw === 'quick') return 'quick';
  if (raw.startsWith('free') || raw === 'free') return 'free';
  if (raw.startsWith('basic') || raw === 'basic') return 'basic';
  if (raw === 'reaction') return 'basic';
  return raw.replace(/\s+(action|reaction)$/i, '').trim();
}

function parseEnergy(value: string | number | null | undefined): number | null {
  if (value == null || value === '') return null;
  const n = typeof value === 'number' ? value : Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : null;
}

function parseTp(value: number | null | undefined): number | null {
  if (value == null) return null;
  return Number.isFinite(value) ? value : null;
}

export function countActivePowerTechniqueFilters(
  filters: PowerTechniqueFilterState,
  kind: PowerTechniqueFilterKind,
  hasCharacter = false,
): number {
  let count = 0;
  if (filters.categories.length > 0) count += 1;
  if (filters.energyMax != null) count += 1;
  if (filters.tpMax != null) count += 1;
  if (hasCharacter && filters.affordableTpOnly) count += 1;
  if (filters.actionTypes.length > 0) count += 1;
  if (filters.reactionMode !== 'all') count += 1;
  if (kind === 'power') {
    if (filters.innateThreshold != null) count += 1;
    if (filters.innateEligibleOnly) count += 1;
  }
  return count;
}

function rowMatchesCategories(row: PowerTechniqueFilterableRow, selected: string[]): boolean {
  if (selected.length === 0) return true;
  const rowCats = (row.categories ?? []).map((c) => c.toLowerCase());
  if (rowCats.length === 0) return false;
  return selected.some((sel) => rowCats.includes(sel.toLowerCase()));
}

function rowMatchesAction(
  row: PowerTechniqueFilterableRow,
  filters: PowerTechniqueFilterState,
): boolean {
  if (filters.reactionMode === 'action' && row.isReaction === true) return false;
  if (filters.reactionMode === 'reaction' && row.isReaction !== true) return false;

  if (filters.actionTypes.length === 0) return true;
  const key =
    normalizeActionTypeFilterKey(row.actionTypeRaw) || normalizeActionTypeFilterKey(row.action);
  if (!key) return false;
  return filters.actionTypes.includes(key);
}

function effectiveEnergyMax(
  filters: PowerTechniqueFilterState,
  character?: PowerTechniqueCharacterContext | null,
): number | null {
  const manual = filters.energyMax;
  if (!character) return manual;
  if (manual == null) return character.maxEnergy;
  return Math.min(manual, character.maxEnergy);
}

function effectiveInnateThreshold(
  filters: PowerTechniqueFilterState,
  character?: PowerTechniqueCharacterContext | null,
): number | null {
  if (character && filters.innateEligibleOnly && character.innateThreshold > 0) {
    return character.innateThreshold;
  }
  return filters.innateThreshold;
}

function rowMatchesEnergy(row: PowerTechniqueFilterableRow, energyMax: number | null): boolean {
  if (energyMax == null) return true;
  const energy = parseEnergy(row.energy);
  if (energy == null) return false;
  return energy <= energyMax;
}

function rowMatchesTp(
  row: PowerTechniqueFilterableRow,
  filters: PowerTechniqueFilterState,
  character?: PowerTechniqueCharacterContext | null,
): boolean {
  const tp = parseTp(row.tp);
  if (filters.tpMax != null) {
    if (tp == null) return false;
    if (tp > filters.tpMax) return false;
  }
  if (filters.affordableTpOnly && character) {
    if (tp == null) return false;
    if (tp > character.tpRemaining) return false;
  }
  return true;
}

function toInnateSnapshot(row: PowerTechniqueFilterableRow): InnatePowerSnapshot {
  return {
    id: 'filter',
    energy: Math.max(0, Math.round(parseEnergy(row.energy) ?? 0)),
    actionType: row.actionTypeRaw ?? row.action ?? undefined,
    isReaction: row.isReaction === true,
    partIds: row.partIds ?? [],
    partNames: row.partNames ?? [],
  };
}

/**
 * Apply advanced filters (not search/sort). Category match is OR across selected categories.
 * When `character` is set: energy is capped by character max Energy; innate eligible uses
 * character innate threshold; affordableTpOnly uses remaining Training Points.
 */
export function applyPowerTechniqueFilters<T extends PowerTechniqueFilterableRow>(
  rows: T[],
  filters: PowerTechniqueFilterState,
  kind: PowerTechniqueFilterKind,
  character?: PowerTechniqueCharacterContext | null,
): T[] {
  const energyMax = effectiveEnergyMax(filters, character);
  const innateThreshold = effectiveInnateThreshold(filters, character);

  return rows.filter((row) => {
    if (!rowMatchesCategories(row, filters.categories)) return false;
    if (!rowMatchesEnergy(row, energyMax)) return false;
    if (!rowMatchesTp(row, filters, character)) return false;
    if (!rowMatchesAction(row, filters)) return false;

    if (kind === 'power' && filters.innateEligibleOnly) {
      if (!isPowerInnateEligible(toInnateSnapshot(row), innateThreshold)) {
        return false;
      }
    }

    return true;
  });
}

/**
 * Selecting an innate threshold should auto-enable Innate Eligible (owner AC).
 */
export function withInnateThresholdSelected(
  prev: PowerTechniqueFilterState,
  thresholdValue: string,
): PowerTechniqueFilterState {
  if (!thresholdValue) {
    return { ...prev, innateThreshold: null };
  }
  const n = Number(thresholdValue);
  if (!Number.isFinite(n) || n <= 0) {
    return { ...prev, innateThreshold: null };
  }
  return {
    ...prev,
    innateThreshold: n,
    innateEligibleOnly: true,
  };
}

/**
 * When a character is selected, sync Max Energy (and innate threshold if eligible) from context.
 */
export function withCharacterContextApplied(
  prev: PowerTechniqueFilterState,
  character: PowerTechniqueCharacterContext | null,
): PowerTechniqueFilterState {
  if (!character) {
    return { ...prev, affordableTpOnly: false };
  }
  const next: PowerTechniqueFilterState = {
    ...prev,
    energyMax: character.maxEnergy,
  };
  if (prev.innateEligibleOnly && character.innateThreshold > 0) {
    next.innateThreshold = character.innateThreshold;
  }
  return next;
}
