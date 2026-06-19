'use client';

/**
 * Maps character sheet library items to entity-library-section row shapes.
 */

import type { ReactNode } from 'react';
import {
  formatActionTypeForDisplay,
  formatListCellLabel,
  normalizeRangeDisplay,
} from '@/lib/utils';
import {
  InnateToggle,
  RollButton,
  EquipToggle,
  QuantitySelector,
  type ColumnValue,
} from '@/components/shared';
import type {
  EntityPowerRow,
  EntityTechniqueRow,
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
} from '@/components/shared/entity-library-sections';
import {
  POWER_GRID,
  CHARACTER_SHEET_WEAPON_GRID,
  CHARACTER_SHEET_SHIELD_GRID,
} from '@/components/shared/entity-library-sections';
import type { useRollsOptional } from './roll-context';
import type { Abilities, CharacterPower, CharacterTechnique, Item } from '@/types';
import {
  type CodexPart,
  type CodexProperty,
  type ItemWithLibrarySource,
  partsToPartData,
  propertiesToPartData,
  partDataToChips,
  formatArea,
  formatDuration,
  formatDamageType,
  getWeaponAttackBonus,
  resolveItemProperties,
  splitDamageDiceAndType,
} from './library-list-helpers';

type RollContext = ReturnType<typeof useRollsOptional>;

export type LibraryEntityRowContext = {
  powerPartsDb: CodexPart[];
  techniquePartsDb: CodexPart[];
  itemPropertiesDb: CodexProperty[];
  abilities?: Abilities;
  martialProficiency?: number;
  currentEnergy?: number;
  showLibraryEditControls: boolean;
  rollContext: RollContext;
  hasMissingForEntry: (params: {
    powers?: CharacterPower[];
    techniques?: CharacterTechnique[];
    weapons?: Item[];
    shields?: Item[];
    armor?: Item[];
  }) => boolean;
  onUsePower?: (id: string | number, energyCost: number) => void;
  onRemovePower?: (id: string | number) => void;
  onTogglePowerInnate?: (id: string | number, isInnate: boolean) => void;
  onUseTechnique?: (id: string | number, energyCost: number) => void;
  onRemoveTechnique?: (id: string | number) => void;
  onRemoveWeapon?: (id: string | number) => void;
  onToggleEquipWeapon?: (id: string | number) => void;
  onRemoveShield?: (id: string | number) => void;
  onToggleEquipShield?: (id: string | number) => void;
  onRemoveArmor?: (id: string | number) => void;
  onToggleEquipArmor?: (id: string | number) => void;
  onRemoveEquipment?: (id: string | number) => void;
  onEquipmentQuantityChange?: (id: string | number, delta: number) => void;
};

function needsProfBadge(
  ctx: LibraryEntityRowContext,
  params: Parameters<LibraryEntityRowContext['hasMissingForEntry']>[0]
) {
  return ctx.hasMissingForEntry(params)
    ? ([{ label: 'Needs Proficiency', color: 'red' as const }] as EntityPowerRow['badges'])
    : undefined;
}

function buildEnergyButton(
  energyCost: number,
  canUse: boolean,
  onUse: ((id: string | number, cost: number) => void) | undefined,
  id: string | number,
  variant: 'primary' | 'success'
): ReactNode {
  if (onUse && energyCost > 0) {
    return (
      <RollButton
        value={energyCost}
        displayValue={String(energyCost)}
        onClick={() => onUse(id, energyCost)}
        disabled={!canUse}
        variant={variant}
        size="sm"
        title={canUse ? `Use (costs ${energyCost} EP)` : 'Not enough energy'}
      />
    );
  }
  if (energyCost > 0) {
    return <span className="text-sm font-medium text-text-secondary">{energyCost}</span>;
  }
  return null;
}

