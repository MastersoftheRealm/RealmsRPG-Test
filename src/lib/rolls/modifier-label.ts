/**
 * Player-facing label for the numeric bonus on a roll-log entry (TASK-893).
 * Lib-layer: no UI imports. Callers may pass `explicit` for Power bonus etc.
 */

export type RollModifierKind = 'attack' | 'damage' | 'skill' | 'ability' | 'defense' | 'custom';

export function resolveRollModifierLabel(options: {
  type: RollModifierKind;
  title: string;
  modifier: number;
  explicit?: string | undefined;
}): string | undefined {
  if (options.modifier === 0) return undefined;
  const explicit = options.explicit?.trim();
  if (explicit) return explicit;

  switch (options.type) {
    case 'ability':
      return options.title;
    case 'defense':
      return `${options.title} bonus`;
    case 'skill': {
      const skillName = options.title.replace(/\s*\([^)]*\)\s*$/, '').trim();
      return skillName ? `${skillName} bonus` : 'Skill bonus';
    }
    case 'attack': {
      if (/power/i.test(options.title)) return 'Power bonus';
      const abilityAttack = options.title.match(/^(\w+)\s+Attack$/i);
      if (abilityAttack?.[1]) return `${abilityAttack[1]} bonus`;
      return 'Attack bonus';
    }
    case 'damage':
      return 'Damage bonus';
    case 'custom':
      return 'Modifier';
  }
}
