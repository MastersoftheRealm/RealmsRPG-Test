/**
 * Item Creator — editor facade (TASK-381 Phase 1, TASK-616)
 * ========================================================
 * Composes co-located section islands. State, cost math, save/load, and
 * CreatorPageShell stay in page.tsx / workspace hook.
 */

'use client';

import { ItemCreatorEditorAbilityProperties } from './item-creator-editor-ability-properties';
import { ItemCreatorEditorArmor } from './item-creator-editor-armor';
import { type ItemCreatorEditorProps } from './item-creator-editor-config';
import { ItemCreatorEditorMeta } from './item-creator-editor-meta';
import { ItemCreatorEditorShieldPanels } from './item-creator-editor-shield-panels';
import { ItemCreatorEditorWeaponShield } from './item-creator-editor-weapon-shield';

export type { ItemCreatorEditorProps };

export function ItemCreatorEditor(props: ItemCreatorEditorProps) {
  return (
    <>
      <ItemCreatorEditorMeta
        isAdmin={props.isAdmin}
        name={props.name}
        onNameChange={props.onNameChange}
        description={props.description}
        onDescriptionChange={props.onDescriptionChange}
        imageId={props.imageId}
        imageUrl={props.imageUrl}
        onImageChange={props.onImageChange}
        imageCategory={props.imageCategory}
        armamentType={props.armamentType}
        onArmamentTypeChange={props.onArmamentTypeChange}
      />

      <ItemCreatorEditorWeaponShield
        armamentType={props.armamentType}
        isTwoHanded={props.isTwoHanded}
        onIsTwoHandedChange={props.onIsTwoHandedChange}
        rangeType={props.rangeType}
        onRangeTypeChange={props.onRangeTypeChange}
        rangeSpaces={props.rangeSpaces}
        onRangeSpacesChange={props.onRangeSpacesChange}
        attackAbility={props.attackAbility}
        onAttackAbilityChange={props.onAttackAbilityChange}
        weaponShieldConfigSummary={props.weaponShieldConfigSummary}
        damage={props.damage}
        onDamageChange={props.onDamageChange}
        baseDamageSummary={props.baseDamageSummary}
        itemSectionCosts={props.itemSectionCosts}
      />

      {props.armamentType === 'Armor' && (
        <ItemCreatorEditorArmor
          damageReduction={props.damageReduction}
          onDamageReductionChange={props.onDamageReductionChange}
          agilityReduction={props.agilityReduction}
          onAgilityReductionChange={props.onAgilityReductionChange}
          criticalRangeIncrease={props.criticalRangeIncrease}
          onCriticalRangeIncreaseChange={props.onCriticalRangeIncreaseChange}
          armorConfigSummary={props.armorConfigSummary}
          itemSectionCosts={props.itemSectionCosts}
        />
      )}

      {props.armamentType === 'Shield' && (
        <ItemCreatorEditorShieldPanels
          shieldDR={props.shieldDR}
          onShieldDRChange={props.onShieldDRChange}
          shieldBlockSummary={props.shieldBlockSummary}
          hasShieldDamage={props.hasShieldDamage}
          onHasShieldDamageChange={props.onHasShieldDamageChange}
          shieldDamage={props.shieldDamage}
          onShieldDamageChange={props.onShieldDamageChange}
          shieldDamageSummary={props.shieldDamageSummary}
          itemSectionCosts={props.itemSectionCosts}
        />
      )}

      <ItemCreatorEditorAbilityProperties
        armamentType={props.armamentType}
        abilityRequirement={props.abilityRequirement}
        onAbilityRequirementChange={props.onAbilityRequirementChange}
        abilityReqSummary={props.abilityReqSummary}
        selectedProperties={props.selectedProperties}
        itemProperties={props.itemProperties}
        propertiesSummary={props.propertiesSummary}
        onAddProperty={props.onAddProperty}
        onRemoveProperty={props.onRemoveProperty}
        onUpdateProperty={props.onUpdateProperty}
        itemSectionCosts={props.itemSectionCosts}
      />
    </>
  );
}
