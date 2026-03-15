/**
 * Finalize Step
 * =============
 * Final character details and save
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCharacter, saveCharacter } from '@/services/character-service';
import { useAuth, useCodexSkills, useSpecies, usePowerParts, useTechniqueParts, useItemProperties } from '@/hooks';
import { cn } from '@/lib/utils';
import { cleanForSave } from '@/lib/data-enrichment';
import type { Character, CharacterPower, CharacterTechnique, Item } from '@/types';
import { Spinner, Button, Alert, Modal, Textarea, useToast } from '@/components/ui';
import { useCharacterCreatorStore } from '@/stores/character-creator-store';
import { getAllValidationIssues, type ValidationIssue } from '@/lib/character-creator-validation';
import { calculateMaxHealth, calculateMaxEnergy } from '@/lib/game/calculations';
import { ABILITY_DISPLAY_NAMES } from '@/lib/game/constants';
import { LoginPromptModal, ImageUploadModal } from '@/components/shared';
import { HealthEnergyAllocator } from '@/components/creator';
import { buildRequiredProficiencies, calculateProficiencyTP, dedupeHighestProficiencies, getTrainingPointLimit } from '@/lib/proficiencies';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';

// Health-Energy pool for new characters (18 at level 1, +2 per level)
const BASE_HE_POOL = 18;

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
      <h2 className="text-xl font-bold text-text-primary">
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
      fullScreenOnMobile
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
 * Auto-allocate button sets energy to match highest power/technique cost (if possible), rest to health.
 */
