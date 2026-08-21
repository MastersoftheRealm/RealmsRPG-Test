/**
 * Path choice-card deep-dive — overview + expandable path catalog sections (TASK-434).
 */

'use client';

import { useMemo } from 'react';
import {
  useCodexFeats,
  useEquipment,
  useItemProperties,
  useOfficialLibrary,
  usePowerParts,
  useTechniqueParts,
  useUserItems,
} from '@/hooks';
import { buildEquipmentCatalogRows } from '@/lib/guided-creator/equipment-catalog-rows';
import { buildEquipmentLookup } from '@/lib/guided-creator/resolve-loadout-items';
import { mergeLibraryBySource } from '@/lib/library/source-scope';
import { normalizeId } from '@/lib/utils';
import { parseArchetypePathData, parseIdQuantityStrings } from '@/lib/game/archetype-path';
import { GUIDED_CREATOR_COPY } from '@/lib/constants/site-copy';
import {
  buildCombatLookup,
  equipmentRefToDetailOption,
  factChip,
  featToDetailOption,
  resolveCombatDetailOption,
} from '@/lib/detail-option';
import type { CodexFeat } from '@/types/codex';
import type { Archetype, PathItemRecommendation } from '@/types/archetype';
import type { LibraryItem, LibraryPower, LibraryTechnique } from '@/types/library';
import { getFeatRestrictionNotice } from '@/lib/codex/feat-restriction-notice';
import {
  guidedPathDetailArchetypeFeats,
  guidedPathDetailArmor,
  guidedPathDetailCharacterFeats,
  guidedPathDetailLoadouts,
  guidedPathDetailPowers,
  guidedPathDetailTechniques,
  guidedPathDetailWeapons,
} from '../../../public/tooltip-text';
import { GuidedDetailOptionList, type GuidedDetailOptionItem } from './guided-detail-option-list';
import {
  GuidedEntityDetailModal,
  type GuidedEntityDetailSection,
} from './guided-entity-detail-modal';
import { GuidedPathDetailOverview } from './guided-path-detail-overview';
import { GuidedOverviewSection } from './guided-overview-section';
import { GuidedRestrictionNotice } from './guided-restriction-notice';
import { GUIDED_OVERVIEW_STYLES as o } from './guided-choice-styles';

const detailCopy = GUIDED_CREATOR_COPY.steps.path.detail;

export interface GuidedPathDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  path: Archetype | null;
  /** Apply this path from the detail footer Select. */
  onSelect?: (() => void) | undefined;
}

function findFeatByIdOrName(feats: CodexFeat[], ref: string): CodexFeat | undefined {
  const key = String(ref).trim().toLowerCase();
  if (!key) return undefined;
  return feats.find(
    (f) => String(f.id).toLowerCase() === key || String(f.name).toLowerCase() === key,
  );
}

/** Path deep-dive feat row: Uses DescriptorChip + restriction notice without uses restatement. */
function pathFeatDetailOption(feat: CodexFeat): GuidedDetailOptionItem {
  const base = featToDetailOption(feat);
  const notice = getFeatRestrictionNotice(feat, { level: 1, omitLimitedUses: true });
  if (!notice) return base;
  return {
    ...base,
    supplementalExpandedContent: <GuidedRestrictionNotice notice={notice} />,
  };
}

function collectFeatIds(
  level1: NonNullable<ReturnType<typeof parseArchetypePathData>>['level1'],
): string[] {
  if (!level1) return [];
  const ids = new Set<string>();
  level1.feats?.forEach((id) => ids.add(String(id)));
  level1.guidance_groups?.forEach((g) => {
    g.feats?.forEach((id) => ids.add(String(id)));
  });
  return Array.from(ids);
}

function collectPowerOrTechniqueIds(
  level1: NonNullable<ReturnType<typeof parseArchetypePathData>>['level1'],
  kind: 'powers' | 'techniques',
): string[] {
  if (!level1) return [];
  const ids = new Set<string>();
  const flat = kind === 'powers' ? level1.powers : level1.techniques;
  flat?.forEach((id) => ids.add(String(id)));
  level1.guidance_groups?.forEach((g) => {
    const list = kind === 'powers' ? g.powers : g.techniques;
    list?.forEach((id) => ids.add(String(id)));
  });
  return Array.from(ids);
}

function collectEquipmentRefs(
  level1: NonNullable<ReturnType<typeof parseArchetypePathData>>['level1'],
): PathItemRecommendation[] {
  if (!level1) return [];
  const byId = new Map<string, PathItemRecommendation>();
  const add = (ref: PathItemRecommendation) => {
    const key = normalizeId(ref.id);
    if (!key) return;
    const prev = byId.get(key);
    if (!prev || ref.quantity > prev.quantity) byId.set(key, ref);
  };

  level1.armamentRecommendations?.forEach(add);
  level1.equipmentRecommendations?.forEach(add);
  level1.sharedEquipment?.forEach(add);
  level1.guidance_groups?.forEach((g) => {
    parseIdQuantityStrings([...(g.armaments ?? []), ...(g.equipment ?? [])]).forEach(add);
  });

  return Array.from(byId.values());
}

