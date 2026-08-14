'use client';

import { DescriptorChip, EmptyState } from '@/components/ui';
import { GuidedLayerNav } from '@/components/shared';
import { cn } from '@/lib/utils';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { isPathRecommendedPowersTechniquesId } from '@/lib/guided-creator/powers-techniques-l1-candidates';
import type { PowersTechniquesItemKind } from '@/lib/guided-creator/powers-techniques-step-helpers';
import type { GuidedPowersPhase } from '@/stores/guided-creator-store';
import type { PathGuidanceGroup } from '@/types/archetype';
import type { ChipData } from '@/components/shared/grid-list-row-types';
import { GuidedChoiceCard } from './guided-choice-card';
import { GUIDED_CHOICE_COMPACT_GRID_CLASS } from './guided-choice-styles';
import { GuidedFactChipRow } from './guided-equipment-fact-chips';
import { GuidedSectionTitle } from './guided-section-title';

const ptCopy = GUIDED_CREATOR_COPY.steps.powersTechniques;

export interface PowersTechniquesDisplayItem {
  id: string;
  name: string;
  description: string;
  titleChips: ChipData[];
  detailChips: ChipData[];
  tpCost: number;
}

export interface GuidedPowersTechniquesL1ContentProps {
  /** Current inner screen — only that track renders (TASK-756). */
  phase: GuidedPowersPhase;
  kind: PowersTechniquesItemKind;
  budgetMessage: string | null;
  innateThreshold: number;
  innateDisplayIds: string[];
  selectedInnateIds: string[];
  innatePromotedIds: string[];
  innateRecommendedIds: string[];
  resolveCanonicalId: (id: string) => string | undefined;
  allOptionIds: string[];
  groups: PathGuidanceGroup[];
  l1DisplayIds: string[];
  promotedIds: string[];
  selectedIds: string[];
  showPathDescriptor: boolean;
  libraryItemsCount: number;
  isSelectedId: (id: string, pool: string[]) => boolean;
  isRegularUnavailable: (id: string) => boolean;
  isInnateUnavailable: (id: string) => boolean;
  toggleRegularId: (id: string) => void;
  toggleInnateId: (id: string) => void;
  resolveDisplay: (id: string) => PowersTechniquesDisplayItem;
  onExpandInnate: () => void;
  onExpandRegular: () => void;
}

