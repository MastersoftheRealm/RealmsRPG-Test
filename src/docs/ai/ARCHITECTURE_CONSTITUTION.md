# Engineering standards (Architecture Constitution)

The single engineering checklist. The writer checks it before opening a PR, the reviewer grades against it, and QA uses it. Workflow, approvals and risk by path live in root `AGENTS.md`; this file does not repeat them.

## Roles

| Role | When | Constraint |
|------|------|------------|
| **Implementer** (default) | Almost all tasks | Extend existing patterns only. |
| **Architect** (rare) | New shared component (`src/components/patterns/`, `src/components/ui/`), zustand store, API contract, migration strategy, or a second way to do something | Needs an ADR in `src/docs/ai/ADR/` and Kadin's product OK on the survey. Prefer deleting the parallel system over documenting it. |

## Checklist

Each item says what to search and what a failure looks like. The reviewer reports every item as pass, fail or n/a, with `file:line` for each fail.

1. **Rule values have one source.** Search `src/lib/game`, `src/components` and `src/app/api` for the same numbers or formulas. Fail: a rule number typed into code; a hardcoded fallback for a `core_rules` or codex value; an optional `rules` argument that silently defaults; code ignoring the database value because the database "looked wrong" (report it instead).
2. **No forks or duplicates.** Search the barrels and `src/lib/` and open the file. `FEATURE_INDEX.md` may only supply a path; a sentence there is not proof. Fail: a new parallel helper, duplicated math, "copied from X" logic, or copying from a `DEFERRED.md` area.
3. **Security is on the server.** For every UI gate, find the server or RLS check. Fail: a permission enforced only in the UI; a route without auth; service-role use from a user path; a route reading query, params or JSON without `validateQuery` / `validateRouteParams` / `validateJson` (`@/lib/api-validation`).
4. **One role model.** Search for the existing role and permission helpers. Fail: an ad-hoc `role === ...` check or a new role list.
5. **Tests prove behavior.** Fail: a bug fix without a test that fails before and passes after (unless the PR says why that was not feasible); a test that pins a known bug with no ruling or ticket cited; a test that reads source files as text; a repro that fails only because a symbol or migration is missing (not the bug behavior); a database test that uses hand-copied SQL instead of the **canonical** `sql/` (or migration) file the PR ships; a collection or ordered-list write change without tests for add, edit, remove, reorder, and at least one mixed scenario (unless the PR says why not).
6. **Known bugs stay visible.** Fail: skipping or weakening a test, broadening an assertion, catching and ignoring, or adding a fallback so CI goes green while the bug remains. A visible, ticketed failing test is acceptable. Fail: unpinned `latest` (or floating) CI tool versions in `.github/`; ratchet/baseline bumps or ignored paths to get green without justification in PR **Risk by path**.
7. **Errors are not swallowed.** Every `catch` around a write surfaces or rethrows. Fail: an empty catch, `console.log` only, or a silent default. Client: `apiFetch` throws; check Supabase `{ error }`.
8. **Comments are not narration.** Fail: new task-id comments, "keep in sync", "TODO remove later", or comments claiming more than the code does. Delete dead code; do not comment it out.
9. **Legality is advisory.** Fail: hard-blocking "illegal" or homebrew characters. Expected: warnings, visible overrides, temporary modifiers. A missing written rule is a hold, not a guess.
10. **Database safety.** Fail: any production write, migration, seed or reset without the approvals in `AGENTS.md`; SQL with `DROP`, force-delete or "verify" writes; a new `public` table without RLS, policies and GRANT in the same file; a schema, RPC, or API contract change without the **rollout matrix** in `AGENTS.md` (Review); any listed rollout state that can report success while dropping a write.
11. **Docs are current.** Compare doc sentences to the code this PR changes. Fail: a line that still describes the old behavior, including `FEATURE_INDEX.md`. Naming that line and then marking pass, or calling it a note, is still a fail. Also fail a doc that claims "done/fixed" when the PR does not prove it.
12. **Scope.** One task. Fail: unrelated edits, or reverting a fix already on `master`.
13. **Honest label.** Fail: the PR says REAL FIX but the root cause is still there, or the survey findings in the PR body are missing.
14. **UI standards** (when `.tsx` changes). Semantic tokens (prefer `*-fg`), no raw palette (`realms/no-raw-color`); WCAG 2.2 AA (labels, headings, modal titles, target size, focus not obscured); `fullScreenOnMobile` on large modals; tiered touch targets and the six-width contracts in `src/docs/MOBILE_UX.md` (`npm run verify:responsive`).
15. **Shared UI and barrels.** New files in `src/components/patterns/` or `src/components/ui/` are on `scripts/shared-ui-allowlist.json` with an ADR (`npm run tasks:validate-shared-ui`). Export changes regenerate the index (`npm run tasks:generate-index`).

