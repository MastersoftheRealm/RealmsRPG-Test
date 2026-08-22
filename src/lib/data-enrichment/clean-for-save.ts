import type { Character } from '@/types';
import { normalizeAgeAppearanceForSave } from '@/lib/character/appearance-age';
import { computeMaxHealthEnergy } from '@/lib/game/calculations';
import { dedupeByNormalizedId, dedupeEntityRefs } from '@/lib/game/dedupe-saved-parts';
import { normalizeTempModifiers } from '@/lib/character/temp-modifiers';
import { normalizeCharacterForSave } from '@/lib/character/schema-normalize';

/**
 * Fields that should be saved to the database (minimal data).
 * Mirrors vanilla site's SAVEABLE_FIELDS in main.js cleanForSave().
 */
const SAVEABLE_FIELDS = [
  // Identity (species derived from ancestry.id via codex)
  'name',
  'gender',
  'portrait',
  'xp',
  'experience',
  'level',
  'status',
  'description',
  // Core stats (user-set values only)
  'abilities',
  'defenseVals',
  'baseAbilities',
  'ancestryAbilities',
  'healthPoints',
  'energyPoints',
  'innateEnergy',
  'currentHealth',
  'currentEnergy',
  'actionPoints',
  'speedBase',
  'evasionBase',
  // Skills (user selections)
  'skills',
  // Archetype/Build (lean: { id, type } only — name/description derived from codex)
  'archetype',
  'archetypePathId',
  // Proficiency data
  'mart_prof',
  'pow_prof',
  'mart_abil',
  'pow_abil',
  'archetypeChoices',
  // References (IDs or minimal data — not full objects)
  'feats',
  'archetypeFeats',
  'techniques',
  'powers',
  'traits',
  // Trait uses tracking
  'traitUses',
  // Player feat/trait display customizations (customName, note)
  'traitCustomizations',
  // State uses (per recovery, max = proficiency)
  'stateUsesCurrent',
  // Unarmed prowess (allocated by player)
  'unarmedProwess',
  // Inventory (names/equipped status only, not full item data)
  'equipment',
  'currency',
  // Notes and misc user data
  'notes',
  'namedNotes',
  'backstory',
  'appearance',
  'archetypeDesc',
  'allies',
  'organizations',
  // Physical attributes
  'weight',
  'height',
  'age',
  // Character visibility (who can view sheet)
  'visibility',
  // Display preferences (speed shown as spaces, feet, or meters)
  'speedDisplayUnit',
  // Character-sheet library tab visibility preferences
  'libraryTabVisibility',
  // Temp Modifier deltas (ADR-0006 / TASK-585) — persist across refresh / campaign view
  'tempModifiers',
  // Ancestry/Species data (lean: { id, name, selectedTraits, selectedFlaw, selectedCharacteristic })
  'ancestry',
  // Conditions
  'conditions',
  // Training points tracking
  'trainingPointsSpent',
  // Persisted part/property proficiencies
  'proficiencies',
  // Timestamps
  'createdAt',
  'updatedAt',
  'lastPlayedAt',
] as const;

/**
 * Helper function to recursively remove undefined values from an object.
 * PostgreSQL JSONB doesn't accept undefined values.
 */
function removeUndefinedValues<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedValues(item)).filter((item) => item !== undefined) as T;
  }
  if (typeof obj === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = removeUndefinedValues(value);
      }
    }
    return cleaned as T;
  }
  return obj;
}

/**
 * Removes temporary and computed fields from character data before saving.
 * Only keeps the minimal data needed - everything else is calculated on load.
 * Mirrors the vanilla site's cleanForSave() function.
 */
