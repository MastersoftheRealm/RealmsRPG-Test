# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-899
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA. Do not keep implementation-complete tasks in this file waiting for QA.

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 27 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **2026-08-21 owner dump** → TASK-869–898 (GLR chips/columns, Equipment vs Armaments vs “Gear”, changelogs, innate eligibility, guided Abilities/Skills, sheet header/library/rolls, mobile wrap/overlap). **Architect / owner ack before implement:** TASK-871 (armament table split — research only until DEV-Q05), TASK-876 live Codex UPDATE (DEV-Q06), TASK-874 changelog schema/TTL (DEV-Q07). **Mobile audit 2026-08-18** → `reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md`. **ADR-0023 accepted** (TASK-831). **WAITING:** TASK-834 (OneDrive), TASK-823 (manuscript). Do **not** file USM migrations for AddCombatant / AddCharacter / MixedSpecies, or Admin Archetypes onto CodexBrowseListShell (ADR-0005). Do **not** delete `/characters/new/advanced`. TASK-410–414 deferred. Do not reopen ADR-0013 / 761 / 762 / TASK-584 / TASK-415 / TASK-585 / TASK-586.

---

- id: TASK-869
  title: Power/technique category desc chips are value-only
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/lib/chip/list-row-metadata.ts
    - src/lib/detail-option/compact-facts.ts
    - src/lib/glr/glr-fact-catalog.ts
    - src/lib/glr/glr-fact-catalog.test.ts
    - src/docs/ai/ADR/0016-glr-fact-catalog.md
  description: |
    When a power or technique Category fact is shown as a descriptor chip (expanded / demoted column), the chip must be the category value only — “Defense”, not “Category Defense”. Column headers still say Category. `labeledFactChip('Category', source.category)` is the current prefix. Action Type already uses value-only chips (`actionTypeFactChip`); follow that grammar for Category. Do not blindly strip labels from every labeled chip (Duration “1 minute” still needs a label). Search before forking a second chip helper.
  acceptance_criteria:
    - Expanded power/technique GLR chips show category values without a leading “Category” word (e.g. Defense, Offense, Utility).
    - Category remains a column header where it is a column.
    - Update `glr-fact-catalog.test.ts` / compact-facts tests that currently expect `Category Offense`.
    - `npm run build` + targeted tests.

---

- id: TASK-871
  title: Research whether armaments should be separate DB tables
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/GAME_RULES.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/lib/library/official-item-list.ts
    - src/lib/library/armament-library-labels.ts
    - src/types/equipment.ts
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
  description: |
    Owner concern (needs a written recommendation, not a migration): Armaments are only Weapons, Armor, and Shields, but they live in `official_items` / `user_items` (type discriminator + JSON payload). Equipment already has `codex_equipment` with name, description, category, currency, rarity, image_id/url, updated_at. Enhanced items are a later track (`official_enhanced_items`) — out of scope to “finish”. Architect-class: due diligence then stop for owner (DEV-Q05). Inventory: all read/write paths (Library tabs, item creator, sheet inventory, character JSON kit, RLS, `/api/official/[type]`, image_id parity, enrichment, guided L2 builders). Compare (A) keep one items table + `type` (current UI already splits Weapons/Armor/Shields) vs (B) three official + three user tables. Weigh query simplicity, payload-schema drift, migration/RLS/API blast radius, dual user/official copies. Constitution: prefer extend over parallel systems; schema split needs ADR + owner ack. Do not apply migrations in this task.
  acceptance_criteria:
    - Written recommendation in `notes` (or a short ADR draft only if owner asks): counts, example rows, blast radius, recommended option, what would remain shared.
    - Explicit “do not migrate until owner ack” — no SQL applied.
    - If keep-as-is: list the terminology/GLR follow-ups already filed (TASK-872/873) as the real fix.
    - Status stays `not-started`/`partial` until the write-up exists; then wait on DEV-Q05 (do not mark `done` as if tables were split).

---

