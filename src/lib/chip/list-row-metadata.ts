/**
 * Helpers for opaque metadata in GridListRow detailSections (Phase D/E).
 * Use `metadataDescriptorChip` or `descriptorChipData` (`kind: 'descriptor'`) so chips
 * render as non-expandable DescriptorChips.
 *
 * Compact-fact grammar (TASK-454): when a column is omitted, prefer formatters in
 * `@/lib/detail-option/compact-facts` so chips read as natural language
 * ("2d6 Slashing damage", "Range 16 Spaces") rather than "Header: value".
 *
 * Parts/Properties & Proficiencies (TASK-583): sections set `defaultCollapsed` +
 * `labelHelpKey` so GridListRow collapses them by default with type-appropriate InfoTippy.
 */

import type { ChipData } from '@/components/patterns/list/grid-list-row-types';
import { descriptorChipData } from '@/lib/chip/chip-data-helpers';
import {
  abilityRequirementChip,
  actionTypeFactChip,
  agilityReductionFactChip,
  compactFactChip,
  criticalRangeIncreaseFactChip,
  currencyFactChip,
  damageFactChip,
  damageReductionFactChip,
  energyFactChip,
  formatActionTypeFact,
  isBlank,
  isMechanicPropertyName,
  rangeFactChip,
  trainingPointsFactChip,
} from '@/lib/detail-option/compact-facts';
import type { GlrFactId } from '@/lib/glr/glr-fact-catalog';
import { resolveSurfaceLayout, type GlrSurfaceId } from '@/lib/glr/glr-surface-bindings';

/** InfoTippy key for Parts/Properties & Proficiencies (resolved in GridListRow). */
export type PartsPropertiesHelpKey =
  | 'power-parts'
  | 'technique-parts'
  | 'parts'
  | 'weapon-properties'
  | 'armor-properties'
  | 'shield-properties'
  | 'item-properties'
  | 'properties';

export type MetadataDetailSection = {
  label: string;
  chips: ChipData[];
  hideLabelIfSingle?: boolean | undefined;
  /**
   * When true, section starts collapsed with a chevron toggle (TASK-583).
   * Used for Parts/Properties & Proficiencies; descriptor/metadata sections stay open.
   */
  defaultCollapsed?: boolean | undefined;
  /** InfoTippy beside the section label (Parts/Properties & Proficiencies). */
  labelHelpKey?: PartsPropertiesHelpKey | undefined;
};

export const PARTS_PROFICIENCIES_LABEL = 'Parts & Proficiencies';
export const PROPERTIES_PROFICIENCIES_LABEL = 'Properties & Proficiencies';

/** Official browse lists sometimes use short labels. */
const PARTS_OR_PROPERTIES_LABELS = new Set([
  PARTS_PROFICIENCIES_LABEL,
  PROPERTIES_PROFICIENCIES_LABEL,
  'Parts',
  'Properties',
]);

export function isPartsOrPropertiesProficienciesLabel(label: string | undefined): boolean {
  return Boolean(label && PARTS_OR_PROPERTIES_LABELS.has(label));
}

export function isPartsOrPropertiesProficienciesSection(
  section: Pick<MetadataDetailSection, 'label' | 'defaultCollapsed'>,
): boolean {
  return section.defaultCollapsed === true || isPartsOrPropertiesProficienciesLabel(section.label);
}

export function helpKeyForPartsOrPropertiesLabel(
  label: string | undefined,
): PartsPropertiesHelpKey | undefined {
  if (!label) return undefined;
  if (label === PARTS_PROFICIENCIES_LABEL || label === 'Parts') return 'parts';
  if (label === PROPERTIES_PROFICIENCIES_LABEL || label === 'Properties') return 'properties';
  return undefined;
}

export function partsProficienciesSection(
  chips: ChipData[],
  family: 'power' | 'technique' | 'parts' = 'parts',
): MetadataDetailSection | undefined {
  if (chips.length === 0) return undefined;
  const labelHelpKey: PartsPropertiesHelpKey =
    family === 'power' ? 'power-parts' : family === 'technique' ? 'technique-parts' : 'parts';
  return {
    label: PARTS_PROFICIENCIES_LABEL,
    chips,
    defaultCollapsed: true,
    labelHelpKey,
  };
}

