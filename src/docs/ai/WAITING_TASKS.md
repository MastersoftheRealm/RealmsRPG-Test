# Waiting / Blocked / Human-owned AI Tasks

Not part of the agent session-start hot path. Agents may skim for dependencies, but **do not** load this file every session.

Move a task back to [`ACTIVE_TASKS.md`](ACTIVE_TASKS.md) when it becomes unblocked / unassigned to a human.

**Process:** [`AI_TASK_QUEUE.md`](AI_TASK_QUEUE.md)

---

- id: TASK-794
  title: Split shared/ into ui / patterns / feature
  created_at: 2026-08-15
  created_by: agent
  priority: medium
  status: not-started
  assignee: owner
  related_files:
    - src/components/shared/index.ts
    - scripts/shared-ui-allowlist.json
    - src/docs/ai/ADR/README.md
  description: |
    Architect: split `src/components/shared/` into ui / patterns / feature
    (audit report 04). TASK-751 already added `shared/filters` — do not mix
    with Prettier or a drive-by import rewrite.
  acceptance_criteria:
    - ADR accepted before any folder move.
    - Allowlist + barrels + FEATURE_INDEX updated in the same change.
    - No behavior change; import paths migrate with a documented map.
  notes: |
    Wave 3C leftover. Do not start without a fresh Architect ack.

---

- id: TASK-795
  title: Generate and adopt typed Supabase Database client
  created_at: 2026-08-15
  created_by: agent
  priority: medium
  status: not-started
  assignee: owner
  related_files:
    - src/lib/supabase/client.ts
    - src/lib/supabase/server.ts
    - src/docs/SUPABASE_SCHEMA.md
  description: |
    Report 12: generate Supabase `Database` types and thread them through
    the client. Large typed-client churn — not an implementable Wave 3C slice.
  acceptance_criteria:
    - Generated types live in-repo and regenerate from a documented command.
    - Browser + server clients are typed; no silent `any` widening.
    - Typecheck + targeted API tests pass.
  notes: |
    Wave 3C leftover. Do not start without owner ack.

---

- id: TASK-796
  title: Server-render /rules MDX + Codex detail generateMetadata
  created_at: 2026-08-15
  created_by: agent
  priority: medium
  status: not-started
  assignee: owner
  related_files:
    - src/app/(main)/rules/page.tsx
    - src/app/(main)/codex/page.tsx
    - src/lib/constants/copy/rules-copy.ts
  description: |
    Report 07 P1-2 / win #8: replace the Google Doc iframe with a first-party
    MDX rulebook and add Codex detail routes with `generateMetadata` per slug.
    TASK-793 only added crawlable intro prose — the iframe remains until a
    rulebook source exists in-repo.
  acceptance_criteria:
    - Owner supplies or approves the rulebook source before the iframe is removed.
    - `/rules` is SSR/MDX with working in-page nav.
    - Codex detail URLs have unique titles/descriptions.
  notes: |
    Content strategy. Do not invent a rulebook or delete the embed without ack.

---

- id: TASK-797
  title: noUncheckedIndexedAccess burn-down (~163 errors)
  created_at: 2026-08-15
  created_by: agent
  priority: low
  status: not-started
  assignee: owner
  related_files:
    - tsconfig.strictest.json
    - tsconfig.json
    - package.json
  description: |
    Report 11/12: enable `noUncheckedIndexedAccess` after burning down the
    ~163 errors already visible via `npm run typecheck:strictest`.
  acceptance_criteria:
    - `typecheck:strictest` is clean, then the flag moves into the main tsconfig.
    - No behavior changes; fixes are type-narrowing only.
  notes: |
    Wave 3C leftover. Tooling is ready. Do not start without owner ack.

---

