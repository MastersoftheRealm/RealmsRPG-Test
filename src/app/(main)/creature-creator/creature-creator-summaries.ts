/**
 * Creature Creator — collapsible section summary strings (TASK-610)
 */

import type { CreatureState } from './creature-creator-types';
import { collectCreatureInventoryItems } from '@/lib/game/creature-inventory';
import type { CreatureFeat as CodexCreatureFeat } from '@/hooks';
import { isCreatureCreatorHiddenFeat } from './creature-creator-hidden-feats';

function summarizeNamedItems(
  items: Array<{ name?: string | undefined }>,
  emptyLabel: string,
): string {
  if (items.length === 0) return emptyLabel;
  const names = items.slice(0, 4).map((item) => item.name || 'Unknown');
  const more = items.length > 4 ? ` +${items.length - 4} more` : '';
  return `${names.join(', ')}${more}`;
}

export function buildCreatureFeatsSummary(
  creature: CreatureState,
  catalogById: ReadonlyMap<string, CodexCreatureFeat> = new Map(),
): string {
  const listed = creature.feats.filter(
    (feat) => !isCreatureCreatorHiddenFeat(feat, catalogById.get(String(feat.id)) ?? null),
  );
  return summarizeNamedItems(listed, 'No feats');
}

export function buildCreaturePowersSummary(creature: CreatureState): string {
  return summarizeNamedItems(creature.powers, 'No powers');
}

export function buildCreatureTechniquesSummary(creature: CreatureState): string {
  return summarizeNamedItems(creature.techniques, 'No techniques');
}

export function buildCreatureArmamentsSummary(creature: CreatureState): string {
  return summarizeNamedItems(collectCreatureInventoryItems(creature), 'No inventory items');
}
