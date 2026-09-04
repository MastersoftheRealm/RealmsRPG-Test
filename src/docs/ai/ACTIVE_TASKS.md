# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-927
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA. Do not keep implementation-complete tasks in this file waiting for QA.

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 8 agent-eligible (3 partial owner-gated, 5 not-started) · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **Architect / owner ack before implement:** TASK-871 (DEV-Q05), TASK-876 (DEV-Q06), TASK-874 (DEV-Q07), TASK-914 (Admin Archetypes list shell), TASK-915 (power/empowered editor extract). **WAITING:** TASK-834 (OneDrive), TASK-823 (manuscript), TASK-917 (pending-QA snapshot — DEV-016). TASK-410–414 deferred. Mobile audit: `reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md`.

---

- id: TASK-871
  title: Research whether armaments should be separate DB tables
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: partial
  completed_work: |
    **Recommendation: keep `official_items` / `user_items` with `type` discriminator (Option A). Do not migrate until owner ack (DEV-Q05).**
    - **Current shape:** Armaments = weapons | armor | shield rows in `official_items` / `user_items` (`type` + JSON payload). Gear uses separate `codex_equipment` (name, category, currency, rarity, image). Enhanced items = `official_enhanced_items` (deferred track).
    - **Read/write inventory (~20+ touchpoints):** Library tabs + counts (`fetch-library-tab-counts`), `/api/official/[type]` + `/api/user/library/[type]`, item creator, sheet inventory + enrichment (`character-view-enrichment-server`), guided L2 armament builders, admin public library, Realms Image Library consumers, owner-library-for-view, RLS on unified item tables.
    - **Live counts (2026-08-22):** `official_items` weapon 17 / armor 5 / shield 2; `user_items` weapon 29 / armor 9 / shield 6. Small tables — split does not buy query scale.
    - **UI already splits:** `ArmamentLibraryKind`, `filterItemsByArmamentKind`, separate Weapons/Armor/Shields tabs — terminology/GLR clarity is the real pain (TASK-872/873), not query shape.
    - **Option B blast radius (split tables):** 6 tables (3 official + 3 user), duplicate RLS policies, migrate JSON payloads + image_id, fork `/api/official/[type]` routing, retarget enrichment + character JSON kit references, dual-copy sync for user clones — high irreversible risk for marginal query gain (filters already use `type`).
    - **What stays shared either way:** properties calc (`item-calc`), enrichment, GLR chrome (`official-item-list`), image picker, path recommendations on rows.
  remaining_work: |
    - Owner review on **DEV-Q05**: confirm keep-as-is vs request ADR for split.
    - If keep-as-is: prioritize TASK-872/873 terminology/GLR follow-ups (already filed).
    - **No SQL applied** in this task.
  related_files:
    - src/docs/SUPABASE_SCHEMA.md
    - src/docs/GAME_RULES.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/lib/library/official-item-list.ts
    - src/lib/library/armament-library-labels.ts
    - src/lib/library/fetch-library-tab-counts.ts
    - src/app/api/official/[type]/route.ts
    - src/types/equipment.ts
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  description: |
    Owner concern (needs a written recommendation, not a migration): Armaments are only Weapons, Armor, and Shields, but they live in `official_items` / `user_items` (type discriminator + JSON payload). Equipment already has `codex_equipment`. Architect-class: due diligence then stop for owner (DEV-Q05).
  acceptance_criteria:
    - Written recommendation in `notes` (or a short ADR draft only if owner asks): counts, example rows, blast radius, recommended option, what would remain shared.
    - Explicit “do not migrate until owner ack” — no SQL applied.
    - If keep-as-is: list the terminology/GLR follow-ups already filed (TASK-872/873) as the real fix.
    - Status stays `partial` until owner closes DEV-Q05 (do not mark `done` as if tables were split).
  notes: |
    See `completed_work` for full write-up. Constitution: prefer extend over parallel systems.

---

