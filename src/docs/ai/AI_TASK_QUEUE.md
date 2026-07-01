# AI Task Queue (Active Only)

**Last slimmed:** 2026-06-26 (TASK-382). Full history: [`archive/AI_TASK_QUEUE_FULL_BACKUP_2026-06-26.md`](archive/AI_TASK_QUEUE_FULL_BACKUP_2026-06-26.md) and [`archive/TASK_QUEUE_DONE.md`](archive/TASK_QUEUE_DONE.md).

**Next task ID:** TASK-407

**Agent rules:** Skip `blocked` tasks and any task with `assignee:` set to a human (e.g. TASK-353). Skip human-only tasks (TASK-353 → `DEVELOPER_TASK_QUEUE.md` DEV-001). Pick highest-priority `not-started` or continue `partial`.

---

- id: TASK-321
  title: Reduce ESLint warnings (batch by rule)
  priority: low
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    ~324 ESLint warnings dominated by `@typescript-eslint/no-unused-vars`,
    `react-hooks/exhaustive-deps`, and `react-hooks/set-state-in-effect`. Address in batches by rule.
  related_files:
    - (repo-wide)
  acceptance_criteria:
    - Warning count materially reduced; no new errors introduced.
    - `react-hooks/exhaustive-deps` fixes do not change runtime behavior.
    - `npm run build` passes.
  completed_work: |
    - Batch 1 lint fix; 0 errors.
    - Batch 2 (TASK-350): lib/hooks no-unused-vars; character sheet page destructuring; ESLint 393→339 warnings.
  remaining_work: |
    - ~339 ESLint warnings remain (mostly exhaustive-deps, set-state-in-effect, admin any).
  follow_up_tasks:
    - TASK-350
  notes: "2026-06-13 batch 1."

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

- id: TASK-346
  title: "Systemic token & console cleanup (batch by rule)"
  priority: low
  status: partial
  created_at: 2026-06-12
  created_by: agent
  description: |
    Repo-wide batch cleanup: status colors -600 → -700 in light mode; replace stray gray-*/neutral-* outside auth;
    remove leftover client console.*. Do in small, rule-scoped batches with build between.
  related_files:
    - src/app/globals.css
    - src/components/layout/footer.tsx
    - src/components/shared/roll-button.tsx
  acceptance_criteria:
    - Status/secondary text passes WCAG AA tokens in both modes; no stray gray-*/neutral- outside auth.
    - No client console.* left; npm run build + lint pass.
  completed_work: |
    - Batch 1: footer, roll-button, crafting console.*.
    - Batch 2 (TASK-351): ~38 client console.* removed; home-page/item-creator neutral→semantic; shared status text -600→-700.
  remaining_work: |
    - Residual status -600 on hover/button backgrounds (intentional); some admin/codex body text.
  follow_up_tasks:
    - TASK-351
  notes: "2026-06-13 batch 1."

- id: TASK-353
  title: Enable Supabase leaked-password protection (HIBP)
  priority: medium
  status: not-started
  created_at: 2026-06-13
  parent_task: TASK-326
  assignee: human
  notes: "**Human-only — AI skip.** DEVELOPER_TASK_QUEUE DEV-001."

- id: TASK-376
  title: Retire DB tooltips — full migration to Collin Tippy + tooltip-text.tsx
  priority: high
  status: done
  created_at: 2026-06-25
  created_by: owner
  description: |
    Collin's `@tippyjs/react` + `public/tooltip-text.tsx` is the only tooltip standard.
  related_files:
    - public/tooltip-text.tsx
    - src/components/shared/info-tippy.tsx
  acceptance_criteria:
    - All contextual help uses Tippy + `public/tooltip-text.tsx`
    - Legacy DB tooltip stack removed; build passes
  notes: |
    Completed 2026-06-29: InfoTippy shared component, full creator + campaigns + navbar migration,
    legacy stack removed (useTooltipByKey, ContextHelpTooltip, HelpTooltip, admin/API routes, user toggle).
    Copy centralized in public/tooltip-text.tsx. Engine migrated to Floating UI in TASK-392 (2026-06-30).
    DB cleanup DEV-376 done 2026-06-30: dropped ui_tooltips + show_tooltips (sql/drop-legacy-ui-tooltips-2026-06.sql).

- id: TASK-378
  title: HYG-01 codex typing hardening + legacy payload compatibility gates
  priority: high
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Replace `fetchCodex`'s `any`-based response typing with a canonical typed payload, preserving
    compatibility adapters for historical data shapes (roll/campaign displays).
  related_files:
    - src/lib/api-client.ts
    - src/hooks/use-codex.ts
    - src/hooks/use-game-data.ts
    - src/hooks/use-game-rules.ts
    - src/components/character-sheet/roll-log.tsx
    - src/types/campaign-roll.ts
    - src/docs/ai/BUILD_VALIDATION.md
    - src/docs/ai/DEVELOPER_TASK_QUEUE.md
  acceptance_criteria:
    - `fetchCodex` returns a strongly typed payload (no broad `Record<string, any[]>`).
    - All `useCodex*`/rules consumers compile without `any` fallback leakage.
    - Roll timestamp compatibility remains safe for ISO + legacy `{ seconds }` payloads.
    - `photoURL` semantics documented as active auth/profile alias.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation suite added/indexed for codex + roll-log compatibility checks.
  notes: |
    Planned from remediation close-out. Compatibility-first phases required.

