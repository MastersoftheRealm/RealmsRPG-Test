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
  useEquipment,
  useUserItems,
  useUserPowers,
  useUserTechniques,
  usePowerParts,
  useTechniqueParts,
} from '@/hooks';
import { useGuidedCreatorStore } from '@/stores/guided-creator-store';
import { resolveGuidedSpeciesContext } from '@/lib/guided-creator/guided-species-resolve';
import {
  buildEquipmentLookup,
  resolveDraftArmaments,
} from '@/lib/guided-creator/resolve-loadout-items';
import { mergeLibraryBySource } from '@/lib/library/source-scope';
import { indexByNormalizedIds, normalizeId } from '@/lib/utils';
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
      <p className="font-nunito text-xs font-medium tracking-wide text-text-secondary uppercase">
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
  const { data: userPowers = [] } = useUserPowers();
  const { data: userTechniques = [] } = useUserTechniques();
  const { data: officialItems = [] } = useOfficialLibrary('items');
  const { data: userItems = [] } = useUserItems();
  const { data: codexEquipment = [] } = useEquipment();
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const speciesContext = useMemo(
    () => resolveGuidedSpeciesContext(draft, allSpecies),
    [draft, allSpecies],
  );
  const species = speciesContext.species;

  const pathType = draft.archetypeType;

  const traitById = useMemo(() => indexByNormalizedIds(allTraits), [allTraits]);

  const ancestryTraitNames = useMemo((): SummaryChipItem[] => {
    const resolvedSpeciesTraits = speciesContext.isMixed
      ? draft.selectedSpeciesTraits
      : applySpeciesTraitChoiceSelections(
          species?.species_traits,
          draft.selectedSpeciesTraitChoices,
          allTraits as TraitWithChoiceOptions[],
        );
    const ids = [
      ...resolvedSpeciesTraits,
      ...draft.selectedAncestryTraitIds,
      ...(draft.selectedCharacteristicId ? [draft.selectedCharacteristicId] : []),
      ...(draft.selectedFlawId ? [draft.selectedFlawId] : []),
    ];
    return ids.map((id) => {
      const trait = traitById.get(normalizeId(id));
      return {
        key: String(id),
        label: trait?.name ?? String(id),
        description: trait?.description,
        variant: 'list' as const,
      };
    });
  }, [speciesContext.isMixed, species, draft, allTraits, traitById]);

  const skillById = useMemo(() => indexByNormalizedIds(codexSkills), [codexSkills]);

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
      const skill = skillById.get(normalizeId(id));
      return {
        key: id,
        label: skill?.name ?? id,
        description: skill?.description,
        variant: 'list' as const,
      };
    });
  }, [draft.skills, draft.selectedSpeciesSkillIds, speciesContext.isMixed, species, skillById]);

  const featById = useMemo(() => indexByNormalizedIds(feats), [feats]);

  const featChipsForIds = (ids: string[]): SummaryChipItem[] =>
    ids.map((id) => {
      const feat = featById.get(normalizeId(id));
      return {
        key: id,
        label: feat?.name ?? id,
        description: feat?.description,
        variant: 'list' as const,
      };
    });

  const archetypeFeatChips = featChipsForIds(draft.archetypeFeatIds);
  const characterFeatChips = featChipsForIds(draft.characterFeatIds);

  const equipmentLookup = useMemo(
    () =>
      buildEquipmentLookup(mergeLibraryBySource('all', officialItems, userItems), codexEquipment),
    [officialItems, userItems, codexEquipment],
  );

  const loadoutItems = useMemo((): SummaryChipItem[] => {
    const items: SummaryChipItem[] = resolveDraftArmaments(draft, equipmentLookup).map((item) => {
      const qty = item.quantity > 1 ? ` ×${item.quantity}` : '';
      return {
        key: `${item.category}-${item.id}`,
        label: `${item.name}${qty}`,
        description: item.description,
        variant: 'list' as const,
      };
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
  }, [draft, equipmentLookup]);

  const powerLibrary = useMemo(
    () => mergeLibraryBySource('all', officialPowers, userPowers),
    [officialPowers, userPowers],
  );
  const techniqueLibrary = useMemo(
    () => mergeLibraryBySource('all', officialTechniques, userTechniques),
    [officialTechniques, userTechniques],
  );
  const powerById = useMemo(() => indexByNormalizedIds(powerLibrary), [powerLibrary]);
  const techniqueById = useMemo(() => indexByNormalizedIds(techniqueLibrary), [techniqueLibrary]);

  const powerChips = useMemo((): SummaryChipItem[] => {
    return draft.powerIds.map((id) => {
      const raw = powerById.get(normalizeId(id));
      const energyCost = raw
        ? resolvePowerTechniqueEnergy('powers', raw, powerPartsDb, techniquePartsDb)
        : undefined;
      return {
        key: id,
        label: String(raw?.name?.trim() || 'Unknown power'),
        description: raw?.description ? String(raw.description) : undefined,
        energyCost,
        variant: 'power' as const,
      };
    });
  }, [draft.powerIds, powerById, powerPartsDb, techniquePartsDb]);

  const techniqueChips = useMemo((): SummaryChipItem[] => {
    return draft.techniqueIds.map((id) => {
      const raw = techniqueById.get(normalizeId(id));
      const energyCost = raw
        ? resolvePowerTechniqueEnergy('techniques', raw, powerPartsDb, techniquePartsDb)
        : undefined;
      return {
        key: id,
        label: String(raw?.name?.trim() || 'Unknown technique'),
        description: raw?.description ? String(raw.description) : undefined,
        energyCost,
        variant: 'technique' as const,
      };
    });
  }, [draft.techniqueIds, techniqueById, powerPartsDb, techniquePartsDb]);

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
    gridMartialAbility,
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
