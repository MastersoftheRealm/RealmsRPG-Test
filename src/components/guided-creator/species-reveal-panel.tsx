/**
 * SpeciesRevealPanel — read-only species overview at the start of ancestry.
 * Shows hero art, vitals, auto-granted traits, and teasers for upcoming choices.
 */

'use client';

import Image from 'next/image';
import { useMemo, type ReactNode } from 'react';
import { Heart, Sparkles } from 'lucide-react';
import { SpeciesTraitCard } from '@/components/shared';
import { useCodexSkills, resolveTraitIds, type Species, type Trait } from '@/hooks';
import { getChoiceOptionIds } from '@/lib/choice-trait';
import { cn } from '@/lib/utils';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GUIDED_CHOICE_STYLES, GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';
import { resolveChoiceCardImage } from './guided-choice-image';
import { titleCase } from './guided-text';

const copy = GUIDED_CREATOR_COPY.steps.ancestry.speciesOverview;

export interface SpeciesRevealPanelProps {
  species: Species;
  allTraits: Trait[];
  className?: string;
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

function buildVitals(species: Species): VitalItem[] {
  const items: VitalItem[] = [];
  const size = formatSizes(species);
  if (size) items.push({ key: 'size', label: copy.sizeLabel, value: size });
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

function OverviewSection({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      <h4 className={o.sectionTitle}>{title}</h4>
      {hint ? <p className={o.sectionHint}>{hint}</p> : null}
      <div className={hint ? 'mt-3' : 'mt-2'}>{children}</div>
    </section>
  );
}

function OverviewPills({
  items,
  variant = 'default',
  className,
}: {
  items: Array<{ key: string; label: string }>;
  variant?: 'default' | 'primary';
  className?: string;
}) {
  if (items.length === 0) return null;
  const pillClass = variant === 'primary' ? o.pillPrimary : o.pill;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item) => (
        <span key={item.key} className={pillClass}>
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function SpeciesRevealPanel({ species, allTraits, className }: SpeciesRevealPanelProps) {
  const { data: allSkills = [] } = useCodexSkills();
  const image = resolveChoiceCardImage('species', species);

  const speciesTraits = useMemo(
    () => resolveTraitIds(species.species_traits ?? [], allTraits),
    [species.species_traits, allTraits]
  );

  const { granted, choices } = useMemo(() => partitionSpeciesTraits(speciesTraits), [speciesTraits]);

  const skillNames = useMemo(() => {
    return (species.skills ?? [])
      .filter((id) => String(id) !== '0')
      .map((id) => {
        const idStr = String(id);
        const match = allSkills.find(
          (s) => String(s.id) === idStr || String(s.name ?? '').toLowerCase() === idStr.toLowerCase()
        );
        return match?.name ?? idStr;
      });
  }, [species.skills, allSkills]);

  const vitals = useMemo(() => buildVitals(species), [species]);
  const abilityBonuses = species.ability_bonuses ?? {};
  const languages = species.languages?.filter(Boolean) ?? [];
  const choiceNames = choices.map((t) => t.name);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="overflow-hidden rounded-card border border-border-light bg-surface shadow-card">
        <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:gap-5 sm:p-5">
          <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-card bg-surface-alt shadow-sm sm:mx-0 sm:h-32 sm:w-32">
            <Image
              src={image.src}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
            />
          </div>
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h3 className={GUIDED_CHOICE_STYLES.title}>{species.name}</h3>
            {species.description?.trim() && (
              <p className={cn('mt-1.5', GUIDED_CHOICE_STYLES.body)}>
                {species.description.trim()}
              </p>
            )}
          </div>
        </div>

        {vitals.length > 0 && (
          <div className="border-t border-border-light bg-surface-alt/50 px-4 py-4 sm:px-5">
            <h4 className={o.sectionTitle}>{copy.vitalsTitle}</h4>
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

      {Object.keys(abilityBonuses).length > 0 && (
        <OverviewSection title={copy.abilityBonusesTitle}>
          <OverviewPills
            variant="primary"
            items={Object.entries(abilityBonuses).map(([ability, bonus]) => ({
              key: ability,
              label: `${ability.substring(0, 3).toUpperCase()} +${bonus}`,
            }))}
          />
        </OverviewSection>
      )}

      {skillNames.length > 0 && (
        <OverviewSection title={copy.skillsTitle}>
          <OverviewPills
            items={skillNames.map((name) => ({
              key: name,
              label: name,
            }))}
          />
        </OverviewSection>
      )}

      {languages.length > 0 && (
        <OverviewSection title={copy.languagesTitle}>
          <p className={o.body}>{languages.join(', ')}</p>
        </OverviewSection>
      )}

      {granted.length > 0 && (
        <section>
          <div className="mb-3 flex items-start gap-2">
            <Heart className="mt-0.5 h-5 w-5 shrink-0 text-info-fg" aria-hidden="true" />
            <div>
              <h4 className={o.sectionTitle}>{copy.grantedTitle}</h4>
              <p className={o.sectionHint}>{copy.grantedHint}</p>
            </div>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {granted.map((trait) => (
              <SpeciesTraitCard
                key={trait.id}
                trait={{
                  id: String(trait.id),
                  name: trait.name,
                  description: trait.description,
                }}
                category="species"
                neutralStyle
              />
            ))}
          </div>
        </section>
      )}

      {choiceNames.length > 0 && (
        <section className={o.callout} aria-live="polite">
          <div className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-primary-fg" aria-hidden="true" />
            <div>
              <h4 className={o.sectionTitle}>{copy.choiceTeaserTitle}</h4>
              <p className={o.sectionHint}>{copy.choiceTeaserHint(choiceNames)}</p>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
