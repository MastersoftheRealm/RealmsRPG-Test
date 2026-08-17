/**
 * Creature inventory document — kind buckets + migrate-on-read from mixed `armaments[]`.
 * TASK-812. Neutral domain helper (no library/UI imports).
 */

export type CreatureInventoryKind = 'weapon' | 'armor' | 'shield' | 'equipment';

export type CreatureInventoryBuckets<T> = {
  weapons: T[];
  armor: T[];
  shields: T[];
  equipment: T[];
};

export type CreatureInventorySource<T> = {
  weapons?: T[] | null;
  armor?: T[] | null;
  shields?: T[] | null;
  equipment?: T[] | null;
  /** Legacy mixed bag. Used only when kind buckets are absent. */
  armaments?: T[] | null;
};

const KIND_TO_BUCKET = {
  weapon: 'weapons',
  armor: 'armor',
  shield: 'shields',
  equipment: 'equipment',
} as const satisfies Record<CreatureInventoryKind, keyof CreatureInventoryBuckets<unknown>>;

export function normalizeCreatureInventoryType(type: string | undefined): CreatureInventoryKind {
  const normalized = String(type ?? '')
    .toLowerCase()
    .trim();
  if (normalized === 'weapon' || normalized === 'armor' || normalized === 'shield') {
    return normalized;
  }
  return 'equipment';
}

export function splitCreatureInventoryByKind<T extends { type?: string }>(
  items: T[],
): CreatureInventoryBuckets<T> {
  const buckets: CreatureInventoryBuckets<T> = {
    weapons: [],
    armor: [],
    shields: [],
    equipment: [],
  };
  for (const item of items) {
    buckets[KIND_TO_BUCKET[normalizeCreatureInventoryType(item.type)]].push(item);
  }
  return buckets;
}

/** Prefer kind buckets; otherwise split a legacy mixed `armaments` array. */
export function resolveCreatureInventoryBuckets<T extends { type?: string }>(
  source: CreatureInventorySource<T>,
): CreatureInventoryBuckets<T> {
  const hasBuckets =
    Array.isArray(source.weapons) ||
    Array.isArray(source.armor) ||
    Array.isArray(source.shields) ||
    Array.isArray(source.equipment);
  if (hasBuckets) {
    return {
      weapons: Array.isArray(source.weapons) ? source.weapons : [],
      armor: Array.isArray(source.armor) ? source.armor : [],
      shields: Array.isArray(source.shields) ? source.shields : [],
      equipment: Array.isArray(source.equipment) ? source.equipment : [],
    };
  }
  return splitCreatureInventoryByKind(Array.isArray(source.armaments) ? source.armaments : []);
}

export function collectCreatureInventoryItems<T>(buckets: CreatureInventoryBuckets<T>): T[] {
  return [...buckets.weapons, ...buckets.armor, ...buckets.shields, ...buckets.equipment];
}

export function appendCreatureInventoryItems<T extends { type?: string }>(
  buckets: CreatureInventoryBuckets<T>,
  items: T[],
): CreatureInventoryBuckets<T> {
  const next: CreatureInventoryBuckets<T> = {
    weapons: [...buckets.weapons],
    armor: [...buckets.armor],
    shields: [...buckets.shields],
    equipment: [...buckets.equipment],
  };
  for (const item of items) {
    next[KIND_TO_BUCKET[normalizeCreatureInventoryType(item.type)]].push(item);
  }
  return next;
}

export function removeCreatureInventoryItem<T extends { id?: string }>(
  buckets: CreatureInventoryBuckets<T>,
  id: string,
): CreatureInventoryBuckets<T> {
  const keep = (items: T[]) => items.filter((item) => String(item.id) !== id);
  return {
    weapons: keep(buckets.weapons),
    armor: keep(buckets.armor),
    shields: keep(buckets.shields),
    equipment: keep(buckets.equipment),
  };
}

/** Missing quantity counts as one item for spend; a stored 0 is real. */
export function creatureInventoryQuantityMultiplier(quantity: unknown): number {
  if (typeof quantity === 'number' && Number.isFinite(quantity) && quantity >= 0) {
    return quantity;
  }
  return 1;
}

/** Display Qty only when quantity is stored; never fake a 1. */
export function formatCreatureEquipmentQuantity(quantity: unknown): string {
  if (typeof quantity === 'number' && Number.isFinite(quantity)) {
    return String(quantity);
  }
  return '-';
}
