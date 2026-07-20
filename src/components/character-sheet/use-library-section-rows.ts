/**
 * Sort state, entity-row mapping, and innate-energy display helpers for LibrarySection.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
  type SortState,
} from '@/components/shared';
import { toggleSort, sortByColumn } from '@/hooks/use-sort';
import { useRollsOptional } from '@/components/rolls';
import { calculateRemainingInnateEnergy } from '@/lib/game/formulas';
import { buildRequiredProficiencies, getMissingRequiredProficiencies } from '@/lib/proficiencies';
import type {
  CharacterPower,
  CharacterTechnique,
  Item,
  Abilities,
  CharacterProficiency,
} from '@/types';
import {
  mapPowerRows,
  mapTechniqueRows,
  mapWeaponRows,
  mapShieldRows,
  mapArmorRows,
  mapEquipmentRows,
  type LibraryEntityRowContext,
} from './library-entity-rows';

export type LibrarySectionRowsInput = {
  powers: CharacterPower[];
  techniques: CharacterTechnique[];
  weapons: Item[];
  shields: Item[];
  armor: Item[];
  equipment: Item[];
  innateEnergy: number;
  currentInnateEnergy?: number;
  currentEnergy: number;
  abilities?: Abilities;
  powerAttackBonus?: number;
  martialProficiency?: number;
  powerPartsDb: Array<{
    id: string;
    name: string;
    description?: string;
    base_tp?: number;
    op_1_tp?: number;
    op_2_tp?: number;
    op_3_tp?: number;
  }>;
  techniquePartsDb: Array<{
    id: string;
    name: string;
    description?: string;
    base_tp?: number;
    op_1_tp?: number;
    op_2_tp?: number;
    op_3_tp?: number;
  }>;
  itemPropertiesDb: Array<{
    id: string | number;
    name: string;
    description?: string;
    base_tp?: number;
    tp_cost?: number;
  }>;
  proficiencies: CharacterProficiency[];
  showLibraryEditControls: boolean;
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

export function useLibrarySectionRows({
  powers,
  techniques,
  weapons,
  shields,
  armor,
  equipment,
  innateEnergy,
  currentInnateEnergy,
  currentEnergy,
  abilities,
  powerAttackBonus,
  martialProficiency,
  powerPartsDb,
  techniquePartsDb,
  itemPropertiesDb,
  proficiencies,
  showLibraryEditControls,
  onUsePower,
  onRemovePower,
  onTogglePowerInnate,
  onUseTechnique,
  onRemoveTechnique,
  onRemoveWeapon,
  onToggleEquipWeapon,
  onRemoveShield,
  onToggleEquipShield,
  onRemoveArmor,
  onToggleEquipArmor,
  onRemoveEquipment,
  onEquipmentQuantityChange,
}: LibrarySectionRowsInput) {
  const rollContext = useRollsOptional();

  const [powerSort, setPowerSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [techniqueSort, setTechniqueSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [weaponSort, setWeaponSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [shieldSort, setShieldSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [armorSort, setArmorSort] = useState<SortState>({ col: 'name', dir: 1 });
  const [equipmentSort, setEquipmentSort] = useState<SortState>({ col: 'name', dir: 1 });

  const sortedInnatePowers = useMemo(
    () => sortByColumn(powers.filter((p) => p.innate === true), powerSort),
    [powers, powerSort]
  );
  const sortedRegularPowers = useMemo(
    () => sortByColumn(powers.filter((p) => p.innate !== true), powerSort),
    [powers, powerSort]
  );
  const sortedTechniques = useMemo(
    () => sortByColumn(techniques, techniqueSort),
    [techniques, techniqueSort]
  );
  const sortedWeapons = useMemo(
    () => sortByColumn(weapons, weaponSort),
    [weapons, weaponSort]
  );
  const sortedShields = useMemo(
    () => sortByColumn(shields, shieldSort),
    [shields, shieldSort]
  );
  const sortedArmor = useMemo(
    () => sortByColumn(armor, armorSort),
    [armor, armorSort]
  );
  const sortedEquipment = useMemo(
    () => sortByColumn(equipment, equipmentSort),
    [equipment, equipmentSort]
  );

  const hasMissingForEntry = useCallback(
    (params: {
      powers?: CharacterPower[];
      techniques?: CharacterTechnique[];
      weapons?: Item[];
      shields?: Item[];
      armor?: Item[];
    }) => {
      const requiredForEntry = buildRequiredProficiencies({
        powers: params.powers || [],
        techniques: params.techniques || [],
        weapons: params.weapons || [],
        shields: params.shields || [],
        armor: params.armor || [],
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      });
      return getMissingRequiredProficiencies(requiredForEntry, proficiencies).length > 0;
    },
    [powerPartsDb, techniquePartsDb, itemPropertiesDb, proficiencies]
  );

  const entityRowContext = useMemo<LibraryEntityRowContext>(
    () => ({
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
      abilities,
      powerAttackBonus,
      martialProficiency,
      currentEnergy,
      showLibraryEditControls,
      rollContext,
      hasMissingForEntry,
      onUsePower,
      onRemovePower,
      onTogglePowerInnate,
      onUseTechnique,
      onRemoveTechnique,
      onRemoveWeapon,
      onToggleEquipWeapon,
      onRemoveShield,
      onToggleEquipShield,
      onRemoveArmor,
      onToggleEquipArmor,
      onRemoveEquipment,
      onEquipmentQuantityChange,
    }),
    [
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
      abilities,
      powerAttackBonus,
      martialProficiency,
      currentEnergy,
      showLibraryEditControls,
      rollContext,
      hasMissingForEntry,
      onUsePower,
      onRemovePower,
      onTogglePowerInnate,
      onUseTechnique,
      onRemoveTechnique,
      onRemoveWeapon,
      onToggleEquipWeapon,
      onRemoveShield,
      onToggleEquipShield,
      onRemoveArmor,
      onToggleEquipArmor,
      onRemoveEquipment,
      onEquipmentQuantityChange,
    ]
  );

  const powerRowChrome = useMemo(
    () => ({
      ...CHARACTER_SHEET_ENERGY_SPEND_ROW_CHROME,
      leftSlot: !!(showLibraryEditControls && onTogglePowerInnate),
      delete: !!(showLibraryEditControls && onRemovePower),
    }),
    [showLibraryEditControls, onTogglePowerInnate, onRemovePower]
  );

  const innatePowerRows = useMemo(
    () => mapPowerRows(sortedInnatePowers, entityRowContext),
    [sortedInnatePowers, entityRowContext]
  );
  const displayedCurrentInnateEnergy = useMemo(
    () =>
      currentInnateEnergy !== undefined
        ? currentInnateEnergy
        : calculateRemainingInnateEnergy(innateEnergy, powers),
    [currentInnateEnergy, innateEnergy, powers]
  );
  const innateEnergyOverBudget = displayedCurrentInnateEnergy < 0;
  const regularPowerRows = useMemo(
    () => mapPowerRows(sortedRegularPowers, entityRowContext),
    [sortedRegularPowers, entityRowContext]
  );
  const techniqueRows = useMemo(
    () => mapTechniqueRows(sortedTechniques, entityRowContext),
    [sortedTechniques, entityRowContext]
  );
  const weaponRows = useMemo(
    () => mapWeaponRows(sortedWeapons, entityRowContext),
    [sortedWeapons, entityRowContext]
  );
  const shieldRows = useMemo(
    () => mapShieldRows(sortedShields, entityRowContext),
    [sortedShields, entityRowContext]
  );
  const armorRows = useMemo(
    () => mapArmorRows(sortedArmor, entityRowContext),
    [sortedArmor, entityRowContext]
  );
  const equipmentRows = useMemo(
    () => mapEquipmentRows(sortedEquipment, entityRowContext),
    [sortedEquipment, entityRowContext]
  );

  const handlePowerSort = useCallback(
    (col: string) => setPowerSort(toggleSort(powerSort, col)),
    [powerSort]
  );
  const handleTechniqueSort = useCallback(
    (col: string) => setTechniqueSort(toggleSort(techniqueSort, col)),
    [techniqueSort]
  );
  const handleWeaponSort = useCallback(
    (col: string) => setWeaponSort(toggleSort(weaponSort, col)),
    [weaponSort]
  );
  const handleShieldSort = useCallback(
    (col: string) => setShieldSort(toggleSort(shieldSort, col)),
    [shieldSort]
  );
  const handleArmorSort = useCallback(
    (col: string) => setArmorSort(toggleSort(armorSort, col)),
    [armorSort]
  );
  const handleEquipmentSort = useCallback(
    (col: string) => setEquipmentSort(toggleSort(equipmentSort, col)),
    [equipmentSort]
  );

  return {
    powerSort,
    techniqueSort,
    weaponSort,
    shieldSort,
    armorSort,
    equipmentSort,
    handlePowerSort,
    handleTechniqueSort,
    handleWeaponSort,
    handleShieldSort,
    handleArmorSort,
    handleEquipmentSort,
    powerRowChrome,
    innatePowerRows,
    regularPowerRows,
    techniqueRows,
    weaponRows,
    shieldRows,
    armorRows,
    equipmentRows,
    displayedCurrentInnateEnergy,
    innateEnergyOverBudget,
  };
}
