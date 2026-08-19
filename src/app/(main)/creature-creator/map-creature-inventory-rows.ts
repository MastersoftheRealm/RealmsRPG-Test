/**
 * Creature Creator selected inventory → sheet library-entity-rows (TASK-817).
 * Play catalog facts come from the same GLR surfaces; stored TP/currency fill chips.
 */

import {
  mapArmorRows,
  mapEquipmentRows,
  mapShieldRows,
  mapWeaponRows,
  type LibraryEntityRowContext,
} from '@/components/character-sheet/library-entity-rows';
import type {
  EntityArmorRow,
  EntityEquipmentRow,
  EntityShieldRow,
  EntityWeaponRow,
} from '@/components/patterns/list/entity-library-sections';
import {
  formatCreatureEquipmentQuantity,
  normalizeCreatureInventoryType,
} from '@/lib/game/creature-inventory';
import type { Item } from '@/types';
import type { CreatureArmamentRow } from './creature-creator-feat-armament-display';
import type { CreatureState } from './creature-creator-types';

type CreatureSheetInventoryItem = Omit<Item, 'range'> & {
  tp?: number | undefined;
  range?: string | undefined;
  armorValue?: number | undefined;
  damageReduction?: number | undefined;
  shieldAmount?: string | undefined;
  shieldDamage?: string | undefined;
  category?: string | undefined;
};

function parseOptionalNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const n = Number(value.replace(/c$/i, '').trim());
  return Number.isFinite(n) ? n : undefined;
}

function positiveNumber(value: unknown): number | undefined {
  const n = parseOptionalNumber(value);
  return n != null && n > 0 ? n : undefined;
}

export function creatureArmamentToSheetItem(
  armament: CreatureArmamentRow,
): CreatureSheetInventoryItem {
  const kind = normalizeCreatureInventoryType(armament.type);
  const tp = positiveNumber(armament.tp);
  const currency = positiveNumber(armament.currency);
  const damageReduction = parseOptionalNumber(
    armament.damageReduction === '-' ? undefined : armament.damageReduction,
  );
  const displayDamage = armament.damage !== '-' ? armament.damage : undefined;
  return {
    id: armament.id,
    name: armament.name,
    type: kind,
    description: armament.description,
    rarity: armament.rarity as Item['rarity'],
    cost: currency,
    tp,
    damage: displayDamage,
    range: armament.range,
    properties: armament.properties as Item['properties'],
    quantity: armament.quantity,
    image_id: armament.image_id,
    image_url: armament.image_url,
    armorValue: armament.armorValue ?? damageReduction,
    damageReduction,
    category: armament.category,
    shieldAmount: kind === 'shield' && armament.block !== '-' ? armament.block : undefined,
    shieldDamage: kind === 'shield' ? displayDamage : undefined,
  };
}

function creatureInventoryRowContext(
  creature: Pick<CreatureState, 'abilities' | 'martialProficiency'>,
  onRemoveArmament: (id: string) => void,
): LibraryEntityRowContext {
  const onRemove = (id: string | number) => onRemoveArmament(String(id));
  return {
    powerPartsDb: [],
    techniquePartsDb: [],
    itemPropertiesDb: [],
    abilities: creature.abilities,
    martialProficiency: creature.martialProficiency,
    showLibraryEditControls: true,
    rollContext: null,
    hasMissingForEntry: () => false,
    onRemoveWeapon: onRemove,
    onRemoveShield: onRemove,
    onRemoveArmor: onRemove,
    onRemoveEquipment: onRemove,
  };
}

function withCreatureEquipmentQuantity(
  row: EntityEquipmentRow,
  quantity: number | undefined,
): EntityEquipmentRow {
  return {
    ...row,
    columns: (row.columns ?? []).map((col) =>
      col.key === 'quantity'
        ? { ...col, value: formatCreatureEquipmentQuantity(quantity), align: 'center' as const }
        : col,
    ),
  };
}

export function mapCreatureSelectedInventoryRows(opts: {
  sortedArmaments: CreatureArmamentRow[];
  creature: Pick<CreatureState, 'abilities' | 'martialProficiency'>;
  onRemoveArmament: (id: string) => void;
}): {
  weapons: EntityWeaponRow[];
  shields: EntityShieldRow[];
  armor: EntityArmorRow[];
  equipment: EntityEquipmentRow[];
} {
  const ctx = creatureInventoryRowContext(opts.creature, opts.onRemoveArmament);
  const weapons: CreatureSheetInventoryItem[] = [];
  const shields: CreatureSheetInventoryItem[] = [];
  const armor: CreatureSheetInventoryItem[] = [];
  const equipment: CreatureSheetInventoryItem[] = [];

  for (const row of opts.sortedArmaments) {
    const item = creatureArmamentToSheetItem(row);
    const kind = normalizeCreatureInventoryType(row.type);
    if (kind === 'weapon') weapons.push(item);
    else if (kind === 'shield') shields.push(item);
    else if (kind === 'armor') armor.push(item);
    else equipment.push(item);
  }

  return {
    weapons: mapWeaponRows(weapons as Item[], ctx),
    shields: mapShieldRows(shields as Item[], ctx),
    armor: mapArmorRows(armor as Item[], ctx),
    equipment: mapEquipmentRows(equipment as Item[], ctx).map((row, index) =>
      withCreatureEquipmentQuantity(row, equipment[index]?.quantity),
    ),
  };
}
