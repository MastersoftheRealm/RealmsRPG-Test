# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-670
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-654, TASK-641, TASK-640, TASK-630, …)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 18 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** TASK-657 done (pre-commit hooks). TASK-655/656 done (typecheck + zero-warning lint CI gates) — pending-qa. TASK-646 done (Next.js 16.2.12). TASK-665 done (utils hygiene). TASK-644 done (armor DR unify) — pending-qa. TASK-653 done (character ID oracle). TASK-642 partial (signup QA only). TASK-647/TASK-651 done. TASK-643 pending-qa. TASK-641 pending-qa DEV-V-013 T078. TASK-640 pending-qa T075–T077.

---

- id: TASK-326
  title: Tighten Supabase security advisors (bucket listing + leaked-password protection)
  priority: medium
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Storage SELECT policies scoped; enable HIBP leaked-password check in Supabase Auth.
  related_files:
    - src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md
  acceptance_criteria:
    - Storage SELECT policies scoped so buckets aren't broadly listable (read-by-key still works).
    - Leaked-password protection enabled in Supabase Auth.
    - SQL/migration documented; advisors re-checked.
  completed_work: |
    - Storage SELECT hardening applied live (MCP).
  remaining_work: |
    - Enable HIBP in Supabase Auth (DEV-001).
  follow_up_tasks:
    - TASK-353
  notes: "2026-06-13. See DEVELOPER_TASK_QUEUE."

---

- id: TASK-500
  title: Deferred — enhanced-item images via Realms Image Library
  created_at: 2026-07-16
  created_by: agent
  priority: low
  status: not-started
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

---

- id: TASK-642
  title: Fix profile email spoofing in createUserProfileAction
  priority: critical
  status: partial
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/app/(auth)/actions.ts
  description: |
    Audit finding H1: `createUserProfileAction` accepts a client-supplied `email` field and writes it
    to `user_profiles`, letting a malicious client spoof another email address. Always derive email
    server-side from the authenticated session user, never from request input.
  acceptance_criteria:
    - createUserProfileAction ignores any client-supplied `email` and sets it from `sessionUser.email` only.
    - Signup/profile-creation flow still works end-to-end (manual QA: sign up, profile shows correct email).
    - npm run build passes.
  completed_work: |
    - createUserProfileAction now derives email only from sessionUser.email (client email ignored).
    - npm run build passes (TASK-644 cleared shared build blocker).
  remaining_work: |
    - Manual signup QA (profile shows session email) — see DEV-008.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §4.2 H1.

---

- id: TASK-645
  title: Durable rate limiting for invite join, admin mutations, and uploads
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/lib/rate-limit.ts
    - src/app/(main)/campaigns/actions.ts
    - src/app/api/admin/role-policies/route.ts
    - src/app/api/admin/users/update-role/route.ts
  description: |
    Audit H2/H3/M4: the current limiter is in-memory per-serverless-instance so it doesn't meaningfully
    throttle anything on Vercel; `joinCampaignAction` has no throttle at all despite a service-role
    lookup; several admin mutation routes don't apply a limiter. Add a Redis (Upstash) or Vercel
    KV-backed limiter behind the existing `rateLimit()`-shaped API — env-flagged, safe no-op fallback
    when unconfigured — and apply it to joinCampaignAction plus admin mutation routes missing one.
  acceptance_criteria:
    - Shared limiter is consistent across serverless instances when Redis/KV env vars are set, and
      degrades gracefully (no crash) when unset.
    - joinCampaignAction is throttled.
    - Identified admin mutation routes call standardLimiter/strictLimiter consistently.
    - npm run build passes.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §4.2 H2/H3/M4.
    Pause trigger — adds a new external vendor dependency (Upstash/Vercel KV) + env vars; confirm
    with owner before implementing per realms-tasks model-escalation rule. Provisioning is human-owned
    — see TASK-669 in WAITING_TASKS.

---

- id: TASK-648
  title: Standardize API error responses — stop leaking raw DB/Supabase errors
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/app/api/codex/route.ts
    - src/app/api/images/route.ts
    - src/app/api/images/[id]/route.ts
    - src/app/api/official/[type]/route.ts
  description: |
    Audit M2 + low note: several API routes (images, official, crafting, encounters, uploads) return
    raw Supabase/Postgres error objects/messages to the client, and error response shapes are
    inconsistent across routes (`{error}` vs `{success}` vs `{ok}` vs raw 204). Log the raw error
    server-side and return a generic `{ error: string }` shape; document the convention.
  acceptance_criteria:
    - Audited routes no longer return raw DB error text/details to clients.
    - Documented response-shape convention exists (API README note or ARCHITECTURE_CONSTITUTION).
    - npm run build + lint pass.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §4.2 M2, §4.4.
    TASK-647/651 handoff (2026-08-01): image GET 500 paths in images/route.ts still return raw
    Supabase error.message (~L65, ~L90); codex production safeHint may still leak categorized hints
    without ?debug=1 — tighten if in scope. Admin-only image routes (replace, usage) correctly
    remain service-role. Optional: widen fetchRealmsImageById client type (GET [id] uses narrow cast).

