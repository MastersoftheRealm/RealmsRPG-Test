/**
 * Character Sheet Header
 * ======================
 * Displays character identity, portrait, and vital stats
 *
 * Features:
 * - Health colors: green (normal), orange (half health), red (terminal)
 * - Smart value editing: type a value to set, prefix with +/- to modify
 * - Four-corner resource layout matching vanilla site
 * - Prominent speed/evasion display
 */

'use client';

import { useMemo } from 'react';
import { Card } from '@/components/ui';
import { useGameRules } from '@/hooks';
import { calculateHealthEnergyPool } from '@/lib/game/formulas';
import { calculateAllStats, calculateCriticalRange } from '@/lib/game/calculations';
import {
  applyTempModifier,
  applyTempModifiersToDisplayStats,
  getEffectiveAbilities,
  getScalarTempModifier,
  shouldApplyAbilityTempsToResourceMaxima,
  type TempModifierScalarKey,
} from '@/lib/character/temp-modifiers';
import { formatSpeedForDisplay } from '@/lib/utils/number';
import { useCharacterSheetOptional } from './character-sheet-context';
import { getEquippedArmorQuickRef } from './library-list-helpers';
import type { Character, CharacterTempModifiers, Item } from '@/types';
import { getHealthColor } from './sheet-resource-input';
import { LargeStatBlock } from './sheet-large-stat-block';
import { SheetHeaderIdentity } from './sheet-header-identity';
import { SheetHeaderResources } from './sheet-header-resources';

interface CalculatedStats {
  maxHealth: number;
  maxEnergy: number;
  terminal: number;
  speed: number;
  evasion: number;
  armor: number;
  defenseBonuses: Record<string, number>;
  defenseScores: Record<string, number>;
}

interface SheetHeaderProps {
  character: Character;
  calculatedStats: CalculatedStats;
  isEditMode?: boolean;
  onHealthChange?: (value: number) => void;
  onEnergyChange?: (value: number) => void;
  onActionPointsChange?: (value: number) => void;
  onHealthPointsChange?: (value: number) => void;
  onEnergyPointsChange?: (value: number) => void;
  onPortraitChange?: (file: File) => void | Promise<void>;
  onPortraitUrlChange?: (url: string) => void | Promise<void>;
  isUploadingPortrait?: boolean;
  /** After upload, pass a timestamp so the portrait image reloads (cache-bust). */
  portraitRefreshKey?: number | null;
  // Character name editing
  onNameChange?: (name: string) => void;
  // Experience editing
  onExperienceChange?: (value: number) => void;
  /** How to display speed: spaces (default), feet, or meters. */
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters';
  /** Sparse Temp Modifier patch (ADR-0006). Falls back to sheet context when omitted. */
  onTempModifiersChange?: (patch: CharacterTempModifiers) => void;
  // Innate info from archetype progression
  innateThreshold?: number;
  innatePools?: number;
  // Edit archetype/ability (opens modal from sheet)
  onEditArchetype?: () => void;
  // Edit species/ancestry (opens modal from sheet)
  onEditSpecies?: () => void;
  /** Library-enriched armor (same source as sheet armor rows) for DR / Critical Range. */
  enrichedArmor?: Item[];
}

const DEFAULT_ACTION_POINTS = 4;

