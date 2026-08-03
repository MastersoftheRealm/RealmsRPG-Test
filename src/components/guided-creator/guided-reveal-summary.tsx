'use client';

import { useMemo } from 'react';
import {
  AbilityScoreGrid,
  SummaryChipList,
  resolveDistinctSecondaryAbility,
  type SummaryChipItem,
} from '@/components/shared';
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
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import { useGuidedPathData } from './use-guided-path-data';
import { applySpeciesTraitChoiceSelections } from '@/lib/choice-trait';
import type { TraitWithChoiceOptions } from '@/lib/choice-trait';
import { resolvePowerTechniqueEnergy } from '@/lib/guided-creator/power-technique-display';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import { GuidedSectionTitle } from './guided-section-title';

const copy = GUIDED_CREATOR_COPY.steps.reveal.summary;

function SummarySectionHeader({ title }: { title: string }) {
  return (
    <div className="mb-3">
      <p className="font-nunito text-xs font-medium uppercase tracking-wide text-text-secondary">
        {title}
      </p>
    </div>
  );
}

export function GuidedRevealSummary() {
  const draft = useGuidedCreatorStore((s) => s.draft);
  const { archetype } = useGuidedPathData();
  const { data: allSpecies = [] } = useMergedSpecies();
  const { data: codexSkills = [] } = useCodexSkills();
  const { data: feats = [] } = useCodexFeats();
  const { data: allTraits = [] } = useTraits();
  const { data: officialPowers = [] } = useOfficialLibrary('powers');
  const { data: officialTechniques = [] } = useOfficialLibrary('techniques');
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const speciesContext = useMemo(
    () => resolveGuidedSpeciesContext(draft, allSpecies),
    [draft, allSpecies]
  );
  const species = speciesContext.species;

  const pathType = draft.archetypeType;

  const traitById = useMemo(() => new Map(allTraits.map((t) => [String(t.id), t])), [allTraits]);

  const ancestryTraitNames = useMemo((): SummaryChipItem[] => {
    const resolvedSpeciesTraits = speciesContext.isMixed
      ? draft.selectedSpeciesTraits
      : applySpeciesTraitChoiceSelections(
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
  }, [speciesContext.isMixed, species, draft, allTraits, traitById]);

  const skillNames = useMemo((): SummaryChipItem[] => {
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
    return Array.from(ids).map((id) => {
      const skill = codexSkills.find((s) => String(s.id) === id);
      return {
        key: id,
        label: skill?.name ?? id,
        description: skill?.description,
        variant: 'list' as const,
      };
    });
  }, [draft.skills, draft.selectedSpeciesSkillIds, speciesContext.isMixed, species, codexSkills]);

  const featById = useMemo(() => new Map(feats.map((f) => [String(f.id), f])), [feats]);

  const featChipsForIds = (ids: string[]): SummaryChipItem[] =>
    ids.map((id) => {
      const feat = featById.get(String(id));
      return {
        key: id,
        label: feat?.name ?? id,
        description: feat?.description,
        variant: 'list' as const,
      };
    });

  const archetypeFeatChips = featChipsForIds(draft.archetypeFeatIds);
  const characterFeatChips = featChipsForIds(draft.characterFeatIds);

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
    // Omit draft.equipment — reveal Loadout is weapons/armor (+ Unarmed Prowess) only.
    if ((draft.unarmedProwess ?? 0) > 0) {
      items.push({
        key: 'unarmed',
        label: `Unarmed Prowess ${draft.unarmedProwess}`,
        variant: 'list' as const,
      });
    }
    return items;
  }, [draft.armaments, draft.unarmedProwess, itemById]);

  const powerChips = useMemo((): SummaryChipItem[] => {
    const byId = new Map(officialPowers.map((p) => [String(p.id), p]));
    return draft.powerIds.map((id) => {
      const raw = byId.get(String(id));
      const energyCost = raw
        ? resolvePowerTechniqueEnergy('powers', raw, powerPartsDb, techniquePartsDb)
        : undefined;
      return {
        key: id,
        label: String(raw?.name ?? id),
        description: raw?.description ? String(raw.description) : undefined,
        energyCost,
        variant: 'power' as const,
      };
    });
  }, [draft.powerIds, officialPowers, powerPartsDb, techniquePartsDb]);

  const techniqueChips = useMemo((): SummaryChipItem[] => {
    const byId = new Map(officialTechniques.map((t) => [String(t.id), t]));
    return draft.techniqueIds.map((id) => {
      const raw = byId.get(String(id));
      const energyCost = raw
        ? resolvePowerTechniqueEnergy('techniques', raw, powerPartsDb, techniquePartsDb)
        : undefined;
      return {
        key: id,
        label: String(raw?.name ?? id),
        description: raw?.description ? String(raw.description) : undefined,
        energyCost,
        variant: 'technique' as const,
      };
    });
  }, [draft.techniqueIds, officialTechniques, powerPartsDb, techniquePartsDb]);

  const powersSectionTitle =
    powerChips.length > 0 && techniqueChips.length > 0
      ? copy.powersTitle
      : powerChips.length > 0
        ? copy.powersOnlyTitle
        : copy.techniquesOnlyTitle;

  const gridPowerAbility = pathType === 'martial' ? undefined : (draft.pow_abil ?? undefined);
  const gridMartialAbility = pathType === 'power' ? undefined : (draft.mart_abil ?? undefined);
  const gridSecondaryAbility = resolveDistinctSecondaryAbility(
    archetype?.secondary_ability,
    gridPowerAbility,
    gridMartialAbility
  );

  const hasPowersOrTechniques = powerChips.length > 0 || techniqueChips.length > 0;

  return (
    <div className="overflow-hidden rounded-card border border-border-light bg-surface shadow-sm">
      <div className="border-b border-border-light bg-surface-alt px-5 py-4">
        <GuidedSectionTitle>{copy.title}</GuidedSectionTitle>
        <p className="mt-0.5 font-nunito text-sm text-text-secondary">{copy.description}</p>
      </div>

      <div className="space-y-6 p-5">
        <div>
          <SummarySectionHeader title={copy.abilitiesTitle} />
          <AbilityScoreGrid
            abilities={draft.abilities}
            powerAbility={gridPowerAbility}
            martialAbility={gridMartialAbility}
            secondaryAbility={gridSecondaryAbility}
            mode="display"
          />
        </div>

        {ancestryTraitNames.length > 0 && (
          <div>
            <SummarySectionHeader title={copy.ancestryTitle} />
            <SummaryChipList items={ancestryTraitNames} />
          </div>
        )}

        {skillNames.length > 0 && (
          <div>
            <SummarySectionHeader title={copy.skillsTitle} />
            <SummaryChipList items={skillNames} />
          </div>
        )}

        {(archetypeFeatChips.length > 0 || characterFeatChips.length > 0) && (
          <div>
            <SummarySectionHeader title={copy.featsTitle} />
            <SummaryChipList items={[...archetypeFeatChips, ...characterFeatChips]} />
          </div>
        )}

        {loadoutItems.length > 0 && (
          <div>
            <SummarySectionHeader title={copy.loadoutTitle} />
            <SummaryChipList items={loadoutItems} />
          </div>
        )}

        {hasPowersOrTechniques && (
          <div>
            <SummarySectionHeader title={powersSectionTitle} />
            <SummaryChipList items={[...powerChips, ...techniqueChips]} />
          </div>
        )}
      </div>
    </div>
  );
}
