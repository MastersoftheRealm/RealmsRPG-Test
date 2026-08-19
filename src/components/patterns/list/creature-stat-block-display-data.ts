import { resolveListRowThumbnail } from '@/lib/list-row-image';
import type { EntityPowerRow, EntityTechniqueRow } from './entity-library-sections';
import { derivePowerDisplay, formatPowerDamage } from '@/lib/calculators/power-calc';
import { deriveTechniqueDisplay } from '@/lib/calculators/technique-calc';
import {
  calculateSkillBonusWithProficiency,
  calculateSubSkillBonusWithProficiency,
} from '@/lib/game/formulas';
import { glrSurfaceDetailSections, partsProficienciesSection } from '@/lib/chip/list-row-metadata';
import {
  derivePartCategories,
  formatPartCategoriesColumn,
  powerHasDamageCategory,
  withDamageCategory,
} from '@/lib/library/power-technique-categories';
import type { Abilities } from '@/types';
import type { LibraryPower, LibraryTechnique } from '@/types/library';
import type { PowerPart, TechniquePart } from '@/hooks/codex-types';
import type { CreatureData } from './creature-stat-block-types';
import {
  REALMS_ABILITY_ORDER,
  REALMS_ABILITY_ABBR,
  getAbilityValue,
  partsToChips,
  type CodexPart,
} from './creature-stat-block-helpers';

type LibraryPowerLike = LibraryPower & { docId?: string | undefined };
type LibraryTechniqueLike = LibraryTechnique & { docId?: string | undefined };

type SavedPartRef =
  | string
  | {
      id?: string | number | undefined;
      name?: string | undefined;
      op_1_lvl?: number | undefined;
      op_2_lvl?: number | undefined;
      op_3_lvl?: number | undefined;
    };

function objectPartsOnly(
  parts: SavedPartRef[],
): NonNullable<import('@/lib/calculators/power-calc').PowerDocument['parts']> {
  return parts
    .filter((part): part is Exclude<SavedPartRef, string> => typeof part !== 'string')
    .map((part) => ({
      id: typeof part.id === 'number' ? part.id : undefined,
      name: part.name,
      op_1_lvl: part.op_1_lvl,
      op_2_lvl: part.op_2_lvl,
      op_3_lvl: part.op_3_lvl,
    }));
}

type SkillDbEntry = {
  id?: string | number | undefined;
  name?: string | undefined;
  ability?: string | undefined;
  description?: string | undefined;
  base_skill_id?: string | number | null | undefined;
};

export function buildPowersForDisplay(
  creature: CreatureData,
  userPowers: LibraryPowerLike[],
  officialPowers: LibraryPower[],
  powerPartsDb: PowerPart[],
): EntityPowerRow[] {
  const refs = Array.isArray(creature.powers) ? creature.powers : [];
  if (refs.length === 0) return [];

  const userById = new Map<string, LibraryPowerLike>();
  const userByName = new Map<string, LibraryPowerLike>();
  userPowers.forEach((p) => {
    if (p.docId) userById.set(String(p.docId), p);
    if (p.id) userById.set(String(p.id), p);
    if (p.name) userByName.set(p.name.trim().toLowerCase(), p);
  });

  const officialById = new Map<string, LibraryPower>();
  const officialByName = new Map<string, LibraryPower>();
  officialPowers.forEach((p) => {
    const id = p.id != null ? String(p.id) : '';
    const name = p.name != null ? String(p.name) : '';
    if (id) officialById.set(id, p);
    if (name) officialByName.set(name.trim().toLowerCase(), p);
  });

  return refs.map((ref, idx): EntityPowerRow => {
    const refId = (ref as { id?: string | undefined }).id;
    const refName = ref.name;

    const userMatch =
      (refId ? userById.get(String(refId)) : undefined) ??
      (refName ? userByName.get(String(refName).trim().toLowerCase()) : undefined);

    const officialMatch =
      (refId ? officialById.get(String(refId)) : undefined) ??
      (refName ? officialByName.get(String(refName).trim().toLowerCase()) : undefined);

    const enriched = userMatch
      ? {
          name: userMatch.name,
          description: userMatch.description,
          parts: userMatch.parts || [],
          damage: userMatch.damage,
          actionType: userMatch.actionType,
          isReaction: userMatch.isReaction,
          range: userMatch.range,
          area: userMatch.area,
          duration: userMatch.duration,
          image_id: userMatch.image_id,
          image_url: userMatch.image_url,
        }
      : officialMatch
        ? {
            name: officialMatch.name ?? refName,
            description: officialMatch.description,
            parts: officialMatch.parts ?? [],
            damage: officialMatch.damage,
            actionType: officialMatch.actionType,
            isReaction: officialMatch.isReaction,
            range: officialMatch.range,
            area: officialMatch.area,
            duration: officialMatch.duration,
            image_id: officialMatch.image_id,
            image_url: officialMatch.image_url,
          }
        : null;

    const baseName = enriched?.name || refName;
    const baseDescription = enriched?.description ?? ref.description;
    const parts: SavedPartRef[] = enriched?.parts ?? ref.parts ?? [];
    const damage = enriched?.damage ?? ref.damage;
    const imageRecord = {
      image_id: enriched?.image_id ?? (ref as { image_id?: string | null | undefined }).image_id,
      image_url:
        enriched?.image_url ?? (ref as { image_url?: string | null | undefined }).image_url,
    };

    const derived = derivePowerDisplay(
      {
        name: baseName,
        description: baseDescription,
        parts: objectPartsOnly(parts),
        damage: Array.isArray(damage) ? damage : undefined,
        actionType: enriched?.actionType,
        isReaction: enriched?.isReaction,
      },
      powerPartsDb,
    );

    const partsChips = partsToChips(parts, powerPartsDb as CodexPart[]);
    const partsSection = partsProficienciesSection(partsChips, 'power');
    const damageStr =
      formatPowerDamage(Array.isArray(damage) ? damage : undefined) ||
      (typeof ref.damage === 'string' ? ref.damage : undefined);
    const rangeValue = derived.range && derived.range !== '-' ? derived.range : ref.range;
    const categories = withDamageCategory(
      derivePartCategories(objectPartsOnly(parts), powerPartsDb),
      powerHasDamageCategory(Array.isArray(damage) ? damage : undefined),
    );
    const categoryText = formatPartCategoriesColumn(categories);
    const tp = partsChips.reduce((sum, chip) => sum + (chip.cost ?? 0), 0);
    const detailSections = glrSurfaceDetailSections(
      'creature-stat-block-power',
      {
        category: categoryText && categoryText !== '—' ? categoryText : undefined,
        range: rangeValue,
        trainingPoints: tp > 0 ? tp : undefined,
      },
      partsSection ? [partsSection] : undefined,
    );

    return {
      id: `${creature.id}-power-${refId ?? idx}`,
      name: baseName,
      description: baseDescription,
      thumbnail: resolveListRowThumbnail('power', imageRecord, baseName),
      actionType: derived.actionType || ref.action,
      damage: damageStr,
      area: derived.area || ref.area,
      duration: derived.duration || ref.duration,
      energyCost: typeof derived.energy === 'number' ? derived.energy : ref.energy,
      innate: ref.innate,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
    };
  });
}

