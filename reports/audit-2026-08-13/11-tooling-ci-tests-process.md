# Audit 11 — Tooling, CI, Tests & Agent Process Overhead

**Repo:** `RealmsRPG-Test` · **Date:** 2026-08-13 · **Method:** read-only inspection of config/code + read-only commands (`git ls-files`, `git log`, `npx tsc --noEmit`, `rg`, `npm ls`, `npm outdated`, `npm audit`). Docs were not trusted; every claim below was verified against config or source.

**Scale baseline:** 1,559 tracked files · 1,065 `.ts/.tsx` in `src/` (~164k lines) · 123 unit-test files · 761 commits · `src/docs` = 98 files / 44,052 lines.

---

## 0. Executive summary

The **static-analysis story is genuinely strong** and better than most startups at this stage: `strict: true`, **0 TypeScript errors on a clean non-incremental run**, **zero `any`**, **zero `@ts-ignore`/`@ts-expect-error`**, 22 `eslint-disable` comments across 1,065 files, 0 npm audit vulnerabilities, 714 unit tests with 1,754 assertions, and two real CI workflows.

The failures are **all at the edges where software meets production**:

1. **Nothing blocks a bad deploy.** Vercel builds on push to `master`; GitHub Actions runs *in parallel* on the same push. Work lands directly on `master` (HEAD is `ahead 1` of origin with two direct non-merge feature commits at the tip). A red CI cannot stop the deploy it is racing.
2. **Zero error monitoring.** No Sentry, Datadog, LogRocket, PostHog, OpenTelemetry — nothing. 65 `console.error` calls that vanish into serverless stdout.
3. **The last database backup is 2026-04-21 — 114 days ago.** Backups are a manual PowerShell script requiring the owner's Windows machine. No cron, no scheduled function, no automation.
4. **No migration automation or drift detection.** `npm run db:migrate` is literally an `echo`. 105 SQL files applied by hand in the Supabase Dashboard.
5. **Zero functional end-to-end coverage.** 19 Playwright tests exist; all are screenshots, a11y scans, or DOM-chrome audits. Nothing asserts that login works, a character saves, or the guided creator completes.
6. **The agent-process layer is the single largest maintenance tax in the repo:** 76 files / 36,806 lines of process docs, 5 CI gates that fail for non-code reasons, and **91.6% of app-code commits in the last 30 days also had to edit `src/docs/ai/`**.

---

## 1. Quality-gate matrix

`npm run build` = `next build --webpack`. Both workflows trigger on `pull_request` (opened/synchronize/reopened) **and** `push: [master]`.

| Gate | Where enforced | Blocks a bad **commit**? | Blocks a bad **deploy**? | Gap |
|---|---|---|---|---|
| `eslint --max-warnings 0` | `ui-verify.yml` static-gates; lint-staged (staged files only) | Partially — staged files only | **No** — runs in parallel with Vercel | Unstaged/other files unlinted pre-commit |
| `tsc --noEmit` (full) | `ai-task-verifier.yml` | **No** — pre-commit uses a staged-only temp tsconfig | **No** | `typecheck-staged.mjs` includes *only staged files*, so it cannot see consumers of a changed type. No pre-push hook. |
| `vitest run` (714 tests) | `ai-task-verifier.yml` | **No** | **No** | Not in husky, not in `npm run verify` |
| `next build` | `ai-task-verifier.yml` + `ui-verify.yml` (×2 jobs) | No | **No** | 3 full builds per PR; `ai-task-verifier`'s build omits the Supabase env vars `ui-verify` supplies |
| Token contrast (WCAG AA) | `ui-verify.yml` | No | **No** | — |
| Visual regression (4 screenshot assertions) | `ui-verify.yml` | No | **No** | Covers only data-free routes (styleguide/marketing/legal/auth) |
| axe a11y scan | `ui-verify.yml` (`A11Y_DETERMINISTIC_ONLY=1`) | No | **No** | Authenticated routes excluded in CI |
| Shell-creators chrome audit (8 tests) | `ui-verify.yml` | No | **No** | — |
| Authenticated visual + a11y | `ui-verify.yml` | No | **No** | **Silently `exit 0`s** when `E2E_TEST_EMAIL`/`PASSWORD` secrets are absent (DEV-003 never completed). A skipped gate reads as green. |
| `tasks:reconcile:strict` | `ai-task-verifier.yml` | No | **No** | Non-code gate; 364 task IDs already waived via baseline |
| `validate-agent-docs` | `ai-task-verifier.yml` | No | **No** | Non-code gate (markdown links) |
| `validate-feature-index` | `ai-task-verifier.yml` | No | **No** | Non-code gate |
| `validate-related-files` | `ai-task-verifier.yml` | No | **No** | Non-code gate |
| `validate-shared-ui-allowlist` | `ai-task-verifier.yml` | No | **No** | Non-code gate; allowlist is a 1:1 mirror of disk |
| Prettier formatting | **nowhere** | No | No | No prettier config file exists; not in lint-staged |
| Migration correctness | **nowhere** | No | No | Hand-applied SQL |
| Runtime error detection | **nowhere** | No | No | No monitoring product installed |

### 1.1 Why CI does not block production (P0)

Evidence:
- `git status -sb` → `## master...origin/master [ahead 1]`; tip commits `bb0f32d3 TASK-720` and `f621c41b TASK-642` are **direct non-merge commits on `master`**.
- Both workflows trigger on `push: branches: [master]`, i.e. *after* the push that also triggers the Vercel production build.
- `vercel.json` uses only `ignoreCommand`; it consults changed **paths**, never CI status:
  ```
  skip_regex='^(src/docs/|\.cursor/|\.github/|sql/|scripts/seed-data/|codex_csv/|AGENTS\.md$|README\.md$|.*\.md$)'
  ```
- Branch protection could not be verified (`gh` is unauthenticated locally), but branch protection is irrelevant for commits pushed straight to `master` — which is the observed workflow.

**Net:** the only thing standing between a broken commit and production is the pre-commit hook, which runs ESLint on staged files and an unsound staged-only typecheck.

### 1.2 `next build --webpack` — no config reason found

