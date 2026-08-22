'use client';

import type { ReactNode } from 'react';
import { SectionHeader } from '@/components/patterns/chrome/section-header';
import { RollButton } from '@/components/patterns/chrome/roll-button';
import { TableScroll } from '@/components/ui';
import { cn, splitDamageDiceAndType } from '@/lib/utils';
import { isMechanicPropertyName } from '@/lib/detail-option/compact-facts';
import {
  deriveCriticalRangeIncreaseFromProperties,
  deriveDamageReductionFromProperties,
  deriveShieldAmountFromProperties,
  formatWeaponRangeDisplayCompact,
  type ItemPropertyPayload,
} from '@/lib/calculators/item-calc';
import { calculateCriticalRange, calculateEvasion } from '@/lib/game/calculations';
import { getWeaponAttackBonusFromProperties } from '@/lib/game/weapon-attack-ability';
import { useRollsOptional } from '@/components/rolls';

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
  rangeTd: 'text-center py-2 px-0.5 text-text-muted align-top',
  attackTd: 'text-center py-2 px-0.5 align-top',
  damageTd: 'text-center py-2 px-0.5 align-top',
} as const;

export type QuickArmamentAbilities = {
  strength?: number | undefined;
  agility?: number | undefined;
  acuity?: number | undefined;
};

export type QuickArmamentItem = {
  id?: string | number | undefined;
  name: string;
  description?: string | undefined;
  damage?: unknown | undefined;
  range?: string | undefined;
  properties?:
    | Array<
        | string
        | { name?: string | undefined; id?: number | undefined; op_1_lvl?: number | undefined }
      >
    | undefined;
  equipped?: boolean | undefined;
  armorValue?: number | undefined;
  armor?: number | undefined;
  /** Present on sheet-enriched items: full property payloads (op_1_lvl, etc.); `properties` may be name-only strings. */
  libraryItem?: { properties?: QuickArmamentItem['properties'] | undefined } | undefined;
};

function getPropertyNames(props: QuickArmamentItem['properties']): string[] {
  return (props || []).map((p) => (typeof p === 'string' ? p : p?.name || '')).filter(Boolean);
}

function displayNamedProperties(props: QuickArmamentItem['properties']): string[] {
  return getPropertyNames(props).filter((name) => name && !isMechanicPropertyName(name));
}

/** One `• Property` per line under the armament name; truncate if a token would char-wrap. */
function NamedPropertiesUnderName({ names }: { names: string[] }) {
  if (names.length === 0) return null;
  // Stacked lines (not a semantic list): literal bullets are visual only; index keys allow duplicate names.
  return (
    <div className="mt-0.5 space-y-0.5 text-xs leading-snug font-normal text-text-muted">
      {names.map((p, i) => (
        <div key={`${p}-${i}`} className="min-w-0 truncate" title={p}>
          • {p}
        </div>
      ))}
    </div>
  );
}

/** Use library source when enriched armaments only stored property names on `properties`. */
function resolveQuickArmamentProperties(
  item: QuickArmamentItem,
): NonNullable<QuickArmamentItem['properties']> {
  const fromLib = item.libraryItem?.properties;
  if (fromLib && fromLib.length > 0) return fromLib;
  return item.properties || [];
}

