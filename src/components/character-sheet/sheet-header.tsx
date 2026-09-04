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
import { cn } from '@/lib/utils';
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
import type { AllowUndefinedOptionals } from '@/lib/utils/exact-optional';
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

interface SheetHeaderPropsFields {
  character: Character;
  calculatedStats: CalculatedStats;
  isEditMode?: boolean | undefined;
  onHealthChange?: ((value: number) => void) | undefined;
  onEnergyChange?: ((value: number) => void) | undefined;
  onActionPointsChange?: ((value: number) => void) | undefined;
  onHealthPointsChange?: ((value: number) => void) | undefined;
  onEnergyPointsChange?: ((value: number) => void) | undefined;
  onPortraitChange?: ((file: File) => void | Promise<void>) | undefined;
  onPortraitUrlChange?: ((url: string) => void | Promise<void>) | undefined;
  isUploadingPortrait?: boolean | undefined;
  /** After upload, pass a timestamp so the portrait image reloads (cache-bust). */
  portraitRefreshKey?: number | null | undefined;
  // Character name editing
  onNameChange?: ((name: string) => void) | undefined;
  // Experience editing
  onExperienceChange?: ((value: number) => void) | undefined;
  /** How to display speed: spaces (default), feet, or meters. */
  speedDisplayUnit?: 'spaces' | 'feet' | 'meters' | undefined;
  /** Sparse Temp Modifier patch (ADR-0006). Falls back to sheet context when omitted. */
  onTempModifiersChange?: ((patch: CharacterTempModifiers) => void) | undefined;
  // Innate info from archetype progression
  innateThreshold?: number | undefined;
  innatePools?: number | undefined;
  // Edit archetype/ability (opens modal from sheet)
  onEditArchetype?: (() => void) | undefined;
  // Edit species/ancestry (opens modal from sheet)
  onEditSpecies?: (() => void) | undefined;
  /** Library-enriched armor (same source as sheet armor rows) for DR / Critical Range. */
  enrichedArmor?: Item[] | undefined;
}

type SheetHeaderProps = AllowUndefinedOptionals<SheetHeaderPropsFields>;

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
  const vitalCount = 2 + Number(showDamageReduction) + Number(showCriticalRange);

  return (
    <Card className="mb-4 w-full min-w-0 p-4 shadow-md md:p-6" data-tour-id="sheet-tour-header">
      {/* C3/C5 (TASK-908): identity-weighted 3-col from lg (no 20rem cap). 4-across from md and xl; 2×2 at phone and lg. */}
      <div className="grid min-w-0 grid-cols-1 items-stretch gap-4 md:grid-cols-2 md:gap-5 lg:grid-cols-[minmax(0,1.4fr)_auto_minmax(15rem,1fr)] lg:items-center xl:grid-cols-[minmax(0,1.5fr)_auto_minmax(16rem,1.1fr)] xl:gap-6">
        <div className="min-w-0">
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
        </div>

        {/* 4-across from md and xl; 2×2 at lg so identity keeps width (TASK-908). */}
        <div className="flex min-w-0 justify-center md:col-span-2 lg:col-span-1 lg:col-start-2 lg:row-start-1">
          <div
            className={cn(
              'grid w-max max-w-full gap-2 md:gap-2.5',
              vitalCount >= 4
                ? 'grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4'
                : vitalCount === 3
                  ? 'grid-cols-2 sm:grid-cols-3'
                  : 'grid-cols-2',
            )}
            data-sheet-stat-grid
          >
            <LargeStatBlock
              label="Speed"
              value={speedDisplayValue}
              valueSuffix={speedDisplay.suffix}
              isTempModifierMode={isTempModifierMode}
              tempDelta={speedTemp}
              onTempDeltaChange={
                onTempModifiersChange ? (d) => setScalarTemp('speed', d) : undefined
              }
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
        </div>

        <div className="min-w-0">
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
      </div>
    </Card>
  );
}
