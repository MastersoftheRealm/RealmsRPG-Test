/**
 * Rules-source (Core / expansion) list filter helpers for Codex and Library GLR lists.
 */

import { CODEX_SOURCES, itemMatchesSources, type CodexSourceId } from '@/lib/codex/sources';

export const CODEX_RULES_SOURCE_FILTER_OPTIONS = CODEX_SOURCES.map((source) => ({
  value: source.id,
  label: source.label,
}));

/** Active when at least one expansion chip is selected (empty = All). */
export function countActiveCodexRulesSourceFilters(selected: readonly string[]): number {
  return selected.length > 0 ? 1 : 0;
}

export function rowMatchesCodexRulesSourceFilter(
  itemSources: unknown,
  selected: readonly string[] | null | undefined,
): boolean {
  return itemMatchesSources(itemSources, selected);
}

export function filterRowsByCodexRulesSources<T>(
  rows: T[],
  selected: readonly string[],
  getSources: (row: T) => unknown,
): T[] {
  if (selected.length === 0) return rows;
  return rows.filter((row) => itemMatchesSources(getSources(row), selected));
}

export function readRowRulesSources(row: unknown): unknown {
  if (!row || typeof row !== 'object') return undefined;
  const record = row as { sources?: unknown; raw?: { sources?: unknown } | undefined };
  return record.sources ?? record.raw?.sources;
}

export type CodexRulesSourceFilterSelection = CodexSourceId[];
