/**
 * Abilities Section
 * =================
 * Displays the six core abilities in a row with clickable roll buttons,
 * followed by a separate defenses row with defense scores and roll buttons.
 *
 * // DESIGN_INTENT: Dense like sheet-header LargeStatBlock — label glued to value,
 * content-height tiles (no equal-height empty cards). Ability play = RollButton;
 * defense glance = Score, play = smaller bonus RollButton.
 * Sheet Edit = rules spend; sheet Temp Modifier = layered deltas (ADR-0006 / TASK-782).
 */

'use client';

import { useMemo, useState } from 'react';
import { EditSectionToggle, PointStatus, TempModifierToggle } from '@/components/shared';
import { Card } from '@/components/ui';
import { DEFENSE_INCREASE_COST } from '@/lib/game/skill-allocation';
import { calculateAbilityScoreCost } from '@/lib/game/formulas';
import {
  getDefenseTempModifier,
  getEffectiveAbilities,
  sectionTempModifierTint,
} from '@/lib/character/temp-modifiers';
import type {
  Abilities,
  AbilityName,
  CharacterTempModifiers,
  DefenseName,
  DefenseSkills,
} from '@/types';
import { ABILITY_INFO, ABILITY_ORDER, ABILITY_CONSTRAINTS } from './abilities-section-model';
import { AbilityStatTile } from './ability-stat-tile';
import { DefenseStatTile } from './defense-stat-tile';

// =============================================================================
// Types
// =============================================================================

interface AbilitiesSectionProps {
  abilities: Abilities;
  defenseSkills?: DefenseSkills;
  level: number;
  archetypeAbility?: AbilityName;
  martialAbility?: AbilityName;
  powerAbility?: AbilityName;
  isEditMode?: boolean;
  isTempModifierMode?: boolean;
  totalAbilityPoints?: number;
  spentAbilityPoints?: number;
  totalSkillPoints?: number;
  spentSkillPoints?: number;
  tempModifiers?: CharacterTempModifiers;
  onTempModifiersChange?: (patch: CharacterTempModifiers) => void;
  onAbilityChange?: (ability: AbilityName, value: number) => void;
  onDefenseChange?: (defense: keyof DefenseSkills, value: number) => void;
}

// =============================================================================
// Main Component
// =============================================================================

