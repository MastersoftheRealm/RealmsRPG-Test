'use client';

import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/shared/section-header';
import { RollButton } from '@/components/shared/roll-button';
import { TableScroll } from '@/components/ui';
import { cn, formatWeaponRangeCompact, splitDamageDiceAndType } from '@/lib/utils';
import { isMechanicPropertyName } from '@/lib/detail-option/compact-facts';
import { deriveShieldAmountFromProperties } from '@/lib/calculators/item-calc';
import { getWeaponAttackBonusFromProperties } from '@/lib/game/weapon-attack-ability';
import { useRollsOptional } from '@/components/rolls';

/** Named props already shown as table columns (not in MECHANIC_PROPERTY_NAMES). */
const QUICK_ARMAMENT_COLUMN_PROP_NAMES = new Set(['Critical Range +1']);

/**
 * QuickWeaponsTable column classes — content-sized metric cols (not large %) so the table
 * stays inside the panel; Name takes leftover width and wraps property bullets.
 * Use the same `*Td` classes on `trailingRows` (e.g. Unarmed) so columns stay aligned.
 */
export const QUICK_WEAPON_COL = {
  nameTh: 'min-w-0 text-left py-1 pr-1.5',
  rangeTh: 'w-[3.75rem] text-center py-1 px-0.5',
  attackTh: 'w-[3.75rem] text-center py-1 px-0.5',
  damageTh: 'w-[4.25rem] text-center py-1 px-0.5',
  nameTd: 'min-w-0 py-2 pr-1.5 font-medium text-text-secondary align-top',
  rangeTd: 'text-center py-2 px-0.5 text-text-muted dark:text-text-secondary align-top',
  attackTd: 'text-center py-2 px-0.5 align-top',
  damageTd: 'text-center py-2 px-0.5 align-top',
} as const;

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

function displayNamedProperties(props: QuickArmamentItem['properties']): string[] {
  return getPropertyNames(props).filter(
    (name) => name && !isMechanicPropertyName(name) && !QUICK_ARMAMENT_COLUMN_PROP_NAMES.has(name)
  );
}

/** One `• Property` per line under the armament name; long names wrap within the Name column. */
function NamedPropertiesUnderName({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  // Stacked lines (not a semantic list): literal bullets are visual only; index keys allow duplicate names.
  return (
    <div className="mt-0.5 space-y-0.5 text-xs font-normal leading-snug text-text-muted dark:text-text-secondary">
      {names.map((p, i) => (
        <div key={`${p}-${i}`} className="break-words">
          • {p}
        </div>
      ))}
    </div>
  );
}

/** Use library source when enriched armaments only stored property names on `properties`. */
function resolveQuickArmamentProperties(item: QuickArmamentItem): NonNullable<QuickArmamentItem['properties']> {
  const fromLib = item.libraryItem?.properties;
  if (fromLib && fromLib.length > 0) return fromLib;
  return item.properties || [];
}

/** Attack bonus: Ability + martial proficiency (shared weapon-attack-ability). */
function getAttackBonus(item: QuickArmamentItem, abilities: QuickArmamentAbilities, martialProf: number): number {
  const rawProps = resolveQuickArmamentProperties(item);
  const fullAbilities = {
    strength: abilities.strength ?? 0,
    agility: abilities.agility ?? 0,
    acuity: abilities.acuity ?? 0,
    vitality: 0,
    intelligence: 0,
    charisma: 0,
  };
  return getWeaponAttackBonusFromProperties(
    rawProps,
    fullAbilities,
    martialProf,
    item.range
  ).bonus;
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
  /** Extra tbody rows (e.g. Unarmed Prowess) — same column layout as weapon rows. */
  trailingRows,
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
  trailingRows?: ReactNode;
}) {
  const rollContext = useRollsOptional();
  const rows = filterEquipped ? items.filter((w) => w.equipped) : items;

  if (rows.length === 0 && !trailingRows) return null;

  return (
    <div className={cn('bg-surface-alt rounded-lg p-3 mb-4', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
      {/* DESIGN_INTENT: tight content-sized metric cols; Name wraps props so the row fits the panel */}
      <table className="w-full table-fixed text-sm">
        <colgroup>
          <col />
          <col className="w-[3.75rem]" />
          <col className="w-[3.75rem]" />
          <col className="w-[4.25rem]" />
        </colgroup>
        <thead>
          <tr className="text-xs text-text-muted dark:text-text-secondary">
            <th className={QUICK_WEAPON_COL.nameTh}>Name</th>
            <th className={QUICK_WEAPON_COL.rangeTh}>Range</th>
            <th className={QUICK_WEAPON_COL.attackTh}>Attack</th>
            <th className={QUICK_WEAPON_COL.damageTh}>Damage</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((weapon, idx) => {
            const attackBonus = getAttackBonus(weapon, abilities, martialProf);
            const { dice, type, rollStr } = splitDamageDiceAndType(weapon.damage);

            const displayProps = displayNamedProperties(resolveQuickArmamentProperties(weapon));

            return (
              <tr key={String(weapon.id ?? idx)} className="border-b border-border-subtle last:border-0 align-top">
                <td className={QUICK_WEAPON_COL.nameTd}>
                  <div className="break-words">{weapon.name}</div>
                  <NamedPropertiesUnderName names={displayProps} />
                </td>
                <td className={QUICK_WEAPON_COL.rangeTd}>
                  {formatWeaponRangeCompact(weapon.range)}
                </td>
                <td className={QUICK_WEAPON_COL.attackTd}>
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
                <td className={QUICK_WEAPON_COL.damageTd}>
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
                    {type && <span className="text-[10px] break-words text-text-muted dark:text-text-secondary">{type}</span>}
                  </div>
                </td>
              </tr>
            );
          })}
          {trailingRows}
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
            const { dice, rollStr } = splitDamageDiceAndType(shield.damage);
            const hasDamage = rollStr !== '-';
            const damageRollStr = hasDamage ? (String(rollStr).includes('Bludgeoning') ? String(rollStr) : `${rollStr} Bludgeoning`) : '';

            const displayProps = displayNamedProperties(resolveQuickArmamentProperties(shield));

            return (
              <tr key={String(shield.id ?? idx)} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-2 font-medium text-text-secondary">
                  {shield.name}
                  <NamedPropertiesUnderName names={displayProps} />
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

            const displayProps = displayNamedProperties(properties);

            return (
              <tr key={String(armorItem.id ?? idx)} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-1 font-medium text-text-secondary">
                  {armorItem.name}
                  <NamedPropertiesUnderName names={displayProps} />
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

