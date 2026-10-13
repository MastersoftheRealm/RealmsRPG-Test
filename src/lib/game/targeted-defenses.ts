/**
 * Targeted defenses — can-target (parts) vs actual targets (power/technique payload).
 * @see GAME_RULES.md — Defenses, Evasion as default attack target
 */

import { ABILITIES_AND_DEFENSES } from '@/lib/game/constants';
import type { AttackMode } from '@/lib/attack-mode';
import { getPowerDamagePartInfo } from '@/lib/calculators/mechanic-builder';

/** Six defenses + Evasion (same options as Admin Codex parts editor). */
export const CANONICAL_TARGETED_DEFENSES = [...ABILITIES_AND_DEFENSES.slice(6), 'Evasion'] as const;

export type CanonicalTargetedDefense = (typeof CANONICAL_TARGETED_DEFENSES)[number];

export interface PartWithTargetedDefenses {
  id?: string | number | undefined;
  name?: string | undefined;
  description?: string | undefined;
  defense?: string[] | string | null | undefined;
}

export type TargetedDefenseSuggestion = {
  defense: CanonicalTargetedDefense;
  sources: string[];
};

export type TargetedDefenseSelectOption = {
  value: CanonicalTargetedDefense;
  label: string;
  suggested: boolean;
  sources: string[];
};

function toCanonicalDefense(raw: string): CanonicalTargetedDefense | undefined {
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  if (trimmed.toLowerCase() === 'evasion') return 'Evasion';
  const match = CANONICAL_TARGETED_DEFENSES.find((d) => d.toLowerCase() === trimmed.toLowerCase());
  return match;
}

/** Normalize stored defense tags (comma-separated TEXT, arrays, legacy casing). */
export function normalizeTargetedDefenses(
  input: string[] | string | null | undefined,
): CanonicalTargetedDefense[] {
  if (input == null) return [];
  const raw = Array.isArray(input)
    ? input
    : String(input)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
  const out: CanonicalTargetedDefense[] = [];
  for (const item of raw) {
    const canon = toCanonicalDefense(item);
    if (canon && !out.includes(canon)) out.push(canon);
  }
  return out;
}

/** Parse defense names mentioned in part description (suggestion only). Longest names first so “Mental Fortitude” does not also match Fortitude. */
export function parseDefensesFromDescription(
  description: string | undefined,
): CanonicalTargetedDefense[] {
  if (!description?.trim()) return [];
  let remaining = description;
  const found: CanonicalTargetedDefense[] = [];
  const byLength = [...CANONICAL_TARGETED_DEFENSES].sort((a, b) => b.length - a.length);
  for (const defense of byLength) {
    const pattern = new RegExp(`\\b${defense.replace(/\s+/g, '\\s+')}\\b`, 'i');
    if (pattern.test(remaining)) {
      found.push(defense);
      remaining = remaining.replace(pattern, ' ');
    }
  }
  return CANONICAL_TARGETED_DEFENSES.filter((d) => found.includes(d));
}

function titleCaseDamageType(damageType: string): string {
  const trimmed = damageType.trim();
  if (!trimmed) return trimmed;
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
}

/** Defenses a part can target — DB field first, then description fallback. */
export function defensesFromPart(part: PartWithTargetedDefenses): CanonicalTargetedDefense[] {
  const fromField = normalizeTargetedDefenses(part.defense ?? undefined);
  if (fromField.length > 0) return fromField;
  return parseDefensesFromDescription(part.description);
}

export function defensesFromDamageType(
  damageType: string,
  partsDb: PartWithTargetedDefenses[],
): CanonicalTargetedDefense[] {
  const key = damageType.toLowerCase().trim();
  if (!key || key === 'none') return [];
  const partInfo = getPowerDamagePartInfo(key);
  if (!partInfo) return [];
  const def = partsDb.find((p) => p.name?.toLowerCase() === partInfo.name.toLowerCase());
  if (!def) return [];
  return defensesFromPart(def);
}