---

- id: TASK-649
  title: Supabase least-privilege + hygiene hardening (live DB)
  priority: high
  status: partial
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - sql/task-649-anon-least-privilege-proposed.sql
    - sql/task-649-drop-codex-backup-tables-proposed.sql
    - sql/task-649-codex-art-storage-select-hardening-proposed.sql
    - sql/task-649-feat-tag-function-search-path-proposed.sql
    - sql/task-649-index-hygiene-proposed.sql
    - sql/README.md
    - src/docs/SUPABASE_SCHEMA.md
  description: |
    Audit D1/D2/D4/D5/D7/D8: `anon` role has full CRUD+TRUNCATE grants on nearly every public table
    including admin_role_audit/role_policies (RLS blocks today but violates least privilege); 4 stale
    backup tables (codex_archetypes_backup_*, codex_archetype_levels_backup_*) sit in production with
    RLS on but no policies/PK; the codex-art storage bucket allows public listing; 4 functions
    (normalize_feat_tags, map_feat_tag_phase*) have mutable search_path; ~20 unused indexes and 2
    unindexed FKs (realms_images.created_by, vtt_actions.token_id) were flagged. Draft SQL in sql/,
    verify against get_advisors, then apply via Supabase MCP.
  acceptance_criteria:
    - anon grants revoked down to least privilege; RLS + authenticated role still work (re-test key flows).
    - Backup tables dropped or moved off the public schema.
    - codex-art bucket SELECT policy no longer allows public listing.
    - Affected functions have explicit search_path set.
    - Index changes only made where usage data supports it (no blind drops).
    - SUPABASE_SCHEMA.md updated; advisors re-checked post-apply.
  completed_work: |
    Phase 1 (2026-08-01): Live audit via get_advisors + list_tables + execute_sql on
    RealmsRPG-Test (lbqhiwudvifmkjtkccdg). Confirmed D1–D5/D7/D8 findings; drafted five idempotent
    SQL files in sql/ (anon least-privilege, drop backup tables, codex-art storage SELECT hardening,
    feat-tag search_path, FK indexes + unused-index review). No live DB apply; no app code changes.
  remaining_work: |
    Phase 2 (owner approval): Apply SQL in order — (1) drop backup tables, (2) anon grants,
    (3) codex-art storage policy, (4) function search_path, (5) FK indexes (Part A only unless
    owner approves Part B drops). Re-run get_advisors; smoke-test codex read, image URLs, auth flows.
    Update SUPABASE_SCHEMA.md (remove backup tables; document grant posture). Optional: revoke anon
    EXECUTE on internal trigger functions (out of scope unless owner requests).
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D1/D2/D4/D5/D7/D8.
    Live DB mutation — draft SQL first, no blind apply. Treat with the same audit→propose→apply care
    as realms-codex-data.mdc even though this isn't codex reference data.

---

- id: TASK-650
  title: Consolidate permissive RLS SELECT policies on campaigns
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - sql/README.md
    - src/docs/SUPABASE_SCHEMA.md
  description: |
    Audit D6: campaigns has multiple permissive SELECT RLS policies stacked (a consolidation migration
    exists in history but the advisor still flags it). Investigate the live policy set, consolidate to
    one policy per role/action, and confirm the advisor clears.
  acceptance_criteria:
    - get_advisors no longer flags multiple permissive policies on campaigns.
    - Existing access patterns (owner, public visibility, campaign participant) pass manual QA.
    - SQL documented in sql/.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §5.2 D6.

---

- id: TASK-652
  title: Admin API hardening — explicit validation allowlists + consolidate admin-check
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/app/api/admin/users/update-role/route.ts
    - src/app/api/admin/role-policies/route.ts
    - src/lib/admin.ts
    - src/app/api/admin/check/route.ts
  description: |
    Audit M5 + low note: some admin route bodies use permissive Zod passthrough() schemas instead of
    explicit field allowlists, and admin-check logic is duplicated in places instead of always going
    through @/lib/admin. Tighten schemas to explicit/strict field lists and route remaining ad hoc
    admin checks through the shared helper.
  acceptance_criteria:
    - Identified admin routes use explicit Zod schemas (no passthrough()).
    - No remaining duplicate isAdmin-style checks outside @/lib/admin.
    - npm run build + test pass.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §4.2 M5, §4.4.

