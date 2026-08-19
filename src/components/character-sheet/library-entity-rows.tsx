'use client';

/**
 * Maps character sheet library items to entity-library-section row shapes.
 */

import type { ReactNode } from 'react';
import {
  formatDurationCompact,
  formatSavedActionTypeForDisplay,
  formatListCellLabel,
} from '@/lib/utils';
import { calculateCriticalRange, calculateEvasion } from '@/lib/game/calculations';
import { resolveWeaponRangeDisplay, type ItemPropertyPayload } from '@/lib/calculators';
import {
  InnateToggle,
  RollButton,
  EquipToggle,
  QuantitySelector,
  type ColumnValue,
} from '@/components/patterns';
import type {
  EntityPowerRow,
  EntityTechniqueRow,
  EntityWeaponRow,
  EntityShieldRow,
  EntityArmorRow,
  EntityEquipmentRow,
} from '@/components/patterns/list/entity-library-sections';
import {
  POWER_GRID,
  CHARACTER_SHEET_TECHNIQUE_GRID,
  CHARACTER_SHEET_WEAPON_GRID,
  CHARACTER_SHEET_SHIELD_GRID,
} from '@/components/patterns/list/entity-library-sections';
import type { useRollsOptional } from '@/components/rolls';
import type { Abilities, CharacterPower, CharacterTechnique, Item } from '@/types';
import { resolveListRowThumbnail } from '@/lib/list-row-image';
import {
  type CodexPart,
  type CodexProperty,
  type ItemWithLibrarySource,
  partsToPartData,
  propertiesToPartData,
  partDataToChips,
  formatArea,
  formatDamageType,
  getWeaponAttackBonus,
  resolveItemProperties,
  deriveArmorItemCombatStats,
} from './library-list-helpers';
import { splitDamageDiceAndType } from '@/lib/utils';
import {
  glrSurfaceDetailSections,
  mergeDetailSections,
  metadataDetailSection,
  partsProficienciesSection,
  propertiesProficienciesSection,
} from '@/lib/chip/list-row-metadata';
import { rangeFactChip } from '@/lib/detail-option/compact-facts';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import { calculateItemCosts, type ItemPropertyTpRow } from '@/lib/calculators/item-calc';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import {
  libraryItemToPowerDocument,
  libraryItemToTechniqueDocument,
} from '@/lib/library-selectable-builders';
import {
  derivePartCategories,
  formatPartCategoriesColumn,
  powerHasDamageCategory,
  withDamageCategory,
} from '@/lib/library/power-technique-categories';
type RollContext = ReturnType<typeof useRollsOptional>;

export type LibraryEntityRowContext = {
  powerPartsDb: CodexPart[];
  techniquePartsDb: CodexPart[];
  itemPropertiesDb: CodexProperty[];
  abilities?: Abilities | undefined;
  martialProficiency?: number | undefined;
  powerAttackBonus?: number | undefined;
  currentEnergy?: number | undefined;
  showLibraryEditControls: boolean;
  rollContext: RollContext;
  hasMissingForEntry: (params: {
    powers?: CharacterPower[] | undefined;
    techniques?: CharacterTechnique[] | undefined;
    weapons?: Item[] | undefined;
    shields?: Item[] | undefined;
    armor?: Item[] | undefined;
  }) => boolean;
  onUsePower?: ((id: string | number, energyCost: number) => void) | undefined;
  onRemovePower?: ((id: string | number) => void) | undefined;
  onTogglePowerInnate?: ((id: string | number, isInnate: boolean) => void) | undefined;
  onUseTechnique?: ((id: string | number, energyCost: number) => void) | undefined;
  onRemoveTechnique?: ((id: string | number) => void) | undefined;
  onRemoveWeapon?: ((id: string | number) => void) | undefined;
  onToggleEquipWeapon?: ((id: string | number) => void) | undefined;
  onRemoveShield?: ((id: string | number) => void) | undefined;
  onToggleEquipShield?: ((id: string | number) => void) | undefined;
  onRemoveArmor?: ((id: string | number) => void) | undefined;
  onToggleEquipArmor?: ((id: string | number) => void) | undefined;
  onRemoveEquipment?: ((id: string | number) => void) | undefined;
  onEquipmentQuantityChange?: ((id: string | number, delta: number) => void) | undefined;
};

function categoryFactValue(categories: string[]): string | undefined {
  if (categories.length === 0) return undefined;
  const text = formatPartCategoriesColumn(categories);
  if (!text || text === '—' || text === '-') return undefined;
  return text;
}

