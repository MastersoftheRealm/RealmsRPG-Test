import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserTechnique } from '../use-user-library';

export function buildEmpoweredPowerSelectableItem(item: UserTechnique): SelectableItem {
  const raw = item as unknown as Record<string, unknown>;
  const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
  const totals = (raw.totals as Record<string, unknown> | undefined) ?? {};
  const actionType = String(raw.actionType ?? '');
  const isReaction = raw.isReaction === true;
  const action = actionType
    ? `${actionType.charAt(0).toUpperCase()}${actionType.slice(1)} ${isReaction ? 'Reaction' : 'Action'}`
    : isReaction
      ? 'Reaction'
      : '-';
  const areaRaw = (powerData.area as Record<string, unknown> | undefined)?.type;
  const areaValue = areaRaw ? String(areaRaw).replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
  const damageRows = Array.isArray(powerData.damage) ? (powerData.damage as Array<{ amount?: number; size?: number; type?: string }>) : [];
  const damageValue =
    damageRows.length > 0
      ? damageRows
          .filter((row) => (row.amount ?? 0) > 0 && row.type && row.type !== 'none')
          .map((row) => `${row.amount}d${row.size} ${row.type}`)
          .join(', ')
      : '-';

  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String(item.description ?? '') || 'No description available.',
    columns: [
      { key: 'Action', value: action, align: 'center' as const },
      { key: 'Damage', value: damageValue, align: 'center' as const },
      { key: 'Area', value: areaValue, align: 'center' as const },
    ],
    badges: [{ label: 'Empowered', color: 'gray' as const }],
    totalCost: Number(totals.trainingPoints ?? 0) || undefined,
    costLabel: Number(totals.trainingPoints ?? 0) > 0 ? 'TP' : undefined,
    data: item,
  };
}
