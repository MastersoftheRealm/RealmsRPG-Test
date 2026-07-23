/**
 * SpeciesRevealPanel — read-only species overview at the start of ancestry.
 * Shows hero art, vitals, auto-granted traits, and teasers for upcoming choices.
 */

'use client';

import Image from 'next/image';
import { useMemo } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { ExpandableImage, SegmentedControl, SummaryChipList, type SummaryChipItem } from '@/components/shared';
import { DescriptorChip } from '@/components/ui';
import { useCodexSkills, findTraitByIdOrName, type Species, type Trait } from '@/hooks';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import { cn } from '@/lib/utils';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GUIDED_CHOICE_STYLES, GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';
import { speciesSkillToSummaryChipItem, ANY_SPECIES_SKILL_ID } from '@/lib/chip/species-skill-chips';
import { resolveChoiceCardImage } from './guided-choice-image';
import { usePlaceholderTheme } from '@/hooks/use-placeholder-theme';
import { GuidedTraitOptionList } from './guided-trait-option-list';
import { GuidedOverviewSection } from './guided-overview-section';
import { titleCase } from './guided-text';
import { getSpeciesSizeOptions } from './guided-species-utils';

const copy = GUIDED_CREATOR_COPY.steps.ancestry.speciesOverview;

export interface SpeciesRevealPanelProps {
  species: Species;
  allTraits: Trait[];
  className?: string;
  selectedSize?: string | null;
  onSizeChange?: (size: string) => void;
  /**
   * Deep-dive modal mode (TASK-433): no size picker; multi-size shown as vitals text;
   * optional title hide (modal already titles the entity).
   */
  readOnlyDetail?: boolean;
  /** Hide the “Choices ahead” teaser when option catalogs are listed below. */
  hideChoiceTeaser?: boolean;
}

function formatSizes(species: Species): string | null {
  if (Array.isArray(species.sizes) && species.sizes.length > 0) {
    return species.sizes.map((s) => titleCase(s)).join(' / ');
  }
  if (species.size?.trim()) return titleCase(species.size.trim());
  return null;
}

interface VitalItem {
  key: string;
  label: string;
  value: string;
}

function buildVitals(
  species: Species,
  fixedSize: string | null,
  sizeOptionsLabel: string | null
): VitalItem[] {
  const items: VitalItem[] = [];
  if (fixedSize) {
    items.push({ key: 'size', label: copy.sizeLabel, value: titleCase(fixedSize) });
  } else if (sizeOptionsLabel) {
    items.push({ key: 'size', label: copy.sizeLabel, value: sizeOptionsLabel });
  }
  if (species.type?.trim()) {
    items.push({ key: 'type', label: copy.typeLabel, value: titleCase(species.type.trim()) });
  }
  if (species.ave_height != null && Number(species.ave_height) > 0) {
    items.push({ key: 'height', label: copy.avgHeightLabel, value: `${species.ave_height} cm` });
  }
  if (species.ave_weight != null && Number(species.ave_weight) > 0) {
    items.push({ key: 'weight', label: copy.avgWeightLabel, value: `${species.ave_weight} kg` });
  }
  const [adulthood, lifespan] = species.adulthood_lifespan ?? [];
  if (adulthood != null && adulthood > 0) {
    items.push({ key: 'adulthood', label: copy.adulthoodLabel, value: `${adulthood} yr` });
  }
  if (lifespan != null && lifespan > 0) {
    items.push({ key: 'lifespan', label: copy.lifespanLabel, value: `${lifespan} yr` });
  }
  return items;
}

function partitionSpeciesTraits(speciesTraits: Trait[]) {
  const granted: Trait[] = [];
  const choices: Trait[] = [];
  for (const trait of speciesTraits) {
    if (getChoiceOptionIds(trait).length > 0) {
      choices.push(trait);
    } else {
      granted.push(trait);
    }
  }
  return { granted, choices };
}

