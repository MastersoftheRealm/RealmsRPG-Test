# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-904
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA. Do not keep implementation-complete tasks in this file waiting for QA.

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 4 agent-eligible (1 not-started + 3 partial owner-gated) · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **2026-08-24** TASK-903 archived (tab-focus session recovery no longer clears React Query). **2026-08-24** TASK-902 archived (mobile sheet vertical scroll). **2026-08-22** `/debt` filed TASK-901 (always-on 44 slabs). **2026-08-22** TASK-900 archived (styleguide Linux visual baselines). **Architect / owner ack before implement:** TASK-871 armament table split (DEV-Q05 — research write-up done), TASK-876 live Codex UPDATE (DEV-Q06 — seed+SQL preview ready), TASK-874 changelog schema/TTL (DEV-Q07 — display slimming done). **2026-08-22** TASK-899 archived (Turnstile + security.txt; Dashboard steps DEV-015). Batch A sheet/library/rolls tasks (885–895) archived. **Mobile audit 2026-08-18** → `reports/mobile-audit-2026-08-18/MOBILE_AUDIT.md`. **WAITING:** TASK-834 (OneDrive), TASK-823 (manuscript). Do **not** delete `/characters/new/advanced`. TASK-410–414 deferred.

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
    - **Display:** Admin changelogs list + modal render compact field-diff tables via `codex-changelog-display.ts`. GET `/api/admin/changelogs` now ships name-only snapshots (not full entity JSON).
    - **Proposal:** `sql/codex-changelog-retention-proposed.sql` — prefer `changed_fields` as SoT; optional 90-day TTL; drop snapshot columns only after owner confirms no restore path (DEV-Q07). Live 2026-08-22: 709 rows / ~1.7 MB.
    - **Store (unchanged pending ack):** `recordCodexChange` still writes snapshots best-effort so Codex saves cannot fail.
    - Changelog GET auth tests PASS; unit tests for display helper.
  remaining_work: |
    - Owner ack **DEV-Q07** on retention + whether to stop persisting `before_data`/`after_data`.
    - After ack: optional migration/TTL apply (Dashboard or MCP); update `recordCodexChange` write shape.
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

- id: TASK-901
  title: Pointer-tier remaining always-on min-h-[44px] slabs (TASK-865 leftovers)
  created_at: 2026-08-22
  created_by: agent
  priority: medium
  status: not-started
  related_files:
    - src/components/character-sheet/edit-archetype-modal.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-item-options-section.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-optional-rules-section.tsx
    - src/app/(main)/crafting/[id]/_components/crafting-rolls-section.tsx
    - src/app/(main)/encounters/page.tsx
    - src/app/(main)/encounters/[id]/_components/skill/skill-participant-card.tsx
    - src/docs/MOBILE_UX.md
    - src/docs/ai/ADR/0023-responsive-layout-contracts.md
    - src/components/ui/button-tiers.test.ts
  build_validation: |
    suite: DEV-V-055
    tests:
      - DEV-V-055-T008
  developer_test_plan: |
    Suite DEV-V-055 T008 — see BUILD_VALIDATION.md (add when implementing)
  description: |
    `/global-audit` 2026-08-22: TASK-865 cleared viewport `md:min-h-*` shrinks, but left
    always-on `min-h-[44px]` (no `@media (pointer: coarse)`) on crafting options/rules/rolls,
    edit-archetype modal cards, encounters hub icons, and skill-participant-card. Owner ack
    was required before retagging those surfaces onto pointer tiers / Button sizes / `.hit-area-*`.
  acceptance_criteria:
    - Named surfaces use pointer tiers (coarse Standard/Primary as appropriate; fine compact) — no always-on 44 layout slab on fine pointer unless product-intentional and documented.
    - Do not retag list thumbs, image mattes, or InnateToggle.
    - Extend `button-tiers.test.ts` ratchet; add DEV-V-055 T008; `/characters/new/advanced` still loads.
    - Owner ack recorded in notes or chat before implement (gated from /debt).
  notes: |
    Filed from /debt after /global-audit. Do not fold USM migrations or AdminArchetypes shell.
    Keep `/characters/new/advanced`. Live codex/schema out of scope.

