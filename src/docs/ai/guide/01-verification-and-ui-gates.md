> Back: [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) · Core: [`ARCHITECTURE_CONSTITUTION.md`](../ARCHITECTURE_CONSTITUTION.md)

# Verification & UI Gates

## Verification Before Marking Done

Before marking a task `done`, verify:

1. **Acceptance criteria** — Every criterion is fully met. Do not mark `done` if any bullet is incomplete.
2. **Related files** — Paths in the task's `related_files` match the actual codebase. Update the task if you correct paths.
3. **Build** — `npm run build` passes.
4. **Manual check** — For UI changes, spot-check in the browser if feasible.

### If work is incomplete

Use **`status: partial`**, not `done` with "deferred" in notes:

- **`completed_work`** — bullets of what shipped
- **`remaining_work`** — open acceptance criteria
- **`follow_up_tasks`** — new TASK-### IDs for the remainder (no orphan audit findings)

Human-only steps (Dashboard, prod smoke, product decisions) go in [`DEVELOPER_TASK_QUEUE.md`](../DEVELOPER_TASK_QUEUE.md), not buried in notes.

### Build validation (QA how-to)

For **user-facing** tasks (UI, auth, campaigns, sheet, admin, security, DB RLS):

1. Set **`build_validation`** on the task (suite id + test ids) and a short **`developer_test_plan`** pointer.
2. **Add or update** granular tests in [`BUILD_VALIDATION.md`](../../BUILD_VALIDATION.md) — **one behavior per DEV-V-###-T### test** (steps + expected + report line).
3. **Index** the suite in [`DEVELOPER_TASK_QUEUE.md`](../DEVELOPER_TASK_QUEUE.md) → Build validation index.

Do **not** write cramped multi-check smoke paragraphs. Split "pick archetype AND check skills AND check feats" into separate tests under one **DEV-V-###** category.

Automated-only tasks (`npm run build`, lint) do not need build validation unless behavior is hard to verify in CI.

If a task was wrongly marked `done`, re-open as `partial` or add/finish follow-up tasks.

## Design-system safety net (UI verification)

For **any UI / token / theme change**, use the automated net (TASK-383). The guiding roadmap for this effort is [`UI_UNIFICATION_PLAN.md`](../UI_UNIFICATION_PLAN.md) (durable plan; read it before continuing UI-unification work). The net replaces manual visual QA with deterministic checks.

