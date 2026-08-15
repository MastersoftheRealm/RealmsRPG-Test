/**
 * Attack Mode (powers / techniques / empowered techniques)
 * ========================================================
 * Replaces the old "tie a specific weapon to a power/technique" flow. A
 * power/technique now only records how it attacks, in one of three modes:
 *
 *  - `none`    → No Weapon/Attack. Techniques (and empowered techniques) add
 *                the "No Attack" mechanic (id 415, a small energy reduction).
 *                Powers add nothing (No Weapon is the power default — no price
 *                reduction part).
 *  - `unarmed` → Unarmed Attack. Adds nothing on either side.
 *  - `weapon`  → Weapon Attack. Techniques add "Add Weapon to Technique"
 *                (id 7); powers add "Add Weapon to Power" (id 369). Empowered
 *                techniques pick the cheaper live `base_en` of those two
 *                (see `pickCheaperEnPart` / GAME_RULES). Both are flat
 *                base-cost parts with no option levels and no weapon id.
 *
 * There is no weapon library, no TP→option scaling, and no weapon id/object
 * persisted. Display surfaces show the mode label in an "Attack" column.
 */

import { PART_IDS } from './id-constants';

export type AttackMode = 'none' | 'unarmed' | 'weapon';

/** Options for the creator Attack Mode select (same three for power/technique). */
export const ATTACK_MODE_SELECT_OPTIONS: ReadonlyArray<{ value: AttackMode; label: string }> = [
  { value: 'none', label: 'No Weapon/Attack' },
  { value: 'unarmed', label: 'Unarmed Attack' },
  { value: 'weapon', label: 'Weapon Attack' },
];

/** Short label for the "Attack" column on lists / sheets. */
export function attackModeColumnLabel(mode: AttackMode): string {
  switch (mode) {
    case 'none':
      return 'No Attack';
    case 'weapon':
      return 'Weapon';
    case 'unarmed':
    default:
      return 'Unarmed';
  }
}

export function normalizeAttackMode(value: unknown): AttackMode | null {
  return value === 'none' || value === 'unarmed' || value === 'weapon' ? value : null;
}

type SavedPartLike = { id?: string | number; name?: string };

const nameMatches = (part: SavedPartLike, ...names: string[]): boolean => {
  const n = String(part.name ?? '')
    .trim()
    .toLowerCase();
  return names.some((candidate) => n === candidate);
};

const hasPart = (parts: SavedPartLike[], id: number, ...names: string[]): boolean =>
  parts.some((part) => String(part.id) === String(id) || nameMatches(part, ...names));

/**
 * Resolve a technique's attack mode. Prefers the explicit `attackMode` field
 * (new saves), then falls back to the mechanic parts / legacy weapon fields so
 * older library rows still render and load correctly.
 */
export function deriveTechniqueAttackMode(input: {
  attackMode?: unknown;
  parts?: SavedPartLike[] | null;
  /** @deprecated Legacy tied-weapon object; prefer parts / attackMode. */
  weapon?: { id?: string | number; name?: string } | null;
}): AttackMode {
  const explicit = normalizeAttackMode(input.attackMode);
  if (explicit) return explicit;

  const parts = input.parts ?? [];
  if (hasPart(parts, PART_IDS.NO_ATTACK, 'no attack')) return 'none';
  if (
    hasPart(parts, PART_IDS.ADD_WEAPON_TO_TECHNIQUE, 'add weapon to technique', 'add weapon attack')
  ) {
    return 'weapon';
  }

  if (input.weapon?.name || input.weapon?.id) return 'weapon';

  return 'unarmed';
}

/**
 * Resolve a power's attack mode. Powers default to `none` (No Weapon) with no
 * price-reduction part; only `weapon` adds a mechanic (Add Weapon to Power).
 */
export function derivePowerAttackMode(input: {
  attackMode?: unknown;
  parts?: SavedPartLike[] | null;
  weapon?: { id?: string | number; name?: string } | null;
}): AttackMode {
  const explicit = normalizeAttackMode(input.attackMode);
  if (explicit) return explicit;

  const parts = input.parts ?? [];
  if (hasPart(parts, PART_IDS.ADD_WEAPON_TO_POWER, 'add weapon to power')) return 'weapon';
  if (input.weapon?.name || input.weapon?.id) return 'weapon';

  return 'none';
}

/**
 * Resolve an empowered technique's attack mode. Prefers explicit `attackMode`,
 * then either side's Add Weapon part (power 369 or technique 7). Unlabeled
 * legacy rows (including No Attack-only saves) default to `none` — same as
 * historical empowered/power derivation.
 */
export function deriveEmpoweredAttackMode(input: {
  attackMode?: unknown;
  parts?: SavedPartLike[] | null;
  weapon?: { id?: string | number; name?: string } | null;
}): AttackMode {
  const explicit = normalizeAttackMode(input.attackMode);
  if (explicit) return explicit;

  const parts = input.parts ?? [];
  if (
    hasPart(parts, PART_IDS.ADD_WEAPON_TO_POWER, 'add weapon to power') ||
    hasPart(
      parts,
      PART_IDS.ADD_WEAPON_TO_TECHNIQUE,
      'add weapon to technique',
      'add weapon attack',
    ) ||
    input.weapon?.name ||
    input.weapon?.id
  ) {
    return 'weapon';
  }

  return 'none';
}
