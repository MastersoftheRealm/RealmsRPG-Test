import type { CharacterPower } from '@/types';
import type { UserPower } from '@/hooks/use-user-library';
import type { PowerPart } from '@/hooks/codex-types';
import {
  composedPowerDamage,
  composedPowerSavedParts,
  derivePowerDisplay,
  formatPowerDamage,
} from '@/lib/calculators';
import { dedupeEntityRefs, dedupeSavedParts } from '@/lib/game/dedupe-saved-parts';
import type { EnrichedPower } from './types';
import { findInLibrary } from './find-in-library';

/**
 * Enrich character powers with full data from user's power library
 * Uses derivePowerDisplay to calculate energy cost, action type, etc.
 */
export function enrichPowers(
  characterPowers: CharacterPower[] | undefined,
  userPowerLibrary: UserPower[],
  powerPartsDb: PowerPart[] = [],
  publicPowerLibrary?: UserPower[],
): EnrichedPower[] {
  if (!characterPowers || characterPowers.length === 0) return [];

  const uniquePowers = dedupeEntityRefs(characterPowers);
  return uniquePowers.map((charPower) => {
    const name = typeof charPower === 'string' ? charPower : charPower.name;
    const innate = typeof charPower === 'object' ? !!charPower.innate : false;
    const selectedVariantId =
      typeof charPower === 'object' && charPower.selectedVariantId
        ? charPower.selectedVariantId
        : undefined;

    let libraryItem = findInLibrary(userPowerLibrary, charPower);
    if (!libraryItem && publicPowerLibrary?.length) {
      libraryItem = findInLibrary(publicPowerLibrary, charPower);
    }

    if (libraryItem) {
      // Use derivePowerDisplay to calculate all display values including cost
      const displayData = derivePowerDisplay(
        {
          name: libraryItem.name,
          description: libraryItem.description,
          parts: libraryItem.parts || [],
          actionType: libraryItem.actionType,
          isReaction: libraryItem.isReaction,
          range: libraryItem.range,
          area: libraryItem.area,
          duration: libraryItem.duration,
          damage: libraryItem.damage,
          composition: libraryItem.composition,
        },
        powerPartsDb,
        { selectedVariantId },
      );
      const composition = displayData.composition;
      // Preserve character's power id so toggles/remove match character.powers (library id can differ when matched by name)
      const identityId =
        typeof charPower === 'object' && (charPower as CharacterPower).id != null
          ? (charPower as CharacterPower).id
          : libraryItem.id;
      return {
        id: identityId,
        name: libraryItem.name,
        description: libraryItem.description || '',
        // Composed powers: every variant's parts count toward proficiency (ADR-0029).
        parts: dedupeSavedParts(
          composition ? composedPowerSavedParts(composition) : libraryItem.parts || [],
        ).map((part) => ({
          id: String(part.id || ''),
          name: part.name || '',
          op_1_lvl: part.op_1_lvl,
          op_2_lvl: part.op_2_lvl,
          op_3_lvl: part.op_3_lvl,
          ...(part.applyDuration ? { applyDuration: true } : {}),
        })),
        innate,
        libraryItem,
        // Calculated display fields from derivePowerDisplay
        cost: displayData.energy,
        actionType: displayData.actionType,
        area: displayData.area,
        duration: displayData.duration,
        range: displayData.range,
        damage: formatPowerDamage(
          composition ? composedPowerDamage(composition) : libraryItem.damage,
        ),
        ...(libraryItem.composition ? { composition: libraryItem.composition } : {}),
        ...(composition?.selectedVariantId
          ? { selectedVariantId: composition.selectedVariantId }
          : {}),
      };
    }

    // Not found in library - return placeholder
    return {
      id: typeof charPower === 'object' ? String(charPower.id || '') : name,
      name,
      description: 'Power not found in your library',
      innate,
      notInLibrary: true,
    };
  });
}
