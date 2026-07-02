import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserPower } from '../use-user-library';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { getItemColumns } from './get-item-columns';
import { partChipsFromDisplay } from './part-chips';
import type { CodexDbRefs } from './types';

export function buildPowerSelectableItem(item: UserPower, dbs: CodexDbRefs): SelectableItem {
  const doc: PowerDocument = {
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    parts: Array.isArray(item.parts) ? (item.parts as PowerDocument['parts']) : [],
    damage: item.damage as PowerDocument['damage'],
    actionType: item.actionType,
    isReaction: item.isReaction,
    range: item.range as PowerDocument['range'],
    area: item.area as PowerDocument['area'],
    duration: item.duration as PowerDocument['duration'],
  };
  const display = derivePowerDisplay(doc, dbs.powerPartsDb as Parameters<typeof derivePowerDisplay>[1]);
  const partChips = partChipsFromDisplay(display.partChips);
  const detailSections = partChips.length > 0 ? [{ label: 'Parts & Proficiencies', chips: partChips }] : undefined;
  const totalCost = display.tp > 0 ? display.tp : undefined;

  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String(item.description ?? '') || 'No description available.',
    columns: getItemColumns(item, 'power'),
    detailSections,
    totalCost,
    costLabel: totalCost != null ? 'TP' : undefined,
    data: item,
  };
}
