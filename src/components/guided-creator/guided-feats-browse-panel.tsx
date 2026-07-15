/**
 * GuidedFeatsBrowsePanel — Layer 2 filtered ranked feat list (REALMS §5.6).
 * Shown in-step via GuidedLayerNav (abilities / species grammar), not a modal.
 */

'use client';

import { useMemo, useState, useId, useCallback } from 'react';
import { SearchInput, EmptyState } from '@/components/ui';
import { useCodexSkills, type Feat } from '@/hooks';
import { checkFeatRequirements } from '@/lib/game/feat-requirements';
import { normalizeFeatAbilities } from '@/lib/codex/feat-ability';
import { getFeatLevel, groupFeatFamilies, formatFeatName } from '@/lib/leveled-feats';
import { applyCappedIdSelection } from '@/lib/guided-creator/feat-selection';
import type { CharacterForFeatRequirement } from '@/lib/game/feat-requirements';
import { GuidedChoiceCard } from './guided-choice-card';
import { GuidedFeatRestrictionNotice } from './guided-feat-restriction-notice';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from './guided-choice-styles';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const browseCopy = GUIDED_CREATOR_COPY.steps.featsBrowse;

export interface GuidedFeatsBrowsePanelProps {
  featType: 'archetype' | 'character';
  feats: Feat[];
  selectedIds: string[];
  maxSelections: number;
  onSelectionChange: (ids: string[]) => void;
  /** Path / guidance-group feat ids — pinned and labeled Recommended. */
  recommendedIds?: string[];
  requirementCharacter: CharacterForFeatRequirement;
}

export function GuidedFeatsBrowsePanel({
  featType,
  feats,
  selectedIds,
  maxSelections,
  onSelectionChange,
  recommendedIds = [],
  requirementCharacter,
}: GuidedFeatsBrowsePanelProps) {
  const categorySelectId = useId();
  const abilitySelectId = useId();
  const { data: codexSkills = [] } = useCodexSkills();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [ability, setAbility] = useState('');
  const [showBlocked, setShowBlocked] = useState(false);

  const recommendedSet = useMemo(
    () => new Set(recommendedIds.map((id) => String(id))),
    [recommendedIds]
  );

  const { categories, abilities } = useMemo(() => {
    const cats = new Set<string>();
    const abils = new Set<string>();
    feats.forEach((f) => {
      if (featType === 'character' && !f.char_feat) return;
      if (featType === 'archetype' && f.char_feat) return;
      if (f.category) cats.add(f.category);
      normalizeFeatAbilities(f.ability).forEach((a) => abils.add(a));
    });
    return {
      categories: Array.from(cats).sort(),
      abilities: Array.from(abils).sort(),
    };
  }, [feats, featType]);

  const meetsReq = useCallback(
    (feat: Feat) => checkFeatRequirements(feat, requirementCharacter, codexSkills, feats).met,
    [requirementCharacter, codexSkills, feats]
  );

  const displayEntries = useMemo(() => {
    const typed = feats.filter((f) =>
      featType === 'character' ? Boolean(f.char_feat) : !f.char_feat
    );

    const filtered = typed.filter((feat) => {
      if (search.trim()) {
        const term = search.toLowerCase();
        const hay = `${feat.name} ${feat.description ?? ''} ${(feat.tags ?? []).join(' ')}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      if (category && feat.category !== category) return false;
      if (ability) {
        const abs = normalizeFeatAbilities(feat.ability);
        if (!abs.includes(ability)) return false;
      }
      if (!showBlocked && !meetsReq(feat) && !selectedIds.includes(String(feat.id))) {
        return false;
      }
      return true;
    });

    const families = groupFeatFamilies(filtered);
    const entries = families
      .map((family) => {
        const levels = family.levels
          .slice()
          .sort((a, b) => getFeatLevel(b) - getFeatLevel(a));
        const preferred =
          levels.find((f) => meetsReq(f) || selectedIds.includes(String(f.id))) ?? levels[0];
        if (!preferred) return null;
        return preferred;
      })
      .filter((f): f is Feat => Boolean(f));

    entries.sort((a, b) => {
      const aRec = recommendedSet.has(String(a.id));
      const bRec = recommendedSet.has(String(b.id));
      if (aRec !== bRec) return aRec ? -1 : 1;
      return formatFeatName(a).localeCompare(formatFeatName(b), undefined, { sensitivity: 'base' });
    });

    return entries;
  }, [
    feats,
    featType,
    search,
    category,
    ability,
    showBlocked,
    meetsReq,
    selectedIds,
    recommendedSet,
  ]);

  const handleSelect = (id: string) => {
    onSelectionChange(applyCappedIdSelection(selectedIds, id, maxSelections));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold text-text-primary">{browseCopy.heading}</h3>
        <p className="mt-1 font-nunito text-sm text-text-secondary">{browseCopy.hint(maxSelections)}</p>
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder={browseCopy.searchPlaceholder}
        aria-label={browseCopy.searchPlaceholder}
      />

      <div className="flex flex-wrap gap-3">
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={categorySelectId} className="sr-only">
            {browseCopy.categoryLabel}
          </label>
          <select
            id={categorySelectId}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="min-h-11 w-full rounded-md border border-border-light bg-surface px-3 font-nunito text-sm text-text-primary"
          >
            <option value="">{browseCopy.allCategories}</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="min-w-[10rem] flex-1">
          <label htmlFor={abilitySelectId} className="sr-only">
            {browseCopy.abilityLabel}
          </label>
          <select
            id={abilitySelectId}
            value={ability}
            onChange={(e) => setAbility(e.target.value)}
            className="min-h-11 w-full rounded-md border border-border-light bg-surface px-3 font-nunito text-sm text-text-primary"
          >
            <option value="">{browseCopy.allAbilities}</option>
            {abilities.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
        <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 font-nunito text-sm text-text-secondary">
          <input
            type="checkbox"
            checked={showBlocked}
            onChange={(e) => setShowBlocked(e.target.checked)}
            className="h-4 w-4 rounded border-border-light"
          />
          {browseCopy.showBlocked}
        </label>
      </div>

      {displayEntries.length === 0 ? (
        <EmptyState title={browseCopy.emptyTitle} description={browseCopy.emptyDescription} />
      ) : (
        <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
          {displayEntries.map((feat) => {
            const id = String(feat.id);
            const selected = selectedIds.includes(id);
            const recommended = recommendedSet.has(id);
            const req = checkFeatRequirements(feat, requirementCharacter, codexSkills, feats);
            const blocked = !req.met;

            return (
              <GuidedChoiceCard
                key={id}
                density="compact"
                title={formatFeatName(feat)}
                description={feat.description}
                badge={recommended ? browseCopy.recommendedBadge : undefined}
                selected={selected}
                onSelect={() => handleSelect(id)}
                selectAriaLabel={`${selected ? 'Deselect' : 'Select'} ${formatFeatName(feat)}`}
                className={blocked && !selected ? 'opacity-80' : undefined}
                expandedExtra={
                  blocked || getFeatRestrictionNotice(feat)
                    ? (
                        <>
                          {blocked ? (
                            <p className="font-nunito text-sm text-danger-700 dark:text-danger-400">
                              {req.reason ?? browseCopy.requirementsNotMet}
                            </p>
                          ) : null}
                          {getFeatRestrictionNotice(feat) ? (
                            <div className={blocked ? 'mt-2' : undefined}>
                              <GuidedFeatRestrictionNotice feat={feat} />
                            </div>
                          ) : null}
                        </>
                      )
                    : undefined
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