export function buildTechniquesForDisplay(
  creature: CreatureData,
  userTechniques: LibraryTechniqueLike[],
  officialTechniques: LibraryTechnique[],
  techniquePartsDb: TechniquePart[],
): EntityTechniqueRow[] {
  const refs = Array.isArray(creature.techniques) ? creature.techniques : [];
  if (refs.length === 0) return [];

  const userById = new Map<string, LibraryTechniqueLike>();
  const userByName = new Map<string, LibraryTechniqueLike>();
  userTechniques.forEach((t) => {
    if (t.docId) userById.set(String(t.docId), t);
    if (t.id) userById.set(String(t.id), t);
    if (t.name) userByName.set(t.name.trim().toLowerCase(), t);
  });

  const officialById = new Map<string, LibraryTechnique>();
  const officialByName = new Map<string, LibraryTechnique>();
  officialTechniques.forEach((t) => {
    const id = t.id != null ? String(t.id) : '';
    const name = t.name != null ? String(t.name) : '';
    if (id) officialById.set(id, t);
    if (name) officialByName.set(name.trim().toLowerCase(), t);
  });

  return refs.map((ref, idx): EntityTechniqueRow => {
    const refId = (ref as { id?: string | undefined }).id;
    const refName = ref.name;

    const userMatch =
      (refId ? userById.get(String(refId)) : undefined) ??
      (refName ? userByName.get(String(refName).trim().toLowerCase()) : undefined);
    const officialMatch =
      (refId ? officialById.get(String(refId)) : undefined) ??
      (refName ? officialByName.get(String(refName).trim().toLowerCase()) : undefined);

    const enriched = userMatch
      ? {
          name: userMatch.name,
          description: userMatch.description,
          parts: userMatch.parts || [],
          damage: userMatch.damage,
          weapon: userMatch.weapon,
          actionType: userMatch.actionType,
          isReaction: userMatch.isReaction,
          image_id: userMatch.image_id,
          image_url: userMatch.image_url,
        }
      : officialMatch
        ? {
            name: officialMatch.name ?? refName,
            description: officialMatch.description,
            parts: officialMatch.parts ?? [],
            damage: officialMatch.damage,
            weapon: officialMatch.weapon,
            actionType: officialMatch.actionType,
            isReaction: officialMatch.isReaction,
            image_id: officialMatch.image_id,
            image_url: officialMatch.image_url,
          }
        : null;

    const baseName = enriched?.name || refName;
    const baseDescription = enriched?.description ?? ref.description;
    const parts: SavedPartRef[] = enriched?.parts ?? ref.parts ?? [];
    const damage = enriched?.damage ?? ref.damage;
    const imageRecord = {
      image_id: enriched?.image_id ?? (ref as { image_id?: string | null | undefined }).image_id,
      image_url:
        enriched?.image_url ?? (ref as { image_url?: string | null | undefined }).image_url,
    };

    const derived = deriveTechniqueDisplay(
      {
        name: baseName,
        description: baseDescription,
        parts: objectPartsOnly(parts),
        damage: Array.isArray(damage) ? damage[0] : undefined,
        weapon: enriched?.weapon,
        actionType: enriched?.actionType,
        isReaction: enriched?.isReaction,
      },
      techniquePartsDb,
    );

    const partsChips = partsToChips(parts, techniquePartsDb as CodexPart[]);
    const partsSection = partsProficienciesSection(partsChips, 'technique');
    const damageStr =
      derived.damageStr !== '-'
        ? derived.damageStr
        : typeof ref.damage === 'string'
          ? ref.damage
          : undefined;
    const categories = derivePartCategories(objectPartsOnly(parts), techniquePartsDb);
    const categoryText = formatPartCategoriesColumn(categories);
    const detailSections = glrSurfaceDetailSections(
      'creature-stat-block-technique',
      {
        category: categoryText && categoryText !== '—' ? categoryText : undefined,
        damage: damageStr,
      },
      partsSection ? [partsSection] : undefined,
    );
    return {
      id: `${creature.id}-tech-${refId ?? idx}`,
      name: baseName,
      description: baseDescription,
      thumbnail: resolveListRowThumbnail('technique', imageRecord, baseName),
      actionType: derived.actionType,
      energyCost: typeof derived.energy === 'number' ? derived.energy : ref.energy,
      weaponName: derived.weaponName || ref.weapon,
      tp: derived.tp ?? ref.tp,
      detailSections: detailSections.length > 0 ? detailSections : undefined,
    };
  });
}