- id: TASK-874
  title: Slim admin Codex changelogs (store, display, retention)
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: partial
  completed_work: |
    - **Display:** Compact field-diff tables; GET ships identity snapshots (name/type), not full entity JSON.
    - **2026-09-03 clutter:** Visible diffs omit empty-equivalent pairs (`null` / `""` / `[]` / `{}`) and `updated_at`/`created_at`.
    - **Creates:** Display + new writes are identity only (`Created “Name” (Feat)`); no field dump. Deletes still persist/show prior-state fields.
    - **Updates/deletes store:** Full `before_data`/`after_data` still written until DEV-Q07. Changelog insert is best-effort so Codex saves cannot fail.
    - **Proposal:** `sql/codex-changelog-retention-proposed.sql` — prefer `changed_fields` as SoT; optional 90-day TTL; drop snapshot columns only after owner confirms no restore path. Live 2026-08-22: 709 rows / ~1.7 MB.
    - Changelog GET auth tests PASS; unit tests for display helper.
  remaining_work: |
    - Owner ack **DEV-Q07** on retention + whether to stop persisting `before_data`/`after_data`.
    - After ack: optional migration/TTL apply (Dashboard or MCP); update `recordCodexChange` write shape.
    - Per-item Hist in Codex edit (e.g. power part) is still not in this task.
  developer_test_plan: |
    DEV-V-056-T001 — `/admin/changelogs` feat update shows only real content diffs (no `—`/`—` req rows; no `updated_at`).
    DEV-V-056-T002 — Create rows are `Created “Name” (Feat)` with no field table; delete rows still show prior fields.
  related_files:
    - src/lib/codex-changelog.ts
    - src/lib/codex-changelog-display.ts
    - src/lib/codex-changelog-display.test.ts
    - src/app/(main)/admin/changelogs/page.tsx
    - src/app/api/admin/changelogs/route.ts
    - src/app/(main)/admin/codex/actions.ts
    - sql/codex-changelog-retention-proposed.sql
    - src/docs/SUPABASE_SCHEMA.md
  description: |
    Admin changelogs waste processing and storage. Implement display slimming; propose store/retention; schema/TTL waits on owner.
  acceptance_criteria:
    - Written store/display/retention proposal in task notes; owner ack before destructive schema/TTL.
    - Admin changelog UI shows compact diffs, not full entity dumps.
    - New writes do not persist redundant unchanged payloads once policy is approved (or document why snapshots remain).
    - `npm run build`; existing changelog GET auth tests still pass.

---

- id: TASK-876
  title: Unify feat categories Offense → Offensive
  created_at: 2026-08-21
  created_by: owner
  priority: medium
  status: partial
  completed_work: |
    - **Seed audit (2026-08-22):** `feats.csv` is already unified (`Offense=0`, `Offensive=183`).
    - **Live audit (MCP):** `Offensive=187`, `Offense=8` remaining — Assassin's Blade (35), Empowered State (203), Empowered Teacher (204), Graceful Stance (797, 804), Groundwork (801), Impasta (321), Probing Strike (800).
    - **SQL preview:** `sql/codex-feat-category-offense-to-offensive-proposed.sql` (UPDATE commented until apply).
    - **Filters:** `normalizeFeatCategory` maps leftover `Offense` → Offensive so Codex/Library expose one option and still match the 8 live rows.
    - Power/technique part categories unchanged (`Offense` in part tests).
  remaining_work: |
    - Owner approve + apply live `codex_feats` UPDATE (**DEV-Q06**).
    - Post-apply: verify zero `category = 'Offense'` on feats; note in AI_CHANGELOG for reference data.
  related_files:
    - scripts/seed-data/feats.csv
    - sql/codex-feat-category-offense-to-offensive-proposed.sql
    - src/lib/codex/feat-list.ts
    - src/lib/codex/feat-list.test.ts
    - src/docs/GAME_RULES.md
  description: |
    Feats data has two offense categories: “Offense” and “Offensive”. Unify to Offensive. Codex-data policy: live UPDATE only after owner “apply”.
  acceptance_criteria:
    - Audit cited (counts of Offense vs Offensive in seed and, when MCP available, live DB).
    - Proposed SQL + seed CSV mapping; live UPDATE only after owner “apply”.
    - Feat category filters expose Offensive once, not both.
    - After apply: no remaining `category = 'Offense'` on feats; changelog note for reference data.