function HealthEnergyAllocationSection() {
  const { draft, updateDraft } = useCharacterCreatorStore();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  
  // Calculate base values using centralized calculations
  const abilities = draft.abilities || { strength: 0, vitality: 0, agility: 0, acuity: 0, intelligence: 0, charisma: 0 };
  const level = draft.level || 1;
  const powAbil = draft.pow_abil || draft.archetype?.pow_abil || draft.archetype?.ability;
  const martAbil = draft.mart_abil || draft.archetype?.mart_abil;
  
  // Base = max with 0 allocation; used for display
  const baseHealth = calculateMaxHealth(0, abilities.vitality || 0, level, powAbil, abilities);
  const baseEnergy = calculateMaxEnergy(0, powAbil || martAbil, abilities, level);
  
  // HE pool is 18 at level 1, +2 per level
  const hePool = BASE_HE_POOL + (level - 1) * 2;
  
  // Now using bonus values (stored directly)
  const hpBonus = draft.healthPoints || 0;
  const enBonus = draft.energyPoints || 0;
  
  // Calculated max values for display
  const maxHp = calculateMaxHealth(hpBonus, abilities.vitality || 0, level, powAbil, abilities);
  const maxEnergy = calculateMaxEnergy(enBonus, powAbil || martAbil, abilities, level);
  
  // Highest energy cost among powers and techniques (for auto-allocate)
  const highestEnergyCost = useMemo(() => {
    let max = 0;
    const powers = (draft.powers || []) as CharacterPower[];
    const techniques = (draft.techniques || []) as CharacterTechnique[];
    powers.forEach((p) => {
      try {
        const disp = derivePowerDisplay(p as unknown as PowerDocument, powerPartsDb);
        if (typeof disp.energy === 'number') max = Math.max(max, disp.energy);
      } catch {
        // ignore invalid power
      }
    });
    techniques.forEach((t) => {
      try {
        const disp = deriveTechniqueDisplay(t as unknown as TechniqueDocument, techniquePartsDb);
        if (typeof disp.energy === 'number') max = Math.max(max, disp.energy);
      } catch {
        // ignore invalid technique
      }
    });
    return max;
  }, [draft.powers, draft.techniques, powerPartsDb, techniquePartsDb]);
  
  const onAutoAllocate = useCallback(() => {
    // Target max EN = highest power/technique cost, capped by what the pool can provide
    const maxAchievableEN = baseEnergy + hePool;
    const targetEN = Math.min(highestEnergyCost, maxAchievableEN);
    const energyBonusNeeded = Math.max(0, targetEN - baseEnergy);
    const energyBonusFinal = Math.min(hePool, energyBonusNeeded);
    const hpBonusFinal = hePool - energyBonusFinal;
    updateDraft({ healthPoints: hpBonusFinal, energyPoints: energyBonusFinal });
  }, [baseEnergy, hePool, highestEnergyCost, updateDraft]);
  
  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-bold text-text-primary">Health/Energy Allocation</h3>
        <div className="flex items-center gap-2">
          <div className="text-xs text-text-muted dark:text-text-secondary">
            Base HP: {baseHealth} | Base EN: {baseEnergy}
          </div>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onAutoAllocate}
            aria-label="Auto-allocate points so max energy matches highest power or technique cost, rest to health"
          >
            Auto-allocate to match highest cost
          </Button>
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
              <span className="text-3xl text-text-muted dark:text-text-secondary">📷</span>
              <p className="text-xs text-text-muted dark:text-text-secondary mt-1">No image</p>
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
                ? 'bg-surface-alt text-text-muted dark:text-text-secondary cursor-not-allowed'
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
          <p className="text-xs text-text-muted dark:text-text-secondary mt-2">
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
  const { showToast } = useToast();
  const { draft, updateDraft, getCharacter, resetCreator, prevStep } = useCharacterCreatorStore();
  const { data: codexSkills } = useCodexSkills();
  const { data: allSpecies = [] } = useSpecies();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Validation from shared lib (same messages as tab-bar "things left to do" modal)
  const validationIssues = useMemo(
    () =>
      getAllValidationIssues(draft, {
        allSpecies,
        codexSkills: codexSkills ?? null,
      }),
    [draft, allSpecies, codexSkills]
  );

  const proficiencyTpSummary = useMemo(() => {
    const inventory = draft.equipment?.inventory || [];
    const weapons = inventory.filter((item) => item.type === 'weapon');
    const shields = inventory.filter((item) => item.type === 'shield');
    const armor = inventory.filter((item) => item.type === 'armor');
    const required = buildRequiredProficiencies({
      powers: (draft.powers || []) as CharacterPower[],
      techniques: (draft.techniques || []) as CharacterTechnique[],
      weapons: weapons as Item[],
      shields: shields as Item[],
      armor: armor as Item[],
      powerPartsDb,
      techniquePartsDb,
      itemPropertiesDb,
    });
    const spent = dedupeHighestProficiencies(required).reduce((sum, p) => sum + calculateProficiencyTP(p), 0);

    const abilities = draft.abilities || {};
    const getAbility = (key: string | undefined): number =>
      key ? Number((abilities as Record<string, unknown>)[key] ?? 0) || 0 : 0;
    const highestAbility = Math.max(
      ...Object.values(abilities).filter((v): v is number => typeof v === 'number'),
      0
    );
    const archetypeAbility = Math.max(getAbility(draft.pow_abil), getAbility(draft.mart_abil), highestAbility);
    const limit = getTrainingPointLimit(draft.level || 1, archetypeAbility);
    return { spent, limit, remaining: limit - spent };
  }, [draft, powerPartsDb, techniquePartsDb, itemPropertiesDb]);
  
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
      
      const characterData = getCharacter({
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      });
      
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
          if (points >= 0) {
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

      // Strip to lean schema (feats, powers, techniques, skills, equipment, etc.) so we don't persist
      // full codex/library data — it's derived on load from codex.
      const leanData = cleanForSave(characterData as unknown as Character);
      
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

      const sanitizedCharacter = sanitize(leanData);

      // If portrait is base64, strip it from initial save (will upload to Storage after)
      const hasBase64Portrait = sanitizedCharacter.portrait && 
        typeof sanitizedCharacter.portrait === 'string' && 
        sanitizedCharacter.portrait.startsWith('data:');
      const base64Portrait = hasBase64Portrait ? sanitizedCharacter.portrait : null;
      if (hasBase64Portrait) {
        delete sanitizedCharacter.portrait;
      }

      const characterId = await createCharacter({
        ...sanitizedCharacter,
        userId: user.uid,
      });

      // Upload base64 portrait to Supabase Storage and save the URL
      if (base64Portrait && characterId) {
        try {
          // Convert base64 data URI to a File
          const res = await fetch(base64Portrait);
          const blob = await res.blob();
          const file = new File([blob], 'portrait.jpg', { type: 'image/jpeg' });

          const formData = new FormData();
          formData.append('file', file);
          formData.append('characterId', characterId);

          const uploadRes = await fetch('/api/upload/portrait', {
            method: 'POST',
            body: formData,
          });

          if (uploadRes.ok) {
            const { url } = (await uploadRes.json()) as { url: string };
            // Update character with the Storage URL
            await saveCharacter(characterId, { portrait: url });
          }
          // If upload fails, character is still created without portrait — not a critical error
        } catch (uploadErr) {
          console.error('Portrait upload failed (character still saved):', uploadErr);
        }
      }

      // Clear the creator store
      resetCreator();

      // Navigate: returnTo param (e.g. from campaigns Join tab) or new character sheet
      const returnTo = searchParams.get('returnTo');
      showToast('Your character is ready!', 'success');
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
      <h2 className="text-2xl font-bold text-text-primary mb-2">Finalize Your Character</h2>
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
      
      {/* Character Summary — styled to match creator steps: clear hierarchy, ability cards, no grey-on-grey */}
      <div className="rounded-xl border border-border-light bg-surface overflow-hidden mb-6 shadow-sm">
        <div className="px-5 py-4 border-b border-border-light bg-surface-alt">
          <h2 className="text-lg font-bold text-text-primary">Character Summary</h2>
          <p className="text-sm text-text-secondary mt-0.5">Review your character at a glance.</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Top row: Level, Archetype, Species, Power/Martial only when archetype has that proficiency */}
          {(() => {
            const arch = draft.archetype;
            const hasPowerProf = arch?.type === 'power' || arch?.type === 'powered-martial' || (arch?.power_prof_start ?? 0) > 0;
            const hasMartialProf = arch?.type === 'martial' || arch?.type === 'powered-martial' || (arch?.martial_prof_start ?? 0) > 0;
            const showPowerAbility = draft.pow_abil && hasPowerProf;
            const showMartialAbility = draft.mart_abil && hasMartialProf;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Level</p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">{draft.level || 1}</p>
                </div>
                <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Archetype</p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">
                    {arch?.name
                      ? arch.name
                      : arch?.type
                        ? arch.type.charAt(0).toUpperCase() + arch.type.slice(1)
                        : '—'}
                  </p>
                </div>
                <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                  <p className="text-xs font-medium text-text-secondary uppercase tracking-wide">Species</p>
                  <p className="text-lg font-bold text-text-primary mt-0.5">{draft.ancestry?.name || '—'}</p>
                </div>
                {showPowerAbility && (
                  <div className="rounded-lg border border-power bg-power-light/40 dark:bg-power-900/20 p-3">
                    <p className="text-xs font-medium text-power-dark dark:text-power-300 uppercase tracking-wide">Power Ability</p>
                    <p className="text-lg font-bold text-power-dark dark:text-power-300 mt-0.5 capitalize">{draft.pow_abil}</p>
                  </div>
                )}
                {showMartialAbility && (
                  <div className="rounded-lg border border-martial bg-martial-light/40 dark:bg-martial-900/20 p-3">
                    <p className="text-xs font-medium text-martial-dark dark:text-martial-300 uppercase tracking-wide">Martial Ability</p>
                    <p className="text-lg font-bold text-martial-dark dark:text-martial-300 mt-0.5 capitalize">{draft.mart_abil}</p>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Proficiency TP — same token styling as elsewhere */}
          <div className="rounded-lg border border-border-light bg-surface-alt/50 p-4">
            <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Proficiency TP</p>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface text-text-primary border border-border-light">
                Limit: {proficiencyTpSummary.limit}
              </span>
              <span className="px-3 py-1.5 rounded-lg text-sm font-medium bg-surface text-text-primary border border-border-light">
                Required: {proficiencyTpSummary.spent}
              </span>
              <span
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm font-bold',
                  proficiencyTpSummary.remaining >= 0
                    ? 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300 border border-success-200 dark:border-success-700/50'
                    : 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-300 border border-danger-200 dark:border-danger-700/50'
                )}
              >
                Remaining: {proficiencyTpSummary.remaining}
              </span>
            </div>
            {proficiencyTpSummary.remaining < 0 && (
              <p className="mt-2 text-sm text-danger-700 dark:text-danger-300 font-medium">
                Over by {Math.abs(proficiencyTpSummary.remaining)} TP. You can still create and adjust later.
              </p>
            )}
          </div>

          {/* Abilities — name above value, mini ability cards matching creator (power/martial tint, +/- colors) */}
          {draft.abilities && (
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-3">Abilities</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(Object.entries(draft.abilities) as [string, number][]).map(([key, value]) => {
                  const isPower = draft.pow_abil === key;
                  const isMartial = draft.mart_abil === key;
                  const name = ABILITY_DISPLAY_NAMES[key] ?? key;
                  return (
                    <div
                      key={key}
                      className={cn(
                        'rounded-lg border-2 p-2 text-center',
                        isPower && 'border-power bg-power-light/50 dark:bg-power-900/20',
                        isMartial && 'border-martial bg-martial-light/50 dark:bg-martial-900/20',
                        !isPower && !isMartial && 'border-border-light bg-surface-alt/50'
                      )}
                    >
                      <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wide leading-tight">
                        {name}
                      </p>
                      <p
                        className={cn(
                          'text-lg font-bold mt-0.5',
                          value > 0 && 'text-success-700 dark:text-success-400',
                          value < 0 && 'text-danger-600 dark:text-danger-400',
                          value === 0 && 'text-text-secondary'
                        )}
                      >
                        {value >= 0 ? `+${value}` : value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Feats — chips with contrast */}
          {draft.feats && draft.feats.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Feats</p>
              <div className="flex flex-wrap gap-2">
                {draft.feats.map((feat) => (
                  <span
                    key={feat.id}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm font-medium border',
                      feat.type === 'archetype'
                        ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700/50'
                        : 'bg-info-100 dark:bg-info-900/40 text-info-800 dark:text-info-200 border-info-200 dark:border-info-700/50'
                    )}
                  >
                    {feat.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Powers & Techniques — section headers with power/martial color, list with EN */}
          {((draft.powers && draft.powers.length > 0) || (draft.techniques && draft.techniques.length > 0)) && (
            <div className="space-y-3">
              {draft.powers && draft.powers.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-power-dark dark:text-power-300 uppercase tracking-wide mb-2">Powers</p>
                  <div className="flex flex-wrap gap-2">
                    {draft.powers.map((p) => {
                      const doc: PowerDocument = {
                        name: String(p.name ?? ''),
                        description: String(p.description ?? ''),
                        parts: Array.isArray(p.parts) ? (p.parts as PowerDocument['parts']) : [],
                        damage: (p as CharacterPower & { damage?: PowerDocument['damage'] }).damage,
                        actionType: (p as CharacterPower & { actionType?: string }).actionType,
                        isReaction: (p as CharacterPower & { isReaction?: boolean }).isReaction,
                        range: (p as CharacterPower & { range?: PowerDocument['range'] }).range,
                        area: (p as CharacterPower & { area?: PowerDocument['area'] }).area,
                        duration: (p as CharacterPower & { duration?: PowerDocument['duration'] }).duration,
                      };
                      const display = derivePowerDisplay(doc, powerPartsDb ?? []);
                      const en = typeof display.energy === 'number' ? display.energy : '—';
                      return (
                        <span
                          key={String(p.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-power-light/50 dark:bg-power-900/30 text-power-dark dark:text-power-300 border border-power/30"
                        >
                          {p.name} <span className="opacity-90">({en} EN)</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
              {draft.techniques && draft.techniques.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-martial-dark dark:text-martial-300 uppercase tracking-wide mb-2">Techniques</p>
                  <div className="flex flex-wrap gap-2">
                    {draft.techniques.map((t) => {
                      const doc: TechniqueDocument = {
                        name: String(t.name ?? ''),
                        description: String(t.description ?? ''),
                        parts: Array.isArray(t.parts) ? (t.parts as TechniqueDocument['parts']) : [],
                        damage: Array.isArray((t as CharacterTechnique & { damage?: unknown }).damage) && (t as CharacterTechnique & { damage: unknown[] }).damage[0]
                          ? (t as CharacterTechnique & { damage: unknown[] }).damage[0] as TechniqueDocument['damage']
                          : (t as CharacterTechnique & { damage?: TechniqueDocument['damage'] }).damage,
                        weapon: (t as CharacterTechnique & { weapon?: TechniqueDocument['weapon'] }).weapon,
                      };
                      const display = deriveTechniqueDisplay(doc, techniquePartsDb ?? []);
                      const en = typeof display.energy === 'number' ? display.energy : '—';
                      return (
                        <span
                          key={String(t.id)}
                          className="px-3 py-1.5 rounded-lg text-sm font-medium bg-martial-light/50 dark:bg-martial-900/30 text-martial-dark dark:text-martial-300 border border-martial/30"
                        >
                          {t.name} <span className="opacity-90">({en} EN)</span>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Equipment */}
          {draft.equipment?.inventory && draft.equipment.inventory.length > 0 && (
            <div>
              <p className="text-xs font-medium text-text-secondary uppercase tracking-wide mb-2">Equipment</p>
              <p className="text-sm text-text-primary">
                {draft.equipment.inventory.map(i =>
                  (i.quantity ?? 1) > 1 ? `${i.name} ×${i.quantity ?? 1}` : i.name
                ).join(', ')}
              </p>
            </div>
          )}
        </div>
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
            : 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50'
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
      <div className="flex flex-col items-end gap-2">
        {!user && (
          <p className="text-sm text-text-muted dark:text-text-secondary">
            Create an account to save your character. Your progress is stored locally until you sign in.
          </p>
        )}
        <div className="flex justify-between w-full">
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
