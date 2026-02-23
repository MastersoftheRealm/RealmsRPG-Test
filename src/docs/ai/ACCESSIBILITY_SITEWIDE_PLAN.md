# Site-Wide Accessibility Implementation Plan

Based on session discussion: dark mode contrast, foreground/background, accessible names for controls, and semantic tokens.

## Patterns to fix

1. **text-text-muted without dark variant** — Add `dark:text-text-secondary` so text meets contrast on dark backgrounds (headings, labels, body copy).
2. **Opacity used for text** — Replace `opacity-75` / `opacity-90` with semantic tokens (`text-text-muted`, `text-text-secondary`) so dark mode has proper contrast.
3. **Selects without accessible name** — Every `<select>` must have `aria-label="…"` or `<label htmlFor={id}>` + `id` on the select.
4. **Status colors without dark variant** — `text-success-600`, `text-info-600`, `text-warning-700` etc. need `dark:text-success-400` (or equivalent) where they appear on dark backgrounds.
5. **Icon/overlay backgrounds** — `bg-white/10`, `bg-white/80` etc. need dark variants (e.g. `dark:bg-white/20`, `dark:bg-black/50`) for contrast.
6. **List header sort label** — `dark:text-text-muted` reduces contrast; use `dark:text-text-secondary`.

## Phase 1 — Shared components & high-traffic UI (DO FIRST)

| File | Issue | Fix |
|------|--------|-----|
| list-header.tsx | Sort by: dark:text-text-muted | dark:text-text-secondary |
| empty-state.tsx | icon bg, description text-text-muted | Add dark:text-text-secondary to description |
| creator-summary-panel.tsx | opacity-90 on box label | text-text-muted dark:text-text-secondary |
| expandable-chip.tsx | opacity-90 on expanded content; text-text-muted (cost) | text-text-secondary; add dark for cost |
| spinner.tsx | bg-white/80 overlay | dark:bg-black/50 or dark:bg-surface/90 |
| grid-list-row.tsx | Several text-text-muted (313, 370, 403, 452, 511, 571, 619) | Add dark:text-text-secondary where missing |
| add-feat-modal.tsx | 2 selects no id/aria; labels text-text-muted | useId + id/htmlFor; add dark to labels |

## Phase 2 — text-text-muted dark variants (body/headings)

| File | Fix |
|------|-----|
| recovery-modal.tsx | Add dark:text-text-secondary to text-xs text-text-muted (237, 248, 292, 362, 378, 392) |
| creature-stat-block.tsx | Add dark variants to text-text-muted (152, 155, 202, 285, 325, 341, 387) |
| sheet-header.tsx | 361, 369, 380, 397, 399 — add dark where missing |
| archetype-section.tsx | Many text-text-muted — add dark:text-text-secondary |
| dice-roller.tsx | 124, 239, 248, 258, 262 |
| CombatEncounterView.tsx | 687, 696, 814 |
| SkillEncounterView.tsx | 348, 357, 398, 453, 505, 618, 630, 666, 699 |
| campaigns/page.tsx | 198, 214, 452 |
| campaigns/[id]/page.tsx | 426, 441, 477, 596, 602, 670 |
| home-page.tsx | 74, 198, 201, 204, 234 |
| codex (tabs) | Empty state text-text-muted — add dark |
| about/page.tsx | 499, 505 |
| health-energy-allocator.tsx | 118, 140, 190 |
| PowerPartCard.tsx | 72 |
| power-creator/page.tsx | 966 |
| skill-row.tsx | 186, 187, 189, 192, 210, 310, 333, 358, 364, 387, 391, 413 |
| abilities-section.tsx | 249, 277, 342 |
| PowerAdvancedMechanics.tsx | 112, 244, 246 |
| CreatorSaveToolbar.tsx | 40 — toggle inactive text |
| codex/page.tsx | 105, 115 — toggle inactive |
| add-feat-modal.tsx | 224, 235, 245, 254 — labels |

## Phase 3 — Selects: accessible name

