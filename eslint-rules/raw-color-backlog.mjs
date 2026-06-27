/**
 * Raw-color migration backlog (ratchet allowlist)
 * ===============================================
 * Files that still contain raw Tailwind palette colors / hex as of the Phase 0a
 * audit. `realms/no-raw-color` is disabled ONLY for these paths so the build can
 * stay green today while the rule hard-blocks every other file and all new code.
 *
 * DELETE entries as files are migrated to semantic tokens (Phase 1/4). The
 * end-state is an empty array, at which point this file and the corresponding
 * eslint.config.mjs override can be removed.
 *
 * Regenerate/audit with: node scripts/list-raw-color-backlog.mjs
 */
export const RAW_COLOR_BACKLOG = [
  'src/app/(main)/admin/codex/AdminArchetypesTab.tsx',
  'src/app/(main)/admin/codex/AdminCreatureFeatsTab.tsx',
  'src/app/(main)/admin/codex/AdminEquipmentTab.tsx',
  'src/app/(main)/admin/codex/AdminFeatsTab.tsx',
  'src/app/(main)/admin/codex/AdminPartsTab.tsx',
  'src/app/(main)/admin/codex/AdminPropertiesTab.tsx',
  'src/app/(main)/admin/codex/AdminSkillsTab.tsx',
  'src/app/(main)/admin/codex/AdminSpeciesTab.tsx',
  'src/app/(main)/admin/codex/AdminTraitsTab.tsx',
  'src/app/(main)/admin/codex/CodexSpreadsheetView.tsx',
  'src/app/(main)/admin/core-rules/page.tsx',
  'src/app/(main)/codex/CodexPartsTab.tsx',
  'src/app/(main)/codex/CodexPropertiesTab.tsx',
  'src/app/(main)/crafting/\\[id\\]/page.tsx',
  'src/app/(main)/crafting/page.tsx',
  'src/app/(main)/creature-creator/page.tsx',
  'src/app/(main)/encounters/\\[id\\]/_components/CombatEncounterView.tsx',
  'src/app/(main)/encounters/\\[id\\]/_components/SkillEncounterView.tsx',
  'src/app/(main)/encounters/\\[id\\]/combat/page.tsx',
  'src/app/(main)/encounters/\\[id\\]/mixed/page.tsx',
  'src/app/(main)/encounters/\\[id\\]/skill/page.tsx',
  'src/app/(main)/encounters/page.tsx',
  'src/app/(main)/home-page.tsx',
  'src/app/(main)/item-creator/page.tsx',
  'src/app/(main)/my-account/page.tsx',
  'src/app/(main)/resources/page.tsx',
  'src/app/(main)/species-creator/page.tsx',
  'src/app/global-error.tsx',
  'src/app/layout.tsx',
  'src/components/character-creator/creator-tab-bar.tsx',
  'src/components/character-creator/steps/ancestry-step.tsx',
  'src/components/character-creator/steps/archetype-step.tsx',
  'src/components/character-creator/steps/equipment-step.tsx',
  'src/components/character-creator/steps/feats-step.tsx',
  'src/components/character-creator/steps/finalize-step.tsx',
  'src/components/character-creator/steps/powers-step.tsx',
  'src/components/character-creator/steps/species-step.tsx',
  'src/components/character-sheet/archetype-section.tsx',
  'src/components/character-sheet/character-sheet-settings-modal.tsx',
  'src/components/character-sheet/dice-roller.tsx',
  'src/components/character-sheet/edit-archetype-modal.tsx',
  'src/components/character-sheet/feats-tab.tsx',
  'src/components/character-sheet/level-up-modal.tsx',
  'src/components/character-sheet/library-section.tsx',
  'src/components/character-sheet/notes-tab.tsx',
  'src/components/character-sheet/recovery-modal.tsx',
  'src/components/character-sheet/roll-log.tsx',
  'src/components/character-sheet/sheet-action-toolbar.tsx',
  'src/components/character-sheet/sheet-header.tsx',
  'src/components/character-sheet/skills-section.tsx',
  'src/components/character/character-card.tsx',
  'src/components/encounters/CombatantCard.tsx',
  'src/components/layout/header.tsx',
  'src/components/shared/add-combatant-modal.tsx',
  'src/components/shared/grid-list-row.tsx',
  'src/components/shared/hub-list-row.tsx',
  'src/components/shared/image-upload-modal.tsx',
  'src/components/shared/innate-toggle.tsx',
  'src/components/shared/powered-martial-slider.tsx',
  'src/components/shared/roll-button.tsx',
  'src/components/shared/segmented-control.tsx',
  'src/components/shared/skill-row.tsx',
  'src/components/shared/tab-summary-section.tsx',
  'src/lib/game/creator-constants.ts',
];
