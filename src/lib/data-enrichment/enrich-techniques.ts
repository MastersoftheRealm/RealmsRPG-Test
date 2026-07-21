import type { CharacterTechnique } from '@/types';
import type { UserTechnique } from '@/hooks/use-user-library';
import type { TechniquePart } from '@/hooks/codex-types';
import { deriveTechniqueDisplay } from '@/lib/calculators';
import {
  dedupeEntityRefs,
  dedupeSavedParts,
} from '@/lib/library/dedupe-saved-parts';
import type { EnrichedTechnique } from './types';
import { findInLibrary } from './find-in-library';

/**
 * Enrich character techniques with full data from user's technique library
 * Uses deriveTechniqueDisplay to calculate stamina cost, action type, etc.
 */
export function enrichTechniques(
  characterTechniques: CharacterTechnique[] | undefined,
  userTechniqueLibrary: UserTechnique[],
  techniquePartsDb: TechniquePart[] = [],
  publicTechniqueLibrary?: UserTechnique[]
): EnrichedTechnique[] {
  if (!characterTechniques || characterTechniques.length === 0) return [];

  const uniqueTechniques = dedupeEntityRefs(characterTechniques);
  return uniqueTechniques.map(charTech => {
    const name = typeof charTech === 'string' ? charTech : charTech.name;
    
    let libraryItem = findInLibrary(userTechniqueLibrary, charTech);
    if (!libraryItem && publicTechniqueLibrary?.length) {
      libraryItem = findInLibrary(publicTechniqueLibrary, charTech);
    }
    
    if (libraryItem) {
      const rawItem = libraryItem as unknown as Record<string, unknown>;
      const isEmpowered =
        rawItem.empoweredTechnique === true ||
        rawItem.empowered_technique === true ||
        (rawItem.power != null && rawItem.technique != null);
      const empoweredTotals = rawItem.totals as Record<string, unknown> | undefined;
      const empoweredEnergy = typeof empoweredTotals?.energy === 'number' ? empoweredTotals.energy : undefined;
      const empoweredTP = typeof empoweredTotals?.trainingPoints === 'number' ? empoweredTotals.trainingPoints : undefined;
      // Extract first damage object if damage is an array
      const damageObj = Array.isArray(libraryItem.damage) && libraryItem.damage.length > 0
        ? libraryItem.damage[0]
        : undefined;
      
      // Use deriveTechniqueDisplay to calculate all display values including cost
      const displayData = deriveTechniqueDisplay(
        {
          name: libraryItem.name,
          description: libraryItem.description,
          parts: libraryItem.parts || [],
          attackMode: (libraryItem as { attackMode?: unknown }).attackMode as never,
          weaponName: (libraryItem as { weaponName?: string }).weaponName,
          weapon: libraryItem.weapon,
          damage: damageObj,
        },
        techniquePartsDb
      );
      
      return {
        id: libraryItem.id,
        name: libraryItem.name,
        description: libraryItem.description || '',
        parts: dedupeSavedParts(libraryItem.parts || []).map(part => ({
          id: String(part.id || ''),
          name: part.name || '',
          op_1_lvl: part.op_1_lvl,
          op_2_lvl: part.op_2_lvl,
          op_3_lvl: part.op_3_lvl,
        })),
        libraryItem,
        // Calculated display fields from deriveTechniqueDisplay
        cost: isEmpowered ? (empoweredEnergy ?? displayData.energy) : displayData.energy,
        tp: isEmpowered ? (empoweredTP ?? displayData.tp) : displayData.tp,
        actionType: displayData.actionType,
        weaponName: displayData.weaponName,
        damageStr: displayData.damageStr,
      };
    }
    
    // Not found in library - return placeholder
    return {
      id: typeof charTech === 'object' ? String(charTech.id || '') : name,
      name,
      description: 'Technique not found in your library',
      notInLibrary: true,
    };
  });
}
