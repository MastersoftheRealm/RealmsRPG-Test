/**
 * Archetype Section
 * =================
 * Displays character archetype, proficiencies, attack bonuses, power potency, weapons, and armor
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { calculateProficiency, getArchetypeType, getArchetypeMilestoneLevels } from '@/lib/game/formulas';
import { useRollsOptional } from './roll-context';
import { EditSectionToggle, RollButton } from '@/components/shared';
import type { Character, Abilities, Item } from '@/types';

interface ArchetypeSectionProps {
  character: Character;
  isEditMode?: boolean;
  onMartialProfChange?: (value: number) => void;
  onPowerProfChange?: (value: number) => void;
  onMilestoneChoiceChange?: (level: number, choice: 'innate' | 'feat') => void;
  // Unarmed Prowess props
  unarmedProwess?: number; // 0 = not selected, 1-5 = prowess level
  onUnarmedProwessChange?: (level: number) => void;
}

function ProficiencyMeter({ 
  label, 
  value, 
  maxValue = 6,
  color = 'blue',
  isEditMode = false,
  onIncrease,
  onDecrease,
}: { 
  label: string; 
  value: number; 
  maxValue?: number;
  color?: 'blue' | 'purple' | 'red';
  isEditMode?: boolean;
  onIncrease?: () => void;
  onDecrease?: () => void;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    red: 'bg-red-500',
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <div className="flex items-center gap-1">
          {isEditMode && (
            <button
              onClick={onDecrease}
              disabled={value <= 0}
              className="w-5 h-5 rounded bg-surface hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold"
              title="Decrease proficiency"
            >
              −
            </button>
          )}
          <span className="font-bold w-4 text-center">{value}</span>
          {isEditMode && (
            <button
              onClick={onIncrease}
              disabled={value >= maxValue}
              className="w-5 h-5 rounded bg-surface hover:bg-surface-alt disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold"
              title="Increase proficiency"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: maxValue }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full',
              i < value ? colorClasses[color] : 'bg-surface'
            )}
          />
        ))}
      </div>
    </div>
  );
}

// Attack Bonuses Table - displays Prof/Unprof bonuses for each ability
function AttackBonusesTable({
  abilities,
  martialProf,
  powerProf,
  powerAbility,
  onRollBonus,
}: {
  abilities: Abilities;
  martialProf: number;
  powerProf: number;
  powerAbility?: string; // The archetype's power ability (pow_abil)
  onRollBonus?: (name: string, bonus: number) => void;
}) {
  // Calculate bonuses for each ability
  // Prof = ability + martial_prof, Unprof = ability only
  const martialBonuses = {
    strength: {
      prof: (abilities.strength ?? 0) + martialProf,
      unprof: abilities.strength ?? 0,
    },
    agility: {
      prof: (abilities.agility ?? 0) + martialProf,
      unprof: abilities.agility ?? 0,
    },
    acuity: {
      prof: (abilities.acuity ?? 0) + martialProf,
      unprof: abilities.acuity ?? 0,
    },
  };
  
  // Use the archetype's power ability for power bonus calculation
  // Default to charisma if not specified
  const powAbilKey = (powerAbility?.toLowerCase() || 'charisma') as keyof Abilities;
  const powAbilValue = abilities[powAbilKey] ?? 0;
  const powAbilDisplayName = powerAbility 
    ? powerAbility.charAt(0).toUpperCase() + powerAbility.slice(1).toLowerCase()
    : 'Charisma';
  
  const powerBonus = {
    prof: powAbilValue + powerProf,
    unprof: powAbilValue,
  };

  // Don't render table if no proficiencies at all
  if (martialProf === 0 && powerProf === 0) {
    return null;
  }

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Attack Bonuses</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted">
            <th className="text-left py-1"></th>
            <th className="text-center py-1">Prof.</th>
            <th className="text-center py-1">Unprof.</th>
          </tr>
        </thead>
        <tbody>
          {/* Martial rows - only show if martial proficiency > 0 */}
          {martialProf > 0 && (['strength', 'agility', 'acuity'] as const).map((key) => (
            <tr key={key}>
              <td className="py-1 font-medium text-text-secondary capitalize">⚔️ {key}</td>
              <td className="text-center py-1">
                <RollButton
                  value={martialBonuses[key].prof}
                  onClick={() => onRollBonus?.(`${key.charAt(0).toUpperCase() + key.slice(1)} (Prof.)`, martialBonuses[key].prof)}
                  size="sm"
                  title={`Roll ${key} (proficient)`}
                />
              </td>
              <td className="text-center py-1">
                <RollButton
                  value={martialBonuses[key].unprof}
                  variant="unproficient"
                  onClick={() => onRollBonus?.(`${key.charAt(0).toUpperCase() + key.slice(1)} (Unprof.)`, martialBonuses[key].unprof)}
                  size="sm"
                  title={`Roll ${key} (unproficient)`}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Power Attack Bonus - separate section, full width, no unprof */}
      {powerProf > 0 && (
        <div className="mt-3 pt-3 border-t border-border-light">
          <div className="flex items-center justify-between">
            <span className="font-medium text-text-secondary">✨ Power Attack ({powAbilDisplayName})</span>
            <RollButton
              value={powerBonus.prof}
              onClick={() => onRollBonus?.(`Power Attack [${powAbilDisplayName}]`, powerBonus.prof)}
              size="sm"
              title={`Roll power attack - ${powAbilDisplayName}`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Unarmed Prowess damage table based on character level
const UNARMED_PROWESS_DAMAGE = [
  { level: 0, damage: 'Ability' }, // Unproficient - half ability
  { level: 1, damage: '1d2' },     // Prowess I (base)
  { level: 2, damage: '1d4' },     // Prowess II (Lv 4)
  { level: 3, damage: '1d6' },     // Prowess III (Lv 8)
  { level: 4, damage: '1d8' },     // Prowess IV (Lv 12)
  { level: 5, damage: '1d10' },    // Prowess V (Lv 16+)
];

// Weapons Section - displays equipped weapons with attack/damage rolls
function WeaponsSection({
  character,
  martialProf,
  unarmedProwess = 0,
  onRollAttack,
  onRollDamage,
}: {
  character: Character;
  martialProf: number;
  unarmedProwess?: number;
  onRollAttack?: (name: string, bonus: number) => void;
  onRollDamage?: (damageStr: string, bonus: number) => void;
}) {
  const abilities = character.abilities || {};
  
  // Get equipped weapons from character equipment
  const weapons = (character.equipment?.weapons || []) as Item[];
  const equippedWeapons = weapons.filter(w => w.equipped);
  
  // Calculate bonuses for attack
  const strBonus = (abilities.strength ?? 0) + martialProf;
  const agiBonus = (abilities.agility ?? 0) + martialProf;
  const acuBonus = (abilities.acuity ?? 0) + martialProf;
  
  // Unarmed prowess uses STR or AGI (whichever is higher)
  const str = abilities.strength ?? 0;
  const agi = abilities.agility ?? 0;
  const unarmedAbility = Math.max(str, agi);
  
  // Calculate unarmed attack bonus based on proficiency
  const hasProwess = unarmedProwess > 0;
  const unarmedAttackBonus = hasProwess 
    ? unarmedAbility + martialProf  // Proficient: full ability + martial prof
    : (unarmedAbility < 0 ? unarmedAbility * 2 : Math.floor(unarmedAbility / 2)); // Unproficient: half ability (double if negative)
  
  // Calculate unarmed damage based on prowess level
  const prowessData = UNARMED_PROWESS_DAMAGE[unarmedProwess] || UNARMED_PROWESS_DAMAGE[0];
  const unarmedDamageDisplay = hasProwess 
    ? `${prowessData.damage} + ${unarmedAbility}` 
    : String(Math.max(1, Math.floor(unarmedAbility / 2)));

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Weapons</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted">
            <th className="text-left py-1">Name</th>
            <th className="text-center py-1">Attack</th>
            <th className="text-center py-1">Damage</th>
            <th className="text-center py-1">Range</th>
          </tr>
        </thead>
        <tbody>
          {equippedWeapons.map((weapon, idx) => {
            // Determine attack bonus based on weapon properties
            const props = (weapon.properties || []).map(p => typeof p === 'string' ? p : p.name || '');
            let attackBonus = strBonus;
            if (props.includes('Finesse')) {
              attackBonus = agiBonus;
            } else if (props.includes('Range') || weapon.range) {
              attackBonus = acuBonus;
            }
            
            // Parse damage - separate dice from type for display
            let damageDice = '-';
            let damageType = '';
            let damageStr = '-';
            
            if (weapon.damage) {
              if (Array.isArray(weapon.damage)) {
                const parts = weapon.damage
                  .filter((d: { amount?: number; size?: number; type?: string }) => d && d.amount && d.size)
                  .map((d: { amount?: number; size?: number; type?: string }) => ({
                    dice: `${d.amount}d${d.size}`,
                    type: d.type && d.type !== 'none' ? d.type : ''
                  }));
                if (parts.length > 0) {
                  damageDice = parts.map(p => p.dice).join(' + ');
                  damageType = parts.map(p => p.type).filter(Boolean).join(', ');
                  damageStr = parts.map(p => p.type ? `${p.dice} ${p.type}` : p.dice).join(', ');
                }
              } else {
                // Parse string like "1d8 Slashing"
                const strDamage = String(weapon.damage);
                const match = strDamage.match(/^([\dd+\-\s]+)(?:\s+(.+))?$/);
                if (match) {
                  damageDice = match[1].trim();
                  damageType = match[2]?.trim() || '';
                  damageStr = strDamage;
                }
              }
            }
            
            // Show non-excluded properties below
            const excludedProps = ['Damage Reduction', 'Split Damage Dice', 'Range', 'Shield Base', 'Armor Base', 'Weapon Damage'];
            const displayProps = props.filter(p => p && !excludedProps.includes(p));
            
            return (
              <tr key={weapon.id || idx} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-2 font-medium text-text-secondary">
                  {weapon.name}
                  {displayProps.length > 0 && (
                    <div className="text-xs text-text-muted font-normal">
                      {displayProps.map(p => `• ${p}`).join(' ')}
                    </div>
                  )}
                </td>
                <td className="text-center py-2">
                  <RollButton
                    value={attackBonus}
                    onClick={() => onRollAttack?.(weapon.name || 'Attack', attackBonus)}
                    size="sm"
                    title={`Roll attack with ${weapon.name}`}
                  />
                </td>
                <td className="text-center py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    <RollButton
                      value={0}
                      displayValue={damageDice}
                      variant="danger"
                      onClick={() => onRollDamage?.(damageStr, attackBonus)}
                      size="sm"
                      title={`Roll ${damageStr} damage`}
                    />
                    {damageType && (
                      <span className="text-[10px] text-text-muted">{damageType}</span>
                    )}
                  </div>
                </td>
                <td className="text-center py-2 text-text-muted">
                  {weapon.range || 'Melee'}
                </td>
              </tr>
            );
          })}
          {/* Unarmed Prowess - always shown, styled based on proficiency */}
          <tr className="border-t border-border-light align-top">
            <td className="py-2 font-medium text-text-secondary">
              Unarmed Prowess
              {hasProwess && (
                <span className="text-xs text-primary-600 ml-1">(Proficient)</span>
              )}
            </td>
            <td className="text-center py-2">
              <RollButton
                value={unarmedAttackBonus}
                variant={hasProwess ? 'primary' : 'unproficient'}
                onClick={() => onRollAttack?.('Unarmed Prowess', unarmedAttackBonus)}
                size="sm"
                title={`Roll unarmed attack (${hasProwess ? 'proficient' : 'unproficient'})`}
              />
            </td>
            <td className="text-center py-2">
              <div className="flex flex-col items-center gap-0.5">
                <RollButton
                  value={0}
                  displayValue={unarmedDamageDisplay}
                  variant={hasProwess ? 'danger' : 'unproficient'}
                  onClick={() => onRollDamage?.(`${unarmedDamageDisplay} Bludgeoning`, unarmedAttackBonus)}
                  size="sm"
                  title="Roll unarmed damage"
                />
                <span className="text-[10px] text-text-muted">Bludgeoning</span>
              </div>
            </td>
            <td className="text-center py-2 text-text-muted">Melee</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Armor Section - displays equipped armor with stats
function ArmorSection({
  character,
}: {
  character: Character;
}) {
  const abilities = character.abilities || {};
  const agility = abilities.agility ?? 0;
  const baseEvasion = 10 + agility;
  
  // Get equipped armor from character
  const armor = (character.equipment?.armor || character.armor || []) as Item[];
  const armorArray = Array.isArray(armor) ? armor : [armor].filter(Boolean);
  const equippedArmor = armorArray.filter((a): a is Item => a !== null && a !== undefined && (a as Item).equipped === true);

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <h4 className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-2">Armor</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted">
            <th className="text-left py-1">Name</th>
            <th className="text-center py-1">DMG Red.</th>
            <th className="text-center py-1">Crit Rng</th>
            <th className="text-center py-1">Abl Req.</th>
          </tr>
        </thead>
        <tbody>
          {equippedArmor.length > 0 ? (
            equippedArmor.map((armorItem, idx) => {
              // Extract properties
              const properties = armorItem.properties || [];
              let damageReduction = 0;
              let critRangeBonus = 0;
              const abilityReqs: string[] = [];
              
              properties.forEach(prop => {
                if (!prop) return;
                const propName = typeof prop === 'string' ? prop : prop.name || '';
                const op1Lvl = Number((typeof prop === 'object' && 'op_1_lvl' in prop ? (prop as any).op_1_lvl : 0) || 0);

                if (propName === 'Damage Reduction') damageReduction = 1 + op1Lvl;
                if (propName === 'Critical Range +1') critRangeBonus = 1 + op1Lvl;
                if (propName === 'Armor Strength Requirement') abilityReqs.push(`STR ${1 + op1Lvl}`);
                if (propName === 'Armor Agility Requirement') abilityReqs.push(`AGI ${1 + op1Lvl}`);
                if (propName === 'Armor Vitality Requirement') abilityReqs.push(`VIT ${1 + op1Lvl}`);
              });
              
              const critRange = baseEvasion + 10 + critRangeBonus;
              
              // Properties to exclude from display
              const excludedProps = [
                'Damage Reduction', 'Split Damage Dice', 'Range', 'Shield Base', 
                'Armor Base', 'Weapon Damage', 'Critical Range +1',
                'Armor Strength Requirement', 'Armor Agility Requirement', 'Armor Vitality Requirement'
              ];
              const propNames = properties.map(p => typeof p === 'string' ? p : p.name || '');
              const displayProps = propNames.filter(n => n && !excludedProps.includes(n));
              
              return (
                <tr key={armorItem.id || idx} className="border-b border-border-subtle last:border-0">
                  <td className="py-1 font-medium text-text-secondary">
                    {armorItem.name}
                    {displayProps.length > 0 && (
                      <div className="text-xs text-text-muted font-normal">
                        {displayProps.map(p => `• ${p}`).join(' ')}
                      </div>
                    )}
                  </td>
                  <td className="text-center py-1 font-mono">{damageReduction}</td>
                  <td className="text-center py-1 font-mono">{critRange}</td>
                  <td className="text-center py-1 text-xs">{abilityReqs.join(', ') || 'None'}</td>
                </tr>
              );
            })
          ) : (
            <tr>
              <td colSpan={4} className="py-2 text-center text-text-muted italic">No armor equipped</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function ArchetypeSection({
  character,
  isEditMode = false,
  onMartialProfChange,
  onPowerProfChange,
  onMilestoneChoiceChange,
  unarmedProwess,
  onUnarmedProwessChange,
}: ArchetypeSectionProps) {
  const martialProf = character.mart_prof ?? character.martialProficiency ?? 0;
  const powerProf = character.pow_prof ?? character.powerProficiency ?? 0;
  const rollContext = useRollsOptional();
  
  // Local state for whether this section is actively being edited
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  
  // Derived state: is the section actually editable right now?
  const showEditControls = isEditMode && isSectionEditing;
  
  // Calculate proficiency points
  const level = character.level || 1;
  const totalProfPoints = calculateProficiency(level);
  const spentProfPoints = martialProf + powerProf;
  const remainingProfPoints = totalProfPoints - spentProfPoints;
  
  // Determine archetype type for milestone UI
  const archetypeType = getArchetypeType(martialProf, powerProf);
  const milestoneLevels = getArchetypeMilestoneLevels(level);
  const archetypeChoices = character.archetypeChoices || {};
  
  // Three-state color for proficiency points
  const getProfPointsColorClass = () => {
    if (remainingProfPoints > 0) return 'bg-green-100 text-green-700'; // Has points
    if (remainingProfPoints < 0) return 'bg-red-100 text-red-700'; // Over budget
    return 'bg-blue-100 text-blue-700'; // Perfect
  };
  
  // Calculate Power Potency: 10 + pow_prof + pow_abil value
  const powAbilName = character.pow_abil?.toLowerCase() || 'charisma';
  const martAbilName = character.mart_abil?.toLowerCase() || 'strength';
  const powAbilValue = character.abilities?.[powAbilName as keyof Abilities] ?? 0;
  const martAbilValue = character.abilities?.[martAbilName as keyof Abilities] ?? 0;
  const powerPotency = 10 + powerProf + powAbilValue;
  const martialPotency = 10 + martialProf + martAbilValue;
  
  // Build archetype title with abilities
  const getArchetypeTitle = (): string => {
    const parts: string[] = [];
    if (powerProf > 0) {
      const abilName = character.pow_abil 
        ? character.pow_abil.charAt(0).toUpperCase() + character.pow_abil.slice(1).toLowerCase()
        : 'Charisma';
      parts.push(`Power - ${abilName}`);
    }
    if (martialProf > 0) {
      const abilName = character.mart_abil 
        ? character.mart_abil.charAt(0).toUpperCase() + character.mart_abil.slice(1).toLowerCase()
        : 'Strength';
      parts.push(`Martial - ${abilName}`);
    }
    if (parts.length === 0) return 'Archetype';
    return parts.join(' / ') + ' Archetype';
  };
  
  // Handle attack bonus roll
  const handleRollBonus = (name: string, bonus: number) => {
    rollContext?.rollAttack(name, bonus);
  };
  
  // Handle damage roll
  const handleRollDamage = (damageStr: string, bonus: number) => {
    rollContext?.rollDamage?.(damageStr, bonus);
  };

  // Calculate edit state for pencil icon color
  const getEditState = (): 'normal' | 'has-points' | 'over-budget' => {
    if (remainingProfPoints > 0) return 'has-points';
    if (remainingProfPoints < 0) return 'over-budget';
    return 'normal';
  };

  return (
    <div className="bg-surface rounded-xl shadow-md p-4 md:p-6 relative">
      {/* Edit Mode Indicator - Blue Pencil Icon in top-right */}
      {isEditMode && (
        <div className="absolute top-3 right-3">
          <EditSectionToggle 
            state={getEditState()}
            isActive={isSectionEditing}
            onClick={() => setIsSectionEditing(prev => !prev)}
            title={
              isSectionEditing
                ? 'Click to close editing'
                : getEditState() === 'has-points' 
                  ? 'Click to edit - you have proficiency points to spend' 
                  : getEditState() === 'over-budget'
                    ? 'Click to edit - over budget, remove proficiency points'
                    : 'Click to edit archetype'
            }
          />
        </div>
      )}
      
      {/* Archetype Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary">
          Archetype Proficiency
        </h2>
        {character.archetype?.name && (
          <p className="text-sm text-text-muted mt-0.5">
            {character.archetype.name}
          </p>
        )}
      </div>

      {/* Proficiencies - only show non-zero values (unless editing) */}
      {(martialProf > 0 || powerProf > 0 || showEditControls) && (
        <div className={cn(
          'grid gap-4 mb-4',
          (martialProf > 0 || showEditControls) && (powerProf > 0 || showEditControls) ? 'grid-cols-2' : 'grid-cols-1'
        )}>
          {(martialProf > 0 || showEditControls) && (
            <ProficiencyMeter 
              label="Martial" 
              value={martialProf}
              color="red"
              isEditMode={showEditControls}
              onIncrease={() => onMartialProfChange?.(martialProf + 1)}
              onDecrease={() => onMartialProfChange?.(martialProf - 1)}
            />
          )}
          {(powerProf > 0 || showEditControls) && (
            <ProficiencyMeter 
              label="Power" 
              value={powerProf}
              color="purple"
              isEditMode={showEditControls}
              onIncrease={() => onPowerProfChange?.(powerProf + 1)}
              onDecrease={() => onPowerProfChange?.(powerProf - 1)}
            />
          )}
        </div>
      )}
      
      {/* Proficiency Points Display - three-state coloring */}
      {showEditControls && (
        <div className="mb-4 flex justify-center">
          <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getProfPointsColorClass())}>
            {remainingProfPoints} / {totalProfPoints} prof. points
          </span>
        </div>
      )}
      
      {/* Mixed Archetype Milestone Choices */}
      {archetypeType === 'mixed' && milestoneLevels.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-purple-50 border border-amber-200 rounded-lg">
          <h4 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-2">
            Milestone Choices
          </h4>
          <div className="flex flex-wrap gap-2">
            {milestoneLevels.map((milestoneLevel) => {
              const currentChoice = archetypeChoices[milestoneLevel];
              return (
                <div key={milestoneLevel} className="flex items-center gap-1">
                  <span className="text-xs text-text-muted min-w-[32px]">Lv.{milestoneLevel}:</span>
                  {showEditControls && onMilestoneChoiceChange ? (
                    <div className="flex gap-1">
                      <button
                        onClick={() => onMilestoneChoiceChange(milestoneLevel, 'innate')}
                        className={cn(
                          'px-2 py-0.5 text-xs rounded transition-colors',
                          currentChoice === 'innate'
                            ? 'bg-purple-500 text-white'
                            : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                        )}
                        title="Gain +1 Innate Threshold & +1 Innate Pools"
                      >
                        ✨ Innate
                      </button>
                      <button
                        onClick={() => onMilestoneChoiceChange(milestoneLevel, 'feat')}
                        className={cn(
                          'px-2 py-0.5 text-xs rounded transition-colors',
                          currentChoice === 'feat'
                            ? 'bg-red-500 text-white'
                            : 'bg-red-100 text-red-600 hover:bg-red-200'
                        )}
                        title="Gain +1 Bonus Archetype Feat"
                      >
                        🎯 Feat
                      </button>
                    </div>
                  ) : (
                    <span className={cn(
                      'px-2 py-0.5 text-xs rounded',
                      currentChoice === 'innate'
                        ? 'bg-purple-100 text-purple-700'
                        : currentChoice === 'feat'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-surface text-text-muted italic'
                    )}>
                      {currentChoice === 'innate' ? '✨ Innate' : 
                       currentChoice === 'feat' ? '🎯 Feat' : 'Not chosen'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-text-muted mt-2">
            Mixed archetypes choose at levels 4, 7, 10, etc.: +1 Innate (Threshold & Pools) OR +1 Bonus Feat
          </p>
        </div>
      )}
      
      {/* Potency displays - only show if character has corresponding proficiency */}
      {(powerProf > 0 || martialProf > 0) && (
        <div className="flex gap-3 mb-4">
          {martialProf > 0 && (
            <div className="flex-1 bg-red-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-red-700">Martial Potency</span>
              <span className="text-lg font-bold text-red-800" title="10 + Martial Prof + Martial Ability">
                {martialPotency}
              </span>
            </div>
          )}
          {powerProf > 0 && (
            <div className="flex-1 bg-purple-50 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-purple-700">Power Potency</span>
              <span className="text-lg font-bold text-purple-800" title="10 + Power Prof + Power Ability">
                {powerPotency}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Unarmed Prowess Display - show if character has unarmed prowess */}
      {(unarmedProwess !== undefined && unarmedProwess > 0) && (
        <div className="mb-4 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-amber-700">Unarmed Prowess</span>
              <span className="text-lg font-bold text-amber-800">Level {unarmedProwess}</span>
            </div>
            {showEditControls && onUnarmedProwessChange && (
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onUnarmedProwessChange(Math.max(0, (unarmedProwess || 1) - 1))}
                  className="w-6 h-6 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 font-bold flex items-center justify-center"
                  title="Decrease prowess level"
                >
                  −
                </button>
                <button
                  onClick={() => onUnarmedProwessChange(Math.min(5, (unarmedProwess || 0) + 1))}
                  disabled={(unarmedProwess || 0) >= 5}
                  className="w-6 h-6 rounded bg-amber-100 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed text-amber-700 font-bold flex items-center justify-center"
                  title="Increase prowess level"
                >
                  +
                </button>
              </div>
            )}
          </div>
          <p className="text-xs text-amber-600 mt-1">
            Unarmed attacks deal 1d4+STR bludgeoning • {unarmedProwess >= 2 ? 'Counts as weapon' : ''} {unarmedProwess >= 3 ? '• Choose damage type' : ''}
          </p>
        </div>
      )}
      
      {/* Attack Bonuses Table */}
      {character.abilities && (
        <AttackBonusesTable
          abilities={character.abilities}
          martialProf={martialProf}
          powerProf={powerProf}
          powerAbility={character.pow_abil}
          onRollBonus={handleRollBonus}
        />
      )}

      {/* Weapons Section */}
      <WeaponsSection
        character={character}
        martialProf={martialProf}
        unarmedProwess={unarmedProwess}
        onRollAttack={handleRollBonus}
        onRollDamage={handleRollDamage}
      />

      {/* Armor Section */}
      <ArmorSection character={character} />
    </div>
  );
}