- **Visual State Exploration Audit (VSEA):** Static screenshots only capture default page views. Before refactoring a page or component, explore **all meaningful interactive states** (modals open, tabs selected, expanded sections, errors, loading, empty, hover/focus) and log findings in [`VISUAL_STATE_AUDIT.md`](../VISUAL_STATE_AUDIT.md). See the plan § Visual State Exploration Audit. Retroactively re-audit Phase 1.1–1.2 components via the retroactive queue there.
- **Run it:** `npm run verify` (now **builds first**, then contrast + lint + visual + a11y). The `verify`, `verify:visual:update`, and `verify:a11y:update` scripts all run `npm run build` themselves. The bare `verify:visual` / `verify:a11y` do **not** build — only use them standalone right after a build.
- **Styleguide:** `/dev/styleguide` is the canonical, auth-free gallery of every primitive + token in both themes. When adding/changing a primitive or token, render it here and confirm it looks intentional in light **and** dark. It is captured in the screenshot suite.
- **Contrast** (`scripts/check-contrast.mjs`): resolves every semantic fg/bg token pair (following `var()` indirection) in **both** themes vs WCAG AA. Baseline `scripts/contrast-baseline.json` is at 0 — keep it there. To add a token pairing, edit the `PAIRS` array.
- **Visual regression** (`tests/visual/screenshots.pw.ts`): full-page baselines across mobile/tablet/desktop x light/dark for deterministic routes. After an **intentional** change, re-baseline with `npm run verify:visual:update`, **view the regenerated PNG(s)** (and any `*-diff.png`) to confirm the change is what you intended, then commit. Baselines are OS-specific (committed set is Windows; Linux CI baselines = DEV-002).
- **Accessibility** (`tests/visual/a11y.pw.ts`): axe-core scan, ratcheted via `tests/visual/a11y-baseline.json`. Fix violations and **prune** the baseline (`verify:a11y:update`) — never use update to mask a new violation.
- **No raw colors:** ESLint `realms/no-raw-color` (hard error) bans raw Tailwind palette / bare white-black / arbitrary hex in class strings. Use semantic tokens (`bg-surface`, `text-text-primary`, `bg-primary-600`, …). Exemptions: `(auth)/`, `components/auth/`, `components/ui/` primitives. Exemptions were narrowed in 2026-08: the blanket `components/ui/**` waiver had been disabling the rule for 121 files that did not need it, and is now scoped to the three that use black/white alpha scrims (`chip.tsx`, `modal.tsx`, `spinner.tsx`). The empty `RAW_COLOR_BACKLOG` rule and its audit script were deleted.
- **CI:** `.github/workflows/ui-verify.yml` runs contrast, lint (`--max-warnings 0`), build, visual + a11y baselines, and the **shell-creators chrome audit** (`playwright.shell-creators-audit.config.ts` — 8 tests, ~1–2 min on Linux after build). `.github/workflows/ai-task-verifier.yml` runs **`npm run typecheck`**, full vitest, and task/doc validators. **Pre-commit:** husky + lint-staged (eslint `--max-warnings 0`, then `prettier --write` on JS/TS/CSS/JSON — TASK-657 / TASK-772). `.prettierignore` skips markdown, SQL dumps, lockfile, snapshots, and `data/`. Other Playwright audit configs (`verify:creator-audit`, loadout, flaw, feat-cards, chip-unification, …) remain manual/optional via dedicated `playwright.*.config.ts` scripts. Coverage remains strongest in `src/lib`; do not assume broad UI/hooks/stores/services vitest (see `REMEDIATION_STATUS_2026-08.md`).

### Token architecture (Phase 0+)
- **Theme-aware semantic foreground tokens** for status/archetype body text: `text-success-fg`, `text-danger-fg`, `text-warning-fg`, `text-info-fg`, `text-power-fg`, `text-martial-fg`, and `bg-primary-button`. Each is correct in **both** themes (dark values live in `.dark`). Do not pair a numbered ramp with `dark:` (not `text-success-700 dark:text-success-400`). Numbered ramps stay for fills/borders. SoT: `ACCESSIBILITY.md` + `DESIGN_SYSTEM.md`.
- **Every** semantic token now has an explicit dark value. When you add a token to `@theme`, also add its `.dark` override (or it will silently render its light value in dark mode — the original dark-mode bug class).

### Hard-won gotchas (don't relearn these the hard way)
- **Always build before visual/a11y.** These serve the production build (`npm run start` on `.next`). A stale `.next` = false pass/fail. The canonical scripts now build for you; if you invoke Playwright directly, build first.
- **Never reuse a stray server.** `playwright.config.ts` sets `reuseExistingServer: false` so the suite always serves the build under test. Tell-tale of an unstyled/stale render: links show Chrome's default dark-mode color **`#9e9eff` on white** and `body` background is transparent — that means app CSS isn't applied (wrong/old server), not a real failure.
- **Fonts are self-hosted via `next/font`** (incl. `Nova Flat` → `--font-nova-flat` → `--font-display`). Do **not** reintroduce a runtime Google-Fonts `<link>` with `display=swap`; the fallback→web-font swap reflows layout and makes screenshot baselines flaky.
- **Verify your verifier.** The contrast script once matched the `@custom-variant dark (…)` line instead of the real `.dark { }` rule and silently compared dark≈light. If a check reports identical results across themes, suspect the check before trusting it.
