import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { UserTechnique } from '../use-user-library';
import { formatPowerDamage, formatPowerRangeFromSteps } from '@/lib/calculators/power-calc';
import {
  buildEntityMetadataDetailSections,
  mergeDetailSections,
} from '@/lib/chip/list-row-metadata';
import { empoweredTechniquePartsSection } from '@/lib/library/empowered-technique-display';
import { formatDurationDisplay, formatSavedActionTypeForDisplay } from '@/lib/utils';
import { resolveListRowThumbnail } from '@/lib/list-row-image';

export type EmpoweredSelectableCodex = {
  powerPartsDb: PowerPart[];
  techniquePartsDb: TechniquePart[];
};

export function buildEmpoweredPowerSelectableItem(
  item: UserTechnique,
  codex?: EmpoweredSelectableCodex
): SelectableItem {
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
  const durationValue = formatDurationDisplay(powerData.duration ?? raw.duration);

  const rangeSteps = (powerData.range as { steps?: number } | undefined)?.steps;
  const rangeStr =
    typeof rangeSteps === 'number' && rangeSteps > 0 ? formatPowerRangeFromSteps(rangeSteps) : undefined;
  // Range omitted from columns → labeled expanded chip (TASK-437)
  const metadataSections = buildEntityMetadataDetailSections({ range: rangeStr });
  const partsSection =
    codex?.powerPartsDb && codex?.techniquePartsDb
      ? empoweredTechniquePartsSection(item, codex.powerPartsDb, codex.techniquePartsDb)
      : undefined;
  const detailSections = mergeDetailSections(metadataSections, partsSection);
  const name = String(item.name ?? '');

  return {
    id: String(item.id),
    name,
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
    thumbnail: resolveListRowThumbnail('technique', item, name),
    data: item,
  };
}