export function GuidedPowersTechniquesL1Content({
  phase,
  kind,
  budgetMessage,
  innateThreshold,
  innateDisplayIds,
  selectedInnateIds,
  innatePromotedIds,
  innateRecommendedIds,
  resolveCanonicalId,
  allOptionIds,
  groups,
  l1DisplayIds,
  promotedIds,
  selectedIds,
  showPathDescriptor,
  libraryItemsCount,
  isSelectedId,
  isRegularUnavailable,
  isInnateUnavailable,
  toggleRegularId,
  toggleInnateId,
  resolveDisplay,
  onExpandInnate,
  onExpandRegular,
}: GuidedPowersTechniquesL1ContentProps) {
  const renderItemCard = (
    id: string,
    opts: {
      selected: boolean;
      unavailable: boolean;
      onToggle: () => void;
      pathRecommended?: boolean;
    }
  ) => {
    const item = resolveDisplay(id);
    return (
      <GuidedChoiceCard
        key={item.id}
        density="compact"
        title={item.name}
        description={item.description}
        titleMeta={
          item.titleChips.length > 0 || opts.pathRecommended ? (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {opts.pathRecommended ? (
                <DescriptorChip size="sm">{ptCopy.pathRecommendedChip}</DescriptorChip>
              ) : null}
              {item.titleChips.length > 0 ? (
                <GuidedFactChipRow chips={item.titleChips} />
              ) : null}
            </span>
          ) : undefined
        }
        expandedExtra={
          item.detailChips.length > 0 ? (
            <GuidedFactChipRow chips={item.detailChips} />
          ) : undefined
        }
        selected={opts.selected}
        onSelect={opts.onToggle}
        selectAriaLabel={
          opts.unavailable
            ? `${item.name} unavailable: ${budgetMessage ?? ptCopy.tpBlocked}`
            : `${opts.selected ? 'Deselect' : 'Select'} ${item.name}`
        }
      />
    );
  };

  const renderGroupSection = (group: PathGuidanceGroup) => {
    const ids = (kind === 'techniques' ? group.techniques : group.powers) ?? [];
    if (ids.length === 0) return null;
    return (
      <section key={group.id}>
        <GuidedSectionTitle as="h3">{group.title}</GuidedSectionTitle>
        {group.why ? (
          <p className="mt-1 font-nunito text-sm text-text-secondary">{group.why}</p>
        ) : null}
        <div className={cn(GUIDED_CHOICE_COMPACT_GRID_CLASS, 'mt-3')}>
          {ids.map((id) =>
            renderItemCard(String(id), {
              selected: isSelectedId(String(id), selectedIds),
              unavailable: isRegularUnavailable(String(id)),
              onToggle: () => toggleRegularId(String(id)),
            })
          )}
        </div>
      </section>
    );
  };

  if (phase === 'innate') {
    return (
      <section className="space-y-3">
        <p className="font-nunito text-sm text-text-secondary">{ptCopy.innateIntro}</p>
        <p className="font-nunito text-xs text-text-secondary">
          {ptCopy.innateThresholdHint(innateThreshold)}
        </p>
        {innateDisplayIds.length === 0 ? (
          <EmptyState title={ptCopy.innateEmpty} />
        ) : (
          <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
            {innateDisplayIds.map((id) =>
              renderItemCard(id, {
                selected: isSelectedId(id, selectedInnateIds),
                unavailable: isInnateUnavailable(id),
                onToggle: () => toggleInnateId(id),
                pathRecommended:
                  innatePromotedIds.length > 0 &&
                  isPathRecommendedPowersTechniquesId(
                    id,
                    innateRecommendedIds,
                    resolveCanonicalId
                  ),
              })
            )}
          </div>
        )}
        <GuidedLayerNav expandLabel={ptCopy.innateSeeMore} onExpand={onExpandInnate} />
      </section>
    );
  }

  return (
    <section className="space-y-3">
        {allOptionIds.length === 0 && groups.length === 0 && libraryItemsCount === 0 ? (
          <EmptyState
            title={ptCopy.emptyTitle(kind)}
            description={ptCopy.emptyDescription(kind)}
          />
        ) : groups.length > 0 ? (
          <div className="space-y-8">
            <p className="font-nunito text-sm text-text-secondary">{ptCopy.groupIntro(kind)}</p>
            {groups.map(renderGroupSection)}
            {promotedIds.length > 0 ? (
              <section>
                <GuidedSectionTitle as="h3">
                  {ptCopy.otherPicksHeading(kind)}
                </GuidedSectionTitle>
                <p className="mt-1 font-nunito text-sm text-text-secondary">
                  {ptCopy.otherPicksHint}
                </p>
                <div className={cn(GUIDED_CHOICE_COMPACT_GRID_CLASS, 'mt-3')}>
                  {promotedIds.map((id) =>
                    renderItemCard(id, {
                      selected: isSelectedId(id, selectedIds),
                      unavailable: isRegularUnavailable(id),
                      onToggle: () => toggleRegularId(id),
                    })
                  )}
                </div>
              </section>
            ) : null}
          </div>
        ) : allOptionIds.length > 0 || promotedIds.length > 0 ? (
          <div className="space-y-4">
            <p className="font-nunito text-sm text-text-secondary">{ptCopy.groupIntro(kind)}</p>
            <div className={GUIDED_CHOICE_COMPACT_GRID_CLASS}>
              {l1DisplayIds.map((id) =>
                renderItemCard(id, {
                  selected: isSelectedId(id, selectedIds),
                  unavailable: isRegularUnavailable(id),
                  onToggle: () => toggleRegularId(id),
                  pathRecommended:
                    showPathDescriptor &&
                    isPathRecommendedPowersTechniquesId(id, allOptionIds, resolveCanonicalId),
                })
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            title={ptCopy.emptyTitle(kind)}
            description={ptCopy.emptyDescription(kind)}
          />
        )}

        <GuidedLayerNav expandLabel={ptCopy.seeMore} onExpand={onExpandRegular} />
    </section>
  );
}
