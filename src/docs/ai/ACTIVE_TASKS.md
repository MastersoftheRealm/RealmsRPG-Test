# Active AI Tasks

**Hot path only** — agent-eligible open work: `not-started` | `in-progress` | `partial`.
Skip `blocked` and human `assignee:` (those live in [`WAITING_TASKS.md`](WAITING_TASKS.md)).
Do **not** read the done archive at session start.

**Next task ID:** TASK-710
**Waiting / blocked / human:** [WAITING_TASKS.md](WAITING_TASKS.md)
**Done archive:** [archive/TASK_QUEUE_DONE.md](archive/TASK_QUEUE_DONE.md) · snapshot [archive/TASK_QUEUE_DONE_2026-07-15.md](archive/TASK_QUEUE_DONE_2026-07-15.md)
**Process:** [AI_TASK_QUEUE.md](AI_TASK_QUEUE.md) · Template: [AI_REQUEST_TEMPLATE.md](AI_REQUEST_TEMPLATE.md)
**Pending owner QA:** [DEVELOPER_TASK_QUEUE.md](DEVELOPER_TASK_QUEUE.md) → Pending owner QA (recent: TASK-708, TASK-701, TASK-700, TASK-698…)

**Agent rules:** Prefer highest `priority` among `not-started` / continue `partial` / `in-progress`. Human-only → `DEVELOPER_TASK_QUEUE.md`. Done summaries live in the archive — do not re-list them here.

**Counts:** 11 agent-eligible · waiting/blocked in WAITING_TASKS · done in archive.

**Hot notes:** **TASK-706–709** filed (resource trackers; tippy color; P/T Energy=0; L3↔Library GLR parity). **TASK-702** high chrome; **TASK-709** high. TASK-708 done pending-qa. **TASK-703–705** + **TASK-699** medium.

---

- id: TASK-706
  title: Unify creator resource trackers — PointStatus size/style parity
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-606
    - TASK-614
    - TASK-465
  related_files:
    - src/components/shared/point-status.tsx
    - src/components/shared/loadout-budget-bar.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/components/guided-creator/guided-skills-panel.tsx
    - src/components/guided-creator/guided-abilities-customize-panel.tsx
    - src/components/guided-creator/guided-powers-techniques-l2-modal.tsx
  description: |
    Innate Energy, Currency, Training Points, Skill Points, Ability Points (and peers) must
    render at the same size and PointStatus style across guided creator steps — especially
    Powers where Innate Energy sits beside LoadoutBudgetBar TP. Today Innate PointStatus omits
    the `text-base` / shared chrome used by Skills, Abilities, and LoadoutBudgetBar. Prefer one
    shared composition (LoadoutBudgetBar trailing / shared resource row) over ad-hoc pills.
  acceptance_criteria:
    - Powers step: Innate Energy + TP (+ Currency where shown) match height, padding, font, border/radius of Skills/Abilities PointStatus.
    - All guided resource trackers use the same PointStatus variant + shared size class (or LoadoutBudgetBar / one resource-row helper).
    - No one-off smaller/larger pills on Powers vs Skills vs Loadout.
    - Mobile wrap still readable; a11y labels intact; DEV-V-013 / DEV-V-050 note if visual; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10 (Powers screen). Pair with TASK-707 for tippy-on-tracker color.

---

- id: TASK-707
  title: InfoTippy icon — default blue / contextual match (TP green)
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-465
    - TASK-706
  related_files:
    - src/components/shared/info-tippy.tsx
    - src/components/shared/loadout-budget-bar.tsx
    - src/components/shared/point-status.tsx
  description: |
    InfoTippy `(i)` triggers should prefer a blue/info link color by default, or inherit the
    color of the surface they sit on — e.g. Training Points tippy inside the TP PointStatus
    should be green (`text-tp` / success-TP tokens), not muted gray. Today LoadoutBudgetBar
    forces `text-text-muted` on the TP tip. Add a shared tone/class API on InfoTippy so call
    sites can opt into contextual color without one-off class fights.
  acceptance_criteria:
    - Default InfoTippy icon reads blue/info (or existing primary-link blue), not washed muted gray, unless an explicit tone is set.
    - TP tip inside Training Points PointStatus uses TP/green token color matching the tracker.
    - Other on-chip / on-status tips can pass the same contextual tone API (document in FEATURE_INDEX / tip guide).
    - Contrast OK in light/dark; touch targets unchanged; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10. Prefer `tone`/`className` prop on InfoTippy over copying muted overrides
    in every LoadoutBudgetBar call site.

---