- id: TASK-379
  title: DUP-05/08 unify library selection pipelines and make LoadFromLibraryModal a thin wrapper
  priority: high
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Unify add/load library selection pipelines into one builder+normalizer path; refactor
    `LoadFromLibraryModal` into a thin wrapper over `UnifiedSelectionModal`.
  related_files:
    - src/hooks/use-load-modal-library.ts
    - src/hooks/add-library-item/
    - src/lib/library-selectable-builders.ts
    - src/components/creator/LoadFromLibraryModal.tsx
    - src/components/shared/unified-selection-modal.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Single shared pipeline for selectable-item shaping used by add + load flows.
    - `LoadFromLibraryModal` is wrapper-level composition, not a parallel list implementation.
    - No behavior regressions in powers/techniques/items/creatures/species load-add flows.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Build validation coverage added for add/load parity per creator type.
  notes: |
    Deferred from remediation waves. Requires QA-first execution.

- id: TASK-380
  title: DUP-11 + collapsible consolidation with CreatorPageShell rollout
  priority: medium
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Introduce shared creator-page shell scaffolding and consolidate collapsible patterns after parity tests exist.
  related_files:
    - src/app/(main)/power-creator/page.tsx
    - src/app/(main)/technique-creator/page.tsx
    - src/app/(main)/empowered-technique-creator/page.tsx
    - src/app/(main)/item-creator/page.tsx
    - src/app/(main)/species-creator/page.tsx
    - src/app/(main)/creature-creator/page.tsx
    - src/components/creator/
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - Shared CreatorPageShell removes duplicated auth/load/save scaffolding.
    - Collapsible usage consolidated to supported patterns.
    - Creator page behavior equivalent across all six routes.
    - `npm run build`, `npm test`, and `npm run lint` pass.
    - Dedicated creator parity validation suite added before merge.
  notes: |
    Execute after TASK-379 and associated QA harness.