export function mapPowerRows(powers: CharacterPower[], ctx: LibraryEntityRowContext): EntityPowerRow[] {
  return powers.map((power, i) => {
    const id = power.id || String(i);
    const isInnate = power.innate === true;
    const energyCost = power.cost ?? 0;
    const canUse = ctx.currentEnergy !== undefined && ctx.currentEnergy >= energyCost;
    const partChips = partDataToChips(partsToPartData(power.parts, ctx.powerPartsDb));
    const powerTotalTP = partChips.reduce((sum, p) => sum + (p.cost ?? 0), 0);

    const damageCell =
      power.damage && ctx.rollContext?.rollDamage ? (
        <RollButton
          value={0}
          displayValue={formatDamageType(power.damage)}
          variant="danger"
          size="sm"
          onClick={() => ctx.rollContext!.rollDamage(power.damage as string)}
          title="Roll damage"
        />
      ) : (
        formatDamageType(power.damage)
      );

    const columns: ColumnValue[] = [
      { key: 'action', value: power.actionType || '-', align: 'center' },
      { key: 'damage', value: damageCell, align: 'center' },
      { key: 'area', value: formatArea(power.area), align: 'center' },
      { key: 'duration', value: formatDuration(power.duration), align: 'center' },
    ];

    const innateToggle =
      ctx.showLibraryEditControls && ctx.onTogglePowerInnate ? (
        <InnateToggle
          isInnate={isInnate}
          onToggle={() => ctx.onTogglePowerInnate!(id, !isInnate)}
          size="md"
        />
      ) : undefined;

    return {
      id,
      name: power.name,
      description: power.description,
      columns,
      gridColumns: POWER_GRID,
      partsChips: partChips,
      chipsLabel: 'Parts',
      badges: needsProfBadge(ctx, { powers: [power] }),
      totalTp: powerTotalTP > 0 ? powerTotalTP : undefined,
      requirements: power.range ? (
        <div className="text-sm text-text-secondary">
          <span className="font-medium">Range:</span> {normalizeRangeDisplay(power.range)}
        </div>
      ) : undefined,
      innate: isInnate,
      hideInnateBadge: isInnate,
      leftSlot: innateToggle,
      rightSlot: buildEnergyButton(energyCost, canUse, ctx.onUsePower, id, 'primary'),
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemovePower ? () => ctx.onRemovePower!(id) : undefined,
    };
  });
}

export function mapTechniqueRows(
  techniques: CharacterTechnique[],
  ctx: LibraryEntityRowContext
): EntityTechniqueRow[] {
  return techniques.map((tech, i) => {
    const id = tech.id || String(i);
    const energyCost = tech.cost ?? 0;
    const canUse = ctx.currentEnergy !== undefined && ctx.currentEnergy >= energyCost;
    const partChips = partDataToChips(partsToPartData(tech.parts, ctx.techniquePartsDb, 'technique'));
    const techTP = (tech as { tp?: number }).tp;
    const totalTP =
      typeof techTP === 'number' ? techTP : typeof techTP === 'string' ? parseFloat(techTP) : undefined;

    const rangeOrDamage = (tech.range || tech.damage) && (
      <div className="flex flex-wrap gap-3 text-sm text-text-secondary">
        {tech.range && (
          <span>
            <span className="font-medium">Range:</span> {normalizeRangeDisplay(tech.range)}
          </span>
        )}
        {tech.damage && (
          <span>
            <span className="font-medium">Damage:</span> {tech.damage}
          </span>
        )}
      </div>
    );

    return {
      id,
      name: tech.name,
      description: tech.description,
      actionType: formatActionTypeForDisplay(tech.actionType ?? ''),
      columns: [
        { key: 'action', value: formatActionTypeForDisplay(tech.actionType ?? ''), align: 'center' },
        { key: 'energy', value: energyCost, align: 'center' },
        {
          key: 'weapon',
          value: tech.weaponName || '-',
          highlight: tech.weaponName !== undefined,
          align: 'center',
        },
        { key: 'tp', value: techTP ?? '-', align: 'center' },
      ],
      partsChips: partChips,
      chipsLabel: 'Parts',
      badges: needsProfBadge(ctx, { techniques: [tech] }),
      totalTp: totalTP && totalTP > 0 ? totalTP : undefined,
      requirements: rangeOrDamage,
      rightSlot: buildEnergyButton(energyCost, canUse, ctx.onUseTechnique, id, 'success'),
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveTechnique
          ? () => ctx.onRemoveTechnique!(id)
          : undefined,
    };
  });
}

