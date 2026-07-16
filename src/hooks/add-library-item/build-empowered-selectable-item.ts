import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserTechnique } from '../use-user-library';
import { formatPowerDamage, formatPowerRangeFromSteps } from '@/lib/calculators/power-calc';
import { buildEntityMetadataDetailSections } from '@/lib/chip/list-row-metadata';
import { formatSavedActionTypeForDisplay } from '@/lib/utils';

function formatDuration(raw: unknown): string {
  if (raw == null) return '-';
  if (typeof raw === 'string') return raw.trim() || '-';
  if (typeof raw === 'object') {
    const obj = raw as { type?: string; value?: string | number; unit?: string };
    if (obj.type) return String(obj.type).replace(/\b\w/g, (c) => c.toUpperCase());
    if (obj.value != null && obj.unit) return `${obj.value} ${obj.unit}`;
  }
  return '-';
}

export function buildEmpoweredPowerSelectableItem(item: UserTechnique): SelectableItem {
  const raw = item as unknown as Record<string, unknown>;
  const powerData = (raw.power as Record<string, unknown> | undefined) ?? {};
  const totals = (raw.totals as Record<string, unknown> | undefined) ?? {};
  const actionType = String(raw.actionType ?? '');
  const isReaction = raw.isReaction === true;
  const action = formatSavedActionTypeForDisplay(actionType, isReaction);
  const areaRaw = (powerData.area as Record<string, unknown> | undefined)?.type;
  const areaValue = areaRaw ? String(areaRaw).replace(/\b\w/g, (c) => c.toUpperCase()) : '-';
  const damageRows = Array.isArray(powerData.damage)
    ? (powerData.damage as Array<{ amount?: number; size?: number; type?: string }>)
    : [];
  const damageValue = formatPowerDamage(damageRows) || '-';

  const energyRaw = totals.energy ?? powerData.energy ?? raw.energy;
  const energyValue =
    typeof energyRaw === 'number' || (typeof energyRaw === 'string' && energyRaw.trim())
      ? String(energyRaw)
      : '-';
  const durationValue = formatDuration(powerData.duration ?? raw.duration);

  const rangeSteps = (powerData.range as { steps?: number } | undefined)?.steps;
  const rangeStr =
    typeof rangeSteps === 'number' && rangeSteps > 0 ? formatPowerRangeFromSteps(rangeSteps) : undefined;
  // Range omitted from columns → labeled expanded chip (TASK-437)
  const detailSections = buildEntityMetadataDetailSections({ range: rangeStr });

  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String(item.description ?? '') || 'No description available.',
    columns: [
      { key: 'Energy', value: energyValue, align: 'center' as const },
      { key: 'Action', value: action, align: 'center' as const },
      { key: 'Duration', value: durationValue, align: 'center' as const },
      { key: 'Area', value: areaValue, align: 'center' as const },
      { key: 'Damage', value: damageValue, align: 'center' as const },
    ],
    detailSections: detailSections.length > 0 ? detailSections : undefined,
    badges: [{ label: 'Empowered', color: 'gray' as const }],
    totalCost: Number(totals.trainingPoints ?? 0) || undefined,
    costLabel: Number(totals.trainingPoints ?? 0) > 0 ? 'Training Points' : undefined,
    data: item,
  };
}
