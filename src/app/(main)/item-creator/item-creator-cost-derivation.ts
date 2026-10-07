/**
 * Item Creator — cost derivation (TASK-616)
 * Property payload assembly, section costs, advanced calc rows, and display summaries.
 */

'use client';

import { useMemo } from 'react';
import type { ItemProperty } from '@/hooks';
import {
  calculateItemCosts,
  formatWeaponRangeConfig,
  resolveItemMarketPricing,
  weaponRangeOpLevelFromSpaces,
  buildItemAdvancedCalculationGroups,
  type ItemPropertyPayload,
  type WeaponRangeType,
} from '@/lib/calculators';
import { PROPERTY_IDS } from '@/lib/id-constants';
import {
  weaponAttackAbilityLabel,
  type WeaponAttackAbility,
} from '@/lib/game/weapon-attack-ability';
import type {
  ArmamentType,
  ItemSelectedProperty as SelectedProperty,
  ItemDamageConfig as DamageConfig,
} from './item-creator-bootstrap';
import { WEAPON_ABILITY_REQUIREMENTS, ARMOR_ABILITY_REQUIREMENTS } from './item-creator-helpers';

export type ItemSectionCostSlice = {
  totalIP: number;
  totalTP: number;
  totalCurrency: number;
};

export type ItemSectionCosts = {
  handedness: ItemSectionCostSlice;
  range: ItemSectionCostSlice;
  abilityUtilized: ItemSectionCostSlice;
  damage: ItemSectionCostSlice;
  damageReduction: ItemSectionCostSlice;
  agilityReduction: ItemSectionCostSlice;
  criticalRange: ItemSectionCostSlice;
  shieldDR: ItemSectionCostSlice;
  shieldDamage: ItemSectionCostSlice;
  abilityReq: ItemSectionCostSlice;
};

type UseItemCreatorCostDerivationArgs = {
  armamentType: ArmamentType;
  selectedProperties: SelectedProperty[];
  itemProperties: ItemProperty[];
  damage: DamageConfig;
  isTwoHanded: boolean;
  rangeType: WeaponRangeType;
  rangeSpaces: number;
  attackAbility: WeaponAttackAbility;
  damageReduction: number;
  agilityReduction: number;
  criticalRangeIncrease: number;
  shieldDR: { amount: number; size: number };
  hasShieldDamage: boolean;
  shieldDamage: { amount: number; size: number };
  abilityRequirement: { id: number; name: string; level: number } | null;
};