export function SheetHeader({
  character: characterProp,
  calculatedStats,
  isEditMode: isEditModeProp = false,
  onHealthChange,
  onEnergyChange,
  onActionPointsChange,
  onHealthPointsChange,
  onEnergyPointsChange,
  onPortraitChange,
  onPortraitUrlChange,
  isUploadingPortrait = false,
  portraitRefreshKey = null,
  onNameChange,
  onExperienceChange,
  speedDisplayUnit = 'spaces',
  onTempModifiersChange: onTempModifiersChangeProp,
  innateThreshold = 0,
  innatePools = 0,
  onEditArchetype,
  onEditSpecies,
  enrichedArmor: enrichedArmorProp,
}: SheetHeaderProps) {
  const { rules } = useGameRules();
  const ctx = useCharacterSheetOptional();
  const character = (ctx?.character ?? characterProp) as Character;
  const isEditMode = ctx?.isEditMode ?? isEditModeProp;
  const isTempModifierMode = ctx?.isTempModifierMode ?? false;
  const onTempModifiersChange = onTempModifiersChangeProp ?? ctx?.onTempModifiersChange;
  const tempModifiers = character.tempModifiers;

  const setScalarTemp = (key: TempModifierScalarKey, delta: number) => {
    onTempModifiersChange?.({ [key]: delta });
  };
  const currentHealth =
    character.currentHealth ?? character.health?.current ?? calculatedStats.maxHealth;
  const currentEnergy =
    character.currentEnergy ?? character.energy?.current ?? calculatedStats.maxEnergy;
  const actionPoints = character.actionPoints ?? DEFAULT_ACTION_POINTS;

  const totalHEPool = calculateHealthEnergyPool(character.level || 1, 'PLAYER', false, rules);
  const healthPoints = character.healthPoints ?? 0;
  const energyPoints = character.energyPoints ?? 0;

  const displayStats = useMemo(() => {
    // Ability temps always cascade into speed/evasion (and thus crit via armor quick-ref).
    // Resource maxima only follow ability temps when the Abilities toggle is on (ADR-0006).
    const effectiveAbilities = getEffectiveAbilities(character.abilities, tempModifiers);
    const cascaded = calculateAllStats({ ...character, abilities: effectiveAbilities }, rules);
    const withAbilityCascade = {
      ...calculatedStats,
      speed: cascaded.speed,
      evasion: cascaded.evasion,
    };
    const resourceOverride = shouldApplyAbilityTempsToResourceMaxima(tempModifiers)
      ? {
          maxHealth: cascaded.maxHealth,
          maxEnergy: cascaded.maxEnergy,
          terminal: cascaded.terminal,
        }
      : undefined;
    return applyTempModifiersToDisplayStats(withAbilityCascade, tempModifiers, resourceOverride);
  }, [calculatedStats, character, rules, tempModifiers]);

  // Get health color for styling
  const healthColor = getHealthColor(currentHealth, displayStats.maxHealth);

  // Speed display (spaces → value + unit per settings); temps applied in spaces first
  const speedTemp = getScalarTempModifier(tempModifiers, 'speed');
  const evasionTemp = getScalarTempModifier(tempModifiers, 'evasion');
  const drTemp = getScalarTempModifier(tempModifiers, 'damageReduction');
  const critTemp = getScalarTempModifier(tempModifiers, 'criticalRange');
  const terminalTemp = getScalarTempModifier(tempModifiers, 'terminal');

  const speedDisplay = formatSpeedForDisplay(displayStats.speed, speedDisplayUnit);
  const speedDisplayValue =
    typeof speedDisplay.value === 'number' && speedDisplay.value % 1 !== 0
      ? speedDisplay.value.toFixed(1)
      : String(speedDisplay.value);

  const armorQuickRef = useMemo(() => {
    // DESIGN_INTENT: Header DR/Critical Range must use library-enriched armor (same source as
    // armor rows). Raw equipment often lacks armorValue; enrichment derives it from properties.
    const enriched = enrichedArmorProp ?? ctx?.enrichedData?.armor;
    const raw = character.equipment?.armor ?? character.armor;
    const source = enriched ?? raw;
    const armorItems: Item[] = Array.isArray(source)
      ? (source as Item[])
      : source
        ? [source as Item]
        : [];
    return getEquippedArmorQuickRef(armorItems, displayStats.evasion, rules);
  }, [
    enrichedArmorProp,
    ctx?.enrichedData?.armor,
    character.equipment?.armor,
    character.armor,
    displayStats.evasion,
    rules,
  ]);

  const baseDamageReduction = armorQuickRef?.damageReduction ?? 0;
  const critIncrease = armorQuickRef?.criticalRangeIncrease ?? 0;
  const baseCriticalRange = armorQuickRef
    ? armorQuickRef.criticalRange
    : calculateCriticalRange(displayStats.evasion, 0, rules);
  const displayDr = applyTempModifier(baseDamageReduction, drTemp);
  const displayCrit = applyTempModifier(baseCriticalRange, critTemp);
  // DESIGN_INTENT: Play/edit hide DR / Critical Range unless armor (or an existing temp)
  // changes that stat. Temp mode always shows both cards so a temp can be added.
  const showDamageReduction = isTempModifierMode || baseDamageReduction > 0 || drTemp !== 0;
  const showCriticalRange = isTempModifierMode || critIncrease > 0 || critTemp !== 0;

  return (
    <Card className="mb-4 p-4 shadow-md md:p-6" data-tour-id="sheet-tour-header">
      <div className="flex flex-col gap-6 lg:flex-row">
        <SheetHeaderIdentity
          character={character}
          isEditMode={isEditMode}
          healthColor={healthColor}
          onPortraitChange={onPortraitChange}
          onPortraitUrlChange={onPortraitUrlChange}
          isUploadingPortrait={isUploadingPortrait}
          portraitRefreshKey={portraitRefreshKey}
          onNameChange={onNameChange}
          onExperienceChange={onExperienceChange}
          onEditArchetype={onEditArchetype}
          onEditSpecies={onEditSpecies}
        />

        {/* Center section with Speed/Evasion - grows to fill available space */}
        <div className="flex flex-1 flex-wrap items-center justify-center gap-3 md:gap-4">
          <LargeStatBlock
            label="Speed"
            value={speedDisplayValue}
            valueSuffix={speedDisplay.suffix}
            isTempModifierMode={isTempModifierMode}
            tempDelta={speedTemp}
            onTempDeltaChange={onTempModifiersChange ? (d) => setScalarTemp('speed', d) : undefined}
          />
          <LargeStatBlock
            label="Evasion"
            value={displayStats.evasion}
            isTempModifierMode={isTempModifierMode}
            tempDelta={evasionTemp}
            onTempDeltaChange={
              onTempModifiersChange ? (d) => setScalarTemp('evasion', d) : undefined
            }
          />
          {showDamageReduction && (
            <LargeStatBlock
              label="Damage Reduction"
              value={displayDr}
              valueAriaLabel={`Damage Reduction ${displayDr}`}
              isTempModifierMode={isTempModifierMode}
              tempDelta={drTemp}
              onTempDeltaChange={
                onTempModifiersChange ? (d) => setScalarTemp('damageReduction', d) : undefined
              }
            />
          )}
          {showCriticalRange && (
            <LargeStatBlock
              label="Critical Range"
              value={displayCrit}
              valueAriaLabel={`Critical Range ${displayCrit}`}
              isTempModifierMode={isTempModifierMode}
              tempDelta={critTemp}
              onTempDeltaChange={
                onTempModifiersChange ? (d) => setScalarTemp('criticalRange', d) : undefined
              }
            />
          )}
        </div>

        <SheetHeaderResources
          actionPoints={actionPoints}
          onActionPointsChange={onActionPointsChange}
          currentHealth={currentHealth}
          maxHealth={displayStats.maxHealth}
          onHealthChange={onHealthChange}
          currentEnergy={currentEnergy}
          maxEnergy={displayStats.maxEnergy}
          onEnergyChange={onEnergyChange}
          terminal={displayStats.terminal}
          terminalTempDelta={terminalTemp}
          onTerminalTempChange={
            onTempModifiersChange ? (d) => setScalarTemp('terminal', d) : undefined
          }
          innateThreshold={innateThreshold}
          innatePools={innatePools}
          isEditMode={isEditMode}
          isTempModifierMode={isTempModifierMode}
          healthPoints={healthPoints}
          energyPoints={energyPoints}
          totalHEPool={totalHEPool}
          onHealthPointsChange={onHealthPointsChange}
          onEnergyPointsChange={onEnergyPointsChange}
        />
      </div>
    </Card>
  );
}