Nothing in `next.config.ts` requires Webpack (only `images.remotePatterns`, `redirects()`, `headers()` — all Turbopack-compatible). The only trace of rationale is an archived note (`archive/AI_CHANGELOG_ARCHIVE.md:739`) about a **Turbopack dev parse error caused by Tippy**, and Tippy has since been replaced by Floating UI. The flag looks **stale**, and it is paid for 3× per PR plus every deploy.

---

## 2. TypeScript strictness

`tsconfig.json` — actual settings:

| Flag | Value | Consequence |
|---|---|---|
| `strict` | **true** | `noImplicitAny`, `strictNullChecks`, `strictFunctionTypes`, `useUnknownInCatchVariables` all on |
| `noUncheckedIndexedAccess` | **OFF** | `arr[i]` types as `T`, never `T \| undefined` |
| `exactOptionalPropertyTypes` | **OFF** | `{ x?: string }` accepts explicit `undefined`; `undefined` silently reaches Supabase payloads |
| `noImplicitOverride` | **OFF** | Silent method-shadowing (low impact — few classes) |
| `verbatimModuleSyntax` | **OFF** | Type-only imports can survive into runtime bundles |
| `noUnusedLocals` / `noUnusedParameters` | **OFF** | Delegated to ESLint (which does catch them) |
| `noPropertyAccessFromIndexSignature` | **OFF** | Typo-prone `obj.someKey` on index-signature types |
| `noFallthroughCasesInSwitch` | **OFF** | Silent switch fallthrough |
| `target` | **ES2017** | Dated for a Node 24 / evergreen-browser app; extra downleveling |
| `allowJs` / `skipLibCheck` | true / true | `.d.ts` conflicts hidden |
| `paths` | `@/* → ./src/*` | Correct |
| `include` | `next-env.d.ts`, `src/**/*.{ts,tsx}`, `.next/types/**`, `*.ts`, `*.mts` | **`public/`, `tests/`, `scripts/` are not in `include`** |

### 2.1 Verified error count

```
npx tsc --noEmit --incremental false   →  0 errors  (15.3s)
```

### 2.2 Escape-hatch counts (whole `src/`, 1,065 files)

| Escape hatch | Count | Notes |
|---|---|---|
| `as any` | **0** | |
| `: any` / `any[]` / `<any>` | **0** | |
| `@ts-expect-error` | **0** | |
| `@ts-ignore` | **0** | |
| `@ts-nocheck` | **0** | |
| `eslint-disable` (all forms) | **22** | 4 distinct rules only |
| Non-null `!` assertions | **~131** | regex-approximated |
| Unchecked index reads `[var]` | **1,078** | `noUncheckedIndexedAccess` exposure |
| Unchecked index reads `[0]`–`[9]` | **445** | same |
| `console.error` / `console.warn` | 65 / 11 | no `console.log`; **0 empty `catch {}`** |

This is the cleanest suppression profile I have measured in a repo this size. Why: `no-explicit-any` is downgraded to `warn` only under `src/app/(main)/admin/**`, but `npm run lint` runs `--max-warnings 0`, so **warnings are still hard failures**. The downgrade is cosmetic.

### 2.3 Concrete bug classes still allowed

Because `any` is gone, `noUncheckedIndexedAccess` is now the dominant remaining hole — **~1,523 index-read sites** are typed as non-optional. Verified live example:

```12:22:src/lib/tooltips/markdown-lite.tsx
  const lines = markdown.split('\n').map((line) => line.trimEnd());
  while (i < lines.length) {
    const line = lines[i];
```

`lines[i]` types as `string`, so `.startsWith(...)` on it typechecks even where the index can run past the end. The same shape recurs across `lib/game`, `lib/guided-creator`, and the 48 `.split(...)` call sites (`.split('-')[1]` is `string`, not `string | undefined`).

`exactOptionalPropertyTypes: false` is the second real risk given Supabase: `{ level?: number }` accepts `{ level: undefined }`, which serializes to `null` and can overwrite a stored column.

**Worst files for `!` assertions:** `lib/guided-creator/guided-equipment-l2.test.ts` (14 — a test, low risk), `components/character-sheet/library-entity-rows.tsx` (6), `components/character-creator/steps/archetype-step.tsx` (5), `components/shared/list-header.tsx` (4), `app/(main)/encounters/[id]/_components/combat/combat-encounter-helpers.ts` (4).

**Per-directory `!` distribution:** `app/(main)` 32 · `lib/guided-creator` 20 · `components/shared` 14 · `components/character-sheet` 11 · `lib/game` 9 · `components/character-creator` 9 · remainder ≤4 each.

---

## 3. Lint configuration

`eslint.config.mjs` extends `eslint-config-next/core-web-vitals` + `/typescript`, so `react-hooks/exhaustive-deps`, `jsx-a11y`, and `@typescript-eslint` defaults are inherited at their stock severities. Overrides:

| Override | Scope | Real effect |
|---|---|---|
| `@typescript-eslint/no-require-imports: off` | `scripts/**` | Fine — CJS scripts |
| `react-hooks/set-state-in-effect: warn`<br>`react-hooks/preserve-manual-memoization: warn`<br>`react-hooks/use-memo: warn` | `src/**` | **Still blocking** under `--max-warnings 0`. The inline comment says this keeps lint "actionable without blocking on style churn" — that is **factually wrong given the lint script**. |
| `@typescript-eslint/no-explicit-any: warn` | `src/app/(main)/admin/**` | Also still blocking; explains the 0-`any` count |
| `realms/no-raw-color: error` | `src/**` | Load-bearing design-token guardrail |
| `realms/no-raw-color: off` | `(auth)/**`, `components/auth/**`, `components/ui/**` | Documented exemptions; `components/ui/**` (124 files) is a large hole in a rule whose purpose is token discipline |
| `realms/no-raw-upload-fetch: error` | `src/**` | Load-bearing but very narrow |
| `RAW_COLOR_BACKLOG` ratchet | — | **Empty array.** Ratchet is complete. |

**Nothing important is disabled.** `exhaustive-deps` is at stock error severity with only 2 inline disables repo-wide. Import-cycle detection (`import/no-cycle`) is **absent** — not disabled, just never added; there is an ADR (`0010-lib-layer-dependency-direction.md`) asserting a layering rule with no tooling behind it.