- id: TASK-873
  title: Sheet Inventory Equipment GLR uses catalog facts, not Type
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/components/patterns/list/entity-library-sections-columns.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/components/character-sheet/library-inventory-panel.tsx
    - src/components/character-sheet/add-library-item/map-selection.ts
    - src/lib/library-selectable-builders.ts
    - src/lib/glr/glr-density.ts
    - src/lib/glr/glr-fact-catalog.ts
    - src/lib/glr/glr-surface-bindings.ts
    - src/lib/codex/equipment-list.ts
    - src/docs/ai/ADR/0016-glr-fact-catalog.md
  description: |
    Character sheet Inventory → Equipment GLR currently shows Name, Type, Quantity. Type is not an Equipment database field. Missing Description (after Name) plus Category, Currency, Rarity (and Qty as a sheet extra). Cause: play density `columnBudget.gear = 0` demotes category/currency/rarity/TP to chips, and `playGearChrome` extraColumns inject Type + Qty. ADR-0016 closed set for Equipment is Category, Currency, Rarity (+ pinned name/image). Codex/browse already uses that. Due diligence: bind `character-sheet-gear` so those facts are columns on this play surface (owner override of TASK-825 chip-all play gear); keep Quantity as extra; drop Type; add Description extra after Name like feats. TP stays a chip if not a column. Follow `resolve-glr-fact-layout` / surface bindings + CI in `glr-fact-catalog.test.ts`. Terminology: this list is Equipment, not Gear (TASK-872). TASK-870 leftover: Add-equipment USM Currency column still paints `gear.costs.totalCurrency` (C sum); `map-selection.ts` writes `cost: 0` so sheet equipment Currency stays empty even after columns exist — persist `equipmentCurrency()` / catalog currency onto the saved item.
  acceptance_criteria:
    - Sheet Equipment headers: Name, Description, Category, Currency, Rarity, Qty (or catalog-equivalent labels). No Type column.
    - Qty still works in edit; facts with values appear as column or chip per catalog — never neither.
    - Currency uses catalog `currency`/`gold_cost` (or stored market cost), not property C sum `costs.totalCurrency`, and is not always empty after Add from library.
    - Creature `layout="creature"` Qty behavior (TASK-813) is not faked back to 1.
    - Catalog tests updated. `npm run build`.
  notes: |
    TASK-870 (2026-08-21 cleanup): getItemColumns equipment branch ~508 still rounds `gear.costs.totalCurrency`. map-selection Item mapper sets `cost: 0` and does not copy currency. Do not invent a second currency helper — `equipmentCurrency` + `resolveItemMarketPricing` already exist.

---

- id: TASK-874
  title: Slim admin Codex changelogs (store, display, retention)
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/lib/codex-changelog.ts
    - src/app/(main)/admin/changelogs/page.tsx
    - src/app/api/admin/changelogs/route.ts
    - src/app/(main)/admin/codex/actions.ts
    - src/docs/SUPABASE_SCHEMA.md
  description: |
    Admin changelogs waste processing and storage: every Codex mutation inserts full `before_data` and `after_data` snapshots (often thousands of lines of unchanged entity) plus `changed_fields`, and the UI `JSON.stringify`s those blobs. Due diligence first (DEV-Q07): (1) what to store — prefer compact `changed_fields` + entity id/name/operation/actor/time; snapshots only if a restore path needs them; (2) what to display — field diffs, not whole documents; (3) how long — propose retention (e.g. 90 days) or cap. `computeChangedFields` already exists. Implement display slimming even if storage TTL waits on owner. Schema drop of `before_data`/`after_data` or a cron delete is Architect / owner ack — propose SQL in `sql/`, do not apply until DEV-Q07. Changelog write must stay best-effort (must not invert Codex saves).
  acceptance_criteria:
    - Written store/display/retention proposal in task notes; owner ack before destructive schema/TTL.
    - Admin changelog UI shows compact diffs, not full entity dumps.
    - New writes do not persist redundant unchanged payloads once policy is approved (or document why snapshots remain).
    - `npm run build`; existing changelog GET auth tests still pass.

---

