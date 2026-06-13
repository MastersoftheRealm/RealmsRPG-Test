# RealmsRPG Full-Site & AI-Workflow Audit — 2026-06

> **Scope:** Whole-repository audit of (1) the codebase and (2) the AI/Cursor working process, treating AI-agent pathologies as a first-class category.
> **Stack (current, authoritative):** Next.js 16 (App Router) · React 19 · Tailwind v4 · Supabase (PostgreSQL, Auth, Storage) · Vercel. **No Prisma. No Firebase.**
> **Supersedes:** `ai/archive/CODEBASE_AUDIT_2026-02-13.md` and `ai/archive/UNIFICATION_AUDIT_2026-02-20.md` (both stale; still reference Prisma/Firebase).
> **Method:** `tsc`, `eslint`, `knip`, `ts-prune`, `jscpd`, file-size census, targeted greps, Supabase advisors (security + performance), Vercel project/deploy inspection.
> **Companion:** [`SYSTEMATIC_AUDIT_2026-06.md`](SYSTEMATIC_AUDIT_2026-06.md) — exhaustive page-by-page / area-by-area walkthrough of the running site (20 areas, 10-lens rubric).

---

## How to read this document

Every finding carries a **disposition**:

- **[SAFE-FIX]** — applied in this pass (low risk: dead code with zero importers, stale comments, doc drift, queue/changelog hygiene). Gated by zero-import grep + `tsc --noEmit` + `npm run build`.
- **[QUEUED → TASK-###]** — riskier/larger; tracked in `AI_TASK_QUEUE.md`, not changed here.
- **[NOTE]** — informational / accepted-as-is.

Baseline at audit time: `tsc --noEmit` **passes (0 errors)**; `eslint` **1 error, 324 warnings**; `jscpd` token duplication **0.46%** (structural duplication is much higher — see Pathology B); all Vercel deployments **READY**; all 35 Supabase public tables have **RLS enabled**.

---

## Part 1 — AI-Agent Pathology Taxonomy (first-class)

These are the failure modes that recur when many AI agents build one codebase across many sessions. Each is a lens, not a silo; a single file may appear under several.

### Pathology A — Context loss / re-implementation
*An agent rebuilds something that already exists because it didn't know (or forgot) it was there.*

| # | Finding | Evidence | Disposition |
|---|---------|----------|-------------|
| A-1 | Two creator load-modal state hooks. `useCreatorLoad` (`src/hooks/use-creator-load.ts`) was built, then superseded by `useLoadModalLibrary` (`src/hooks/use-load-modal-library.ts`); all 4 creators use the latter. `useCreatorLoad` has **zero app imports**. | knip "unused exports"; grep `useCreatorLoad(` → 0 call sites | **[SAFE-FIX]** delete |
| A-2 | Parallel official/user enhanced-item hooks: `use-enhanced-items.ts` + `use-official-enhanced-items.ts` follow the same shape; the official one is only used by one admin tab and isn't in the barrel. | recon report | **[QUEUED → TASK-313]** unify |
| A-3 | Library browse tabs vs admin public-library tabs are near-duplicates (`LibraryPowersTab` 3,567 L ≈ `AdminPublicPowersTab` 3,490 L; same grid, `derivePowerDisplay`, `usePowerParts`). Same story for Codex vs Admin tabs (`CodexFeatsTab` 3,534 L ≈ `AdminFeatsTab`). | jscpd + recon | **[QUEUED → TASK-314]** extract shared list renderer |
| A-4 | Duplicated "My Codex not available" empty-state copy hand-written in `CodexFeatsTab`, `CodexPartsTab`, `CodexPropertiesTab`, `CodexCreatureFeatsTab` instead of reusing `CodexMyCodexEmpty`. | grep "For now, use Realms Codex" | **[QUEUED → TASK-314]** |

### Pathology B — Half-finished migrations / renames
*Old and new names coexist; the rename was never completed.*

| # | Finding | Evidence | Disposition |
|---|---------|----------|-------------|
| B-1 | `public` → `official` rename half-done. `/api/public/[type]` and `/api/official/[type]` both exist; `use-public-library.ts` exports `useOfficialLibrary` with `@deprecated usePublicLibrary` alias; `library-service.ts` keeps 4 `*Public*` aliases. ~15 call sites still import the deprecated names. | knip "Duplicate exports"; grep | **[QUEUED → TASK-315]** finish rename + delete `/api/public` |
| B-2 | `use-rtdb.ts` is misnamed — it holds Supabase **Codex** entity types (`PowerPart`, `Feat`, `Species`, …) and trait resolvers, not RTDB anything. Imported by 10+ files. | file header L1–6 "Legacy file name … retained" | **[QUEUED → TASK-316]** rename to `codex-types.ts` / move into `src/types/` |
| B-3 | Library-service deprecated alias quartet (`fetchPublicLibrary`, `findPublicLibraryItemByName`, `addPublicItemToLibrary`, `saveToPublicLibrary`) — never imported anywhere. | knip; grep | **[SAFE-FIX]** delete the 4 aliases (keep `*Official*`) |

### Pathology C — Cargo-cult / stale-stack artifacts
*Comments and code referencing stacks that no longer exist (RTDB, Firestore, Firebase, Prisma, Cloud Functions).*

| # | Finding | Evidence | Disposition |
|---|---------|----------|-------------|
| C-1 | ~22 stale stack comments across ~20 files (e.g. `use-rtdb.ts` L4 "Data from use-codex (Prisma)"; `item-creator/page.tsx` L7–11 "RTDB database … Cloud Functions"; `my-account/page.tsx` L5 "Prisma"; `campaign-roll.ts` "stored in Prisma"; `roll-log.tsx` L67 "Firestore ({ seconds })"). | grep RTDB\|Prisma\|Firestore\|Firebase\|Cloud Functions | **[SAFE-FIX]** scrub/correct comments |
| C-2 | `use-codex.ts` L5 "Replaces use-firestore-codex." — dangling reference to a deleted file. | grep | **[SAFE-FIX]** remove note |
| C-3 | `types/auth.ts` `uid` "Alias for id (Firebase compatibility)" — `uid` is used pervasively across APIs, so it is **kept**, but the comment is updated to "legacy alias, not Firebase." | grep | **[SAFE-FIX]** comment only |

### Pathology D — Accretion / god files
*Each agent appended rather than refactored; files grew without bound.*

Top files by line count (verified census; bracketed route files measured separately):

- `add-library-item-modal.tsx` — **4,762**
- `characters/[id]/page.tsx` — **4,200**
- `LibraryPowersTab.tsx` — **3,567**
- `CodexFeatsTab.tsx` — **3,534**
- `AdminPublicPowersTab.tsx` — **3,490**
- `codex-server.ts` — **3,451**
- `AdminFeatsTab.tsx` — **3,415**
- `CodexSpreadsheetView.tsx` — **3,313**
- `CharacterSheetModals.tsx` — **3,226**
- `unified-selection-modal.tsx` — **3,121**

| # | Finding | Disposition |
|---|---------|-------------|
| D-1 | `characters/[id]/page.tsx` is a 4,200-line "page-as-controller": auth, autosave, enrichment, roll context, tab routing, portrait upload, campaign visibility, heavy prop-drilling into `library-section.tsx` (1,686 L) and `CharacterSheetModals.tsx`. A `character-sheet-context.tsx` already exists but `useCharacterSheet` is unused. | **[QUEUED → TASK-317]** adopt the existing context; split tabs into modules |
| D-2 | `add-library-item-modal.tsx` (4,762 L) bundles fetch + filter + sort + per-type branches + enrichment + selection. | **[QUEUED → TASK-318]** extract hook + per-type subcomponents |
| D-3 | `codex-server.ts` (3,451 L) — all codex fetchers + row→record mappers in one module (currently dead; see E-2). | folded into **[SAFE-FIX]** deletion (E-2) |

### Pathology E — Dead code (zero importers)
*Verified non-reachable code left behind by superseded approaches.*

| # | File / export | Verification | Disposition |
|---|---------------|--------------|-------------|
| E-1 | `src/lib/server.ts` | grep `@/lib/server` → 0 importers | **[SAFE-FIX]** delete |
| E-2 | `src/lib/codex-server.ts` (3,451 L) + `src/lib/character-server.ts` | imported only by dead `lib/server.ts` | **[SAFE-FIX]** delete (dead chain) |
| E-3 | `src/app/actions.ts` + `src/app/(main)/characters/actions.ts` + `src/app/(main)/library/actions.ts` | `app/actions.ts` re-exports the other two; nothing imports `@/app/actions`; the two action files import only into it | **[SAFE-FIX]** delete cluster (gated by build) |
| E-4 | `src/services/game-data-service.ts` | referenced only by `services/index.ts` barrel | **[SAFE-FIX]** delete + drop barrel line |
| E-5 | `src/hooks/use-creator-load.ts` | see A-1 | **[SAFE-FIX]** delete + drop barrel line |
| E-6 | `src/hooks/use-creator-cache.ts` (guest creator localStorage cache) | knip; 0 call sites | **[SAFE-FIX]** delete + drop barrel lines |
| E-7 | `src/app/api/session/route.ts` | header "Compatibility stub … legacy callers"; grep `/api/session` → 0 | **[SAFE-FIX]** delete |
| E-8 | `src/lib/game/progression.ts`, `src/lib/utils/array.ts` | knip unused files; grep → 0 | **[SAFE-FIX]** delete (gated) |
| E-9 | Unused shared exports: `SortHeader`/`SortHeaderRow` (`list-components.tsx`), `ItemList` (`item-list.tsx`), `EquipmentListSection` (`entity-library-sections.tsx`), `ChoiceTraitOptionSelect`, `prefetchFunctions` (`use-codex.ts`), `LoadFromLibraryModalLegacy` branch | knip; recon | **[QUEUED → TASK-319]** remove unused exports + legacy modal branch (touches large shared files; verify each) |
| E-10 | `src/components/shared/error-boundary.tsx` — built but never mounted | knip; grep | **[QUEUED → TASK-320]** either mount around character sheet/creators/library, or remove |

> Note: knip also lists ~300 "unused exports" and ~340 "unused exported types." The vast majority are **barrel re-exports** (`index.ts`) kept as intentional public API — false positives. Only the individually verified items above are actioned.

### Pathology F — Doc / instruction drift & contradiction
*Sources disagree; an agent following the wrong one is led astray.* (Detail in Part 3.)

| # | Finding | Disposition |
|---|---------|-------------|
| F-1 | `src/docs/README.md` L21 "Admin access (env vars only)" contradicts `ADMIN_SETUP.md` (role in `user_profiles`). `ADMIN_EDIT_AUDIT.md` L24 also says "admin via env." | **[SAFE-FIX]** correct both |
| F-2 | `AGENT_GUIDE.md` "Recording Progress" points audits at `src/docs/ai/*.md` but they live in `ai/archive/`. | **[SAFE-FIX]** fix paths |
| F-3 | `.cursor/rules/realms-project.mdc` lists `manmade-react-site-reference-only/` — directory was removed. | **[SAFE-FIX]** remove line |
| F-4 | `DATABASE_CODEX_AUDIT.md` §1 describes JSONB `{id,data}` seeding; reality is columnar (Path C). | **[SAFE-FIX]** add superseded note |

### Pathology G — Task-state drift
*Process bookkeeping diverges from reality.*

| # | Finding | Disposition |
|---|---------|-------------|
| G-1 | `AI_TASK_QUEUE.md` is ~7,389 lines / 100 tasks, **92 done**, loaded as a primary session source. Done tasks should be archived. | **[SAFE-FIX]** split done → archive |
| G-2 | 5 tasks are `in-progress` with notes like "Implemented locally, build passes" (TASK-305/306/307/308/310). | **[SAFE-FIX]** normalize status (done or annotate) |
| G-3 | `AI_CHANGELOG.md` ~1,236 lines, grows unbounded, no rotation. | **[SAFE-FIX]** rotate older entries to archive |

### Pathology H — Guardrail decay
*The rails meant to keep agents on track are themselves stale.* Covered by F-1..F-4 and Part 3 (rule/AGENTS duplication, scripts unwired).

---

## Part 2 — Codebase quality (standard categories)

### Correctness / lint
- **CQ-1 [SAFE-FIX]** `crafting/[id]/page.tsx:180` — ESLint **error**: `updateData` accessed before declaration inside a hook. The only hard error in the build. Reorder declaration.
- **CQ-2 [QUEUED → TASK-321]** 324 ESLint warnings, dominated by `@typescript-eslint/no-unused-vars`, `react-hooks/exhaustive-deps`, and `react-hooks/set-state-in-effect`. Mechanical but broad; batch by rule.

### Stray debug output
- **CQ-3 [SAFE-FIX]** `console.warn` perf probe in `src/components/ui/button.tsx` ("[INP] Slow Button onClick") and editor probes in creator pages. Server-side `console.warn`/`console.error` in API routes are **kept** (legitimate logging).

### Inconsistency
- **INC-1 [QUEUED → TASK-322]** Data fetching mixes `apiFetch` wrapper with raw `fetch` (admin public-library delete/save use raw `fetch`).
- **INC-2 [QUEUED → TASK-323]** Loading/error UI: `LoadingState` vs `Spinner`, `ErrorDisplay` vs `Alert`, `EmptyState` vs `ListEmptyState` used inconsistently.
- **INC-3 [NOTE]** Tooltip-system divergence: a side branch introduced `@tippyjs/react` alongside the existing `use-tooltips` hook. If merged, this is two tooltip systems — pick one. (Not on the audited branch's `src/`; flagged for awareness.)

### Formula duplication
- **FRM-1 [QUEUED → TASK-324]** Health/energy/skill-point logic lives in both `lib/game/formulas.ts` (deprecated `getBaseHealth`/`getBaseEnergy`/`getCharacterMaxHealthEnergy`/`calculateSkillPoints`) and `lib/game/calculations.ts` (active). Remove the deprecated helpers, single-source in `calculations.ts`.

### Intentional `@deprecated` (accepted)
- **[NOTE]** `types/character.ts` carries many `@deprecated` fields explicitly "kept for backward compat with old saves." These are **intentional** data-migration shims — do not delete without a save-migration plan. Same for `chip.tsx` deprecated variants (kept to avoid churn) — fold into TASK-319 only if low-risk.

---

## Part 3 — AI / Cursor workflow audit

### Documentation inventory (44 markdown files under `src/docs/`)
- **Active source-of-truth (keep):** `SUPABASE_SCHEMA.md`, `GAME_RULES.md`, `DESIGN_SYSTEM.md`, `ARCHITECTURE.md`, `DATA_HANDLING.md`, `ACCESSIBILITY.md`, `MOBILE_UX.md`, `DEPLOYMENT_AND_SECRETS_SUPABASE.md`, `ADMIN_SETUP.md`, `ENGINEERING_ONBOARDING.md`, `UNIFICATION_STATUS.md`, `USER_EXPERIENCE_GOALS.md`, `CODEX_SCHEMA_REFERENCE.md`.
- **AI-process (keep, but trim/rotate):** `ai/AGENT_GUIDE.md`, `ai/AI_TASK_QUEUE.md`, `ai/AI_CHANGELOG.md`, `ai/AI_REQUEST_TEMPLATE.md`, `ALL_FEEDBACK_CLEAN.md`.
- **Historical audits in active `ai/`:** `ADMIN_EDIT_AUDIT.md` and `TOOLTIP_AUDIT_AND_STANDARD_2026-04-09.md` — **[SAFE-FIX applied]** moved to `ai/archive/` (completed, unreferenced). `CDN_QUERY_AUDIT_2026-02-24.md` is **kept in `ai/`** — it is actively referenced as living edge-usage guidance by `DEPLOYMENT_AND_SECRETS_SUPABASE.md` and `EDGE_REQUESTS_REDUCTION.md`.
- **Redundant for agents (demote to human reference):** `UI_COMPONENT_REFERENCE.md` (1,146 L) overlaps `AGENT_GUIDE.md` + `realms-unification.mdc` + `DESIGN_SYSTEM.md`.

### Guidance triplication (token cost on every session)
The same guidance is repeated across **`AGENTS.md` + 5 `.cursor/rules/*.mdc` + full docs**:
- "Read task queue first" — AGENTS.md, realms-tasks.mdc, README.md, AGENT_GUIDE.md
- Mobile (fullScreenOnMobile / 44px) — AGENTS.md, realms-mobile.mdc, MOBILE_UX.md, AGENT_GUIDE.md
- Accessibility / tokens — AGENTS.md, realms-accessibility.mdc, ACCESSIBILITY.md, DESIGN_SYSTEM.md
- Unification — AGENTS.md, realms-unification.mdc, AGENT_GUIDE.md, UI_COMPONENT_REFERENCE.md, UNIFICATION_STATUS.md

**Disposition [SAFE-FIX, see Part 4]:** Make `AGENTS.md` the single canonical entrypoint with a **Source-of-Truth Map**; rules become terse pointers ("for mobile, read MOBILE_UX.md"), not full copies.

### Anti-re-implementation guardrail (new)
- **WF-1 [SAFE-FIX]** Add `src/docs/ai/FEATURE_INDEX.md` — a concise index of existing features / shared components / hooks / services so an agent checks "does this already exist?" before building. Directly targets Pathology A. Add a "search before you build" preflight to `realms-unification.mdc`.

### Scripts
- `reconcile_tasks.js` (CI, report-only) — keep.
- `triage_tasks.js`, `extract_feedback.js`, `session_submit.js` — not wired into `package.json`; `session_submit.js --autopush` writes to a wrong `docs/ai/` path and mutates git. **WF-2 [QUEUED → TASK-325]** wire useful scripts into npm scripts; fix or drop `--autopush`.

---

## Part 4 — Infrastructure (Supabase + Vercel, read-only)

### Supabase (project `lbqhiwudvifmkjtkccdg`, Postgres 17)
- **[NOTE]** All 35 public tables have **RLS enabled**. Good baseline.
- **SEC-1 [QUEUED → TASK-326]** Security advisors (WARN): two public buckets (`portraits`, `profile-pictures`) allow listing via broad SELECT policy; Auth leaked-password protection disabled. Low severity; fix policies + enable HIBP check.
- **PERF-1 [QUEUED → TASK-327]** Performance advisors: widespread `auth_rls_initplan` (RLS policies call `auth.<fn>()` per-row; wrap as `(select auth.<fn>())`), `multiple_permissive_policies` on `campaign_members`/`campaigns`/`characters`/`role_policies`, 3 unindexed FKs (`role_policies.updated_by`, `ui_tooltips.updated_by`, `usernames.user_id`), and several unused indexes (mostly on empty `official_enhanced_items`). All require SQL migrations → queued.

### Vercel (project `realms-rpg-test`, team `mastersotr`)
- **[NOTE]** Framework Next.js, Node 24.x; production domain `realmsrpg.com`. Last 20 deployments all **READY** (no failed builds). DB migration history confirms `_prisma_migrations` was dropped — Prisma fully removed at the database level, reinforcing Pathology C cleanup.

---

## Part 5 — Disposition summary

**Applied this pass (SAFE-FIX):** A-1, B-3, C-1, C-2, C-3, E-1..E-8, CQ-1, CQ-3, F-1..F-4, G-1..G-3, WF-1, plus workflow consolidation (Part 4 of plan) and archiving historical audits.

**Queued as tasks:** A-2/A-3/A-4 (TASK-313/314), B-1/B-2 (TASK-315/316), D-1/D-2 (TASK-317/318), E-9/E-10 (TASK-319/320), CQ-2 (TASK-321), INC-1/INC-2 (TASK-322/323), FRM-1 (TASK-324), WF-2 (TASK-325), SEC-1 (TASK-326), PERF-1 (TASK-327).

*Audit performed 2026-06 by AI agent. Tooling artifacts were generated read-only and not committed.*