### 3.1 `eslint-disable` breakdown (22 occurrences, 4 rules)

| Rule | Count | Verdict |
|---|---|---|
| `@next/next/no-img-element` | 11 | Legitimate for dynamic Supabase URLs, but 11 hand-rolled `<img>` tags means no shared remote-image component |
| `react-hooks/refs` | 4 | Floating UI ref-merge; genuine false positives |
| `@typescript-eslint/no-unused-vars` | 3 | Destructure-to-omit idiom; fine |
| `react-hooks/exhaustive-deps` | 2 | Both annotated with reasons |

### 3.2 Custom rules — load-bearing or theater?

- **`no-raw-color.mjs` (73 lines) — load-bearing.** Bans raw Tailwind palette/hex in class strings; the ratchet is empty, meaning the migration actually finished. Real value.
- **`no-raw-upload-fetch.mjs` (60 lines) — load-bearing but tiny.** Enforces one call site pattern (`fetch('/api/upload/…')` → `apiUpload`). Correctly written (AST-based, exempts the implementing module). Worth keeping; low leverage.
- **`raw-color-backlog.mjs` (14 lines) — dead.** `RAW_COLOR_BACKLOG = []`. Its own header says "at which point this file and the corresponding `eslint.config.mjs` override can be removed." Delete it and `scripts/list-raw-color-backlog.mjs` with it.

---

## 4. Test strategy

### 4.1 Unit tests (Vitest) — 123 files, 714 cases, 1,754 assertions

`vitest.config.ts` sets `environment: 'node'`. **No jsdom and no `@testing-library/*` is installed** (verified absent from `node_modules`). `render(` / `renderHook(` appear **0 times**.

> **Every one of the 714 tests is a pure-function/store test. There are zero component-render tests and zero hook tests** — in an app whose `src/components/` tree is the bulk of the codebase.

Distribution:

| Area | Files | Character |
|---|---|---|
| `lib/guided-creator` | 29 | Meaningful — layer/eligibility/budget logic |
| `lib` (root) | 18 | Meaningful |
| `lib/game` | 16 | **Highest-value** — game formulas, verified real assertions |
| `app/api` | 13 | **Meaningful integration-ish** — mocked Supabase, real status-code assertions |
| `lib/library` | 7 | Meaningful |
| `components/*` | 8 | Extracted helper modules, not rendering |
| `lib/utils`, `lib/calculators`, `lib/codex`, `lib/character` | 4 each | Meaningful |
| `stores`, `hooks`, `types`, `lib/glr`, `lib/chip`, others | 1–3 each | Mixed |

Hygiene: **0 `.skip`, 0 `.only`, 0 `.todo`, 0 snapshot assertions.** Only 2 files read repo source off disk.

**Meaningful vs change-detector.** Sampled 10 in full. Genuinely meaningful: `app/api/characters/route.test.ts` (401 / 415 / 400-Zod / 403-quota / success, with a hand-built Supabase mock), `lib/game/formulas.test.ts` (exact progression-table values), `stores/guided-creator-store.test.ts` (real reset semantics), `lib/calculators/*`.

The clear outlier is **`lib/glr/validate-glr-chrome-spacing.test.ts` (172 lines) driving `validate-glr-chrome-spacing.ts` (476 lines)** — a regex linter that reads repo `.tsx` files and string-matches JSX (`items-start`, `40px`, `rowChrome=`, class-name literals). It is a **change-detector**: it breaks on formatting or variable renames, passes on semantically-identical rewrites, and asserts nothing about rendered output. 648 lines of bespoke infrastructure that should be either an ESLint rule (AST-based, IDE feedback, autofixable) or a real visual assertion.

### 4.2 End-to-end (Playwright) — 19 tests, 49 assertions, 10 configs

| Spec | Tests | What it verifies |
|---|---|---|
| `screenshots.pw.ts` | — | 4 `toHaveScreenshot` over data-free routes × 2 themes × 3 breakpoints |
| `a11y.pw.ts` | — | axe scan, ratchet-baselined |
| `auth-screenshots` / `auth-a11y` | — | Same, authenticated — **silently skipped without secrets** |
| `shell-creators-audit` | 8 | DOM chrome assertions across 6 creator routes |
| `creator-ux-audit`, `site-copy-audit`, `guided-{skills,flaw,loadout,feat-cards}-audit` | ~11 | One-off review-screenshot dumps, not baselines |

**Critical paths with ZERO automated coverage:**

| Path | Unit | E2E | Note |
|---|---|---|---|
| Login / register / password reset | ❌ | ❌ | `loginAsTestUser()` exists only as a *fixture* to reach pages for screenshots; no test asserts auth outcome |
| Save a character (browser → API → DB → reload) | Route handler mocked ✅ | ❌ | No round-trip anywhere |
| Guided creator completion (the flagship flow) | Store/eligibility units ✅ | ❌ | No test walks L1→L3 to a saved character |
| Advanced creator completion | Partial | ❌ | — |
| Admin writes (codex, roles, users) | `admin/users` route ✅ | ❌ | Highest-blast-radius surface |
| Encounter/combat tracker | Helpers ✅ | ❌ | — |
| Image/portrait upload | ❌ | ❌ | 5 mutating upload routes with **no** validation helper and no tests |
| Payments | n/a | n/a | None in repo |

### 4.3 Flakiness signals

| Signal | Count |
|---|---|
| `page.waitForTimeout` | **21** across 10 files (worst: `guided-loadout-audit` 5, `shell-creators-audit` 4, `guided-flaw-audit` 3) |
| `waitUntil: 'networkidle'` | **16** (discouraged by Playwright; racy under React streaming) |
| `retries` in CI | 1 (core + shell-creators only; the 6 audit configs have **0**) |
| `test.skip` / `.only` left in | 0 |
| Conditional `testInfo.skip(true, …)` | **3** — all gated on missing E2E secrets |
| `maxDiffPixelRatio` | 0.02 — reasonable |

The 21 arbitrary sleeps are the dominant flake source, and 6 of 10 configs have no retry.

### 4.4 Visual/a11y baseline burden

