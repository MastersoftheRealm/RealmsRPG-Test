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
import { cn, indexByNormalizedIds, normalizeId } from '@/lib/utils';
import { User } from 'lucide-react';
import { DescriptorChip } from '@/components/ui';
import { ExpandableImage } from '@/components/patterns';
import { useMergedSpecies, useCodexFeats } from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import {
  buildPreviewAbilityChips,
  previewAbilityTileClass,
  shouldShowPreviewAbilityChips,
} from '@/lib/guided-creator/preview-ability-summary';
import { isGuidedSubStepSatisfied } from '@/lib/guided-creator/substep-satisfaction';
import { ARCHETYPE_CATEGORY_INFO } from '@/lib/constants/copy/archetype-category-copy';
import { useGuidedPathData } from './use-guided-path-data';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

function PreviewChip({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: 'power' | 'martial' | null | undefined;
}) {
  return (
    <div className={previewAbilityTileClass(highlight ?? null)}>
      <div className="font-nunito text-[10px] tracking-wide text-text-muted uppercase">{label}</div>
      <div className="truncate font-display text-sm font-semibold text-text-primary">{value}</div>
    </div>
  );
}

export interface CharacterPreviewPanelProps {
  className?: string | undefined;
  variant?: 'strip' | 'panel' | undefined;
}

export function CharacterPreviewPanel({
  className,
  variant = 'panel',
}: CharacterPreviewPanelProps) {
  const draft = useGuidedCreatorStore((s) => s.draft);
  const { archetype } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: feats = [] } = useCodexFeats();

  const copy = variant === 'strip' ? GUIDED_CREATOR_COPY.strip : GUIDED_CREATOR_COPY.preview;

  const speciesContext = useMemo(
    () => resolveGuidedSpeciesContext(draft, allSpecies),
    [draft, allSpecies],
  );

  const speciesName = speciesContext.displayName;

  const species = speciesContext.species;

  const skillCount = useMemo(() => {
    const ids = new Set<string>();
    if (speciesContext.isMixed) {
      draft.selectedSpeciesSkillIds.forEach((id) => {
        if (String(id) !== '0') ids.add(String(id));
      });
    } else {
      (species?.skills ?? []).forEach((id) => {
        if (String(id) !== '0') ids.add(String(id));
      });
    }
    Object.keys(draft.skills ?? {}).forEach((id) => ids.add(String(id)));
    return ids.size;
  }, [speciesContext.isMixed, species, draft.selectedSpeciesSkillIds, draft.skills]);

  const featNames = useMemo(() => {
    const ids = [...draft.archetypeFeatIds, ...draft.characterFeatIds];
    if (ids.length === 0) return [];
    const byId = indexByNormalizedIds(feats);
    return ids
      .map((id) => byId.get(normalizeId(id))?.name)
      .filter((name): name is string => Boolean(name));
  }, [draft.archetypeFeatIds, draft.characterFeatIds, feats]);

  /** All six abilities with signed values; gated until Abilities step (TASK-694). */
  const showAbilityChips = shouldShowPreviewAbilityChips({
    abilitiesMode: draft.abilitiesMode,
    abilitiesStepCompleted: isGuidedSubStepSatisfied('abilities', draft),
  });

  const abilityChips = useMemo(
    () =>
      buildPreviewAbilityChips(draft.abilities, {
        draftPowAbil: draft.pow_abil,
        draftMartAbil: draft.mart_abil,
        archetypePowAbil: archetype?.pow_abil,
        archetypeMartAbil: archetype?.mart_abil,
        archetypePrimary: archetype?.archetype_ability,
        archetypeType: draft.archetypeType,
      }),
    [
      draft.abilities,
      draft.pow_abil,
      draft.mart_abil,
      draft.archetypeType,
      archetype?.pow_abil,
      archetype?.mart_abil,
      archetype?.archetype_ability,
    ],
  );

  /** Path name when forging from a codex path; category label when custom — subtitle only (TASK-694). */
  const archetypeChipLabel = useMemo(() => {
    if (archetype?.name) return archetype.name;
    if (draft.archetypeType) return ARCHETYPE_CATEGORY_INFO[draft.archetypeType].title;
    return null;
  }, [archetype, draft.archetypeType]);

  const powerTechniqueCount = draft.powerIds.length + draft.techniqueIds.length;
  const subtitle =
    [speciesName, archetypeChipLabel].filter(Boolean).join(' · ') || copy.defaultSubtitle;
  const displayName = draft.name?.trim() || copy.defaultName;

  if (variant === 'strip') {
    return (
      <aside
        className={cn(
          'flex items-center gap-3 rounded-card border border-border-light dark:border-border',
          'bg-surface-alt/50 px-3 py-2.5 shadow-card sm:px-4 sm:py-3',
          className,
        )}
        aria-label="Character preview"
      >
        {draft.portraitUrl ? (
          <ExpandableImage
            src={draft.portraitUrl}
            alt={displayName}
            stopPropagation={false}
            className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-image-matte"
          >
            <Image src={draft.portraitUrl} alt="" fill sizes="40px" className="object-contain" />
          </ExpandableImage>
        ) : (
          <span className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-alt">
            <User className="h-5 w-5 text-text-muted" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-sm font-semibold text-text-primary sm:text-base">
            {displayName}
          </div>
          <div className="truncate font-nunito text-xs text-text-secondary sm:text-sm">
            {subtitle}
          </div>
        </div>
        {showAbilityChips && abilityChips.length > 0 && (
          <div className="flex max-w-[min(100%,22rem)] shrink-0 items-center gap-1 overflow-x-auto sm:max-w-[55%] sm:gap-1.5 md:max-w-none md:flex-wrap">
            {abilityChips.map((chip) => (
              <DescriptorChip key={chip.ability} variant={chip.chipVariant} size="sm">
                {chip.abbr} {chip.display}
              </DescriptorChip>
            ))}
          </div>
        )}
      </aside>
    );
  }

  return (
    <aside
      className={cn(
        'rounded-card border border-border-light bg-surface-alt/60 p-4 shadow-card sm:p-5 dark:border-border',
        className,
      )}
      aria-label="Character preview"
    >
      <div className="flex items-center gap-3">
        {draft.portraitUrl ? (
          <ExpandableImage
            src={draft.portraitUrl}
            alt={displayName}
            stopPropagation={false}
            className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-image-matte shadow-sm"
          >
            <Image src={draft.portraitUrl} alt="" fill sizes="64px" className="object-contain" />
          </ExpandableImage>
        ) : (
          <span className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-card bg-surface-alt shadow-sm">
            <User className="h-8 w-8 text-text-muted" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <div className="truncate font-display text-lg font-semibold text-text-primary">
            {displayName}
          </div>
          <div className="truncate font-nunito text-sm text-text-secondary">{subtitle}</div>
        </div>
      </div>

      {showAbilityChips && (
        <div className="mt-4 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {abilityChips.map((chip) => (
            <PreviewChip
              key={chip.ability}
              label={chip.abbr}
              value={chip.display}
              highlight={chip.highlight}
            />
          ))}
        </div>
      )}

      <dl className="mt-4 space-y-2 font-nunito text-sm">
        {draft.selectedAncestryTraitIds.length > 0 && (
          <div className="flex justify-between gap-2">
            <dt className="text-text-secondary">Ancestry traits</dt>
            <dd className="font-medium text-text-primary">
              {draft.selectedAncestryTraitIds.length}
            </dd>
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
            <dd className="max-w-[60%] truncate text-right font-medium text-text-primary">
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
