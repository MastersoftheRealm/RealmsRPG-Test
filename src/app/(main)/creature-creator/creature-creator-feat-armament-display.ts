/**
 * Creature Creator — feat/armament list enrichment (TASK-610)
 */

import { formatDamageDisplay, formatListCellLabel, normalizeRangeDisplay } from '@/lib/utils';
import { checkFeatRequirements, getMaxQualifiedFeatLevel } from '@/lib/game/feat-requirements';
import { buildFeatLevelsByFamily, getFeatFamilyId, getFeatLevel } from '@/lib/leveled-feats';
import type { Feat, Skill } from '@/hooks';
import {
  deriveCriticalRangeIncreaseFromProperties,
  deriveShieldAmountFromProperties,
  type ItemPropertyPayload,
} from '@/lib/calculators';
import { collectCreatureInventoryItems } from '@/lib/game/creature-inventory';
import { codexFeatToCreatureFeat, creatureToFeatRequirementCharacter } from './creature-feat-utils';
import {
  inferCreatureFeatSource,
  labelCreatureFeatSource,
  type CreatureArmament,
  type CreatureFeat,
} from './transformers';
import type { CreatureState } from './creature-creator-types';

export type CreatureFeatSourceLookup = {
  creatureFeatIds: Set<string>;
  codexFeatById: Map<string, { char_feat?: boolean | undefined }>;
  traitById: Map<string, { flaw?: boolean | undefined; characteristic?: boolean | undefined }>;
};

export type CreatureFeatRow = CreatureFeat & {
  typeLabel: string;
  levelMeta?:
    | {
        currentLevel: number;
        minLevel: number;
        maxQualified: number;
        family: Feat[];
      }
    | undefined;
};

export type CreatureArmamentRow = {
  id: string;
  name: string;
  type: string;
  range: string;
  attack: string;
  damage: string;
  block: string;
  damageReduction: string;
  criticalRangeIncrease: string;
  tp: number | string;
  currency: string;
  rarity?: string | undefined;
  description?: string | undefined;
  properties?: CreatureArmament['properties'] | undefined;
  armorValue?: number | undefined;
  quantity?: number | undefined;
  category?: string | undefined;
  image_id?: string | null | undefined;
  image_url?: string | null | undefined;
};

export function buildFeatLevelsByFamilyMap(codexFeatsData: Feat[]) {
  return buildFeatLevelsByFamily(codexFeatsData);
}

export function buildFeatsWithTypeLabel(
  creature: CreatureState,
  creatureFeatSourceLookup: CreatureFeatSourceLookup,
  codexFeatsById: Map<string, Feat>,
  featLevelsByFamily: Map<string, Feat[]>,
  skillsData: Skill[],
  codexFeatsData: Feat[],
): CreatureFeatRow[] {
  return creature.feats.map((f) => {
    const src = f.featSourceType ?? inferCreatureFeatSource(f, creatureFeatSourceLookup);
    const codexFeat = codexFeatsById.get(String(f.id));
    const isLibraryFeat = src === 'character' || src === 'archetype';
    let levelMeta: CreatureFeatRow['levelMeta'];
    if (isLibraryFeat && codexFeat) {
      const family = featLevelsByFamily.get(getFeatFamilyId(codexFeat)) ?? [];
      if (family.length > 1) {
        levelMeta = {
          currentLevel: getFeatLevel(codexFeat),
          minLevel: getFeatLevel(family[0]),
          maxQualified: getMaxQualifiedFeatLevel(
            creatureToFeatRequirementCharacter(creature),
            family,
            skillsData,
            codexFeatsData,
          ),
          family,
        };
      }
    }
    return { ...f, typeLabel: labelCreatureFeatSource(src), levelMeta };
  });
}

export function applyCreatureFeatLevelChange(
  prev: CreatureState,
  featId: string,
  targetLevel: number,
  creatureFeatSourceLookup: CreatureFeatSourceLookup,
  codexFeatsById: Map<string, Feat>,
  featLevelsByFamily: Map<string, Feat[]>,
  skillsData: Skill[],
  codexFeatsData: Feat[],
): CreatureState {
  const idx = prev.feats.findIndex((f) => f.id === featId);
  if (idx === -1) return prev;

  const current = prev.feats[idx];
  if (!current) return prev;
  const src = current.featSourceType ?? inferCreatureFeatSource(current, creatureFeatSourceLookup);
  if (src !== 'character' && src !== 'archetype') return prev;

  const codexFeat = codexFeatsById.get(String(featId));
  if (!codexFeat) return prev;

  const family = featLevelsByFamily.get(getFeatFamilyId(codexFeat));
  if (!family || family.length <= 1) return prev;

  const targetCodex = family.find((f) => getFeatLevel(f) === targetLevel);
  if (!targetCodex || String(targetCodex.id) === String(featId)) return prev;

  const requirementCharacter = creatureToFeatRequirementCharacter(prev);
  const { met } = checkFeatRequirements(
    targetCodex,
    requirementCharacter,
    skillsData,
    codexFeatsData,
  );
  if (!met) return prev;

  const nextFeats = [...prev.feats];
  nextFeats[idx] = codexFeatToCreatureFeat(targetCodex);
  return { ...prev, feats: nextFeats };
}

export function enrichArmamentsWithSortKeys(creature: CreatureState): CreatureArmamentRow[] {
  const prof = creature.martialProficiency ?? 0;
  const str = creature.abilities.strength ?? 0;
  const agi = creature.abilities.agility ?? 0;
  const acu = creature.abilities.acuity ?? 0;
  return collectCreatureInventoryItems(creature).map((armament) => {
    const isWeapon = String(armament.type ?? '').toLowerCase() === 'weapon';
    const isShield = String(armament.type ?? '').toLowerCase() === 'shield';
    const propNames = (armament.properties || [])
      .map((p: unknown) =>
        typeof p === 'string' ? p : (p as { name?: string | undefined }).name || '',
      )
      .filter(Boolean);
    const finesse = propNames.some((p: string) => p.toLowerCase() === 'finesse');
    const range =
      normalizeRangeDisplay((armament as { range?: string | undefined }).range) ||
      (isWeapon ? 'Melee' : '-');
    const isRanged = range.toLowerCase() !== 'melee';
    const attackBonus = isWeapon ? (finesse ? agi : isRanged ? acu : str) + prof : null;
    const attack = attackBonus != null ? `${attackBonus >= 0 ? '+' : ''}${attackBonus}` : '-';
    const damage =
      isWeapon || isShield
        ? formatDamageDisplay((armament as { damage?: unknown | undefined }).damage) || '-'
        : '-';
    const payload = (armament.properties || []) as ItemPropertyPayload[];
    const isArmor = String(armament.type ?? '').toLowerCase() === 'armor';
    const block = isShield ? deriveShieldAmountFromProperties(payload) || '-' : '-';
    const drValue = armament.damageReduction ?? armament.armorValue;
    const damageReduction = isArmor && drValue != null ? String(drValue) : '-';
    const crit = isArmor ? deriveCriticalRangeIncreaseFromProperties(payload) : 0;
    const criticalRangeIncrease = isArmor && crit > 0 ? String(crit) : '-';
    return {
      ...armament,
      range,
      attack,
      damage,
      block,
      damageReduction,
      criticalRangeIncrease,
      type: formatListCellLabel(armament.type),
      tp: armament.tp != null ? armament.tp : '-',
      currency: armament.currency != null ? `${armament.currency}c` : '-',
    };
  });
}
