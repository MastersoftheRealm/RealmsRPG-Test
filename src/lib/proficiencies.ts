import type { CharacterPower, CharacterTechnique, Item, CharacterProficiency } from '@/types';
import type { CoreRulesMap } from '@/types/core-rules';
import { findByIdOrName } from '@/lib/id-constants';
import { calculateTrainingPoints } from '@/lib/game/formulas';

interface CodexPartLike {
  id?: string | number | undefined;
  name?: string | undefined;
  base_tp?: number | undefined;
  op_1_tp?: number | undefined;
  op_2_tp?: number | undefined;
  op_3_tp?: number | undefined;
}

interface CodexPropertyLike {
  id?: string | number | undefined;
  name?: string | undefined;
  base_tp?: number | undefined;
  op_1_tp?: number | undefined;
}

export interface BuildRequiredProficienciesInput {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  shields?: Item[] | undefined;
  armor: Item[];
  powerPartsDb?: CodexPartLike[] | undefined;
  techniquePartsDb?: CodexPartLike[] | undefined;
  itemPropertiesDb?: CodexPropertyLike[] | undefined;
}

/**
 * Training-point cap. Delegates to the canonical, rules-aware
 * `calculateTrainingPoints` (TYPE-01) — the prior local formula was
 * algebraically identical but ignored DB core-rules overrides. Pass `rules`
 * (from `useGameRules()`) where available so the cap honours custom rules.
 */
export function getTrainingPointLimit(
  level: number,
  archetypeAbility: number,
  rules?: Partial<CoreRulesMap>,
): number {
  const lvl = Math.max(1, Number(level) || 1);
  const abil = Number(archetypeAbility) || 0;
  return calculateTrainingPoints(lvl, abil, rules);
}

/** Whole-number Training Points. A value already on an integer stays there. */
export function roundUpTrainingPoints(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const nearest = Math.round(value);
  if (Math.abs(value - nearest) < 1e-6) return nearest;
  return Math.ceil(value);
}

/**
 * Lowest option level at or above `usedLevel` whose `rate * level` is a whole
 * number. Level 0 is unused and stays 0. A zero rate stays at the used level.
 * 0.5 per level used at 3 → 4. 0.25 per level used at 3 → 4.
 */
export function optionLevelForWholeTrainingPoints(rate: number, usedLevel: number): number {
  if (!Number.isFinite(usedLevel)) return 0;
  const used = Math.max(0, Math.trunc(usedLevel));
  if (used === 0) return 0;
  if (!Number.isFinite(rate) || rate === 0) return used;
  const limit = used + 10000;
  for (let level = used; level <= limit; level += 1) {
    const tp = rate * level;
    if (Number.isFinite(tp) && Math.abs(tp - Math.round(tp)) < 1e-6) return level;
  }
  return used;
}

/**
 * One proficiency row. Each option is priced at the whole-number level, then
 * the base is included once and the sum is rounded up (Power Range base 0.5).
 */
export function calculateProficiencyTP(prof: CharacterProficiency): number {
  const base = prof.baseTP ?? 0;
  const op1Rate = prof.op1TP ?? 0;
  const op2Rate = prof.op2TP ?? 0;
  const op3Rate = prof.op3TP ?? 0;
  const op1 = op1Rate * optionLevelForWholeTrainingPoints(op1Rate, prof.op1Level ?? 0);
  const op2 = op2Rate * optionLevelForWholeTrainingPoints(op2Rate, prof.op2Level ?? 0);
  const op3 = op3Rate * optionLevelForWholeTrainingPoints(op3Rate, prof.op3Level ?? 0);
  return roundUpTrainingPoints(base + op1 + op2 + op3);
}

function normalize(s: unknown): string {
  return String(s ?? '')
    .trim()
    .toLowerCase();
}

function normalizeDamageType(input: unknown): string | undefined {
  const value = normalize(input);
  if (!value || value === 'none') return undefined;
  return value;
}

function proficiencyKey(
  p: Pick<CharacterProficiency, 'kind' | 'refId' | 'name' | 'damageType'>,
): string {
  const dmg = normalizeDamageType(p.damageType) ?? '';
  // Damage type proficiencies are shared across powers/techniques/items.
  if (dmg) return `damage_type:${dmg}`;

  const baseKey = p.refId ? normalize(p.refId) : normalize(p.name);
  return `${p.kind}:${baseKey}`;
}