- id: TASK-875
  title: Browse-all Skills/Sub-Skills footer not flush on the rule
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/patterns/select/unified-selection-modal-footer.tsx
    - src/components/patterns/select/add-skill-modal.tsx
    - src/components/patterns/select/add-sub-skill-modal.tsx
    - src/components/guided-creator/steps/skills-step.tsx
  description: |
    Add Skills modal “Browse all Sub-Skills” sits flush against the horizontal footer separator (same for “Browse all Skills” on Add Sub-Skill in the character creator). Best practice: drop that extra line if Modal footer already separates, or give the control margin so it is not touching the rule. `UnifiedSelectionModalFooter` uses `border-t` then `footerExtra` with no padding. Due diligence: check other USM `footerExtra` (proficiency, guided L2/L3) so one footer spacing rule covers them — do not invent a second footer. Prefer shared footer padding over per-modal hacks. MOBILE_UX: actions stay in footer; Standard/Primary touch tiers unchanged.
  acceptance_criteria:
    - Browse-all controls are not kissing the separator; either no redundant rule or consistent gap.
    - Same treatment on Add Skills and Add Sub-Skill (creator + sheet).
    - No new modal primitive. `npm run build`.

---

- id: TASK-876
  title: Unify feat categories Offense → Offensive
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - scripts/seed-data/feats.csv
    - src/lib/codex/feat-list.ts
    - src/docs/GAME_RULES.md
  description: |
    Feats data has two offense categories: “Offense” and “Offensive”. Change all Offense → Offensive so filters are not duplicated. Codex-data policy: audit live `codex_feats.category` counts + seed CSV examples → propose idempotent SQL in `sql/` (no trailing UPDATE until approved) → wait for owner (DEV-Q06) → apply once. Also update seed CSV / any hardcoded filter option lists so new environments match. Do not rename power/technique part categories (those still use Offense in tests). Preview row counts in the proposal.
  acceptance_criteria:
    - Audit cited (counts of Offense vs Offensive in seed and, when MCP available, live DB).
    - Proposed SQL + seed CSV mapping; live UPDATE only after owner “apply”.
    - Feat category filters expose Offensive once, not both.
    - After apply: no remaining `category = 'Offense'` on feats; changelog note for reference data.

---

- id: TASK-878
  title: Path filter Any / Any Power / Any Martial / Any Powered-Martial
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/components/patterns/filters/archetype-path-filter.tsx
    - src/lib/game/path-recommendation-index.ts
    - src/lib/game/archetype-edit.ts
    - src/hooks/use-path-recommendation-index.ts
    - src/components/guided-creator/guided-feats-l2-modal.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
  description: |
    Archetype path selection needs Any, Any Power, Any Martial, and Any Powered-Martial so users can see recommended feats (and other path-filtered lists) without picking every path. This also fixes guided creator L2 feat sorting: a Power character browses feats with Any Power instead of stuffing every Power path id into `selectedPathIds`. Due diligence: extend ADR-0014 union matching — these options are unions of player-visible paths of that `ArchetypeCategory` (plus a true Any = all paths). Implement as first ChipSelect options/groups, not a parallel filter. Reuse `pathIdsForArchetypeType` rather than a second matcher. Guided L2 should use these aliases instead of enumerating each path. Common sense: selecting Any Power should replace a pile of individual Power paths, not stack with them unless the existing multi-select UX already unions (document the rule). Apply on every ArchetypePathFilter surface (Codex, Library, add modals, guided), not feats-only.
  acceptance_criteria:
    - Filter offers Any, Any Power, Any Martial, Any Powered-Martial plus individual paths.
    - Any Power = union of all player-visible Power paths (same for Martial / Powered-Martial); Any = all paths.
    - Guided L2 feat list for a Power (etc.) character uses the type-wide option, not one id per path.
    - Tests on the index helper. `npm run build`.

---

