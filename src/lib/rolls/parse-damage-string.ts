/**
 * Parse a damage label such as "1d6 fire, 1d8 ice, 1d4 acid" into roll groups.
 * `rollDamage` used a single non-global match, so Modify (and any multi-group
 * label) only rolled the first NdM.
 */

export type DamageRollGroup = {
  count: number;
  size: number;
  modifier: number;
  type?: string;
};

const DAMAGE_GROUP = /(\d+)d(\d+)([+-]\d+)?(?:\s+([a-zA-Z]+))?/g;

export function parseDamageRollGroups(damageStr: string): DamageRollGroup[] {
  if (typeof damageStr !== 'string') return [];
  const groups: DamageRollGroup[] = [];
  for (const match of damageStr.matchAll(DAMAGE_GROUP)) {
    const count = Number.parseInt(match[1] ?? '', 10);
    const size = Number.parseInt(match[2] ?? '', 10);
    if (!Number.isFinite(count) || !Number.isFinite(size)) continue;
    const modifier = match[3] ? Number.parseInt(match[3], 10) : 0;
    const type = match[4];
    groups.push({
      count,
      size,
      modifier: Number.isFinite(modifier) ? modifier : 0,
      ...(type ? { type } : {}),
    });
  }
  return groups;
}
