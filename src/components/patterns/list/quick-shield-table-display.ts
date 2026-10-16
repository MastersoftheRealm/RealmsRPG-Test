import { resolveShieldDamageDisplay, type ItemPropertyPayload } from '@/lib/calculators/item-calc';
import { splitDamageDiceAndType } from '@/lib/utils';

/** Whether the archetype quick shields table should show damage / attack (matches inventory). */
export function quickShieldTableHasDamage(input: {
  shieldDamage?: unknown;
  hasShieldDamage?: boolean | null | undefined;
  properties: ItemPropertyPayload[];
  /** Ignored when `resolveShieldDamageDisplay` returns null (e.g. damage off). */
  legacyItemDamage?: unknown;
}): boolean {
  const damageDisplay = resolveShieldDamageDisplay({
    shieldDamage: input.shieldDamage,
    hasShieldDamage: input.hasShieldDamage,
    properties: input.properties,
    damage: input.legacyItemDamage,
  });
  if (!damageDisplay) return false;
  const { rollStr } = splitDamageDiceAndType(damageDisplay);
  return rollStr !== '-';
}