- id: TASK-879
  title: Define and apply innate-power eligibility everywhere
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/lib/game/innate-eligibility.ts
    - src/lib/library/power-technique-filters.ts
    - src/lib/guided-creator/powers-techniques-l2.ts
    - src/docs/GAME_RULES.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/patterns/list/official-power-list.tsx
    - src/components/character-sheet/add-library-item-modal.tsx
  description: |
    Several surfaces (add modals, GLR lists, filter settings, guided innate screens) need one definition of what an innate power can be. Owner rules: (1) BASIC action only — BASIC Action or BASIC Reaction; (2) duration maximum one minute (≤ 1 minute is fine; nothing longer); (3) no parts from the Adaptation category. `isInnateEligibleActionType` already covers (1). Healing/energy-gain part bans exist in Appendix G / product overview — keep them unless GAME_RULES contradicts; do not drop extra restrictions silently. Due diligence: parse duration consistently (rounds vs minutes vs “until rest”); treat missing duration as eligible only if that matches rules (confirm in GAME_RULES — if unspecified, fail closed for innate lists). Adaptation = part `category` Adaptation, not the “No Harm or Adaptation for Duration” mechanic name. Write the three constraints into GAME_RULES as SoT, then reuse `isPowerInnateEligible` in every innate filter (Library, Codex, USM add-power, guided innate L2, admin path validation). No parallel innate checkers.
  acceptance_criteria:
    - GAME_RULES states the three innate constraints (plus any kept Appendix G bans).
    - One helper gates all innate filters/lists; Adaptation-category parts and duration > 1 minute are excluded.
    - Non-innate power lists are unchanged. Targeted tests for action, duration boundary, Adaptation.
    - `npm run build`.

---

- id: TASK-880
  title: Guided Abilities cards match sheet tiles + allocation tooltip
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/components/character-sheet/ability-stat-tile.tsx
    - src/components/character-sheet/abilities-section.tsx
    - src/docs/GAME_RULES.md
    - public/tooltip-text.tsx
  description: |
    Guided creator Abilities step cards feel too wide/tall. They should be close to character-sheet ability tiles (same font size, similar layout; values are not full roll buttons). On mobile, use the same ability-grid layout as the sheet (C3 2/3/6). Shared UI if possible without breaking guided chrome. Ability Points needs a player-facing tooltip when allocating: each Ability max +3; reducing below 0 gains points for others; cannot go below −2; cannot have less than −3 total among negative values (match GAME_RULES Custom allocation — not backend jargon). Reuse InfoTippy / tooltip-text; do not invent a new tip pattern.
  acceptance_criteria:
    - Guided ability cards visually track sheet tiles (type size, density, mobile grid).
    - Customize/allocate mode shows an Ability Points tooltip with the player rules above.
    - Values are not fake RollButtons. No new shared/ui file unless Architect + allowlist.
    - `npm run build`. DEV-V-013 when marking done.

---

- id: TASK-881
  title: Guided Skills defense cards match sheet defense UI
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/patterns/list/skills-allocation-page.tsx
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/character-sheet/defense-stat-tile.tsx
    - src/components/patterns/select/value-stepper.tsx
  description: |
    Guided Skills defense-increase sections must follow the character-sheet defense tile: show score and bonus; steppers hug the value instead of stretching to both edges; “+1 (2sp)” under an increased value is center-aligned, not left. Cards are too wide — titles/font should match sheet counterparts. Prefer sharing `DefenseStatTile` / sheet layout with a non-roll variant over a second card. Keep guided chrome (budget, step nav).
  acceptance_criteria:
    - Defense cards show score + bonus; steppers border the value; cost hint is centered.
    - Density/type size tracks the sheet; cards are not full-width slabs on desktop.
    - Shared path where possible. `npm run build`. DEV-V-013.

---

- id: TASK-882
  title: Add Skills modal abilities match library columns
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/patterns/select/add-skill-modal.tsx
    - src/lib/codex/skill-list.ts
    - src/lib/guided-creator/guided-skill-recommendations.ts
    - src/lib/constants/skills.ts
  description: |
    Add Skills modal GLR puts Abilities far right as abbreviated desc chips, and recommended-by-highest-ability also chips that ability on the name — so it shows twice. Abilities should display like Codex/Library: a real column with full ability names, not chips, not abbreviated. Tighten the column so it does not sit on top of the + / add control. Recommended badges may keep a non-ability meaning (path names); do not repeat the governing ability as a name chip when the Abilities column is present. Reuse `SKILL_HEADER_COLUMNS` / Codex ability formatting, not a new chip grammar.
  acceptance_criteria:
    - Add Skills list: Abilities column, full names, not chips; not duplicated on the name.
    - Column is not jammed against the add control.
    - Library/Codex skill lists stay the source of truth for how abilities look.
    - `npm run build`.

