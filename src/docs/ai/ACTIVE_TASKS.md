# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-696
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-691, TASK-675, TASK-690…686, …)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 6 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **TASK-694–695** filed (preview summary polish; layer-nav hatch chrome) — corrects TASK-640/686 UX misreads. TASK-693 done pending-qa (DEV-V-013 T079). TASK-686–690 pending-qa (DEV-V-050; preview AC partly superseded by 694). **TASK-691** + **TASK-675** done pending-qa. **TASK-692** optional. TASK-685/684 pending-qa.

---

- id: TASK-694
  title: Your Character preview — path once + gated ability chips
  created_at: 2026-08-10
  created_by: owner
  priority: high
  status: in-progress
  related_tasks:
    - TASK-686
  related_files:
    - src/components/guided-creator/character-preview-panel.tsx
    - src/lib/guided-creator/preview-ability-summary.ts
    - src/lib/guided-creator/preview-ability-summary.test.ts
  description: |
    Correct CharacterPreviewPanel / strip after TASK-686 overshot owner intent. Archetype path
    (or custom path type) must appear once — prefer the subtitle under the character name
    (“Your Character”), not a duplicate DescriptorChip. Custom builds show Power / Martial /
    Powered-Martial type there (not a fake path name). Ability DescriptorChips stay hidden
    until the player has selected abilities or completed the Abilities step; when shown, only
    archetype abilities (`pow_abil` / `mart_abil`) use the alternate highlight color — other
    ability chips stay default.
  acceptance_criteria:
    - Path-based draft: path name once under the name/subtitle; no second path DescriptorChip in the strip.
    - Custom archetype: path type label once under the name; no duplicate type chip; never show a codex path name when forging custom.
    - Ability chips absent before ability selection / ability-step completion; appear after that gate.
    - Only archetype ability chip(s) use the other (e.g. primary / power-martial) highlight; remaining shown abilities are default descriptor styling.
    - Panel variant stays consistent with strip rules (no double path identity).
    - Update/supersede DEV-V-050-T002 preview expectations; unit tests for gating + highlight; build/typecheck/lint pass; FEATURE_INDEX if preview behavior is indexed.
  notes: |
    Owner feedback 2026-08-10. TASK-686 implemented always-on six primary chips + archetype chip,
    which duplicated the subtitle and showed zeros before Abilities. Prefer subtitle identity over
    chip identity. Do not re-litigate Energy/equipment/armor from TASK-687–689.

---

- id: TASK-695
  title: GuidedLayerNav hatch buttons — not Continue-primary blue
  created_at: 2026-08-10
  created_by: owner
  priority: high
  status: not-started
  related_tasks:
    - TASK-640
    - TASK-641
  related_files:
    - src/components/shared/guided-choice/guided-layer-nav.tsx
    - src/components/shared/guided-choice/guided-nav-button-styles.ts
    - src/components/guided-creator/steps/species-step.tsx
  description: |
    Species L2 **Create Species** (and other GuidedLayerNav actions in the same location /
    similar function) must not use primary blue — it currently reads as the sticky Continue
    CTA rather than an alternate L3/hatch option. Restyle layer-nav expand (and peers with the
    same role) to a consistent non-primary chrome; keep footer Continue as the sole primary
    progress button.
  acceptance_criteria:
    - Create Species is not `variant="primary"` / Continue-blue; visually distinct from GuidedStepFooter Continue.
    - Other GuidedLayerNav buttons with the same role (deeper/hatch / lateral options in that nav row) share the new consistent style.
    - Collapse / shallower buttons remain outline and still distinct from Continue.
    - Footer Back/Continue chrome unchanged (Continue stays primary).
    - Mobile touch targets ≥44px preserved; contrast OK; DEV-V-013 T077–T078 (and any layer-nav copy) updated; build/typecheck/lint pass.
  notes: |
    Owner feedback 2026-08-10. TASK-640 intentionally matched layer-nav expand to Continue primary
    so deeper didn’t feel like a downgrade — that made Create Species feel like Continue. Correction:
    layer-nav family consistent with itself, not with footer Continue. Prefer extending
    `guided-nav-button-styles` / GuidedLayerNav props over one-off Species styling.

---

- id: TASK-692
  title: Guided L3 powers/techniques — reuse PowerTechniqueFilters compact
  created_at: 2026-08-10
  created_by: agent
  priority: low
  status: not-started
  parent_task: TASK-675
  related_tasks:
    - TASK-675
    - TASK-691
    - TASK-684
  related_files:
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/shared/guided-choice/guided-inline-catalog-list.tsx
    - src/components/shared/filters/power-technique-filters.tsx
    - src/lib/library/power-technique-filters.ts
    - src/lib/library-selectable-builders.ts
    - src/lib/guided-creator/powers-techniques-l2.ts
  description: |
    After TASK-675 shipped compact PowerTechniqueFilters on sheet/advanced USM, guided L3
    still uses innate-scope SelectFilter only. Optionally wire the same compact panel into
    GuidedInlineCatalogList filters for powers/techniques while preserving guided budget /
    innate / max-EN orchestration (do not replace those gates with Library character filter alone).
  acceptance_criteria:
    - Guided L3 P/T filter chrome reuses PowerTechniqueFilters variant="compact" (no nested FilterSection fork).
    - Apply path uses applyPowerTechniqueFilters + powerTechniqueFilter on selectables (or equivalent rows from buildPowerTechniqueFilterableRow).
    - Innate scope / threshold / theoretical max-EN / TP budget gates remain correct for guided draft context.
    - Mobile + a11y: filter panel readable at ~360px; labels intact; targeted tests + build/typecheck pass.
    - FEATURE_INDEX / BUILD_VALIDATION updated if user-facing filter behavior changes.
  notes: |
    Optional until prioritized. Filed from TASK-691/675 cleanup. Keep SelectFilter innate-scope only if compact panel cannot express guided-only scope without a fork.

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
    2026-08-03 merge: remote also used TASK-642 for power AoE — that work is archived as TASK-672.

---
