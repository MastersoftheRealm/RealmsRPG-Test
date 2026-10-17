/**
 * Canonical size categories (height ranges, spaces, carrying capacity).
 * All gameplay code should read carrying-capacity numbers from here — not hard-coded elsewhere.
 */

export const CARRYING_CAPACITY_HALF_LOAD_RULE =
  'If you carry more than half your maximum capacity, your movement speed is halved.';

export type SizeTableRow = {
  value: string;
  label: string;
  /** Inclusive lower height bound in cm, or null when there is no lower bound (e.g. under 30 cm). */
  heightMinCm: number | null;
  /** Inclusive upper height bound in cm, or null when there is no upper bound (e.g. 750+ cm). */
  heightMaxCm: number | null;
  spaces: number;
  baseCarry: number;
  perStrCarry: number;
  minCarry: number;
  /** Display string for admin / core-rules fallbacks (derived from heightMinCm / heightMaxCm). */
  height: string;
};

function formatSizeHeightRangeCm(row: Pick<SizeTableRow, 'heightMinCm' | 'heightMaxCm'>): string {
  const { heightMinCm, heightMaxCm } = row;
  if (heightMinCm == null && heightMaxCm != null) {
    return `under ${heightMaxCm + 1} cm`;
  }
  if (heightMinCm != null && heightMaxCm != null) {
    return `${heightMinCm}–${heightMaxCm} cm`;
  }
  if (heightMinCm != null && heightMaxCm == null) {
    return `${heightMinCm}+ cm`;
  }
  return '';
}

const SIZE_TABLE_BASE: Array<Omit<SizeTableRow, 'height'> & { height?: string | undefined }> = [
  {
    value: 'miniscule',
    label: 'Minuscule',
    heightMinCm: null,
    heightMaxCm: 29,
    spaces: 0.125,
    baseCarry: 10,
    perStrCarry: 5,
    minCarry: 5,
  },
  {
    value: 'tiny',
    label: 'Tiny',
    heightMinCm: 30,
    heightMaxCm: 59,
    spaces: 0.25,
    baseCarry: 25,
    perStrCarry: 10,
    minCarry: 10,
  },
  {
    value: 'small',
    label: 'Small',
    heightMinCm: 60,
    heightMaxCm: 149,
    spaces: 1,
    baseCarry: 50,
    perStrCarry: 25,
    minCarry: 25,
  },
  {
    value: 'medium',
    label: 'Medium',
    heightMinCm: 150,
    heightMaxCm: 199,
    spaces: 1,
    baseCarry: 100,
    perStrCarry: 50,
    minCarry: 50,
  },
  {
    value: 'large',
    label: 'Large',
    heightMinCm: 200,
    heightMaxCm: 299,
    spaces: 2,
    baseCarry: 200,
    perStrCarry: 100,
    minCarry: 100,
  },
  {
    value: 'huge',
    label: 'Huge',
    heightMinCm: 300,
    heightMaxCm: 449,
    spaces: 4,
    baseCarry: 400,
    perStrCarry: 200,
    minCarry: 200,
  },
  {
    value: 'humongous',
    label: 'Humongous',
    heightMinCm: 450,
    heightMaxCm: 749,
    spaces: 9,
    baseCarry: 800,
    perStrCarry: 400,
    minCarry: 400,
  },
  {
    value: 'gargantuan',
    label: 'Gargantuan',
    heightMinCm: 750,
    heightMaxCm: null,
    spaces: 16,
    baseCarry: 1600,
    perStrCarry: 800,
    minCarry: 800,
  },
];

export const CREATURE_SIZES: readonly SizeTableRow[] = SIZE_TABLE_BASE.map((row) => ({
  ...row,
  height: formatSizeHeightRangeCm(row),
}));

export type CreatureSize = (typeof CREATURE_SIZES)[number]['value'];

export function formatSizeHeightRange(
  row: Pick<SizeTableRow, 'heightMinCm' | 'heightMaxCm'>,
): string {
  return formatSizeHeightRangeCm(row);
}

function normalizeSizeLookupKey(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, '');
}

/** Match a stored or codex size string to a size-table row (value or label). */
export function findSizeTableRow(sizeKey: string | null | undefined): SizeTableRow | undefined {
  if (!sizeKey?.trim()) return undefined;
  const key = normalizeSizeLookupKey(sizeKey);
  return CREATURE_SIZES.find(
    (row) => normalizeSizeLookupKey(row.value) === key || normalizeSizeLookupKey(row.label) === key,
  );
}

export function sizeLabelForKey(sizeKey: string | null | undefined): string | undefined {
  return findSizeTableRow(sizeKey)?.label ?? (sizeKey?.trim() ? sizeKey.trim() : undefined);
}

export type CarryingCapacityResult = {
  capacityKg: number;
  minCarryKg: number;
};

/** base + perStr × Strength, floored at the size minimum (applies with negative Strength). */
export function calculateCarryingCapacityKg(
  sizeKey: string,
  strength: number,
): CarryingCapacityResult | null {
  const row = findSizeTableRow(sizeKey);
  if (!row) return null;
  const raw = row.baseCarry + row.perStrCarry * strength;
  return {
    capacityKg: Math.max(raw, row.minCarry),
    minCarryKg: row.minCarry,
  };
}

/** Whether `choice` matches one of the species-allowed size strings (case-insensitive). */
export function sizeChoiceAllowed(choice: string, allowedSizes: readonly string[]): boolean {
  const row = findSizeTableRow(choice);
  if (!row) return false;
  return allowedSizes.some((allowed) => {
    const allowedRow = findSizeTableRow(allowed);
    if (allowedRow) return allowedRow.value === row.value;
    return normalizeSizeLookupKey(allowed) === normalizeSizeLookupKey(choice);
  });
}

/**
 * After species changes or when loading a sheet: keep a valid pick, auto-pick when only one option,
 * or clear so the player must choose again (matches guided species draft behavior).
 */
export function reconcileSizeWithAllowedOptions(
  current: string | undefined,
  allowedSizes: readonly string[],
): string | undefined {
  if (allowedSizes.length === 0) return undefined;
  if (allowedSizes.length === 1) return allowedSizes[0];
  if (current && sizeChoiceAllowed(current, allowedSizes)) {
    const row = findSizeTableRow(current)!;
    const match = allowedSizes.find((a) => {
      const ar = findSizeTableRow(a);
      return ar ? ar.value === row.value : false;
    });
    return match ?? allowedSizes.find((a) => sizeChoiceAllowed(a, [current])) ?? undefined;
  }
  return undefined;
}
