/**
 * Finalize Step
 * =============
 * Final character details and save
 */

'use client';

import { useState, useMemo } from 'react';
import { statusPanel } from '@/lib/ui/status-surface-classes';
import { useRouter, useSearchParams } from 'next/navigation';
import { createCharacter, saveCharacter } from '@/services/character-service';
import { formatCharacterCreateFailureMessage, resolveClientRequestId } from '@/lib/character-save';
import { useAuth, useCodexSkills, useMergedSpecies, useTraits, usePowerParts, useTechniqueParts, useItemProperties, useGameRules } from '@/hooks';
import { cn } from '@/lib/utils';
import { cleanForSave } from '@/lib/data-enrichment';
import { buildCreatorSkillSaveRows } from '@/lib/creator/build-creator-skills';
import {
  PORTRAIT_SAVE_UPLOAD_FALLBACK,
  uploadCharacterPortraitFromDataUrl,
} from '@/lib/portrait';
import { getErrorMessage } from '@/lib/api-client';
import type { Character, CharacterPower, CharacterTechnique, Item } from '@/types';
import { Button, Alert, Textarea, useToast } from '@/components/ui';
import { useCharacterCreatorStore, CHARACTER_STARTING_CURRENCY } from '@/stores/character-creator-store';
import { getAllValidationIssues } from '@/lib/character-creator-validation';
import { calculateMaxEnergyForArchetype } from '@/lib/game/calculations';
import { navigateThenResetCreator, scheduleCreatorReset } from '@/lib/creator-save-handoff';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { LoginPromptModal, InfoTippy, PointStatus, LoadoutBudgetBar } from '@/components/shared';
import { PlayTogetherModal } from '@/components/onboarding';
import {
  characterSheetUrlWithTourOffer,
  hasSeenPlayTogether,
  shouldOfferSheetTour,
} from '@/lib/onboarding-preferences';
import { finalizeSummaryHelp } from '../../../../public/tooltip-text';
import { CreatorStepFooter } from '@/components/character-creator/creator-step-footer';
import { buildRequiredProficiencies, calculateProficiencyTP, dedupeHighestProficiencies, getTrainingPointLimit } from '@/lib/proficiencies';
import { ValidationModal } from './finalize/validation-modal';
import { HealthEnergyAllocationSection } from './finalize/health-energy-section';
import { PortraitUpload } from './finalize/portrait-upload';
import { BuildSummary } from './finalize/build-summary';
import { IdentityFields } from './finalize/identity-fields';

