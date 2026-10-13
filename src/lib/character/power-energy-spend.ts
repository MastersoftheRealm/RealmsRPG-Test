/**
 * Play-sheet Energy after using a power.
 * An innate power requires no Energy to use (Core Rulebook / GAME_RULES).
 */

export function energyAfterPowerUse(
  powers: ReadonlyArray<{ id: string | number; innate?: boolean | undefined }> | undefined,
  powerId: string | number,
  energyCost: number,
  currentEnergy: number,
): { currentEnergy: number; spent: boolean } {
  const innate = (powers ?? []).some(
    (power) =>
      (power.id === powerId || String(power.id) === String(powerId)) && power.innate === true,
  );
  if (innate) return { currentEnergy, spent: false };
  if (currentEnergy < energyCost) return { currentEnergy, spent: false };
  return { currentEnergy: currentEnergy - energyCost, spent: true };
}