---

- id: TASK-658
  title: Add API route auth/IDOR tests for remaining routes
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/app/api/characters/route.ts
    - src/app/api/characters/[id]/route.ts
  description: |
    Audit §3/§10 item 20: only ~1 of 29 API routes has test coverage (~3%). Add vitest coverage for
    auth/IDOR behavior (unauthenticated rejected, cross-user access rejected, owner access allowed) on
    the highest-risk remaining routes (characters, campaigns, admin) beyond the existing characters
    API smoke suite.
  acceptance_criteria:
    - New vitest files cover auth/IDOR for at least characters, campaigns, and one admin route.
    - npm run test passes.
    - Coverage gap for any intentionally-deferred routes noted in DEVELOPER_TASK_QUEUE.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §3/§10.

---

- id: TASK-659
  title: Wire a creator Playwright audit suite into default CI
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - playwright.creator-audit.config.ts
    - playwright.shell-creators-audit.config.ts
    - .github/workflows/ui-verify.yml
  description: |
    Audit §3 action item 3: 8+ Playwright audit configs exist (creator, shell-creators, loadout, flaw,
    feat-cards, etc.) but none run in default CI — only marketing/styleguide screenshots do. Wire at
    least one creator flow audit (guided loadout or shell-creators) into the default ui-verify workflow.
  acceptance_criteria:
    - Chosen suite runs on PRs via CI; failures block merge.
    - Runtime budget documented.
    - Other audit configs remain available for manual/optional runs.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §3.

---

- id: TASK-660
  title: Dedupe deriveAbilityRequirementFromProperties + fix unproficientBonus SSOT violation
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/lib/data-enrichment/find-in-library.ts
    - src/lib/guided-creator/equipment-eligibility.ts
    - src/lib/game/formulas.ts
  description: |
    Audit B3/B4: deriveAbilityRequirementFromProperties is implemented twice (find-in-library.ts and
    equipment-eligibility.ts) and can drift; unproficientBonus is duplicated inline in formulas.ts
    instead of referencing the single source constant. Consolidate both into one shared implementation.
  acceptance_criteria:
    - Single exported deriveAbilityRequirementFromProperties used by both call sites.
    - unproficientBonus computed from one place only.
    - Targeted unit tests updated; npm run test passes.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §6 B3/B4.

---

- id: TASK-661
  title: Replace silent/empty catches with logged failures
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/lib/guest-encounter-migration.ts
    - src/app/(main)/encounters/[id]/_components/combat/use-combat-encounter-view.ts
    - src/components/shared/add-combatant-modal.tsx
    - src/app/api/admin/check/route.ts
    - src/lib/guided-creator/power-technique-display.ts
    - src/lib/detail-option/combat-builder.ts
  description: |
    Audit B5 + §8 hygiene sweep: 28 empty/comment-only catch blocks exist, including cost-calculation
    paths that silently return 0/undefined on failure (masking broken parts) and encounter/migration
    code that swallows real errors. Replace with server-side logging (and, where user-facing, a visible
    error state) instead of silent failure.
  acceptance_criteria:
    - Identified catches log the error instead of swallowing it.
    - Cost-path failures on power/technique display are visible in logs/dev tools, not silently defaulted.
    - npm run build + test pass.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §6 B5, §8.

---

- id: TASK-662
  title: Invert calculators/game → library/guided-creator dependency direction
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/lib/calculators/power-calc.ts
    - src/lib/game/path-validation.ts
    - src/lib/game/archetype-edit.ts
  description: |
    Audit B6: src/lib/calculators and src/lib/game (meant to be neutral domain logic) import from
    src/lib/library and src/lib/guided-creator, inverting the intended dependency direction. Extract
    the shared neutral pieces into a lib/rules/-style layer (or push dependent logic up into the
    calling layer) so calculators/game have no upward imports.
  acceptance_criteria:
    - src/lib/calculators and src/lib/game no longer import from src/lib/library or src/lib/guided-creator.
    - Behavior unchanged (existing unit tests + build pass).
    - Dependency direction documented (ARCHITECTURE_CONSTITUTION or ADR).
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §6 B6.
    Pause trigger — cross-cutting refactor introducing a new shared lib boundary; flag to owner before
    implementing per realms-tasks model-escalation rule.

---