function addSuggestion(
  map: Map<CanonicalTargetedDefense, Set<string>>,
  defense: CanonicalTargetedDefense,
  source: string,
) {
  const bucket = map.get(defense) ?? new Set<string>();
  bucket.add(source);
  map.set(defense, bucket);
}

export type SuggestTargetedDefensesInput = {
  /** Selected power/technique parts only — never the full Codex catalog. */
  parts: PartWithTargetedDefenses[];
  /** Full parts DB used only to resolve damage-type → damage-part can-target. */
  partsDb?: PartWithTargetedDefenses[] | undefined;
  damageTypes?: string[] | undefined;
  attackMode?: AttackMode | undefined;
};

export function suggestTargetedDefenses(
  input: SuggestTargetedDefensesInput,
): TargetedDefenseSuggestion[] {
  const map = new Map<CanonicalTargetedDefense, Set<string>>();
  const partsDb = input.partsDb ?? [];

  for (const part of input.parts) {
    const partName = part.name?.trim() || 'Part';
    for (const defense of defensesFromPart(part)) {
      addSuggestion(map, defense, partName);
    }
  }

  for (const damageType of input.damageTypes ?? []) {
    if (!damageType || damageType === 'none') continue;
    const typeLabel = titleCaseDamageType(damageType);
    for (const defense of defensesFromDamageType(damageType, partsDb)) {
      addSuggestion(map, defense, typeLabel);
    }
  }

  const attackMode = input.attackMode;
  if (attackMode === 'weapon') {
    addSuggestion(map, 'Evasion', 'Weapon Attack');
  } else if (attackMode === 'unarmed') {
    addSuggestion(map, 'Evasion', 'Unarmed Attack');
  }

  return CANONICAL_TARGETED_DEFENSES.filter((d) => map.has(d)).map((defense) => ({
    defense,
    sources: Array.from(map.get(defense) ?? []),
  }));
}

export function buildTargetedDefenseSelectOptions(
  input: SuggestTargetedDefensesInput,
): TargetedDefenseSelectOption[] {
  const suggestions = suggestTargetedDefenses(input);
  const sourceByDefense = new Map(suggestions.map((s) => [s.defense, s.sources] as const));

  return CANONICAL_TARGETED_DEFENSES.map((defense) => {
    const sources = sourceByDefense.get(defense) ?? [];
    const suggested = sources.length > 0;
    const shown = sources.slice(0, 3);
    const suffix = suggested ? ` * · ${shown.join(', ')}` : '';
    return {
      value: defense,
      label: `${defense}${suffix}`,
      suggested,
      sources,
    };
  });
}

export function formatDamageTypeCanTargetHint(
  damageType: string | undefined,
  partsDb: PartWithTargetedDefenses[],
): string | undefined {
  if (!damageType || damageType === 'none') return undefined;
  return formatCanTargetLine(defensesFromDamageType(damageType, partsDb));
}

export function formatAttackModeCanTargetHint(
  attackMode: AttackMode | undefined,
): string | undefined {
  if (attackMode === 'weapon' || attackMode === 'unarmed') return formatCanTargetLine(['Evasion']);
  return undefined;
}

export function formatCanTargetLine(defenses: string[] | undefined): string | undefined {
  const normalized = normalizeTargetedDefenses(defenses);
  if (!normalized.length) return undefined;
  return `Can target: ${normalized.join(', ')}`;
}

export function appendCanTargetToDescription(
  description: string | undefined,
  defenses: string[] | undefined,
): string | undefined {
  const canTarget = formatCanTargetLine(defenses);
  if (!canTarget) return description?.trim() || undefined;
  const base = description?.trim();
  if (!base) return canTarget;
  if (base.includes(canTarget)) return base;
  return `${base}\n\n${canTarget}`;
}

export function formatTargetsFact(defenses: string[] | null | undefined): string | undefined {
  const normalized = normalizeTargetedDefenses(defenses ?? undefined);
  if (!normalized.length) return undefined;
  return `Targets ${normalized.join(', ')}`;
}
