/**
 * Finalize Step
 * =============
 * Final character details and save
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';
import { useAuth } from '@/hooks';
import { cn } from '@/lib/utils';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { calculateAbilityPoints, calculateSkillPoints, calculateTrainingPoints, getBaseHealth, getBaseEnergy } from '@/lib/game/formulas';
import { LoginPromptModal } from '@/components/shared';

// Health-Energy pool for new characters (18 at level 1, +2 per level)
const BASE_HE_POOL = 18;

interface ValidationIssue {
  emoji: string;
  message: string;
  severity: 'error' | 'warning';
}

function ValidationModal({ 
  isOpen, 
  onClose, 
  issues, 
  onContinueAnyway 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  issues: ValidationIssue[];
  onContinueAnyway?: () => void;
}) {
  if (!isOpen) return null;
  
  const hasErrors = issues.some(i => i.severity === 'error');
  const isValid = issues.length === 0;
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className={cn(
          'p-4 border-b flex items-center gap-3',
          isValid ? 'bg-green-50' : hasErrors ? 'bg-red-50' : 'bg-amber-50'
        )}>
          <span className="text-2xl">{isValid ? '✅' : hasErrors ? '⚠️' : '📋'}</span>
          <h2 className="text-xl font-bold">
            {isValid ? 'Character Ready!' : hasErrors ? 'Issues Found' : 'Review Needed'}
          </h2>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[50vh]">
          {isValid ? (
            <p className="text-gray-600 text-center py-8">
              Your character is complete and ready for adventure! Click &quot;Create Character&quot; to save.
            </p>
          ) : (
            <div className="space-y-3">
              {issues.map((issue, idx) => (
                <div 
                  key={idx} 
                  className={cn(
                    'p-3 rounded-lg flex gap-3',
                    issue.severity === 'error' ? 'bg-red-50' : 'bg-amber-50'
                  )}
                >
                  <span className="text-xl flex-shrink-0">{issue.emoji}</span>
                  <p className="text-gray-700">{issue.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="p-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            {isValid ? 'Close' : 'Go Back & Fix'}
          </button>
          {!hasErrors && !isValid && onContinueAnyway && (
            <button
              onClick={onContinueAnyway}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
            >
              Continue Anyway
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function HealthEnergyAllocation() {
  const { draft, updateDraft } = useCharacterCreatorStore();
  
  // Calculate base values
  const abilities = draft.abilities || {};
  const archetype = { 
    type: draft.archetype?.type, 
    pow_abil: draft.pow_abil, 
    mart_abil: draft.mart_abil 
  };
  const baseHealth = getBaseHealth(archetype, abilities);
  const baseEnergy = getBaseEnergy(archetype, abilities);
  
  // HE pool is 18 at level 1, +2 per level
  const level = draft.level || 1;
  const hePool = BASE_HE_POOL + (level - 1) * 2;
  
  // Current allocations (stored as absolute values, subtract base to get allocation)
  const currentHealth = draft.healthPoints || baseHealth;
  const currentEnergy = draft.energyPoints || baseEnergy;
  
  // How many points above base have been allocated
  const healthAllocation = currentHealth - baseHealth;
  const energyAllocation = currentEnergy - baseEnergy;
  const usedHEPoints = healthAllocation + energyAllocation;
  const remainingHEPoints = hePool - usedHEPoints;
  
  const handleHealthChange = (delta: number) => {
    const newHealth = currentHealth + delta;
    if (newHealth < baseHealth) return; // Can't go below base
    if (delta > 0 && remainingHEPoints <= 0) return; // No points left
    
    updateDraft({ healthPoints: newHealth });
  };
  
  const handleEnergyChange = (delta: number) => {
    const newEnergy = currentEnergy + delta;
    if (newEnergy < baseEnergy) return; // Can't go below base
    if (delta > 0 && remainingHEPoints <= 0) return; // No points left
    
    updateDraft({ energyPoints: newEnergy });
  };
  
  return (
    <div className="bg-gradient-to-br from-rose-50 to-violet-50 rounded-xl p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Health & Energy</h3>
        <span className={cn(
          'px-3 py-1 rounded-full text-sm font-medium',
          remainingHEPoints > 0 ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'
        )}>
          {remainingHEPoints} points remaining
        </span>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Allocate your {hePool} Health-Energy points. Base values come from your abilities.
      </p>
      
      <div className="grid grid-cols-2 gap-6">
        {/* Health */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">❤️</span>
            <span className="font-medium text-gray-900">Health</span>
          </div>
          <div className="text-xs text-gray-500 mb-3">Base: {baseHealth}</div>
          
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleHealthChange(-1)}
              disabled={currentHealth <= baseHealth}
              className="btn-stepper btn-stepper-danger !w-8 !h-8"
            >
              −
            </button>
            <span className="text-2xl font-bold text-rose-600 w-12 text-center">
              {currentHealth}
            </span>
            <button
              onClick={() => handleHealthChange(1)}
              disabled={remainingHEPoints <= 0}
              className="btn-stepper btn-stepper-success !w-8 !h-8"
            >
              +
            </button>
          </div>
          
          {healthAllocation > 0 && (
            <div className="text-xs text-center text-gray-500 mt-2">
              +{healthAllocation} allocated
            </div>
          )}
        </div>
        
        {/* Energy */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">⚡</span>
            <span className="font-medium text-gray-900">Energy</span>
          </div>
          <div className="text-xs text-gray-500 mb-3">Base: {baseEnergy}</div>
          
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => handleEnergyChange(-1)}
              disabled={currentEnergy <= baseEnergy}
              className="btn-stepper btn-stepper-danger !w-8 !h-8"
            >
              −
            </button>
            <span className="text-2xl font-bold text-violet-600 w-12 text-center">
              {currentEnergy}
            </span>
            <button
              onClick={() => handleEnergyChange(1)}
              disabled={remainingHEPoints <= 0}
              className="btn-stepper btn-stepper-success !w-8 !h-8"
            >
              +
            </button>
          </div>
          
          {energyAllocation > 0 && (
            <div className="text-xs text-center text-gray-500 mt-2">
              +{energyAllocation} allocated
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function FinalizeStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { draft, updateDraft, getCharacter, resetCreator, prevStep } = useCharacterCreatorStore();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Calculate validation issues
  const validationIssues = useMemo(() => {
    const issues: ValidationIssue[] = [];
    const level = draft.level || 1;
    
    // 1. Name validation
    if (!draft.name?.trim()) {
      issues.push({
        emoji: '📝',
        message: "Your hero needs a name! Give them something legendary.",
        severity: 'error'
      });
    }
    
    // 2. Archetype validation
    if (!draft.archetype?.type) {
      issues.push({
        emoji: '🎭',
        message: "You haven't selected an archetype yet! Head back to the Archetype tab.",
        severity: 'error'
      });
    }
    
    // 3. Species validation
    if (!draft.ancestry?.id) {
      issues.push({
        emoji: '🌟',
        message: "You need to choose your species! Head to the Species tab.",
        severity: 'error'
      });
    }
    
    // 4. Ability points - Simple sum like vanilla site (7 - sum of all values)
    const maxAbilityPoints = calculateAbilityPoints(level);
    const usedAbilityPoints = draft.abilities 
      ? Object.values(draft.abilities).reduce((sum, val) => sum + (val || 0), 0)
      : 0;
    const remainingAbilityPoints = maxAbilityPoints - usedAbilityPoints;
    
    if (remainingAbilityPoints > 0) {
      issues.push({
        emoji: '⚡',
        message: `You still have ${remainingAbilityPoints} ability point${remainingAbilityPoints === 1 ? '' : 's'} to spend!`,
        severity: 'warning'
      });
    } else if (remainingAbilityPoints < 0) {
      issues.push({
        emoji: '⚡',
        message: `You've overspent ability points by ${Math.abs(remainingAbilityPoints)}!`,
        severity: 'error'
      });
    }
    
    // 5. Skill points
    const maxSkillPoints = calculateSkillPoints(level);
    const usedSkillPoints = draft.skills
      ? Object.values(draft.skills).reduce((sum, val) => sum + (val || 0), 0)
      : 0;
    const defenseSkillPoints = draft.defenseSkills
      ? Object.values(draft.defenseSkills).reduce((sum, val) => sum + ((val || 0) * 2), 0)
      : 0;
    const totalUsedSkillPoints = usedSkillPoints + defenseSkillPoints;
    const remainingSkillPoints = maxSkillPoints - totalUsedSkillPoints;
    
    if (remainingSkillPoints > 0) {
      issues.push({
        emoji: '📚',
        message: `You have ${remainingSkillPoints} skill point${remainingSkillPoints === 1 ? '' : 's'} left to spend!`,
        severity: 'warning'
      });
    } else if (remainingSkillPoints < 0) {
      issues.push({
        emoji: '📚',
        message: `You've overspent skill points by ${Math.abs(remainingSkillPoints)}!`,
        severity: 'error'
      });
    }
    
    // 6. Health/Energy points - base HE pool is 18 at level 1 (+2 per level)
    const abilities = draft.abilities || {};
    const archetype = { 
      type: draft.archetype?.type, 
      pow_abil: draft.pow_abil, 
      mart_abil: draft.mart_abil 
    };
    const baseHealth = getBaseHealth(archetype, abilities);
    const baseEnergy = getBaseEnergy(archetype, abilities);
    const hePool = BASE_HE_POOL + (level - 1) * 2;
    
    const healthAllocation = (draft.healthPoints || 0) - baseHealth;
    const energyAllocation = (draft.energyPoints || 0) - baseEnergy;
    const usedHEPoints = Math.max(0, healthAllocation) + Math.max(0, energyAllocation);
    const remainingHEPoints = hePool - usedHEPoints;
    
    if (remainingHEPoints > 0) {
      issues.push({
        emoji: '❤️',
        message: `You have ${remainingHEPoints} Health-Energy point${remainingHEPoints === 1 ? '' : 's'} to allocate!`,
        severity: 'warning'
      });
    }
    
    // 7. Training points - calculate from equipment and powers
    const highestAbility = draft.abilities 
      ? Math.max(...Object.values(draft.abilities).filter(v => typeof v === 'number'))
      : 0;
    const trainingPoints = calculateTrainingPoints(level, highestAbility);
    const equipmentTP = draft.trainingPointsSpent || 0;
    const remainingTP = trainingPoints - equipmentTP;
    
    if (remainingTP < 0) {
      issues.push({
        emoji: '🎯',
        message: `You've overspent training points by ${Math.abs(remainingTP)}!`,
        severity: 'error'
      });
    }
    
    // 8. Currency - calculate from equipment costs
    const baseCurrency = 200;
    const spentCurrency = (draft.equipment?.items || []).reduce((sum, item) => sum + (item.cost || 0), 0);
    if (spentCurrency > baseCurrency) {
      issues.push({
        emoji: '💰',
        message: `You've overspent currency by ${spentCurrency - baseCurrency}c!`,
        severity: 'error'
      });
    }
    
    // 9. Archetype feats - stored in draft.feats with type: 'archetype'
    const archetypeType = draft.archetype?.type;
    const allFeats = draft.feats || [];
    const archetypeFeats = allFeats.filter(f => f.type === 'archetype');
    const characterFeats = allFeats.filter(f => f.type === 'character');
    
    let expectedArchetypeFeatCount = 0;
    if (archetypeType === 'power') expectedArchetypeFeatCount = 1;
    else if (archetypeType === 'powered-martial') expectedArchetypeFeatCount = 2;
    else if (archetypeType === 'martial') expectedArchetypeFeatCount = 3;
    
    if (archetypeFeats.length < expectedArchetypeFeatCount) {
      const diff = expectedArchetypeFeatCount - archetypeFeats.length;
      issues.push({
        emoji: '💪',
        message: `You need to select ${diff} more archetype feat${diff === 1 ? '' : 's'}!`,
        severity: 'warning'
      });
    }
    
    // 10. Character feat
    if (characterFeats.length < 1) {
      issues.push({
        emoji: '🌠',
        message: "You need to select a character feat!",
        severity: 'warning'
      });
    }
    
    return issues;
  }, [draft]);
  
  const handleValidateAndSave = () => {
    setShowValidation(true);
  };
  
  const handleSave = async () => {
    if (!user) {
      // Show login prompt modal instead of error
      setShowLoginPrompt(true);
      return;
    }
    
    if (!draft.name?.trim()) {
      setError('Please enter a character name');
      return;
    }
    
    try {
      setSaving(true);
      setError(null);
      setShowValidation(false);
      
      const characterData = getCharacter();
      
      const docRef = await addDoc(
        collection(db, 'users', user.uid, 'character'),
        {
          ...characterData,
          userId: user.uid,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );
      
      // Clear the creator store
      resetCreator();
      
      // Navigate to the new character
      router.push(`/characters/${docRef.id}`);
    } catch (err) {
      console.error('Error saving character:', err);
      setError('Failed to save character. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Finalize Your Character</h1>
      <p className="text-gray-600 mb-6">
        Add the final details to bring your character to life.
      </p>
      
      {/* Character Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Character Name *
        </label>
        <input
          type="text"
          value={draft.name || ''}
          onChange={(e) => updateDraft({ name: e.target.value })}
          placeholder="Enter your character's name"
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
        />
      </div>
      
      {/* Character Summary */}
      <div className="bg-gray-50 rounded-xl p-6 mb-6">
        <h3 className="font-bold text-gray-900 mb-4">Character Summary</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Level:</span>
            <span className="ml-2 font-medium">{draft.level || 1}</span>
          </div>
          
          <div>
            <span className="text-gray-500">Archetype:</span>
            <span className="ml-2 font-medium">
              {draft.archetype?.type 
                ? draft.archetype.type.charAt(0).toUpperCase() + draft.archetype.type.slice(1)
                : 'Not selected'}
            </span>
          </div>
          
          <div>
            <span className="text-gray-500">Species:</span>
            <span className="ml-2 font-medium">{draft.ancestry?.name || 'Not selected'}</span>
          </div>
          
          {draft.pow_abil && (
            <div>
              <span className="text-gray-500">Power Ability:</span>
              <span className="ml-2 font-medium capitalize">{draft.pow_abil}</span>
            </div>
          )}
          
          {draft.mart_abil && (
            <div>
              <span className="text-gray-500">Martial Ability:</span>
              <span className="ml-2 font-medium capitalize">{draft.mart_abil}</span>
            </div>
          )}
        </div>
        
        {/* Abilities Summary */}
        {draft.abilities && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <span className="text-gray-500 text-sm">Abilities:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(draft.abilities).map(([ability, value]) => (
                <span
                  key={ability}
                  className={cn(
                    'px-2 py-1 rounded text-sm font-medium',
                    value > 0 ? 'bg-green-100 text-green-700' :
                    value < 0 ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  )}
                >
                  {ability.charAt(0).toUpperCase()}: {value >= 0 ? `+${value}` : value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* Health & Energy Allocation */}
      <HealthEnergyAllocation />
      
      {/* Description (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description (Optional)
        </label>
        <textarea
          value={draft.description || ''}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Describe your character's appearance, personality, or background..."
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors resize-none"
        />
      </div>
      
      {/* Notes (Optional) */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Notes (Optional)
        </label>
        <textarea
          value={draft.notes || ''}
          onChange={(e) => updateDraft({ notes: e.target.value })}
          placeholder="Any additional notes about your character..."
          rows={3}
          className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors resize-none"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          {error}
        </div>
      )}
      
      {/* Validation Summary */}
      {validationIssues.length > 0 && (
        <div className={cn(
          'mb-6 p-4 rounded-xl',
          validationIssues.some(i => i.severity === 'error') 
            ? 'bg-red-50 border border-red-200' 
            : 'bg-amber-50 border border-amber-200'
        )}>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl">
              {validationIssues.some(i => i.severity === 'error') ? '⚠️' : '📋'}
            </span>
            <span className="font-medium">
              {validationIssues.filter(i => i.severity === 'error').length} error{validationIssues.filter(i => i.severity === 'error').length !== 1 ? 's' : ''}, 
              {' '}{validationIssues.filter(i => i.severity === 'warning').length} warning{validationIssues.filter(i => i.severity === 'warning').length !== 1 ? 's' : ''}
            </span>
          </div>
          <p className="text-sm text-gray-600">
            Click &quot;Review & Create&quot; to see all issues before saving.
          </p>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={prevStep}
          disabled={saving}
          className="btn-back disabled:opacity-50"
        >
          ← Back
        </button>
        
        <button
          onClick={handleValidateAndSave}
          disabled={saving}
          className={cn(
            'px-8 py-3 rounded-xl font-bold transition-colors flex items-center gap-2',
            saving
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : validationIssues.some(i => i.severity === 'error')
                ? 'bg-amber-500 text-white hover:bg-amber-600'
                : 'bg-green-600 text-white hover:bg-green-700'
          )}
        >
          {saving ? (
            <>
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : validationIssues.length > 0 ? (
            <>
              📋 Review & Create
            </>
          ) : (
            <>
              ✓ Create Character
            </>
          )}
        </button>
      </div>
      
      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        issues={validationIssues}
        onContinueAnyway={validationIssues.every(i => i.severity !== 'error') ? handleSave : undefined}
      />

      {/* Login Prompt Modal */}
      <LoginPromptModal
        isOpen={showLoginPrompt}
        onClose={() => setShowLoginPrompt(false)}
        returnPath="/characters/new"
        contentType="character"
      />
    </div>
  );
}
