/**
 * Helpers for opaque metadata in GridListRow detailSections (Phase D/E).
 * Use `metadataDescriptorChip` or `descriptorChipData` (`kind: 'descriptor'`) so chips
 * render as non-expandable DescriptorChips.
 *
 * Compact-fact grammar (TASK-454): when a column is omitted, prefer formatters in
 * `@/lib/detail-option/compact-facts` so chips read as natural language
 * ("2d6 Slashing damage", "Range 16 Spaces") rather than "Header: value".
 */

import type { ChipData } from '@/components/shared/grid-list-row-types';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import {
  abilityRequirementChip,
  agilityReductionFactChip,
  damageFactChip,
  formatActionTypeFact,
  rangeFactChip,
} from '@/lib/detail-option/compact-facts';

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

function pushLabeledFact(
  chips: ChipData[],
  label: string,
  value: string | number | null | undefined
) {
  if (value == null) return;
  const text = String(value).trim();
  if (!text || text === '-') return;
  chips.push(metadataDescriptorChip(`${label} ${text}`));
}

export function buildRangeDamageMetadataChips(opts: {
  range?: string | number | null;
  damage?: string | null;
  /** When Energy is omitted from collapsed columns (e.g. slim modal layouts). */
  energy?: string | number | null;
  /** When Duration is omitted from collapsed columns. */
  duration?: string | null;
  /** When Area is omitted from collapsed columns. */
  area?: string | null;
  /** When Action Type is omitted from collapsed columns. */
  actionType?: string | null;
}): ChipData[] {
  const chips: ChipData[] = [];
  pushLabeledFact(chips, 'Energy', opts.energy);
  const actionLabel = formatActionTypeFact(opts.actionType ?? undefined);
  if (actionLabel) chips.push(metadataDescriptorChip(actionLabel));
  pushLabeledFact(chips, 'Duration', opts.duration);
  pushLabeledFact(chips, 'Area', opts.area);
  const rangeChip = rangeFactChip(opts.range);
  if (rangeChip) chips.push(rangeChip);
  const dmgChip = damageFactChip(opts.damage);
  if (dmgChip) chips.push(dmgChip);
  return chips;
}

export function buildArmorRequirementMetadataChips(opts: {
  abilityRequirement?: { name?: string; level?: number } | null;
  agilityReduction?: number | null;
}): ChipData[] {
  const chips: ChipData[] = [];
  if (opts.abilityRequirement?.name && opts.abilityRequirement?.level) {
    const reqChip = abilityRequirementChip({
      name: opts.abilityRequirement.name,
      level: opts.abilityRequirement.level,
    });
    if (reqChip) chips.push(reqChip);
  }
    if (opts.agilityReduction && opts.agilityReduction > 0) {
    const agilityChip = agilityReductionFactChip(-opts.agilityReduction);
    if (agilityChip) chips.push(agilityChip);
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

/** Metadata fact chips + optional parts/properties sections for expanded rows. */
export function buildEntityMetadataDetailSections(opts: {
  range?: string | number | null;
  damage?: string | null;
  energy?: string | number | null;
  duration?: string | null;
  area?: string | null;
  actionType?: string | null;
  extraSections?: MetadataDetailSection[];
}): MetadataDetailSection[] {
  const meta = metadataDetailSection(buildRangeDamageMetadataChips(opts));
  return mergeDetailSections(meta, opts.extraSections);
}

/** Convenience: metadata chips + parts section (powers, techniques, modals). */
export function buildPartsAndMetadataDetailSections(opts: {
  range?: string | number | null;
  damage?: string | null;
  energy?: string | number | null;
  duration?: string | null;
  area?: string | null;
  actionType?: string | null;
  partChips: ChipData[];
}): MetadataDetailSection[] {
  const parts = partsProficienciesSection(opts.partChips);
  return buildEntityMetadataDetailSections({
    range: opts.range,
    damage: opts.damage,
    energy: opts.energy,
    duration: opts.duration,
    area: opts.area,
    actionType: opts.actionType,
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
