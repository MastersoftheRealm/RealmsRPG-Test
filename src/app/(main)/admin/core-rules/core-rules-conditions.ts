/**
 * Admin Core Rules Conditions tab (ClickUp 86e3juy5z).
 *
 * The stored `core_rules` CONDITIONS row is a flat map of `{ name, description }`
 * entries. The editor sections are the Standard and Leveled lists in
 * GAME_RULES.md. A save writes the same flat map back, so opening the tab
 * does not replace the row with `standard` / `leveled` arrays.
 */

export const LEVELED_CONDITION_NAMES = [
  'Bleed',
  'Exhausted',
  'Exposed',
  'Frightened',
  'Staggered',
  'Resilient',
  'Slowed',
  'Stunned',
  'Susceptible',
  'Weakened',
] as const;

const LEVELED_CONDITION_NAME_SET = new Set<string>(LEVELED_CONDITION_NAMES);

export type ConditionEditorRow = {
  key: string;
  name: string;
  description: string;
  leveled: boolean;
};

export type ConditionsEditorShape = 'lists' | 'flat';

export type ConditionsEditorModel = {
  shape: ConditionsEditorShape;
  standard: ConditionEditorRow[];
  leveled: ConditionEditorRow[];
  stackingRules: string;
};

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isConditionEntry(value: unknown): value is Record<string, unknown> {
  return isPlainObject(value) && typeof value.name === 'string';
}

function conditionSlug(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
  return slug || 'condition';
}

function uniqueConditionKey(base: string, used: Set<string>): string {
  if (!used.has(base)) return base;
  let n = 2;
  while (used.has(`${base}${n}`)) n += 1;
  return `${base}${n}`;
}

function rowFromEntry(
  key: string,
  value: Record<string, unknown>,
  defaultLeveled: boolean,
): ConditionEditorRow {
  const name = typeof value.name === 'string' ? value.name : '';
  const description = typeof value.description === 'string' ? value.description : '';
  const leveled = typeof value.leveled === 'boolean' ? value.leveled : defaultLeveled;
  return { key, name, description, leveled };
}

function rowsFromList(
  value: unknown,
  defaultLeveled: boolean,
  prefix: string,
): ConditionEditorRow[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(isConditionEntry)
    .map((item, index) => rowFromEntry(`${prefix}:${index}`, item, defaultLeveled));
}

export function readConditionsEditor(data: Record<string, unknown>): ConditionsEditorModel {
  const stackingRules = typeof data.stackingRules === 'string' ? data.stackingRules : '';
  if (Array.isArray(data.standard) || Array.isArray(data.leveled)) {
    return {
      shape: 'lists',
      standard: rowsFromList(data.standard, false, 'standard'),
      leveled: rowsFromList(data.leveled, true, 'leveled'),
      stackingRules,
    };
  }

  const standard: ConditionEditorRow[] = [];
  const leveled: ConditionEditorRow[] = [];
  for (const [key, value] of Object.entries(data)) {
    if (key === 'stackingRules' || !isConditionEntry(value)) continue;
    const name = value.name as string;
    const defaultLeveled = LEVELED_CONDITION_NAME_SET.has(name);
    const row = rowFromEntry(key, value, defaultLeveled);
    if (row.leveled) leveled.push(row);
    else standard.push(row);
  }

  return { shape: 'flat', standard, leveled, stackingRules };
}

function listEntry(row: ConditionEditorRow): {
  name: string;
  leveled: boolean;
  description: string;
} {
  return { name: row.name, leveled: row.leveled, description: row.description };
}

function flatEntry(
  original: Record<string, unknown>,
  key: string,
  row: ConditionEditorRow,
): Record<string, unknown> {
  const prevRaw = original[key];
  const prev = isPlainObject(prevRaw) ? { ...prevRaw } : {};
  prev.name = row.name;
  prev.description = row.description;
  const nameSaysLeveled = LEVELED_CONDITION_NAME_SET.has(row.name);
  const prevHadLeveled = isPlainObject(prevRaw) && typeof prevRaw.leveled === 'boolean';
  if (prevHadLeveled || row.leveled !== nameSaysLeveled) {
    prev.leveled = row.leveled;
  } else {
    delete prev.leveled;
  }
  return prev;
}

export function writeConditionsEditor(
  original: Record<string, unknown>,
  model: ConditionsEditorModel,
): Record<string, unknown> {
  if (model.shape === 'lists') {
    return {
      standard: model.standard.map(listEntry),
      leveled: model.leveled.map(listEntry),
      stackingRules: model.stackingRules,
    };
  }

  const rows = [...model.standard, ...model.leveled];
  const byKey = new Map<string, ConditionEditorRow>();
  for (const row of rows) {
    if (row.key) byKey.set(row.key, row);
  }

  const next: Record<string, unknown> = {};
  const claimed = new Set<string>();
  for (const [key, value] of Object.entries(original)) {
    if (key === 'stackingRules') {
      next.stackingRules = model.stackingRules;
      continue;
    }
    if (isConditionEntry(value)) {
      const row = byKey.get(key);
      if (!row) continue;
      next[key] = flatEntry(original, key, row);
      claimed.add(key);
      continue;
    }
    next[key] = value;
  }

  for (const row of rows) {
    if (row.key && claimed.has(row.key)) continue;
    const key = uniqueConditionKey(conditionSlug(row.name), new Set(Object.keys(next)));
    next[key] = flatEntry(original, row.key, row);
  }

  if (
    !Object.prototype.hasOwnProperty.call(original, 'stackingRules') &&
    model.stackingRules !== ''
  ) {
    next.stackingRules = model.stackingRules;
  }

  return next;
}
