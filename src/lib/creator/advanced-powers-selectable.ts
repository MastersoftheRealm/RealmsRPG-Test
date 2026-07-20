/**
 * Advanced creator powers-step: pure SelectableItem builders + library merge helpers.
 * Keeps sheet `buildEmpoweredPowerSelectableItem` as the empowered base (no fork).
 */

import type { SelectableItem } from '@/components/shared/unified-selection-modal';
import type { UserPower, UserTechnique } from '@/hooks/use-user-library';
import type { PowerPart, TechniquePart } from '@/hooks';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import type { PowerDocument } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import type { TechniqueDocument } from '@/lib/calculators/technique-calc';
import { partChipsFromDisplay } from '@/lib/chip/part-chips-from-display';
import {
  buildEntityMetadataDetailSections,
  buildPartsAndMetadataDetailSections,
  mergeDetailSections,
} from '@/lib/chip/list-row-metadata';
import { buildEmpoweredPowerSelectableItem } from '@/hooks/add-library-item/build-empowered-selectable-item';

export type LibrarySource = 'my' | 'public';
export type WithSource<T> = T & { _source: LibrarySource };

export type PathSelectableOptions = {
  selectedIds?: Set<string>;
  pathName?: string;
};

/** Tag library rows with source for USM SourceFilter merge-by-source. */
export function mergeLibraryWithSource<T>(
  mine: T[],
  pub: T[]
): WithSource<T>[] {
  return [
    ...mine.map((item) => ({ ...item, _source: 'my' as const })),
    ...pub.map((item) => ({ ...item, _source: 'public' as const })),
  ];
}