---

- id: TASK-914
  title: Mount Admin Archetypes list on CodexBrowseListShell
  created_at: 2026-09-03
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/components/patterns/list/codex-browse-list-shell.tsx
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/ADR/0005-codex-browse-list-shell.md
  description: |
    Admin Archetypes tab hand-rolls SectionHeader + SearchInput + GridListRow instead of CodexBrowseListShell. Path-row editor chrome stays custom (FEATURE_INDEX / ADR-0005 exception). Owner ack before implement — do not put path rows on the browse shell.
  acceptance_criteria:
    - Owner ack in chat or this task’s notes before coding.
    - `AdminArchetypesTab` list uses CodexBrowseListShell (search/empty/loading/rows + AdminCodexRowActions). Path editor / `admin-archetype-path-rows` stay out of the shell.
    - FEATURE_INDEX row updated; GLR chrome CI still green if the tab is a registered source.
    - `npm run build`.
  notes: |
    Architect / owner ack before implement (same gate as TASK-871). Filed /debt 2026-09-03. Pause for a stronger model if the shell prop surface is unclear.

---

- id: TASK-915
  title: Extract shared power/empowered creator editor sections
  created_at: 2026-09-03
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/app/(main)/power-creator/power-creator-editor-power-config.tsx
    - src/app/(main)/power-creator/power-creator-editor-power-damage.tsx
    - src/app/(main)/power-creator/power-creator-editor-action-profile.tsx
    - src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-config.tsx
    - src/app/(main)/empowered-technique-creator/empowered-technique-editor-power-damage.tsx
    - src/app/(main)/empowered-technique-creator/empowered-technique-editor-action-profile.tsx
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    Power creator and empowered-technique creator duplicate editor section files (power-config, power-damage, action-profile). Extract one shared module under `components/creator/` (or a co-located helper both routes import). Do not merge technique-only calc (`formatTechniqueDamage`) into power damage.
  acceptance_criteria:
    - Owner/Architect ack before new shared/ui files (allowlist + ADR if a new patterns/ui file).
    - Duplicate section components deleted; both routes import the shared extract.
    - Cost/display math still comes from `lib/calculators` (no second formula).
    - `npm run build`; smoke `/power-creator` and `/empowered-technique-creator` load/save.
  notes: |
    Architect / owner ack before implement. Filed /debt 2026-09-03. Prefer extract-in-place over a new pattern unless two+ more creators need it.

---

- id: TASK-916
  title: Fold sheet formatArea / formatDamageType into canonical formatters
  created_at: 2026-09-03
  created_by: agent
  priority: low
  status: not-started
  related_files:
    - src/components/character-sheet/library-list-helpers.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/lib/utils/string.ts
    - src/lib/calculators/power-calc.ts
  description: |
    Sheet `formatArea` / `formatDamageType` are string-shaped local helpers beside canonical `formatAreaForDisplay` and `formatDamageDisplay` / `formatPowerDamage`. Wire the sheet path through the canonical helpers if display stays identical; otherwise document why the string path must stay.
  acceptance_criteria:
    - No local `formatArea` / `formatDamageType` in `library-list-helpers.ts`, or a one-line comment citing the canonical helper and why a string shim remains.
    - Sheet Library power Area/Damage cells match pre-change copy (Target, typed dice).
    - `npm run build`; targeted sheet/library unit tests if they exist.
  notes: |
    Filed /debt 2026-09-03. Do not merge `formatPowerDamage` with `formatTechniqueDamage` (different payloads).

---

