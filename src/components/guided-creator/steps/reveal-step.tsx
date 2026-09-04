/**
 * Your Hero — reveal, identity, Health/Energy, build summary, save.
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, Input, Textarea, useToast } from '@/components/ui';
import {
  useAuth,
  useMergedSpecies,
  useCodexSkills,
  useCodexFeats,
  useGameRules,
  useOfficialLibrary,
  useEquipment,
  useUserItems,
  useUserPowers,
  useUserTechniques,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
  invalidateCharacterLists,
} from '@/hooks';
import { LoginPromptModal } from '@/components/patterns';
import { PlayTogetherModal } from '@/components/onboarding';
import {
  GUIDED_CHAPTERS,
  GUIDED_SUBSTEP_ORDER,
  useGuidedCreatorStore,
  type GuidedSubStep,
} from '@/stores/guided-creator-store';
import { isGuidedSubStepSatisfied } from '@/lib/guided-creator/substep-satisfaction';
import {
  listGuidedRevealBlockers,
  type GuidedRevealBlocker,
} from '@/lib/guided-creator/reveal-blockers';
import { calculateGuidedSkillPointBudget } from '@/lib/guided-creator/skill-reconcile';
import {
  calculateAbilityPoints,
  calculateAbilityScoreCost,
  calculateHealthEnergyPool,
} from '@/lib/game/formulas';
import { averageMixedPhysical } from '@/lib/ancestry/ancestry-selection';
import type { Character } from '@/types';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedRevealSummary } from '../guided-reveal-summary';
import { GuidedPortraitUpload } from '../guided-portrait-upload';
import { GuidedHealthEnergySection } from '../guided-health-energy-section';
import { GuidedSectionTitle } from '../guided-section-title';
import { GuidedRevealReviewModal } from '../guided-reveal-review-modal';
import { buildGuidedCharacterPayload } from '@/lib/guided-creator/build-character';
import { mergeLibraryBySource } from '@/lib/library/source-scope';
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import { cleanForSave } from '@/lib/data-enrichment';
import { persistFinishedCharacter } from '@/lib/character/persist-finished-character';
import { formatCharacterCreateFailureMessage, resolveClientRequestId } from '@/lib/character-save';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { navigateThenResetCreator, scheduleCreatorReset } from '@/lib/creator-save-handoff';
import {
  characterSheetUrlWithTourOffer,
  hasSeenPlayTogether,
  shouldOfferSheetTour,
} from '@/lib/onboarding-preferences';

const stepCopy = GUIDED_CREATOR_COPY.steps.reveal;

function speciesAvgNumber(value: unknown): number | undefined {
  if (value == null) return undefined;
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

export function RevealStep() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { rules } = useGameRules();
  const { draft, updateDraft, resetCreator, setSubStep, canNavigateToSubStep } =
    useGuidedCreatorStore();
  const { archetype, pathData } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: codexFeats = [] } = useCodexFeats();
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: userItems = [] } = useUserItems();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: codexEquipment = [] } = useEquipment();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();

  const [saving, setSaving] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showPlayTogether, setShowPlayTogether] = useState(false);
  const [savedCharacterId, setSavedCharacterId] = useState<string | null>(null);
  /** `saving` state lands a render late — a ref latch closes the same-tick double submit. */
  const saveInFlight = useRef(false);

  const creatorReturnPath = useMemo(() => {
    const qs = searchParams.toString();
    return qs ? `/characters/new/guided?${qs}` : '/characters/new/guided';
  }, [searchParams]);

  /** Same gate as custom finalize: only same-origin relative paths. */
  const postSaveReturnTo = useMemo(() => {
    const raw = searchParams.get('returnTo');
    if (!raw || !raw.startsWith('/')) return null;
    const safe = sanitizeRedirectPath(raw, '');
    return safe || null;
  }, [searchParams]);

  const speciesContext = useMemo(
    () => resolveGuidedSpeciesContext(draft, allSpecies),
    [draft, allSpecies],
  );
  const species = speciesContext.species;
  const mixedPhysical =
    speciesContext.isMixed && speciesContext.speciesA && speciesContext.speciesB
      ? averageMixedPhysical(speciesContext.speciesA, speciesContext.speciesB)
      : null;

  const speciesName = draft.speciesName ?? speciesContext.displayName ?? species?.name ?? null;
  const hePool = calculateHealthEnergyPool(1, 'PLAYER', false, rules);
  const hpBonus = draft.hpAllocated ?? 0;
  const enBonus = draft.energyAllocated ?? 0;
  const remaining = hePool - hpBonus - enBonus;

  const heroSubtitle = [speciesName, archetype?.name].filter(Boolean).join(' · ');

  const avgHeight = mixedPhysical?.aveHeight ?? speciesAvgNumber(species?.ave_height);
  const avgWeight = mixedPhysical?.aveWeight ?? speciesAvgNumber(species?.ave_weight);
  const [adulthoodRaw, lifespanRaw] = species?.adulthood_lifespan ?? [];
  const adulthood = mixedPhysical?.adulthood ?? speciesAvgNumber(adulthoodRaw);
  const lifespan = mixedPhysical?.maxAge ?? speciesAvgNumber(lifespanRaw);

  const agePlaceholder = stepCopy.agePlaceholder(adulthood, lifespan);
  const heightPlaceholder = stepCopy.heightPlaceholder(avgHeight);
  const weightPlaceholder = stepCopy.weightPlaceholder(avgWeight);

  /**
   * Create stays clickable. Leftovers (name, Health/Energy, unspent Skill/Ability
   * points, unfinished chapters) open a review instead of greying the button out.
   */
  const abilityPointsRemaining = useMemo(() => {
    if (draft.abilitiesMode === 'recommended') return 0;
    const total = calculateAbilityPoints(1, false, rules);
    const spent = Object.values(draft.abilities).reduce(
      (sum, value) => sum + calculateAbilityScoreCost(value || 0),
      0,
    );
    return total - spent;
  }, [draft.abilities, draft.abilitiesMode, rules]);

  const skillPointsRemaining = useMemo(
    () =>
      calculateGuidedSkillPointBudget({
        allocations: draft.skills,
        defenseVals: draft.defenseVals,
        selectedSpeciesSkillIds: draft.selectedSpeciesSkillIds,
        declinedPathSkillIds: draft.declinedPathSkillIds,
        recommendedSkillIds: pathData?.level1?.skills,
        speciesContext,
        catalog: codexSkills,
        rules,
      }).remainingPoints,
    [
      codexSkills,
      draft.declinedPathSkillIds,
      draft.defenseVals,
      draft.selectedSpeciesSkillIds,
      draft.skills,
      pathData?.level1?.skills,
      rules,
      speciesContext,
    ],
  );

  const revealBlockers = useMemo(
    () =>
      listGuidedRevealBlockers({
        chapters: GUIDED_CHAPTERS,
        draft,
        healthEnergyRemaining: remaining,
        abilityPointsRemaining,
        skillPointsRemaining,
      }),
    [abilityPointsRemaining, draft, remaining, skillPointsRemaining],
  );
  const canSave = revealBlockers.length === 0;

  const focusRevealTarget = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    if (el instanceof HTMLElement) {
      el.focus({ preventScroll: true });
    }
  };

  const jumpToSubStep = (subStep: GuidedSubStep) => {
    if (canNavigateToSubStep(subStep)) {
      setSubStep(subStep);
      return;
    }
    const fallback = GUIDED_SUBSTEP_ORDER.find(
      (step) =>
        step !== 'reveal' && canNavigateToSubStep(step) && !isGuidedSubStepSatisfied(step, draft),
    );
    if (fallback) setSubStep(fallback);
  };

  const handleBlockerSelect = (blocker: GuidedRevealBlocker) => {
    setShowReview(false);
    if (blocker.kind === 'name') {
      requestAnimationFrame(() => focusRevealTarget('guided-char-name'));
      return;
    }
    if (blocker.kind === 'healthEnergy') {
      requestAnimationFrame(() => focusRevealTarget('guided-health-energy'));
      return;
    }
    jumpToSubStep(blocker.subStep);
  };

  /** Navigate only after a confirmed create; clear draft as we leave. Honors ?returnTo= like custom finalize. */
  const goAfterSave = (characterId: string, offerTour = false) => {
    navigateThenResetCreator(() => {
      if (postSaveReturnTo) {
        router.push(postSaveReturnTo);
      } else if (offerTour && shouldOfferSheetTour()) {
        router.push(characterSheetUrlWithTourOffer(characterId));
      } else {
        router.push(`/characters/${characterId}`);
      }
    }, resetCreator);
  };

  const persistRevealCharacter = async (asGuest: boolean) => {
    if (savedCharacterId || saveInFlight.current) return;
    if (!canSave) return;
    if (!asGuest && !user) {
      setShowLogin(true);
      return;
    }
    saveInFlight.current = true;
    setSaving(true);
    try {
      const payload = buildGuidedCharacterPayload(draft, {
        archetype,
        pathData,
        species,
        speciesA: speciesContext.speciesA,
        speciesB: speciesContext.speciesB,
        codexSkills,
        codexFeats,
        rules,
        officialItems: mergeLibraryBySource('all', officialItems, userItems),
        officialPowers: mergeLibraryBySource('all', officialPowers, userPowers),
        officialTechniques: mergeLibraryBySource('all', officialTechniques, userTechniques),
        codexEquipment,
        powerPartsDb,
        techniquePartsDb,
        itemPropertiesDb,
      });
      const lean = cleanForSave(payload as Character);
      const hasBase64Portrait =
        draft.portraitUrl &&
        typeof draft.portraitUrl === 'string' &&
        draft.portraitUrl.startsWith('data:');
      const base64Portrait = hasBase64Portrait ? draft.portraitUrl : null;
      if (hasBase64Portrait) {
        delete (lean as { portrait?: string | undefined }).portrait;
      }

      const clientRequestId = resolveClientRequestId(draft.clientRequestId);
      if (clientRequestId !== draft.clientRequestId) {
        updateDraft({ clientRequestId });
      }

      const result = await persistFinishedCharacter({
        lean,
        portraitDataUrl: base64Portrait,
        clientRequestId,
        userId: asGuest ? null : user?.uid,
      });
      invalidateCharacterLists(queryClient, user?.uid);
      if (result.portraitWarning) {
        showToast(result.portraitWarning, 'error');
      }

      setSavedCharacterId(result.id);
      setSaving(false);
      setShowLogin(false);
      showToast('Your character is ready!', 'success');
      if (!postSaveReturnTo && !hasSeenPlayTogether()) {
        setShowPlayTogether(true);
      } else {
        goAfterSave(result.id, !postSaveReturnTo);
      }
    } catch (err) {
      showToast(formatCharacterCreateFailureMessage(err, stepCopy), 'error');
      saveInFlight.current = false;
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (revealBlockers.length > 0) {
      setShowReview(true);
      return;
    }
    if (!user) {
      setShowLogin(true);
      return;
    }
    await persistRevealCharacter(false);
  };

  const dismissPlayTogether = (goSheet: boolean) => {
    setShowPlayTogether(false);
    if (goSheet && savedCharacterId) {
      goAfterSave(savedCharacterId, true);
      return;
    }
    // Character already created — clear the wizard even if the user leaves via another CTA.
    scheduleCreatorReset(resetCreator);
  };

  return (
    <>
      <GuidedStepLayout
        subStep="reveal"
        title={stepCopy.title}
        description={stepCopy.description}
        hideBack={false}
        primaryAction={
          <Button
            size="lg"
            onClick={handleSave}
            disabled={saving || !!savedCharacterId || showLogin}
          >
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {saving ? stepCopy.saving : stepCopy.save}
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Hero reveal band — portrait + name */}
          <div className="overflow-hidden rounded-card border border-primary-subtle-border bg-gradient-to-br from-primary-subtle-bg/80 to-surface shadow-sm">
            <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start">
              <GuidedPortraitUpload />
              <div className="w-full min-w-0 flex-1 scroll-mt-24 scroll-mb-32 text-center sm:text-left">
                <label
                  htmlFor="guided-char-name"
                  className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary"
                >
                  {stepCopy.nameLabel}
                </label>
                <Input
                  id="guided-char-name"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder={stepCopy.namePlaceholder}
                  aria-required="true"
                  autoComplete="off"
                  className="font-display text-2xl font-bold text-text-primary placeholder:font-nunito placeholder:text-xl placeholder:font-normal"
                />
                {heroSubtitle && (
                  <p className="mt-2 font-nunito text-sm text-text-secondary">{heroSubtitle}</p>
                )}
              </div>
            </div>
          </div>

          {/* Identity details */}
          <div className="space-y-4 rounded-card border border-border-light bg-surface p-5 shadow-sm">
            <GuidedSectionTitle>{stepCopy.identityTitle}</GuidedSectionTitle>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label
                  htmlFor="guided-char-age"
                  className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary"
                >
                  {stepCopy.ageLabel}
                </label>
                <Input
                  id="guided-char-age"
                  type="number"
                  min={1}
                  value={draft.age}
                  onChange={(e) => updateDraft({ age: e.target.value })}
                  placeholder={agePlaceholder}
                  className="font-nunito"
                />
              </div>
              <div>
                <label
                  htmlFor="guided-char-height"
                  className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary"
                >
                  {stepCopy.heightLabel}
                </label>
                <Input
                  id="guided-char-height"
                  type="number"
                  min={0}
                  value={draft.heightCm ?? ''}
                  onChange={(e) =>
                    updateDraft({ heightCm: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={heightPlaceholder}
                  className="font-nunito"
                />
              </div>
              <div>
                <label
                  htmlFor="guided-char-weight"
                  className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary"
                >
                  {stepCopy.weightLabel}
                </label>
                <Input
                  id="guided-char-weight"
                  type="number"
                  min={0}
                  value={draft.weightKg ?? ''}
                  onChange={(e) =>
                    updateDraft({ weightKg: e.target.value ? Number(e.target.value) : null })
                  }
                  placeholder={weightPlaceholder}
                  className="font-nunito"
                />
              </div>
            </div>

            <Textarea
              label={stepCopy.appearanceLabel}
              value={draft.appearanceNotes}
              onChange={(e) => updateDraft({ appearanceNotes: e.target.value })}
              placeholder={stepCopy.appearancePlaceholder}
              rows={2}
              className="resize-none font-nunito"
            />

            <Textarea
              label={stepCopy.descriptionLabel}
              value={draft.description}
              onChange={(e) => updateDraft({ description: e.target.value })}
              placeholder={stepCopy.descriptionPlaceholder}
              rows={2}
              className="resize-none font-nunito"
            />
          </div>

          <GuidedHealthEnergySection />

          <GuidedRevealSummary />
        </div>
      </GuidedStepLayout>

      <GuidedRevealReviewModal
        isOpen={showReview}
        blockers={revealBlockers}
        onClose={() => setShowReview(false)}
        onSelect={handleBlockerSelect}
      />

      <LoginPromptModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        returnPath={creatorReturnPath}
        contentType="character"
        onContinueWithoutSigningIn={() => persistRevealCharacter(true)}
      />

      <PlayTogetherModal
        isOpen={showPlayTogether}
        onViewCharacter={() => dismissPlayTogether(true)}
        onLeaveElsewhere={() => dismissPlayTogether(false)}
      />
    </>
  );
}
