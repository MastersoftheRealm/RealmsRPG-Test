/**
 * Canonical armor Damage Reduction resolution (TASK-644).
 * Scalar fields take precedence over the Damage Reduction property (1 + op_1_lvl).
 */

import {
  deriveDamageReductionFromProperties,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';

export type ArmorDrSource = {
  damageReduction?: number | null;
  armorValue?: number | null;
  armor?: number | null;
  armor_value?: number | null;
  properties?:
    | ItemPropertyPayload[]
    | Array<string | { id?: number | string; name?: string; op_1_lvl?: number }>;
};

function propertiesForDr(props: ArmorDrSource['properties']): ItemPropertyPayload[] {
  if (!Array.isArray(props)) return [];
  const payloads: ItemPropertyPayload[] = [];
  for (const p of props) {
    if (typeof p === 'string') continue;
    payloads.push({
      id: typeof p.id === 'number' ? p.id : undefined,
      name: p.name,
      op_1_lvl: p.op_1_lvl,
    });
  }
  return payloads;
}

/** Resolve Damage Reduction for armor (sheet, library, enrichment, guided catalog). */
export function resolveArmorDamageReduction(source: ArmorDrSource): number {
  const direct = source.damageReduction ?? source.armorValue ?? source.armor ?? source.armor_value;
  if (typeof direct === 'number' && !Number.isNaN(direct)) {
    return direct;
  }
  return deriveDamageReductionFromProperties(propertiesForDr(source.properties));
}