## Architecture rules

- **Lib layers.** `src/lib/game` and `src/lib/calculators` are neutral domain math and import nothing from `src/lib/library` or `src/lib/guided-creator`. UI and creator layers import downward (ADR-0010).
- **Parsers** live in `src/lib/game/`. No admin-local forks.
- **Uploads.** Client multipart goes through `apiUpload` from `@/lib/api-client`, never raw `fetch` to `/api/upload/*` (eslint `realms/no-raw-upload-fetch`).
- **SQL.** Lives in `sql/`; table narrative in `src/docs/SUPABASE_SCHEMA.md`; apply and baseline process in `sql/README.md`.

### API error responses

Route Handlers return `{ error: string }` on failure (4xx/5xx). Log raw Supabase, Postgres or storage errors server-side via `logApiError` / `apiErrorResponse` (`@/lib/api-error`); never expose `.message`, `.details` or stack traces to clients in production. Optional `hint` / `debug` fields only with `?debug=1` (admin or non-production) or `NODE_ENV=development`. Success payloads vary by route; errors do not.

## Anti-debt

- Prefer **deleting** the weaker of two parallel systems.
- Prefer **extending** existing shared UI, hooks and lib over new parallel helpers, modals or parsers.
- Delete clutter. Prefer a **net-negative diff** on bug-fix and refine work when the audit or task allows (not mandatory on every PR; **reject AI bloat** that pads a small fix).
- When consolidating, ship a first slice plus precise follow-up tasks, not aspirational prose.

## Reviewer verdict format

`/audit` (`.cursor/commands/audit.md`) is the critic that fills this block; `/remediate` (`.cursor/commands/remediate.md`) is the writer pass after **REQUEST CHANGES**. Loop, AI-bloat checks, and round-3+ Kadin escalation: `AGENTS.md` (Review) and `audit.md`. Do not copy the checklist into the command.

```
## PR Reviewer verdict: APPROVE | REQUEST CHANGES | HOLD FOR HUMAN
Round: 1 | 2 | 3+ | plan | implementation (3+ must include For Kadin escalation if still blocking)
Critic: <agent/model — separate session from writer>
Head SHA: <full commit sha this verdict covers>
Risk: standard | high (paths)
Label check: REAL FIX | PATCH — agrees with the writer? (why)
Repro test: ran <command> — failed before / passes after — behavioral cause confirmed? (not missing symbol)
SQL tests: canonical `sql/` files? (not hand-copied DDL in test)
Rollout matrix: present and each state save-or-fail-loudly? (n/a if no DB/API contract change)
Checklist: items 1–15 pass/fail/n.a., one line each, file:line for each fail
Required changes: (REQUEST CHANGES only)
Question for human: (HOLD only, one clear decision for Kadin — product what)
```

- **APPROVE:** all items pass or n/a, repro **run by critic**, independent session, **Head SHA** matches PR head, not unaccepted PATCH, high-risk label/brief/rollout satisfied when required. High risk alone is **not** HOLD. Post **`Realms Independent Critic`** via **Realms Critic GitHub App** on that SHA.
- **REQUEST CHANGES:** checklist fail the writer can fix; writer may self-audit in same session but does not post the GitHub check.
- **HOLD FOR HUMAN:** missing/conflicting rule, product decision, PATCH veto, writer session, stale SHA, missing design brief when required, missing rollout matrix. (`high-risk` label ↔ diff mismatch → App check **failure**, not HOLD; `AGENTS.md` §5.)
- **PATCH veto:** cannot APPROVE; merges only if Kadin accepts PATCH in his own PR comment (`AGENTS.md`, Review).

The critic never merges, pushes, changes GitHub settings, or writes to ClickUp, Drive or the database. Green CI is not proof. The GitHub critic check is not proof without the critic having run the tests locally.

### For Kadin (plain language)

Mandatory when Kadin must decide something, and on every high-risk PR:

```
### For Kadin (plain language)
- What it does: (1–2 sentences, no jargon)
- Why: (the problem, who sees it)
- REAL FIX or PATCH: (and what a patch leaves behind)
- What could go wrong: (worst realistic case, how we'd notice)
- How to undo it: (revert / restore backup / flip setting)
- What I need from you: (the one product decision, or "nothing")
```
