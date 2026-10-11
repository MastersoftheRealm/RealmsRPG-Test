# PR Checklist — AI failure modes

Use before marking a task `done` or opening a PR. Keep answers short.

1. **Search first** — Checked `FEATURE_INDEX` + barrels? Not re-implementing?
2. **No parallel pattern** — Extended existing shell/hook/API, or ADR/owner ack?
3. **AC complete** — Every acceptance criterion met? Else `partial` + follow-ups.
4. **related_files** — Every listed path exists in the repo (real file/dir; no invented module names)? Match the diff? Globs (`*`) ok; directories ok if tracked children exist.
5. **ClickUp** — Id in the branch and the PR? Risk flags checked? Task comment says what changed? No `TASK-###` commit-subject requirement.
6. **Tests** — Regression test for the repro run locally? CI runs typecheck, the unit suite, and the build. Do not also run them locally.
7. **Tokens** — Semantic / `*-fg`; no raw palette outside exemptions?
8. **Responsive** — `fullScreenOnMobile` where needed? Touch tier assigned (not blanket 44px)? Contracts C1–C6 hold at 360 / 390 / 768 / 1024 / 1280 / 1440 (`npm run verify:responsive`)?
9. **A11y** — Labels, headings, modal title/`titleA11y`? **WCAG 2.2 AA** (including target size SC 2.5.8, focus not obscured SC 2.4.11)?
10. **Uploads** — Went through `apiUpload`?
11. **Domain parsers** — Used `src/lib/game/*` not a local fork?
12. **Schema/codex** — SQL in `sql/`; owner approve for live codex mutate? High-risk items flagged per [Workflow §4](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit)?
13. **ClickUp status** — When Kadin has told you to write to ClickUp: moved to **in review** with `CLICKUP_API_TOKEN` from `.env.local` (not the ClickUp plugin)? Assigned **Collin**? Otherwise note the status change in the PR. After a bypass merge: task in **testing**, QA instructions for what changed, James Owenby added, Collin still assigned (he can move it back to **in review**)?
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

## Owner commands

**Before merge:** `/audit` on a different model. It reads the diff and the rules that diff touches. A re-audit checks only the failed point. `/cleanup` only when that audit found an in-scope behavior or code gap. Doc nits are not a cleanup.

| Command | Status | What it does |
|---------|--------|----------------|
| `/audit` | Stays | Read-only. Different model. The diff, not the constitution. |
| `/cleanup` | Stays | Fixes that in-scope gap. Re-runs the repro test. |
| `/global-audit` | Unused on a task | Do not run. |
| `/debt` | Unused on a task | Do not run. |

**Implementations:** `.cursor/commands/audit.md`, `cleanup.md`. `global-audit.md` and `debt.md` only say they are unused.