function parseDamageTypes(value: unknown): string[] {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(
        value
          .map((d) => {
            if (typeof d === 'string') return normalizeDamageType(d);
            if (!d || typeof d !== 'object') return undefined;
            const maybeDamage = d as {
              type?: unknown | undefined;
              damageType?: unknown | undefined;
              name?: unknown | undefined;
            };
            return normalizeDamageType(
              maybeDamage.type ?? maybeDamage.damageType ?? maybeDamage.name,
            );
          })
          .filter((v): v is string => Boolean(v)),
      ),
    );
  }

  if (typeof value === 'string') {
    const found = Array.from(value.toLowerCase().matchAll(/\b([a-z]+)\b/g), (m) => m[1]).filter(
      (token): token is string => token !== undefined,
    );
    const known = new Set([
      'magic',
      'fire',
      'ice',
      'lightning',
      'spiritual',
      'sonic',
      'poison',
      'necrotic',
      'acid',
      'psychic',
      'light',
      'bludgeoning',
      'piercing',
      'slashing',
    ]);
    return Array.from(new Set(found.filter((token) => known.has(token))));
  }

  return [];
}

function pickHigher(a: CharacterProficiency, b: CharacterProficiency): CharacterProficiency {
  const aTp = calculateProficiencyTP(a);
  const bTp = calculateProficiencyTP(b);
  if (bTp > aTp) return b;
  if (aTp > bTp) return a;
  const aLevelSum = (a.op1Level ?? 0) + (a.op2Level ?? 0) + (a.op3Level ?? 0);
  const bLevelSum = (b.op1Level ?? 0) + (b.op2Level ?? 0) + (b.op3Level ?? 0);
  return bLevelSum > aLevelSum ? b : a;
}

function isDamagePartName(name: string): boolean {
  const n = normalize(name);
  return n.includes('damage');
}