**122 tracked baseline PNGs = 35.3 MB in git**, dual-platform (`-chromium-linux.png` + `-chromium-win32.png`, so **every baseline is stored twice**). 108 are `screenshots.pw.ts`, 10 auth, 4 chip-unification. Every intentional design change requires regenerating both platform sets; git history already contains a dedicated fix commit (`14dd3b1d fix(ci): refresh styleguide Linux visual baselines`). Recommendation: drop win32 baselines from git, treat Linux/CI as the only authority, and run local visual checks against the CI baselines in Docker.

### 4.5 Ten Playwright configs — yes, a liability

Six configs are **near-identical copies** differing only in `testMatch`: `creator-audit`, `feat-cards-audit`, `flaw-audit`, `guided-audit`, `loadout-audit`, `site-copy-audit` (561–747 bytes each; same `workers: 1`, `timeout: 120_000`, `reporter: [['list']]`, same `devices['Desktop Chrome']`).

Worse, **4 of them use `command: 'npm run dev'` with `reuseExistingServer: true`** — so they attach to whatever dev server happens to be running and may audit **stale code or a dev-only build**, directly contradicting the comment in the main `playwright.config.ts` ("Never reuse a stray server — always serve the build under test").

**Consolidation:** collapse to **2 configs** — `playwright.config.ts` (CI gate: screenshots + a11y + shell-creators, `npm run start`, `reuseExistingServer: false`) and `playwright.audit.config.ts` (one config, `testMatch: /-audit\.pw\.ts/`, `projects[]` or `--grep` to select a suite). Keep `playwright.auth.config.ts` for the storageState dependency chain. Net: **10 → 3 configs**, and the "stale dev server" class of false results disappears.

---

## 5. Dependencies

21 runtime deps, 20 devDeps, 48 top-level installed. **`npm audit`: 0 vulnerabilities** (with and without dev).

### 5.1 Unused / dead dependencies

| Package | Type | Evidence | Verdict |
|---|---|---|---|
| `@tailwindcss/forms` | dev | 0 mentions anywhere; **no `@plugin` directive in any `src/**/*.css`** — Tailwind v4 requires it | **Unused — remove** |
| `@tailwindcss/typography` | dev | Same | **Unused — remove** |
| `prettier-plugin-tailwindcss` | dev | **No prettier config file exists** (no `.prettierrc*`, no `prettier.config.*`, no `prettier` key in `package.json`), so Prettier 3 never loads the plugin | **Inert — remove or add config** |
| `cross-env` | dev | 0 file mentions, but used in `package.json` scripts | Keep |
| `dotenv` | dev | 7 files (`scripts/**`) | Keep |
| `@types/*` | dev | 0 mentions by design | Keep |

**All 21 runtime dependencies are imported by `src/`.** No unused runtime deps:
`lucide-react` 177 · `next` 166 · `react` 331 · `@tanstack/react-query` 36 · `class-variance-authority` 19 · `@supabase/supabase-js` 11 · `zustand` 5 · `next-themes` 5 · `@hookform/resolvers` 4 · `@supabase/ssr` 4 · `react-hook-form` 4 · `zod` 4 · `@floating-ui/react` 3 · `react-dom` 2 · `react-easy-crop` 2 · `@radix-ui/react-slot` 1 · `@upstash/ratelimit` 1 · `@upstash/redis` 1 · `@vercel/analytics` 1 · `clsx` 1 · `tailwind-merge` 1.

### 5.2 Security-sensitive / outdated

| Package | Current | Latest | Risk |
|---|---|---|---|
| **`@supabase/ssr`** | **0.8.0** | **0.12.4** | **4 minor versions behind on the library that handles session cookies and PKCE.** Highest-priority bump. |
| `@supabase/supabase-js` | 2.105.4 | 2.112.3 | 7 minors behind on the data/auth client |
| `next` | 16.2.12 | 16.3.0 | Framework patch/minor incl. security fixes |
| `react` / `react-dom` | 19.2.3 | 19.2.8 | 5 patches behind |
| `eslint-config-next` | 16.2.12 | 16.3.0 | Should track `next` |
| `lucide-react` | 0.562.0 | 1.31.0 | Major; 177 import sites — schedule deliberately |
| `typescript` | 5.9.3 | 7.0.2 | Major; do not rush |
| `eslint` | 9.39.4 | 10.8.1 | Major |
| `@playwright/test` | 1.61.1 | 1.62.1 | Keep in lockstep with the installed browser |
| `vitest`, `zustand`, `react-hook-form`, `@hookform/resolvers`, `@radix-ui/react-slot`, `tailwindcss`, `@tailwindcss/postcss`, `prettier`, `@floating-ui/react`, `@axe-core/playwright`, `@upstash/redis`, `@types/*` | — | — | Routine minor/patch drift |

`react-easy-crop` (5.5.7 → 6.2.3, 2 import sites) is the cheapest major to clear.

### 5.3 `overrides` — undocumented and will rot

```json
"overrides": { "postcss": "8.5.25", "sharp": "0.35.3" }
```

Neither is a direct dependency. Verified consumers:
- `postcss` — hoists a single 8.5.25 across `@tailwindcss/postcss@4.3.0`, `next@16.2.12`, and `vitest → vite@8.0.13`.
- `sharp` — pins `next`'s optional image-optimization dep.

Both are almost certainly leftovers from `133aa520 chore: apply npm audit fixes`. Audit is now clean, so **these pins are load-bearing for nothing verifiable** and will silently hold back a future security patch. Add a comment naming the advisory each one addresses, or drop them and re-run `npm audit`.

### 5.4 Missing / heavy

No dependency is used only transitively. Nothing is heavy for its value — `lucide-react` is tree-shaken, and there is no moment/lodash/chart-library bloat. `@upstash/*` (2 imports) buys durable cross-instance rate limiting and is worth it.

---

## 6. Repo hygiene

**Clean on the things that matter most.** `git ls-files` (1,559 files) shows **zero** tracked build artifacts: no `.next/`, no `*.tsbuildinfo`, no `test-results/`, no `playwright-report/`, no `node_modules` leftovers, no archives.

**No tracked secrets.** `.gitignore:59` is `.env*` with `!.env.example`; `git check-ignore -v` confirms both `.env` and `.env.local` are ignored. `.env.example` contains key names only. `admin_sdk_secrets.json` and `LOCAL_REFERENCE.md` are pre-emptively ignored.

