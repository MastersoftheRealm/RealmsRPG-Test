'use client';

import { useMemo } from 'react';
import { SummaryChipList, type SummaryChipItem } from '@/components/shared';
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

  const traitById = useMemo(() => new Map(allTraits.map((t) => [String(t.id), t])), [allTraits]);

  const ancestryTraitNames = useMemo((): SummaryChipItem[] => {
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
    return ids.map((id) => {
      const trait = traitById.get(String(id));
      return {
        key: String(id),
        label: trait?.name ?? String(id),
        description: trait?.description,
        variant: 'list' as const,
      };
    });
  }, [species, draft, allTraits, traitById]);

  const skillNames = useMemo((): SummaryChipItem[] => {
    const ids = new Set<string>();
    (species?.skills ?? []).forEach((id) => {
      if (String(id) !== '0') ids.add(String(id));
    });
    Object.keys(draft.skills ?? {}).forEach((id) => ids.add(String(id)));
    return Array.from(ids).map((id) => {
      const skill = codexSkills.find((s) => String(s.id) === id);
      return {
        key: id,
        label: skill?.name ?? id,
        description: skill?.description,
        variant: 'list' as const,
      };
    });
  }, [draft.skills, species, codexSkills]);

  const featById = useMemo(() => new Map(feats.map((f) => [String(f.id), f])), [feats]);

  const archetypeFeatChips = draft.archetypeFeatIds.map((id) => {
    const feat = featById.get(String(id));
    return {
      key: id,
      label: feat?.name ?? id,
      description: feat?.description,
      variant: 'listWarning' as const,
    };
  });

  const characterFeatChips = draft.characterFeatIds.map((id) => {
    const feat = featById.get(String(id));
    return {
      key: id,
      label: feat?.name ?? id,
      description: feat?.description,
      variant: 'list' as const,
    };
  });

  const loadoutTitle = useMemo(() => {
    const hasGear =
      draft.loadoutWeapons.length > 0 ||
      draft.loadoutArmor.length > 0 ||
      draft.equipment.length > 0 ||
      (draft.unarmedProwess ?? 0) > 0;
    if (!hasGear) return copy.defaultLoadout;
    return archetype?.name
      ? `${archetype.name} equipment`
      : copy.customLoadout;
  }, [
    archetype?.name,
    draft.loadoutWeapons.length,
    draft.loadoutArmor.length,
    draft.equipment.length,
    draft.unarmedProwess,
  ]);

  const itemById = useMemo(
    () => new Map(officialItems.map((i) => [String(i.id), i])),
    [officialItems]
  );

  const loadoutItems = useMemo((): SummaryChipItem[] => {
    const items: SummaryChipItem[] = [];
    draft.armaments.forEach((a) => {
      const item = itemById.get(String(a.id));
      const qty = a.quantity > 1 ? ` ×${a.quantity}` : '';
      items.push({
        key: `w-${a.id}`,
        label: `${item?.name ?? a.id}${qty}`,
        description: item?.description ? String(item.description) : undefined,
        variant: 'list' as const,
      });
    });
    draft.equipment.forEach((e) => {
      const item = itemById.get(String(e.id));
      const qty = e.quantity > 1 ? ` ×${e.quantity}` : '';
      items.push({
        key: `e-${e.id}`,
        label: `${item?.name ?? e.id}${qty}`,
        description: item?.description ? String(item.description) : undefined,
        variant: 'list' as const,
      });
    });
    return items;
  }, [draft.armaments, draft.equipment, itemById]);

  const powerChips = useMemo((): SummaryChipItem[] => {
    const byId = new Map(officialPowers.map((p) => [String(p.id), p]));
    return draft.powerIds.map((id) => {
      const raw = byId.get(String(id));
      let energyCost: number | undefined;
      if (raw) {
        try {
          const doc: PowerDocument = {
            name: String(raw.name ?? ''),
            description: String(raw.description ?? ''),
            parts: Array.isArray(raw.parts) ? (raw.parts as PowerDocument['parts']) : [],
          };
          const disp = derivePowerDisplay(doc, powerPartsDb);
          if (typeof disp.energy === 'number') energyCost = disp.energy;
        } catch {
          // ignore
        }
      }
      return {
        key: id,
        label: String(raw?.name ?? id),
        description: raw?.description ? String(raw.description) : undefined,
        energyCost,
        variant: 'power' as const,
      };
    });
  }, [draft.powerIds, officialPowers, powerPartsDb]);

  const techniqueChips = useMemo((): SummaryChipItem[] => {
    const byId = new Map(officialTechniques.map((t) => [String(t.id), t]));
    return draft.techniqueIds.map((id) => {
      const raw = byId.get(String(id));
      let energyCost: number | undefined;
      if (raw) {
        try {
          const doc: TechniqueDocument = {
            name: String(raw.name ?? ''),
            description: String(raw.description ?? ''),
            parts: Array.isArray(raw.parts) ? (raw.parts as TechniqueDocument['parts']) : [],
          };
          const disp = deriveTechniqueDisplay(doc, techniquePartsDb);
          if (typeof disp.energy === 'number') energyCost = disp.energy;
        } catch {
          // ignore
        }
      }
      return {
        key: id,
        label: String(raw?.name ?? id),
        description: raw?.description ? String(raw.description) : undefined,
        energyCost,
        variant: 'technique' as const,
      };
    });
  }, [draft.techniqueIds, officialTechniques, techniquePartsDb]);

  const showPowerAbility = Boolean(draft.pow_abil && pathType !== 'martial');
  const showMartialAbility = Boolean(draft.mart_abil && pathType !== 'power');
  const gridPowerAbility = pathType === 'martial' ? undefined : (draft.pow_abil ?? undefined);
  const gridMartialAbility = pathType === 'power' ? undefined : (draft.mart_abil ?? undefined);

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
            {showPowerAbility && draft.pow_abil && (
              <div className="rounded-lg border border-power bg-power-light/40 p-3 dark:bg-power-900/20">
                <p className="font-nunito text-xs font-medium uppercase tracking-wide text-power-fg">
                  {copy.powerAbilityLabel}
                </p>
                <p className="mt-0.5 font-display text-lg font-bold capitalize text-power-fg">
                  {draft.pow_abil}
                </p>
              </div>
            )}
            {showMartialAbility && draft.mart_abil && (
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
            powerAbility={gridPowerAbility}
            martialAbility={gridMartialAbility}
            mode="display"
          />
        </div>

        {ancestryTraitNames.length > 0 && (
          <div>
            <SummarySectionHeader
              title={copy.ancestryTitle}
              editSubSteps={[{ subStep: 'ancestry', label: 'ancestry' }]}
            />
            <SummaryChipList items={ancestryTraitNames} />
          </div>
        )}

        {skillNames.length > 0 && (
          <div>
            <SummarySectionHeader title={copy.skillsTitle} editSubSteps={[{ subStep: 'skills', label: 'skills' }]} />
            <SummaryChipList items={skillNames} />
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
            <SummaryChipList items={[...archetypeFeatChips, ...characterFeatChips]} />
          </div>
        )}

        {(loadoutTitle || loadoutItems.length > 0) && (
          <div>
            <SummarySectionHeader title={copy.loadoutTitle} editSubSteps={[{ subStep: 'loadout', label: 'loadout' }]} />
            <p className="mb-2 font-display text-sm font-semibold text-text-primary">{loadoutTitle}</p>
            <SummaryChipList items={loadoutItems} />
          </div>
        )}

        {(powerChips.length > 0 || techniqueChips.length > 0) && (
          <div>
            <SummarySectionHeader
              title={copy.powersTitle}
              editSubSteps={[{ subStep: 'powers-techniques', label: 'powers' }]}
            />
            <SummaryChipList items={[...powerChips, ...techniqueChips]} />
          </div>
        )}
      </div>
    </div>
  );
}