type CreatureSkillRow = {
  id?: string | undefined;
  name: string;
  value: number;
  proficient: boolean;
  baseSkillId?: string | undefined;
  isSubSkill?: boolean | undefined;
};

export function buildSkillRows(
  creature: CreatureData,
  creatureSkills: CreatureSkillRow[],
  skillsDb: SkillDbEntry[],
): Array<{
  key: string;
  rowId: string;
  name: string;
  description?: string | undefined;
  abilityAbbr: string;
  bonus: number;
}> {
  return creatureSkills.map((s, idx) => {
    const def = skillsDb.find(
      (d) =>
        (s.id != null && String(d.id) === String(s.id)) ||
        (d.name != null && d.name.toLowerCase() === s.name.toLowerCase()),
    );
    const linked = def?.ability ?? '';
    const abilityKeys = String(linked)
      .split(',')
      .map((a) => a.trim().toLowerCase())
      .filter(Boolean) as Array<(typeof REALMS_ABILITY_ORDER)[number]>;
    const chosen =
      abilityKeys.length > 0
        ? abilityKeys
            .map((k) => ({ k, v: getAbilityValue(creature.abilities ?? {}, k) }))
            .sort((a, b) => b.v - a.v)[0]?.k
        : undefined;

    const baseSkillIdFromRow =
      'baseSkillId' in s && s.baseSkillId != null && String(s.baseSkillId) !== ''
        ? s.baseSkillId
        : undefined;
    const baseSkillIdRaw =
      baseSkillIdFromRow ??
      (def?.base_skill_id != null && Number(def.base_skill_id) !== 0
        ? def.base_skill_id
        : undefined);
    const isSubSkill =
      ('isSubSkill' in s && s.isSubSkill === true) ||
      (baseSkillIdRaw != null && String(baseSkillIdRaw) !== '' && Number(baseSkillIdRaw) !== 0);

    let parent: CreatureSkillRow | undefined;
    if (isSubSkill && baseSkillIdRaw != null) {
      const baseDef = skillsDb.find((d) => String(d.id) === String(baseSkillIdRaw));
      parent = baseDef
        ? creatureSkills.find(
            (p) =>
              (p.id != null && String(p.id) === String(baseDef.id)) ||
              String(p.name ?? '').toLowerCase() === String(baseDef.name ?? '').toLowerCase(),
          )
        : undefined;
    }

    const bonus = isSubSkill
      ? calculateSubSkillBonusWithProficiency(
          linked,
          s.value ?? 0,
          parent?.value ?? 0,
          parent ? parent.proficient !== false : false,
          creature.abilities as Abilities,
          s.proficient !== false,
          chosen,
        )
      : calculateSkillBonusWithProficiency(
          linked,
          s.value ?? 0,
          creature.abilities as Abilities,
          s.proficient !== false,
          chosen,
        );

    return {
      key: `${creature.id}-skill-${s.name}-${idx}`,
      rowId: `${creature.id}-skill-${idx}`,
      name: s.name,
      description: def?.description || undefined,
      abilityAbbr: chosen ? REALMS_ABILITY_ABBR[chosen] : '-',
      bonus,
    };
  });
}
