/**
 * Creature creator power rows — unique keys for duplicate library picks (86e3jx636).
 */

export type CreaturePowerInstanceRow = {
  id: string;
  sourceId?: string | undefined;
  instanceId?: string | undefined;
  innate?: boolean | undefined;
};

export function creaturePowerLibraryId(power: CreaturePowerInstanceRow): string {
  return power.sourceId ?? power.id;
}

/** Stable React / remove key; legacy saves may repeat the same library id. */
export function creaturePowerRowKey(power: CreaturePowerInstanceRow, index: number): string {
  return power.instanceId ?? `legacy:${power.id}:${index}`;
}

export function assignCreaturePowerInstance<T extends CreaturePowerInstanceRow>(power: T): T {
  const libraryId = creaturePowerLibraryId(power);
  return {
    ...power,
    sourceId: libraryId,
    instanceId: crypto.randomUUID(),
  };
}

export function removeCreaturePowerByRowKey<T extends CreaturePowerInstanceRow>(
  powers: T[],
  rowKey: string,
): T[] {
  const idx = powers.findIndex((p, i) => creaturePowerRowKey(p, i) === rowKey);
  if (idx < 0) return powers;
  return powers.filter((_, i) => i !== idx);
}

export function toggleCreaturePowerInnateByRowKey<T extends CreaturePowerInstanceRow>(
  powers: T[],
  rowKey: string,
): T[] {
  const idx = powers.findIndex((p, i) => creaturePowerRowKey(p, i) === rowKey);
  if (idx < 0) return powers;
  return powers.map((p, i) => (i === idx ? { ...p, innate: !(p.innate === true) } : p));
}
