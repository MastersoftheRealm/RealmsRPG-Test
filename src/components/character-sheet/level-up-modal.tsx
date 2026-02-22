/**
 * Level Up Modal
 * ===============
 * Modal for leveling up a character, showing gains and allowing allocation.
 */

'use client';

import { useState, useMemo } from 'react';
import { ArrowUp, Star, Heart, Zap, Shield, Sword, Plus, Check } from 'lucide-react';
import { Modal, Button } from '@/components/ui';
import {
  calculateAbilityPoints,
  calculateSkillPointsForEntity,
  calculateHealthEnergyPool,
  calculateProficiency,
  calculateTrainingPoints,
  calculateMaxArchetypeFeats,
  calculateMaxCharacterFeats,
} from '@/lib/game/formulas';
import type { Character, ArchetypeCategory } from '@/types';

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  onConfirm: (newLevel: number) => void;
}

interface ProgressionDelta {
  healthEnergy: number;
  abilityPoints: number;
  skillPoints: number;
  trainingPoints: number;
  proficiency: number;
  archetypeFeats: number;
  characterFeats: number;
}

function calculateLevelGains(
  currentLevel: number, 
  newLevel: number, 
  highestAbility: number = 0,
  archetypeType?: ArchetypeCategory
): ProgressionDelta {
  const currentHE = calculateHealthEnergyPool(currentLevel, 'PLAYER');
  const newHE = calculateHealthEnergyPool(newLevel, 'PLAYER');
  
  const currentAP = calculateAbilityPoints(currentLevel);
  const newAP = calculateAbilityPoints(newLevel);
  
  const currentSP = calculateSkillPointsForEntity(currentLevel, 'character');
  const newSP = calculateSkillPointsForEntity(newLevel, 'character');
  
  const currentTP = calculateTrainingPoints(currentLevel, highestAbility);
  const newTP = calculateTrainingPoints(newLevel, highestAbility);
  
  const currentProf = calculateProficiency(currentLevel);
  const newProf = calculateProficiency(newLevel);
  
  return {
    healthEnergy: newHE - currentHE,
    abilityPoints: newAP - currentAP,
    skillPoints: newSP - currentSP,
    trainingPoints: newTP - currentTP,
    proficiency: newProf - currentProf,
    archetypeFeats: calculateMaxArchetypeFeats(newLevel, archetypeType) - calculateMaxArchetypeFeats(currentLevel, archetypeType),
    characterFeats: calculateMaxCharacterFeats(newLevel) - calculateMaxCharacterFeats(currentLevel),
  };
}

export function LevelUpModal({
  isOpen,
  onClose,
  character,
  onConfirm,
}: LevelUpModalProps) {
  const [targetLevel, setTargetLevel] = useState((character.level || 1) + 1);
  
  const currentLevel = character.level || 1;
  const maxLevel = 20; // Max level cap
  
  // Calculate highest archetype ability for training points
  const highestAbility = useMemo(() => {
    const abilities = character.abilities || {};
    const archAbility = character.archetype?.ability?.toLowerCase();
    const martialAbility = character.mart_abil?.toLowerCase();
    const powerAbility = character.pow_abil?.toLowerCase();
    
    const relevantAbilities = [archAbility, martialAbility, powerAbility]
      .filter(Boolean)
      .map(a => abilities[a as keyof typeof abilities] || 0);
    
    return Math.max(...relevantAbilities, 0);
  }, [character]);
  
  // Calculate level gains
  const gains = useMemo(() => {
    const archType = (character.archetype?.type || 'power') as ArchetypeCategory;
    return calculateLevelGains(currentLevel, targetLevel, highestAbility, archType);
  }, [currentLevel, targetLevel, highestAbility, character]);
  
  // Get milestone info
  const getMilestones = () => {
    const milestones = [];
    
    // Check for ability point milestone (every 3 levels starting at 3)
    if (gains.abilityPoints > 0) {
      milestones.push(`+${gains.abilityPoints} Ability Point${gains.abilityPoints > 1 ? 's' : ''}`);
    }
    
    // Check for proficiency milestone (every 5 levels)
    if (gains.proficiency > 0) {
      milestones.push(`+${gains.proficiency} Proficiency`);
    }
    
    return milestones;
  };
  
  const handleConfirm = () => {
    onConfirm(targetLevel);
    onClose();
  };
  
  const milestones = getMilestones();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Level Up!" fullScreenOnMobile>
      <div className="space-y-6">
        {/* Level Selector */}
        <div className="text-center">
          <p className="text-text-secondary mb-2">
            {character.name} • Level {currentLevel}
          </p>
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => setTargetLevel(Math.max(currentLevel + 1, targetLevel - 1))}
              disabled={targetLevel <= currentLevel + 1}
              className="w-10 h-10 rounded-full bg-surface-alt text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              -
            </button>
            <div className="text-center">
              <div className="text-5xl font-bold text-primary-600">{targetLevel}</div>
              <div className="text-sm text-text-muted">New Level</div>
            </div>
            <button
              onClick={() => setTargetLevel(Math.min(maxLevel, targetLevel + 1))}
              disabled={targetLevel >= maxLevel}
              className="w-10 h-10 rounded-full bg-surface-alt text-text-secondary hover:bg-surface disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="bg-tp-light dark:bg-warning-900/30 border border-tp-border dark:border-warning-800/50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-tp-text dark:text-warning-200 font-medium mb-2">
              <Star className="w-5 h-5" />
              Milestone Bonuses!
            </div>
            <ul className="text-sm text-tp-text/90 dark:text-warning-300 space-y-1">
              {milestones.map((m, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-4 h-4" />
                  {m}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Gains Grid */}
        <div className="grid grid-cols-2 gap-3">
          <GainCard
            icon={<Heart className="w-5 h-5 text-danger-500" />}
            label="Health & Energy"
            value={`+${gains.healthEnergy}`}
            description="Hit points"
          />
          <GainCard
            icon={<Sword className="w-5 h-5 text-orange-500" />}
            label="Training Points"
            value={`+${gains.trainingPoints}`}
            description="For powers/techniques"
          />
          <GainCard
            icon={<Shield className="w-5 h-5 text-primary-500" />}
            label="Skill Points"
            value={`+${gains.skillPoints}`}
            description="For skills"
          />
          <GainCard
            icon={<Star className="w-5 h-5 text-power" />}
            label="Feats"
            value={`+${gains.archetypeFeats}`}
            description="Archetype & Character"
          />
        </div>
        
        {/* Confirm Button */}
        <div className="flex gap-3">
          <Button
            variant="secondary"
            className="flex-1"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleConfirm}
          >
            <ArrowUp className="w-5 h-5" />
            Level Up to {targetLevel}!
          </Button>
        </div>
      </div>
    </Modal>
  );
}

interface GainCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  description: string;
}

function GainCard({ icon, label, value, description }: GainCardProps) {
  return (
    <div className="bg-surface-alt dark:bg-[#21262d] rounded-lg p-3 border border-border-light dark:border-[#30363d]">
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-sm font-medium text-text-secondary">{label}</span>
      </div>
      <div className="text-2xl font-bold text-text-primary">{value}</div>
      <div className="text-xs text-text-muted">{description}</div>
    </div>
  );
}

export default LevelUpModal;
