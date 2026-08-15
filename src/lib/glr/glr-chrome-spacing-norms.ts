/**
 * GLR list chrome + spacing norms (TASK-631, TASK-637, TASK-702, TASK-710).
 *
 * Library / Official / Codex browse lists share tight row density (`gap-1`) and
 * ListHeader `rowChrome` tracks that mirror GridListRow edit/delete/add/rightSlot actions.
 * USM selection chrome is `rowChrome.externalSelection`; quantity mode pairs ListHeader +
 * GridListRow `rightSlotWidth` via `USM_QUANTITY_RIGHT_SLOT_WIDTH`. Creator-embedded GLR
 * lists follow the same row-container + rowChrome contract.
 * Complements required-facts registry (TASK-629 / ADR-0009).
 *
 * CI: `validate-glr-chrome-spacing.test.ts` · Guide: `guide/02-components-and-lists.md`
 */

/**
 * Compare Tailwind class strings by token set so Prettier class-order is not a contract.
 */
export function classListEquals(actual: string, expected: string): boolean {
  const tokenize = (value: string) => value.trim().split(/\s+/).filter(Boolean).sort();
  const left = tokenize(actual);
  const right = tokenize(expected);
  if (left.length !== right.length) return false;
  return left.every((token, index) => token === right[index]);
}

/** Default row-container class on UserLibraryEntityTabShell and OfficialEntityList. */
export const DEFAULT_GLR_LIST_CLASSNAME = 'flex flex-col gap-1 mt-2' as const;

/** Default row-container class on UnifiedSelectionModalList. */
export const DEFAULT_USM_LIST_CLASSNAME = 'flex min-w-0 flex-col gap-1' as const;

/** CodexBrowseListShell hardcodes the same gap on its row container. */
export const CODEX_BROWSE_LIST_ROW_CLASSNAME = 'mt-2 flex flex-col gap-1' as const;

/** Shell components that own GLR list row spacing. */
export const GLR_LIST_SHELL_SOURCES = [
  'src/app/(main)/library/components/UserLibraryEntityTabShell.tsx',
  'src/components/shared/official-entity-list.tsx',
  'src/components/shared/codex-browse-list-shell.tsx',
] as const;

/** My Library entity tabs — must pair row actions with shell `rowChrome`. */
export const MY_LIBRARY_ENTITY_TAB_SOURCES = [
  'src/app/(main)/library/LibraryPowersTab.tsx',
  'src/app/(main)/library/LibraryTechniquesTab.tsx',
  'src/app/(main)/library/LibraryItemsTab.tsx',
  'src/app/(main)/library/LibraryCreaturesTab.tsx',
  'src/app/(main)/library/LibraryEnhancedTab.tsx',
] as const;

/** Shared grid column templates for Library/Official browse (data columns only — no 40px action track). */
export const GLR_GRID_COLUMN_SOURCES = [
  'src/lib/library/official-power-list.ts',
  'src/lib/library/official-technique-list.ts',
  'src/lib/library/official-item-list.ts',
  'src/lib/library/official-creature-list.ts',
  'src/lib/library/official-enhanced-list.ts',
  'src/lib/codex/feat-list.ts',
  'src/lib/codex/skill-list.ts',
] as const;

/** Codex/Admin browse shells — `rowChrome.rightSlot` must match row `rightSlot` when present. */
export const CODEX_BROWSE_SHELL_SOURCES = [
  'src/app/(main)/admin/codex/AdminFeatsTab.tsx',
  'src/app/(main)/admin/codex/AdminPartsTab.tsx',
  'src/app/(main)/admin/codex/AdminPropertiesTab.tsx',
  'src/app/(main)/admin/codex/AdminEquipmentTab.tsx',
  'src/app/(main)/admin/codex/AdminSpeciesTab.tsx',
  'src/app/(main)/admin/codex/AdminTraitsTab.tsx',
  'src/app/(main)/admin/codex/AdminSkillsTab.tsx',
  'src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx',
  'src/app/(main)/codex/CodexFeatsTab.tsx',
  'src/app/(main)/codex/CodexPartsTab.tsx',
  'src/app/(main)/codex/CodexPropertiesTab.tsx',
  'src/app/(main)/codex/CodexEquipmentTab.tsx',
  'src/app/(main)/codex/CodexSpeciesTab.tsx',
  'src/app/(main)/codex/CodexTraitsTab.tsx',
  'src/app/(main)/codex/CodexSkillsTab.tsx',
  'src/app/(main)/codex/CodexCreatureFeatsTab.tsx',
] as const;

/** UnifiedSelectionModal list row container (selection modals). */
export const USM_LIST_SHELL_SOURCES = [
  'src/components/shared/unified-selection-modal-list.tsx',
] as const;

/**
 * Surfaces that pair ListHeader + GridListRow quantity chrome with
 * `USM_QUANTITY_RIGHT_SLOT_WIDTH` (TASK-702).
 */
export const USM_QUANTITY_CHROME_SOURCES = [
  'src/components/shared/unified-selection-modal-list.tsx',
  'src/components/shared/guided-choice/guided-inline-catalog-list.tsx',
] as const;

/** Creator pages with embedded ListHeader + GridListRow lists (not library/codex shells). */
export const CREATOR_EMBEDDED_GLR_SOURCES = [
  'src/app/(main)/creature-creator/creature-creator-editor-loadout-sections.tsx',
  'src/components/character-creator/steps/powers/powers-selected-section.tsx',
  'src/components/character-creator/steps/powers/techniques-selected-section.tsx',
  'src/components/character-creator/steps/equipment/selected-equipment-list.tsx',
] as const;

/**
 * GridListRow master layout (TASK-710). Expanded surface-alt must continue into the
 * action column; chrome must not `self-start` beside the expanded body.
 */
export const GLR_ROW_LAYOUT_SOURCES = [
  'src/components/shared/grid-list-row.tsx',
  'src/components/shared/grid-list-row-collapsed.tsx',
  'src/components/shared/grid-list-row-expanded.tsx',
] as const;

/** Callers that may pass `listClassName` into GLR shells. */
export const GLR_LIST_CLASSNAME_CALLER_SOURCES = [
  ...MY_LIBRARY_ENTITY_TAB_SOURCES,
  'src/components/shared/official-power-list.tsx',
  'src/components/shared/official-technique-list.tsx',
  'src/components/shared/official-item-list.tsx',
  'src/components/shared/official-creature-list.tsx',
  'src/components/shared/official-enhanced-list.tsx',
] as const;

/**
 * Looser vertical gaps between GLR rows (e.g. `space-y-3` overrides from pre-TASK-630).
 * `gap-1` is the norm; do not widen list shells without updating this check.
 */
export const FORBIDDEN_GLR_LIST_GAP_REGEX = /\bspace-y-(?:2|3|4|5|6|8)\b|\bgap-(?:2|3|4|5|6|8)\b/;

/** Leftover inline action column — use ListHeader `rowChrome` instead (TASK-622). */
export const FORBIDDEN_GLR_GRID_ACTION_TRACK_REGEX = /\b40px\b/;
