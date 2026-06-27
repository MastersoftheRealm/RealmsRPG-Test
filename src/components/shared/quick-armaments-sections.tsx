'use client';

import { SectionHeader } from '@/components/shared/section-header';
import { RollButton } from '@/components/shared/roll-button';
import { TableScroll } from '@/components/ui';
import { cn, formatDamageDisplay } from '@/lib/utils';
import { deriveShieldAmountFromProperties, formatRange } from '@/lib/calculators/item-calc';
import { useRollsOptional } from '@/components/character-sheet/roll-context';

export type QuickArmamentAbilities = {
  strength?: number;
  agility?: number;
  acuity?: number;
};

export type QuickArmamentItem = {
  id?: string | number;
  name: string;
  description?: string;
  damage?: unknown;
  range?: string;
  properties?: Array<string | { name?: string; id?: number; op_1_lvl?: number }>;
  equipped?: boolean;
  armorValue?: number;
  armor?: number;
  /** Present on sheet-enriched items: full property payloads (op_1_lvl, etc.); `properties` may be name-only strings. */
  libraryItem?: { properties?: QuickArmamentItem['properties'] };
};

function getPropertyNames(props: QuickArmamentItem['properties']): string[] {
  return (props || []).map((p) => (typeof p === 'string' ? p : p?.name || '')).filter(Boolean);
}

/** Use library source when enriched armaments only stored property names on `properties`. */
function resolveQuickArmamentProperties(item: QuickArmamentItem): NonNullable<QuickArmamentItem['properties']> {
  const fromLib = item.libraryItem?.properties;
  if (fromLib && fromLib.length > 0) return fromLib;
  return item.properties || [];
}

/** Attack bonus: Ability + martial proficiency. Finesse → Agility; Range (non-melee) → Acuity; else Strength. */
function getAttackBonus(item: QuickArmamentItem, abilities: QuickArmamentAbilities, martialProf: number): number {
  const rawProps = resolveQuickArmamentProperties(item);
  const props = getPropertyNames(rawProps).map((p) => p.toLowerCase());
  if (props.includes('finesse')) return (abilities.agility ?? 0) + martialProf;
  const rangeStr = item.range ?? formatRange(rawProps as { id?: number; name?: string; op_1_lvl?: number }[]);
  if (String(rangeStr).toLowerCase() !== 'melee') return (abilities.acuity ?? 0) + martialProf;
  return (abilities.strength ?? 0) + martialProf;
}

function parseDamageDiceAndType(damage: unknown): { dice: string; type: string; rollStr: string } {
  if (!damage) return { dice: '-', type: '', rollStr: '-' };
  if (typeof damage === 'string') {
    const strDamage = damage.trim();
    const match = strDamage.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
    if (!match) return { dice: strDamage, type: '', rollStr: strDamage };
    return { dice: match[1].trim(), type: (match[2] ?? '').trim(), rollStr: strDamage };
  }
  // Fall back to shared formatter for non-string shapes (if any)
  const formatted = formatDamageDisplay(damage as never);
  const formattedStr = formatted ? String(formatted).trim() : '';
  if (!formattedStr) return { dice: '-', type: '', rollStr: '-' };
  const match = formattedStr.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
  if (!match) return { dice: formattedStr, type: '', rollStr: formattedStr };
  return { dice: match[1].trim(), type: (match[2] ?? '').trim(), rollStr: formattedStr };
}