export function AbilitiesSection({
  abilities,
  defenseSkills,
  level,
  martialAbility,
  powerAbility,
  isEditMode = false,
  isTempModifierMode = false,
  totalAbilityPoints,
  spentAbilityPoints,
  totalSkillPoints,
  spentSkillPoints,
  tempModifiers,
  onTempModifiersChange,
  onAbilityChange,
  onDefenseChange,
}: AbilitiesSectionProps) {
  const [sectionAdjustOpen, setSectionAdjustOpen] = useState(false);
  const sheetModeKey = `${isEditMode}:${isTempModifierMode}`;
  const [prevSheetModeKey, setPrevSheetModeKey] = useState(sheetModeKey);
  if (sheetModeKey !== prevSheetModeKey) {
    setPrevSheetModeKey(sheetModeKey);
    setSectionAdjustOpen(false);
  }

  const showSpendControls = isEditMode && sectionAdjustOpen;
  const showTempControls = isTempModifierMode && sectionAdjustOpen;
  const showEditControls = showSpendControls || showTempControls;
  const showSectionToggle = isEditMode || isTempModifierMode;

  const effectiveAbilities = useMemo(
    () => getEffectiveAbilities(abilities, tempModifiers),
    [abilities, tempModifiers],
  );

  // Calculate ability points spent (base allocation only — temps are not spend)
  const calculatedSpentAbilityPoints = useMemo(() => {
    return ABILITY_ORDER.reduce(
      (sum, ability) => sum + calculateAbilityScoreCost(abilities[ability] ?? 0),
      0,
    );
  }, [abilities]);

  const getDefenseValue = (defenseKey: keyof DefenseSkills): number => {
    return defenseSkills?.[defenseKey] ?? 0;
  };

  const getDefenseBonus = (ability: AbilityName, useEffective: boolean): number => {
    const abilityValue = (useEffective ? effectiveAbilities : abilities)[ability] ?? 0;
    const defenseKey = ABILITY_INFO[ability].defenseKey;
    const defenseValue = getDefenseValue(defenseKey);
    const defenseTemp = getDefenseTempModifier(tempModifiers, defenseKey as DefenseName);
    return abilityValue + defenseValue + defenseTemp;
  };

  const getDefenseScore = (ability: AbilityName, useEffective: boolean): number => {
    return 10 + getDefenseBonus(ability, useEffective);
  };

  const maxAbility = ABILITY_CONSTRAINTS.getMaxAbility(level);
  const maxDefenseSkill = ABILITY_CONSTRAINTS.getMaxDefenseSkill(level);

  const abilityRemaining =
    totalAbilityPoints !== undefined
      ? totalAbilityPoints - (spentAbilityPoints ?? calculatedSpentAbilityPoints)
      : 0;
  const skillPointsRemaining =
    totalSkillPoints !== undefined ? totalSkillPoints - (spentSkillPoints ?? 0) : 0;

  const abilityEditState =
    totalAbilityPoints !== undefined || totalSkillPoints !== undefined
      ? abilityRemaining < 0 || skillPointsRemaining < 0
        ? 'over-budget'
        : abilityRemaining > 0 || skillPointsRemaining > 0
          ? 'has-points'
          : 'normal'
      : 'normal';
  const tempTint = sectionTempModifierTint(tempModifiers, 'abilities');
  const applyToResourceMaxima = tempModifiers?.applyAbilityToResourceMaxima === true;

  return (
    <Card className="relative mb-4 p-4 shadow-md md:p-6">
      {showSectionToggle && (
        <div className="absolute top-3 right-3">
          {isEditMode ? (
            <EditSectionToggle
              state={abilityEditState}
              isActive={sectionAdjustOpen}
              onClick={() => setSectionAdjustOpen((open) => !open)}
              title={
                sectionAdjustOpen
                  ? 'Close point spending'
                  : abilityEditState === 'has-points'
                    ? 'Edit — spend ability/defense points'
                    : abilityEditState === 'over-budget'
                      ? 'Edit — over budget, remove points'
                      : 'Edit abilities & defenses'
              }
            />
          ) : (
            <TempModifierToggle
              isActive={sectionAdjustOpen}
              tint={tempTint}
              onClick={() => setSectionAdjustOpen((open) => !open)}
              title={
                sectionAdjustOpen
                  ? 'Close Temp Modifier'
                  : tempTint === 'none'
                    ? 'Temp Modifier'
                    : 'Temp Modifier (active adjustments)'
              }
            />
          )}
        </div>
      )}

      {showSpendControls && (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-lg bg-surface-secondary p-3">
          <div className="flex flex-wrap justify-center gap-4">
            {totalAbilityPoints !== undefined && (
              <PointStatus
                label="Ability Points"
                spent={spentAbilityPoints ?? calculatedSpentAbilityPoints}
                total={totalAbilityPoints}
                variant="inline"
              />
            )}
            {totalSkillPoints !== undefined && (
              <PointStatus
                label="Skill Points (Defenses)"
                spent={spentSkillPoints ?? 0}
                total={totalSkillPoints}
                variant="inline"
              />
            )}
          </div>
          <div className="text-xs text-text-muted">
            Max ability: +{maxAbility} | Defense: {DEFENSE_INCREASE_COST}sp per +1 (max +
            {maxDefenseSkill})
          </div>
        </div>
      )}

      {showTempControls && (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-lg bg-surface-secondary p-3">
          <p className="text-center text-xs text-text-secondary">
            Temp Modifier — layered Bonus/Penalty (does not spend points). Values tint gold or
            danger.
          </p>
          <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-text-primary">
            <input
              type="checkbox"
              checked={applyToResourceMaxima}
              onChange={(e) =>
                onTempModifiersChange?.({
                  applyAbilityToResourceMaxima: e.target.checked,
                })
              }
              className="rounded border-border"
              aria-describedby="ability-temp-resource-maxima-help"
            />
            <span>Apply ability temps to max Health / Energy / TP</span>
          </label>
          <p
            id="ability-temp-resource-maxima-help"
            className="text-center text-[10px] text-text-muted"
          >
            Default off. When on, ability Temp Modifiers also adjust resource maxima.
          </p>
        </div>
      )}

      {/* Abilities — label + roll; equal gap + tile padding (not squashed, not empty) */}
      <div className="mb-4 grid grid-cols-3 gap-2.5 sm:grid-cols-6 md:gap-3">
        {ABILITY_ORDER.map((ability) => (
          <AbilityStatTile
            key={ability}
            ability={ability}
            abilities={abilities}
            level={level}
            powerAbility={powerAbility}
            martialAbility={martialAbility}
            tempModifiers={tempModifiers}
            showSpendControls={showSpendControls}
            showTempControls={showTempControls}
            showEditControls={showEditControls}
            maxAbility={maxAbility}
            abilityRemaining={abilityRemaining}
            totalAbilityPoints={totalAbilityPoints}
            onAbilityChange={onAbilityChange}
            onTempModifiersChange={onTempModifiersChange}
          />
        ))}
      </div>

      {/* Defenses — Score glance + roll; same tip/tile rhythm as abilities */}
      <div className="border-t border-border-light pt-4">
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6 md:gap-3">
          {ABILITY_ORDER.map((ability) => (
            <DefenseStatTile
              key={ABILITY_INFO[ability].defenseKey}
              ability={ability}
              abilities={abilities}
              defenseSkills={defenseSkills}
              level={level}
              tempModifiers={tempModifiers}
              showSpendControls={showSpendControls}
              showTempControls={showTempControls}
              maxDefenseSkill={maxDefenseSkill}
              skillPointsRemaining={skillPointsRemaining}
              totalSkillPoints={totalSkillPoints}
              defenseBonus={getDefenseBonus(ability, true)}
              defenseScore={getDefenseScore(ability, true)}
              onDefenseChange={onDefenseChange}
              onTempModifiersChange={onTempModifiersChange}
            />
          ))}
        </div>
      </div>
    </Card>
  );
}