- id: TASK-924
  title: Fill relevant empty codex_parts.defense from description (owner apply)
  created_at: 2026-09-03
  created_by: owner
  priority: medium
  status: not-started
  related_files:
    - sql/codex-parts-targeted-defenses-proposed.sql
    - src/lib/game/targeted-defenses.ts
    - src/app/(main)/admin/codex/admin-part-form.ts
    - src/docs/GAME_RULES.md
  description: |
    Not every power/technique part targets a defense. Some empty `codex_parts.defense` rows do name targets in description (e.g. "Targets your choice of Fortitude, Mental Fortitude, or Discernment", "Targets Evasion"). Audit empty rows, propose fills only where the copy is clearly a targeted-defense clause, leave the rest empty. Live apply is owner-gated.
  acceptance_criteria:
    - Proposed SQL in `sql/` covers only description-backed targeted-defense clauses (no greedy "mentions Evasion as a stat" fills).
    - False positives from a regex preview (Blessed, Evasion Increase, Side-Step, Alternate Targeted Defense, etc.) stay empty unless owner adds them.
    - No live UPDATE until owner says apply. Post-apply: counts + changelog.
    - Creator suggestion/chips pick up the new field without further UI work.
  notes: |
    Live 2026-09-03: 85 filled / 335 empty / 420 total. Draft `sql/codex-parts-targeted-defenses-proposed.sql` lists a conservative 16-id set. Owner may add/remove rows before apply. Do not invent a core_rules DAMAGE_TYPES map.

---

- id: TASK-926
  title: Weapon range display — typed labels + Thrown/Ranged normal/long
  created_at: 2026-09-03
  created_by: owner
  priority: high
  status: not-started
  build_validation: |
    suite: DEV-V-018
    tests:
      - DEV-V-018-T022
  developer_test_plan: |
    Suite DEV-V-018 T022 — see BUILD_VALIDATION.md (add on implement). Spot-check Library/sheet weapon range cells + creator range badge.
  related_files:
    - src/lib/calculators/item-calc.ts
    - src/lib/calculators/item-calc-range.test.ts
    - src/lib/detail-option/compact-facts.ts
    - src/lib/detail-option/compact-facts.test.ts
    - src/components/character-sheet/library-entity-rows.tsx
    - src/docs/GAME_RULES.md
    - src/docs/ai/FEATURE_INDEX.md
    - src/docs/ai/BUILD_VALIDATION.md
  description: |
    After TASK-919, creator pickers store Melee / Reach / Ranged / Thrown with core-rule space ladders, but display still shows bare `N spaces` (and chips often force a “Range …” prefix). Owner wants typed display: Melee; Reach #; Thrown and Ranged as normal/long `#/4×#` (owner wrote `#/4*#`), with a hover tooltip on the long-range half explaining use at 4× normal incurs −5 (GAME_RULES § Ranged Attack Penalties). Spaces remain ladder-derived — not raw op levels.
  acceptance_criteria:
    - Single display SoT in `item-calc` (extend `formatWeaponRangeConfig` / `resolveWeaponRangeDisplay` / compact helper — no parallel formatter). Melee → `Melee`; Reach → `Reach N`; Thrown → `Thrown N/4N` (or equivalent `#/4×#`); Ranged → `Range N/4N`.
    - Long-range segment has an InfoTippy (or existing tip pattern) explaining 4× normal range with −5 Attack Roll; Melee/Reach have no long-range half.
    - `formatRangeFact` / GLR / sheet / Library / creator badge consume the SoT without mislabeling Reach or Thrown as “Range …”. Dense compact may shorten (e.g. `16/64`) but must keep type when ambiguous.
    - GAME_RULES + FEATURE_INDEX note the display grammar; vitest covers ladders + formats; BUILD_VALIDATION DEV-V-018-T022 added; `npm run build`.
  notes: |
    Creator config UI (TASK-919) stays as-is. Do not invent a second range ladder. Tooltip copy should match GAME_RULES (long range = 4× normal, −5). Owner QA after implement → pending-qa.

