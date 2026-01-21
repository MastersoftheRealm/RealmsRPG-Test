/**
 * Archetype Section
 * =================
 * Displays character archetype, proficiencies, attack bonuses, power potency, traits, and feats
 */

'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { calculateProficiency, getArchetypeType, getArchetypeMilestoneLevels } from '@/lib/game/formulas';
import { useRollsOptional } from './roll-context';
import { SpeciesTraitCard } from '@/components/shared/species-trait-card';
import type { Character, CharacterFeat, Abilities } from '@/types';

interface ArchetypeSectionProps {
  character: Character;
  isEditMode?: boolean;
  onFeatUsesChange?: (featId: string, delta: number) => void;
  onAddArchetypeFeat?: () => void;
  onAddCharacterFeat?: () => void;
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
        <span className="text-gray-600">{label}</span>
        <div className="flex items-center gap-1">
          {isEditMode && (
            <button
              onClick={onDecrease}
              disabled={value <= 0}
              className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold"
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
              className="w-5 h-5 rounded bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-xs font-bold"
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
              i < value ? colorClasses[color] : 'bg-gray-200'
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
    <div className="bg-gray-50 rounded-lg p-3 mb-4">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Attack Bonuses</h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500">
            <th className="text-left py-1"></th>
            <th className="text-center py-1">Prof.</th>
            <th className="text-center py-1">Unprof.</th>
          </tr>
        </thead>
        <tbody>
          {(['strength', 'agility', 'acuity', 'power'] as const).map((key) => (
            <tr key={key}>
              <td className="py-1 font-medium text-gray-700 capitalize">{key}</td>
              <td className="text-center py-1">
                <button
                  onClick={() => onRollBonus?.(`${key.charAt(0).toUpperCase() + key.slice(1)} (Prof.)`, bonuses[key].prof)}
                  className="px-2 py-0.5 bg-white border border-gray-300 rounded hover:bg-blue-50 hover:border-blue-300 transition-colors font-mono text-sm"
                  title={`Roll ${key} (proficient)`}
                >
                  {formatBonus(bonuses[key].prof)}
                </button>
              </td>
              <td className="text-center py-1">
                <button
                  onClick={() => onRollBonus?.(`${key.charAt(0).toUpperCase() + key.slice(1)} (Unprof.)`, bonuses[key].unprof)}
                  className="px-2 py-0.5 bg-gray-100 border border-gray-200 rounded hover:bg-gray-200 transition-colors font-mono text-sm text-gray-600"
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

function FeatCard({ 
  feat, 
  onUsesChange 
}: { 
  feat: CharacterFeat; 
  onUsesChange?: (delta: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const currentUses = feat.currentUses ?? feat.maxUses ?? 0;
  const hasUsesRemaining = feat.maxUses && currentUses > 0;
  const canIncrement = feat.maxUses && currentUses < feat.maxUses;

  const handleUsesChange = (e: React.MouseEvent, delta: number) => {
    e.stopPropagation();
    onUsesChange?.(delta);
  };

  return (
    <div 
      className={cn(
        'border border-gray-200 rounded-lg overflow-hidden transition-all',
        expanded && 'shadow-md'
      )}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 bg-white hover:bg-gray-50 text-left"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-800">{feat.name}</span>
          {feat.type && (
            <span className={cn(
              'text-xs px-1.5 py-0.5 rounded',
              feat.type === 'archetype' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
            )}>
              {feat.type}
            </span>
          )}
        </div>
        {/* Uses +/- controls (always visible when feat has maxUses) */}
        {feat.maxUses && (
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={(e) => handleUsesChange(e, -1)}
              disabled={!hasUsesRemaining}
              className={cn(
                'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                hasUsesRemaining
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
              title="Use ability"
            >
              −
            </button>
            <span className={cn(
              'text-sm font-medium min-w-[3rem] text-center',
              hasUsesRemaining ? 'text-green-600' : 'text-gray-400'
            )}>
              {currentUses}/{feat.maxUses}
            </span>
            <button
              onClick={(e) => handleUsesChange(e, 1)}
              disabled={!canIncrement}
              className={cn(
                'w-6 h-6 rounded flex items-center justify-center text-sm font-bold transition-colors',
                canIncrement
                  ? 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              )}
              title="Recover use"
            >
              +
            </button>
          </div>
        )}
      </button>

      {expanded && (
        <div className="px-3 py-2 bg-gray-50 border-t border-gray-100">
          <p className="text-sm text-gray-600 mb-2">
            {feat.description || 'No description available.'}
          </p>
          
          {/* Recovery period display */}
          {feat.maxUses && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Recovery:</span> {feat.recovery || 'Full Recovery'}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function ArchetypeSection({
  character,
  isEditMode = false,
  onFeatUsesChange,
  onAddArchetypeFeat,
  onAddCharacterFeat,
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
  const powAbilValue = character.abilities?.[powAbilName as keyof Abilities] ?? 0;
  const powerPotency = 10 + powerProf + powAbilValue;
  
  // Combine archetype and character feats
  const allFeats = [
    ...(character.archetypeFeats || []).map(f => ({ ...f, type: 'archetype' as const })),
    ...(character.feats || []).map(f => ({ ...f, type: 'character' as const })),
  ];
  
  // Handle attack bonus roll
  const handleRollBonus = (name: string, bonus: number) => {
    rollContext?.rollAttack(name, bonus);
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4 md:p-6">
      {/* Archetype Header */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800">
          {character.archetype?.name || 'No Archetype'}
        </h2>
        {character.archetype?.description && (
          <p className="text-sm text-gray-500 mt-1">
            {character.archetype.description}
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
          <h4 className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">
            Milestone Choices
          </h4>
          <div className="flex flex-wrap gap-2">
            {milestoneLevels.map((milestoneLevel) => {
              const currentChoice = archetypeChoices[milestoneLevel];
              return (
                <div key={milestoneLevel} className="flex items-center gap-1">
                  <span className="text-xs text-gray-500 min-w-[32px]">Lv.{milestoneLevel}:</span>
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
                          : 'bg-gray-100 text-gray-500 italic'
                    )}>
                      {currentChoice === 'innate' ? '✨ Innate' : 
                       currentChoice === 'feat' ? '🎯 Feat' : 'Not chosen'}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-gray-400 mt-2">
            Mixed archetypes choose at levels 4, 7, 10, etc.: +1 Innate (Threshold & Pools) OR +1 Bonus Feat
          </p>
        </div>
      )}
      
      {/* Power Potency */}
      <div className="bg-purple-50 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-purple-700">Power Potency</span>
        <span className="text-xl font-bold text-purple-800" title="10 + Power Prof + Power Ability">
          {powerPotency}
        </span>
      </div>
      
      {/* Attack Bonuses Table */}
      {character.abilities && (
        <AttackBonusesTable
          abilities={character.abilities}
          martialProf={martialProf}
          powerProf={powerProf}
          onRollBonus={handleRollBonus}
        />
      )}

      {/* Abilities used */}
      <div className="flex flex-wrap gap-2 mb-4">
        {character.mart_abil && (
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm">
            Martial: {character.mart_abil}
          </span>
        )}
        {character.pow_abil && (
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
            Power: {character.pow_abil}
          </span>
        )}
      </div>

      {/* Traits Section */}
      {(character.ancestry?.selectedTraits?.length || 
        character.ancestry?.selectedFlaw || 
        character.ancestry?.selectedCharacteristic) && (
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
            Traits
          </h3>
          <div className="space-y-2">
            {/* Ancestry Traits */}
            {character.ancestry?.selectedTraits?.map((traitName, index) => (
              <SpeciesTraitCard
                key={`ancestry-${index}`}
                trait={{ name: traitName }}
                category="ancestry"
                compact
              />
            ))}
            
            {/* Flaw */}
            {character.ancestry?.selectedFlaw && (
              <SpeciesTraitCard
                trait={{ name: character.ancestry.selectedFlaw }}
                category="flaw"
                compact
              />
            )}
            
            {/* Characteristic */}
            {character.ancestry?.selectedCharacteristic && (
              <SpeciesTraitCard
                trait={{ name: character.ancestry.selectedCharacteristic }}
                category="characteristic"
                compact
              />
            )}
          </div>
        </div>
      )}

      {/* Feats */}
      <div className="border-t border-gray-200 pt-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
            Feats ({allFeats.length})
          </h3>
          {isEditMode && (
            <div className="flex gap-2">
              <button
                onClick={onAddArchetypeFeat}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Archetype
              </button>
              <button
                onClick={onAddCharacterFeat}
                className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                <Plus className="w-3 h-3" />
                Character
              </button>
            </div>
          )}
        </div>
        
        {allFeats.length > 0 ? (
          <div className="space-y-2">
            {allFeats.map((feat, index) => (
              <FeatCard
                key={feat.id || index}
                feat={feat}
                onUsesChange={(delta) => onFeatUsesChange?.(String(feat.id), delta)}
              />
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-sm italic">No feats selected</p>
        )}
      </div>
    </div>
  );
}