export function SpeciesRevealPanel({
  species,
  allTraits,
  className,
  selectedSize = null,
  onSizeChange,
  readOnlyDetail = false,
  hideChoiceTeaser = false,
}: SpeciesRevealPanelProps) {
  const { data: allSkills = [] } = useCodexSkills();
  const theme = usePlaceholderTheme();
  const image = resolveChoiceCardImage('species', species, theme);

  const sizeOptions = useMemo(() => getSpeciesSizeOptions(species), [species]);
  const hasSizeChoice = sizeOptions.length > 1;
  const fixedSize =
    sizeOptions.length === 1 ? titleCase(sizeOptions[0]) : !hasSizeChoice ? formatSizes(species) : null;
  const sizeOptionsLabel =
    readOnlyDetail && hasSizeChoice
      ? sizeOptions.map((s) => titleCase(s)).join(' / ')
      : null;

  const speciesTraits = useMemo(() => {
    const ids = species.species_traits ?? [];
    if (!ids.length || !allTraits.length) return [];
    return ids
      .map((id) => findTraitByIdOrName(allTraits, id))
      .filter((t): t is Trait => Boolean(t));
  }, [species.species_traits, allTraits]);

  const { granted, choices } = useMemo(() => partitionSpeciesTraits(speciesTraits), [speciesTraits]);

  const skillItems = useMemo((): SummaryChipItem[] => {
    return (species.skills ?? [])
      .filter((id) => String(id) !== ANY_SPECIES_SKILL_ID)
      .map((id) => speciesSkillToSummaryChipItem(id, allSkills));
  }, [species.skills, allSkills]);

  const vitals = useMemo(
    () => buildVitals(species, fixedSize, sizeOptionsLabel),
    [species, fixedSize, sizeOptionsLabel]
  );
  const abilityBonuses = species.ability_bonuses ?? {};
  const languages = species.languages?.filter(Boolean) ?? [];
  const choiceNames = choices.map((t) => t.name);
  const showSizePicker = !readOnlyDetail && hasSizeChoice && Boolean(onSizeChange);
  const showChoiceTeaser = !hideChoiceTeaser && choiceNames.length > 0;

  return (
    <div className={cn('space-y-6', className)}>
      <div className="overflow-hidden rounded-card border border-border-light bg-surface shadow-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
          <ExpandableImage
            src={image.src}
            alt={species.name}
            isPlaceholder={image.isPlaceholder}
            stopPropagation={false}
            className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-card border border-border-light bg-image-matte shadow-sm sm:mx-0 sm:h-32 sm:w-32"
          >
            <Image
              src={image.src}
              alt=""
              fill
              sizes="128px"
              className="object-contain"
            />
          </ExpandableImage>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            {!readOnlyDetail ? (
              <h3 className={GUIDED_CHOICE_STYLES.title}>{species.name}</h3>
            ) : null}
            {species.description?.trim() && (
              <p
                className={cn(
                  GUIDED_CHOICE_STYLES.body,
                  !readOnlyDetail && 'mt-1.5',
                  'whitespace-pre-wrap'
                )}
              >
                {species.description.trim()}
              </p>
            )}
          </div>
        </div>

        {vitals.length > 0 && (
          <div className="border-t border-border-light bg-surface-alt/50 px-4 py-4 sm:px-5">
            <div className={o.sectionTitle}>{copy.vitalsTitle}</div>
            <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {vitals.map((item) => (
                <div
                  key={item.key}
                  className="rounded-lg border border-border-light bg-surface px-3 py-2.5 text-center"
                >
                  <dt className={o.statLabel}>{item.label}</dt>
                  <dd className={o.statValue}>{item.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </div>

      {showSizePicker && onSizeChange ? (
        <GuidedOverviewSection title={copy.sizeChoiceTitle} hint={copy.sizeChoiceHint}>
          <SegmentedControl
            value={selectedSize ?? ''}
            onChange={onSizeChange}
            options={sizeOptions.map((size) => ({
              value: size,
              label: titleCase(size),
            }))}
            aria-label="Species size"
            equalWidth
            className="max-w-md"
          />
          {!selectedSize && (
            <p className="mt-2 font-nunito text-sm text-text-secondary">{copy.sizeChoiceRequired}</p>
          )}
        </GuidedOverviewSection>
      ) : null}

      {Object.keys(abilityBonuses).length > 0 && (
        <GuidedOverviewSection title={copy.abilityBonusesTitle}>
          <div className="flex flex-wrap gap-2">
            {Object.entries(abilityBonuses).map(([ability, bonus]) => (
              <DescriptorChip key={ability} variant="primary" size="sm">
                {ability.substring(0, 3).toUpperCase()} +{bonus}
              </DescriptorChip>
            ))}
          </div>
        </GuidedOverviewSection>
      )}

      {skillItems.length > 0 && (
        <GuidedOverviewSection title={copy.skillsTitle}>
          <SummaryChipList items={skillItems} />
        </GuidedOverviewSection>
      )}

      {languages.length > 0 && (
        <GuidedOverviewSection title={copy.languagesTitle}>
          <p className={o.body}>{languages.join(', ')}</p>
        </GuidedOverviewSection>
      )}

      {granted.length > 0 && (
        <section>
          <div className="mb-3 flex items-start gap-2">
            <Heart className="mt-0.5 h-5 w-5 shrink-0 text-info-fg" aria-hidden="true" />
            <div>
              <div className={o.sectionTitle}>{copy.grantedTitle}</div>
              <p className={o.sectionHint}>{copy.grantedHint}</p>
            </div>
          </div>
          <GuidedTraitOptionList traits={granted} />
        </section>
      )}

      {showChoiceTeaser ? (
        <section className={o.callout} aria-live="polite">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-fg" aria-hidden="true" />
            <div>
              <div className={o.sectionTitle}>{copy.choiceTeaserTitle}</div>
              <p className={o.sectionHint}>{copy.choiceTeaserHint(choiceNames)}</p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
