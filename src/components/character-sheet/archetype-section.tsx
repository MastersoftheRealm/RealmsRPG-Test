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
import { EditSectionToggle, RollButton, SectionHeader, PoweredMartialSlider, DecrementButton, IncrementButton } from '@/components/shared';
import type { Character, Abilities, Item } from '@/types';
import type { EnrichedItem } from '@/lib/data-enrichment';

interface ArchetypeSectionProps {
  character: Character;
  isEditMode?: boolean;
  onMartialProfChange?: (value: number) => void;
  onPowerProfChange?: (value: number) => void;
  onMilestoneChoiceChange?: (level: number, choice: 'innate' | 'feat') => void;
  // Unarmed Prowess props
  unarmedProwess?: number; // 0 = not selected, 1-5 = prowess level
  onUnarmedProwessChange?: (level: number) => void;
  // Enriched equipment (from codex/library) — used instead of raw character.equipment
  enrichedWeapons?: EnrichedItem[];
  enrichedShields?: EnrichedItem[];
  enrichedArmor?: EnrichedItem[];
  className?: string;
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

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <SectionHeader title="Attack Bonuses" className="mb-2" />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted">
            <th className="text-left py-1"></th>
            <th className="text-center py-1">Prof.</th>
            <th className="text-center py-1">Unprof.</th>
          </tr>
        </thead>
        <tbody>
          {/* Martial rows - always show for unproficient attacks */}
          {(['strength', 'agility', 'acuity'] as const).map((key) => (
            <tr key={key}>
              <td className="py-1 font-medium text-text-secondary capitalize">⚔️ {key}</td>
              <td className="text-center py-1">
                {onRollBonus ? (
                  <RollButton
                    value={martialBonuses[key].prof}
                    onClick={() => onRollBonus(`${key.charAt(0).toUpperCase() + key.slice(1)} Attack`, martialBonuses[key].prof)}
                    size="sm"
                    title={`Roll ${key} (proficient)`}
                  />
                ) : (
                  <span className="text-sm font-medium text-text-muted">{martialBonuses[key].prof >= 0 ? '+' : ''}{martialBonuses[key].prof}</span>
                )}
              </td>
              <td className="text-center py-1">
                {onRollBonus ? (
                  <RollButton
                    value={martialBonuses[key].unprof}
                    variant="unproficient"
                    onClick={() => onRollBonus(`${key.charAt(0).toUpperCase() + key.slice(1)} Attack`, martialBonuses[key].unprof)}
                    size="sm"
                    title={`Roll ${key} (unproficient)`}
                  />
                ) : (
                  <span className="text-sm font-medium text-text-muted">{martialBonuses[key].unprof >= 0 ? '+' : ''}{martialBonuses[key].unprof}</span>
                )}
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
            {onRollBonus ? (
              <RollButton
                value={powerBonus.prof}
                onClick={() => onRollBonus(`${powAbilDisplayName} Attack`, powerBonus.prof)}
                size="sm"
                title={`Roll power attack - ${powAbilDisplayName}`}
              />
            ) : (
              <span className="text-sm font-medium text-text-muted">{powerBonus.prof >= 0 ? '+' : ''}{powerBonus.prof}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Unarmed Prowess damage: proficient = Ability + Martial Proficiency + dice (dice only at prowess 2+)
// Level 1: full Attack Bonus (no dice). Level 2+: dice + Attack Bonus.
const UNARMED_PROWESS_DAMAGE: { level: number; damage: string | null }[] = [
  { level: 0, damage: null },     // Unproficient - half ability, no bonus
  { level: 1, damage: null },     // Prowess I — damage = Attack Bonus (no dice)
  { level: 2, damage: '1d2' },   // Prowess II (Lv 4)
  { level: 3, damage: '1d4' },   // Prowess III (Lv 8)
  { level: 4, damage: '1d6' },   // Prowess IV (Lv 12)
  { level: 5, damage: '1d8' },   // Prowess V (Lv 16+)
];

// Weapons Section - displays equipped weapons with attack/damage rolls
function WeaponsSection({
  character,
  martialProf,
  unarmedProwess = 0,
  onRollAttack,
  onRollDamage,
  enrichedWeapons,
}: {
  character: Character;
  martialProf: number;
  unarmedProwess?: number;
  onRollAttack?: (name: string, bonus: number) => void;
  onRollDamage?: (damageStr: string, bonus: number) => void;
  enrichedWeapons?: EnrichedItem[];
}) {
  const abilities = character.abilities || {};
  
  // Use enriched weapons if available, fallback to raw character equipment
  const weapons = enrichedWeapons || (character.equipment?.weapons || []) as Item[];
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
  
  // Calculate unarmed damage: proficient = Attack Bonus (ability + martial prof) + dice at prowess 2+
  const prowessData = UNARMED_PROWESS_DAMAGE[unarmedProwess] || UNARMED_PROWESS_DAMAGE[0];
  const unarmedDamageDisplay = hasProwess 
    ? (prowessData.damage 
        ? `${prowessData.damage} + ${unarmedAttackBonus}` 
        : String(unarmedAttackBonus)) // Prowess I: full Attack Bonus, no dice
    : String(Math.max(1, Math.floor(unarmedAbility / 2)));

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <SectionHeader title="Weapons" className="mb-2" />
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
                  .filter((d: { amount?: number | string; size?: number | string; type?: string }) => d && d.amount && d.size)
                  .map((d: { amount?: number | string; size?: number | string; type?: string }) => ({
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
                  {onRollAttack ? (
                    <RollButton
                      value={attackBonus}
                      onClick={() => onRollAttack(weapon.name || 'Attack', attackBonus)}
                      size="sm"
                      title={`Roll attack with ${weapon.name}`}
                    />
                  ) : (
                    <span className="text-sm font-medium text-text-muted">{attackBonus >= 0 ? '+' : ''}{attackBonus}</span>
                  )}
                </td>
                <td className="text-center py-2">
                  <div className="flex flex-col items-center gap-0.5">
                    {onRollDamage ? (
                      <RollButton
                        value={0}
                        displayValue={damageDice}
                        variant="danger"
                        onClick={() => onRollDamage(damageStr, attackBonus)}
                        size="sm"
                        title={`Roll ${damageStr} damage`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-text-muted">{damageDice}</span>
                    )}
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
              {onRollAttack ? (
                <RollButton
                  value={unarmedAttackBonus}
                  variant={hasProwess ? 'primary' : 'unproficient'}
                  onClick={() => onRollAttack('Unarmed Prowess', unarmedAttackBonus)}
                  size="sm"
                  title={`Roll unarmed attack (${hasProwess ? 'proficient' : 'unproficient'})`}
                />
              ) : (
                <span className="text-sm font-medium text-text-muted">{unarmedAttackBonus >= 0 ? '+' : ''}{unarmedAttackBonus}</span>
              )}
            </td>
            <td className="text-center py-2">
              <div className="flex flex-col items-center gap-0.5">
                {onRollDamage ? (
                  <RollButton
                    value={0}
                    displayValue={unarmedDamageDisplay}
                    variant={hasProwess ? 'danger' : 'unproficient'}
                    onClick={() => {
                      // Roll expects dice pattern; at prowess 1 damage is Attack Bonus only (no dice)
                      const rollStr = hasProwess && !prowessData.damage
                        ? `0d4 Bludgeoning`
                        : `${unarmedDamageDisplay} Bludgeoning`;
                      onRollDamage(rollStr, unarmedAttackBonus);
                    }}
                    size="sm"
                    title="Roll unarmed damage"
                  />
                ) : (
                  <span className="text-sm font-medium text-text-muted">{unarmedDamageDisplay}</span>
                )}
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

// Shields Section - displays equipped shields: Name, Block, Damage, Attack (same horizontal layout as weapons)
function ShieldsSection({
  character,
  martialProf,
  onRollAttack,
  onRollDamage,
  enrichedShields,
}: {
  character: Character;
  martialProf: number;
  onRollAttack?: (name: string, bonus: number) => void;
  onRollDamage?: (damageStr: string, bonus: number) => void;
  enrichedShields?: EnrichedItem[];
}) {
  const abilities = character.abilities || {};
  const strBonus = (abilities.strength ?? 0) + martialProf;

  const shields = enrichedShields || (character.equipment?.shields || []) as Item[];
  const equippedShields = shields.filter(s => s.equipped);

  if (equippedShields.length === 0) {
    return (
      <div className="bg-surface-alt rounded-lg p-3 mb-4">
        <SectionHeader title="Shields" className="mb-2" />
        <p className="text-sm text-text-muted italic text-center py-2">No shield equipped</p>
      </div>
    );
  }

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <SectionHeader title="Shields" className="mb-2" />
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-text-muted">
            <th className="text-left py-1">Name</th>
            <th className="text-center py-1">Block</th>
            <th className="text-center py-1">Damage</th>
            <th className="text-center py-1">Attack</th>
          </tr>
        </thead>
        <tbody>
          {equippedShields.map((shield, idx) => {
            const enriched = shield as EnrichedItem & { shieldAmount?: string; shieldDamage?: string | null };
            const blockStr = enriched.shieldAmount ?? '-';
            const damageStr = enriched.shieldDamage ?? (shield.damage ? String(shield.damage) : '-');
            const hasDamage = damageStr !== '-';
            const attackBonus = strBonus; // Shields used as weapon typically use Strength
            // All shield damage is bludgeoning for display/roll
            const damageRollStr = hasDamage ? (damageStr.includes('Bludgeoning') ? damageStr : `${damageStr} Bludgeoning`) : '';

            // Properties below name (same style as weapons) — exclude mechanical ones
            const excludedProps = ['Damage Reduction', 'Split Damage Dice', 'Range', 'Shield Base', 'Armor Base', 'Weapon Damage'];
            const props = (shield.properties || []).map(p => typeof p === 'string' ? p : (p as { name?: string }).name || '');
            const displayProps = props.filter(p => p && !excludedProps.includes(p));

            return (
              <tr key={shield.id || idx} className="border-b border-border-subtle last:border-0 align-top">
                <td className="py-2 font-medium text-text-secondary">
                  {shield.name}
                  {displayProps.length > 0 && (
                    <div className="text-xs text-text-muted font-normal">
                      {displayProps.map(p => `• ${p}`).join(' ')}
                    </div>
                  )}
                </td>
                <td className="text-center py-2">
                  {blockStr !== '-' ? (
                    onRollDamage ? (
                      <RollButton
                        value={0}
                        displayValue={blockStr}
                        variant="primary"
                        size="sm"
                        onClick={() => onRollDamage(blockStr + ' Bludgeoning', 0)}
                        title="Roll shield block amount"
                      />
                    ) : (
                      <span className="font-mono text-primary-600 dark:text-primary-400">{blockStr}</span>
                    )
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="text-center py-2">
                  {hasDamage ? (
                    onRollDamage ? (
                      <RollButton
                        value={0}
                        displayValue={damageStr}
                        variant="danger"
                        size="sm"
                        onClick={() => onRollDamage(damageRollStr, attackBonus)}
                        title={`Roll ${damageStr} damage (Bludgeoning)`}
                      />
                    ) : (
                      <span className="text-sm font-medium text-text-muted">{damageStr}</span>
                    )
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
                <td className="text-center py-2">
                  {hasDamage && onRollAttack ? (
                    <RollButton
                      value={attackBonus}
                      onClick={() => onRollAttack(shield.name || 'Shield bash', attackBonus)}
                      size="sm"
                      title={`Roll attack with ${shield.name}`}
                    />
                  ) : (
                    <span className="text-text-muted">-</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Armor Section - displays equipped armor with stats
function ArmorSection({
  character,
  enrichedArmor,
}: {
  character: Character;
  enrichedArmor?: EnrichedItem[];
}) {
  const abilities = character.abilities || {};
  const agility = abilities.agility ?? 0;
  const baseEvasion = 10 + agility;
  
  // Use enriched armor if available, fallback to raw character equipment
  const armor = enrichedArmor || (character.equipment?.armor || character.armor || []) as Item[];
  const armorArray = Array.isArray(armor) ? armor : [armor].filter(Boolean);
  const equippedArmor = armorArray.filter((a): a is Item => a !== null && a !== undefined && (a as Item).equipped === true);

  return (
    <div className="bg-surface-alt rounded-lg p-3 mb-4">
      <SectionHeader title="Armor" className="mb-2" />
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
              // DR = 1 (base) + 1 per op_1_lvl. Prefer enriched armorValue, else derive from properties.
              const armorWithVal = armorItem as { armorValue?: number; armor?: number };
              let damageReduction = armorWithVal.armorValue ?? armorWithVal.armor ?? 0;
              let critRangeBonus = 0;
              const abilityReqs: string[] = [];

              properties.forEach(prop => {
                if (!prop) return;
                const propName = typeof prop === 'string' ? prop : prop.name || '';
                const propValue = typeof prop === 'object' && 'value' in prop ? Number(prop.value) : 0;
                const op1Lvl = Number((typeof prop === 'object' && 'op_1_lvl' in prop ? (prop as any).op_1_lvl : propValue) || 0);

                if (propName === 'Damage Reduction' && damageReduction === 0) {
                  damageReduction = 1 + op1Lvl;
                }
                if (propName === 'Critical Range +1') critRangeBonus = 1 + op1Lvl;
                if (propName.includes('Strength Requirement')) abilityReqs.push(`STR ${1 + op1Lvl}`);
                if (propName.includes('Agility Requirement')) abilityReqs.push(`AGI ${1 + op1Lvl}`);
                if (propName.includes('Vitality Requirement')) abilityReqs.push(`VIT ${1 + op1Lvl}`);
              });
              
              // Critical Range is just baseEvasion + critRangeBonus (display the actual crit threshold)
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
  enrichedWeapons,
  enrichedShields,
  enrichedArmor,
  className,
}: ArchetypeSectionProps) {
  const martialProf = character.mart_prof ?? character.martialProficiency ?? 0;
  const powerProf = character.pow_prof ?? character.powerProficiency ?? 0;
  const rollContext = useRollsOptional();
  
  // Local state for whether this section is actively being edited
  const [isSectionEditing, setIsSectionEditing] = useState(false);
  // Editable max prof points (steppers below slider); when null, use level-derived value
  const [maxProfOverride, setMaxProfOverride] = useState<number | null>(null);
  
  // Derived state: is the section actually editable right now?
  const showEditControls = isEditMode && isSectionEditing;
  
  // Calculate proficiency points (effective max = override or level-based)
  const level = character.level || 1;
  const levelBasedMax = calculateProficiency(level);
  const totalProfPoints = maxProfOverride ?? levelBasedMax;
  const spentProfPoints = martialProf + powerProf;
  const remainingProfPoints = totalProfPoints - spentProfPoints;
  
  // Determine archetype type for milestone UI
  const archetypeType = getArchetypeType(martialProf, powerProf);
  const milestoneLevels = getArchetypeMilestoneLevels(level);
  const archetypeChoices = character.archetypeChoices || {};
  
  // Three-state color for proficiency points
  const getProfPointsColorClass = () => {
    if (remainingProfPoints > 0) return 'bg-success-100 text-success-700'; // Has points
    if (remainingProfPoints < 0) return 'bg-danger-100 text-danger-700'; // Over budget
    return 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'; // Perfect
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
    <div className={cn("bg-surface rounded-xl shadow-md p-4 md:p-6 relative", className)}>
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
      
      {/* Archetype Header - no subtext (Power/Martial implied) */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-text-primary">
          Archetype & Attacks
        </h2>
      </div>

      {/* Proficiencies - show slider only when editing; simple values otherwise */}
      {showEditControls ? (
        <>
          <div className="mb-4">
            <PoweredMartialSlider
              powerValue={powerProf}
              martialValue={martialProf}
              maxPoints={totalProfPoints}
              onChange={(power, martial) => {
                onPowerProfChange?.(power);
                onMartialProfChange?.(martial);
              }}
              compact
              allowZeroEnds
            />
          </div>
          {/* Proficiency Points Display - steppers change max only; three-state coloring for pencil */}
          <div className="mb-4 flex justify-center items-center gap-2">
            <DecrementButton
              onClick={() => setMaxProfOverride(prev => Math.max(0, (prev ?? levelBasedMax) - 1))}
              disabled={totalProfPoints <= 0}
              size="sm"
              title="Decrease max prof points"
            />
            <span className={cn('px-3 py-1 rounded-full text-sm font-medium', getProfPointsColorClass())}>
              {remainingProfPoints} / {totalProfPoints} prof. points
            </span>
            <IncrementButton
              onClick={() => setMaxProfOverride(prev => Math.min(12, (prev ?? levelBasedMax) + 1))}
              size="sm"
              title="Increase max prof points"
            />
          </div>
        </>
      ) : (martialProf > 0 || powerProf > 0) ? (
        <div className={cn('flex gap-3 mb-4', (martialProf > 0) !== (powerProf > 0) && martialProf + powerProf > 0 && 'flex-1')}>
          {powerProf > 0 && (
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-50 dark:bg-violet-900/20',
              martialProf === 0 && powerProf > 0 && 'flex-1'
            )}>
              <span className={cn(
                'font-semibold text-violet-600 dark:text-violet-300',
                martialProf === 0 ? 'text-base' : 'text-xs'
              )}>Power Prof.</span>
              <span className={cn(
                'font-bold text-violet-700 dark:text-violet-200',
                martialProf === 0 ? 'text-lg' : 'text-sm'
              )}>{powerProf}</span>
            </div>
          )}
          {martialProf > 0 && (
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg bg-martial-light dark:bg-martial-light',
              powerProf === 0 && martialProf > 0 && 'flex-1'
            )}>
              <span className={cn(
                'font-semibold text-martial-text dark:text-martial-border',
                powerProf === 0 ? 'text-base' : 'text-xs'
              )}>Martial Prof.</span>
              <span className={cn(
                'font-bold text-martial-dark dark:text-martial-border',
                powerProf === 0 ? 'text-lg' : 'text-sm'
              )}>{martialProf}</span>
            </div>
          )}
        </div>
      ) : null}
      
      {/* Mixed Archetype Milestone Choices */}
      {archetypeType === 'mixed' && milestoneLevels.length > 0 && (
        <div className="mb-4 p-3 bg-gradient-to-r from-warning-50 to-power-light border border-warning-200 rounded-lg">
          <SectionHeader title="Milestone Choices" className="mb-2" />
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
                            ? 'bg-violet-500 text-white'
                            : 'bg-violet-100 text-violet-600 hover:bg-violet-200'
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
                            ? 'bg-martial-dark text-white'
                            : 'bg-martial-light text-martial-text hover:bg-martial-border/30'
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
                        ? 'bg-violet-100 text-violet-700'
                        : currentChoice === 'feat'
                          ? 'bg-martial-light text-martial-dark'
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
            <div className="flex-1 bg-martial-light dark:bg-martial-light rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-martial-text dark:text-martial-border">Martial Potency</span>
              <span className="text-lg font-bold text-martial-dark" title="10 + Martial Prof + Martial Ability">
                {martialPotency}
              </span>
            </div>
          )}
          {powerProf > 0 && (
            <div className="flex-1 bg-violet-50 dark:bg-violet-900/30 rounded-lg px-3 py-2 flex items-center justify-between">
              <span className="text-sm font-medium text-violet-600 dark:text-violet-300">Power Potency</span>
              <span className="text-lg font-bold text-violet-700" title="10 + Power Prof + Power Ability">
                {powerPotency}
              </span>
            </div>
          )}
        </div>
      )}
      
      {/* Unarmed Prowess Display - show if character has unarmed prowess */}
      {/* Attack Bonuses Table */}
      {character.abilities && (
        <AttackBonusesTable
          abilities={character.abilities}
          martialProf={martialProf}
          powerProf={powerProf}
          powerAbility={character.pow_abil}
          onRollBonus={rollContext?.canRoll !== false ? handleRollBonus : undefined}
        />
      )}

      {/* Weapons Section */}
      <WeaponsSection
        character={character}
        martialProf={martialProf}
        unarmedProwess={unarmedProwess}
        onRollAttack={rollContext?.canRoll !== false ? handleRollBonus : undefined}
        onRollDamage={rollContext?.canRoll !== false ? handleRollDamage : undefined}
        enrichedWeapons={enrichedWeapons}
      />

      {/* Shields Section */}
      <ShieldsSection
        character={character}
        martialProf={martialProf}
        onRollAttack={rollContext?.canRoll !== false ? handleRollBonus : undefined}
        onRollDamage={rollContext?.canRoll !== false ? handleRollDamage : undefined}
        enrichedShields={enrichedShields}
      />

      {/* Armor Section */}
      <ArmorSection character={character} enrichedArmor={enrichedArmor} />
    </div>
  );
}
