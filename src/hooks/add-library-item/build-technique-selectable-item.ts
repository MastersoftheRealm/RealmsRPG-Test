import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserTechnique } from '../use-user-library';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { getItemColumns } from './get-item-columns';
import { partChipsFromDisplay } from './part-chips';
import type { CodexDbRefs } from './types';
import { buildPartsAndMetadataDetailSections } from '@/lib/chip/list-row-metadata';

export function buildTechniqueSelectableItem(item: UserTechnique, dbs: CodexDbRefs): SelectableItem {
  const doc: TechniqueDocument = {
    name: String(item.name ?? ''),
    description: String(item.description ?? ''),
    parts: Array.isArray(item.parts) ? (item.parts as TechniqueDocument['parts']) : [],
    damage: Array.isArray(item.damage) && item.damage[0] ? item.damage[0] : (item.damage as TechniqueDocument['damage']),
    weapon: item.weapon as TechniqueDocument['weapon'],
    actionType: item.actionType,
    isReaction: item.isReaction,
  };
  const display = deriveTechniqueDisplay(doc, dbs.techniquePartsDb as Parameters<typeof deriveTechniqueDisplay>[1]);
  const techniqueDisplay = {
    energy: display.energy,
    weaponName: display.weaponName,
    tp: display.tp,
    actionType: display.actionType,
  };
  const partChips = partChipsFromDisplay(display.partChips);
  const detailSections = buildPartsAndMetadataDetailSections({
    damage: display.damageStr !== '-' ? display.damageStr : undefined,
    partChips,
  });
  const totalCost = typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined;

  return {
    id: String(item.id),
    name: String(item.name ?? ''),
    description: String(item.description ?? '') || 'No description available.',
    columns: getItemColumns(item, 'technique', techniqueDisplay),
    detailSections: detailSections.length > 0 ? detailSections : undefined,
    totalCost,
    costLabel: totalCost != null ? 'TP' : undefined,
    data: item,
  };
}