- id: TASK-709
  title: L3 GuidedInlineCatalogList — full Library/Codex GLR system parity
  created_at: 2026-08-10
  created_by: owner
  priority: high
  status: not-started
  related_tasks:
    - TASK-684
    - TASK-702
    - TASK-703
    - TASK-705
    - TASK-708
    - TASK-691
  related_files:
    - src/components/shared/guided-choice/guided-inline-catalog-list.tsx
    - src/components/shared/unified-selection-modal-list.tsx
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/list-header.tsx
    - src/lib/library/official-item-list.ts
    - src/lib/library-selectable-builders.ts
    - src/lib/glr/required-facts-registry.ts
  description: |
    Owner intent: the entire L3 embedded GLR stack in the character creator must use the same
    styles and logic as working Library / Codex GLRs. Creator-only differences are those
    clearly required by context (TP/currency/innate budgets, eligibility gates, immediate
    selection, selected panel). Everything else — column builders, ListHeader chrome, row
    expand/chips, filters where applicable, SourceFilter, quantity right-slot — must be
    shared, not a parallel “almost GLR.” Coordinates TASK-702 (chrome), TASK-703 (facts),
    TASK-705 (source/create), TASK-708 (Energy) as slices of this parity goal; close remaining
    forks after audit.
  acceptance_criteria:
    - Written allowlist of intentional L3-vs-Library differences (budgets, eligibility, selection UX); no other forks remain.
    - Feats / loadout / powers-techniques L3 lists reuse Library/Codex builders + GridListRow/ListHeader norms (same as Official lists / USM where applicable).
    - Visual + behavioral spot-check: same item in Library vs creator L3 matches columns/chips/expand (modulo allowlist).
    - Delete or thin any guided-only column/filter/chrome forks found in the audit.
    - FEATURE_INDEX + ADR/product note if needed; DEV-V-050 expanded; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10 — “idk why they don’t, the logic should be shared.” Implementer: audit first,
    then fix; do not rebuild a second GLR. Prefer completing related 702/703/705/708 under this
    umbrella rather than inventing new list components.

---

- id: TASK-702
  title: GLR right-chrome — expand overlay, quantity header alignment, hover bleed
  created_at: 2026-08-10
  created_by: owner
  priority: high
  status: not-started
  related_tasks:
    - TASK-685
    - TASK-688
    - TASK-674
    - TASK-709
  related_files:
    - src/components/shared/grid-list-row.tsx
    - src/components/shared/grid-list-row-collapsed.tsx
    - src/components/shared/grid-list-row-expanded.tsx
    - src/components/shared/grid-list-row-chrome.ts
    - src/components/shared/list-header.tsx
    - src/components/shared/unified-selection-modal-list.tsx
    - src/components/shared/guided-choice/guided-inline-catalog-list.tsx
    - src/components/shared/selection-toggle.tsx
    - src/components/shared/quantity-selector.tsx
  description: |
    Shared GridListRow right chrome has multiple Custom L3 / equipment regressions: (1) the
    `+` SelectionToggle column blacks out / covers the expanded description panel (does not
    happen with remove `X`); may affect any GLR with interactive right chrome. (2) Equipment
    quantity mode: ListHeader strip must span the full row with titles aligned to columns;
    far-right quantity stepper is clipped / too far right and feels bolted on despite being
    the intended sitewide add replacement. (3) Row hover background stops before the quantity
    stepper (does not extend behind it). Fix once in GridListRow / ListHeader /
    USM_QUANTITY_RIGHT_SLOT_WIDTH patterns so Library USM, guided inline catalogs, and sheet
    lists inherit — screenshot-verify.
  acceptance_criteria:
    - Expanding a selectable (+ chrome) row: expanded body fully readable; + does not overlay/black-out description (z-index / layout / sticky stacking fixed in shared row).
    - Quantity mode: header bar full-width; column titles align with row cells; stepper fully visible (not clipped) with reserved chrome matching ListHeader `rightSlotWidth`.
    - Hover/selected highlight extends through the quantity / right-slot track (same band as the name/columns).
    - Remove-`X` and energy rightSlots remain correct; no regression on non-quantity selection +.
    - Chrome/spacing CI (`validate-glr-chrome-spacing`) updated if norms change; DEV-V-050 / DEV-V-034 notes; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10 — screenshot-friendly. Prefer fixing shared layout over guided-only CSS.
    Hover currently applies on the inner clickable grid (`hover:bg-surface-alt`) while rightSlot
    sits outside that node — likely the hover bleed root cause. Slice of TASK-709 L3 parity.

---

