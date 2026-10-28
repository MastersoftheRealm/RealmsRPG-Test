# PR Checklist — AI failure modes

Use before opening the draft PR. Keep answers short. Agents do not mark the ClickUp task **complete**.

1. **Search first** — Checked `FEATURE_INDEX` + barrels? Not re-implementing?
2. **No parallel pattern** — Extended existing shell/hook/API, or ADR/owner ack?
3. **AC complete** — Every acceptance criterion met? Else `partial` + follow-ups.
4. **One task** — The diff is only this ClickUp task? It does not overwrite a fix already on `master`?
5. **ClickUp** — Id in the branch and the PR? Risk flags checked? Task comment says what changed? No `TASK-###` commit-subject requirement.
6. **Tests** — Regression test for the repro run locally? CI runs typecheck, the unit suite, and the build. Do not also run them locally.
7. **Tokens** — Semantic / `*-fg`; no raw palette outside exemptions?
8. **Responsive** — `fullScreenOnMobile` where needed? Touch tier assigned (not blanket 44px)? Contracts C1–C6 hold at 360 / 390 / 768 / 1024 / 1280 / 1440 (`npm run verify:responsive`)?
9. **A11y** — Labels, headings, modal title/`titleA11y`? **WCAG 2.2 AA** (including target size SC 2.5.8, focus not obscured SC 2.4.11)?
10. **Uploads** — Went through `apiUpload`?
11. **Domain parsers** — Used `src/lib/game/*` not a local fork?
12. **Schema/codex** — SQL in `sql/`; Kadin explicit OK for live codex mutate? High-risk items flagged per `src/docs/ai/PR_REVIEWER_BRIEF.md` and [Workflow §4](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit)? **New `CREATE TABLE` in `public`:** same file has RLS, policies, and explicit `GRANT` (see `sql/_TEMPLATE_new_table.sql`; CI `tasks:check-sql-grants`)?
13. **ClickUp status** — **In progress** only while you are on it? Stopped with no PR → **to do**? **In review** only after PR Reviewer verdict passes and CI is green, with human approver assigned (usually Kadin)? After merge, **testing** with Bob (`95261690`), QA steps in the comment? Agents do not mark **complete**.
14. **Owner QA** — User-facing? QA steps on the ClickUp comment? `BUILD_VALIDATION.md` only when that suite does not already cover the check?
15. **Notes** — PR and ClickUp comment only? No new `AI_CHANGELOG.md` entry?
16. **Design intent** — Non-obvious constraint documented (`DESIGN_INTENT` / comment)?
17. **Human gates** — New shared/ui file on allowlist + ADR? Store / API contract reviewed?
18. **Uploads** — No raw `fetch('/api/upload…')` (eslint `realms/no-raw-upload-fetch`)?
19. **Barrels** — If you changed shared/ui/hooks/services exports, ran `npm run tasks:generate-index`?
20. **Allowlist / barrels** — Shared UI: `npm run tasks:validate-shared-ui`? Barrel edits: `npm run tasks:generate-index`? Do not run full `tasks:validate` unless those files changed.
21. **Regression test** — If this is a bugfix, added a regression test from the bug's repro?
22. **Git** — PR opened against `master`? **Never pushed directly to `master`?** Never merged?
23. **Decisions** — Checked `src/docs/ai/DECISIONS.md` for settled rulings that apply?
24. **Plain language** — If Kadin is the approver (or the PR is high-risk), filled the **For Kadin (plain language)** section in the PR template?

## PR Reviewer and cleanup

**Before Human OK:** PR Reviewer (different bot, different prompt than the writer) grades using **`src/docs/ai/PR_REVIEWER_BRIEF.md`** while CI runs. `/cleanup` only when PR Reviewer named an in-scope gap in REQUEST CHANGES. Doc nits are not a cleanup.

| Command | Status | What it does |
|---------|--------|----------------|
| PR Reviewer | Primary gate | Different bot/prompt. Verdict: APPROVE, REQUEST CHANGES, or HOLD FOR HUMAN. Brief: `src/docs/ai/PR_REVIEWER_BRIEF.md`. |
| `/cleanup` | Stays | Fixes that in-scope gap. Re-runs the repro test. |
| `/audit` | Retired | Superseded by PR Reviewer (2026-10-28). |
| `/global-audit` | Unused on a task | Do not run. |
| `/debt` | Unused on a task | Do not run. |

**Implementation:** `.cursor/commands/cleanup.md`. Retired stubs (not live commands): `src/docs/ai/archive/global-audit.md`, `archive/debt.md`.