Tracked distribution: `src` 1,157 · `tests` 141 · `sql` 105 · `public` 49 · `scripts` 44 · root 24 · `data` 14 · `.cursor` 11 · `codex_csv` 8 · `eslint-rules` 3 · `.github` 2 · `.husky` 1.

### 6.1 `public/tooltip-text.tsx` — application source served publicly (P1)

A **510-line TypeScript module imported by 53 files under `src/`** lives in `public/`:

```16:16:src/components/layout/header.tsx
import { navbarCodex, navbarLibrary } from '../../../public/tooltip-text';
```

It imports `@/types`, `@/types/abilities`, `@/types/core-rules`, `@/lib/game/formulas`. Three consequences:

1. **Next.js serves everything in `public/` verbatim** → `https://<site>/tooltip-text.tsx` returns raw application source, including its import graph. Unintentional source disclosure.
2. It is **outside `tsconfig.json`'s `include`**, so it is only typechecked incidentally (as an import target), never as a root.
3. 53 files reach it via `../../../public/tooltip-text` instead of the `@/` alias — brittle under any move.

**Fix:** move to `src/lib/constants/tooltip-text.ts` and rewrite imports to `@/lib/constants/tooltip-text`. Mechanical, high value.

### 6.2 Local cruft (correctly gitignored, ~8.7 MB)

| Dir | Files | Size | Tracked |
|---|---|---|---|
| `.shell-creators-audit/` | 27 | 4.3 MB | no |
| `.site-copy-audit/` | 8 | 1.9 MB | no |
| `reports/` | 2 + subdir | 1.2 MB | `task-reconcile-report.json` ignored |
| `backups/` | 3 | 1.2 MB | no |
| `test-results/` | 1 | ~0 | no |
| `data/`, `codex_csv/` | 14, 8 | 20 KB, 443 KB | **tracked — legitimate** (core-rules JSON + codex parity CSVs) |

`.gitignore` already lists 6 audit-screenshot dirs individually (`.creator-audit-screenshots/`, `.site-copy-audit/`, `.shell-creators-audit/`, `.guided-flaw-audit/`, `.guided-loadout-audit/`, `.ability-tag-audit/`) — a symptom of the per-suite-config sprawl. One `/.audit-*/` pattern would replace all six.

### 6.3 Abandoned scripts — 14 of 35 are dead one-shots

`run-task-649-phase2.mjs`, `run-task-650.mjs`, `verify-task-649.mjs`, `verify-task-650.mjs`, `migrate-fg-tokens.mjs`, `migrate-primary-tokens.mjs`, `fix-mojibake-639.py` (336 lines), `slim-task-queue.js`, `list-raw-color-backlog.mjs` (backlog now empty), `check-feats-ids.js`, `sync-feat-tags-csv.js`, `guided-creator-screenshots.mjs`, `session_submit.js`, `smoke-realms-images-api.js`. None are referenced by `package.json` or CI. ~1,000 lines of completed-migration residue; git history preserves them.

---

## 7. Agent-process overhead

### 7.1 Footprint

| Metric | Value |
|---|---|
| Files in `src/docs/ai/` | **76** |
| Lines in `src/docs/ai/` | **36,806** (2.9 MB) |
| All of `src/docs/` | 98 files / **44,052 lines** |
| Docs as share of app-code volume | **~27%** of ~164k lines |
| `BUILD_VALIDATION.md` alone | **5,023 lines**, 56 headings, ~1,392 steps, 30+ `DEV-V-###` scenarios — **100% manual** |
| Archive | 35 files, **768 archived task blocks** |
| ADRs | 14 |
| `guide/` appendices | 8 |
| Live task blocks | 4 active + 12 waiting |
| Process scripts | 8 (`reconcile`, `validate-docs`, `validate-index`, `validate-related`, `validate-shared-ui`, `generate-index`, `triage`, `extract_feedback`) |

### 7.2 Measured cost per change (last 30 days)

| Metric | Value |
|---|---|
| Commits touching app code | 202 |
| Commits touching `src/docs/ai/` | 264 |
| Commits touching **both** | 185 |
| **App-code commits that also had to edit agent docs** | **185 / 202 = 91.6%** |
| **Doc-only commits (zero app code)** | **79** |
| Doc lines added | 53,806 |
| App-code lines added | 119,490 |
| **Doc-churn ratio** | **1 doc line per 2.2 code lines** |
| Median doc files per feature commit | **7** (~28% of files in a typical commit) |

Sampled per-commit file counts make it concrete: `bb0f32d3` 17 files (7 docs) · `f621c41b` 30 (14) · `0725b42f` 75 (14) · `bc12c4bb` 30 (8) · `b2d6b771` 117 (16). And a class of commits exists **purely** to satisfy tooling: `db2462b0 chore: Regenerate FEATURE_INDEX_BARRELS…` (1 file), `1cd9cf05 chore(TASK-698): Add filter-native-select to shared-ui allowlist` (1 file), `fb21fa87 chore: Update task-reconcile-report…`, `22a78343`, `e74baca3`, `88f4683f`.

### 7.3 Gates that fail for non-code reasons — 5 of 15 CI gates

| Gate | Fails when | Enforced by tooling? | Signal value |
|---|---|---|---|
| `reconcile_tasks.js --strict --strict-since=2026-07-15` | A `done` task has no commit whose **message** contains its `TASK-###` | Yes | **Low.** `scripts/task-reconcile-baseline.json` already waives **364 TASK IDs** via `done_without_commits`. The gate mostly enforces commit-message formatting. |
| `validate-agent-docs.js` | A markdown link in any of 13 files resolves to a missing path | Yes | Low–medium |
| `validate-feature-index.js` | `FEATURE_INDEX.md` lists a deleted path, **or** the generated barrel inventory is stale | Yes | **Low.** Second half is "did you run `tasks:generate-index`". |
| `validate-related-files.js` | An open task's `related_files` names a nonexistent path | Yes | Low |
| `validate-shared-ui-allowlist.js` | A new file appears in `src/components/shared\|ui` and is not in a JSON allowlist | Yes | **Lowest.** The allowlist holds **124 entries for exactly 124 files on disk** — a literal 1:1 mirror, regenerable with `--write`. It cannot detect a bad abstraction, only a forgotten `--write`. Combined with the ADR requirement, **adding one shared component costs 3 artifacts** (component, allowlist entry, ADR). |

