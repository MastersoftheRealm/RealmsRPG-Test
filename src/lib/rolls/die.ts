/**
 * Shared die helpers for RollProvider / RollLog (single rollDie + image map).
 */

export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export const DIE_MAX: Record<DieType, number> = {
  d4: 4,
  d6: 6,
  d8: 8,
  d10: 10,
  d12: 12,
  d20: 20,
};

/** Dice image paths (matching vanilla site assets). */
export const DIE_IMAGES: Record<DieType, string> = {
  d4: '/images/D4.png',
  d6: '/images/D6.png',
  d8: '/images/D8.png',
  d10: '/images/D10.png',
  d12: '/images/D12.png',
  d20: '/images/D20_1.png',
};

export function rollDie(type: DieType): number {
  const max = DIE_MAX[type];
  return Math.floor(Math.random() * max) + 1;
}

export function generateRollId(prefix = 'roll'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
