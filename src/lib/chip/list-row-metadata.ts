/**
 * Helpers for opaque metadata in GridListRow detailSections (Phase D/E).
 * Use `metadataDescriptorChip` or `descriptorChipData` (`kind: 'descriptor'`) so chips
 * render as non-expandable DescriptorChips.
 */

import type { ChipData } from '@/components/shared/grid-list-row-types';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import { normalizeRangeDisplay } from '@/lib/utils';

export type MetadataDetailSection = {
  label: string;
  chips: ChipData[];
  hideLabelIfSingle?: boolean;
};

export const PARTS_PROFICIENCIES_LABEL = 'Parts & Proficiencies';
export const PROPERTIES_PROFICIENCIES_LABEL = 'Properties & Proficiencies';

export function partsProficienciesSection(chips: ChipData[]): MetadataDetailSection | undefined {
  if (chips.length === 0) return undefined;
  return { label: PARTS_PROFICIENCIES_LABEL, chips };
}

export function propertiesProficienciesSection(chips: ChipData[]): MetadataDetailSection | undefined {
  if (chips.length === 0) return undefined;
  return { label: PROPERTIES_PROFICIENCIES_LABEL, chips };
}

/** Non-expandable descriptor chip for list-row metadata (range, requirements, etc.). */
export function metadataDescriptorChip(label: string): ChipData {
  return descriptorChipData(label, 'default');
}

export function buildRangeDamageMetadataChips(opts: {
  range?: string | number | null;
  damage?: string | null;
}): ChipData[] {
  const chips: ChipData[] = [];
  if (opts.range != null && opts.range !== '') {
    const rangeStr = normalizeRangeDisplay(opts.range);
    if (rangeStr) chips.push(metadataDescriptorChip(`Range: ${rangeStr}`));
  }
  if (opts.damage) {
    chips.push(metadataDescriptorChip(`Damage: ${opts.damage}`));
  }
  return chips;
}

export function buildArmorRequirementMetadataChips(opts: {
  abilityRequirement?: { name?: string; level?: number } | null;
  agilityReduction?: number | null;
}): ChipData[] {
  const chips: ChipData[] = [];
  if (opts.abilityRequirement?.name && opts.abilityRequirement?.level) {
    chips.push(
      metadataDescriptorChip(
        `Requires: ${opts.abilityRequirement.name} ${opts.abilityRequirement.level}+`
      )
    );
  }
  if (opts.agilityReduction && opts.agilityReduction > 0) {
    chips.push(metadataDescriptorChip(`Agility Reduction: -${opts.agilityReduction}`));
  }
  return chips;
}

export function metadataDetailSection(
  chips: ChipData[],
  label = 'Details'
): MetadataDetailSection | undefined {
  if (chips.length === 0) return undefined;
  return { label, chips, hideLabelIfSingle: true };
}

export function mergeDetailSections(
  ...sectionGroups: Array<MetadataDetailSection[] | MetadataDetailSection | undefined>
): MetadataDetailSection[] {
  const flat: MetadataDetailSection[] = [];
  for (const group of sectionGroups) {
    if (!group) continue;
    if (Array.isArray(group)) flat.push(...group);
    else flat.push(group);
  }
  return flat;
}

/** Metadata (range/damage) + optional parts/properties sections for expanded rows. */
export function buildEntityMetadataDetailSections(opts: {
  range?: string | number | null;
  damage?: string | null;
  extraSections?: MetadataDetailSection[];
}): MetadataDetailSection[] {
  const meta = metadataDetailSection(buildRangeDamageMetadataChips(opts));
  return mergeDetailSections(meta, opts.extraSections);
}

/** Convenience: metadata chips + parts section (powers, techniques, modals). */
export function buildPartsAndMetadataDetailSections(opts: {
  range?: string | number | null;
  damage?: string | null;
  partChips: ChipData[];
}): MetadataDetailSection[] {
  const parts = partsProficienciesSection(opts.partChips);
  return buildEntityMetadataDetailSections({
    range: opts.range,
    damage: opts.damage,
    extraSections: parts ? [parts] : undefined,
  });
}

/** Uses / recovery metadata when collapsed columns omit those fields (e.g. creature feat modal). */
export function buildUsesRecoveryDetailSections(opts: {
  usesPerRec?: number | null;
  maxUses?: number | null;
  recPeriod?: string | null;
}): MetadataDetailSection[] {
  const usesVal = opts.usesPerRec ?? opts.maxUses;
  const usesDisplay =
    usesVal === 0 || usesVal === undefined || usesVal === null ? '-' : String(usesVal);
  const chips: ChipData[] = [];
  if (usesDisplay !== '-') {
    chips.push(
      metadataDescriptorChip(
        `Uses / recovery: ${usesDisplay}${opts.recPeriod ? ` / ${opts.recPeriod}` : ''}`
      )
    );
  } else if (opts.recPeriod) {
    chips.push(metadataDescriptorChip(`Recovery: ${opts.recPeriod}`));
  }
  if (chips.length === 0) return [];
  return [{ label: 'Uses', chips, hideLabelIfSingle: true }];
}
