import type { Item } from '@/types';

/** Build a one-off inventory item (not from library/codex). */
export function buildCustomEquipmentItem(
  name: string,
  description?: string,
  quantity = 1
): Item {
  const trimmed = name.trim();
  return {
    id: `custom-${crypto.randomUUID()}`,
    name: trimmed,
    description: description?.trim() || '',
    type: 'equipment',
    equipped: false,
    quantity: Math.max(1, Math.floor(quantity)),
    cost: 0,
  };
}
