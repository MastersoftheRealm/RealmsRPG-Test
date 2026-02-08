/**
 * Finalize Step
 * =============
 * Final character details and save
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCharacter } from '@/services/character-service';
import { useAuth, useCodexSkills, useSpecies, type Species } from '@/hooks';
import { cn } from '@/lib/utils';
import { Spinner, Button, Alert, Modal, Textarea } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { calculateAbilityPoints, calculateSkillPointsForEntity, calculateTrainingPoints, getBaseHealth, getBaseEnergy } from '@/lib/game/formulas';
import { calculateSimpleSkillPointsSpent } from '@/lib/game/skill-allocation';
import { LoginPromptModal, ImageUploadModal } from '@/components/shared';
import { HealthEnergyAllocator } from '@/components/creator';

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
  onContinueAnyway,
  onSave,
  isSaving,
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  issues: ValidationIssue[];
  onContinueAnyway?: () => void;
  onSave?: () => void;
  isSaving?: boolean;
}) {
  const hasErrors = issues.some(i => i.severity === 'error');
  const isValid = issues.length === 0;

  // Custom header for Modal
  const modalHeader = (
    <div className={cn(
      'p-4 border-b flex items-center gap-3',
      isValid ? 'bg-green-50 dark:bg-green-900/30' : hasErrors ? 'bg-red-50 dark:bg-red-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
    )}>
      <span className="text-2xl">{isValid ? '✅' : hasErrors ? '⚠️' : '📋'}</span>
      <h2 className="text-xl font-bold">
        {isValid ? 'Character Ready!' : hasErrors ? 'Issues Found' : 'Review Needed'}
      </h2>
    </div>
  );

  // Custom footer for Modal
  const modalFooter = (
    <div className="p-4 border-t flex justify-end gap-3">
      <Button
        variant="secondary"
        onClick={onClose}
        disabled={isSaving}
      >
        {isValid ? 'Cancel' : 'Go Back & Fix'}
      </Button>
      {/* Show Save button when valid */}
      {isValid && onSave && (
        <Button
          onClick={onSave}
          disabled={isSaving}
          isLoading={isSaving}
        >
          ✓ Create Character
        </Button>
      )}
      {/* Show Continue Anyway when there are warnings but no errors */}
      {!hasErrors && !isValid && onContinueAnyway && (
        <Button
          onClick={onContinueAnyway}
          disabled={isSaving}
          className="bg-amber-500 text-white hover:bg-amber-600"
        >
          Save Anyway
        </Button>
      )}
    </div>
  );
  
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      header={modalHeader}
      footer={modalFooter}
      showCloseButton={false}
      contentClassName="p-4 overflow-y-auto max-h-[50vh]"
    >
      {isValid ? (
        <p className="text-text-secondary text-center py-8">
          Your character is complete and ready for adventure!
        </p>
      ) : (
        <div className="space-y-3">
          {issues.map((issue, idx) => (
            <div 
              key={idx} 
              className={cn(
                'p-3 rounded-lg flex gap-3',
                issue.severity === 'error' ? 'bg-red-50 dark:bg-red-900/30' : 'bg-amber-50 dark:bg-amber-900/30'
              )}
            >
              <span className="text-xl flex-shrink-0">{issue.emoji}</span>
              <p className="text-text-secondary">{issue.message}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

/**
 * Health & Energy Allocation Section
 * Uses the shared HealthEnergyAllocator component for consistent UX
 * across character creator, character sheet, and creature creator.
 */
function HealthEnergyAllocationSection() {
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
  
  // Now using bonus values (stored directly)
  const hpBonus = draft.healthPoints || 0;
  const enBonus = draft.energyPoints || 0;
  
  // Calculated max values for display
  const maxHp = baseHealth + hpBonus;
  const maxEnergy = baseEnergy + enBonus;
  
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-text-primary">Health/Energy Allocation</h3>
        <div className="text-xs text-text-muted">
          Base HP: {baseHealth} | Base EN: {baseEnergy}
        </div>
      </div>
      <HealthEnergyAllocator
        hpBonus={hpBonus}
        energyBonus={enBonus}
        poolTotal={hePool}
        maxHp={maxHp}
        maxEnergy={maxEnergy}
        onHpChange={(val) => updateDraft({ healthPoints: val })}
        onEnergyChange={(val) => updateDraft({ energyPoints: val })}
        enableHoldRepeat
      />
    </div>
  );
}

// =============================================================================
// Portrait Upload Component - uses ImageUploadModal for cropping
// =============================================================================

async function blobToCompressedBase64(blob: Blob, maxSize = 700 * 1024): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      let { width, height } = img;
      const maxDim = 400;
      if (width > height && width > maxDim) {
        height = Math.round((height * maxDim) / width);
        width = maxDim;
      } else if (height > maxDim) {
        width = Math.round((width * maxDim) / height);
        height = maxDim;
      }
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      let quality = 0.7;
      const tryEncode = () => {
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > maxSize && quality > 0.3) {
          quality -= 0.1;
          tryEncode();
        } else {
          resolve(dataUrl);
        }
      };
      tryEncode();
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    img.src = url;
  });
}

