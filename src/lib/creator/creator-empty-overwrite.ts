/**
 * Block silent overwrites when an existing or official row would be saved hollow.
 */

import type { CreatorLibraryType } from '@/hooks/use-creator-save';

function descriptionIsEmpty(data: Record<string, unknown>): boolean {
  const description = typeof data.description === 'string' ? data.description.trim() : '';
  return description.length === 0;
}

function arrayIsEmpty(value: unknown): boolean {
  return !Array.isArray(value) || value.length === 0;
}

function empoweredPartsEmpty(data: Record<string, unknown>): boolean {
  const power = data.power;
  const technique = data.technique;
  const powerParts =
    power && typeof power === 'object' && 'parts' in power
      ? (power as { parts?: unknown }).parts
      : undefined;
  const powerAdvanced =
    power && typeof power === 'object' && 'mechanics' in power
      ? (power as { mechanics?: unknown }).mechanics
      : undefined;
  const techniqueParts =
    technique && typeof technique === 'object' && 'parts' in technique
      ? (technique as { parts?: unknown }).parts
      : undefined;
  return arrayIsEmpty(powerParts) && arrayIsEmpty(powerAdvanced) && arrayIsEmpty(techniqueParts);
}

function creatureContentEmpty(data: Record<string, unknown>): boolean {
  return (
    arrayIsEmpty(data.powers) &&
    arrayIsEmpty(data.techniques) &&
    arrayIsEmpty(data.feats) &&
    arrayIsEmpty(data.armaments)
  );
}

function partsOrPropertiesEmpty(type: CreatorLibraryType, data: Record<string, unknown>): boolean {
  switch (type) {
    case 'powers':
    case 'techniques':
      return arrayIsEmpty(data.parts);
    case 'empowered-techniques':
      return empoweredPartsEmpty(data);
    case 'items':
      return arrayIsEmpty(data.properties);
    case 'creatures':
      return creatureContentEmpty(data);
    default:
      return false;
  }
}

/** True when an existing row would be saved without description or authored content. */
export function creatorPayloadWouldHollowExistingRow(
  type: CreatorLibraryType,
  data: Record<string, unknown>,
): boolean {
  return descriptionIsEmpty(data) || partsOrPropertiesEmpty(type, data);
}

export const CREATOR_EMPTY_OVERWRITE_TITLE = 'Save empty content?';

export function creatorEmptyOverwriteDescription(contentLabel: string): string {
  return `This ${contentLabel} is missing a description or parts. Saving will overwrite the existing library row unless you mean to clear it.`;
}