export function propertiesProficienciesSection(
  chips: ChipData[],
  family: 'weapon' | 'armor' | 'shield' | 'item' | 'properties' = 'properties',
): MetadataDetailSection | undefined {
  const ranked =
    family === 'armor' ? chips.filter((chip) => !isMechanicPropertyName(chip.name)) : chips;
  if (ranked.length === 0) return undefined;
  const labelHelpKey: PartsPropertiesHelpKey =
    family === 'weapon'
      ? 'weapon-properties'
      : family === 'armor'
        ? 'armor-properties'
        : family === 'shield'
          ? 'shield-properties'
          : family === 'item'
            ? 'item-properties'
            : 'properties';
  return {
    label: PROPERTIES_PROFICIENCIES_LABEL,
    chips: ranked,
    defaultCollapsed: true,
    labelHelpKey,
  };
}

/** Non-expandable descriptor chip for list-row metadata (range, requirements, etc.). */
export function metadataDescriptorChip(label: string): ChipData {
  return descriptorChipData(label, 'default');
}

function pushLabeledFact(
  chips: ChipData[],
  label: string,
  value: string | number | null | undefined,
) {
  if (value == null) return;
  const text = String(value).trim();
  if (!text || text === '-') return;
  chips.push(metadataDescriptorChip(`${label} ${text}`));
}