export function FinalizeStep() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { rules } = useGameRules();
  const { showToast } = useToast();
  const { draft, updateDraft, getCharacter, resetCreator, prevStep } = useCharacterCreatorStore();
  const { data: codexSkills } = useCodexSkills();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: allTraits } = useTraits();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showPlayTogether, setShowPlayTogether] = useState(false);
  const [savedCharacterId, setSavedCharacterId] = useState<string | null>(null);

  const creatorReturnPath = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/characters/new?${qs}` : '/characters/new';
  }, [searchParams]);

  // Validation from shared lib (same messages as tab-bar "things left to do" modal)
  const validationIssues = useMemo(
    () =>
      getAllValidationIssues(draft, {
        allSpecies,
        codexSkills: codexSkills ?? null,
        allTraits: allTraits ?? null,
      }, rules),
    [draft, allSpecies, codexSkills, allTraits, rules]
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
  
  const maxEnergy = useMemo(() => {
    const abilities = draft.abilities || {};
    const level = draft.level || 1;
    const powAbil = draft.pow_abil || draft.archetype?.pow_abil || draft.archetype?.ability;
    const martAbil = draft.mart_abil || draft.archetype?.mart_abil;
    return calculateMaxEnergyForArchetype(
      draft.energyPoints || 0,
      abilities,
      level,
      powAbil,
      martAbil
    );
  }, [draft]);

  const startingCurrency = useMemo(() => {
    const level = draft.level || 1;
    if (level <= 1) return CHARACTER_STARTING_CURRENCY;
    return Math.round(CHARACTER_STARTING_CURRENCY * Math.pow(1.45, level - 1));
  }, [draft.level]);
  const remainingCurrency = draft.currency ?? startingCurrency;
  
  const handleValidateAndSave = () => {
    setShowValidation(true);
  };
  
  const handleSave = async () => {
    if (!user) {
      // Show login prompt modal instead of error
      setShowLoginPrompt(true);
      return;
    }

    if (saving) return;
    
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
        rules,
      });
      
      // Convert skills Record → array before cleanForSave so proficient-only 0 survives
      // (shared with Guided via buildCreatorSkillSaveRows).
      if (characterData.skills && typeof characterData.skills === 'object' && !Array.isArray(characterData.skills)) {
        characterData.skills = buildCreatorSkillSaveRows(
          characterData.skills as Record<string, number>,
          {
            codexSkills: codexSkills ?? [],
            includeBaseSkillName: true,
            abilities: characterData.abilities,
            skillAbilities: draft.skillAbilities,
          }
        ) as unknown as Character['skills'];
      }

      // Strip to lean schema (feats, powers, techniques, skills, equipment, etc.) so we don't persist
      // full codex/library data — it's derived on load from codex.
      const leanData = cleanForSave(characterData as unknown as Character);
      
      // Remove any undefined values (PostgreSQL JSONB rejects undefined)
      const sanitizeForJsonb = (val: unknown): unknown => {
        if (val === undefined) return undefined;
        if (val === null) return null;
        if (Array.isArray(val)) return val.map(sanitizeForJsonb).filter((v) => v !== undefined);
        if (typeof val === 'object') {
          const out: Record<string, unknown> = {};
          Object.entries(val as Record<string, unknown>).forEach(([k, v]) => {
            const s = sanitizeForJsonb(v);
            if (s !== undefined) out[k] = s;
          });
          return out;
        }
        return val;
      };

      const sanitizedCharacter = sanitizeForJsonb(leanData) as Partial<Character>;

      // If portrait is base64, strip it from initial save (will upload to Storage after)
      const hasBase64Portrait = sanitizedCharacter.portrait && 
        typeof sanitizedCharacter.portrait === 'string' && 
        sanitizedCharacter.portrait.startsWith('data:');
      const base64Portrait = hasBase64Portrait ? sanitizedCharacter.portrait : null;
      if (hasBase64Portrait) {
        delete sanitizedCharacter.portrait;
      }

      const clientRequestId = resolveClientRequestId(draft.clientRequestId);
      if (clientRequestId !== draft.clientRequestId) {
        updateDraft({ clientRequestId });
      }
      const characterId = await createCharacter(
        {
          ...sanitizedCharacter,
          userId: user.uid,
        },
        { clientRequestId }
      );
      if (!characterId?.trim()) {
        throw new Error('Character was created but no id was returned');
      }

      // Upload base64 portrait to Supabase Storage and save the URL
      if (base64Portrait) {
        try {
          const { url } = await uploadCharacterPortraitFromDataUrl(characterId, base64Portrait);
          await saveCharacter(characterId, { portrait: url });
        } catch (err) {
          showToast(getErrorMessage(err, PORTRAIT_SAVE_UPLOAD_FALLBACK), 'error');
        }
      }

      // Navigate first, then clear — see navigateThenResetCreator DESIGN_INTENT.
      const returnTo = searchParams.get('returnTo');
      const safeReturnTo =
        returnTo && returnTo.startsWith('/')
          ? sanitizeRedirectPath(returnTo, '')
          : '';
      showToast('Your character is ready!', 'success');
      setSavedCharacterId(characterId);

      const goAfterSave = (offerTour: boolean) => {
        navigateThenResetCreator(() => {
          if (safeReturnTo) {
            router.push(safeReturnTo);
          } else if (offerTour && shouldOfferSheetTour()) {
            router.push(characterSheetUrlWithTourOffer(characterId));
          } else {
            router.push(`/characters/${characterId}`);
          }
        }, resetCreator);
      };

      if (!safeReturnTo && !hasSeenPlayTogether()) {
        setShowPlayTogether(true);
        // Leave `saving` true so Create stays disabled while play-together is open.
      } else {
        goAfterSave(!safeReturnTo);
      }
    } catch (err) {
      setError(formatCharacterCreateFailureMessage(err, GUIDED_CREATOR_COPY.reveal));
      setSaving(false);
    }
  };
  
  return (
    <div className="max-w-2xl mx-auto flex flex-col flex-1 min-h-0">
      <LoadoutBudgetBar
        className="mb-6"
        currencyTotal={startingCurrency}
        currencySpent={startingCurrency - remainingCurrency}
        tpTotal={proficiencyTpSummary.limit}
        tpSpent={proficiencyTpSummary.spent}
        trailing={
          <PointStatus
            total={maxEnergy}
            spent={0}
            label="Energy"
            variant="inline"
          />
        }
      />

      <div className="flex items-center gap-1 mb-2">
        <h2 className="text-2xl font-bold text-text-primary">Meet Your Character</h2>
        <InfoTippy content={finalizeSummaryHelp} allowHTML label="Finalize checklist help" size="inline" />
      </div>
      <p className="text-text-secondary mb-6">
        Review your build, add identity details, then create your character.
      </p>

      {/* Character reveal hero */}
      <div className="rounded-xl border border-primary-subtle-border bg-gradient-to-br from-primary-subtle-bg/80 to-surface overflow-hidden mb-6 shadow-sm">
        <div className="p-5 flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-image-matte border-2 border-border-light flex items-center justify-center shrink-0">
            {draft.portrait ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={draft.portrait} alt="" className="w-full h-full object-contain" />
            ) : (
              <span className="text-4xl text-text-muted dark:text-text-secondary" aria-hidden>
                {draft.name?.charAt(0).toUpperCase() || '?'}
              </span>
            )}
          </div>
          <div className="min-w-0 text-center sm:text-left flex-1">
            <p className="text-xs font-medium uppercase tracking-wide text-primary-fg mb-1">Level {draft.level || 1}</p>
            <h3 className="text-2xl font-bold text-text-primary truncate">
              {draft.name?.trim() || 'Unnamed Hero'}
            </h3>
            <p className="text-text-secondary mt-1">
              {[draft.archetype?.name, draft.ancestry?.name].filter(Boolean).join(' · ') || 'Complete earlier steps to fill in your build.'}
            </p>
          </div>
        </div>
      </div>
      
      <IdentityFields />
      
      {/* Character Portrait (Optional) */}
      <PortraitUpload />
      
      <BuildSummary
        draft={draft}
        proficiencyTpSummary={proficiencyTpSummary}
        powerPartsDb={powerPartsDb}
        techniquePartsDb={techniquePartsDb}
      />
      
      {/* Health & Energy Allocation */}
      <div className="mb-6">
        <h3 className="font-bold text-text-primary mb-3">Health &amp; Energy</h3>
        <HealthEnergyAllocationSection />
      </div>
      
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
            ? cn(statusPanel.danger, 'border')
            : cn(statusPanel.warning, 'border')
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
      
      {!user && (
        <p className="text-sm text-text-muted dark:text-text-secondary text-right mb-2">
          Create an account to save your character. Your progress is stored locally until you sign in.
        </p>
      )}
      <CreatorStepFooter
        onBack={prevStep}
        backDisabled={saving}
        primaryAction={
          <Button
            onClick={handleValidateAndSave}
            disabled={saving}
            isLoading={saving}
            variant={validationIssues.some((i) => i.severity === 'error') ? 'secondary' : 'primary'}
            className={cn(
              'min-h-11 min-w-11 px-8',
              !saving &&
                validationIssues.some((i) => i.severity === 'error') &&
                'bg-warning-600 hover:bg-warning-700 dark:bg-warning-500 dark:hover:bg-warning-600 text-text-on-dark'
            )}
          >
            {validationIssues.length > 0 ? '📋 Review & Create' : '✓ Create Character'}
          </Button>
        }
      />
      
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
        returnPath={creatorReturnPath}
        contentType="character"
      />

      <PlayTogetherModal
        isOpen={showPlayTogether}
        onViewCharacter={() => {
          setShowPlayTogether(false);
          if (savedCharacterId) {
            navigateThenResetCreator(() => {
              if (shouldOfferSheetTour()) {
                router.push(characterSheetUrlWithTourOffer(savedCharacterId));
              } else {
                router.push(`/characters/${savedCharacterId}`);
              }
            }, resetCreator);
          }
        }}
        onLeaveElsewhere={() => {
          setShowPlayTogether(false);
          scheduleCreatorReset(resetCreator);
        }}
      />
    </div>
  );
}