export function mapWeaponRows(weapons: Item[], ctx: LibraryEntityRowContext): EntityWeaponRow[] {
  return weapons.map((item, i) => {
    const id = item.id ?? item.name ?? i;
    const { bonus: attackBonus, abilityName } = getWeaponAttackBonus(
      item,
      ctx.abilities,
      ctx.martialProficiency
    );
    const propertyChips = partDataToChips(
      propertiesToPartData(resolveItemProperties(item as ItemWithLibrarySource), ctx.itemPropertiesDb)
    );
    const rangeValue = normalizeRangeDisplay((item as Item & { range?: string }).range) || 'Melee';
    const { dice: damageDice, type: damageType, rollStr: damageRollStr } = splitDamageDiceAndType(item.damage);

    const attackButton =
      ctx.rollContext?.canRoll !== false && ctx.rollContext ? (
        <RollButton
          value={attackBonus}
          onClick={() => ctx.rollContext!.rollAttack(item.name, attackBonus)}
          size="sm"
          title={`Roll attack (${abilityName})`}
        />
      ) : (
        <span className="text-sm font-medium text-text-muted dark:text-text-secondary">
          {attackBonus >= 0 ? '+' : ''}
          {attackBonus}
        </span>
      );

    const damageButton =
      ctx.rollContext?.canRoll !== false && ctx.rollContext && damageRollStr !== '-' ? (
        <div className="flex flex-col items-center gap-0.5">
          <RollButton
            value={0}
            displayValue={damageDice}
            variant="danger"
            onClick={() => ctx.rollContext!.rollDamage(String(damageRollStr))}
            size="sm"
            title="Roll damage"
          />
          {damageType && (
            <span className="text-[10px] text-text-muted dark:text-text-secondary leading-none">{damageType}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-text-muted dark:text-text-secondary">{damageDice}</span>
          {damageType && (
            <span className="text-[10px] text-text-muted dark:text-text-secondary leading-none">{damageType}</span>
          )}
        </div>
      );

    return {
      id,
      name: item.name,
      description: item.description,
      columns: [
        { key: 'range', value: rangeValue, align: 'center' },
        { key: 'attack', value: attackButton, align: 'center' },
        { key: 'damage', value: damageButton, align: 'center' },
      ],
      gridColumns: CHARACTER_SHEET_WEAPON_GRID,
      chips: propertyChips,
      chipsLabel: 'Properties',
      badges: needsProfBadge(ctx, { weapons: [item] }),
      equipped: item.equipped,
      leftSlot:
        ctx.onToggleEquipWeapon ? (
          <EquipToggle
            isEquipped={item.equipped || false}
            onToggle={() => ctx.onToggleEquipWeapon!(id)}
            label={item.equipped ? 'Unequip' : 'Equip'}
          />
        ) : undefined,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveWeapon ? () => ctx.onRemoveWeapon!(id) : undefined,
    };
  });
}

export function mapShieldRows(shields: Item[], ctx: LibraryEntityRowContext): EntityShieldRow[] {
  return shields.map((item, i) => {
    const id = item.id ?? item.name ?? i;
    const enriched = item as Item & { shieldAmount?: string; shieldDamage?: string | null };
    const shieldBlock = enriched.shieldAmount ?? '-';
    const shieldDamageStr = enriched.shieldDamage ?? (item.damage ? String(item.damage) : '-');
    const { bonus: attackBonus } = getWeaponAttackBonus(item, ctx.abilities, ctx.martialProficiency);
    const rangeValue = normalizeRangeDisplay((item as Item & { range?: string }).range) || 'Melee';
    const {
      dice: shieldDamageDice,
      type: shieldDamageType,
      rollStr: shieldDamageRollStr,
    } = splitDamageDiceAndType(shieldDamageStr !== '-' ? String(shieldDamageStr) : item.damage);
    const propertyChips = partDataToChips(
      propertiesToPartData(resolveItemProperties(item as ItemWithLibrarySource), ctx.itemPropertiesDb)
    );

    const attackCell =
      shieldDamageStr !== '-' && ctx.rollContext?.canRoll !== false && ctx.rollContext ? (
        <div className="flex justify-center">
          <RollButton
            value={attackBonus}
            onClick={() => ctx.rollContext!.rollAttack(item.name, attackBonus)}
            size="sm"
            title="Roll attack"
          />
        </div>
      ) : shieldDamageStr !== '-' ? (
        (attackBonus >= 0 ? '+' : '') + attackBonus
      ) : (
        '-'
      );

    const damageCell =
      shieldDamageRollStr !== '-' && ctx.rollContext?.canRoll !== false && ctx.rollContext ? (
        <div className="flex flex-col items-center gap-0.5">
          <RollButton
            value={0}
            displayValue={shieldDamageDice}
            variant="danger"
            onClick={() => ctx.rollContext!.rollDamage(String(shieldDamageRollStr))}
            size="sm"
            title="Roll damage"
          />
          {shieldDamageType && (
            <span className="text-[10px] text-text-muted dark:text-text-secondary leading-none">{shieldDamageType}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-text-muted dark:text-text-secondary">{shieldDamageDice}</span>
          {shieldDamageType && (
            <span className="text-[10px] text-text-muted dark:text-text-secondary leading-none">{shieldDamageType}</span>
          )}
        </div>
      );

    return {
      id,
      name: item.name,
      description: item.description,
      columns: [
        { key: 'range', value: rangeValue, align: 'center' },
        { key: 'attack', value: attackCell, align: 'center' },
        { key: 'damage', value: damageCell, align: 'center' },
        {
          key: 'block',
          value:
            shieldBlock !== '-' && ctx.rollContext?.canRoll !== false && ctx.rollContext ? (
              <div className="flex justify-center">
                <RollButton
                  value={0}
                  displayValue={String(shieldBlock)}
                  variant="primary"
                  onClick={() =>
                    ctx.rollContext!.rollDamage(String(shieldBlock) + ' Bludgeoning', 0, 'Shield block')
                  }
                  size="sm"
                  title="Roll shield block amount"
                />
              </div>
            ) : (
              shieldBlock
            ),
          className: 'text-primary-600 dark:text-primary-400 font-medium',
          align: 'center',
        },
      ],
      gridColumns: CHARACTER_SHEET_SHIELD_GRID,
      chips: propertyChips,
      chipsLabel: 'Properties',
      badges: needsProfBadge(ctx, { shields: [item] }),
      equipped: item.equipped,
      leftSlot:
        ctx.onToggleEquipShield ? (
          <EquipToggle
            isEquipped={item.equipped || false}
            onToggle={() => ctx.onToggleEquipShield!(id)}
            label={item.equipped ? 'Unequip' : 'Equip'}
          />
        ) : undefined,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveShield ? () => ctx.onRemoveShield!(id) : undefined,
    };
  });
}

export function mapArmorRows(armor: Item[], ctx: LibraryEntityRowContext): EntityArmorRow[] {
  return armor.map((item, i) => {
    const id = item.id ?? item.name ?? i;
    const propertyChips = partDataToChips(
      propertiesToPartData(resolveItemProperties(item as ItemWithLibrarySource), ctx.itemPropertiesDb)
    );
    const abilityReq = (item as Item & { abilityRequirement?: { name?: string; level?: number } }).abilityRequirement;
    const agilityRed = (item as Item & { agilityReduction?: number }).agilityReduction;

    const itemWithArmor = item as { armorValue?: number; armor?: number };
    let damageReduction = itemWithArmor.armorValue ?? itemWithArmor.armor ?? 0;
    let critRangeBonus = 0;
    const armorProps = resolveItemProperties(item as ItemWithLibrarySource);
    if (armorProps) {
      for (const prop of armorProps) {
        if (!prop) continue;
        const propName = typeof prop === 'string' ? prop : prop.name || '';
        const op1Lvl =
          typeof prop === 'object' && 'op_1_lvl' in prop ? Number((prop as Record<string, unknown>).op_1_lvl) || 0 : 0;
        if (propName === 'Damage Reduction' && damageReduction === 0) {
          damageReduction = 1 + op1Lvl;
        }
        if (propName === 'Critical Range +1') {
          critRangeBonus = 1 + op1Lvl;
        }
      }
    }
    const agility = ctx.abilities?.agility ?? 0;
    const baseEvasion = 10 + agility;
    const critThreshold = critRangeBonus > 0 ? baseEvasion + 10 + critRangeBonus : undefined;

    const armorRequirements =
      (abilityReq?.name && abilityReq?.level) || (agilityRed && agilityRed > 0) ? (
        <div className="space-y-1 text-sm text-text-secondary">
          {abilityReq?.name && abilityReq?.level && (
            <p>
              <span className="font-medium">Requires:</span> {abilityReq.name} {abilityReq.level}+
            </p>
          )}
          {agilityRed && agilityRed > 0 && (
            <p>
              <span className="font-medium">Agility Reduction:</span> -{agilityRed}
            </p>
          )}
        </div>
      ) : undefined;

    return {
      id,
      name: item.name,
      description: item.description,
      columns: [
        {
          key: 'dr',
          value: damageReduction > 0 ? String(damageReduction) : '-',
          className: 'text-primary-600 dark:text-primary-400 font-medium',
          align: 'center',
        },
        { key: 'crit', value: critThreshold ?? '-', align: 'center' },
      ],
      chips: propertyChips,
      chipsLabel: 'Properties',
      badges: needsProfBadge(ctx, { armor: [item] }),
      requirements: armorRequirements,
      equipped: item.equipped,
      leftSlot:
        ctx.onToggleEquipArmor ? (
          <EquipToggle
            isEquipped={item.equipped || false}
            onToggle={() => ctx.onToggleEquipArmor!(id)}
            label={item.equipped ? 'Unequip' : 'Equip'}
          />
        ) : undefined,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveArmor ? () => ctx.onRemoveArmor!(id) : undefined,
    };
  });
}

export function mapEquipmentRows(equipment: Item[], ctx: LibraryEntityRowContext): EntityEquipmentRow[] {
  return equipment.map((item, i) => {
    const itemId = item.id ?? item.name ?? i;
    const propertyChips = partDataToChips(
      propertiesToPartData(resolveItemProperties(item as ItemWithLibrarySource), ctx.itemPropertiesDb)
    );
    const itemType = formatListCellLabel(item.type);
    const qty = item.quantity ?? 1;
    const quantityStepper = ctx.onEquipmentQuantityChange ? (
      <div className="flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <QuantitySelector
          quantity={qty}
          min={0}
          max={99}
          size="sm"
          onChange={(newVal) => ctx.onEquipmentQuantityChange!(itemId, newVal - qty)}
        />
      </div>
    ) : (
      qty
    );

    const badges: EntityEquipmentRow['badges'] = [];
    if (item.rarity && item.rarity !== 'common') {
      const rarityColor =
        item.rarity === 'legendary'
          ? 'amber'
          : item.rarity === 'epic'
            ? 'purple'
            : item.rarity === 'rare'
              ? 'blue'
              : 'green';
      badges.push({ label: item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1), color: rarityColor });
    }
    if (item.cost !== undefined && item.cost > 0) {
      badges.push({ label: `${item.cost}g`, color: 'amber' });
    }

    return {
      id: itemId,
      name: item.name,
      description: item.description,
      columns: [
        { key: 'type', value: itemType, align: 'center' },
        { key: 'quantity', value: quantityStepper, align: 'center' },
      ],
      chips: propertyChips,
      chipsLabel: 'Properties',
      badges,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveEquipment
          ? () => ctx.onRemoveEquipment!(itemId)
          : undefined,
    };
  });
}
