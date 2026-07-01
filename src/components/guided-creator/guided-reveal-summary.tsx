'use client';

import { useMemo } from 'react';
import { cn } from '@/lib/utils';
import { AbilityScoreGrid } from '@/components/shared';
import {
  useMergedSpecies,
  useCodexSkills,
  useCodexFeats,
  useTraits,
  useOfficialLibrary,
  usePowerParts,
  useTechniqueParts,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { useGuidedPathData } from './use-guided-path-data';
import { GuidedStepEditLink } from './guided-step-edit-link';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import type { TraitWithChoiceOptions } from '@/lib/choice-trait';
import { derivePowerDisplay } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import type { ArchetypeCategory } from '@/types';
import type { GuidedSubStep } from '@/stores/guided-creator-store';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';

const copy = GUIDED_CREATOR_COPY.steps.reveal.summary;

const PATH_TYPE_LABELS: Record<ArchetypeCategory, string> = {
  power: 'Power',
  martial: 'Martial',
  'powered-martial': 'Hybrid',
};

function SummarySectionHeader({
  title,
  editSubSteps,
}: {
  title: string;
  editSubSteps?: Array<{ subStep: GuidedSubStep; label: string }>;
}) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <p className="font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">{title}</p>
      {editSubSteps && editSubSteps.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {editSubSteps.map((link) => (
            <GuidedStepEditLink key={link.subStep} subStep={link.subStep} label={link.label} />
          ))}
        </div>
      )}
    </div>
  );
}

