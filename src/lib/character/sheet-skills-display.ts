/**
 * Character sheet Skills list — catalog merge + visibility filters (TASK-584).
 * Base Codex skills always appear; sub-skills follow proficient / user-added rules.
 */

export interface SheetDisplaySkill {
  id: string;
  name: string;
  category?: string;
  skill_val: number;
  prof?: boolean;
  baseSkill?: string;
  ability?: string;
  availableAbilities?: string[];
  /** True when row exists only from Codex catalog (not persisted on the character yet). */
  catalogOnly?: boolean;
}

export interface CodexSkillRef {
  id: string;
  name?: string;
  ability?: string;
  base_skill_id?: number | null;
}

export type SkillProficiencyFilter = 'all' | 'proficient';

function parseAbilities(abilityString?: string): string[] {
  if (!abilityString) return [];
  return abilityString
    .split(',')
    .map((a) => a.trim().toLowerCase())
    .filter(Boolean);
}

/** Codex base skill: no parent id (null/undefined). `0` is a special sub-skill “any base” marker. */
export function isCodexBaseSkill(skill: CodexSkillRef): boolean {
  return skill.base_skill_id == null;
}

function parentKey(name: string | undefined): string {
  return String(name ?? '').toLowerCase();
}

/**
 * Merge character skills with every Codex base skill.
 * Character rows win on id/name match; missing bases are catalog-only (unproficient, value 0).
 * Sub-skills come only from the character (proficient always; unproficient only if added).
 */
export function mergeSheetSkillsWithCatalog(
  characterSkills: SheetDisplaySkill[],
  codexSkills: CodexSkillRef[],
): SheetDisplaySkill[] {
  const ownedBases: SheetDisplaySkill[] = [];
  const ownedSubs: SheetDisplaySkill[] = [];
  const ownedBaseIds = new Set<string>();
  const ownedBaseNames = new Set<string>();

  for (const skill of characterSkills) {
    const row: SheetDisplaySkill = { ...skill, catalogOnly: false };
    if (skill.baseSkill) {
      ownedSubs.push(row);
    } else {
      ownedBases.push(row);
      ownedBaseIds.add(String(skill.id).toLowerCase());
      ownedBaseNames.add(parentKey(skill.name));
    }
  }

  const catalogBases: SheetDisplaySkill[] = [];
  for (const codex of codexSkills) {
    if (!isCodexBaseSkill(codex)) continue;
    const idKey = String(codex.id).toLowerCase();
    const nameKey = parentKey(codex.name);
    if (ownedBaseIds.has(idKey) || (nameKey && ownedBaseNames.has(nameKey))) continue;

    const abilities = parseAbilities(codex.ability);
    catalogBases.push({
      id: String(codex.id),
      name: codex.name ?? String(codex.id),
      skill_val: 0,
      prof: false,
      ability: abilities[0] ?? 'strength',
      availableAbilities: abilities.length > 0 ? abilities : ['strength'],
      catalogOnly: true,
    });
  }

  const bases = [...ownedBases, ...catalogBases].sort((a, b) =>
    String(a.name ?? '').localeCompare(String(b.name ?? '')),
  );

  const subsByParent = new Map<string, SheetDisplaySkill[]>();
  for (const sub of ownedSubs) {
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
  for (const sub of ownedSubs) {
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