- id: TASK-798
  title: Extract remaining Legacy creator symbols into shared/
  created_at: 2026-08-15
  created_by: agent
  priority: medium
  status: not-started
  assignee: owner
  related_files:
    - src/components/character-creator/AbilityPickButton.tsx
    - src/components/character-creator/MixedSpeciesModal.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/components/character-creator/TraitSection.tsx
    - src/components/character-creator/creator-portrait-upload.tsx
    - scripts/shared-ui-allowlist.json
  description: |
    Report 02 Steps 1/3+: move AbilityPickButton, MixedSpeciesModal,
    PathHelpCard, TraitSection, and creator-portrait-upload into `shared/`
    (allowlist + ADR). Do **not** delete `/characters/new/advanced` — REALMS
    phases Legacy into L3 later.
  acceptance_criteria:
    - Each move is a shared-first addition with allowlist + FEATURE_INDEX.
    - Legacy and Guided import the shared module; no parallel copies.
    - The Legacy route still exists.
  notes: |
    Wave 3C leftover. Currency + appearance-age already extracted (TASK-791).
    Guided skills UI parity already landed (TASK-790).

---

- id: TASK-799
  title: Remaining list/modal duplication clusters
  created_at: 2026-08-15
  created_by: agent
  priority: low
  status: not-started
  assignee: owner
  related_files:
    - src/components/shared/official-entity-list.tsx
    - src/components/shared/delete-confirm-modal.tsx
    - src/components/shared/list-header.tsx
    - src/components/shared/value-stepper.tsx
  description: |
    Reports 10/08/04 leftover clusters after path-filter (TASK-751–753) and
    stepper/header internal dedup (TASK-792): OfficialEntityList internals,
    confirm-modal / icon-toggle families, admin and sheet copies.
  acceptance_criteria:
    - Inventory the remaining forks against FEATURE_INDEX before any move.
    - Delete the weaker copy; do not add a third wrapper.
    - Architect ack if a new shared file is required.
  notes: |
    Wave 3C leftover. Do not start without owner ack.

---

- id: TASK-326
  title: Tighten Supabase security advisors (bucket listing + leaked-password protection)
  priority: medium
  status: partial
  created_at: 2026-06-12
  created_by: agent
  assignee: human
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  description: |
    Storage SELECT policies scoped; enable HIBP leaked-password check in Supabase Auth.
  acceptance_criteria:
    - Storage SELECT policies scoped so buckets aren't broadly listable (read-by-key still works).
    - Leaked-password protection enabled in Supabase Auth.
    - SQL/migration documented; advisors re-checked.
  completed_work: |
    - Storage SELECT hardening applied live (MCP).
  remaining_work: |
    - Enable HIBP in Supabase Auth (DEV-001 / TASK-353). Re-checked 2026-08-13 via
      Supabase security advisors: `auth_leaked_password_protection` still WARN.
  follow_up_tasks:
    - TASK-353
  notes: |
    2026-06-13. Human-only remainder. Moved off ACTIVE 2026-08-13 (/debt). See DEVELOPER_TASK_QUEUE DEV-001.

---

- id: TASK-500
  title: Deferred — enhanced-item images via Realms Image Library
  created_at: 2026-07-16
  created_by: agent
  priority: low
  status: not-started
  assignee: owner
  parent_task: TASK-491
  related_files:
    - src/app/(main)/admin/public-library/AdminPublicEnhancedItemsTab.tsx
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  description: |
    Owner: enhanced items get images eventually, not now. When scheduled, add category tag and/or
    picker filter + image_id on enhanced-item rows using the same bank patterns as TASK-491+.
  acceptance_criteria:
    - Not in MVP Image Library ship; reopen when owner prioritizes.
    - Reuses RealmsImagePicker + bank — no parallel media system.
  notes: |
    Placeholder so the yes eventually decision is not rediscovered. Leave not-started until asked.
    Moved off ACTIVE 2026-08-13 (/debt).

---