export function buildRangeDamageMetadataChips(opts: {
  range?: string | number | null | undefined;
  damage?: string | null | undefined;
  /** When Energy is omitted from collapsed columns (e.g. slim modal layouts). */
  energy?: string | number | null | undefined;
  /** When Duration is omitted from collapsed columns. */
  duration?: string | null | undefined;
  /** When Area is omitted from collapsed columns. */
  area?: string | null | undefined;
  /** When Action Type is omitted from collapsed columns. */
  actionType?: string | null | undefined;
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

export function metadataDetailSection(
  chips: ChipData[],
  label = 'Details',
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
  range?: string | number | null | undefined;
  damage?: string | null | undefined;
  energy?: string | number | null | undefined;
  duration?: string | null | undefined;
  area?: string | null | undefined;
  actionType?: string | null | undefined;
  extraSections?: MetadataDetailSection[] | undefined;
}): MetadataDetailSection[] {
  const meta = metadataDetailSection(buildRangeDamageMetadataChips(opts));
  return mergeDetailSections(meta, opts.extraSections);
}

/** Values for ranked GLR facts that the density resolver placed on chips. */
export interface GlrFactChipSource {
  actionType?: string | null | undefined;
  area?: string | number | null | undefined;
  abilityRequirement?: { name?: string | undefined; level?: number | undefined } | null | undefined;
  agilityReduction?: number | null | undefined;
  block?: string | number | null | undefined;
  category?: string | null | undefined;
  criticalRangeIncrease?: number | null | undefined;
  currency?: number | null | undefined;
  damage?: unknown | undefined;
  damageReduction?: number | null | undefined;
  duration?: string | null | undefined;
  energy?: number | null | undefined;
  range?: string | number | null | undefined;
  rarity?: string | null | undefined;
  recovery?: string | null | undefined;
  reqLevel?: string | number | null | undefined;
  trainingPoints?: number | null | undefined;
  uses?: string | number | null | undefined;
  weapon?: string | null | undefined;
  /** Feat governing Ability column when no min-score requirement object exists. */
  ability?: string | null | undefined;
}

function labeledFactChip(
  label: string,
  value: string | number | null | undefined,
): ChipData | null {
  if (isBlank(value)) return null;
  const text = String(value).trim();
  const alreadyLabeled = text.toLowerCase().startsWith(label.toLowerCase());
  return compactFactChip(alreadyLabeled ? text : `${label} ${text}`);
}

/** Descriptor chips for `layout.chipFacts` — parts/properties stay in their own sections. */
export function rankedGlrFactChips(
  chipFacts: readonly GlrFactId[],
  source: GlrFactChipSource,
): ChipData[] {
  const chips: ChipData[] = [];
  for (const factId of chipFacts) {
    let chip: ChipData | null = null;
    switch (factId) {
      case 'actionType':
        chip = actionTypeFactChip(source.actionType);
        break;
      case 'area':
        chip = labeledFactChip('Area', source.area);
        break;
      case 'abilityRequirement':
        chip =
          abilityRequirementChip(
            source.abilityRequirement?.name && source.abilityRequirement.level != null
              ? {
                  name: source.abilityRequirement.name,
                  level: source.abilityRequirement.level,
                }
              : null,
          ) ?? labeledFactChip('Ability', source.ability);
        break;
      case 'agilityReduction':
        chip = agilityReductionFactChip(source.agilityReduction);
        break;
      case 'block':
        chip = labeledFactChip('Block', source.block);
        break;
      case 'category':
        chip = labeledFactChip('Category', source.category);
        break;
      case 'criticalRangeIncrease':
        chip = criticalRangeIncreaseFactChip(source.criticalRangeIncrease);
        break;
      case 'currency':
        chip = currencyFactChip(source.currency);
        break;
      case 'damage':
        chip = damageFactChip(source.damage);
        break;
      case 'damageReduction':
        chip = damageReductionFactChip(source.damageReduction);
        break;
      case 'duration':
        chip = labeledFactChip('Duration', source.duration);
        break;
      case 'energy':
        chip = energyFactChip(source.energy);
        break;
      case 'range':
        chip = rangeFactChip(source.range);
        break;
      case 'rarity':
        chip = labeledFactChip('Rarity', source.rarity);
        break;
      case 'recovery':
        chip = labeledFactChip('Recovery', source.recovery);
        break;
      case 'reqLevel':
        chip = labeledFactChip('Req. Level', source.reqLevel);
        break;
      case 'trainingPoints':
        chip = trainingPointsFactChip(source.trainingPoints);
        break;
      case 'uses':
        chip = labeledFactChip('Uses', source.uses);
        break;
      case 'weapon':
        chip = labeledFactChip('Attack', source.weapon);
        break;
      default:
        break;
    }
    if (chip) chips.push(chip);
  }
  return chips;
}

/** Ranked fact chips from `layout.chipFacts`, then optional parts/properties sections. */
export function buildGlrFactDetailSections(opts: {
  chipFacts: readonly GlrFactId[];
  facts: GlrFactChipSource;
  extraSections?: MetadataDetailSection[] | undefined;
}): MetadataDetailSection[] {
  return mergeDetailSections(
    metadataDetailSection(rankedGlrFactChips(opts.chipFacts, opts.facts)),
    opts.extraSections,
  );
}

/** Bind a registered surface and emit its overflow/demoted fact chips. */
export function glrSurfaceDetailSections(
  surfaceId: GlrSurfaceId,
  facts: GlrFactChipSource,
  extraSections?: MetadataDetailSection[] | undefined,
): MetadataDetailSection[] {
  return buildGlrFactDetailSections({
    chipFacts: resolveSurfaceLayout(surfaceId).chipFacts,
    facts,
    extraSections,
  });
}

/** Convenience: metadata chips + parts section (powers, techniques, modals). */
export function buildPartsAndMetadataDetailSections(opts: {
  range?: string | number | null | undefined;
  damage?: string | null | undefined;
  energy?: string | number | null | undefined;
  duration?: string | null | undefined;
  area?: string | null | undefined;
  actionType?: string | null | undefined;
  partChips: ChipData[];
  /** Tailors Parts & Proficiencies InfoTippy copy (default generic parts). */
  partsFamily?: 'power' | 'technique' | 'parts' | undefined;
}): MetadataDetailSection[] {
  const parts = partsProficienciesSection(opts.partChips, opts.partsFamily ?? 'parts');
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
