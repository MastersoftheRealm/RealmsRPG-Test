/**
 * Your Hero — reveal, identity, Health/Energy, build summary, save.
 */

'use client';

import { useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles } from 'lucide-react';
import { Button, Input, Modal, Textarea, useToast } from '@/components/ui';
import {
  useAuth,
  useMergedSpecies,
  useCodexSkills,
  useCodexFeats,
  useTraits,
  useGameRules,
  useOfficialLibrary,
  useEquipment,
  usePowerParts,
  useTechniqueParts,
  useItemProperties,
} from '@/hooks';
import { LoginPromptModal } from '@/components/shared';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from '../use-guided-path-data';
import { GuidedStepLayout } from '../guided-step-layout';
import { GuidedRevealSummary } from '../guided-reveal-summary';
import { GuidedPortraitUpload } from '../guided-portrait-upload';
import { GuidedHealthEnergySection } from '../guided-health-energy-section';
import { buildGuidedCharacterPayload } from '@/lib/guided-creator/build-character';
import { cleanForSave } from '@/lib/data-enrichment';
import { createCharacter, saveCharacter } from '@/services/character-service';
import { dataUrlToBlob } from '@/lib/portrait';
import { apiUpload } from '@/lib/api-client';
import { sanitizeRedirectPath } from '@/lib/safe-redirect';
import type { Character } from '@/types';
import { MarketingExternalButton, MarketingLinkButton } from '@/components/landing/marketing-button';
import { DISCORD_URL } from '@/lib/constants/site-copy';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { calculateHealthEnergyPool } from '@/lib/game/formulas';
import { navigateThenResetCreator, scheduleCreatorReset } from '@/lib/creator-save-handoff';

const stepCopy = GUIDED_CREATOR_COPY.steps.reveal;

const PLAY_TOGETHER_KEY = 'realms_seen_play_together_prompt';

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
  const { data: allTraits = [] } = useTraits();
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const { data: codexEquipment = [] } = useEquipment();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();
  const { data: itemPropertiesDb = [] } = useItemProperties();

  const [saving, setSaving] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPlayTogether, setShowPlayTogether] = useState(false);
  const [savedCharacterId, setSavedCharacterId] = useState<string | null>(null);

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

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)) ?? null,
    [allSpecies, draft.speciesId]
  );

  const speciesName = draft.speciesName ?? species?.name ?? null;
  const hePool = calculateHealthEnergyPool(1, 'PLAYER', false, rules);
  const hpBonus = draft.hpAllocated ?? 0;
  const enBonus = draft.energyAllocated ?? 0;
  const remaining = hePool - hpBonus - enBonus;

  const heroSubtitle = [speciesName, archetype?.name].filter(Boolean).join(' · ');

  const avgHeight = speciesAvgNumber(species?.ave_height);
  const avgWeight = speciesAvgNumber(species?.ave_weight);
  const [adulthoodRaw, lifespanRaw] = species?.adulthood_lifespan ?? [];
  const adulthood = speciesAvgNumber(adulthoodRaw);
  const lifespan = speciesAvgNumber(lifespanRaw);

  const agePlaceholder = stepCopy.agePlaceholder(adulthood, lifespan);
  const heightPlaceholder = stepCopy.heightPlaceholder(avgHeight);
  const weightPlaceholder = stepCopy.weightPlaceholder(avgWeight);

  const canSave = draft.name.trim().length > 0 && remaining === 0;

  /** Navigate only after a confirmed create; clear draft as we leave. Honors ?returnTo= like custom finalize. */
  const goAfterSave = (characterId: string) => {
    navigateThenResetCreator(() => {
      if (postSaveReturnTo) {
        router.push(postSaveReturnTo);
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
    if (savedCharacterId || saving) return;
    setSaving(true);
    try {
      const payload = buildGuidedCharacterPayload(draft, {
        archetype,
        pathData,
        species,
        allTraits,
        codexSkills,
        codexFeats,
        rules,
        officialItems,
        officialPowers,
        officialTechniques,
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

      const characterId = await createCharacter({ ...lean, userId: user.uid });
      if (!characterId?.trim()) {
        throw new Error('Character was created but no id was returned');
      }

      if (base64Portrait) {
        try {
          const blob = dataUrlToBlob(base64Portrait);
          const file = new File([blob], 'portrait.jpg', {
            type: blob.type?.startsWith('image/') ? blob.type : 'image/jpeg',
          });
          const formData = new FormData();
          formData.append('file', file);
          formData.append('characterId', characterId);
          const uploadRes = await apiUpload<{ url: string }>('/api/upload/portrait', formData);
          if (!uploadRes.url) {
            showToast(
              'Portrait upload returned no URL. Add a portrait from your character sheet.',
              'error'
            );
          } else {
            await saveCharacter(characterId, { portrait: uploadRes.url });
          }
        } catch {
          showToast(
            'Could not process or upload your portrait. Your character was created. Add a portrait from the sheet.',
            'error'
          );
        }
      }

      // Keep the guided draft until create succeeded — only clear when leaving for the sheet.
      setSavedCharacterId(characterId);
      showToast('Your character is ready!', 'success');
      // Campaign/join returnTo skips play-together (custom finalize goes straight to returnTo).
      const seen = localStorage.getItem(PLAY_TOGETHER_KEY);
      if (!postSaveReturnTo && !seen) {
        setShowPlayTogether(true);
        // Leave `saving` true so Finish stays disabled while play-together is open.
      } else {
        goAfterSave(characterId);
      }
    } catch (err) {
      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : 'Failed to save character. Please try again.';
      showToast(message, 'error');
      setSaving(false);
    }
  };

  const dismissPlayTogether = (goSheet: boolean) => {
    localStorage.setItem(PLAY_TOGETHER_KEY, '1');
    setShowPlayTogether(false);
    if (goSheet && savedCharacterId) {
      goAfterSave(savedCharacterId);
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
            <h3 className="font-display text-lg font-bold text-text-primary">{stepCopy.identityTitle}</h3>

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

      <Modal
        isOpen={showPlayTogether}
        onClose={() => dismissPlayTogether(true)}
        title={stepCopy.playTogetherModal.title}
        description={stepCopy.playTogetherModal.description}
        fullScreenOnMobile
        footer={
          <div className="flex flex-col gap-3 border-t border-border-light p-4 sm:flex-row">
            <Button variant="secondary" onClick={() => dismissPlayTogether(true)} className="min-h-11">
              {stepCopy.playTogetherModal.viewCharacter}
            </Button>
          </div>
        }
      >
        <div className="space-y-3 p-4">
          {DISCORD_URL && (
            <MarketingExternalButton
              href={DISCORD_URL}
              size="lg"
              className="w-full"
              onClick={() => localStorage.setItem(PLAY_TOGETHER_KEY, '1')}
            >
              {stepCopy.playTogetherModal.discord}
            </MarketingExternalButton>
          )}
          <MarketingLinkButton
            href="/campaigns"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => dismissPlayTogether(false)}
          >
            {stepCopy.playTogetherModal.campaigns}
          </MarketingLinkButton>
          <MarketingLinkButton
            href="/campaigns?tab=create"
            variant="outline"
            size="lg"
            className="w-full"
            onClick={() => dismissPlayTogether(false)}
          >
            {stepCopy.playTogetherModal.runGames}
          </MarketingLinkButton>
        </div>
      </Modal>
    </>
  );
}