export function QuickWeaponsTable({
  title = 'Weapons',
  items,
  abilities,
  martialProf,
  className,
  filterEquipped = false,
  rollTitlePrefix,
  showHeader = true,
}: {
  title?: string;
  items: QuickArmamentItem[];
  abilities: QuickArmamentAbilities;
  martialProf: number;
  className?: string;
  /** When true, only show equipped items (character sheet). Creatures pass false. */
  filterEquipped?: boolean;
  /** Optional prefix (e.g. creature name) so roll log shows the source. */
  rollTitlePrefix?: string;
  /** When false, omit the SectionHeader wrapper (caller provides its own) */
  showHeader?: boolean;
}) {
  const rollContext = useRollsOptional();
  const rows = filterEquipped ? items.filter((w) => w.equipped) : items;

  if (rows.length === 0) return null;

  return (
    <div className={cn('bg-surface-alt rounded-lg p-3 mb-4', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted dark:text-text-secondary">
            <th className="text-left py-1">Name</th>
            <th className="text-center py-1">Range</th>
            <th className="text-center py-1">Attack</th>
            <th className="text-center py-1">Damage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((weapon, idx) => {
            const attackBonus = getAttackBonus(weapon, abilities, martialProf);
            const { dice, type, rollStr } = parseDamageDiceAndType(weapon.damage);

            const excludedProps = ['Damage Reduction', 'Split Damage Dice', 'Range', 'Shield Base', 'Armor Base', 'Weapon Damage'];
            const displayProps = getPropertyNames(resolveQuickArmamentProperties(weapon)).filter((p) => p && !excludedProps.includes(p));

            return (
              <tr key={String(weapon.id ?? idx)} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-2 font-medium text-text-secondary">
                  {weapon.name}
                  {displayProps.length > 0 && (
                    <div className="text-xs text-text-muted dark:text-text-secondary font-normal">
                      {displayProps.map((p) => `• ${p}`).join(' ')}
                    </div>
                  )}
                </td>
                <td className="text-center py-2 text-text-muted dark:text-text-secondary">
                  {weapon.range || 'Melee'}
                </td>
                <td className="text-center py-2">
                  {rollContext?.canRoll !== false && rollContext ? (
                    <RollButton
                      value={attackBonus}
                      onClick={() =>
                        rollContext.rollAttack(
                          rollTitlePrefix ? `${rollTitlePrefix}: ${weapon.name || 'Attack'}` : (weapon.name || 'Attack'),
                          attackBonus
                        )
                      }
                      size="sm"
                      title={`Roll attack with ${weapon.name}`}
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-muted dark:text-text-secondary">
                      {attackBonus >= 0 ? '+' : ''}
                      {attackBonus}
                    </span>
                  )}
                </td>
                <td className="text-center py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    {rollContext?.canRoll !== false && rollContext && rollStr !== '-' ? (
                      <RollButton
                        value={0}
                        displayValue={dice}
                        variant="danger"
                        onClick={() =>
                          rollContext.rollDamage(
                            String(rollStr),
                            attackBonus,
                            rollTitlePrefix ? `${rollTitlePrefix}: ${weapon.name} damage` : `${weapon.name} damage`
                          )
                        }
                        size="sm"
                        title={`Roll ${rollStr} damage`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-text-muted dark:text-text-secondary">{dice}</span>
                    )}
                    {type && <span className="text-[10px] text-text-muted dark:text-text-secondary">{type}</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </TableScroll>
    </div>
  );
}

export function QuickShieldsTable({
  title = 'Shields',
  items,
  abilities,
  martialProf,
  className,
  filterEquipped = false,
  rollTitlePrefix,
  showHeader = true,
}: {
  title?: string;
  items: QuickArmamentItem[];
  abilities: QuickArmamentAbilities;
  martialProf: number;
  className?: string;
  filterEquipped?: boolean;
  rollTitlePrefix?: string;
  showHeader?: boolean;
}) {
  const rollContext = useRollsOptional();
  const rows = filterEquipped ? items.filter((s) => s.equipped) : items;

  if (rows.length === 0) return null;

  const strBonus = (abilities.strength ?? 0) + martialProf;

  return (
    <div className={cn('bg-surface-alt rounded-lg p-3 mb-4', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted dark:text-text-secondary">
            <th className="text-left py-1">Name</th>
            <th className="text-center py-1">Block</th>
            <th className="text-center py-1">Damage</th>
            <th className="text-center py-1">Attack</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((shield, idx) => {
            const blockStr = String(
              deriveShieldAmountFromProperties(
                resolveQuickArmamentProperties(shield) as { id?: number; name?: string; op_1_lvl?: number }[]
              ) ?? '-'
            );
            const { dice, rollStr } = parseDamageDiceAndType(shield.damage);
            const hasDamage = rollStr !== '-';
            const damageRollStr = hasDamage ? (String(rollStr).includes('Bludgeoning') ? String(rollStr) : `${rollStr} Bludgeoning`) : '';

            const excludedProps = ['Damage Reduction', 'Split Damage Dice', 'Range', 'Shield Base', 'Armor Base', 'Weapon Damage'];
            const displayProps = getPropertyNames(resolveQuickArmamentProperties(shield)).filter((p) => p && !excludedProps.includes(p));

            return (
              <tr key={String(shield.id ?? idx)} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-2 font-medium text-text-secondary">
                  {shield.name}
                  {displayProps.length > 0 && (
                    <div className="text-xs text-text-muted dark:text-text-secondary font-normal">
                      {displayProps.map((p) => `• ${p}`).join(' ')}
                    </div>
                  )}
                </td>
                <td className="text-center py-2">
                  {blockStr !== '-' && rollContext?.canRoll !== false && rollContext ? (
                    <RollButton
                      value={0}
                      displayValue={blockStr}
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        rollContext.rollDamage(
                          `${blockStr} Bludgeoning`,
                          0,
                          rollTitlePrefix ? `${rollTitlePrefix}: Shield block` : 'Shield block'
                        )
                      }
                      title="Roll shield block amount"
                    />
                  ) : (
                    <span className="text-text-muted dark:text-text-secondary">{blockStr}</span>
                  )}
                </td>
                <td className="text-center py-2">
                  {hasDamage && rollContext?.canRoll !== false && rollContext ? (
                    <RollButton
                      value={0}
                      displayValue={dice}
                      variant="danger"
                      size="sm"
                      onClick={() =>
                        rollContext.rollDamage(
                          damageRollStr,
                          strBonus,
                          rollTitlePrefix ? `${rollTitlePrefix}: ${shield.name} damage` : `${shield.name} damage`
                        )
                      }
                      title={`Roll ${dice} damage`}
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-muted dark:text-text-secondary">{hasDamage ? dice : '-'}</span>
                  )}
                </td>
                <td className="text-center py-2">
                  {hasDamage && rollContext?.canRoll !== false && rollContext ? (
                    <RollButton
                      value={strBonus}
                      onClick={() =>
                        rollContext.rollAttack(
                          rollTitlePrefix ? `${rollTitlePrefix}: ${shield.name || 'Shield bash'}` : (shield.name || 'Shield bash'),
                          strBonus
                        )
                      }
                      size="sm"
                      title={`Roll attack with ${shield.name}`}
                    />
                  ) : (
                    <span className="text-text-muted dark:text-text-secondary">{hasDamage ? (strBonus >= 0 ? '+' : '') + strBonus : '-'}</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </TableScroll>
    </div>
  );
}

export function QuickArmorTable({
  title = 'Armor',
  items,
  abilities,
  className,
  filterEquipped = false,
  showHeader = true,
}: {
  title?: string;
  items: QuickArmamentItem[];
  abilities: { agility?: number };
  className?: string;
  filterEquipped?: boolean;
  showHeader?: boolean;
}) {
  const rows = filterEquipped ? items.filter((a) => a.equipped) : items;
  if (rows.length === 0) return null;

  const agility = abilities.agility ?? 0;
  const baseEvasion = 10 + agility;

  return (
    <div className={cn('bg-surface-alt rounded-lg p-3 mb-4', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted dark:text-text-secondary">
            <th className="text-left py-1">Name</th>
            <th className="text-center py-1">DMG Red.</th>
            <th className="text-center py-1">Crit Rng</th>
            <th className="text-center py-1">Abl Req.</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((armorItem, idx) => {
            const properties = resolveQuickArmamentProperties(armorItem);
            const armorWithVal = armorItem as { armorValue?: number; armor?: number };
            let damageReduction = armorWithVal.armorValue ?? armorWithVal.armor ?? 0;
            let critRangeBonus = 0;
            const abilityReqs: string[] = [];

            properties.forEach((prop) => {
              if (!prop) return;
              const propName = typeof prop === 'string' ? prop : prop.name || '';
              const op1Lvl =
                typeof prop === 'object' && 'op_1_lvl' in prop ? Number((prop as { op_1_lvl?: number }).op_1_lvl) || 0 : 0;

              if (propName === 'Damage Reduction' && damageReduction === 0) {
                damageReduction = 1 + op1Lvl;
              }
              if (propName === 'Critical Range +1') critRangeBonus = 1 + op1Lvl;
              if (propName.includes('Strength Requirement')) abilityReqs.push(`STR ${1 + op1Lvl}`);
              if (propName.includes('Agility Requirement')) abilityReqs.push(`AGI ${1 + op1Lvl}`);
              if (propName.includes('Vitality Requirement')) abilityReqs.push(`VIT ${1 + op1Lvl}`);
            });

            const critRange = baseEvasion + 10 + critRangeBonus;

            const excludedProps = [
              'Damage Reduction',
              'Split Damage Dice',
              'Range',
              'Shield Base',
              'Armor Base',
              'Weapon Damage',
              'Critical Range +1',
              'Armor Strength Requirement',
              'Armor Agility Requirement',
              'Armor Vitality Requirement',
            ];
            const propNames = getPropertyNames(properties);
            const displayProps = propNames.filter((n) => n && !excludedProps.includes(n));

            return (
              <tr key={String(armorItem.id ?? idx)} className="border-b border-border-subtle last:border-0">
                <td className="py-1 font-medium text-text-secondary">
                  {armorItem.name}
                  {displayProps.length > 0 && (
                    <div className="text-xs text-text-muted dark:text-text-secondary font-normal">
                      {displayProps.map((p) => `• ${p}`).join(' ')}
                    </div>
                  )}
                </td>
                <td className="text-center py-1 font-mono">{damageReduction || 0}</td>
                <td className="text-center py-1 font-mono">{critRange}</td>
                <td className="text-center py-1 text-xs">{abilityReqs.join(', ') || 'None'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      </TableScroll>
    </div>
  );
}