/** Single source for new proficiency ids (buildRequired, add-proficiency modal, etc.). */
export function generateProficiencyId(): string {
  return `prof_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function nextProfId(): string {
  return generateProficiencyId();
}

export function isCustomProficiency(p: CharacterProficiency): boolean {
  return !!(p.custom || p.kind === 'custom');
}

export function buildRequiredProficiencies(
  input: BuildRequiredProficienciesInput,
): CharacterProficiency[] {
  const out: CharacterProficiency[] = [];
  const {
    powers,
    techniques,
    weapons,
    shields = [],
    armor,
    powerPartsDb = [],
    techniquePartsDb = [],
    itemPropertiesDb = [],
  } = input;

  const pushPart = (
    kind: 'power_part' | 'technique_part',
    rawPart: unknown,
    codexList: CodexPartLike[],
    damageTypes: string[],
  ) => {
    const partObj =
      typeof rawPart === 'string' ? { name: rawPart } : (rawPart as Record<string, unknown>);
    const ref = {
      id: partObj?.id as string | number | undefined,
      name: partObj?.name as string | undefined,
    };
    const codex = findByIdOrName(codexList, ref);
    const name = String(ref.name ?? codex?.name ?? '').trim();
    if (!name) return;

    const op1Level = Number(partObj?.op_1_lvl ?? 0) || 0;
    const op2Level = Number(partObj?.op_2_lvl ?? 0) || 0;
    const op3Level = Number(partObj?.op_3_lvl ?? 0) || 0;
    const profBase: CharacterProficiency = {
      kind,
      id: nextProfId(),
      refId: ref.id != null ? String(ref.id) : undefined,
      name,
      op1Level,
      op2Level,
      op3Level,
      baseTP: Number(partObj?.base_tp ?? codex?.base_tp ?? 0) || 0,
      op1TP: Number(partObj?.op_1_tp ?? codex?.op_1_tp ?? 0) || 0,
      op2TP: Number(partObj?.op_2_tp ?? codex?.op_2_tp ?? 0) || 0,
      op3TP: Number(partObj?.op_3_tp ?? codex?.op_3_tp ?? 0) || 0,
    };

    // A part that names its own damage type (composed power rows; `null` = untyped) ignores the power's damage.
    const partDamageTypes =
      partObj?.damageType !== undefined
        ? [normalizeDamageType(partObj.damageType)].filter((t): t is string => Boolean(t))
        : damageTypes;
    if (isDamagePartName(name) && partDamageTypes.length > 0) {
      partDamageTypes.forEach((dt) => {
        const withDmg = { ...profBase, damageType: dt, id: nextProfId() };
        if (calculateProficiencyTP(withDmg) > 0) out.push(withDmg);
      });
      return;
    }
    if (calculateProficiencyTP(profBase) > 0) out.push(profBase);
  };

  powers.forEach((power) => {
    const damageTypes = parseDamageTypes((power as { damage?: unknown | undefined }).damage);
    (power.parts || []).forEach((part) => pushPart('power_part', part, powerPartsDb, damageTypes));
  });

  techniques.forEach((technique) => {
    const damageTypes = parseDamageTypes(
      (technique as { damage?: unknown | undefined; damageStr?: unknown | undefined }).damage ??
        (technique as { damageStr?: unknown | undefined }).damageStr,
    );
    (technique.parts || []).forEach((part) =>
      pushPart('technique_part', part, techniquePartsDb, damageTypes),
    );
  });

  const armaments = [...weapons, ...shields, ...armor];
  armaments.forEach((item) => {
    const damageTypes = parseDamageTypes(item.damage);
    (item.properties || []).forEach((propRaw) => {
      const propObj =
        typeof propRaw === 'string'
          ? { name: propRaw }
          : (propRaw as unknown as Record<string, unknown>);
      const ref = {
        id: propObj?.id as string | number | undefined,
        name: propObj?.name as string | undefined,
      };
      const codex = findByIdOrName(itemPropertiesDb, ref);
      const name = String(ref.name ?? codex?.name ?? '').trim();
      if (!name) return;
      const op1Level = Number(propObj?.op_1_lvl ?? 0) || 0;
      const baseTP = Number(propObj?.base_tp ?? codex?.base_tp ?? 0) || 0;
      const op1TP = Number(propObj?.op_1_tp ?? codex?.op_1_tp ?? 0) || 0;
      const refId =
        ref.id != null ? String(ref.id) : codex?.id != null ? String(codex.id) : undefined;
      const profBase: CharacterProficiency = {
        kind: 'item_property',
        id: nextProfId(),
        refId,
        name,
        op1Level,
        baseTP,
        op1TP,
      };

      const isDamageProperty = isDamagePartName(name);
      if (isDamageProperty && damageTypes.length > 0) {
        damageTypes.forEach((dt) => {
          const withDmg = { ...profBase, damageType: dt, id: nextProfId() };
          if (calculateProficiencyTP(withDmg) > 0) out.push(withDmg);
        });
        return;
      }
      if (calculateProficiencyTP(profBase) > 0) out.push(profBase);
    });
  });

  return aggregateCharacterWideProficiencies(out);
}

function partIdentityKey(prof: CharacterProficiency): string {
  const damage = normalizeDamageType(prof.damageType) ?? '';
  const id = partRefId(prof) || normalize(prof.name);
  return `${prof.kind}:${id}:${damage}`;
}

function firstNonZeroRate(values: number[]): number {
  for (const value of values) {
    if (value !== 0 && Number.isFinite(value)) return value;
  }
  return 0;
}

function highestOptionLevel(
  rows: CharacterProficiency[],
  read: (row: CharacterProficiency) => number | undefined,
): number {
  return rows.reduce((max, row) => Math.max(max, read(row) ?? 0), 0);
}

/**
 * Same part across powers: base once, each option at its highest used level,
 * then that level rounded up until the option's Training Points are whole.
 */
function mergeSamePartUses(rows: CharacterProficiency[]): CharacterProficiency {
  const baseTP = firstNonZeroRate(rows.map((row) => row.baseTP ?? 0));
  const op1TP = firstNonZeroRate(rows.map((row) => row.op1TP ?? 0));
  const op2TP = firstNonZeroRate(rows.map((row) => row.op2TP ?? 0));
  const op3TP = firstNonZeroRate(rows.map((row) => row.op3TP ?? 0));
  const first = rows[0]!;
  return {
    ...first,
    id: nextProfId(),
    baseTP,
    op1TP,
    op2TP,
    op3TP,
    op1Level: optionLevelForWholeTrainingPoints(
      op1TP,
      highestOptionLevel(rows, (row) => row.op1Level),
    ),
    op2Level: optionLevelForWholeTrainingPoints(
      op2TP,
      highestOptionLevel(rows, (row) => row.op2Level),
    ),
    op3Level: optionLevelForWholeTrainingPoints(
      op3TP,
      highestOptionLevel(rows, (row) => row.op3Level),
    ),
  };
}

function aggregateCharacterWideProficiencies(list: CharacterProficiency[]): CharacterProficiency[] {
  const groups = new Map<string, CharacterProficiency[]>();
  for (const prof of list) {
    const key = partIdentityKey(prof);
    const group = groups.get(key);
    if (group) group.push(prof);
    else groups.set(key, [prof]);
  }
  const merged = Array.from(groups.values(), (rows) => mergeSamePartUses(rows));
  return dedupeHighestProficiencies(merged);
}

/** Character-level TP after repeated-part dedupe (sheet + guided save). */
export function sumRequiredProficiencyTrainingPoints(
  input: BuildRequiredProficienciesInput,
): number {
  return buildRequiredProficiencies(input).reduce(
    (sum, prof) => sum + calculateProficiencyTP(prof),
    0,
  );
}

export function dedupeHighestProficiencies(list: CharacterProficiency[]): CharacterProficiency[] {
  const map = new Map<string, CharacterProficiency>();
  list.forEach((prof) => {
    const key = proficiencyKey(prof);
    const existing = map.get(key);
    map.set(key, existing ? pickHigher(existing, prof) : prof);
  });
  return Array.from(map.values());
}

/** Exclude proficiencies that cost 0 TP (we never need to track or display them). */
export function filterZeroCostProficiencies(list: CharacterProficiency[]): CharacterProficiency[] {
  return list.filter((p) => calculateProficiencyTP(p) > 0);
}

/**
 * Keep only owned proficiencies that are either custom or required by the current loadout.
 * Used by "Sync proficiencies" to drop unused part/property proficiencies before re-merging with required.
 */
export function filterToRequiredAndCustom(
  owned: CharacterProficiency[] = [],
  required: CharacterProficiency[] = [],
): CharacterProficiency[] {
  const requiredKeys = new Set(required.map((p) => proficiencyKey(p)));
  return owned.filter((p) => isCustomProficiency(p) || requiredKeys.has(proficiencyKey(p)));
}

export function mergeOwnedWithRequired(
  owned: CharacterProficiency[] = [],
  required: CharacterProficiency[] = [],
): CharacterProficiency[] {
  const keepCustom = owned.filter(isCustomProficiency);
  const nonCustomOwned = owned.filter((p) => !isCustomProficiency(p));
  const merged = [...keepCustom, ...dedupeHighestProficiencies([...nonCustomOwned, ...required])];
  return filterZeroCostProficiencies(merged);
}

/**
 * Sync Proficiencies: the current loadout is the cost. Drop saved rows the
 * loadout no longer needs, add what it needs, and replace a stale higher cost
 * with the required row. Custom proficiencies stay as saved.
 */
export function syncProficienciesToLoadout(
  owned: CharacterProficiency[] = [],
  required: CharacterProficiency[] = [],
): CharacterProficiency[] {
  const customs = owned.filter(isCustomProficiency);
  return filterZeroCostProficiencies(dedupeHighestProficiencies([...customs, ...required]));
}

/**
 * A higher option level covers a lower one of the same part. Rounded TP is not
 * the comparison when the part id matches: neighbouring levels can publish the
 * same integer (1d6 and 1d8 Elemental Damage are both 3 TP). A saved row with
 * no part id matches that part by name and kind (power, technique, or item)
 * before falling back to Training Points, so a nameless 1d6 still does not
 * cover 1d8 of the same kind. Damage type is the proficiency
 * key, so fire does not satisfy ice. Two different part ids that share a
 * damage type (Additional Damage fire and Elemental Damage fire) are compared
 * by rounded Training Points. For a damage part, die size is option 1
 * (`calculateDamageOptionLevel`: 1d4 → 0, 1d6 → 1, 1d8 → 2).
 */
function optionLevelsCover(owned: CharacterProficiency, required: CharacterProficiency): boolean {
  return (
    (owned.op1Level ?? 0) >= (required.op1Level ?? 0) &&
    (owned.op2Level ?? 0) >= (required.op2Level ?? 0) &&
    (owned.op3Level ?? 0) >= (required.op3Level ?? 0)
  );
}

function partRefId(row: CharacterProficiency): string {
  return String(row.refId ?? '')
    .trim()
    .toLowerCase();
}

function partIdsMatch(owned: CharacterProficiency, required: CharacterProficiency): boolean {
  const ownedId = partRefId(owned);
  const requiredId = partRefId(required);
  return ownedId.length > 0 && ownedId === requiredId;
}

function partNamesMatch(owned: CharacterProficiency, required: CharacterProficiency): boolean {
  const ownedName = (owned.name ?? '').trim().toLowerCase();
  const requiredName = (required.name ?? '').trim().toLowerCase();
  return ownedName.length > 0 && ownedName === requiredName;
}

export function hasSufficientProficiency(
  owned: CharacterProficiency[],
  required: CharacterProficiency,
): boolean {
  const key = proficiencyKey(required);
  const match = owned.find((p) => proficiencyKey(p) === key);
  if (!match) return false;
  if (normalizeDamageType(match.damageType) !== normalizeDamageType(required.damageType)) {
    return false;
  }
  if (partIdsMatch(match, required)) return optionLevelsCover(match, required);
  const missingPartId = partRefId(match).length === 0 || partRefId(required).length === 0;
  if (missingPartId && partNamesMatch(match, required) && match.kind === required.kind) {
    return optionLevelsCover(match, required);
  }
  return calculateProficiencyTP(match) >= calculateProficiencyTP(required);
}

export function getMissingRequiredProficiencies(
  required: CharacterProficiency[],
  owned: CharacterProficiency[],
): CharacterProficiency[] {
  return required.filter((req) => !hasSufficientProficiency(owned, req));
}