- id: TASK-381
  title: BIG-01/02 phased decomposition of character-sheet and creator god files
  priority: medium
  status: not-started
  created_at: 2026-06-26
  created_by: agent
  description: |
    Decompose large character-sheet/creator files via phased extractions with test-backed parity checkpoints.
  related_files:
    - src/components/character-sheet/use-character-sheet-actions.ts
    - src/app/(main)/characters/[id]/page.tsx
    - src/app/(main)/*-creator/page.tsx
    - src/docs/ai/BUILD_VALIDATION.md
  acceptance_criteria:
    - `use-character-sheet-actions` split by domain boundaries without behavior regressions.
    - Targeted large creator/sheet routes decomposed into stable shells/islands in phases.
    - Each phase ships with explicit parity validation and rollback plan.
    - `npm run build`, `npm test`, and `npm run lint` pass per phase.
  notes: |
    High blast radius — proceed only with expanded DEV-V validation and small-scope PRs.

- id: TASK-382
  title: Docs compaction pass (active queue slimming + stale-reference pruning)
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Keep active docs lean: move historical audits and done task blocks out of agent line-of-sight;
    prune stale references in active guidance docs.
  related_files:
    - src/docs/ai/AI_TASK_QUEUE.md
    - src/docs/ai/archive/
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/README.md
    - AGENTS.md
    - .cursorignore
  acceptance_criteria:
    - `AI_TASK_QUEUE.md` contains only active/pending work; history in archive.
    - Active docs contain no stale route/component references unless marked historical.
    - Archive pointers explicit; `.cursorignore` excludes archive from indexing.
    - `npm run build` passes.
  notes: |
    DONE 2026-06-26: Slimmed queue to 10 active entries; moved June audits + root CODEBASE_AUDIT to
    `ai/archive/`; human onboarding/reference to `src/docs/human/`; added HISTORY_INDEX.md + .cursorignore.

- id: TASK-383
  title: "UI unification — Phase 0a: automated visual + a11y + contrast safety net"
  priority: high
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Stand up an automated verification net BEFORE the design-system token re-architecture
    (Phase 0+) so style/theme regressions are caught without manual visual QA. Plan:
    `.cursor/plans/ui_unification_audit_4aa98a2a.plan.md`.
  completed_work: |
    - `scripts/check-contrast.mjs`: WCAG-AA contrast check of every semantic fg/bg token pair in
      BOTH themes, with a 0-failure ratchet baseline (`scripts/contrast-baseline.json`).
    - `/dev/styleguide`: auth-free, data-free gallery of every primitive + token swatch (the
      canonical surface for visual review; captured in both themes at 3 breakpoints).
    - Playwright + `@axe-core/playwright`: `tests/visual/` — full-page screenshot baselines (54)
      across mobile/tablet/desktop x light/dark for deterministic routes, plus axe-core a11y scans
      with a ratchet baseline (`tests/visual/a11y-baseline.json`).
    - ESLint `realms/no-raw-color` guardrail (`eslint-rules/`): hard error banning raw Tailwind
      palette / bare white-black / arbitrary hex in class strings; exempts auth shell + UI
      primitives; 64-file migration backlog ratchet (`raw-color-backlog.mjs`) shrinks per phase.
    - `npm run verify` (contrast + lint + visual + a11y) and `.github/workflows/ui-verify.yml`
      hard-blocking CI gates.
  follow_up_tasks:
    - TASK-384
    - TASK-385
  build_validation: |
    suite: DEV-V-011
    tests:
      - DEV-V-011-T001
      - DEV-V-011-T002
      - DEV-V-011-T003
      - DEV-V-011-T004
  developer_test_plan: |
    Suite DEV-V-011 T001–T004 — see BUILD_VALIDATION.md. Human steps (CI secrets, Linux baseline
    seeding, branch protection) in DEVELOPER_TASK_QUEUE DEV-002.
  related_files:
    - scripts/check-contrast.mjs
    - scripts/contrast-baseline.json
    - scripts/list-raw-color-backlog.mjs
    - src/app/dev/styleguide/page.tsx
    - playwright.config.ts
    - tests/visual/
    - eslint-rules/no-raw-color.mjs
    - eslint-rules/raw-color-backlog.mjs
    - eslint.config.mjs
    - .github/workflows/ui-verify.yml
    - package.json
  notes: |
    DONE 2026-06-26. Visual baselines committed are Windows (local/agent self-review). Linux CI
    baselines + Supabase CI secrets + branch-protection required-checks = DEV-002 (one-time).

- id: TASK-384
  title: "Resolve a11y violations surfaced by the new axe baseline"
  priority: medium
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    The Phase 0a axe scan recorded a ratchet baseline of pre-existing violations. Drive these to
    zero and shrink `tests/visual/a11y-baseline.json`. Highest-leverage first.
  completed_work: |
    - Toast region: `role="region"` so `aria-label` is valid with `aria-live`.
    - TabNavigation: `disabled` instead of prohibited `aria-disabled` on tabs; `associatePanels` prop for demos.
    - Form error text → `text-danger-fg` (Input/Select/Textarea/Checkbox).
    - Privacy inline links: persistent underline (`link-in-text-block`).
    - Styleguide: token swatches on correct surfaces; tab panels wired; toast trigger; PointStatus contrast.
    - `tab-nav-trigger-active` → semantic tokens (no primary ramp `dark:`).
    - `tests/visual/a11y-baseline.json` emptied — zero allowed violations.
  related_files:
    - src/components/layout/header.tsx
    - src/app/(main)/library/
    - src/app/(main)/privacy/page.tsx
    - tests/visual/a11y-baseline.json
  acceptance_criteria:
    - Fix the near-global `aria-prohibited-attr` (appears on nearly every page — likely one shared
      nav/header/skip-link/toggle element); remove its keys from the a11y baseline.
    - Fix `/library` dark-mode `color-contrast` and `/privacy` `link-in-text-block`.
    - `npm run verify:a11y` passes; baseline entries deleted (not re-added).
    - `npm run build` passes.
  notes: |
    DONE 2026-06-27. `npm run verify:a11y` passes with empty baseline (30/30 routes, both themes).

- id: TASK-385
  title: "Authenticated-surface visual + a11y baselines (test session)"
  priority: low
  status: done
  created_at: 2026-06-26
  created_by: agent
  description: |
    Extend the safety net to auth-gated, data-bearing surfaces (character sheet, `/my-account`,
    campaign detail/combat) once a deterministic test session + seed data exist.
  completed_work: |
    - `scripts/provision-e2e-baseline.js` + `tests/visual/e2e-seed-manifest.json` — deterministic user/character/campaign seed.
    - `auth.setup.ts` + `playwright.auth.config.ts` — storageState login (login once, reuse session).
    - Visual baselines: my-account, characters, campaigns, character-sheet, campaign-detail × light/dark (10 snapshots).
    - `auth-a11y.pw.ts` + ratchet baseline; masks for portraits + roll logs.
    - `npm run e2e:provision`, `verify:auth-visual`, `verify:auth-a11y` (+ update variants).
    - CI optional step when `E2E_TEST_*` secrets present (`.github/workflows/ui-verify.yml`).
  remaining_work: |
    - Human DEV-003: add `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` (+ optional IDs) to GitHub Actions secrets; seed Linux auth baselines on first CI run (same as DEV-002).
    - Follow-up: fix character-sheet axe allowances (`aria-valid-attr-value`, `scrollable-region-focusable`) and my-account dark `color-contrast`.
  related_files:
    - tests/visual/
    - playwright.auth.config.ts
    - scripts/provision-e2e-baseline.js
  acceptance_criteria:
    - Playwright storageState login flow using a CI test user (DEV-002/DEV-003).
    - Deterministic seed (or masked dynamic regions) so screenshots don't churn.
    - Baselines for character sheet, /my-account, campaign detail in both themes.
  build_validation: |
    suite: DEV-V-011
    tests:
      - DEV-V-011-T005
      - DEV-V-011-T006
  notes: |
    DONE 2026-06-27. Test user `e2e-visual-baseline@realmsrpg.test` provisioned in dev Supabase. Windows baselines committed. Auth a11y ratchet has 5 pre-existing allowances on character sheet + my-account dark.

- id: TASK-386
  title: "MVP: guided three-layer character creator pilot (archetype preview + feats L1)"
  created_at: 2026-06-28
  created_by: owner
  priority: high
  status: done
  completed_work: |
    Full 9-step three-layer creator rework: GuidedChoiceShell on all path steps, per-step layer state + getStepCompletion, path-default archetype with build previews, species recommended_species L1, ancestry checklist, abilities suggested array + blurbs, skills L1 hide sub-skills, feats/equipment/powers guidance groups + weapon-then-armor + confirm loadout, finalize character reveal + edit jump-backs + identity fields, CreatorResourceBar, martial→skip powers tab, admin validatePathDataForPublish on save. Visual UX sweep (Playwright audit, footer/tab/InfoTippy fixes). Supabase: level1_recommended_species + level1_guidance_groups columns; Berserker reference path seeded. TASK-376 InfoTippy migration done. `npm run build` + `npm run verify:creator-audit` pass.
  remaining_work: |
    Optional follow-up: admin UI builder for guidance_groups (Advanced Path JSON + ChipSelect for recommended_species work today). Seed guidance groups for remaining paths (Warrior, Monk, power paths) as content work.
  follow_up_tasks:
    - TASK-391
  build_validation: |
    suite: DEV-V-001
    tests:
      - DEV-V-001-T001
      - DEV-V-001-T011
    automated: npm run verify:creator-audit
  developer_test_plan: |
    DEV-V-001 manual path/forge guards + npm run verify:creator-audit for step screenshots.
  description: |
    Character-creator implementation slice of the Product Experience Redesign
    (`src/docs/REALMS_PRODUCT_OVERVIEW.md`, Appendix E). Establishes Layer 1
    (guided) default + "see all" escape on the feats step; archetype preview cards.
    Landing rebuild is TASK-387; post-activation flow is TASK-388.
    Prefer simplification/restructuring over new features (Section 8).
    Tooltip copy: `public/tooltip-text.tsx` + `InfoTippy` (TASK-376 done).
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/character-creator/steps/archetype-step.tsx
    - src/components/character-creator/steps/feats-step.tsx
    - src/components/character-creator/PathHelpCard.tsx
    - src/lib/game/archetype-path.ts
    - public/tooltip-text.tsx
  acceptance_criteria:
    - Archetype step: path cards show build preview (counts + one-line goal); Path default, "Forge Your Own" secondary/L3.
    - Feats step (pilot): Layer 1 grouped recommended feats with why-copy; "See all feats" → existing L3 browser; "Back to recommendations" returns to L1.
    - Global: `level1.notes` surfaced via enhanced `PathHelpCard` on every path step.
    - Content: one fully authored reference martial path in admin; completable in L1 without opening full lists.
    - `npm run build` passes; MOBILE_UX + ACCESSIBILITY rules followed.
  notes: |
    Refactor behind `creationMode === 'path'`. GuidedChoiceShell built and used on abilities/skills; feats/equipment/powers use layer expand + path groups. 2026-06-29: comprehensive rework shipped (see completed_work).
    Tooltip copy: add to `public/tooltip-text.tsx` and use `InfoTippy` (TASK-376 done).

- id: TASK-387
  title: "Landing page full redesign (modern TTRPG startup)"
  created_at: 2026-06-28
  created_by: owner
  priority: high
  status: done
  description: |
    Scrap and rebuild `home-page.tsx` per REALMS_PRODUCT_OVERVIEW Section 4 —
    not a copy-only patch. Single primary CTA (Start Playing → /characters/new),
    research-backed scroll structure, remove OnboardingTour and Codex/Library CTAs.
    Mid-page secondary CTAs: custom power, weapons/armor (→ creators; Layer 1 entry
    when those creators support it). Discord tertiary. Design system compliant.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/app/(main)/home-page.tsx
    - src/components/shared/onboarding-tour.tsx
    - src/lib/constants/site-copy.ts
  acceptance_criteria:
    - Remove OnboardingTour trigger and welcome-banner tour link from home.
    - Remove Browse Codex / Browse Library as landing CTAs (nav only).
    - One primary hero CTA: Start Playing → /characters/new.
    - Uniqueness block with visual proof (screenshots/art), not abstract copy only.
    - Below fold: Create a Custom Power + Create Weapons & Armor sections with links to creators.
    - Join Discord in closing/footer section.
    - Mobile-first (~360px); semantic tokens; `npm run build` passes.
  completed_work: |
    Rebuilt `home-page.tsx` from scratch as a composition shell over new section
    components in `src/components/landing/` (HeroSection, UniquenessSection,
    HowItWorksSection, SecondaryDiscoverySection, CommunitySection + MarketingButton
    helpers + barrel). AIDA scroll story per Section 4.
    - Removed: OnboardingTour trigger + "Take a quick tour", logged-in welcome
      link-farm, review carousel, equal-weight feature cards. No Codex/Library CTAs.
    - Single dominant primary CTA "Start Playing" -> /characters/new (hero) repeated
      once mid-page in How-it-works. Low-weight "#how-it-works" explorer anchor for
      researching visitors (owner: proceed with research best practice, I.4).
    - Conditional hero: returning users with >=1 character get continue-focused hero
      (Continue your adventure -> /characters) via useCharacters.
    - Secondary discovery: Create a Custom Power -> /power-creator, Create Weapons &
      Armor -> /item-creator (outline/subordinate). Community: Join Discord tertiary.
    - Copy centralized in `LANDING_COPY` (site-copy.ts). Semantic tokens, dark mode,
      44px targets, h1->h2->h3 hierarchy. `npm run build` passes; lint clean.
  remaining_work: |
    (None — licensed character/item art integrated 2026-06-28: Faust hero, Human-Greyscale
    / gnome / Shroom-Shot uniqueness, gnome + Shroom-Shot secondary discovery.)
    Power/item secondary CTAs still link to Layer 3 creators until Phase 3.
  follow_up_tasks: []
  build_validation: DEV-V-012
  developer_test_plan: BUILD_VALIDATION.md#dev-v-012--landing-page-rebuild-task-387
  notes: |
    Can ship before or in parallel with TASK-386. OnboardingTour component file kept
    in `src/components/shared/` for TASK-388 to repurpose (no longer imported by home).

- id: TASK-388
  title: "Post-activation onboarding (play together, sheet tour, level-up milestones)"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: not-started
  description: |
    Section 11 of REALMS_PRODUCT_OVERVIEW.md. After first character save, guide users
    toward playing together (Discord, campaign invite). Optional post-save sheet tour.
    Contextual level-up tutorials for milestones (first level-up, first ability point,
    etc.) — delta-only, skippable, global tutorials on/off preference.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/character-creator/steps/finalize-step.tsx
    - src/components/character-sheet/
    - src/components/shared/onboarding-tour.tsx
  acceptance_criteria:
    - After first character save: dismissible play-together prompt (Discord + start campaign).
    - Optional sheet tour offered once post-save (Skip + Don't show again); not on home page.
    - First level-up shows contextual guide for fields that changed only.
    - First ability-point level (e.g. level 3) shows where to allocate on sheet.
    - User can disable all tutorials (setting or preference flag).
    - Milestone flags stored (profile or character JSON); no repeat on subsequent level-ups of same type.
    - `npm run build` passes.
  notes: |
    Replaces pre-creation home OnboardingTour with post-activation guidance.
    Prefer InfoTippy/highlight chains over modal-heavy tours.

- id: TASK-389
  title: "Landing visual assets — replace uniqueness placeholder panels"
  created_at: 2026-06-28
  created_by: agent
  priority: medium
  status: done
  description: |
    Follow-up to TASK-387. The rebuilt landing uniqueness block (Section 4 "visual
    proof") currently renders layout-stable placeholder panels (`VisualPanel` in
    `src/components/landing/uniqueness-section.tsx`). Replace with real product
    screenshots / species art / power examples so the differentiators show the
    product in use rather than illustrative placeholders.
  related_files:
    - src/components/landing/uniqueness-section.tsx
    - public/images/
  acceptance_criteria:
    - Each uniqueness card shows a real screenshot or art asset (creator UI, species
      art, power example) at the existing 16:10 panel aspect (no layout shift).
    - Assets optimized (next/image, sized); mobile + dark mode verified.
    - `npm run build` passes.
  notes: |
    Completed 2026-06-28: owner supplied Faust, gnome, Shroom-Shot, Human-Greyscale;
    integrated via LandingArtFrame + hero split layout (banner removed).

- id: TASK-390
  title: "Migrate editable static copy to per-page constants modules"
  created_at: 2026-06-28
  created_by: owner
  priority: medium
  status: in-progress
  description: |
    Owner wants all user-editable marketing/UI strings in `src/lib/constants/copy/`
    — one module per page or area for easy editing while viewing a route. Landing,
    auth, and about headers/CTAs are migrated; carousel slide bodies, footer, nav,
    rules/resources pages, creators, and tooltips remain scattered.
  related_files:
    - src/lib/constants/copy/
    - src/lib/constants/site-copy.ts
    - src/lib/constants/skills.ts
    - public/tooltip-text.tsx
    - src/components/layout/footer.tsx
    - src/components/layout/header.tsx
  acceptance_criteria:
    - `src/lib/constants/copy/` holds per-page modules; `site-copy.ts` re-exports (backward compatible).
    - Each major route with owner-editable prose has a dedicated `*-copy.ts` file documented in `site-copy.ts` header table.
    - No duplicate hardcoded motto/Discord URL outside copy modules (except tooltip-text.tsx per TASK-376).
    - Pages import copy from constants; no marketing string changes required in JSX for migrated sections.
    - `npm run build` passes.
  completed_work: |
    - Created `src/lib/constants/copy/` (shared, landing, auth, about + index barrel).
    - Refactored `site-copy.ts` to re-export from `copy/` with editor map in header comment.
    - Migrated About page header + creator note + bottom CTAs to `about-copy.ts` (TASK-390 partial).
  remaining_work: |
    - Migrate About dice-carousel slide bodies from `about/page.tsx` to `about-copy.ts` (or structured slide data).
    - Add `footer-copy.ts`, `nav-copy.ts`, `rules-copy.ts`, etc. incrementally per page touched.
    - Optional: split long About carousel into `src/components/about/` + copy-only slide definitions.
  follow_up_tasks: []
  notes: |
    Do not merge game mechanics (`skills.ts`) or Collin tooltip migration (`public/tooltip-text.tsx`) into marketing copy modules.
    Migrate incrementally when editing a page — avoid one giant PR moving every string.

- id: TASK-391
  title: "Admin path builder — guidance_groups UI + seed remaining paths"
  created_at: 2026-06-29
  created_by: agent
  priority: medium
  status: not-started
  description: |
    Character creator Layer 1 uses `level1_guidance_groups` (JSONB) and `level1_recommended_species`
    (TEXT) on `codex_archetypes`. Berserker reference path seeded; admin can edit via Advanced Path JSON
    and recommended-species ChipSelect today. Add a structured admin UI for guidance group authoring
    and optionally seed Warrior/Monk/power paths with grouped recommendations.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - sql/codex-archetypes-creator-layer1-extensions.sql
    - src/lib/constants/creator-layer-governance.ts
  acceptance_criteria:
    - Admin can add/edit/remove guidance groups without raw JSON (title, why, feat/power/armament picks per group).
    - Layer 1 governance caps enforced in UI (max 3 groups, 7 items, 120-char why).
    - Optional: at least one additional martial path seeded with guidance groups in Supabase.
    - npm run build passes.

- id: TASK-392
  title: Migrate InfoTippy from Tippy.js to Floating UI (React 19)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Replace archived `@tippyjs/react` / `tippy.js` with `@floating-ui/react` in `InfoTippy`.
    Removes React 19 `element.ref` console warning and unmaintained dependency. Keep same
    public API (`content`, `label`, `placement`, `size`, `children`, `allowHTML` compat).
  related_files:
    - src/components/shared/info-tippy.tsx
    - package.json
    - src/docs/ai/AGENT_GUIDE.md
    - src/docs/ai/FEATURE_INDEX.md
  acceptance_criteria:
    - InfoTippy uses Floating UI; no `@tippyjs/react` or `tippy.js` in dependencies.
    - Hover (desktop), focus, touch-hold (~400ms), portal to body, flip/shift, max-width 320px preserved.
    - Interactive JSX tooltips allow pointer entry (safePolygon).
    - All existing InfoTippy call sites work without changes.
    - npm run build passes.
  notes: |
    2026-06-30: Implemented. Removed tippy packages; added @floating-ui/react.
    Integration audit 2026-06-30: no @tippyjs/react imports remain; dead tooltip Zod schemas removed;
    agent docs/rules updated; InfoTippyProps exported from shared barrel.
    DEV-376 2026-06-30: Supabase MCP migration drop_legacy_ui_tooltips applied; app code no longer references show_tooltips.

- id: TASK-393
  title: Guided Simple Creator — docs & product model (REALMS §5.0)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Document two-creator model, chapter backbone, starter-species rule, recommended abilities/loadouts data needs, and future avatar slot in REALMS_PRODUCT_OVERVIEW.md.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
  acceptance_criteria:
    - Section 5.0 records Simple vs Advanced, entry chooser, chapters, and data fields.
  notes: |
    2026-06-30: Implemented as part of guided creator build.

- id: TASK-394
  title: Guided Simple Creator — Phase 0 entry chooser & routes
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Simple vs Advanced chooser at /characters/new; Advanced at /characters/new/advanced; guided at /characters/new/guided; guided-creator-store scaffold.
  related_files:
    - src/app/(main)/characters/new/page.tsx
    - src/app/(main)/characters/new/advanced/page.tsx
    - src/app/(main)/characters/new/guided/page.tsx
    - src/stores/guided-creator-store.ts
  acceptance_criteria:
    - New Character navigates to chooser; both routes load; stores are separate.
    - npm run build passes.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T001
  notes: |
    2026-06-30: Landing-cohesive chooser with CreatorFunnelHero.

- id: TASK-395
  title: Guided Simple Creator — Phase 1 shell (rail, preview, footer)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    GuidedCreatorShell with chapter rail, CharacterPreviewPanel, GuidedStepFooter, and step routing for all chapters.
  related_files:
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/components/guided-creator/character-preview-panel.tsx
    - src/components/guided-creator/guided-step-footer.tsx
    - src/components/guided-creator/guided-creator-page-shell.tsx
  acceptance_criteria:
    - Chapter rail matches GUIDED_CHAPTERS; preview updates from draft; sticky footer on all steps.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T002
  notes: |
    2026-06-30: Visual language matches landing (CreatorFunnelHero, rounded-card surfaces).

- id: TASK-396
  title: Guided Simple Creator — schema fields & seed SQL
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Add codex_species.is_starter, codex_archetypes.level1_recommended_abilities, level1_loadouts; SQL seed for Berserker + starter species; update SUPABASE_SCHEMA.md.
  related_files:
    - sql/guided-creator-schema-seed.sql
    - src/docs/SUPABASE_SCHEMA.md
    - src/app/api/codex/route.ts
  acceptance_criteria:
    - SQL file documents migration + seed; schema doc updated; API maps new fields into path_data.
    - Human runs SQL in Supabase (DEV-004).
  notes: |
    2026-06-30: Seed SQL applied via Supabase MCP migration `guided_creator_schema_seed` (DEV-004 done). 8 starter species + Berserker verified in DB.

- id: TASK-397
  title: Guided Simple Creator — Phase 2 Foundation (path + species)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Shared GuidedChoiceCard for path/species; starter-species filter with expand-to-all; Powered-Martial paths behind expand affordance.
  related_files:
    - src/components/guided-creator/steps/path-step.tsx
    - src/components/guided-creator/steps/species-step.tsx
    - src/components/guided-creator/guided-choice-card.tsx
  acceptance_criteria:
    - Path and species use same card format; starter filter works when is_starter seeded; hybrid paths expandable.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T003
  notes: |
    2026-06-30: Species path-ambiguous (no per-path recommended species).

- id: TASK-398
  title: Guided Simple Creator — Phase 3 Ancestry micro-flow
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    One-pick-at-a-time full-width cards for species-trait options, ancestry trait, characteristic, optional flaw + bonus trait; draft-state completion validation.
  related_files:
    - src/components/guided-creator/steps/ancestry-step.tsx
  acceptance_criteria:
    - Continue disabled until required ancestry picks complete; optional flaw skippable.
  notes: |
    2026-06-30: Mixed species deferred.

- id: TASK-399
  title: Guided Simple Creator — Phase 4 Abilities
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Apply path recommended_abilities or customize via AbilityScoreEditor; in-context ability blurbs.
  related_files:
    - src/components/guided-creator/steps/abilities-step.tsx
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - Use recommended one-click apply; customize mode enforces point spend.
  notes: |
    2026-06-30: resolveGuidedRecommendedAbilities from path_data.

- id: TASK-400
  title: Guided Simple Creator — Phase 4 Your Archetype (skills + feats)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Skills (species locked + path toggleable), archetype feats via guidance groups, character feat step; ordered after abilities.
  related_files:
    - src/components/guided-creator/steps/skills-step.tsx
    - src/components/guided-creator/steps/archetype-feats-step.tsx
    - src/components/guided-creator/steps/character-feat-step.tsx
  acceptance_criteria:
    - Sub-step order enforced in store; guidance groups drive feat selection when present.
  notes: |
    2026-06-30: Chapter 4 sub-steps skills → archetype-feats → character-feat.

- id: TASK-401
  title: Guided Simple Creator — Phase 5 Equipment + Powers/Techniques
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Loadout cards from level1_loadouts (fallback to path armaments); single Powers or Techniques step by archetype type.
  related_files:
    - src/components/guided-creator/steps/loadout-step.tsx
    - src/components/guided-creator/steps/powers-techniques-step.tsx
    - src/lib/game/archetype-path.ts
  acceptance_criteria:
    - Loadout step selects kit; powers/techniques step title varies by martial vs power archetype.
  notes: |
    2026-06-30: parseLoadouts supports object-shaped armament entries in JSON.

- id: TASK-402
  title: Guided Simple Creator — Phase 6 Your Hero (reveal + save)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Reveal step with name, HP/EN allocation, save character, login prompt for guests, post-save play-together modal.
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/lib/guided-creator/build-character.ts
  acceptance_criteria:
    - buildGuidedCharacterPayload + createCharacter; guest sees login modal; post-save Discord/campaign prompt.
  follow_up_tasks:
    - TASK-406
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T005
  notes: |
    2026-06-30: Marketing CTAs in modals match landing patterns. Reveal UX completed in TASK-406.

- id: TASK-403
  title: Guided Simple Creator — Phase 8 admin & species starter flag
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: partial
  description: |
    Admin species is_starter checkbox; admin archetype JSON fields for level1_recommended_abilities and level1_loadouts; save via saveArchetypeWithPath.
  related_files:
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/app/(main)/admin/codex/actions.ts
  acceptance_criteria:
    - isStarter persists on species; guided JSON fields editable and saved to DB columns.
  completed_work: |
    - isStarter checkbox wired in AdminSpeciesTab (openAdd/openEdit/save).
    - Guided JSON textareas for recommended abilities + loadouts in AdminArchetypesTab.
    - saveArchetypeWithPath persists level1_recommended_abilities and level1_loadouts.
  remaining_work: |
    - Plan Phase 8 also called for replacing the archetype edit modal with a full admin-only archetype creator (structured loadout builder, not raw JSON).
    - Species trait-option editing improvements beyond existing AdminSpeciesTab pickers (if needed for guided ancestry QA).
  follow_up_tasks:
    - TASK-404
  notes: |
    2026-06-30: JSON fields sufficient for prototype; full archetype creator UI deferred to TASK-404.

- id: TASK-404
  title: Guided creator — admin archetype creator + reveal portrait upload
  created_at: 2026-06-30
  created_by: agent
  priority: medium
  status: not-started
  description: |
    Close remaining plan gaps: structured admin loadout/abilities builder (replace raw JSON in AdminArchetypesTab). Portrait upload on guided reveal delivered in TASK-406.
  related_files:
    - src/app/(main)/admin/codex/AdminArchetypesTab.tsx
    - src/components/guided-creator/steps/reveal-step.tsx
  acceptance_criteria:
    - Admin can author loadouts without hand-editing JSON.
  notes: |
    Follow-up from TASK-403 partial. Guided reveal portrait upload moved to TASK-406.

- id: TASK-406
  title: Guided creator — Your Hero reveal redesign (§5.10)
  created_at: 2026-06-30
  created_by: agent
  priority: high
  status: done
  description: |
    Redesign guided reveal/finalize step to match REALMS §5.10: hero reveal moment, full build summary with names and edit jump-backs, identity fields, portrait upload, smart HP/EN allocation, reveal-first layout.
  related_files:
    - src/components/guided-creator/steps/reveal-step.tsx
    - src/components/guided-creator/guided-reveal-summary.tsx
    - src/components/guided-creator/guided-portrait-upload.tsx
    - src/components/guided-creator/guided-health-energy-section.tsx
    - src/components/guided-creator/guided-step-edit-link.tsx
    - src/components/guided-creator/guided-creator-shell.tsx
    - src/lib/constants/copy/guided-creator-copy.ts
    - src/lib/guided-creator/build-character.ts
    - src/stores/guided-creator-store.ts
  acceptance_criteria:
    - Full overview shows names (skills, traits, feats, loadout, powers/techniques) not counts.
    - Edit links jump back to prior guided sub-steps.
    - Identity block: name, optional age/height/weight/appearance, portrait upload.
    - HP/EN auto-applies on enter + auto-allocate button tied to highest power/technique cost.
    - Reveal layout feels like a finale (hero band, no duplicate preview strip).
    - Save + guest login + portrait upload on save still work.
  build_validation: |
    suite: DEV-V-013
    tests:
      - DEV-V-013-T004
      - DEV-V-013-T005
  notes: |
    2026-06-30: Owner feedback — guided reveal was worst finalize step; redesign in stages.
    2026-06-30: Hero band, GuidedRevealSummary (names + edit links), identity block, portrait upload, smart HP/EN auto-allocate, shell hides strip on reveal. npm run build pass.

- id: TASK-405
  title: Choice-card art — codex image_url fields + admin upload
  created_at: 2026-06-30
  created_by: owner
  priority: high
  status: not-started
  description: |
    Species (and later equipment, powers, techniques) use hero art on GuidedChoiceCard as a primary selling point (REALMS §5.0.3). UI resolves image_url from records with typed SVG placeholders until art exists. Add codex columns, Storage upload, admin pickers, and seed real species art for starters.
  related_files:
    - src/docs/REALMS_PRODUCT_OVERVIEW.md
    - src/components/guided-creator/guided-choice-card.tsx
    - src/components/guided-creator/guided-choice-image.ts
    - src/docs/SUPABASE_SCHEMA.md
    - src/app/(main)/admin/codex/AdminSpeciesTab.tsx
    - public/images/placeholder-*-card.svg
  acceptance_criteria:
    - codex_species.image_url (TEXT, nullable) + documented in SUPABASE_SCHEMA.md; migration applied.
    - Admin species editor: upload or URL for card art; preview matches guided hero layout.
    - Guided species step shows real art when image_url set; placeholders otherwise.
    - Plan documented for powers/techniques/loadout image_url (column or JSON) as follow-up sub-task or phase 2.
  notes: |
    2026-06-30: Product owner — species art is main marketing hook on cards. Prototype placeholders + GuidedChoiceCard hero layout landed first.

---