| File | Selects | Fix |
|------|---------|-----|
| add-feat-modal.tsx | Category, Ability | useId + id + htmlFor on labels |
| skill-row.tsx | Ability dropdown | aria-label="Ability for skill" |
| species-creator/page.tsx | Type, skillIds[i] | aria-label="Creature type", "Base skill" |
| MixedSpeciesModal.tsx | speciesAId, speciesBId | aria-label="First species", "Second species" |
| ancestry-step.tsx | selectedSize | aria-label="Size for mixed species" |
| add-skill-modal.tsx | abilityFilter | aria-label="Filter by ability" |
| add-sub-skill-modal.tsx | abilityFilter, baseSkillFilter | aria-label each |
| CombatantCard.tsx | combatantType, selectedCondition | aria-label each |
| item-list.tsx | sort field, filter | aria-label each |
| CreatureCreatorHelpers.tsx | select | aria-label from context |
| technique-creator | Category, Part, weapon, actionType, damage.size | aria-label each |
| item-creator | property, damage.size/type, shieldDR.size, shieldDamage.size, abilityRequirement | aria-label each |
| admin (AdminPartsTab, AdminPropertiesTab, AdminEquipmentTab, AdminFeatsTab, AdminTraitsTab, AdminArchetypesTab, AdminSkillsTab, users) | various | aria-label each |

## Phase 4 — success/info/warning/danger dark variants

| File | Fix |
|------|-----|
| creature-stat-block.tsx | 155, 197 — success-600, danger-600, warning-700 | Add dark: |
| sheet-header.tsx | 681 text-success-600 | dark:text-success-400 |
| value-stepper.tsx | 157-158 health/energy | Add dark: variants |
| item-card.tsx | 258, 31 | Add dark: |
| creator-summary-panel.tsx | 108-112 getVariantClasses | Add dark: for text |
| ability-score-editor.tsx | 216 | dark:text-success-400 |
| edit-section-toggle.tsx | 39 | dark:text-success-400 |
| equip-toggle.tsx, selection-toggle.tsx | 65, 67 | dark:text-success-400 |
| species-trait-card.tsx | 333 | dark:text-success-400 |
| point-status.tsx | 115 | dark:text-success-400 |
| chip.tsx, alert.tsx | warning variant | dark:text-warning-300 |
| collapsible-section.tsx | 101 warning-700 | dark:text-warning-300 |

## Phase 5 — Roll-log & remaining

| File | Fix |
|------|-----|
| roll-log.tsx | MOD label area (261) dark border/text; dice pool ring (298) dark:bg-white/25; image opacity-75 (447) | Apply dark variants; use text-text-muted for icon if appropriate |
| CombatantCard.tsx | isDead opacity-75 (134); acuity span opacity-75 (174) | 134: dark:bg variant; 174: text-text-muted dark:text-text-secondary |
| ability-score-editor.tsx | 195 opacity-75 | text-text-muted dark:text-text-secondary when not edit mode |

## Order of execution

1. ~~Phase 1 (shared + add-feat modal)~~ DONE 2026-02-23
2. ~~Phase 2 (partial: recovery, creature-stat-block, sheet-header, archetype-section, roll-log, codex/codex page, CreatorSaveToolbar, skill-row)~~ DONE 2026-02-23
3. ~~Phase 3 (selects: add-feat, skill-row, species, MixedSpecies, ancestry, add-skill, add-sub-skill, CombatantCard, item-list)~~ DONE 2026-02-23
4. ~~Phase 4 (status color dark variants)~~ DONE 2026-02-23
5. ~~Phase 5 (roll-log, CombatantCard, ability-score-editor)~~ DONE 2026-02-23
6. ~~Phase 2b (dice-roller, home, campaigns, codex tabs, about, encounter views, health-energy-allocator, abilities-section, PowerPartCard, power-creator, PowerAdvancedMechanics)~~ DONE 2026-02-23
7. **Remaining:** Phase 3b — technique-creator, item-creator, creature-creator, admin: add aria-label to remaining selects
