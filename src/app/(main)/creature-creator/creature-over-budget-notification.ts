import type { CreatureCreatorDerivedStats } from './creature-creator-derived-stats';

export type CreatureOverBudgetNotification = {
  show: boolean;
  title: string;
};

function formatCount(n: number, singular: string, plural = `${singular}s`): string {
  const abs = Math.abs(n);
  const label = abs === 1 ? singular : plural;
  return `${abs} ${label}`;
}

function buildPoolMessage(parts: string[]): string {
  return parts.join('; ');
}

/** Matches character sheet over-budget wording for negative point pools. */
export function buildCreatureOverBudgetNotification(
  stats: CreatureCreatorDerivedStats,
): CreatureOverBudgetNotification {
  const overspent: string[] = [];

  if (stats.abilityRemaining < 0) {
    overspent.push(formatCount(stats.abilityRemaining, 'ability point'));
  }
  if (stats.skillRemaining < 0) {
    overspent.push(formatCount(stats.skillRemaining, 'skill point'));
  }
  if (stats.heRemaining < 0) {
    overspent.push(formatCount(stats.heRemaining, 'Health/Energy point', 'Health/Energy points'));
  }
  if (stats.proficiencyRemaining < 0) {
    overspent.push(formatCount(stats.proficiencyRemaining, 'proficiency point'));
  }
  if (stats.featRemaining < 0) {
    overspent.push(formatCount(stats.featRemaining, 'feat point'));
  }
  if (stats.trainingRemaining < 0) {
    overspent.push(formatCount(stats.trainingRemaining, 'training point'));
  }
  if (stats.currencyRemaining < 0) {
    overspent.push(formatCount(stats.currencyRemaining, 'currency'));
  }

  if (overspent.length === 0) {
    return { show: false, title: '' };
  }

  return {
    show: true,
    title: `Over budget: ${buildPoolMessage(overspent)}`,
  };
}