function partsForCategories(
  parts: CharacterPower['parts'] | CharacterTechnique['parts'],
): Array<{ id?: string | number | undefined; name?: string | undefined }> {
  if (!parts) return [];
  return parts.map((part) => (typeof part === 'string' ? { name: part } : part));
}

function sheetItemCostFacts(item: Item, ctx: LibraryEntityRowContext) {
  const propsPayload = (resolveItemProperties(item as ItemWithLibrarySource) ??
    []) as ItemPropertyPayload[];
  const costs = calculateItemCosts(propsPayload, ctx.itemPropertiesDb as ItemPropertyTpRow[]);
  const storedCost = item.cost != null && item.cost > 0 ? item.cost : undefined;
  const derivedCurrency = Math.round(costs.totalCurrency);
  const storedTp = (item as Item & { tp?: number | undefined }).tp;
  return {
    rarity: item.rarity,
    currency: storedCost ?? (derivedCurrency > 0 ? derivedCurrency : undefined),
    trainingPoints:
      Math.round(costs.totalTP) ||
      (typeof storedTp === 'number' && storedTp > 0 ? Math.round(storedTp) : undefined),
  };
}

function needsProfBadge(
  ctx: LibraryEntityRowContext,
  params: Parameters<LibraryEntityRowContext['hasMissingForEntry']>[0],
) {
  return ctx.hasMissingForEntry(params)
    ? ([{ label: 'Needs Proficiency', color: 'red' as const }] as EntityPowerRow['badges'])
    : undefined;
}

/**
 * Energy cost control for play-sheet powers/techniques.
 * Cost appears ONLY here (rightSlot) — never also as a static Energy column.
 * View-only (no onUse): same chrome, disabled — do not pass noop handlers.
 */
function buildEnergyButton(
  energyCost: number,
  canUse: boolean,
  onUse: ((id: string | number, cost: number) => void) | undefined,
  id: string | number,
  variant: 'primary' | 'success',
): ReactNode {
  if (energyCost <= 0) return null;

  if (onUse) {
    return (
      <RollButton
        value={energyCost}
        displayValue={String(energyCost)}
        onClick={() => onUse(id, energyCost)}
        disabled={!canUse}
        variant={variant}
        size="sm"
        title={canUse ? `Spend ${energyCost} Energy` : 'Not enough energy'}
      />
    );
  }

  return (
    <RollButton
      value={energyCost}
      displayValue={String(energyCost)}
      disabled
      variant={variant}
      size="sm"
      title={`Energy cost ${energyCost}`}
    />
  );
}