---

- id: TASK-883
  title: Add Sub-Skill modal abilities are full names
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/patterns/select/add-sub-skill-modal.tsx
    - src/lib/codex/skill-list.ts
    - src/lib/constants/skills.ts
  description: |
    Add Sub-Skill modal already uses a text Abilities column (not chips) but abbreviates (`slice(0, 3).toUpperCase()`). Show full ability names like the library. Share formatting with TASK-882 / Codex `SKILL_HEADER_COLUMNS` so add-skill and add-sub-skill do not drift.
  acceptance_criteria:
    - Sub-skill Abilities column shows full names (comma-separated if several), not STR-style abbreviations.
    - Same helper as add-skill/Codex if practical. `npm run build`.

---

- id: TASK-884
  title: Sheet header wraps Level vs species, not mid-mixed-name
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-header-identity.tsx
    - src/types/ancestry.ts
    - src/docs/MOBILE_UX.md
  description: |
    Below the character name, mixed-species level 20 currently wraps oddly: “Level Species name 1 /” then a lower row “20 · Second species name”. When Level + both species names do not fit one row, wrap as Level (label + value) on the first row and species name(s) on the next — do not split the level number away from “Level” or split “Name1 / Name2” across the level value. Use `ancestry.speciesNames` for mixed (not a single slash string that wraps through “Level”). C2: `min-w-0`; wrap on word/token boundaries (see TASK-897). Do not invent a new identity component.
  acceptance_criteria:
    - Narrow mixed-species header: row 1 is Level N; row 2 is both species names.
    - Wide screens keep one line. Level number never wraps onto the species-only line alone.
    - Verify 360 / 390 / 768. `npm run build`.

---

- id: TASK-885
  title: Header Speed/Evasion/Crit/DR are squarish equal tiles
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-header.tsx
    - src/components/character-sheet/sheet-large-stat-block.tsx
    - src/docs/MOBILE_UX.md
  description: |
    Speed, Evasion, Critical Range, and Damage Reduction stretch horizontally and squeeze Health/Energy and name. They should take equal space, relatively centered in the header cluster, each squarish (wide enough for the title + margins) — not full-bleed rectangles. TASK-839 already equal-track gridded them (C3); they still `w-full`/`h-full` fill the middle column. Do not reinvent tiles — tighten `LargeStatBlock` / header grid so the cluster does not consume the whole middle track. C3 equal tracks stay; C5: check 1024 where the three-column header engages.
  acceptance_criteria:
    - Four (or visible) stat tiles are equal, compact, and do not stretch identity/resources away.
    - Titles fit with padding; not long empty bars. 360 / 768 / 1024 / 1280.
    - `npm run verify:responsive` after layout change. `npm run build`.

---

- id: TASK-886
  title: Age and backstory persist as Notes fields, not appearance dump
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/lib/character/appearance-age.ts
    - src/lib/guided-creator/build-character.ts
    - src/components/character-creator/steps/finalize/identity-fields.tsx
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/character-sheet/notes-tab.tsx
    - src/types/character.ts
    - src/stores/guided-creator-store.ts
  description: |
    Creator → sheet mapping is wrong for identity notes. Age typed in the creator is merged into appearance (`mergeAgeIntoAppearance`) and shows under Appearance. Age must be its own Notes-tab header field to the right of Weight & Height. Backstory from creation does not appear — sheet has Appearance, Archetype description, general notes, but no Background/backstory section. `Character.backstory` already exists on the type / `clean-for-save`. Due diligence: map guided `age` / `appearanceNotes` / backstory (find the creator field name) onto dedicated character fields; migrate existing “Age: N” prefixes out of appearance when reading so old characters still show Age. Do not invent a second notes store. Schema: if `age` is not a column, confirm JSON payload vs Postgres in SUPABASE_SCHEMA before adding a migration (Architect if new column).
  acceptance_criteria:
    - Age from creator shows in Notes header after height/weight, not inside Appearance.
    - Backstory/background from creator has its own notes section on the sheet.
    - Appearance stays appearance-only. Existing Age: prefixes still parse into the Age field.
    - Guided + advanced creators both map. `npm run build`. DEV-V-009 / DEV-V-013.