/** Attack bonus: Ability + martial proficiency (shared weapon-attack-ability). */
function getAttackBonus(
  item: QuickArmamentItem,
  abilities: QuickArmamentAbilities,
  martialProf: number,
): number {
  const rawProps = resolveQuickArmamentProperties(item);
  const fullAbilities = {
    strength: abilities.strength ?? 0,
    agility: abilities.agility ?? 0,
    acuity: abilities.acuity ?? 0,
    vitality: 0,
    intelligence: 0,
    charisma: 0,
  };
  return getWeaponAttackBonusFromProperties(rawProps, fullAbilities, martialProf, item.range).bonus;
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
  title?: string | undefined;
  items: QuickArmamentItem[];
  abilities: QuickArmamentAbilities;
  martialProf: number;
  className?: string | undefined;
  /** When true, only show equipped items (character sheet). Creatures pass false. */
  filterEquipped?: boolean | undefined;
  /** Optional prefix (e.g. creature name) so roll log shows the source. */
  rollTitlePrefix?: string | undefined;
  /** When false, omit the SectionHeader wrapper (caller provides its own) */
  showHeader?: boolean | undefined;
  trailingRows?: ReactNode | undefined;
}) {
  const rollContext = useRollsOptional();
  const rows = filterEquipped ? items.filter((w) => w.equipped) : items;

  if (rows.length === 0 && !trailingRows) return null;

  return (
    <div className={cn('mb-4 rounded-lg bg-surface-alt p-3', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
        {/* DESIGN_INTENT: tight content-sized metric cols; Name wraps props so the row fits the panel */}
        <table className="w-full table-fixed text-sm">
          <colgroup>
            <col />
            <col className="w-[3.75rem]" />
            <col className="w-[4.25rem]" />
          </colgroup>
          <thead>
            <tr className="text-xs text-text-muted">
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
                <tr
                  key={String(weapon.id ?? idx)}
                  className="border-b border-border-subtle align-top last:border-0"
                >
                  <td className={QUICK_WEAPON_COL.nameTd}>
                    <div className="min-w-0 truncate" title={weapon.name}>
                      {weapon.name}
                    </div>
                    <NamedPropertiesUnderName names={displayProps} />
                  </td>
                  <td className={QUICK_WEAPON_COL.rangeTd}>
                    {formatWeaponRangeDisplayCompact(
                      weapon.range,
                      resolveQuickArmamentProperties(weapon) as ItemPropertyPayload[],
                    )}
                  </td>
                  <td className={QUICK_WEAPON_COL.attackTd}>
                    {rollContext?.canRoll !== false && rollContext ? (
                      <RollButton
                        value={attackBonus}
                        onClick={() =>
                          rollContext.rollAttack(
                            rollTitlePrefix
                              ? `${rollTitlePrefix}: ${weapon.name || 'Attack'}`
                              : weapon.name || 'Attack',
                            attackBonus,
                          )
                        }
                        size="sm"
                        title={`Roll attack with ${weapon.name}`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-text-muted">
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
                              rollTitlePrefix
                                ? `${rollTitlePrefix}: ${weapon.name} damage`
                                : `${weapon.name} damage`,
                            )
                          }
                          size="sm"
                          title={`Roll ${rollStr} damage`}
                        />
                      ) : (
                        <span className="text-sm font-medium text-text-muted">{dice}</span>
                      )}
                      {type && <span className="text-[10px] text-text-muted">{type}</span>}
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
  title?: string | undefined;
  items: QuickArmamentItem[];
  abilities: QuickArmamentAbilities;
  martialProf: number;
  className?: string | undefined;
  filterEquipped?: boolean | undefined;
  rollTitlePrefix?: string | undefined;
  showHeader?: boolean | undefined;
}) {
  const rollContext = useRollsOptional();
  const rows = filterEquipped ? items.filter((s) => s.equipped) : items;

  if (rows.length === 0) return null;

  const strBonus = (abilities.strength ?? 0) + martialProf;

  return (
    <div className={cn('mb-4 rounded-lg bg-surface-alt p-3', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted">
              <th className="py-1 text-left">Name</th>
              <th className="py-1 text-center">Block</th>
              <th className="py-1 text-center">Damage</th>
              <th className="py-1 text-center">Attack</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((shield, idx) => {
              const blockStr = String(
                deriveShieldAmountFromProperties(
                  resolveQuickArmamentProperties(shield) as {
                    id?: number | undefined;
                    name?: string | undefined;
                    op_1_lvl?: number | undefined;
                  }[],
                ) ?? '-',
              );
              const { dice, rollStr } = splitDamageDiceAndType(shield.damage);
              const hasDamage = rollStr !== '-';
              const damageRollStr = hasDamage
                ? String(rollStr).includes('Bludgeoning')
                  ? String(rollStr)
                  : `${rollStr} Bludgeoning`
                : '';

              const displayProps = displayNamedProperties(resolveQuickArmamentProperties(shield));

              return (
                <tr
                  key={String(shield.id ?? idx)}
                  className="border-b border-border-subtle align-top last:border-0"
                >
                  <td className="py-2 font-medium text-text-secondary">
                    {shield.name}
                    <NamedPropertiesUnderName names={displayProps} />
                  </td>
                  <td className="py-2 text-center">
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
                            rollTitlePrefix ? `${rollTitlePrefix}: Shield block` : 'Shield block',
                          )
                        }
                        title="Roll shield block amount"
                      />
                    ) : (
                      <span className="text-text-muted">{blockStr}</span>
                    )}
                  </td>
                  <td className="py-2 text-center">
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
                            rollTitlePrefix
                              ? `${rollTitlePrefix}: ${shield.name} damage`
                              : `${shield.name} damage`,
                          )
                        }
                        title={`Roll ${dice} damage`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-text-muted">
                        {hasDamage ? dice : '-'}
                      </span>
                    )}
                  </td>
                  <td className="py-2 text-center">
                    {hasDamage && rollContext?.canRoll !== false && rollContext ? (
                      <RollButton
                        value={strBonus}
                        onClick={() =>
                          rollContext.rollAttack(
                            rollTitlePrefix
                              ? `${rollTitlePrefix}: ${shield.name || 'Shield bash'}`
                              : shield.name || 'Shield bash',
                            strBonus,
                          )
                        }
                        size="sm"
                        title={`Roll attack with ${shield.name}`}
                      />
                    ) : (
                      <span className="text-text-muted">
                        {hasDamage ? (strBonus >= 0 ? '+' : '') + strBonus : '-'}
                      </span>
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
  title?: string | undefined;
  items: QuickArmamentItem[];
  abilities: { agility?: number | undefined };
  className?: string | undefined;
  filterEquipped?: boolean | undefined;
  showHeader?: boolean | undefined;
}) {
  const rows = filterEquipped ? items.filter((a) => a.equipped) : items;
  if (rows.length === 0) return null;

  const evasion = calculateEvasion(abilities.agility ?? 0);

  return (
    <div className={cn('mb-4 rounded-lg bg-surface-alt p-3', className)}>
      {showHeader && <SectionHeader title={title} className="mb-2" />}
      <TableScroll>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-text-muted">
              <th className="py-1 text-left">Name</th>
              <th className="py-1 text-center">DMG Red.</th>
              <th className="py-1 text-center">Crit Rng</th>
              <th className="py-1 text-center">Abl Req.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((armorItem, idx) => {
              const properties = resolveQuickArmamentProperties(armorItem);
              const payload: ItemPropertyPayload[] = [];
              const abilityReqs: string[] = [];
              for (const prop of properties) {
                if (!prop) continue;
                if (typeof prop === 'string') {
                  payload.push({ name: prop });
                  continue;
                }
                payload.push({ id: prop.id, name: prop.name, op_1_lvl: prop.op_1_lvl });
                const propName = prop.name || '';
                const op1Lvl = Number(prop.op_1_lvl) || 0;
                if (propName.includes('Strength Requirement'))
                  abilityReqs.push(`STR ${1 + op1Lvl}`);
                if (propName.includes('Agility Requirement')) abilityReqs.push(`AGI ${1 + op1Lvl}`);
                if (propName.includes('Vitality Requirement'))
                  abilityReqs.push(`VIT ${1 + op1Lvl}`);
              }
              let damageReduction = armorItem.armorValue ?? armorItem.armor ?? 0;
              if (damageReduction === 0) {
                damageReduction = deriveDamageReductionFromProperties(payload);
              }
              const critRange = calculateCriticalRange(
                evasion,
                deriveCriticalRangeIncreaseFromProperties(payload),
              );

              const displayProps = displayNamedProperties(properties);

              return (
                <tr
                  key={String(armorItem.id ?? idx)}
                  className="border-b border-border-subtle align-top last:border-0"
                >
                  <td className="py-1 font-medium text-text-secondary">
                    {armorItem.name}
                    <NamedPropertiesUnderName names={displayProps} />
                  </td>
                  <td className="py-1 text-center font-mono">{damageReduction || 0}</td>
                  <td className="py-1 text-center font-mono">{critRange}</td>
                  <td className="py-1 text-center text-xs">{abilityReqs.join(', ') || 'None'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </TableScroll>
    </div>
  );
}