- id: TASK-703
  title: Character-creator GLR — required facts in columns or desc chips
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-629
    - TASK-437
    - TASK-690
  related_files:
    - src/lib/glr/required-facts-registry.ts
    - src/lib/glr/required-facts-registry.test.ts
    - src/lib/guided-creator/guided-equipment-l2.ts
    - src/lib/guided-creator/feats-l2.ts
    - src/lib/guided-creator/powers-techniques-l2.ts
    - src/components/shared/guided-choice/guided-inline-catalog-list.tsx
  description: |
    Audit guided/custom character-creator GLR surfaces (L2 modals + L3 GuidedInlineCatalogList
    for feats, loadout weapons/armor/gear, powers/techniques) so every required fact appears
    in a collapsed column or expanded descriptor chip — never missing, never duplicated —
    per ADR-0009 / `required-facts-registry`. Extend registry bindings + CI assertions where
    creator lists drift from Library/Codex SoT builders.
  acceptance_criteria:
    - Matrix of creator GLR surfaces checked against registry entity facts; gaps closed via shared builders (`armamentRowColumns`, power/technique budget display, feat chips) — no parallel fact formatters.
    - Missing facts promoted to column or labeled desc chip; column+chip duplicates removed.
    - Registry + vitest updated for any new/changed surface ids; FEATURE_INDEX GLR row notes if surfaces change.
    - BUILD_VALIDATION spot-checks for at least one weapon/armor/feat/power L3 expand; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10. Implementer audit — registry already exists (TASK-629). Pair with TASK-701
    if weapon Range fact values are wrong (display bug vs missing fact).

---

- id: TASK-704
  title: Guided Skills — DescriptorChips inline right of name
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-566
    - TASK-548
  related_files:
    - src/components/guided-creator/guided-skills-panel.tsx
  description: |
    On the guided Skills screen, Ability / Species / Path / sub-skill DescriptorChips currently
    wrap on a line below the skill name, making rows too tall. Place chips to the right of the
    name (same row), keeping expand chevron and ± steppers usable without collision — especially
    on desktop; mobile may wrap only when width forces it.
  acceptance_criteria:
    - Default layout: name (+ chevron) and desc chips on one horizontal band; chips to the right of the name, not a dedicated below-name block that always doubles row height.
    - ± / remove controls remain shrink-0 and tappable (≥44px touch on mobile).
    - No overlap with chevron or steppers at ~360px and desktop; DESIGN_INTENT comment updated if layout policy changes.
    - DEV-V-013 skills visual note if T067/T066 assert chip placement; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10. TASK-566 put chips below to avoid chevron/± overlap — revisit with a
    flex/wrap row that keeps chips beside the name first.

---

- id: TASK-705
  title: Guided L3 loadout — Create Armament hatch + SourceFilter defaults
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-641
    - TASK-684
    - TASK-695
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/shared/guided-choice/guided-layer-nav.tsx
    - src/components/shared/filters/source-filter.tsx
    - src/components/shared/guided-choice/guided-inline-catalog-list.tsx
    - src/app/(main)/item-creator/page.tsx
  description: |
    On Custom/L3 weapons, shields, armor, and related armament browse screens, add a
    GuidedLayerNav hatch to Create Armament (open item/armament creator in a new tab — same
    pattern as Species Create Species). Also wire SourceFilter (All / Realms Library / My
    Library): Custom L3 defaults to All; path-based L1–L2 modules default to Realms/public but
    remain toggleable to All / My / Realms. Reuse shared SourceFilter + hatch chrome (not
    Continue-primary).
  acceptance_criteria:
    - L3 weapon/shield/armor (armament) screens expose Create Armament → `/item-creator` (or current armament creator route) in a new tab; hatch uses GuidedLayerNav non-primary style (TASK-695).
    - SourceFilter present on those catalogs; Custom/`prefersDeepCatalogEntry` default `all`; guided L1–L2 path browse default `public` with ability to switch to all/my/public.
    - Filtering actually scopes the selectable catalog (official vs user library), not chrome-only.
    - Copy in guided-creator-copy; DEV-V-050 / DEV-V-013 updated; FEATURE_INDEX loadout/L3 note; build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10. Mirror `species-step` `openSpeciesCreator` + SourceFilter used on Library
    tabs. Confirm item-creator supports the intended armament types before linking.

---

- id: TASK-699
  title: Sitewide DescriptorChip slightly larger / more readable
  created_at: 2026-08-10
  created_by: owner
  priority: medium
  status: not-started
  related_tasks:
    - TASK-415
  related_files:
    - src/components/ui/chip.tsx
    - src/lib/chip/descriptor-chip-variants.ts
    - src/docs/DESIGN_SYSTEM.md
  description: |
    DescriptorChips feel slightly too small (padding + font) sitewide — only a nudge, but
    metadata is harder to read than it should be. Adjust the shared DescriptorChip default /
    `sm` size token so call sites inherit the bump; screenshot Library/Codex expanded rows and
    guided fact chips before/after. Keep ExpandableChip and filter pills distinct.
  acceptance_criteria:
    - Shared DescriptorChip default (or `sm` token used by DescriptorChip) is slightly larger / more readable; no per-page one-offs.
    - ExpandableChip / filter Chip roles unchanged unless they incorrectly share the same undersized token.
    - Contrast still passes; dense GLR rows do not overflow or wrap badly from the bump.
    - DESIGN_SYSTEM / CHIP docs note the size intent; screenshot-verify a representative surface.
    - Build/typecheck/lint pass.
  notes: |
    Owner 2026-08-10. DescriptorChip currently defaults `size="sm"` → `text-xs` / `py-0.5`. Prefer
    a modest token bump over forcing every call site to `md`.

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