export function mapPowerRows(
  powers: CharacterPower[],
  ctx: LibraryEntityRowContext,
): EntityPowerRow[] {
  return powers.map((power, i) => {
    const id = power.id || String(i);
    const isInnate = power.innate === true;
    const powerIsReaction = (power as CharacterPower & { isReaction?: boolean | undefined })
      .isReaction;
    const display = derivePowerDisplay(
      libraryItemToPowerDocument({
        name: power.name,
        description: power.description,
        parts: power.parts,
        damage: Array.isArray(power.damage) ? power.damage : undefined,
        actionType: power.actionType,
        isReaction: powerIsReaction,
      }),
      ctx.powerPartsDb as PowerPart[],
    );
    const energyCost =
      typeof display.energy === 'number' && display.energy > 0 ? display.energy : (power.cost ?? 0);
    const canUse = ctx.currentEnergy !== undefined && ctx.currentEnergy >= energyCost;
    const partChips = partDataToChips(partsToPartData(power.parts, ctx.powerPartsDb));
    const partsSection = partsProficienciesSection(partChips, 'power');
    const categories = withDamageCategory(
      derivePartCategories(partsForCategories(power.parts), ctx.powerPartsDb),
      powerHasDamageCategory(Array.isArray(power.damage) ? power.damage : undefined),
    );
    const damageStr =
      formatPowerDamage(Array.isArray(power.damage) ? power.damage : undefined) ||
      formatDamageType(typeof power.damage === 'string' ? power.damage : undefined);
    const rangeValue =
      typeof power.range === 'string' && power.range.trim()
        ? power.range
        : typeof power.range === 'number'
          ? power.range
          : display.range && display.range !== '-'
            ? display.range
            : undefined;

    const damageCell =
      damageStr && damageStr !== '-' && ctx.rollContext?.rollDamage ? (
        <RollButton
          value={ctx.powerAttackBonus ?? 0}
          displayValue={damageStr}
          variant="danger"
          size="sm"
          onClick={() => ctx.rollContext!.rollDamage(damageStr, ctx.powerAttackBonus ?? 0)}
          title="Roll damage (includes Power Bonus)"
        />
      ) : (
        damageStr
      );

    const actionDisplay =
      display.actionType || formatSavedActionTypeForDisplay(power.actionType, powerIsReaction);

    const columns: ColumnValue[] = [
      { key: 'action', value: actionDisplay, align: 'center' },
      { key: 'damage', value: damageCell, align: 'center' },
      {
        key: 'area',
        value: display.area && display.area !== '-' ? display.area : formatArea(power.area),
        align: 'center',
      },
      {
        key: 'duration',
        value:
          display.duration && display.duration !== '-'
            ? display.duration
            : formatDurationCompact(power.duration),
        align: 'center',
      },
    ];

    const innateToggle =
      ctx.showLibraryEditControls && ctx.onTogglePowerInnate ? (
        <InnateToggle
          isInnate={isInnate}
          onToggle={() => ctx.onTogglePowerInnate!(id, !isInnate)}
          size="md"
        />
      ) : undefined;

    const detailSections = glrSurfaceDetailSections(
      'character-sheet-power-play',
      {
        category: categoryFactValue(categories),
        range: rangeValue,
        trainingPoints: display.tp > 0 ? display.tp : undefined,
      },
      partsSection ? [partsSection] : undefined,
    );

    return {
      id,
      name: power.name,
      description: power.description,
      thumbnail: resolveListRowThumbnail('power', power, power.name),
      columns,
      gridColumns: POWER_GRID,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      badges: needsProfBadge(ctx, { powers: [power] }),
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
  ctx: LibraryEntityRowContext,
): EntityTechniqueRow[] {
  return techniques.map((tech, i) => {
    const id = tech.id || String(i);
    const techIsReaction = (tech as CharacterTechnique & { isReaction?: boolean | undefined })
      .isReaction;
    const display = deriveTechniqueDisplay(
      libraryItemToTechniqueDocument({
        name: tech.name,
        description: tech.description,
        parts: tech.parts,
        damage: tech.damage,
        weaponName: tech.weaponName,
        actionType: tech.actionType,
        isReaction: techIsReaction,
      }),
      ctx.techniquePartsDb as TechniquePart[],
    );
    const energyCost =
      typeof display.energy === 'number' && display.energy > 0 ? display.energy : (tech.cost ?? 0);
    const canUse = ctx.currentEnergy !== undefined && ctx.currentEnergy >= energyCost;
    const partChips = partDataToChips(
      partsToPartData(tech.parts, ctx.techniquePartsDb, 'technique'),
    );
    const partsSection = partsProficienciesSection(partChips, 'technique');
    const techTP = (tech as { tp?: number | undefined }).tp;
    const storedTp =
      typeof techTP === 'number' ? techTP : typeof techTP === 'string' ? parseFloat(techTP) : 0;
    const totalTP = display.tp > 0 ? display.tp : storedTp;
    const actionDisplay =
      display.actionType || formatSavedActionTypeForDisplay(tech.actionType, techIsReaction);
    const categories = derivePartCategories(partsForCategories(tech.parts), ctx.techniquePartsDb);
    const damageValue =
      display.damageStr && display.damageStr !== '-'
        ? display.damageStr
        : tech.damage
          ? String(tech.damage)
          : undefined;
    const rangeChip = rangeFactChip(tech.range);
    const extraSections = mergeDetailSections(
      rangeChip ? metadataDetailSection([rangeChip]) : undefined,
      partsSection ? [partsSection] : undefined,
    );
    const detailSections = glrSurfaceDetailSections(
      'character-sheet-technique-play',
      {
        category: categoryFactValue(categories),
        damage: damageValue,
        trainingPoints: totalTP > 0 ? totalTP : undefined,
      },
      extraSections,
    );

    return {
      id,
      name: tech.name,
      description: tech.description,
      actionType: actionDisplay,
      thumbnail: resolveListRowThumbnail('technique', tech, tech.name),
      columns: [
        { key: 'action', value: actionDisplay, align: 'center' },
        {
          key: 'weapon',
          value: display.weaponName || tech.weaponName || '-',
          highlight: Boolean(display.weaponName || tech.weaponName),
          align: 'center',
        },
      ],
      gridColumns: CHARACTER_SHEET_TECHNIQUE_GRID,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      badges: needsProfBadge(ctx, { techniques: [tech] }),
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
      ctx.martialProficiency,
    );
    const propertyChips = partDataToChips(
      propertiesToPartData(
        resolveItemProperties(item as ItemWithLibrarySource),
        ctx.itemPropertiesDb,
      ),
    );
    const rangeValue = resolveWeaponRangeDisplay(
      (item as Item & { range?: string | undefined }).range,
      (resolveItemProperties(item as ItemWithLibrarySource) ?? []) as ItemPropertyPayload[],
    );
    const {
      dice: damageDice,
      type: damageType,
      rollStr: damageRollStr,
    } = splitDamageDiceAndType(item.damage);

    const attackButton =
      ctx.rollContext?.canRoll !== false && ctx.rollContext ? (
        <RollButton
          value={attackBonus}
          onClick={() => ctx.rollContext!.rollAttack(item.name, attackBonus)}
          size="sm"
          title={`Roll attack (${abilityName})`}
        />
      ) : (
        <span className="text-sm font-medium text-text-muted">
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
            <span className="text-[10px] leading-none text-text-muted">{damageType}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-text-muted">{damageDice}</span>
          {damageType && (
            <span className="text-[10px] leading-none text-text-muted">{damageType}</span>
          )}
        </div>
      );

    const propertySection = propertiesProficienciesSection(propertyChips, 'weapon');
    const detailSections = glrSurfaceDetailSections(
      'character-sheet-weapon-play',
      sheetItemCostFacts(item, ctx),
      propertySection ? [propertySection] : undefined,
    );

    return {
      id,
      name: item.name,
      description: item.description,
      thumbnail: resolveListRowThumbnail('equipment', item, item.name),
      columns: [
        { key: 'range', value: rangeValue, align: 'center' },
        { key: 'attack', value: attackButton, align: 'center' },
        { key: 'damage', value: damageButton, align: 'center' },
      ],
      gridColumns: CHARACTER_SHEET_WEAPON_GRID,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      badges: needsProfBadge(ctx, { weapons: [item] }),
      equipped: item.equipped,
      leftSlot: ctx.onToggleEquipWeapon ? (
        <EquipToggle
          isEquipped={item.equipped || false}
          onToggle={() => ctx.onToggleEquipWeapon!(id)}
          label={item.equipped ? 'Unequip' : 'Equip'}
        />
      ) : undefined,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveWeapon
          ? () => ctx.onRemoveWeapon!(id)
          : undefined,
    };
  });
}

export function mapShieldRows(shields: Item[], ctx: LibraryEntityRowContext): EntityShieldRow[] {
  return shields.map((item, i) => {
    const id = item.id ?? item.name ?? i;
    const enriched = item as Item & {
      shieldAmount?: string | undefined;
      shieldDamage?: string | null | undefined;
    };
    const shieldBlock = enriched.shieldAmount ?? '-';
    const shieldDamageStr = enriched.shieldDamage ?? (item.damage ? String(item.damage) : '-');
    const { bonus: attackBonus } = getWeaponAttackBonus(
      item,
      ctx.abilities,
      ctx.martialProficiency,
    );
    const rangeValue = resolveWeaponRangeDisplay(
      (item as Item & { range?: string | undefined }).range,
      (resolveItemProperties(item as ItemWithLibrarySource) ?? []) as ItemPropertyPayload[],
    );
    const {
      dice: shieldDamageDice,
      type: shieldDamageType,
      rollStr: shieldDamageRollStr,
    } = splitDamageDiceAndType(shieldDamageStr !== '-' ? String(shieldDamageStr) : item.damage);
    const propertyChips = partDataToChips(
      propertiesToPartData(
        resolveItemProperties(item as ItemWithLibrarySource),
        ctx.itemPropertiesDb,
      ),
    );

    const propertySection = propertiesProficienciesSection(propertyChips, 'shield');
    const detailSections = glrSurfaceDetailSections(
      'character-sheet-shield-play',
      sheetItemCostFacts(item, ctx),
      propertySection ? [propertySection] : undefined,
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
            <span className="text-[10px] leading-none text-text-muted">{shieldDamageType}</span>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-0.5">
          <span className="text-sm font-medium text-text-muted">{shieldDamageDice}</span>
          {shieldDamageType && (
            <span className="text-[10px] leading-none text-text-muted">{shieldDamageType}</span>
          )}
        </div>
      );

    return {
      id,
      name: item.name,
      description: item.description,
      thumbnail: resolveListRowThumbnail('equipment', item, item.name),
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
                    ctx.rollContext!.rollDamage(
                      String(shieldBlock) + ' Bludgeoning',
                      0,
                      'Shield block',
                    )
                  }
                  size="sm"
                  title="Roll shield block amount"
                />
              </div>
            ) : (
              shieldBlock
            ),
          className: 'text-primary-link-fg font-medium',
          align: 'center',
        },
      ],
      gridColumns: CHARACTER_SHEET_SHIELD_GRID,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      badges: needsProfBadge(ctx, { shields: [item] }),
      equipped: item.equipped,
      leftSlot: ctx.onToggleEquipShield ? (
        <EquipToggle
          isEquipped={item.equipped || false}
          onToggle={() => ctx.onToggleEquipShield!(id)}
          label={item.equipped ? 'Unequip' : 'Equip'}
        />
      ) : undefined,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveShield
          ? () => ctx.onRemoveShield!(id)
          : undefined,
    };
  });
}