- id: TASK-423
  title: Guided loadout path content — seed flat recommendations for remaining paths
  created_at: 2026-07-05
  created_by: agent
  priority: medium
  status: partial
  assignee: owner
  completed_work: |
    - Kit flatten applied 2026-07-15 (TASK-442): Berserker level1_loadouts NULL; weapons/armor/gear
      already in level1_armaments / level1_equipment.
  remaining_work: |
    - Author flat level1_armaments / level1_equipment (and armorStep / sharedEquipment as needed)
      for the other 11 archetype paths so guided L1 has path picks.
    - Optional: supersede sql/guided-berserker-loadout-fixes-proposed.sql (kit-era; no longer needed).
  description: |
    Owner content work: seed flat weapon/armor/gear recommendations for remaining paths
    (no quick kits). Kit column cleanup shipped with TASK-442.
  related_files:
    - sql/guided-remove-loadout-kits-proposed.sql
    - src/docs/SUPABASE_SCHEMA.md
  acceptance_criteria:
    - Live DB has no selectable kit arrays in level1_loadouts. (done)
    - Remaining martial/power paths that should offer L1 gear have flat recommendations authored.
    - DEV-V-013-T004 passes without Quick kits UI.
  notes: |
    Codex writes require owner approval. Frontend kit UI removed in TASK-442.

---

- id: TASK-353
  title: Enable Supabase leaked-password protection (HIBP)
  priority: medium
  status: not-started
  created_at: 2026-06-13
  parent_task: TASK-326
  assignee: human
  notes: "**Human-only — AI skip.** DEVELOPER_TASK_QUEUE DEV-001."

---

- id: TASK-409
  title: Standalone creator Phase 1b — CreatorPageShell + power/item god-file split (TASK-380/381)
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Execute engineering prerequisites before large guided power-creator UI: TASK-380 CreatorPageShell for shared auth/load/save; TASK-381 phase 1 extracting power-creator and item-creator page shells + section islands with parity tests.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/components/creator/
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - CreatorPageShell adopted by power-creator and item-creator routes (minimum).
    - Power-creator page decomposed into shell + section components without save/load/cost regressions.
    - Parity validation suite indexed in DEVELOPER_TASK_QUEUE / BUILD_VALIDATION.
    - npm run build passes.
  notes: |
    Blocks TASK-410–412. Species/creature creators out of scope for this phase.
    **Blocked until TASK-414 done** (2026-07-01 owner gate).
    2026-07-17: Engineering AC largely met via TASK-380 + TASK-381 (power/item shells +
    DEV-V-024). Keep blocked only for the TASK-414 product gate before guided power work.
    2026-08-14: Owner deferred power-creator layers (TASK-410–414) awhile longer. TASK-408
    advanced tooltips shipped independently.

---

- id: TASK-410
  title: Power creator guided — entry chooser + route shell
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Add /power-creator entry chooser (Guided vs Advanced) and /power-creator/guided route shell reusing guided-creator chrome (GuidedStepLayout, footer, preview slot). Advanced remains current builder at /power-creator/advanced or equivalent. No wizard steps yet — navigation scaffold only.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/characters/new/page.tsx
    - src/components/guided-creator/
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - /power-creator shows Guided vs Advanced choice before entering either flow.
    - /power-creator/guided renders step shell with placeholder step 1.
    - Advanced route loads existing power creator unchanged.
    - Mobile fullScreenOnMobile patterns where modals added.
    - npm run build passes.
  notes: |
    Mirror characters/new chooser pattern. Owner feedback required on labels (Guided/Advanced placeholders).
    **Blocked until TASK-414 done.**
    2026-08-14: Owner — defer power-creator layer work awhile longer. Do not implement.

---

- id: TASK-411
  title: Power creator guided — audience, innate, and category steps
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Implement guided power wizard steps 1–3 (REALMS §5.11): (1) audience — pick saved character OR generic Power vs Powered-Martial + level; (2) innate intent toggle with InfoTippy and constraint preview; (3) power category cards mapped to codex part categories (Offense, Defense, Utility, Control, etc.). Store in guided-power-creator-store or equivalent; preserve handoff shape for advanced editor.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/components/guided-creator/
    - public/tooltip-text.tsx
    - src/docs/GAME_RULES.md
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
  acceptance_criteria:
    - Character picker loads user characters when logged in; guest can pick archetype + level.
    - Innate threshold shown from GAME_RULES (L1: 8 Power, 6 Powered-Martial).
    - Category step uses GuidedChoiceCard; max one primary category per screen.
    - InfoTippy on archetype, innate, and category decisions.
    - Owner review checkpoint before TASK-412.
  notes: |
    Depends on TASK-408 (tooltips — done 2026-08-14) and TASK-410 (shell). Iterative owner feedback expected.
    **Blocked until TASK-414 done** — implement only from locked spec, not §5.11 draft.
    2026-08-14: Owner — defer power-creator layer work awhile longer. Do not implement.