export function GuidedPathDetailModal({
  isOpen,
  onClose,
  path,
  onSelect,
}: GuidedPathDetailModalProps) {
  const pathData = useMemo(
    () => (path ? parseArchetypePathData(path.path_data) : undefined),
    [path],
  );
  const level1 = pathData?.level1;
  const archetypeType = (path?.type || 'power') as Archetype['type'];
  const showTechniques = archetypeType === 'martial';
  const showPowers = archetypeType === 'power' || archetypeType === 'powered-martial';

  const { data: feats = [], isLoading: featsLoading } = useCodexFeats();
  const { data: officialItems = [], isLoading: itemsLoading } = useOfficialLibrary('items');
  const { data: userItems = [] } = useUserItems();
  const { data: codexEquipment = [], isLoading: equipmentLoading } = useEquipment();
  const { data: itemProperties = [], isLoading: propertiesLoading } = useItemProperties();
  const { data: officialPowers = [], isLoading: powersLoading } = useOfficialLibrary('powers', {
    enabled: showPowers,
  });
  const { data: officialTechniques = [], isLoading: techniquesLoading } = useOfficialLibrary(
    'techniques',
    { enabled: showTechniques },
  );
  const { data: powerPartsDb = [] } = usePowerParts();
  const { data: techniquePartsDb = [] } = useTechniqueParts();

  const catalogsPending = Boolean(
    path &&
    ((featsLoading && feats.length === 0) ||
      ((itemsLoading || equipmentLoading) &&
        officialItems.length === 0 &&
        codexEquipment.length === 0) ||
      (propertiesLoading && itemProperties.length === 0) ||
      (showPowers && powersLoading && officialPowers.length === 0) ||
      (showTechniques && techniquesLoading && officialTechniques.length === 0)),
  );

  const mergedItems = useMemo(
    () => mergeLibraryBySource('all', officialItems as LibraryItem[], userItems),
    [officialItems, userItems],
  );
  const equipmentMap = useMemo(
    () => buildEquipmentLookup(mergedItems, codexEquipment),
    [mergedItems, codexEquipment],
  );
  const catalog = useMemo(
    () => buildEquipmentCatalogRows(mergedItems, codexEquipment, itemProperties),
    [mergedItems, codexEquipment, itemProperties],
  );

  const sections = useMemo((): GuidedEntityDetailSection[] => {
    if (!path || !level1) return [];
    const result: GuidedEntityDetailSection[] = [];

    const featIds = collectFeatIds(level1);
    const resolvedFeats = featIds
      .map((id) => findFeatByIdOrName(feats, id))
      .filter((f): f is CodexFeat => Boolean(f));
    const archetypeFeats = resolvedFeats.filter((f) => !f.char_feat);
    const characterFeats = resolvedFeats.filter((f) => f.char_feat === true);

    if (archetypeFeats.length > 0) {
      result.push({
        id: 'archetype-feats',
        title: detailCopy.archetypeFeatsTitle,
        tip: guidedPathDetailArchetypeFeats,
        itemCount: archetypeFeats.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.archetypeFeatsIntro}</p>
            <GuidedDetailOptionList items={archetypeFeats.map(pathFeatDetailOption)} />
          </div>
        ),
      });
    }

    if (characterFeats.length > 0) {
      result.push({
        id: 'character-feats',
        title: detailCopy.characterFeatsTitle,
        tip: guidedPathDetailCharacterFeats,
        itemCount: characterFeats.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.characterFeatsIntro}</p>
            <GuidedDetailOptionList items={characterFeats.map(pathFeatDetailOption)} />
          </div>
        ),
      });
    }

    const equipmentRefs = collectEquipmentRefs(level1);
    const equipmentOptions = equipmentRefs
      .map((ref) =>
        equipmentRefToDetailOption(
          ref,
          equipmentMap,
          catalog,
          mergedItems,
          codexEquipment,
          itemProperties,
        ),
      )
      .filter((row): row is GuidedDetailOptionItem => Boolean(row));

    const weapons = equipmentOptions.filter((row) => {
      const entry = equipmentMap.get(normalizeId(row.id));
      return entry?.category === 'weapon';
    });
    const armor = equipmentOptions.filter((row) => {
      const entry = equipmentMap.get(normalizeId(row.id));
      return entry?.category === 'armor';
    });
    const gear = equipmentOptions.filter((row) => {
      const entry = equipmentMap.get(normalizeId(row.id));
      return entry?.category === 'equipment';
    });

    const unarmed = level1.recommendUnarmedProwess === true;
    if (weapons.length > 0 || unarmed) {
      const weaponItems = [...weapons];
      if (unarmed) {
        weaponItems.unshift({
          id: 'unarmed-prowess',
          name: detailCopy.unarmedProwessName,
          description: detailCopy.unarmedProwessDescription,
          chips: [factChip(detailCopy.unarmedProwessStats)],
        });
      }
      result.push({
        id: 'weapons',
        title: detailCopy.weaponsTitle,
        tip: guidedPathDetailWeapons,
        itemCount: weaponItems.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.weaponsIntro}</p>
            <GuidedDetailOptionList items={weaponItems} />
          </div>
        ),
      });
    }

    if (armor.length > 0) {
      result.push({
        id: 'armor',
        title: detailCopy.armorTitle,
        tip: guidedPathDetailArmor,
        itemCount: armor.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.armorIntro}</p>
            <GuidedDetailOptionList items={armor} />
          </div>
        ),
      });
    }

    if (gear.length > 0) {
      result.push({
        id: 'gear',
        title: detailCopy.gearTitle,
        tip: guidedPathDetailLoadouts,
        itemCount: gear.length,
        children: (
          <div className="space-y-3">
            <p className={o.bodySecondary}>{detailCopy.gearIntro}</p>
            <GuidedDetailOptionList items={gear} />
          </div>
        ),
      });
    }

    const libraryRows = (showTechniques ? officialTechniques : officialPowers) as Array<
      LibraryPower | LibraryTechnique
    >;
    const combatLookup = buildCombatLookup(libraryRows);

    if (showTechniques) {
      const techIds = collectPowerOrTechniqueIds(level1, 'techniques');
      const techItems = techIds
        .map((id) =>
          resolveCombatDetailOption(id, combatLookup, 'technique', powerPartsDb, techniquePartsDb),
        )
        .filter((row): row is GuidedDetailOptionItem => Boolean(row));
      if (techItems.length > 0) {
        result.push({
          id: 'techniques',
          title: detailCopy.techniquesTitle,
          tip: guidedPathDetailTechniques,
          itemCount: techItems.length,
          children: (
            <div className="space-y-3">
              <p className={o.bodySecondary}>{detailCopy.techniquesIntro}</p>
              <GuidedDetailOptionList items={techItems} />
            </div>
          ),
        });
      }
    }

    if (showPowers) {
      const powerIds = collectPowerOrTechniqueIds(level1, 'powers');
      const powerItems = powerIds
        .map((id) =>
          resolveCombatDetailOption(id, combatLookup, 'power', powerPartsDb, techniquePartsDb),
        )
        .filter((row): row is GuidedDetailOptionItem => Boolean(row));
      if (powerItems.length > 0) {
        result.push({
          id: 'powers',
          title: detailCopy.powersTitle,
          tip: guidedPathDetailPowers,
          itemCount: powerItems.length,
          children: (
            <div className="space-y-3">
              <p className={o.bodySecondary}>{detailCopy.powersIntro}</p>
              <GuidedDetailOptionList items={powerItems} />
            </div>
          ),
        });
      }
    }

    return result;
  }, [
    path,
    level1,
    feats,
    equipmentMap,
    catalog,
    mergedItems,
    codexEquipment,
    itemProperties,
    showTechniques,
    showPowers,
    officialPowers,
    officialTechniques,
    powerPartsDb,
    techniquePartsDb,
  ]);

  const pathNotes = level1?.notes?.trim() || '';
  const showPathOptions = sections.length > 0 || Boolean(pathNotes);
  const optionsPreamble = showPathOptions ? (
    <GuidedOverviewSection
      title={detailCopy.pathOptionsTitle}
      hint={
        sections.length > 0 ? detailCopy.pathOptionsIntro : detailCopy.pathOptionsNotesOnlyIntro
      }
    >
      {pathNotes ? <p className={`${o.bodySecondary} whitespace-pre-wrap`}>{pathNotes}</p> : null}
    </GuidedOverviewSection>
  ) : null;

  return (
    <GuidedEntityDetailModal
      key={path ? String(path.id) : 'path-detail-closed'}
      isOpen={isOpen && path != null}
      onClose={onClose}
      title={path?.name ?? ''}
      onSelect={onSelect}
      overview={
        path ? (
          <>
            <GuidedPathDetailOverview path={path} pathData={pathData} />
            {catalogsPending ? (
              <p className={o.bodySecondary}>{detailCopy.loadingCatalogs}</p>
            ) : null}
          </>
        ) : null
      }
      optionsPreamble={optionsPreamble}
      sections={sections}
    />
  );
}
