/**
 * Archetype Section
 * =================
 * Displays character archetype, proficiencies, attack bonuses, power potency, weapons, and armor
 */

'use client';

import { cn } from '@/lib/utils';
import { calculateProficiency, getArchetypeType, getArchetypeMilestoneLevels } from '@/lib/game/formulas';
import { useRollsOptional } from './roll-context';
import { EditSectionToggle } from '@/components/shared';
import type { Character, Abilities, Item } from '@/types';

interface ArchetypeSectionProps {
  character: Character;
  isEditMode?: boolean;
  onMartialProfChange?: (value: number) => void;
  onPowerProfChange?: (value: number) => void;
  onMilestoneChoiceChange?: (level: number, choice: 'innate' | 'feat') => void;
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
  onRollBonus,
}: {
  abilities: Abilities;
  martialProf: number;
  powerProf: number;
  onRollBonus?: (name: string, bonus: number) => void;
}) {
  const formatBonus = (val: number) => val >= 0 ? `+${val}` : `${val}`;
  
  // Calculate bonuses for each ability
  // Prof = ability + martial_prof, Unprof = ability only (or ability/2 rounded up for negative)
  const bonuses = {
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
    power: {
      prof: (abilities[('charisma')] ?? 0) + powerProf, // Using default power ability
      unprof: abilities[('charisma')] ?? 0,
    },
  };

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
          {(['strength', 'agility', 'acuity', 'power'] as const).map((key) => (
            <tr key={key}>
              <td className="py-1 font-medium text-text-secondary capitalize">{key}</td>
              <td className="text-center py-1">
                <button
                  onClick={() => onRollBonus?.(`${key.charAt(0).toUpperCase() + key.slice(1)} (Prof.)`, bonuses[key].prof)}
                  className="px-2 py-0.5 bg-surface border border-border-light rounded hover:bg-primary-50 hover:border-primary-300 transition-colors font-mono text-sm"
                  title={`Roll ${key} (proficient)`}
                >
                  {formatBonus(bonuses[key].prof)}
                </button>
              </td>
              <td className="text-center py-1">
                <button
                  onClick={() => onRollBonus?.(`${key.charAt(0).toUpperCase() + key.slice(1)} (Unprof.)`, bonuses[key].unprof)}
                  className="px-2 py-0.5 bg-surface-alt border border-border-light rounded hover:bg-surface transition-colors font-mono text-sm text-text-muted"
                  title={`Roll ${key} (unproficient)`}
                >
                  {formatBonus(bonuses[key].unprof)}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Weapons Section - displays equipped weapons with attack/damage rolls
function WeaponsSection({
  character,
  martialProf,
  onRollAttack,
  onRollDamage,
}: {
  character: Character;
  martialProf: number;
  onRollAttack?: (name: string, bonus: number) => void;
  onRollDamage?: (damageStr: string, bonus: number) => void;
}) {
  const formatBonus = (val: number) => val >= 0 ? `+${val}` : `${val}`;
  const abilities = character.abilities || {};
  
  // Get equipped weapons from character equipment
  const weapons = (character.equipment?.weapons || []) as Item[];
  const equippedWeapons = weapons.filter(w => w.equipped);
  
  // Calculate bonuses for attack
  const strBonus = (abilities.strength ?? 0) + martialProf;
  const agiBonus = (abilities.agility ?? 0) + martialProf;
  const acuBonus = (abilities.acuity ?? 0) + martialProf;
  
  // Unproficient unarmed: strength only (or double negative)
  const str = abilities.strength ?? 0;
  const unprofBonus = str < 0 ? str * 2 : Math.ceil(str / 2);
  const unarmedDamage = Math.max(1, Math.ceil(str / 2));

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
            
            // Build damage string
            let damageStr = '-';
            if (weapon.damage) {
              if (Array.isArray(weapon.damage)) {
                damageStr = weapon.damage
                  .filter((d: { amount?: number; size?: number; type?: string }) => d && d.amount && d.size)
                  .map((d: { amount?: number; size?: number; type?: string }) => `${d.amount}d${d.size}${d.type && d.type !== 'none' ? ` ${d.type}` : ''}`)
                  .join(', ') || '-';
              } else {
                damageStr = String(weapon.damage);
              }
            }
            
            // Show non-excluded properties below
            const excludedProps = ['Damage Reduction', 'Split Damage Dice', 'Range', 'Shield Base', 'Armor Base', 'Weapon Damage'];
            const displayProps = props.filter(p => p && !excludedProps.includes(p));
            
            return (
              <tr key={weapon.id || idx} className="border-b border-border-subtle last:border-0">
                <td className="py-1 font-medium text-text-secondary">
                  {weapon.name}
                  {displayProps.length > 0 && (
                    <div className="text-xs text-text-muted font-normal">
                      {displayProps.map(p => `• ${p}`).join(' ')}
                    </div>
                  )}
                </td>
                <td className="text-center py-1">
                  <button
                    onClick={() => onRollAttack?.(weapon.name || 'Attack', attackBonus)}
                    className="px-2 py-0.5 bg-gradient-to-b from-blue-500 to-blue-600 text-white rounded hover:from-blue-600 hover:to-blue-700 transition-colors font-mono text-sm shadow-sm"
                  >
                    {formatBonus(attackBonus)}
                  </button>
                </td>
                <td className="text-center py-1">
                  <button
                    onClick={() => onRollDamage?.(damageStr, attackBonus)}
                    className="px-2 py-0.5 bg-gradient-to-b from-red-500 to-red-600 text-white rounded hover:from-red-600 hover:to-red-700 transition-colors font-mono text-sm shadow-sm"
                  >
                    {damageStr}
                  </button>
                </td>
                <td className="text-center py-1 text-text-muted">
                  {weapon.range || 'Melee'}
                </td>
              </tr>
            );
          })}
          {/* Unarmed Prowess - always shown */}
          <tr className="border-t border-border-light">
            <td className="py-1 font-medium text-text-muted italic">Unarmed Prowess</td>
            <td className="text-center py-1">
              <button
                onClick={() => onRollAttack?.('Unarmed Prowess', unprofBonus)}
                className="px-2 py-0.5 bg-surface text-text-secondary rounded hover:bg-surface-alt transition-colors font-mono text-sm"
              >
                {formatBonus(unprofBonus)}
              </button>
            </td>
            <td className="text-center py-1">
              <button
                onClick={() => onRollDamage?.(`${unarmedDamage} Bludgeoning`, unprofBonus)}
                className="px-2 py-0.5 bg-surface text-text-secondary rounded hover:bg-surface-alt transition-colors font-mono text-sm"
              >
                {unarmedDamage} Bludg.
              </button>
            </td>
            <td className="text-center py-1 text-text-muted">Melee</td>
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
}: ArchetypeSectionProps) {
  const martialProf = character.mart_prof ?? character.martialProficiency ?? 0;
  const powerProf = character.pow_prof ?? character.powerProficiency ?? 0;
  const rollContext = useRollsOptional();
  
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
            title={
              getEditState() === 'has-points' 
                ? 'You have proficiency points to spend' 
                : getEditState() === 'over-budget'
                ? 'Over budget - remove proficiency points'
                : 'Editing archetype'
            }
          />
        </div>
      )}
      
      {/* Archetype Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary">
          {getArchetypeTitle()}
        </h2>
        {character.archetype?.name && (
          <p className="text-sm text-text-muted mt-0.5">
            {character.archetype.name}
          </p>
        )}
      </div>

      {/* Proficiencies */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <ProficiencyMeter 
          label="Martial" 
          value={martialProf}
          color="red"
          isEditMode={isEditMode}
          onIncrease={() => onMartialProfChange?.(martialProf + 1)}
          onDecrease={() => onMartialProfChange?.(martialProf - 1)}
        />
        <ProficiencyMeter 
          label="Power" 
          value={powerProf}
          color="purple"
          isEditMode={isEditMode}
          onIncrease={() => onPowerProfChange?.(powerProf + 1)}
          onDecrease={() => onPowerProfChange?.(powerProf - 1)}
        />
      </div>
      
      {/* Proficiency Points Display - three-state coloring */}
      {isEditMode && (
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
                  {isEditMode && onMilestoneChoiceChange ? (
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
      
      {/* Attack Bonuses Table */}
      {character.abilities && (
        <AttackBonusesTable
          abilities={character.abilities}
          martialProf={martialProf}
          powerProf={powerProf}
          onRollBonus={handleRollBonus}
        />
      )}

      {/* Weapons Section */}
      <WeaponsSection
        character={character}
        martialProf={martialProf}
        onRollAttack={handleRollBonus}
        onRollDamage={handleRollDamage}
      />

      {/* Armor Section */}
      <ArmorSection character={character} />
    </div>
  );
}
