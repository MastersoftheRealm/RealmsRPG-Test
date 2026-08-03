# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-672
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-654, TASK-641, TASK-640, TASK-630, …)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 16 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** TASK-650 done (campaigns RLS SELECT consolidation applied). TASK-649 done (Supabase least-privilege Phase 2 applied). TASK-657 done (pre-commit hooks). TASK-655/656 done (typecheck + zero-warning lint CI gates) — pending-qa.

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