function ChipList({
  items,
  className,
}: {
  items: Array<{ key: string; label: string; className?: string }>;
  className?: string;
}) {
  if (items.length === 0) return null;
  return (
    <div className={cn('flex flex-wrap gap-2', className)}>
      {items.map((item) => (
        <span
          key={item.key}
          className={cn(
            'rounded-lg border border-border-light bg-surface-alt/50 px-3 py-1.5 font-nunito text-sm font-medium text-text-primary',
            item.className
          )}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}

export function GuidedRevealSummary() {
  const draft = useGuidedCreatorStore((s) => s.draft);
  const { archetype, pathData } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: feats = [] } = useCodexFeats();
  const { data: allTraits = [] } = useTraits();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const species = useMemo(
    () => allSpecies.find((s) => String(s.id) === String(draft.speciesId)) ?? null,
    [allSpecies, draft.speciesId]
  );

  const speciesName = draft.speciesName ?? species?.name ?? null;
  const pathType = draft.archetypeType;

  const traitName = (id: string) =>
    allTraits.find((t) => String(t.id) === String(id))?.name ?? id;

  const ancestryTraitNames = useMemo(() => {
    const resolvedSpeciesTraits = applySpeciesTraitChoiceSelections(
      species?.species_traits,
      draft.selectedSpeciesTraitChoices,
      allTraits as TraitWithChoiceOptions[]
    );
    const ids = [
      ...resolvedSpeciesTraits,
      ...draft.selectedAncestryTraitIds,
      ...(draft.selectedCharacteristicId ? [draft.selectedCharacteristicId] : []),
      ...(draft.selectedFlawId ? [draft.selectedFlawId] : []),
    ];
    return ids.map((id) => ({ key: String(id), label: traitName(String(id)) }));
  }, [species, draft, allTraits]);

  const skillNames = useMemo(
    () =>
      draft.skillIds.map((id) => ({
        key: id,
        label: codexSkills.find((s) => String(s.id) === id)?.name ?? id,
      })),
    [draft.skillIds, codexSkills]
  );

  const featById = useMemo(() => new Map(feats.map((f) => [String(f.id), f])), [feats]);

  const archetypeFeatChips = draft.archetypeFeatIds.map((id) => ({
    key: id,
    label: featById.get(String(id))?.name ?? id,
    className: 'border-warning-200/60 bg-warning-light/40 text-warning-fg dark:border-warning-800/40',
  }));

  const characterFeatChips = draft.characterFeatIds.map((id) => ({
    key: id,
    label: featById.get(String(id))?.name ?? id,
    className: 'border-info-200/60 bg-info-light/40 text-info-fg dark:border-info-800/40',
  }));

  const loadoutTitle = useMemo(() => {
    const loadouts = pathData?.level1?.loadouts ?? [];
    const match = loadouts.find((l) => l.id === draft.loadoutId);
    if (match?.title) return match.title;
    if (draft.loadoutId === 'path-default' && archetype?.name) {
      return `${archetype.name} loadout`;
    }
    return draft.loadoutId ?? copy.defaultLoadout;
  }, [pathData, draft.loadoutId, archetype?.name]);

  const itemName = (id: string) =>
    officialItems.find((i) => String(i.id) === String(id))?.name ?? id;

  const loadoutItems = useMemo(() => {
    const items: Array<{ key: string; label: string }> = [];
    draft.armaments.forEach((a) => {
      const qty = a.quantity > 1 ? ` ×${a.quantity}` : '';
      items.push({ key: `w-${a.id}`, label: `${itemName(a.id)}${qty}` });
    });
    draft.equipment.forEach((e) => {
      const qty = e.quantity > 1 ? ` ×${e.quantity}` : '';
      items.push({ key: `e-${e.id}`, label: `${itemName(e.id)}${qty}` });
    });
    return items;
  }, [draft.armaments, draft.equipment, officialItems]);

  const powerChips = useMemo(() => {
    const byId = new Map(officialPowers.map((p) => [String(p.id), p]));
    return draft.powerIds.map((id) => {
      const raw = byId.get(String(id));
      let enLabel = '';
      if (raw) {
        try {
          const doc: PowerDocument = {
            name: String(raw.name ?? ''),
            description: String(raw.description ?? ''),
            parts: Array.isArray(raw.parts) ? (raw.parts as PowerDocument['parts']) : [],
          };
          const disp = derivePowerDisplay(doc, powerPartsDb);
          if (typeof disp.energy === 'number') enLabel = ` · ${disp.energy} EN`;
        } catch {
          // ignore
        }
      }
      return {
        key: id,
        label: `${raw?.name ?? id}${enLabel}`,
        className: 'border-power/30 bg-power-light/50 text-power-fg dark:bg-power-900/30',
      };
    });
  }, [draft.powerIds, officialPowers, powerPartsDb]);

  const techniqueChips = useMemo(() => {
    const byId = new Map(officialTechniques.map((t) => [String(t.id), t]));
    return draft.techniqueIds.map((id) => {
      const raw = byId.get(String(id));
      let enLabel = '';
      if (raw) {
        try {
          const doc: TechniqueDocument = {
            name: String(raw.name ?? ''),
            description: String(raw.description ?? ''),
            parts: Array.isArray(raw.parts) ? (raw.parts as TechniqueDocument['parts']) : [],
          };
          const disp = deriveTechniqueDisplay(doc, techniquePartsDb);
          if (typeof disp.energy === 'number') enLabel = ` · ${disp.energy} EN`;
        } catch {
          // ignore
        }
      }
      return {
        key: id,
        label: `${raw?.name ?? id}${enLabel}`,
        className: 'border-martial/30 bg-martial-light/50 text-martial-fg dark:bg-martial-900/30',
      };
    });
  }, [draft.techniqueIds, officialTechniques, techniquePartsDb]);

  const hasPowerProf =
    pathType === 'power' ||
    pathType === 'powered-martial' ||
    (archetype?.power_prof_start ?? 0) > 0;
  const hasMartialProf =
    pathType === 'martial' ||
    pathType === 'powered-martial' ||
    (archetype?.martial_prof_start ?? 0) > 0;

  return (
    <div className="overflow-hidden rounded-card border border-border-light bg-surface shadow-sm">
      <div className="border-b border-border-light bg-surface-alt px-5 py-4">
        <h3 className="font-display text-lg font-bold text-text-primary">{copy.title}</h3>
        <p className="mt-0.5 font-nunito text-sm text-text-secondary">{copy.description}</p>
      </div>

      <div className="space-y-6 p-5">
        <div>
          <SummarySectionHeader
            title={copy.coreTitle}
            editSubSteps={[
              { subStep: 'path', label: 'path' },
              { subStep: 'species', label: 'species' },
              { subStep: 'ancestry', label: 'ancestry' },
              { subStep: 'abilities', label: 'abilities' },
              { subStep: 'skills', label: 'skills' },
            ]}
          />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
              <p className="font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">
                {copy.levelLabel}
              </p>
              <p className="mt-0.5 font-display text-lg font-bold text-text-primary">1</p>
            </div>
            {archetype?.name && (
              <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {copy.pathLabel}
                </p>
                <p className="mt-0.5 truncate font-display text-lg font-bold text-text-primary">
                  {archetype.name}
                </p>
              </div>
            )}
            {speciesName && (
              <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {copy.speciesLabel}
                </p>
                <p className="mt-0.5 truncate font-display text-lg font-bold text-text-primary">
                  {speciesName}
                </p>
              </div>
            )}
            {pathType && (
              <div className="rounded-lg border border-border-light bg-surface-alt/50 p-3">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">
                  {copy.typeLabel}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold capitalize text-text-primary">
                  {PATH_TYPE_LABELS[pathType]}
                </p>
              </div>
            )}
            {draft.pow_abil && hasPowerProf && (
              <div className="rounded-lg border border-power bg-power-light/40 p-3 dark:bg-power-900/20">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-power-fg">
                  {copy.powerAbilityLabel}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold capitalize text-power-fg">
                  {draft.pow_abil}
                </p>
              </div>
            )}
            {draft.mart_abil && hasMartialProf && (
              <div className="rounded-lg border border-martial bg-martial-light/40 p-3 dark:bg-martial-900/20">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-martial-fg">
                  {copy.martialAbilityLabel}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold capitalize text-martial-fg">
                  {draft.mart_abil}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          <SummarySectionHeader title={copy.abilitiesTitle} editSubSteps={[{ subStep: 'abilities', label: 'abilities' }]} />
          <AbilityScoreGrid
            abilities={draft.abilities}
            powerAbility={draft.pow_abil ?? undefined}
            martialAbility={draft.mart_abil ?? undefined}
            mode="display"
          />
        </div>

        {ancestryTraitNames.length > 0 && (
          <div>
            <SummarySectionHeader
              title={copy.ancestryTitle}
              editSubSteps={[{ subStep: 'ancestry', label: 'ancestry' }]}
            />
            <ChipList items={ancestryTraitNames} />
          </div>
        )}

        {skillNames.length > 0 && (
          <div>
            <SummarySectionHeader title={copy.skillsTitle} editSubSteps={[{ subStep: 'skills', label: 'skills' }]} />
            <ChipList items={skillNames} />
          </div>
        )}

        {(archetypeFeatChips.length > 0 || characterFeatChips.length > 0) && (
          <div>
            <SummarySectionHeader
              title={copy.featsTitle}
              editSubSteps={[
                { subStep: 'archetype-feats', label: 'archetype feats' },
                { subStep: 'character-feat', label: 'character feat' },
              ]}
            />
            <ChipList items={[...archetypeFeatChips, ...characterFeatChips]} />
          </div>
        )}

        {(loadoutTitle || loadoutItems.length > 0) && (
          <div>
            <SummarySectionHeader title={copy.loadoutTitle} editSubSteps={[{ subStep: 'loadout', label: 'loadout' }]} />
            <p className="mb-2 font-display text-sm font-semibold text-text-primary">{loadoutTitle}</p>
            <ChipList items={loadoutItems} />
          </div>
        )}

        {(powerChips.length > 0 || techniqueChips.length > 0) && (
          <div>
            <SummarySectionHeader
              title={copy.powersTitle}
              editSubSteps={[{ subStep: 'powers-techniques', label: 'powers' }]}
            />
            <ChipList items={[...powerChips, ...techniqueChips]} />
          </div>
        )}
      </div>
    </div>
  );
}