export function cleanForSave(data: Character): Partial<Character> {
  const cleaned: Record<string, unknown> = {};

  // Only copy saveable fields
  for (const field of SAVEABLE_FIELDS) {
    if (data[field as keyof Character] !== undefined) {
      cleaned[field] = data[field as keyof Character];
    }
  }

  // Sparse Temp Modifier deltas (ADR-0006 — drop zeros / empty maps)
  if (cleaned.tempModifiers !== undefined) {
    const normalized = normalizeTempModifiers(cleaned.tempModifiers as Character['tempModifiers']);
    if (normalized) cleaned.tempModifiers = normalized;
    else delete cleaned.tempModifiers;
  }

  // Promote legacy Age prefix out of appearance into dedicated age field (TASK-886)
  normalizeAgeAppearanceForSave(cleaned);

  // Canonical field names + strip legacy aliases (TASK-663)
  normalizeCharacterForSave(cleaned, data);

  // Migrate health/energy ResourcePool → currentHealth/currentEnergy
  if (cleaned.currentHealth === undefined && data.health?.current !== undefined) {
    cleaned.currentHealth = data.health.current;
  }
  if (cleaned.currentEnergy === undefined && data.energy?.current !== undefined) {
    cleaned.currentEnergy = data.energy.current;
  }

  // Persist health/energy { current, max } for realtime sync to encounter tracker; max from character-sheet logic (single source of truth)
  const dataHealth = data.health as
    | { current?: number | undefined; max?: number | undefined }
    | undefined;
  const dataEnergy = data.energy as
    | { current?: number | undefined; max?: number | undefined }
    | undefined;
  const healthCurrent = (cleaned.currentHealth as number) ?? dataHealth?.current;
  const energyCurrent = (cleaned.currentEnergy as number) ?? dataEnergy?.current;
  const { maxHealth: computedMaxHealth, maxEnergy: computedMaxEnergy } =
    computeMaxHealthEnergy(data);
  if (typeof healthCurrent === 'number') {
    cleaned.health = {
      current: healthCurrent,
      max: computedMaxHealth,
    };
  }
  if (typeof energyCurrent === 'number') {
    cleaned.energy = {
      current: energyCurrent,
      max: computedMaxEnergy,
    };
  }

  // Strip ancestry to lean user choices. Single-species: traits/flaw/characteristic (+ optional size).
  // Mixed species: also persist speciesIds, speciesTraits, skills, flaw source, size choice, etc.
  // (Previously only selectedTraits/flaw/characteristic were kept, which dropped mixed species traits.)
  if (cleaned.ancestry && typeof cleaned.ancestry === 'object') {
    const anc = cleaned.ancestry as Record<string, unknown>;
    const leanAnc: Record<string, unknown> = {};
    if (anc.id) leanAnc.id = anc.id;
    if (anc.name) leanAnc.name = anc.name; // Kept for server-side listing
    if (anc.selectedTraits) leanAnc.selectedTraits = anc.selectedTraits;
    if (anc.selectedFlaw !== undefined) leanAnc.selectedFlaw = anc.selectedFlaw;
    if (anc.selectedCharacteristic !== undefined)
      leanAnc.selectedCharacteristic = anc.selectedCharacteristic;
    if (anc.size !== undefined && anc.size !== null && anc.size !== '') leanAnc.size = anc.size;
    if (anc.mixed === true) leanAnc.mixed = true;
    if (Array.isArray(anc.speciesIds) && anc.speciesIds.length >= 2) {
      leanAnc.speciesIds = anc.speciesIds;
    }
    if (Array.isArray(anc.speciesNames) && anc.speciesNames.length >= 2) {
      leanAnc.speciesNames = anc.speciesNames;
    }
    if (anc.selectedSize !== undefined && anc.selectedSize !== null && anc.selectedSize !== '') {
      leanAnc.selectedSize = anc.selectedSize;
    }
    if (Array.isArray(anc.selectedSpeciesTraits) && anc.selectedSpeciesTraits.length > 0) {
      leanAnc.selectedSpeciesTraits = anc.selectedSpeciesTraits;
    }
    if (anc.selectedFlawSpeciesId !== undefined)
      leanAnc.selectedFlawSpeciesId = anc.selectedFlawSpeciesId;
    if (anc.mixedPhysical && typeof anc.mixedPhysical === 'object') {
      leanAnc.mixedPhysical = anc.mixedPhysical;
    }
    if (Array.isArray(anc.selectedSpeciesSkillIds) && anc.selectedSpeciesSkillIds.length > 0) {
      leanAnc.selectedSpeciesSkillIds = anc.selectedSpeciesSkillIds;
    }
    if (anc.selectedSpeciesTraitChoices && typeof anc.selectedSpeciesTraitChoices === 'object') {
      leanAnc.selectedSpeciesTraitChoices = anc.selectedSpeciesTraitChoices;
    }
    cleaned.ancestry = leanAnc;
  }

  // Migrate legacy species string → ancestry.name if ancestry is missing
  if (!cleaned.ancestry && data.species) {
    cleaned.ancestry = { name: data.species };
  }

  // Strip archetype to lean { id, type } — name/description/ability derived from codex
  if (cleaned.archetype && typeof cleaned.archetype === 'object') {
    const arch = cleaned.archetype as Record<string, unknown>;
    const leanArch: Record<string, unknown> = {};
    if (arch.id) leanArch.id = arch.id;
    if (arch.type) leanArch.type = arch.type;
    cleaned.archetype = leanArch;
  }

  // Clean up skills — save { id, name, skill_val, prof, selectedBaseSkillId?, ability? }.
  // ability: when a skill has multiple governing abilities in codex (e.g. Lockpick: Agility or Intelligence),
  // the player's selected ability must be saved so bonus calculations use the right one. Omit when only one option.
  // baseSkillId, category, description derived from codex_skills on load.
  // Handle both Array<SkillObject> and Record<skillId, number> formats.
  if (cleaned.skills && typeof cleaned.skills === 'object' && !Array.isArray(cleaned.skills)) {
    // Record<skillId, number> format — convert to lean array
    const record = cleaned.skills as Record<string, number>;
    cleaned.skills = Object.entries(record)
      .filter(([, val]) => typeof val === 'number' && val > 0)
      .map(([id, val]) => ({ id, skill_val: val, prof: true }));
  }
  if (Array.isArray(cleaned.skills)) {
    cleaned.skills = cleaned.skills
      .map((s: unknown) => {
        if (typeof s === 'string') return { name: s, skill_val: 0, prof: false };
        if (s && typeof s === 'object') {
          const skill = s as Record<string, unknown>;
          const cleanSkill: Record<string, unknown> = {};
          if (skill.id) cleanSkill.id = skill.id;
          if (skill.name) cleanSkill.name = skill.name; // Backward compat lookup key
          cleanSkill.skill_val = (skill.skill_val as number) ?? 0;
          cleanSkill.prof = !!skill.prof;
          if (skill.selectedBaseSkillId) cleanSkill.selectedBaseSkillId = skill.selectedBaseSkillId;
          // Persist player's selected ability for skills with multiple options (e.g. Lockpick → Agility or Intelligence)
          if (skill.ability && typeof skill.ability === 'string')
            cleanSkill.ability = skill.ability;
          return cleanSkill;
        }
        return null;
      })
      .filter(Boolean);
  }

  // Clean up feats — save id + name (compat fallback) + currentUses + player customName/note.
  // name/description/maxUses/recovery are derived from codex on load.
  const cleanFeatEntry = (f: unknown): Record<string, unknown> | null => {
    if (typeof f === 'string') return { name: f };
    if (f && typeof f === 'object') {
      const feat = f as {
        id?: string | number | undefined;
        name?: string | undefined;
        currentUses?: number | undefined;
        customName?: string | undefined;
        note?: string | undefined;
      };
      const cleanFeat: Record<string, unknown> = {};
      if (feat.id) cleanFeat.id = feat.id;
      if (feat.name) cleanFeat.name = feat.name; // Backward compat lookup key
      if (typeof feat.currentUses === 'number') cleanFeat.currentUses = feat.currentUses;
      const customName = feat.customName?.trim();
      const note = feat.note?.trim();
      if (customName) cleanFeat.customName = customName;
      if (note) cleanFeat.note = note;
      return Object.keys(cleanFeat).length > 0 ? cleanFeat : null;
    }
    return null;
  };

  if (Array.isArray(cleaned.feats)) {
    cleaned.feats = dedupeEntityRefs(
      cleaned.feats.map(cleanFeatEntry).filter(Boolean) as Array<{
        id?: string | number | undefined;
        name?: string | undefined;
      }>,
    );
  }

  // Clean up archetypeFeats — same lean format
  if (Array.isArray(cleaned.archetypeFeats)) {
    cleaned.archetypeFeats = dedupeEntityRefs(
      (cleaned.archetypeFeats as unknown[]).map(cleanFeatEntry).filter(Boolean) as Array<{
        id?: string | number | undefined;
        name?: string | undefined;
      }>,
    );
  }

  // Player trait customizations — keyed by trait id
  if (cleaned.traitCustomizations && typeof cleaned.traitCustomizations === 'object') {
    const cleanedMap: Record<
      string,
      { customName?: string | undefined; note?: string | undefined }
    > = {};
    for (const [key, raw] of Object.entries(
      cleaned.traitCustomizations as Record<string, unknown>,
    )) {
      if (!raw || typeof raw !== 'object') continue;
      const entry = raw as { customName?: string | undefined; note?: string | undefined };
      const next: { customName?: string | undefined; note?: string | undefined } = {};
      const customName = entry.customName?.trim();
      const note = entry.note?.trim();
      if (customName) next.customName = customName;
      if (note) next.note = note;
      if (Object.keys(next).length > 0) cleanedMap[key] = next;
    }
    if (Object.keys(cleanedMap).length > 0) {
      cleaned.traitCustomizations = cleanedMap;
    } else {
      delete cleaned.traitCustomizations;
    }
  }

  // Clean up powers — save id + name (compat) + innate flag only.
  // description, parts, cost, damage, etc. derived from library enrichment on load.
  if (Array.isArray(cleaned.powers)) {
    cleaned.powers = dedupeEntityRefs(
      cleaned.powers
        .map((p: unknown) => {
          if (typeof p === 'string') return { name: p, innate: false };
          if (p && typeof p === 'object') {
            const power = p as {
              id?: string | number | undefined;
              name?: string | undefined;
              innate?: boolean | undefined;
            };
            const clean: Record<string, unknown> = {};
            if (power.id) clean.id = power.id;
            if (power.name) clean.name = power.name; // Backward compat lookup key
            clean.innate = !!power.innate;
            return clean;
          }
          return null;
        })
        .filter(Boolean) as Array<{ id?: string | number | undefined; name?: string | undefined }>,
    );
  }

  // Clean up techniques — save id + name (compat) only.
  // description, parts, cost, damage, etc. derived from library enrichment on load.
  if (Array.isArray(cleaned.techniques)) {
    cleaned.techniques = dedupeEntityRefs(
      cleaned.techniques
        .map((t: unknown) => {
          if (typeof t === 'string') return { name: t };
          if (t && typeof t === 'object') {
            const tech = t as { id?: string | number | undefined; name?: string | undefined };
            const clean: Record<string, unknown> = {};
            if (tech.id) clean.id = tech.id;
            if (tech.name) clean.name = tech.name; // Backward compat lookup key
            return Object.keys(clean).length > 0 ? clean : null;
          }
          return null;
        })
        .filter(Boolean) as Array<{ id?: string | number | undefined; name?: string | undefined }>,
    );
  }

  // Clean up traits - save name only
  if (Array.isArray(cleaned.traits)) {
    cleaned.traits = dedupeByNormalizedId(
      cleaned.traits
        .map((t: unknown) => {
          if (typeof t === 'string') return t;
          if (t && typeof t === 'object' && 'name' in t) {
            return (t as { name: string }).name;
          }
          return null;
        })
        .filter(Boolean) as string[],
      (name) => name,
    );
  }

  // Clean up equipment — save { id, name, equipped?, quantity? } per item.
  // description/damage/properties/cost/etc derived from codex/library on load.
  // name kept as backward compat lookup key; id is primary lookup.
  if (cleaned.equipment && typeof cleaned.equipment === 'object') {
    const equip = cleaned.equipment as {
      weapons?: unknown[] | undefined;
      shields?: unknown[] | undefined;
      armor?: unknown[] | undefined;
      items?: unknown[] | undefined;
      inventory?: unknown[] | undefined; // Remove redundant inventory array
    };

    const cleanItem = (item: unknown): Record<string, unknown> | null => {
      if (typeof item === 'string') return { name: item };
      if (item && typeof item === 'object') {
        const i = item as Record<string, unknown>;
        const clean: Record<string, unknown> = {};
        if (i.id) clean.id = i.id;
        if (i.name) clean.name = i.name;
        if (i.equipped) clean.equipped = true;
        if (i.quantity && i.quantity !== 1) clean.quantity = i.quantity;
        // One-off custom inventory rows are not in codex/library — persist type + notes.
        const idStr = i.id != null ? String(i.id) : '';
        if (idStr.startsWith('custom-')) {
          if (i.type) clean.type = i.type;
          if (typeof i.description === 'string' && i.description.trim()) {
            clean.description = i.description.trim();
          }
        }
        return Object.keys(clean).length > 0 ? clean : null;
      }
      return null;
    };

    if (Array.isArray(equip.weapons)) {
      equip.weapons = equip.weapons.map(cleanItem).filter(Boolean) as unknown[];
    }
    if (Array.isArray(equip.shields)) {
      equip.shields = equip.shields.map(cleanItem).filter(Boolean) as unknown[];
    }
    if (Array.isArray(equip.armor)) {
      equip.armor = equip.armor.map(cleanItem).filter(Boolean) as unknown[];
    }
    if (Array.isArray(equip.items)) {
      equip.items = equip.items.map(cleanItem).filter(Boolean) as unknown[];
    }
    // Remove redundant inventory array (weapons/armor/items are the source of truth)
    delete equip.inventory;

    cleaned.equipment = equip;
  }

  // Final pass: remove any remaining undefined values for JSONB compatibility
  return removeUndefinedValues(cleaned) as Partial<Character>;
}