So a PR that is functionally perfect can be blocked by: a stale markdown link, a renamed file still listed in a task's `related_files`, a forgotten `--write`, a stale generated barrel file, or a commit subject missing `TASK-###`.

### 7.4 Docs that contradict verifiable code

| Doc / comment | Claim | Reality |
|---|---|---|
| `eslint.config.mjs:34-35` | React Compiler rules kept as `warn` "so `npm run lint` stays actionable **without blocking**" | `lint` = `eslint . --max-warnings 0` → **warnings block**. Same for the admin `no-explicit-any: warn`. |
| `.cursor/rules/realms-project.mdc` | "**Before PR / push to master:** `npm run build` + `npm run tasks:validate`" | Convention only. `.husky/` contains **one hook** (`pre-commit` → `npx lint-staged`). No pre-push hook exists. |
| `ui-verify.yml:11` | "**All steps are required (no continue-on-error)**" | The authenticated visual/a11y step **`exit 0`s** when E2E secrets are absent — it is required but vacuous. |
| `package.json:40` `db:migrate` | Presented as a migration command | `echo Run SQL in Supabase Dashboard.` — no migration exists |
| `playwright.config.ts:11-13` | "Playwright **ALWAYS** launches its own `npm run start` … can never silently test a stale server" | True for that config; **4 sibling configs** use `npm run dev` + `reuseExistingServer: true` and do exactly what this warns against |
| `raw-color-backlog.mjs:8-10` | "DELETE entries as files are migrated … end-state is an empty array, at which point this file … can be removed" | Array **is** empty; file and override still present |
| `AGENTS.md` DoD | "Build + targeted tests … + changelog" as Definition of Done | None of it is enforced at commit or push time; CI runs after the fact |
| `npm run verify` | Reads as the umbrella pre-flight check | Runs build + contrast + lint + visual + a11y — **omits `typecheck` and `vitest`** |

### 7.5 Cost estimate

For one typical feature change, the agent must touch: the code, `ACTIVE_TASKS.md`, `archive/TASK_QUEUE_DONE.md`, `AI_CHANGELOG.md`, `BUILD_VALIDATION.md`, possibly `FEATURE_INDEX.md` + `FEATURE_INDEX_BARRELS.generated.md`, possibly `shared-ui-allowlist.json` + an ADR, possibly `DEVELOPER_TASK_QUEUE.md`, plus a `TASK-###`-bearing commit subject — **a measured median of 7 doc files, ~28% of the commit**. On top of that, **79 doc-only commits in 30 days** were pure bookkeeping.

Against that: the process has genuinely produced a clean codebase (0 `any`, 0 suppressions, 0 tsc errors, 714 tests). The problem is not that the process exists — it is that **the process is more rigorously enforced than production safety**. Five CI gates protect markdown consistency; **zero** protect against a broken deploy, an unmonitored runtime error, or a 114-day-old backup.

### 7.6 Keep / merge / delete

**Keep (high value, low cost):** `ARCHITECTURE_CONSTITUTION.md` (77 lines) · `ACTIVE_TASKS.md` (120) · `WAITING_TASKS.md` (270) · `GAME_RULES.md` · `SUPABASE_SCHEMA.md` · `DESIGN_SYSTEM.md` · `ADR/` (14 files — real decision records) · `AGENTS.md` · the `.cursor/rules/*.mdc` pointers.

**Merge:**
- `UI_UNIFICATION_PLAN.md` (153) + `CHIP_UNIFICATION_PLAN.md` (166) + `VISUAL_STATE_AUDIT.md` (94) + `GUIDED_EQUIPMENT_PHASED_SPEC.md` (58) → one `IN_FLIGHT_PLANS.md`, deleted per section as it lands. These are finished-migration status pages.
- `REMEDIATION_STATUS_2026-06.md` (27) + `REMEDIATION_STATUS_2026-08.md` (63) → one rolling file.
- `AI_TASK_QUEUE.md` (23) + `AI_REQUEST_TEMPLATE.md` (69) + `PR_CHECKLIST.md` (34) + `AGENT_GUIDE.md` (43) → one `PROCESS.md` (~120 lines). Four files this small are pure indirection.
- **`BUILD_VALIDATION.md` (5,023 lines) → cap at the ~10 currently-shipping `DEV-V` scenarios (~400 lines)** and move the other 20+ to `archive/`. Nobody re-runs a manual QA script for a feature that shipped four months ago.

**Delete:**
- `FEATURE_INDEX_BARRELS.generated.md` (271) — generated from barrels; the barrels are the source of truth and the IDE reads them faster. Removing it also deletes a CI gate and the `chore: Regenerate…` commit class.
- `eslint-rules/raw-color-backlog.mjs` + its `eslint.config.mjs` override + `scripts/list-raw-color-backlog.mjs` — ratchet complete.
- `scripts/validate-shared-ui-allowlist.js` + `scripts/shared-ui-allowlist.json` (124 lines) — a 1:1 disk mirror. If the intent is "new shared UI needs an ADR," a PR-description checkbox costs nothing and catches the same thing.
- `scripts/validate-related-files.js` — 12 waiting + 4 active tasks do not need a CI gate.
- 14 one-shot task scripts (§6.3).
- `scripts/task-reconcile-baseline.json` — 364 waived IDs; with `--strict-since` already set to 2026-07-15 the baseline is redundant.

**Net effect:** ~10,000 lines of process docs removed, 5 non-code CI gates → 1 (`reconcile:strict`, kept because commit↔task traceability is genuinely useful), and 3 fewer doc files per feature commit.

---

## 8. Build & deploy

### 8.1 Vercel

`vercel.json` is 4 lines: `$schema` + `ignoreCommand: "bash scripts/vercel-ignore-build.sh"`. No `regions`, no `functions` config, no `crons`.

`scripts/vercel-ignore-build.sh` (27 lines) skips deploys for doc/agent-only commits — a smart Hobby-tier rate-limit saver. Two flaws:
- The regex's `.*\.md$` alternative makes the earlier `sql/`, `.github/`, `codex_csv/` clauses partly redundant.
- **`tests/`, `playwright.*.config.ts`, and `eslint-rules/` are not in the skip list**, so test-only commits burn a full production build.