/** Deduplicate by docId/id (first wins). */
export function dedupeByDocId<T extends { docId?: string | number | null; id?: string | number | null }>(
  list: T[]
): T[] {
  const seen = new Set<string>();
  return list.filter((item) => {
    const id = String(item.docId ?? item.id ?? '');
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

/** Merged user+public pool for selected-item lookup (persists across tab/source). */
export function mergeLookupPool<T extends { docId?: string | number | null; id?: string | number | null }>(
  mine: T[],
  pub: T[]
): T[] {
  return dedupeByDocId([...mine, ...pub]);
}

/** Empowered techniques: merge + dedupe by docId/id. */
export function mergeEmpoweredTechniquesWithSource(
  mine: UserTechnique[],
  pub: UserTechnique[]
): WithSource<UserTechnique>[] {
  return dedupeByDocId(mergeLibraryWithSource(mine, pub));
}

export function powerListToSelectable(
  list: WithSource<UserPower>[],
  powerParts: PowerPart[] | undefined | null,
  recommendedPowerRefs: Set<string>,
  options?: PathSelectableOptions
): SelectableItem[] {
  return list.flatMap((power) => {
    const itemId = String(power.docId ?? power.id ?? '');
    if (!itemId) return [];
    const doc: PowerDocument = {
      name: String(power.name ?? ''),
      description: String(power.description ?? ''),
      parts: Array.isArray(power.parts) ? (power.parts as PowerDocument['parts']) : [],
      damage: power.damage as PowerDocument['damage'],
      actionType: power.actionType,
      isReaction: power.isReaction,
      range: power.range as PowerDocument['range'],
      area: power.area as PowerDocument['area'],
      duration: power.duration as PowerDocument['duration'],
    };
    const display = derivePowerDisplay(doc, powerParts ?? []);
    const partChips = partChipsFromDisplay(display.partChips);
    const damageStr = formatPowerDamage(power.damage) || '-';
    const isRecommended =
      recommendedPowerRefs.has(itemId.toLowerCase()) ||
      recommendedPowerRefs.has(String(power.name).toLowerCase());
    const showPathBadge =
      isRecommended &&
      options?.pathName &&
      options?.selectedIds &&
      options.selectedIds.has(itemId);
    // Duration/Area/Range omitted from compact modal columns → labeled expanded chips
    const detailSections = buildPartsAndMetadataDetailSections({
      range: display.range,
      duration: display.duration,
      area: display.area,
      partChips,
      partsFamily: 'power',
    });
    return [
      {
        id: itemId,
        name: power.name,
        description: power.description,
        columns: [
          { key: 'Action', value: display.actionType ?? '-', align: 'center' as const },
          { key: 'Energy', value: String(display.energy ?? '-'), align: 'center' as const },
          { key: 'Training Points', value: String(display.tp ?? '-'), align: 'center' as const },
          { key: 'Damage', value: damageStr, align: 'center' as const },
        ],
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        totalCost: display.tp > 0 ? display.tp : undefined,
        costLabel: display.tp > 0 ? 'Training Points' : undefined,
        badges: showPathBadge ? [{ label: `(${options!.pathName})`, color: 'gray' as const }] : undefined,
        data: power,
      },
    ];
  });
}

export function techniqueListToSelectable(
  list: WithSource<UserTechnique>[],
  techniqueParts: TechniquePart[] | undefined | null,
  recommendedTechniqueRefs: Set<string>,
  options?: PathSelectableOptions
): SelectableItem[] {
  return list.flatMap((tech) => {
    const itemId = String(tech.docId ?? tech.id ?? '');
    if (!itemId) return [];
    const doc: TechniqueDocument = {
      name: String(tech.name ?? ''),
      description: String(tech.description ?? ''),
      parts: Array.isArray(tech.parts) ? (tech.parts as TechniqueDocument['parts']) : [],
      damage:
        Array.isArray(tech.damage) && tech.damage[0]
          ? tech.damage[0]
          : (tech.damage as TechniqueDocument['damage']),
      weapon: tech.weapon as TechniqueDocument['weapon'],
    };
    const display = deriveTechniqueDisplay(doc, techniqueParts ?? []);
    const partChips = partChipsFromDisplay(display.partChips);
    const isRecommended =
      recommendedTechniqueRefs.has(itemId.toLowerCase()) ||
      recommendedTechniqueRefs.has(String(tech.name).toLowerCase());
    const showPathBadge =
      isRecommended &&
      options?.pathName &&
      options?.selectedIds &&
      options.selectedIds.has(itemId);
    const detailSections = buildPartsAndMetadataDetailSections({
      damage: display.damageStr !== '-' ? display.damageStr : undefined,
      partChips,
      partsFamily: 'technique',
    });
    return [
      {
        id: itemId,
        name: tech.name,
        description: tech.description,
        columns: [
          { key: 'Action', value: display.actionType || '-', align: 'center' as const },
          { key: 'Energy', value: String(display.energy), align: 'center' as const },
          { key: 'Weapon', value: display.weaponName || '-', align: 'center' as const },
          { key: 'Training Points', value: String(display.tp), align: 'center' as const },
        ],
        detailSections: detailSections.length > 0 ? detailSections : undefined,
        totalCost: typeof display.tp === 'number' && display.tp > 0 ? display.tp : undefined,
        costLabel: typeof display.tp === 'number' && display.tp > 0 ? 'Training Points' : undefined,
        badges: showPathBadge ? [{ label: `(${options!.pathName})`, color: 'gray' as const }] : undefined,
        data: tech,
      },
    ];
  });
}

/** Map empowered techniques into the powers-modal SelectableItem shape (compact columns). */
export function empoweredTechniqueToPowerSelectable(
  list: WithSource<UserTechnique>[]
): SelectableItem[] {
  return list.flatMap((technique) => {
    const itemId = String(technique.docId ?? technique.id ?? '');
    if (!itemId) return [];
    const base = buildEmpoweredPowerSelectableItem(technique);
    const raw = technique as unknown as Record<string, unknown>;
    const totals = (raw.totals as Record<string, unknown> | undefined) ?? {};
    const energy = Number(totals.energy ?? 0);
    const tp = Number(totals.trainingPoints ?? 0);
    const actionCol = base.columns?.find((c) => c.key === 'Action');
    const damageCol = base.columns?.find((c) => c.key === 'Damage');
    const durationCol = base.columns?.find((c) => c.key === 'Duration');
    const areaCol = base.columns?.find((c) => c.key === 'Area');
    // Compact modal drops Duration/Area columns → keep them as labeled chips
    const omittedFacts = buildEntityMetadataDetailSections({
      duration: durationCol?.value != null ? String(durationCol.value) : undefined,
      area: areaCol?.value != null ? String(areaCol.value) : undefined,
    });
    return [
      {
        ...base,
        id: itemId,
        columns: [
          { key: 'Action', value: actionCol?.value ?? '-', align: 'center' as const },
          { key: 'Energy', value: String(energy || '-'), align: 'center' as const },
          { key: 'Training Points', value: String(tp || '-'), align: 'center' as const },
          { key: 'Damage', value: damageCol?.value ?? '-', align: 'center' as const },
        ],
        detailSections: mergeDetailSections(omittedFacts, base.detailSections),
        totalCost: tp > 0 ? tp : undefined,
        costLabel: tp > 0 ? 'Training Points' : undefined,
        data: technique,
      },
    ];
  });
}