- id: TASK-663
  title: Normalize character/archetype schema drift
  priority: high
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/lib/data-enrichment/clean-for-save.ts
    - src/lib/game/formulas.ts
    - src/lib/game/archetype-edit.ts
  description: |
    Audit B7/B8: character data carries multiple dual/legacy field names simultaneously
    (pow_prof/powerProficiency, defenseVals/defenseSkills, armor/armorValue/damageReduction), and
    archetype "type" is represented inconsistently as 'mixed' in formulas.ts vs 'powered-martial' in
    archetype-edit.ts. Normalize to one field name per concept and one archetype-type vocabulary at the
    save/load boundary, with back-compat for existing saved characters if needed.
  acceptance_criteria:
    - One canonical field name per concept going forward.
    - Archetype type vocabulary consistent across formulas.ts and archetype-edit.ts.
    - Existing saved characters still load/calculate correctly (migration or dual-read fallback).
    - npm run test + build pass.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §6 B7/B8.

---

- id: TASK-664
  title: Reduce `as unknown as` type-debt casts
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/lib/calculators
    - src/lib/game
    - src/lib/data-enrichment
  description: |
    Audit §6/§8: 86 `as unknown as` casts across 39 files (concentrated in calculators, creature
    transformers, sheet mutations) indicate type-model drift being papered over. Work through the
    highest-concentration files first, replacing casts with correct types or narrow type guards.
  acceptance_criteria:
    - Measurable reduction in `as unknown as` count (target: eliminate in the top 10 highest-concentration files).
    - No behavior change.
    - npm run build (and typecheck once TASK-655 lands) pass.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §6/§8.

---

- id: TASK-666
  title: Split remaining 600+ line files into hooks + section components
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/app/(main)/encounters/[id]/_components/combat/use-combat-encounter-view.ts
    - src/app/(main)/my-account/page.tsx
    - src/app/(main)/campaigns/[id]/page.tsx
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/crafting/[id]/_components/use-crafting-tool-page.ts
    - src/components/character-sheet/edit-species-modal.tsx
    - src/app/(main)/admin/core-rules/core-rules-category-editor.tsx
  description: |
    Audit §7/§10 item 14: 7 files remain at 600-767 lines. Following the pattern already used for
    TASK-618/TASK-619, extract state/derived-data into hooks and split UI into section components,
    keeping each file under ~500 lines.
  acceptance_criteria:
    - Each listed file is under (or materially closer to) ~500 lines.
    - No behavior regression (build + targeted tests + manual smoke pass per page).
    - FEATURE_INDEX updated if new modules are added.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §7/§10.

---

- id: TASK-667
  title: Reduce mega prop bags — LibrarySectionProps + CharacterSheetModals
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/components/character-sheet/library-section-props.ts
    - src/app/(main)/characters/[id]/CharacterSheetModals.tsx
  description: |
    Audit §7/§10 item 13: LibrarySectionProps has 100+ fields and CharacterSheetModals still threads
    ~30 props instead of reading from the existing character-sheet context. Finish adopting the sheet
    context so both shrink to only what genuinely can't come from context.
  acceptance_criteria:
    - LibrarySectionProps field count meaningfully reduced (fields sourced from context removed).
    - CharacterSheetModals reads shared state from character-sheet-context instead of prop drilling.
    - npm run build passes; manual QA of sheet modals (recovery, level-up, feats, add-library-item).
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md §7/§10.

---

- id: TASK-668
  title: Reconcile project docs with CODEBASE_AUDIT_2026-08-01 findings
  priority: medium
  status: not-started
  created_at: 2026-08-01
  created_by: agent
  related_files:
    - src/docs/ai/archive/CODEBASE_AUDIT_2026-08-01.md
    - src/docs/ai/ARCHITECTURE_CONSTITUTION.md
    - src/docs/ai/FEATURE_INDEX.md
  description: |
    This audit was run without access to project docs, so some findings may already be tracked
    elsewhere under different names, and some existing docs are stale relative to what the audit found
    in live code. Cross-check each finding against FEATURE_INDEX/ARCHITECTURE_CONSTITUTION/
    BUILD_VALIDATION for accuracy and correct any doc claims the audit disproved (e.g. test-coverage
    claims, "single canonical implementation" claims where duplication was found).
  acceptance_criteria:
    - Doc claims contradicted by the audit are corrected or annotated as known debt with a linked TASK-###.
    - No duplicate tasks filed for items already tracked elsewhere (e.g. TASK-326/353 leaked-password
      protection — already covers audit D3, not re-filed here).
    - npm run tasks:validate-docs passes.
  notes: |
    Audit ref: archive/CODEBASE_AUDIT_2026-08-01.md (full report). Companion to TASK-642–667.

---