---

- id: TASK-412
  title: Power creator guided — delivery, damage, templates, save, advanced handoff
  priority: high
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Complete guided power wizard steps 4–7: delivery (melee/ranged/area), damage yes/no + presets, template pick from official_powers (curated per category — e.g. Fireball, Icebolt, Healing Incantation, Protective Ward, Charm Creature, Fog Cloud) or start blank, name/description + live preview, save to My Library or open Advanced with state handoff. Reuse existing calculators and useCreatorSave.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/hooks/use-official-library.ts
    - src/lib/calculators/
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - At least 4 official_powers loadable as templates by category.
    - Innate filter hides/disables templates above threshold when innate selected.
    - Save works for logged-in users; guest login prompt at save.
    - Customize in Advanced opens advanced builder with guided state applied.
    - New user can complete flow without seeing part option levels.
    - npm run build passes.
  notes: |
    Templates from existing official_powers table (31 rows); no new DB table for MVP. Owner curates template set.
    **Blocked until TASK-414 done.**
    2026-08-14: Owner — defer power-creator layer work awhile longer. Do not implement.

---

- id: TASK-413
  title: Landing secondary CTAs → power creator guided entry
  priority: medium
  status: blocked
  created_at: 2026-07-01
  created_by: owner
  description: |
    Update SecondaryDiscoverySection power CTA to /power-creator (chooser) or /power-creator/guided once TASK-410 ships. Item CTA waits for item guided. Aligns with REALMS §5.11 conversion fix.
  related_files:
    - src/components/landing/secondary-discovery-section.tsx
    - src/lib/constants/site-copy.ts
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Create a Custom Power lands on guided entry or chooser, not raw L3 advanced scroll.
    - Item CTA unchanged or clearly marked until item guided exists.
    - npm run build passes.
  notes: |
    Blocked until TASK-410. Item guided follow-up task after TASK-412 validates power pattern.
    **Blocked until TASK-414 done** (do not change landing CTA until guided entry exists).
    2026-08-14: Owner — defer power-creator layer work awhile longer. Do not implement.

---

- id: TASK-414
  title: Power creator Layer 1 — owner spec lock (design before build)
  priority: high
  status: not-started
  assignee: owner
  created_at: 2026-07-01
  created_by: owner
  description: |
    Owner completes POWER_CREATOR_LAYER1_SPEC.md with exact step order, screen copy, template list, character/innate rules, and L1/L2/L3 boundaries. No agent implementation of guided power creator (TASK-410–413) until this task is marked done with owner approval.
  related_files:
    - src/docs/human/POWER_CREATOR_LAYER1_SPEC.md
    - src/docs/human/POWER_CREATOR_TOOLTIPS_DRAFT.md
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/docs/GAME_RULES.md
  acceptance_criteria:
    - Every wizard step documented per Appendix A template (purpose, L1 UI, completion rules, tooltips).
    - Open questions in spec resolved or explicitly deferred with owner decision.
    - Template powers chosen from official_powers with IDs and category mapping.
    - Character vs guest flow, innate filtering, and advanced handoff behavior specified.
    - Owner marks spec status APPROVED at top of POWER_CREATOR_LAYER1_SPEC.md.
    - REALMS §5.11 updated to reference locked spec (agent may assist after approval).
  notes: |
    Human-owned design task. Agents may help draft or facilitate review but must not implement TASK-410+ until done.
    2026-07-01: Owner — no perfect L1 vision yet; spec must be exact before build.
    2026-08-14: Owner — defer this and TASK-410–413 awhile longer. TASK-408 advanced tooltips shipped without waiting on this spec.