---

- id: TASK-887
  title: Edit-mode library hide-eye does not pad tabs into overflow
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/use-library-tab-navigation.tsx
    - src/components/ui/tab-navigation.tsx
    - src/components/character-sheet/library-section.tsx
    - src/docs/MOBILE_UX.md
  description: |
    In sheet edit mode the hide/show eye next to library tabs adds so much horizontal padding that most tabs require scrolling. Eyes are `IconButton` `min-h/min-w-[44px]` on every tab. Use Dense expanded hit (`.hit-area-dense-square`) so painted size stays compact while coarse pointers still get 44px hit — do not use `md:` to shrink. Keep the hide control; stop it from inflating the tab list.
  acceptance_criteria:
    - With all tabs visible in edit mode, typical desktop widths do not force horizontal tab scroll solely because of eye padding.
    - Hide/show still works; 44px hit on coarse pointer. `npm run build`.

---

- id: TASK-888
  title: Feats Customize looks like a button and is evenly spaced
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/library-feat-rows.tsx
    - src/components/ui/button.tsx
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Character sheet Feats/Traits edit-mode Customize has too much vertical padding, and its near-chip styling makes it hard to read as a button. In the expanded GLR block, the horizontal rule above Customize touches the desc chips while the button has extra space — uneven. Use a real `Button` (or chip-sized button variant already in ui) so it is obviously clickable and distinct from descriptor chips. Balance padding above/below the rule vs chips. Do not make Customize a desc chip.
  acceptance_criteria:
    - Customize is visually a button, not a desc-chip cousin; vertical padding is tight.
    - Expanded: equal gap from chips to rule and rule to button.
    - `npm run build`. DEV-V-010 / DEV-V-009.

---

- id: TASK-889
  title: Leveled feat names use Roman numerals, not (Level N)
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/lib/leveled-feats.ts
    - src/components/character-sheet/feats-tab.tsx
    - src/components/character-sheet/add-feat-modal.tsx
    - src/lib/guided-creator/feats-l2.ts
  description: |
    Feat level 2+ must display “Feat Name II”, not “Feat Name (Level 2)”. `formatFeatName` currently appends `(Level ${lvl})`. Due diligence: many Codex names already include the numeral (e.g. “Amplify II” with `feat_lvl: 2`) — never produce “Amplify II II” or “Amplify II (Level 2)”. If the stored name already ends with a Roman numeral matching `feat_lvl`, leave it; otherwise append the Roman suffix for lvl > 1. One helper, all feat surfaces (sheet, add modal, guided, admin, creature).
  acceptance_criteria:
    - Display is Name / Name II / Name III … with no “(Level N)”.
    - Names that already include the numeral are not double-suffixed.
    - Tests in `leveled-feats`. `npm run build`.

---

- id: TASK-890
  title: Library tab overflow arrows only when tabs overflow
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/ui/tab-navigation.tsx
    - src/components/character-sheet/library-section.tsx
    - src/components/ui/tab-navigation.test.ts
  description: |
    Sheet library tab chevrons should auto-scroll to the leftmost/rightmost tab, but they still appear when every tab already fits (no overflow). `tabListOverflowState` already hides buttons when `scrollWidth === clientWidth`; likely a false-positive (sub-pixel, padding, or a second scroller). Due diligence: measure why `overflow.start/end` is true when content fits; fix the threshold (e.g. 1px slack) sitewide on `TabNavigation` so Codex/Library benefit too. Do not show a dead arrow.
  acceptance_criteria:
    - Arrows render only when that edge can actually scroll.
    - When tabs fit, no chevron. Tests cover equal scroll/client width and overflow.
    - `npm run build`.

---