function PortraitUpload() {
  const { draft, updateDraft } = useCharacterCreatorStore();
  const [showModal, setShowModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCropped = async (blob: Blob) => {
    setError(null);
    setIsProcessing(true);
    try {
      const base64 = await blobToCompressedBase64(blob);
      if (base64.length > 700 * 1024) {
        setError('Image is still too large. Please use a smaller image.');
        return;
      }
      updateDraft({ portrait: base64 });
      setShowModal(false);
    } catch {
      setError('Failed to process image');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemove = () => {
    updateDraft({ portrait: undefined });
    setError(null);
  };

  return (
    <div className="mb-6">
      <label className="block text-sm font-medium text-text-secondary mb-2">
        Character Portrait (Optional)
      </label>

      <div className="flex items-start gap-4">
        <div className="relative w-24 h-32 rounded-lg overflow-hidden bg-surface-alt border-2 border-dashed border-border-light flex items-center justify-center">
          {draft.portrait ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={draft.portrait}
                alt="Character portrait"
                className="w-full h-full object-cover"
              />
              <button
                onClick={handleRemove}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs hover:bg-red-600"
                title="Remove portrait"
              >
                ×
              </button>
            </>
          ) : (
            <div className="text-center p-2">
              <span className="text-3xl text-text-muted">📷</span>
              <p className="text-xs text-text-muted mt-1">No image</p>
            </div>
          )}
        </div>

        <div className="flex-1">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            disabled={isProcessing}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors',
              isProcessing
                ? 'bg-surface-alt text-text-muted cursor-not-allowed'
                : 'border-primary-300 dark:border-primary-600/50 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/30'
            )}
          >
            {isProcessing ? (
              <>
                <Spinner size="sm" />
                Processing...
              </>
            ) : (
              <>📤 {draft.portrait ? 'Change Image' : 'Upload Image'}</>
            )}
          </button>
          <p className="text-xs text-text-muted mt-2">
            Click to upload and crop. JPG, PNG, or GIF. Max 5MB.
          </p>
          {error && (
            <p className="text-xs text-red-600 mt-1 font-medium">{error}</p>
          )}
        </div>
      </div>

      <ImageUploadModal
        isOpen={showModal}
        onClose={() => { setShowModal(false); setError(null); }}
        onConfirm={handleCropped}
        cropShape="rect"
        aspect={3 / 4}
        title="Character Portrait"
      />
    </div>
  );
}

