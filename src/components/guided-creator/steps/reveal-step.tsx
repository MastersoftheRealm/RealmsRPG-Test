/**
 * Your Hero — reveal, identity, build summary, HP/EN, save.
 */

'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Sparkles, User } from 'lucide-react';
import { Button, Input, Modal, Textarea, useToast } from '@/components/ui';
import { useAuth, useMergedSpecies, useCodexSkills, useTraits, useGameRules } from '@/hooks';
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
import type { Character } from '@/types';
import { MarketingExternalButton, MarketingLinkButton } from '@/components/landing/marketing-button';
import { DISCORD_URL } from '@/lib/constants/site-copy';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { calculateHealthEnergyPool } from '@/lib/game/formulas';

const stepCopy = GUIDED_CREATOR_COPY.steps.reveal;

const PLAY_TOGETHER_KEY = 'realms_seen_play_together_prompt';

export function RevealStep() {
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { rules } = useGameRules();
  const { draft, updateDraft, resetCreator } = useGuidedCreatorStore();
  const { archetype, pathData } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: allTraits = [] } = useTraits();

  const [saving, setSaving] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showPlayTogether, setShowPlayTogether] = useState(false);
  const [savedCharacterId, setSavedCharacterId] = useState<string | null>(null);

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)) ?? null,
    [allSpecies, draft.speciesId]
  );

  const speciesName = draft.speciesName ?? species?.name ?? null;
  const hePool = calculateHealthEnergyPool(1, 'PLAYER', false, rules);
  const hpBonus = draft.hpAllocated ?? 0;
  const enBonus = draft.energyAllocated ?? 0;
  const remaining = hePool - hpBonus - enBonus;

  const displayName = draft.name.trim() || stepCopy.heroUnnamed;
  const heroSubtitle = [speciesName, archetype?.name].filter(Boolean).join(' · ');

  const canSave = draft.name.trim().length > 0 && remaining === 0;

  const handleSave = async () => {
    if (!user) {
      setShowLogin(true);
      return;
    }
    setSaving(true);
    try {
      const payload = buildGuidedCharacterPayload(draft, {
        archetype,
        pathData,
        species,
        allTraits,
        codexSkills,
        rules,
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

      if (base64Portrait && characterId) {
        try {
          const blob = dataUrlToBlob(base64Portrait);
          const file = new File([blob], 'portrait.jpg', {
            type: blob.type?.startsWith('image/') ? blob.type : 'image/jpeg',
          });
          const formData = new FormData();
          formData.append('file', file);
          formData.append('characterId', characterId);
          const uploadRes = await apiUpload<{ url: string }>('/api/upload/portrait', formData);
          if (uploadRes.url) {
            await saveCharacter(characterId, { portrait: uploadRes.url });
          }
        } catch {
          showToast('Character saved. Add a portrait from your character sheet.', 'error');
        }
      }

      setSavedCharacterId(characterId);
      resetCreator();
      showToast('Your character is ready!', 'success');
      const seen = localStorage.getItem(PLAY_TOGETHER_KEY);
      if (!seen) {
        setShowPlayTogether(true);
      } else {
        router.push(`/characters/${characterId}`);
      }
    } catch {
      showToast('Failed to save character. Please try again.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const dismissPlayTogether = (goSheet: boolean) => {
    localStorage.setItem(PLAY_TOGETHER_KEY, '1');
    setShowPlayTogether(false);
    if (goSheet && savedCharacterId) {
      router.push(`/characters/${savedCharacterId}`);
    }
  };

  return (
    <>
      <GuidedStepLayout
        subStep="reveal"
        title={stepCopy.title}
        description={stepCopy.description}
        hideBack={false}
        primaryAction={
          <Button onClick={handleSave} disabled={!canSave || saving} className="min-h-11">
            <Sparkles className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {saving ? stepCopy.saving : stepCopy.save}
          </Button>
        }
      >
        <div className="space-y-6">
          {/* Hero reveal band */}
          <div className="overflow-hidden rounded-card border border-primary-subtle-border bg-gradient-to-br from-primary-subtle-bg/80 to-surface shadow-sm">
            <div className="flex flex-col items-center gap-5 p-5 sm:flex-row sm:items-start">
              <div className="relative flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-card border-2 border-border-light bg-surface-alt shadow-sm">
                {draft.portraitUrl ? (
                  draft.portraitUrl.startsWith('data:') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={draft.portraitUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Image src={draft.portraitUrl} alt="" fill sizes="96px" className="object-cover" />
                  )
                ) : (
                  <User className="h-10 w-10 text-text-muted dark:text-text-secondary" aria-hidden="true" />
                )}
              </div>
              <div className="min-w-0 flex-1 text-center sm:text-left">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-primary-fg">
                  {stepCopy.heroLevel}
                </p>
                <h3 className="truncate font-display text-2xl font-bold text-text-primary">{displayName}</h3>
                {heroSubtitle && (
                  <p className="mt-1 font-nunito text-sm text-text-secondary">{heroSubtitle}</p>
                )}
              </div>
            </div>
          </div>

          <GuidedRevealSummary />

          {/* Identity */}
          <div className="space-y-4 rounded-card border border-border-light bg-surface p-5 shadow-sm">
            <h3 className="font-display text-lg font-bold text-text-primary">{stepCopy.identityTitle}</h3>

            <div>
              <label htmlFor="guided-char-name" className="mb-1.5 block font-display text-sm font-semibold text-text-primary">
                {stepCopy.nameLabel}
              </label>
              <Input
                id="guided-char-name"
                value={draft.name}
                onChange={(e) => updateDraft({ name: e.target.value })}
                placeholder={stepCopy.namePlaceholder}
                className="font-nunito"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="guided-char-age" className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary">
                  {stepCopy.ageLabel}
                </label>
                <Input
                  id="guided-char-age"
                  type="number"
                  min={1}
                  value={draft.age}
                  onChange={(e) => updateDraft({ age: e.target.value })}
                  placeholder="—"
                  className="font-nunito"
                />
              </div>
              <div>
                <label htmlFor="guided-char-height" className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary">
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
                  placeholder="—"
                  className="font-nunito"
                />
              </div>
              <div>
                <label htmlFor="guided-char-weight" className="mb-1.5 block font-nunito text-sm font-medium text-text-secondary">
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
                  placeholder="—"
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

            <GuidedPortraitUpload />
          </div>

          <GuidedHealthEnergySection />
        </div>
      </GuidedStepLayout>

      <Modal
        isOpen={showLogin}
        onClose={() => setShowLogin(false)}
        title={stepCopy.loginModal.title}
        description={stepCopy.loginModal.description}
        fullScreenOnMobile
      >
        <div className="flex flex-col gap-3 p-4">
          <MarketingLinkButton href="/login?next=/characters/new/guided" size="lg" className="w-full">
            {stepCopy.loginModal.signIn}
          </MarketingLinkButton>
          <MarketingLinkButton href="/register?next=/characters/new/guided" variant="outline" size="lg" className="w-full">
            {stepCopy.loginModal.register}
          </MarketingLinkButton>
        </div>
      </Modal>

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
            <MarketingExternalButton href={DISCORD_URL} size="lg" className="w-full">
              {stepCopy.playTogetherModal.discord}
            </MarketingExternalButton>
          )}
          <MarketingLinkButton href="/campaigns" variant="outline" size="lg" className="w-full">
            {stepCopy.playTogetherModal.campaigns}
          </MarketingLinkButton>
          <MarketingLinkButton href="/campaigns?tab=create" variant="outline" size="lg" className="w-full">
            {stepCopy.playTogetherModal.runGames}
          </MarketingLinkButton>
        </div>
      </Modal>
    </>
  );
}
