import type { Combatant } from '@/types/encounter';

export function getHealthBarColor(current: number, max: number): string {
  if (max <= 0) return 'bg-danger-500';
  const pct = (current / max) * 100;
  if (pct > 50) return 'bg-success-500';
  if (pct > 25) return 'bg-warning-500';
  return 'bg-danger-700';
}

export function getCombatantBorderColor(combatant: Combatant): string {
  switch (combatant.combatantType) {
    case 'ally':
      return 'border-l-ally';
    case 'enemy':
      return 'border-l-enemy';
    case 'companion':
      return 'border-l-companion';
    default:
      return combatant.isAlly ? 'border-l-ally' : 'border-l-enemy';
  }
}
