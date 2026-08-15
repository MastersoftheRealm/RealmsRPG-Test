'use client';

import { useMemo } from 'react';
import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { PowerPart, TechniquePart } from '@/hooks';
import type { CharacterPower, CharacterTechnique } from '@/types';
import {
  dedupeByDocId,
  empoweredTechniqueToPowerSelectable,
  mergeEmpoweredTechniquesWithSource,
  mergeLibraryWithSource,
  mergeLookupPool,
  powerListToSelectable,
  techniqueListToSelectable,
} from '@/lib/creator/advanced-powers-selectable';

export function usePowersStepSelectables(args: {
  userPowers: UserPower[];
  publicPowers: UserPower[];
  userTechniques: UserTechnique[];
  publicTechniques: UserTechnique[];
  userEmpoweredTechniques: UserTechnique[];
  publicEmpoweredTechniques: UserTechnique[];
  powerParts: PowerPart[] | undefined | null;
  techniqueParts: TechniquePart[] | undefined | null;
  selectedPowers: CharacterPower[];
  selectedTechniques: CharacterTechnique[];
  recommendedPowerRefs: Set<string>;
  recommendedTechniqueRefs: Set<string>;
  pathName: string;
}) {
  const {
    userPowers,
    publicPowers,
    userTechniques,
    publicTechniques,
    userEmpoweredTechniques,
    publicEmpoweredTechniques,
    powerParts,
    techniqueParts,
    selectedPowers,
    selectedTechniques,
    recommendedPowerRefs,
    recommendedTechniqueRefs,
    pathName,
  } = args;

  const allPowersRaw = useMemo(
    () => mergeLibraryWithSource(userPowers, publicPowers),
    [userPowers, publicPowers],
  );
  const allTechniquesRaw = useMemo(
    () => mergeLibraryWithSource(userTechniques, publicTechniques),
    [userTechniques, publicTechniques],
  );
  const allEmpoweredTechniquesRaw = useMemo(
    () => mergeEmpoweredTechniquesWithSource(userEmpoweredTechniques, publicEmpoweredTechniques),
    [userEmpoweredTechniques, publicEmpoweredTechniques],
  );
  const allPowersForLookup = useMemo(
    () => mergeLookupPool(userPowers, publicPowers),
    [userPowers, publicPowers],
  );
  const allTechniquesForLookup = useMemo(
    () => mergeLookupPool(userTechniques, publicTechniques),
    [userTechniques, publicTechniques],
  );

  const selectedPowerIdsSet = useMemo(
    () => new Set(selectedPowers.map((p) => String(p.id))),
    [selectedPowers],
  );
  const powerSelectableOpts = useMemo(
    () => (pathName ? { selectedIds: selectedPowerIdsSet, pathName } : undefined),
    [pathName, selectedPowerIdsSet],
  );
  const allPowerSelectableItems = useMemo(
    () =>
      powerListToSelectable(allPowersRaw, powerParts, recommendedPowerRefs, powerSelectableOpts),
    [allPowersRaw, powerParts, recommendedPowerRefs, powerSelectableOpts],
  );
  const allPowersSelectable = useMemo(
    () =>
      powerListToSelectable(
        dedupeByDocId(allPowersRaw),
        powerParts,
        recommendedPowerRefs,
        powerSelectableOpts,
      ),
    [allPowersRaw, powerParts, recommendedPowerRefs, powerSelectableOpts],
  );
  const allEmpoweredSelectableItems = useMemo(
    () =>
      empoweredTechniqueToPowerSelectable(allEmpoweredTechniquesRaw, powerParts, techniqueParts),
    [allEmpoweredTechniquesRaw, powerParts, techniqueParts],
  );

  const selectedTechniqueIdsSet = useMemo(
    () => new Set(selectedTechniques.map((t) => String(t.id))),
    [selectedTechniques],
  );
  const techniqueSelectableOpts = useMemo(
    () => (pathName ? { selectedIds: selectedTechniqueIdsSet, pathName } : undefined),
    [pathName, selectedTechniqueIdsSet],
  );
  const allTechniqueSelectableItems = useMemo(
    () =>
      techniqueListToSelectable(
        allTechniquesRaw,
        techniqueParts,
        recommendedTechniqueRefs,
        techniqueSelectableOpts,
      ),
    [allTechniquesRaw, techniqueParts, recommendedTechniqueRefs, techniqueSelectableOpts],
  );
  const allTechniquesSelectable = useMemo(
    () =>
      techniqueListToSelectable(
        dedupeByDocId(allTechniquesRaw),
        techniqueParts,
        recommendedTechniqueRefs,
        techniqueSelectableOpts,
      ),
    [allTechniquesRaw, techniqueParts, recommendedTechniqueRefs, techniqueSelectableOpts],
  );

  const selectedPowerItems = useMemo((): SelectableItem[] => {
    return selectedPowers.map((p) => {
      const id = String(p.id);
      const found =
        allPowersSelectable.find((x) => x.id === id) ??
        allEmpoweredSelectableItems.find((x) => x.id === id);
      if (found) return found;
      return {
        id,
        name: p.name ?? 'Unknown',
        description: p.description ?? '',
        columns: [],
        data: p,
      };
    });
  }, [selectedPowers, allPowersSelectable, allEmpoweredSelectableItems]);

  const selectedTechniqueItems = useMemo((): SelectableItem[] => {
    return selectedTechniques.map((t) => {
      const id = String(t.id);
      const found = allTechniquesSelectable.find((x) => x.id === id);
      if (found) return found;
      return {
        id,
        name: t.name ?? 'Unknown',
        description: t.description ?? '',
        columns: [],
        data: t,
      };
    });
  }, [selectedTechniques, allTechniquesSelectable]);

  return {
    allPowersRaw,
    allTechniquesRaw,
    allEmpoweredTechniquesRaw,
    allPowersForLookup,
    allTechniquesForLookup,
    allPowerSelectableItems,
    allEmpoweredSelectableItems,
    allTechniqueSelectableItems,
    selectedPowerItems,
    selectedTechniqueItems,
  };
}