export function mapArmorRows(armor: Item[], ctx: LibraryEntityRowContext): EntityArmorRow[] {
  return armor.map((item, i) => {
    const id = item.id ?? item.name ?? i;
    const propertyChips = partDataToChips(
      propertiesToPartData(
        resolveItemProperties(item as ItemWithLibrarySource),
        ctx.itemPropertiesDb,
      ),
    );
    const abilityReq = (
      item as Item & {
        abilityRequirement?: { name?: string | undefined; level?: number | undefined };
      }
    ).abilityRequirement;
    const agilityRed = (item as Item & { agilityReduction?: number | undefined }).agilityReduction;

    const { damageReduction, criticalRangeIncrease } = deriveArmorItemCombatStats(
      item as ItemWithLibrarySource,
    );
    const evasion = calculateEvasion(ctx.abilities?.agility ?? 0);
    const critThreshold =
      criticalRangeIncrease > 0
        ? calculateCriticalRange(evasion, criticalRangeIncrease)
        : undefined;

    const propertySection = propertiesProficienciesSection(propertyChips, 'armor');
    const detailSections = glrSurfaceDetailSections(
      'character-sheet-armor',
      {
        ...sheetItemCostFacts(item, ctx),
        abilityRequirement:
          abilityReq?.name && abilityReq.level != null
            ? { name: abilityReq.name, level: abilityReq.level }
            : undefined,
        agilityReduction: agilityRed,
      },
      propertySection ? [propertySection] : undefined,
    );

    return {
      id,
      name: item.name,
      description: item.description,
      thumbnail: resolveListRowThumbnail('equipment', item, item.name),
      columns: [
        {
          key: 'dr',
          value: damageReduction > 0 ? String(damageReduction) : '-',
          className: 'text-primary-link-fg font-medium',
          align: 'center',
        },
        { key: 'crit', value: critThreshold ?? '-', align: 'center' },
      ],
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      badges: needsProfBadge(ctx, { armor: [item] }),
      equipped: item.equipped,
      leftSlot: ctx.onToggleEquipArmor ? (
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

export function mapEquipmentRows(
  equipment: Item[],
  ctx: LibraryEntityRowContext,
): EntityEquipmentRow[] {
  return equipment.map((item, i) => {
    const itemId = item.id ?? item.name ?? i;
    const propertyChips = partDataToChips(
      propertiesToPartData(
        resolveItemProperties(item as ItemWithLibrarySource),
        ctx.itemPropertiesDb,
      ),
    );
    const propertySection = propertiesProficienciesSection(propertyChips, 'item');
    const itemType = formatListCellLabel(item.type);
    const itemCategory = (item as Item & { category?: string | undefined }).category;
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

    const detailSections = glrSurfaceDetailSections(
      'character-sheet-gear',
      {
        category: itemCategory,
        ...sheetItemCostFacts(item, ctx),
      },
      propertySection ? [propertySection] : undefined,
    );

    return {
      id: itemId,
      name: item.name,
      description: item.description,
      thumbnail: resolveListRowThumbnail('equipment', item, item.name),
      columns: [
        { key: 'type', value: itemType, align: 'center' },
        { key: 'quantity', value: quantityStepper, align: 'center' },
      ],
      detailSections: detailSections.length > 0 ? detailSections : undefined,
      onDelete:
        ctx.showLibraryEditControls && ctx.onRemoveEquipment
          ? () => ctx.onRemoveEquipment!(itemId)
          : undefined,
    };
  });
}
