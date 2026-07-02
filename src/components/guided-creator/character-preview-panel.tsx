/**
 * CharacterPreviewPanel
 * =====================
 * Live summary of the in-progress character.
 * - `strip`: compact full-width bar (default in shell — does not steal horizontal space from steps)
 * - `panel`: taller summary for reveal / mobile expand
 */

'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { User } from 'lucide-react';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useMergedSpecies, useCodexFeats } from '@/hooks';
import { useGuidedPathData } from './use-guided-path-data';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import type { AbilityName } from '@/types';

const ABILITY_ABBR: Record<AbilityName, string> = {
  strength: 'STR',
  vitality: 'VIT',
  agility: 'AGI',
  acuity: 'ACU',
  intelligence: 'INT',
  charisma: 'CHA',
};

function PreviewChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-card bg-surface px-2.5 py-1.5 border border-border-light dark:border-border">
      <div className="font-nunito text-[10px] uppercase tracking-wide text-text-muted dark:text-text-secondary">
        {label}
      </div>
      <div className="font-display text-sm font-semibold text-text-primary truncate">{value}</div>
    </div>
  );
}

export interface CharacterPreviewPanelProps {
  className?: string;
  variant?: 'strip' | 'panel';
}

export function CharacterPreviewPanel({ className, variant = 'panel' }: CharacterPreviewPanelProps) {
  const draft = useGuidedCreatorStore((s) => s.draft);
  const { archetype } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: feats = [] } = useCodexFeats();

  const copy = variant === 'strip' ? GUIDED_CREATOR_COPY.strip : GUIDED_CREATOR_COPY.preview;

  const speciesName = useMemo(() => {
    if (draft.speciesName) return draft.speciesName;
    if (!draft.speciesId) return null;
    const match = allSpecies.find((s) => String(s.id) === String(draft.speciesId));
    return match?.name ?? null;
  }, [draft.speciesName, draft.speciesId, allSpecies]);

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)),
    [allSpecies, draft.speciesId]
  );

  const skillCount = useMemo(() => {
    const ids = new Set<string>();
    (species?.skills ?? []).forEach((id) => {
      if (String(id) !== '0') ids.add(String(id));
    });
    Object.keys(draft.skills ?? {}).forEach((id) => ids.add(String(id)));
    return ids.size;
  }, [species, draft.skills]);

  const featNames = useMemo(() => {
    const ids = [...draft.archetypeFeatIds, ...draft.characterFeatIds];
    if (ids.length === 0) return [];
    const byId = new Map(feats.map((f) => [String(f.id), f.name]));
    return ids.map((id) => byId.get(String(id)) ?? id);
  }, [draft.archetypeFeatIds, draft.characterFeatIds, feats]);

  const topAbilities = useMemo(() => {
    return (Object.entries(draft.abilities) as [AbilityName, number][])
      .filter(([, v]) => v !== 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);
  }, [draft.abilities]);

  const powerTechniqueCount = draft.powerIds.length + draft.techniqueIds.length;
  const subtitle = [speciesName, archetype?.name].filter(Boolean).join(' · ') || copy.defaultSubtitle;
  const displayName = draft.name?.trim() || copy.defaultName;

  if (variant === 'strip') {
    return (
      <aside
        className={cn(
          'flex items-center gap-3 rounded-card border border-border-light dark:border-border',
          'bg-surface-alt/50 px-3 py-2.5 sm:px-4 sm:py-3 shadow-card',
          className
        )}
        aria-label="Character preview"
      >
        <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-alt">
          {draft.portraitUrl ? (
            <Image src={draft.portraitUrl} alt="" fill sizes="40px" className="object-cover" />
          ) : (
            <User className="h-5 w-5 text-text-muted dark:text-text-secondary" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold text-text-primary sm:text-base">
            {displayName}
          </div>
          <div className="truncate font-nunito text-xs text-text-secondary sm:text-sm">{subtitle}</div>
        </div>
        {(archetype?.name || topAbilities.length > 0) && (
          <div className="hidden shrink-0 items-center gap-2 sm:flex">
            {archetype?.name && (
              <span className="rounded-pill bg-surface px-2.5 py-1 font-nunito text-xs font-medium text-text-secondary">
                {archetype.name}
              </span>
            )}
            {topAbilities.slice(0, 2).map(([ability, value]) => (
              <span
                key={ability}
                className="rounded-pill bg-surface px-2 py-1 font-nunito text-xs font-medium text-text-primary"
              >
                {ABILITY_ABBR[ability]} {value > 0 ? `+${value}` : value}
              </span>
            ))}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-card border border-border-light dark:border-border bg-surface-alt/60 p-4 sm:p-5 shadow-card',
        className
      )}
      aria-label="Character preview"
    >
      <div className="flex items-center gap-3">
        <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-surface-alt shadow-sm">
          {draft.portraitUrl ? (
            <Image src={draft.portraitUrl} alt="" fill sizes="64px" className="object-cover" />
          ) : (
            <User className="h-8 w-8 text-text-muted dark:text-text-secondary" aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-semibold text-text-primary">{displayName}</div>
          <div className="truncate font-nunito text-sm text-text-secondary">{subtitle}</div>
        </div>
      </div>

      {topAbilities.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2">
          {topAbilities.map(([ability, value]) => (
            <PreviewChip
              key={ability}
              label={ABILITY_ABBR[ability]}
              value={value > 0 ? `+${value}` : String(value)}
            />
          ))}
        </div>
      )}

      <dl className="mt-4 space-y-2 font-nunito text-sm">
        {archetype?.name && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-secondary">Path</dt>
            <dd className="font-medium text-text-primary text-right truncate">{archetype.name}</dd>
          </div>
        )}
        {draft.selectedAncestryTraitIds.length > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-secondary">Ancestry traits</dt>
            <dd className="font-medium text-text-primary">{draft.selectedAncestryTraitIds.length}</dd>
          </div>
        )}
        {skillCount > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-secondary">Skills</dt>
            <dd className="font-medium text-text-primary">{skillCount}</dd>
          </div>
        )}
        {featNames.length > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-secondary">Feats</dt>
            <dd className="font-medium text-text-primary text-right truncate max-w-[60%]">
              {featNames.length <= 2 ? featNames.join(', ') : `${featNames.length} selected`}
            </dd>
          </div>
        )}
        {powerTechniqueCount > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-secondary">Powers / Techniques</dt>
            <dd className="font-medium text-text-primary">{powerTechniqueCount}</dd>
          </div>
        )}
      </dl>
    </aside>
  );
}
