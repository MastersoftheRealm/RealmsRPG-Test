/**
 * Canonical armor Damage Reduction resolution (TASK-644).
 * Scalar fields take precedence over the Damage Reduction property (1 + op_1_lvl).
 */

import {
  deriveDamageReductionFromProperties,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';

export type ArmorDrSource = {
  damageReduction?: number | null | undefined;
  armorValue?: number | null | undefined;
  armor?: number | null | undefined;
  armor_value?: number | null | undefined;
  properties?:
    | ItemPropertyPayload[]
    | Array<
        | string
        | {
            id?: number | string | undefined;
            name?: string | undefined;
            op_1_lvl?: number | undefined;
          }
      >
    | undefined;
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