export function useItemCreatorCostDerivation({
  armamentType,
  selectedProperties,
  itemProperties,
  damage,
  isTwoHanded,
  rangeType,
  rangeSpaces,
  attackAbility,
  damageReduction,
  agilityReduction,
  criticalRangeIncrease,
  shieldDR,
  hasShieldDamage,
  shieldDamage,
  abilityRequirement,
}: UseItemCreatorCostDerivationArgs) {
  const rangeDisplay = useMemo(
    () => formatWeaponRangeConfig({ type: rangeType, spaces: rangeSpaces }),
    [rangeType, rangeSpaces],
  );

  const weaponShieldConfigSummary = useMemo(() => {
    const handed = isTwoHanded ? 'Two-Handed' : 'One-Handed';
    if (armamentType === 'Weapon') {
      return `${handed} • ${rangeDisplay} • ${weaponAttackAbilityLabel(attackAbility)}`;
    }
    return handed;
  }, [armamentType, isTwoHanded, rangeDisplay, attackAbility]);

  const baseDamageSummary = useMemo(
    () => `${damage.amount}d${damage.size} ${damage.type}`,
    [damage.amount, damage.size, damage.type],
  );

  const armorConfigSummary = useMemo(
    () => `DR ${damageReduction}, AGI -${agilityReduction}, Crit +${criticalRangeIncrease}`,
    [damageReduction, agilityReduction, criticalRangeIncrease],
  );

  const shieldBlockSummary = useMemo(
    () => `${shieldDR.amount}d${shieldDR.size} blocked`,
    [shieldDR.amount, shieldDR.size],
  );

  const shieldDamageSummary = useMemo(
    () => (hasShieldDamage ? `${shieldDamage.amount}d${shieldDamage.size} bludgeoning` : 'None'),
    [hasShieldDamage, shieldDamage.amount, shieldDamage.size],
  );

  const abilityReqSummary = useMemo(() => {
    if (!abilityRequirement) return 'None';
    const reqs =
      armamentType === 'Armor' ? ARMOR_ABILITY_REQUIREMENTS : WEAPON_ABILITY_REQUIREMENTS;
    const req = reqs.find((r) => r.id === abilityRequirement.id);
    return req ? `${req.label} ${abilityRequirement.level}` : 'None';
  }, [abilityRequirement, armamentType]);

  const propertiesSummary = useMemo(() => {
    if (selectedProperties.length === 0) return 'No properties';
    const names = selectedProperties.slice(0, 5).map((sp) => sp.property.name);
    const more = selectedProperties.length > 5 ? ` +${selectedProperties.length - 5} more` : '';
    return `${names.join(', ')}${more}`;
  }, [selectedProperties]);

  const propertiesPayload: ItemPropertyPayload[] = useMemo(() => {
    const rangeMechanicIds = new Set<number>([
      Number(PROPERTY_IDS.RANGE),
      Number(PROPERTY_IDS.THROWN),
      Number(PROPERTY_IDS.REACH),
    ]);
    const abilityMechanicIds = new Set<number>([
      Number(PROPERTY_IDS.FINESSE),
      Number(PROPERTY_IDS.HEAVY),
    ]);
    const baseProps = selectedProperties
      .filter((sp) => {
        const id = Number(sp.property.id);
        const name = sp.property.name?.toLowerCase() ?? '';
        if (rangeMechanicIds.has(id)) return false;
        if (name === 'range' || name === 'thrown' || name === 'reach') return false;
        if (abilityMechanicIds.has(id)) return false;
        if (name === 'finesse' || name === 'heavy') return false;
        return true;
      })
      .map((sp) => ({
        id: Number(sp.property.id),
        name: sp.property.name,
        op_1_lvl: sp.op_1_lvl,
      }));

    const findProp = (id: number, name: string) =>
      itemProperties.find((p: ItemProperty) => Number(p.id) === id || p.name === name);

    if ((armamentType === 'Weapon' || armamentType === 'Shield') && isTwoHanded) {
      const twoHandedProp = findProp(PROPERTY_IDS.TWO_HANDED, 'Two-Handed');
      if (twoHandedProp) {
        baseProps.push({ id: Number(twoHandedProp.id), name: 'Two-Handed', op_1_lvl: 0 });
      }
    }

    if (armamentType === 'Weapon' && rangeType !== 'melee') {
      if (rangeType === 'ranged') {
        const rangeProp = findProp(PROPERTY_IDS.RANGE, 'Range');
        if (rangeProp) {
          baseProps.push({
            id: Number(rangeProp.id),
            name: 'Range',
            op_1_lvl: weaponRangeOpLevelFromSpaces('ranged', rangeSpaces),
          });
        }
      } else if (rangeType === 'thrown') {
        const thrownProp = findProp(PROPERTY_IDS.THROWN, 'Thrown');
        if (thrownProp) {
          baseProps.push({
            id: Number(thrownProp.id),
            name: 'Thrown',
            op_1_lvl: weaponRangeOpLevelFromSpaces('thrown', rangeSpaces),
          });
        }
      } else if (rangeType === 'reach') {
        const reachProp = findProp(PROPERTY_IDS.REACH, 'Reach');
        if (reachProp) {
          baseProps.push({
            id: Number(reachProp.id),
            name: 'Reach',
            op_1_lvl: weaponRangeOpLevelFromSpaces('reach', rangeSpaces),
          });
        }
      }
    }

    if (armamentType === 'Weapon') {
      if (attackAbility === 'agility') {
        const finesseProp = findProp(PROPERTY_IDS.FINESSE, 'Finesse');
        baseProps.push({
          id: Number(finesseProp?.id ?? PROPERTY_IDS.FINESSE),
          name: finesseProp?.name ?? 'Finesse',
          op_1_lvl: 0,
        });
      } else if (attackAbility === 'strength' && rangeType === 'ranged') {
        const heavyProp = findProp(PROPERTY_IDS.HEAVY, 'Heavy');
        baseProps.push({
          id: Number(heavyProp?.id ?? PROPERTY_IDS.HEAVY),
          name: heavyProp?.name ?? 'Heavy',
          op_1_lvl: 0,
        });
      }
    }

    if (armamentType === 'Weapon' && damage.type !== 'none' && damage.amount >= 1) {
      const validSizes = [4, 6, 8, 10, 12];
      if (validSizes.includes(damage.size)) {
        const weaponDamageProp = itemProperties.find(
          (p: ItemProperty) =>
            p.name === 'Weapon Damage' || Number(p.id) === PROPERTY_IDS.WEAPON_DAMAGE,
        );
        if (weaponDamageProp) {
          const weaponDamageLevel = Math.max(0, (damage.amount * damage.size - 4) / 2);
          baseProps.push({
            id: Number(weaponDamageProp.id),
            name: 'Weapon Damage',
            op_1_lvl: weaponDamageLevel,
          });
        }

        if (damage.amount > 1) {
          const total = damage.amount * damage.size;
          const minDiceUsingD12 = Math.ceil(total / 12);
          const splits = Math.max(0, damage.amount - minDiceUsingD12);
          if (splits > 0) {
            const splitDiceProp = itemProperties.find(
              (p: ItemProperty) =>
                p.name === 'Split Damage Dice' || Number(p.id) === PROPERTY_IDS.SPLIT_DAMAGE_DICE,
            );
            if (splitDiceProp) {
              baseProps.push({
                id: Number(splitDiceProp.id),
                name: 'Split Damage Dice',
                op_1_lvl: splits - 1,
              });
            }
          }
        }
      }
    }

    if (armamentType === 'Armor') {
      const armorBaseProp = itemProperties.find(
        (p: ItemProperty) => p.name === 'Armor Base' || Number(p.id) === 16,
      );
      if (armorBaseProp) {
        baseProps.push({ id: Number(armorBaseProp.id), name: armorBaseProp.name, op_1_lvl: 0 });
      }

      const drProp = itemProperties.find(
        (p: ItemProperty) => p.name === 'Damage Reduction' || Number(p.id) === 1,
      );
      if (drProp && damageReduction > 0) {
        baseProps.push({ id: Number(drProp.id), name: drProp.name, op_1_lvl: damageReduction - 1 });
      }

      if (agilityReduction > 0) {
        const arProp = itemProperties.find(
          (p: ItemProperty) => p.name === 'Agility Reduction' || Number(p.id) === 5,
        );
        if (arProp) {
          baseProps.push({
            id: Number(arProp.id),
            name: arProp.name,
            op_1_lvl: agilityReduction - 1,
          });
        }
      }

      if (criticalRangeIncrease > 0) {
        const critProp = itemProperties.find(
          (p: ItemProperty) =>
            p.name === 'Critical Range +1' || Number(p.id) === PROPERTY_IDS.CRITICAL_RANGE_PLUS_1,
        );
        if (critProp) {
          baseProps.push({
            id: Number(critProp.id),
            name: critProp.name,
            op_1_lvl: criticalRangeIncrease - 1,
          });
        }
      }
    }

    if (armamentType === 'Shield') {
      const shieldBaseProp = itemProperties.find(
        (p: ItemProperty) => p.name === 'Shield Base' || Number(p.id) === 15,
      );
      if (shieldBaseProp) {
        baseProps.push({ id: Number(shieldBaseProp.id), name: shieldBaseProp.name, op_1_lvl: 0 });
      }

      const validSizes = [4, 6, 8, 10, 12];
      if (validSizes.includes(shieldDR.size) && shieldDR.amount >= 1) {
        const shieldAmountProp = itemProperties.find(
          (p: ItemProperty) =>
            p.name === 'Shield Amount' || Number(p.id) === PROPERTY_IDS.SHIELD_AMOUNT,
        );
        if (shieldAmountProp) {
          const shieldDRLevel = Math.max(0, (shieldDR.amount * shieldDR.size - 4) / 2);
          baseProps.push({
            id: Number(shieldAmountProp.id),
            name: 'Shield Amount',
            op_1_lvl: shieldDRLevel,
          });
        }
      }

      if (hasShieldDamage && validSizes.includes(shieldDamage.size) && shieldDamage.amount >= 1) {
        const shieldDamageProp = itemProperties.find(
          (p: ItemProperty) =>
            p.name === 'Shield Damage' || Number(p.id) === PROPERTY_IDS.SHIELD_DAMAGE,
        );
        if (shieldDamageProp) {
          const shieldDamageLevel = Math.max(0, (shieldDamage.amount * shieldDamage.size - 4) / 2);
          baseProps.push({
            id: Number(shieldDamageProp.id),
            name: 'Shield Damage',
            op_1_lvl: shieldDamageLevel,
          });
        }
      }
    }

    if (abilityRequirement && abilityRequirement.level > 0) {
      baseProps.push({
        id: abilityRequirement.id,
        name: abilityRequirement.name,
        op_1_lvl: abilityRequirement.level - 1,
      });
    }

    return baseProps;
  }, [
    selectedProperties,
    armamentType,
    isTwoHanded,
    rangeType,
    rangeSpaces,
    attackAbility,
    itemProperties,
    damageReduction,
    agilityReduction,
    criticalRangeIncrease,
    shieldDR,
    hasShieldDamage,
    shieldDamage,
    abilityRequirement,
    damage,
  ]);

  const pricing = useMemo(
    () => resolveItemMarketPricing(propertiesPayload, itemProperties),
    [propertiesPayload, itemProperties],
  );

  const itemSectionCosts = useMemo(() => {
    const byId = (id: number) => propertiesPayload.filter((p) => Number(p.id) === id);
    return {
      handedness: calculateItemCosts(byId(PROPERTY_IDS.TWO_HANDED), itemProperties),
      range: calculateItemCosts(
        [...byId(PROPERTY_IDS.RANGE), ...byId(PROPERTY_IDS.THROWN), ...byId(PROPERTY_IDS.REACH)],
        itemProperties,
      ),
      abilityUtilized: calculateItemCosts(
        [...byId(PROPERTY_IDS.FINESSE), ...byId(PROPERTY_IDS.HEAVY)],
        itemProperties,
      ),
      damage: calculateItemCosts(
        [...byId(PROPERTY_IDS.WEAPON_DAMAGE), ...byId(PROPERTY_IDS.SPLIT_DAMAGE_DICE)],
        itemProperties,
      ),
      abilityReq: calculateItemCosts(
        abilityRequirement
          ? [
              {
                id: abilityRequirement.id,
                name: abilityRequirement.name,
                op_1_lvl: (abilityRequirement.level || 1) - 1,
              },
            ]
          : [],
        itemProperties,
      ),
      criticalRange: calculateItemCosts(byId(PROPERTY_IDS.CRITICAL_RANGE_PLUS_1), itemProperties),
      damageReduction: calculateItemCosts(byId(PROPERTY_IDS.DAMAGE_REDUCTION), itemProperties),
      agilityReduction: calculateItemCosts(byId(PROPERTY_IDS.AGILITY_REDUCTION), itemProperties),
      shieldDR: calculateItemCosts(byId(PROPERTY_IDS.SHIELD_AMOUNT), itemProperties),
      shieldDamage: calculateItemCosts(byId(PROPERTY_IDS.SHIELD_DAMAGE), itemProperties),
    };
  }, [propertiesPayload, itemProperties, abilityRequirement]);

  const { currencyCost, rarity } = pricing;

  const advancedCalcGroups = useMemo(
    () => buildItemAdvancedCalculationGroups(propertiesPayload, itemProperties, pricing),
    [propertiesPayload, itemProperties, pricing],
  );

  const damageDisplay = useMemo(() => {
    if (armamentType !== 'Weapon' || damage.type === 'none' || damage.amount < 1) return '';
    return `${damage.amount}d${damage.size} ${damage.type}`;
  }, [armamentType, damage]);

  return {
    rangeDisplay,
    weaponShieldConfigSummary,
    baseDamageSummary,
    armorConfigSummary,
    shieldBlockSummary,
    shieldDamageSummary,
    abilityReqSummary,
    propertiesSummary,
    propertiesPayload,
    costs: pricing,
    itemSectionCosts,
    currencyCost,
    rarity,
    advancedCalcGroups,
    damageDisplay,
  };
}
