/**
 * Character sheet Skills list — catalog merge + visibility filters (TASK-584).
 * Base Codex skills always appear; sub-skills follow proficient / user-added rules.
 */

import { findSkillByIdOrName, parseSkillAbilities } from '@/lib/codex/skill-list';
import { normalizeId } from '@/lib/utils';

export interface SheetDisplaySkill {
  id: string;
  name: string;
  category?: string | undefined;
  skill_val: number;
  prof?: boolean | undefined;
  baseSkill?: string | undefined;
  ability?: string | undefined;
  availableAbilities?: string[] | undefined;
  /** Codex description for name hover (not persisted on the character row). */
  description?: string | undefined;
  /** True when row exists only from Codex catalog (not persisted on the character yet). */
  catalogOnly?: boolean | undefined;
}

export interface CodexSkillRef {
  id: string;
  name?: string | undefined;
  ability?: string | undefined;
  description?: string | undefined;
  base_skill_id?: number | null | undefined;
}

export type SkillProficiencyFilter = 'all' | 'proficient';

/** Codex base skill: no parent id (null/undefined). `0` is a special sub-skill “any base” marker. */
export function isCodexBaseSkill(skill: CodexSkillRef): boolean {
  return skill.base_skill_id == null;
}

function parentKey(name: string | undefined): string {
  return String(name ?? '').toLowerCase();
}

function hydrateOwnedSkill(
  skill: SheetDisplaySkill,
  codexSkills: CodexSkillRef[],
): SheetDisplaySkill {
  const match =
    findSkillByIdOrName(codexSkills, skill.id) ?? findSkillByIdOrName(codexSkills, skill.name);
  const catalogName = String(match?.name ?? '').trim();
  const description = match?.description?.trim() || undefined;
  let baseSkill = skill.baseSkill;
  if (baseSkill) {
    const parent = findSkillByIdOrName(codexSkills, baseSkill);
    if (parent?.name) baseSkill = parent.name;
  }
  const abilities = parseSkillAbilities(match?.ability);
  return {
    ...skill,
    name: catalogName || skill.name || String(skill.id),
    ...(baseSkill ? { baseSkill } : {}),
    ...(description ? { description } : {}),
    ability: skill.ability || abilities[0],
    availableAbilities:
      skill.availableAbilities && skill.availableAbilities.length > 0
        ? skill.availableAbilities
        : abilities.length > 0
          ? abilities
          : skill.availableAbilities,
    catalogOnly: false,
  };
}

function ownedDedupeKey(skill: SheetDisplaySkill): string {
  const nameKey = normalizeId(skill.name);
  if (nameKey) return `name:${nameKey}`;
  return `row:${normalizeId(skill.id)}`;
}

function preferOwnedRow(existing: SheetDisplaySkill, next: SheetDisplaySkill): SheetDisplaySkill {
  const existingScore = (existing.prof ? 1 : 0) + (existing.skill_val ?? 0);
  const nextScore = (next.prof ? 1 : 0) + (next.skill_val ?? 0);
  return nextScore > existingScore ? next : existing;
}

function dedupeOwnedSkills(rows: SheetDisplaySkill[]): SheetDisplaySkill[] {
  const byKey = new Map<string, SheetDisplaySkill>();
  const order: string[] = [];
  for (const row of rows) {
    const key = ownedDedupeKey(row);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, row);
      order.push(key);
      continue;
    }
    byKey.set(key, preferOwnedRow(existing, row));
  }
  return order.map((key) => byKey.get(key)!);
}

/**
 * Merge character skills with every Codex base skill.
 * Character rows win on id/name match; missing bases are catalog-only (unproficient, value 0).
 * Sub-skills come only from the character (proficient always; unproficient only if added).
 * Owned rows whose `name` is a raw Codex id are relabeled from the catalog (species-change save).
 */
export function mergeSheetSkillsWithCatalog(
  characterSkills: SheetDisplaySkill[],
  codexSkills: CodexSkillRef[],
): SheetDisplaySkill[] {
  const ownedBases: SheetDisplaySkill[] = [];
  const ownedSubs: SheetDisplaySkill[] = [];

  for (const skill of characterSkills) {
    const row = hydrateOwnedSkill(skill, codexSkills);
    if (skill.baseSkill) {
      ownedSubs.push(row);
    } else {
      ownedBases.push(row);
    }
  }

  const uniqueBases = dedupeOwnedSkills(ownedBases);
  const uniqueSubs = dedupeOwnedSkills(ownedSubs);

  const ownedBaseIds = new Set<string>();
  const ownedBaseNames = new Set<string>();
  for (const skill of uniqueBases) {
    ownedBaseIds.add(String(skill.id).toLowerCase());
    ownedBaseNames.add(parentKey(skill.name));
  }

  const catalogBases: SheetDisplaySkill[] = [];
  for (const codex of codexSkills) {
    if (!isCodexBaseSkill(codex)) continue;
    const idKey = String(codex.id).toLowerCase();
    const nameKey = parentKey(codex.name);
    if (ownedBaseIds.has(idKey) || (nameKey && ownedBaseNames.has(nameKey))) continue;

    const abilities = parseSkillAbilities(codex.ability);
    const description = codex.description?.trim() || undefined;
    catalogBases.push({
      id: String(codex.id),
      name: codex.name ?? String(codex.id),
      skill_val: 0,
      prof: false,
      ability: abilities[0] ?? 'strength',
      availableAbilities: abilities.length > 0 ? abilities : ['strength'],
      ...(description ? { description } : {}),
      catalogOnly: true,
    });
  }

  const bases = [...uniqueBases, ...catalogBases].sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? '')),
  );

  const subsByParent = new Map<string, SheetDisplaySkill[]>();
  for (const sub of uniqueSubs) {
    const key = parentKey(sub.baseSkill);
    const list = subsByParent.get(key) ?? [];
    list.push(sub);
    subsByParent.set(key, list);
  }
  for (const list of subsByParent.values()) {
    list.sort((a, b) => String(a.name ?? '').localeCompare(String(b.name ?? '')));
  }

  const ordered: SheetDisplaySkill[] = [];
  const placedSubIds = new Set<string>();
  for (const base of bases) {
    ordered.push(base);
    const attached = subsByParent.get(parentKey(base.name)) ?? [];
    for (const sub of attached) {
      ordered.push(sub);
      placedSubIds.add(String(sub.id).toLowerCase());
    }
  }

  // Orphan sub-skills (parent name not in catalog/owned bases)
  for (const sub of uniqueSubs) {
    if (!placedSubIds.has(String(sub.id).toLowerCase())) {
      ordered.push(sub);
    }
  }

  return ordered;
}

/**
 * Apply sheet Skills filters.
 * - proficient: hide unproficient rows (base and sub)
 * - showSubSkills false: hide all sub-skills
 * Unproficient subs are only present when user-added (merge never invents them).
 */
export function filterSheetSkillsDisplay(
  skills: SheetDisplaySkill[],
  options: { proficiencyFilter: SkillProficiencyFilter; showSubSkills: boolean },
): SheetDisplaySkill[] {
  return skills.filter((skill) => {
    const isSub = Boolean(skill.baseSkill);
    if (isSub && !options.showSubSkills) return false;
    if (options.proficiencyFilter === 'proficient' && !skill.prof) return false;
    return true;
  });
}