export function FinalizeStep() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { draft, updateDraft, getCharacter, resetCreator, prevStep } = useCharacterCreatorStore();
  const { data: codexSkills } = useCodexSkills();
  const { data: allSpecies = [] } = useSpecies();
  
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
    
    // 5. Skill points (characters: 3/level; proper cost model for proficiency + values + defenses)
    const maxSkillPoints = calculateSkillPointsForEntity(level, 'character');
    const species = draft.ancestry?.id
      ? allSpecies.find((s: Species) => s.id === draft.ancestry?.id)
      : allSpecies.find((s: Species) => String(s.name ?? '').toLowerCase() === String(draft.ancestry?.name ?? '').toLowerCase());
    const speciesSkillIds = new Set<string>((species?.skills || []).map((id: string | number) => String(id)));
    const skillMeta = new Map<string, { isSubSkill: boolean }>();
    (codexSkills || []).forEach((s: { id: string; base_skill_id?: number }) => {
      skillMeta.set(s.id, { isSubSkill: s.base_skill_id !== undefined });
    });
    const totalUsedSkillPoints = calculateSimpleSkillPointsSpent(
      draft.skills || {},
      speciesSkillIds,
      skillMeta,
      draft.defenseSkills
    );
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
    const hePool = BASE_HE_POOL + (level - 1) * 2;
    
    // Now using bonus values directly (not absolute)
    const healthAllocation = draft.healthPoints || 0;
    const energyAllocation = draft.energyPoints || 0;
    const usedHEPoints = healthAllocation + energyAllocation;
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
  }, [draft, codexSkills, allSpecies]);
  
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
      
      // Convert skills from Record<string, number> to array format
      // Character sheet expects: Array<{ id, name, category, skill_val, prof }>
      if (characterData.skills && typeof characterData.skills === 'object' && !Array.isArray(characterData.skills)) {
        const skillsRecord = characterData.skills as Record<string, number>;
        const skillsArray: Array<{
          id: string;
          name: string;
          category?: string;
          skill_val: number;
          prof: boolean;
          baseSkill?: string;
          ability?: string;
        }> = [];
        
        // Convert each skill allocation to array format
        Object.entries(skillsRecord).forEach(([skillId, points]) => {
          if (points > 0) {
            const skillData = codexSkills?.find((s: { id: string; name: string }) => s.id === skillId || s.name === skillId);
            const baseSkill = skillData?.base_skill_id !== undefined
              ? (codexSkills?.find((s: { id: string }) => s.id === String(skillData?.base_skill_id)) as { name?: string })?.name
              : undefined;
            if (skillData) {
              skillsArray.push({
                id: skillData.id,
                name: skillData.name,
                category: (skillData as { category?: string }).category || skillData.ability?.split(',')[0]?.trim() || 'other',
                skill_val: points,
                prof: true,
                ...(baseSkill && { baseSkill }),
                ability: skillData.ability?.split(',')[0]?.trim().toLowerCase(),
              });
            } else {
              skillsArray.push({
                id: skillId,
                name: skillId,
                category: 'other',
                skill_val: points,
                prof: true,
              });
            }
          }
        });
        
        characterData.skills = skillsArray as any;
      }
      
      // Remove any undefined values (PostgreSQL JSONB rejects undefined)
      const sanitize = (val: any): any => {
        if (val === undefined) return undefined;
        if (val === null) return null;
        if (Array.isArray(val)) return val.map(sanitize).filter((v) => v !== undefined);
        if (typeof val === 'object') {
          const out: any = {};
          Object.entries(val).forEach(([k, v]) => {
            const s = sanitize(v);
            if (s !== undefined) out[k] = s;
          });
          return out;
        }
        return val;
      };

      const sanitizedCharacter = sanitize(characterData);

      const characterId = await createCharacter({
        ...sanitizedCharacter,
        userId: user.uid,
      });

      // Clear the creator store
      resetCreator();

      // Navigate: returnTo param (e.g. from campaigns Join tab) or new character sheet
      const returnTo = searchParams.get('returnTo');
      if (returnTo && returnTo.startsWith('/')) {
        router.push(returnTo);
      } else {
        router.push(`/characters/${characterId}`);
      }
    } catch (err) {
      console.error('Error saving character:', err);
      setError('Failed to save character. Please try again.');
    } finally {
      setSaving(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-text-primary mb-2">Finalize Your Character</h1>
      <p className="text-text-secondary mb-6">
        Add the final details to bring your character to life.
      </p>
      
      {/* Character Name */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-text-secondary mb-2">
          Character Name *
        </label>
        <input
          type="text"
          value={draft.name || ''}
          onChange={(e) => updateDraft({ name: e.target.value })}
          placeholder="Enter your character's name"
          className="w-full px-4 py-3 rounded-xl border border-border-light focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors"
        />
      </div>
      
      {/* Character Portrait (Optional) */}
      <PortraitUpload />
      
      {/* Character Summary */}
      <div className="bg-surface-alt rounded-xl p-6 mb-6">
        <h3 className="font-bold text-text-primary mb-4">Character Summary</h3>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-text-muted">Level:</span>
            <span className="ml-2 font-medium">{draft.level || 1}</span>
          </div>
          
          <div>
            <span className="text-text-muted">Archetype:</span>
            <span className="ml-2 font-medium">
              {draft.archetype?.type 
                ? draft.archetype.type.charAt(0).toUpperCase() + draft.archetype.type.slice(1)
                : 'Not selected'}
            </span>
          </div>
          
          <div>
            <span className="text-text-muted">Species:</span>
            <span className="ml-2 font-medium">{draft.ancestry?.name || 'Not selected'}</span>
          </div>
          
          {draft.pow_abil && (
            <div>
              <span className="text-text-muted">Power Ability:</span>
              <span className="ml-2 font-medium capitalize text-power">{draft.pow_abil}</span>
            </div>
          )}
          
          {draft.mart_abil && (
            <div>
              <span className="text-text-muted">Martial Ability:</span>
              <span className="ml-2 font-medium capitalize text-martial">{draft.mart_abil}</span>
            </div>
          )}
        </div>
        
        {/* Abilities Summary */}
        {draft.abilities && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <span className="text-text-muted text-sm">Abilities:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(draft.abilities).map(([ability, value]) => {
                const isPowerAbil = draft.pow_abil === ability;
                const isMartAbil = draft.mart_abil === ability;
                return (
                  <span
                    key={ability}
                    className={cn(
                      'px-2 py-1 rounded text-sm font-medium',
                      isPowerAbil ? 'bg-power-light text-power-dark' :
                      isMartAbil ? 'bg-martial-light text-martial-dark' :
                      value > 0 ? 'bg-green-100 text-green-700' :
                      value < 0 ? 'bg-red-100 text-red-700' :
                      'bg-surface-alt text-text-secondary'
                    )}
                  >
                    {ability.charAt(0).toUpperCase()}: {value >= 0 ? `+${value}` : value}
                  </span>
                );
              })}
            </div>
          </div>
        )}
        
        {/* Feats Summary */}
        {draft.feats && draft.feats.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <span className="text-text-muted text-sm">Feats:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {draft.feats.map((feat) => (
                <span
                  key={feat.id}
                  className={cn(
                    'px-2 py-1 rounded text-sm font-medium',
                    feat.type === 'archetype' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  )}
                >
                  {feat.name}
                </span>
              ))}
            </div>
          </div>
        )}
        
        {/* Powers & Techniques Summary */}
        {((draft.powers && draft.powers.length > 0) || (draft.techniques && draft.techniques.length > 0)) && (
          <div className="mt-4 pt-4 border-t border-border-light">
            {draft.powers && draft.powers.length > 0 && (
              <div className="mb-2">
                <span className="text-text-muted text-sm">Powers: </span>
                <span className="text-sm text-power">
                  {draft.powers.map(p => p.name).join(', ')}
                </span>
              </div>
            )}
            {draft.techniques && draft.techniques.length > 0 && (
              <div>
                <span className="text-text-muted text-sm">Techniques: </span>
                <span className="text-sm text-martial">
                  {draft.techniques.map(t => t.name).join(', ')}
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Equipment Summary */}
        {draft.equipment?.inventory && draft.equipment.inventory.length > 0 && (
          <div className="mt-4 pt-4 border-t border-border-light">
            <span className="text-text-muted text-sm">Equipment: </span>
            <span className="text-sm text-text-secondary">
              {draft.equipment.inventory.map(i => 
                (i.quantity ?? 1) > 1 ? `${i.name} ×${i.quantity ?? 1}` : i.name
              ).join(', ')}
            </span>
          </div>
        )}
      </div>
      
      {/* Health & Energy Allocation */}
      <HealthEnergyAllocationSection />
      
      {/* Description (Optional) */}
      <div className="mb-6">
        <Textarea
          label="Description (Optional)"
          value={draft.description || ''}
          onChange={(e) => updateDraft({ description: e.target.value })}
          placeholder="Describe your character's appearance, personality, or background..."
          rows={4}
          className="resize-none"
        />
      </div>
      
      {/* Notes (Optional) */}
      <div className="mb-6">
        <Textarea
          label="Notes (Optional)"
          value={draft.notes || ''}
          onChange={(e) => updateDraft({ notes: e.target.value })}
          placeholder="Any additional notes about your character..."
          rows={3}
          className="resize-none"
        />
      </div>
      
      {/* Error Message */}
      {error && (
        <Alert variant="danger" className="mb-6">
          {error}
        </Alert>
      )}
      
      {/* Validation Summary */}
      {validationIssues.length > 0 && (
        <div className={cn(
          'mb-6 p-4 rounded-xl',
          validationIssues.some(i => i.severity === 'error') 
            ? 'bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/50' 
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
          <p className="text-sm text-text-secondary">
            Click &quot;Review & Create&quot; to see all issues before saving.
          </p>
        </div>
      )}
      
      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="secondary"
          onClick={prevStep}
          disabled={saving}
        >
          ← Back
        </Button>
        
        <Button
          onClick={handleValidateAndSave}
          disabled={saving}
          isLoading={saving}
          variant={validationIssues.some(i => i.severity === 'error') ? 'secondary' : 'primary'}
          className={cn(
            'px-8 py-3',
            !saving && validationIssues.some(i => i.severity === 'error') && 'bg-warning-500 hover:bg-warning-600 text-white'
          )}
        >
          {validationIssues.length > 0 ? '📋 Review & Create' : '✓ Create Character'}
        </Button>
      </div>
      
      {/* Validation Modal */}
      <ValidationModal
        isOpen={showValidation}
        onClose={() => setShowValidation(false)}
        issues={validationIssues}
        onSave={handleSave}
        onContinueAnyway={validationIssues.every(i => i.severity !== 'error') ? handleSave : undefined}
        isSaving={saving}
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
