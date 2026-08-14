/**
 * Your Hero — reveal, identity, Health/Energy, build summary, save.
 */

'use client';

import { useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
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
} from '@/hooks';
import { LoginPromptModal } from '@/components/shared';
import { PlayTogetherModal } from '@/components/onboarding';
import { GUIDED_SUBSTEP_ORDER, useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { isGuidedDraftSaveable } from '@/lib/guided-creator/substep-satisfaction';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedRevealSummary } from '../guided-reveal-summary';
import { GuidedPortraitUpload } from '../guided-portrait-upload';
import { GuidedHealthEnergySection } from '../guided-health-energy-section';
import { GuidedSectionTitle } from '../guided-section-title';
import { buildGuidedCharacterPayload } from '@/lib/guided-creator/build-character';
import { mergeLibraryBySource } from '@/lib/library/source-scope';
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import { averageMixedPhysical } from '@/lib/ancestry/ancestry-selection';
import { cleanForSave } from '@/lib/data-enrichment';
import { createCharacter, saveCharacter } from '@/services/character-service';
import { resolveClientRequestId } from '@/lib/character-save';
import {
  PORTRAIT_SAVE_UPLOAD_FALLBACK,
  uploadCharacterPortraitFromDataUrl,
} from '@/lib/portrait';
import { getErrorMessage } from '@/lib/api-client';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import type { Character } from '@/types';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { calculateHealthEnergyPool } from '@/lib/game/formulas';
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
  const { user } = useAuth();
  const { showToast } = useToast();
  const { rules } = useGameRules();
  const { draft, updateDraft, resetCreator } = useGuidedCreatorStore();
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
    [draft, allSpecies]
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
   * Every sub-step must still hold its picks — a chapter-rail jump back to Foundation clears
   * abilities/skills/feats/loadout/powers, and this is the gate that used to let the gutted
   * draft through on name + Health/Energy alone.
   */
  const draftSaveable = isGuidedDraftSaveable(GUIDED_SUBSTEP_ORDER, draft);
  const canSave = draftSaveable && remaining === 0;

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

  const handleSave = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    if (savedCharacterId || saveInFlight.current) return;
    if (!canSave) return;
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
        delete (lean as { portrait?: string }).portrait;
      }

      const clientRequestId = resolveClientRequestId(draft.clientRequestId);
      if (clientRequestId !== draft.clientRequestId) {
        updateDraft({ clientRequestId });
      }
      const characterId = await createCharacter(
        { ...lean, userId: user.uid },
        { clientRequestId }
      );
      if (!characterId?.trim()) {
        throw new Error('Character was created but no id was returned');
      }

      if (base64Portrait) {
        try {
          const { url } = await uploadCharacterPortraitFromDataUrl(characterId, base64Portrait);
          await saveCharacter(characterId, { portrait: url });
        } catch (err) {
          showToast(getErrorMessage(err, PORTRAIT_SAVE_UPLOAD_FALLBACK), 'error');
        }
      }

      // Keep the guided draft until create succeeded — only clear when leaving for the sheet.
      setSavedCharacterId(characterId);
      // `savedCharacterId` keeps the button disabled from here on, so `saving` can settle:
      // leaving it true stranded Finish whenever play-together closed by another route.
      setSaving(false);
      showToast('Your character is ready!', 'success');
      // Campaign/join returnTo skips play-together (custom finalize goes straight to returnTo).
      if (!postSaveReturnTo && !hasSeenPlayTogether()) {
        setShowPlayTogether(true);
      } else {
        goAfterSave(characterId, !postSaveReturnTo);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Failed to save character. Please try again.';
      showToast(`${message} ${stepCopy.saveRetryHint}`, 'error');
      saveInFlight.current = false;
      setSaving(false);
    }
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
        completionHint={
          !draftSaveable ? (
            <span className="font-nunito text-warning-fg">{stepCopy.incompleteHint}</span>
          ) : undefined
        }
        primaryAction={
          <Button
            onClick={handleSave}
            disabled={!canSave || saving || !!savedCharacterId}
            className="min-h-11"
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
              <div className="min-w-0 w-full flex-1 text-center sm:text-left">
                <label htmlFor="guided-char-name" className="sr-only">
                  {stepCopy.nameLabel}
                </label>
                <Input
                  id="guided-char-name"
                  value={draft.name}
                  onChange={(e) => updateDraft({ name: e.target.value })}
                  placeholder={stepCopy.namePlaceholder}
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

      <LoginPromptModal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        returnPath={creatorReturnPath}
        contentType="character"
      />

      <PlayTogetherModal
        isOpen={showPlayTogether}
        onViewCharacter={() => dismissPlayTogether(true)}
        onLeaveElsewhere={() => dismissPlayTogether(false)}
      />
    </>
  );
}
