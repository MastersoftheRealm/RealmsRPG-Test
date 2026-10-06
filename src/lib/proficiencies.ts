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

interface BuildRequiredProficienciesInput {
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

/**
 * One proficiency instance. Round up once after adding the base and every
 * option. Range 3 (base only) is 1 TP. Callers add these integers.
 */
export function calculateProficiencyTP(prof: CharacterProficiency): number {
  const base = prof.baseTP ?? 0;
  const op1 = (prof.op1TP ?? 0) * (prof.op1Level ?? 0);
  const op2 = (prof.op2TP ?? 0) * (prof.op2Level ?? 0);
  const op3 = (prof.op3TP ?? 0) * (prof.op3Level ?? 0);
  return Math.ceil(base + op1 + op2 + op3);
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

  return dedupeHighestProficiencies(out);
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
 * A higher option level covers a lower one of the same part. Rounded TP is not
 * the comparison when the part id matches: neighbouring levels can publish the
 * same integer (1d6 and 1d8 Elemental Damage are both 3 TP). A saved row with
 * no part id matches that part by name before falling back to Training Points,
 * so a nameless 1d6 still does not cover 1d8. Damage type is the proficiency
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
  if (missingPartId && partNamesMatch(match, required)) return optionLevelsCover(match, required);
  return calculateProficiencyTP(match) >= calculateProficiencyTP(required);
}

export function getMissingRequiredProficiencies(
  required: CharacterProficiency[],
  owned: CharacterProficiency[],
): CharacterProficiency[] {
  return required.filter((req) => !hasSufficientProficiency(owned, req));
}
