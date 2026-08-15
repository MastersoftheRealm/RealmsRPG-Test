/**
 * Creature Creator — collapsible section summary strings (TASK-610)
 */

import type { CreatureState } from './creature-creator-types';

function summarizeNamedItems(items: Array<{ name?: string }>, emptyLabel: string): string {
  if (items.length === 0) return emptyLabel;
  const names = items.slice(0, 4).map((item) => item.name || 'Unknown');
  const more = items.length > 4 ? ` +${items.length - 4} more` : '';
  return `${names.join(', ')}${more}`;
}

export function buildCreatureFeatsSummary(creature: CreatureState): string {
  return summarizeNamedItems(creature.feats, 'No feats');
}

export function buildCreaturePowersSummary(creature: CreatureState): string {
  return summarizeNamedItems(creature.powers, 'No powers');
}

export function buildCreatureTechniquesSummary(creature: CreatureState): string {
  return summarizeNamedItems(creature.techniques, 'No techniques');
}

export function buildCreatureArmamentsSummary(creature: CreatureState): string {
  return summarizeNamedItems(creature.armaments, 'No inventory items');
}