`next.config.ts` security posture is solid: full CSP, HSTS with preload, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, and an immutable 1-year cache on `/images/*`. `script-src` carries `'unsafe-inline' 'unsafe-eval'` (a Next.js practicality, worth revisiting with a nonce). No `ignoreBuildErrors` and no `eslint.ignoreDuringBuilds` — good.

`src/proxy.ts` (Next 16's renamed middleware) refreshes the Supabase session at the edge and deliberately excludes high-volume public routes to stay in free tier.

### 8.2 Env var management

`.env.example` documents 12 keys across 4 groups (Supabase, DB connection, E2E, optional Upstash) with inline provenance comments. Good practice. `.env` / `.env.local` are ignored and were not read.

Inconsistency: `ui-verify.yml` passes `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` to its builds; **`ai-task-verifier.yml` runs `npm run build` with no env at all.** Either that build is validating a different configuration than production, or the vars are unnecessary in `ui-verify` — either way one of the two is wrong.

Also: **3 full `next build` runs per PR** (ai-task-verifier ×1, ui-verify ×2). With `--webpack` that is the dominant CI cost. `actions/setup-node` caching is enabled in `ui-verify.yml` but **omitted in `ai-task-verifier.yml`** (no `cache: 'npm'`), so that job re-resolves the whole tree every run.

### 8.3 Migrations — no automation, no drift detection (P1)

- `npm run db:migrate` → `echo Run SQL in Supabase Dashboard. See sql/README.md…`
- **105 tracked files in `sql/`** (including an `archive/` of superseded scripts), applied manually.
- **No `supabase/` directory, no `config.toml`, no `supabase/migrations/`, no Supabase CLI dependency.** No shadow-database diff, no drift check, no ordering guarantee, no rollback path.
- Nothing verifies that `src/docs/SUPABASE_SCHEMA.md` matches the live database, or that every `sql/` file was actually applied.

For a live app with user data, this is the highest-variance part of the stack: a hand-applied statement in the Dashboard is unversioned, unreviewed, and unrepeatable across environments. There is also no separate staging database — previews and production share whatever the env vars point at.

### 8.4 Backups — manual-only, 114 days stale (P0)

```
backups/supabase-20260421-101209/  schema.sql (0.23 MB)  data.sql (0.99 MB)  roles.sql (0.01 MB)
Last write: 2026-04-21 10:12
```

- **The most recent backup is 114 days old** (today: 2026-08-13).
- `db:backup` is `powershell -File scripts/supabase-backup.ps1` (151 lines) — requires the owner's Windows machine, `pg_dump`, and `DIRECT_URL`.
- `storage:backup` (94 lines) pulls the `portraits` / `profile-pictures` buckets — same manual constraint.
- **No `crons` in `vercel.json`, no `src/app/api/cron/*`, no scheduled GitHub Action.** Verified: zero `cron`/`schedule` references in `vercel.json` or either workflow.

Whether Supabase's own PITR/daily snapshots are enabled is a Dashboard setting not visible from the repo — but the repo-side story is "a human remembers to run a PowerShell script," and the evidence says that last happened in April.

### 8.5 Observability — none (P0)

| Capability | Status |
|---|---|
| Error monitoring | **None.** Zero matches for `sentry`, `datadog`, `logrocket`, `bugsnag`, `posthog`, `opentelemetry`, `@vercel/otel`, `newrelic` across the repo (the 3 hits are a game trait literally named "Sentry" in codex CSVs, plus a lockfile substring). |
| Structured logging | None. 65 `console.error` + 11 `console.warn`, unaggregated. |
| Analytics | `@vercel/analytics` — `<Analytics />` in `src/app/layout.tsx:99`. Pageviews only. |
| Speed Insights / Web Vitals | Not installed. |
| Uptime / alerting | None in repo. |
| Session replay | None. |

**Nobody finds out when a user hits a 500.** A rate-limiter misfire, an RLS denial, or a Supabase timeout in `POST /api/characters` produces a `console.error` in a serverless log nobody tails. For a product whose core promise is "your character is saved," this is the single highest-value gap relative to effort — `@sentry/nextjs` is roughly an hour of work.

---

## 9. Prioritized findings

### P0 — a broken, insecure, or unrecoverable production state is reachable

| # | Finding | Evidence | Fix |
|---|---|---|---|
| **P0-1** | **No gate blocks a broken deploy.** Vercel builds on push to `master`; both workflows run in parallel on that same push; work lands directly on `master`. | `git status -sb` → `ahead 1`; `bb0f32d3`/`f621c41b` are direct non-merge commits; `vercel.json` gates on paths only | Require PRs to `master` + branch protection with `static-gates`, `visual-a11y`, `verify` as required checks. Interim (1 line): add `.husky/pre-push` running `npm run typecheck && npm test`. |
| **P0-2** | **Zero error monitoring.** | 0 matches for any APM/error product; 65 unaggregated `console.error` | Install `@sentry/nextjs` (client + server + edge), alert on new issues. |
| **P0-3** | **Backups are manual and 114 days stale.** | `backups/` newest = 2026-04-21; no `crons`, no cron routes, no scheduled workflow | Add a scheduled GitHub Action (or Vercel cron) running `pg_dump` to object storage daily; verify Supabase PITR is on; alert on failure. |

### P1 — major coverage gap on a critical path, or real bug-class exposure

| # | Finding | Evidence | Fix |
|---|---|---|---|
| **P1-1** | **No functional e2e on any critical path.** Login, save-character, guided-creator completion, admin writes, uploads all unverified end-to-end. | 19 Playwright tests, all visual/a11y/chrome; `loginAsTestUser` is a screenshot fixture | Add 3 specs: login→dashboard, guided creator L1→save→reload assert, character-sheet edit→persist. |
| **P1-2** | **Authenticated CI gate silently passes when secrets are missing.** | `ui-verify.yml:76-79` `exit 0`; 3 `testInfo.skip(true, …)` | Set the DEV-003 secrets and make the step fail if they are absent. |
| **P1-3** | **No migration automation or drift detection.** | `db:migrate` is an `echo`; 105 hand-applied SQL files; no `supabase/migrations/` | Adopt Supabase CLI migrations; add a CI `db diff --check` for drift. |
| **P1-4** | **`public/tooltip-text.tsx` — 510 lines of app source served publicly**, imported by 53 `src/` files, outside `tsconfig` `include`. | `git ls-files public` | Move to `src/lib/constants/tooltip-text.ts`; rewrite to `@/` imports. |
| **P1-5** | **`noUncheckedIndexedAccess` off** with ~1,523 unchecked index reads. Live example: `lines[i].startsWith()` in `markdown-lite.tsx`. | `tsconfig.json` | Enable; fix fallout incrementally (`??` defaults). Highest single-flag ROI now that `any` is gone. |
| **P1-6** | **`@supabase/ssr` is 4 minor versions behind (0.8.0 → 0.12.4)** — session-cookie/PKCE handling. | `npm outdated` | Bump `@supabase/ssr` + `supabase-js` + `next` promptly. |
| **P1-7** | **Zero component/hook render tests.** No jsdom, no `@testing-library`. | `vitest.config.ts` `environment: 'node'`; 0 `render(` | Add jsdom + `@testing-library/react`; start with the guided creator steps. |
| **P1-8** | **`exactOptionalPropertyTypes` off** — `{ x: undefined }` can null out Supabase columns. | `tsconfig.json` | Enable after P1-5. |

### P2 — maintenance burden and duplication

| # | Finding | Evidence |
|---|---|---|
| **P2-1** | **10 Playwright configs; 6 are copy-paste**, and 4 use `npm run dev` + `reuseExistingServer: true` (can audit stale/dev code). | §4.5 — consolidate to 3 |
| **P2-2** | **Agent-process tax:** 76 files / 36,806 lines; 91.6% of app-code commits also edit `src/docs/ai/`; 79 doc-only commits in 30 days; median 7 doc files per commit. | §7.2 |
| **P2-3** | **5 CI gates fail for non-code reasons**; `shared-ui-allowlist.json` is a 1:1 mirror of 124 files; `task-reconcile-baseline.json` waives 364 IDs. | §7.3 |
| **P2-4** | **`BUILD_VALIDATION.md` = 5,023 lines** of 100%-manual QA across 30+ shipped scenarios. | §7.1 |
| **P2-5** | **35.3 MB / 122 baseline PNGs**, every baseline stored twice (`-linux` + `-win32`). | §4.4 — drop win32 from git |
| **P2-6** | **648 lines of source-string regex linting masquerading as a unit test** (`validate-glr-chrome-spacing.{ts,test.ts}`). | §4.1 — convert to an ESLint rule |
| **P2-7** | **21 `waitForTimeout` + 16 `networkidle`** waits; 6 of 10 configs have 0 retries. | §4.3 |
| **P2-8** | **3 full `next build`s per PR**; `ai-task-verifier.yml` lacks `cache: 'npm'` and builds without Supabase env vars. | §8.2 |
| **P2-9** | **3 inert devDeps** (`@tailwindcss/forms`, `@tailwindcss/typography`, `prettier-plugin-tailwindcss`); **no Prettier config exists** and Prettier is not in lint-staged → formatting unenforced. | §5.1 |
| **P2-10** | **`overrides` (postcss, sharp) undocumented** with `npm audit` now clean — will silently block future patches. | §5.3 |
| **P2-11** | **14 of 35 scripts are dead one-shots** (~1,000 lines). | §6.3 |
| **P2-12** | **`typecheck-staged.mjs` is unsound** — temp tsconfig `include`s only staged files, so consumers of a changed type go unchecked. No pre-push hook. | §1 |
| **P2-13** | **`npm run verify` omits `typecheck` and `vitest`** despite reading as the umbrella check. | §7.4 |
| **P2-14** | **`realms/no-raw-color` is off for all 124 files in `components/ui/**`** — the largest surface for the rule it was written for. | §3 |
| **P2-15** | **No import-cycle detection** (`import/no-cycle` absent) despite ADR-0010 asserting layer direction. | §3 |
| **P2-16** | **5 mutating upload/image routes have no shared validation helper** (`images/*`, `upload/portrait`, `upload/profile-picture`) and no tests, vs 15/20 mutating routes that do. | §4.2 |

### P3 — nits

- `target: ES2017` is dated for Node 24 + evergreen browsers (`ES2022` is safe).
- `next build --webpack` has no verifiable justification; the archived Turbopack blocker (Tippy) no longer exists. Turbopack would cut all 3 CI builds.
- `verbatimModuleSyntax`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`, `noFallthroughCasesInSwitch` all off (low impact at current code quality).
- `vercel-ignore-build.sh` does not skip `tests/` or `playwright.*.config.ts` → test-only commits burn a production build.
- `.gitignore` lists 6 audit-screenshot dirs individually; one `/.audit-*/` pattern suffices.
- 11 hand-rolled `<img>` tags with `no-img-element` disables suggest a missing shared remote-image component.
- `tsconfig.json` `include` covers `*.ts`/`*.mts` at root but not `scripts/**` or `tests/**` (Playwright configs are checked via `*.ts`; `tests/**/*.ts` is not).
- `react-easy-crop` 5.5.7 → 6.2.3 is the cheapest available major (2 import sites).

---

## 10. The one recommendation that matters most

**Invert the enforcement asymmetry.** Today five CI gates protect markdown-link integrity and JSON-allowlist freshness, while **zero** gates protect against a broken deploy, an unmonitored 500, or an unrecoverable database. Spend one day:

1. Branch protection on `master` with `static-gates` + `visual-a11y` + `verify` required, plus a `.husky/pre-push` running `npm run typecheck && npm test` (**P0-1**).
2. `@sentry/nextjs` installed and alerting (**P0-2**).
3. A scheduled daily `pg_dump` workflow that fails loudly (**P0-3**).
4. Delete `validate-shared-ui-allowlist`, `validate-related-files`, and `FEATURE_INDEX_BARRELS.generated.md` + its gate; truncate `BUILD_VALIDATION.md` to in-flight scenarios; consolidate 10 Playwright configs to 3.

That trades roughly 10,000 lines of process bookkeeping and 4 non-code gates for the three controls that actually stand between this app and a bad day.
