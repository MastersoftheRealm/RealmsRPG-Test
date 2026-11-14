/**
 * Merge official library armament fields onto codex_equipment rows before mapCodexEquipment.
 * codex_equipment stores catalog currency/rarity; type + properties live on official_items (same id).
 */

import { rowToItem } from '@/lib/library-columnar';
import { normalizeArmamentKind } from '@/lib/library/official-item-list';
import type { LibraryItem } from '@/types/library';

export type OfficialArmamentCodexMergeItem = Pick<
  LibraryItem,
  'id' | 'type' | 'properties' | 'costs'
>;

export function indexOfficialArmamentsForCodexEquipmentMerge(
  officialRows: Record<string, unknown>[],
): Map<string, OfficialArmamentCodexMergeItem> {
  const map = new Map<string, OfficialArmamentCodexMergeItem>();
  for (const row of officialRows) {
    const item = rowToItem('items', row, 'official') as unknown as LibraryItem;
    const kind = normalizeArmamentKind(item.type);
    if (!kind) continue;
    const id = String(item.id ?? '').trim();
    if (!id) continue;
    map.set(id, {
      id,
      type: kind,
      properties: item.properties,
      costs: item.costs,
    });
  }
  return map;
}

/** Applies official armament type/properties when codex_equipment id matches official_items. */
export function mergeOfficialArmamentIntoCodexEquipmentRow(
  codexRow: Record<string, unknown>,
  officialById: Map<string, OfficialArmamentCodexMergeItem>,
): Record<string, unknown> {
  const id = String(codexRow.id ?? '').trim();
  if (!id) return codexRow;
  const official = officialById.get(id);
  if (!official) return codexRow;
  return {
    ...codexRow,
    type: official.type,
    properties: official.properties,
    costs: official.costs,
  };
}