- id: TASK-891
  title: Remove prof-points ±; fix slider thumb alignment and dark mode
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/archetype-section.tsx
    - src/components/patterns/select/powered-martial-slider.tsx
    - src/docs/DESIGN_SYSTEM.md
  description: |
    Archetypes and attacks edit mode still offer +/− on the proficiency-points pool; players cannot increase that pool anymore — remove those steppers. The Power↔Martial slider thumb sits below the track (hanging off the line) and lacks a dark-mode variant. Fix `PoweredMartialSlider` (shared with creature creator) using theme tokens (`*-fg` / surface), not a one-off sheet CSS fork. Display remaining/total as read-only if useful; do not imply the max is editable.
  acceptance_criteria:
    - No +/− to change prof-point max on the sheet.
    - Slider thumb is vertically centered on the track; dark theme uses a proper tokenized thumb/track.
    - `npm run build`.

---

- id: TASK-892
  title: Level-up auto-assigns a new prof point to the existing side
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/lib/game/archetype-display.ts
    - src/lib/game/archetype-edit.ts
    - src/components/character-sheet/use-sheet-resource-actions.ts
    - src/app/(main)/characters/[id]/use-character-sheet-page-data.ts
  description: |
    When a character levels and gains a martial or power prof point, if they previously had all points in only one side, the new point auto-assigns to that same side (e.g. 2 martial → level 5 with +1 martial, not a leftover unassigned or a split). `applyPathProficiencyForLevel` today only floors to admin level-5 path targets from level 5+. Due diligence: when does a level grant +1 martial vs +1 power vs +1 either (GAME_RULES progression tables); implement auto-assign for pure-martial and pure-power allocations; Powered-Martial with both sides already split should keep existing redistribution (do not yank points). Cover both sheet level-up call sites.
  acceptance_criteria:
    - Pure martial (or pure power) stays pure when the new point is of that kind / untyped grant.
    - Mixed Powered-Martial allocation is not forcibly flattened.
    - Tests on the helper. `npm run build`.

---

- id: TASK-893
  title: Roll-log bonus hover names the bonus source
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/rolls/roll-log.tsx
    - src/components/rolls/roll-context.tsx
  description: |
    Hovering the bonus added on a roll should say what it is: Strength on a Strength roll, Power bonus on a power roll, Reflexes bonus on Reflexes, etc. `makeD20Roll` stores a title and a bare `modifier` number; the log paints the number with no source. Pass a player-facing bonus label through the roll entry (reuse WordHelpTip / native title — do not invent a new tooltip system). Cover ability, defense, skill, attack, and power/potency rolls that add a named bonus.
  acceptance_criteria:
    - Hovering the added bonus shows the source name (Strength, Power bonus, Reflexes bonus, …).
    - Zero/absent modifier has no bogus hover. `npm run build`.

---

- id: TASK-894
  title: Current HP may go negative
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/sheet-resource-input.tsx
    - src/components/character-sheet/sheet-header-resources.tsx
    - src/components/patterns/select/value-stepper.tsx
    - src/docs/GAME_RULES.md
  description: |
    HP is allowed and supposed to go negative (GAME_RULES Dying: HP at 0 or negative). `ResourceInput` clamps with `Math.max(0, …)` on typed and stepper paths. Allow negative current Health only (Energy still cannot go below 0 per GAME_RULES). Do not clamp encounter combatant HP to 0 if that path is used for player-linked HP — check `combatant-card-resources.tsx` and only change player-character Health. No upper clamp change (over-heal stays).
  acceptance_criteria:
    - Sheet Health stepper and typed entry can set negative HP.
    - Energy still floors at 0. Dying rules copy unchanged.
    - `npm run build`. DEV-V-009.

---

- id: TASK-895
  title: Clicking outside the roll log closes it
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - src/components/rolls/roll-log.tsx
    - src/components/rolls/roll-context.tsx
    - src/components/patterns/chrome/roll-button.tsx
  description: |
    Click/tap outside the open roll log should close it, unless the click is starting another roll (a roll button while the log is open). C4: keep the shared bottom-right dock; do not add a second overlay. Use a pointer-down outside listener that ignores roll triggers (`RollButton` / roll context). Opening via the FAB still toggles. Escape-to-close is fine if already present.
  acceptance_criteria:
    - Outside click/tap closes the log.
    - Clicking a roll control with the log open keeps it open and records the new roll.
    - Clicks inside the panel do not close it. `npm run build`.

---

- id: TASK-896
  title: Diagnose red edit-pen when no section pencils are red
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/components/character-sheet/use-character-sheet-derived.ts
    - src/components/character-sheet/sheet-action-toolbar.tsx
    - src/components/patterns/chrome/point-status.tsx
    - src/components/character-sheet/skills-section.tsx
    - src/components/character-sheet/abilities-section.tsx
  description: |
    The sheet edit-mode pencil shows a red notification dot (owner reads this as overspent) but entering edit mode shows no local red pencils. Toolbar uses `hasUnappliedPoints` (unspent ability/HE/skill/feat slots or can-level-up) with `title="You have unspent points!"` and a danger pulse — section pencils go red on overspend. Due diligence: reproduce which remaining pool is true (feats often leftover; species skills; HE; canLevelUp). Fix the mismatch: either the global dot should match real overspend, or it should not use danger-red for mere unspent, and it must name the remaining pool (tooltip/aria). False positives (counting slots the player cannot spend) must be fixed. Do not add a second toolbar badge.
  acceptance_criteria:
    - Global pencil indicator is truthful (overspend vs unspent) and explains what is left or over.
    - If nothing is overspent or unspent, no red dot.
    - Section pencils still reflect overspend. `npm run build`. DEV-V-009.

---

- id: TASK-897
  title: Sitewide wrapping is word-based, not character-by-character
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/docs/MOBILE_UX.md
    - src/components/patterns/list/grid-list-row-collapsed.tsx
    - src/components/patterns/list/quick-armaments-sections.tsx
    - src/components/character-sheet/sheet-large-stat-block.tsx
  description: |
    On thin screens, names wrap character-by-character (sheet weapon Name column becomes unreadable and inflates page height). This is a global issue: C2 currently talks truncation/ellipsis, not wrap strategy. Due diligence: find `break-all` / unconstrained `break-words` on GLR name columns and other identity text. Rule: wrap at word/token boundaries; long unbreakable tokens may then break; name columns that would explode row height should truncate with ellipsis (C2) rather than one-letter lines. Put the rule in MOBILE_UX.md and apply it on GridListRow names plus armament name cells — then grep remaining offenders on play surfaces. Do not set a blanket `whitespace-nowrap` that causes C6 page scroll.
  acceptance_criteria:
    - MOBILE_UX C2 (or sibling clause) states word-wrap vs character-wrap vs truncate.
    - Sheet weapon names wrap by word or ellipsis — not one character per line — at 360px.
    - Shared row name chrome is fixed once, not a one-off weapon class. `npm run verify:responsive`. `npm run build`.

---

- id: TASK-898
  title: Expanded GLR rows must not overlap on thin screens
  created_at: 2026-08-21
  created_by: owner
  priority: high
  status: not-started
  related_files:
    - src/components/patterns/list/grid-list-row.tsx
    - src/components/patterns/list/grid-list-row-expanded.tsx
    - src/components/character-sheet/library-feat-rows.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/ADR/0016-glr-fact-catalog.md
  description: |
    On thin screens, same-row expanded GLR content overlaps (example: feat Uses steppers overlap the word “Recovery”). Treat as a systemic GridListRow/expanded-chrome bug, not a feats-only patch. Due diligence: collapsed columns vs expanded body (TASK-868 XOR) plus edit steppers in header tracks that are too narrow at 360px. Layout must stack or reflow (C2 min-w-0, no overlap); Uses/Recovery and other fact+control pairs need a shared expanded layout that wraps. Verify feats, techniques, powers, armaments at 360 / 390 / 768. Do not fork a feat-only expanded row.
  acceptance_criteria:
    - Expanded feat Uses steppers do not overlap Recovery (or other facts) at 360px.
    - Same row chrome is safe for other GLR entities with steppers/chips on one row.
    - MOBILE_UX notes the expanded-row reflow rule. `npm run verify:responsive`. `npm run build`.
