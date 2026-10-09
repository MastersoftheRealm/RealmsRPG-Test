# PR Checklist — AI failure modes

Use before marking a task `done` or opening a PR. Keep answers short.

1. **Search first** — Checked `FEATURE_INDEX` + barrels? Not re-implementing?
2. **No parallel pattern** — Extended existing shell/hook/API, or ADR/owner ack?
3. **AC complete** — Every acceptance criterion met? Else `partial` + follow-ups.
4. **related_files** — Every listed path exists in the repo (real file/dir; no invented module names)? Match the diff? Globs (`*`) ok; directories ok if tracked children exist.
5. **ClickUp link + commit subjects** — PR links the ClickUp task ID? Risk flags checked in the PR template? If any TASK-### is marked done, each ID listed in the commit subject (CI `ai-task-verifier` enforces this)?
6. **Build** — `npm run build` green? When touching TS/JS: `npm run typecheck` + `npm run lint` (`--max-warnings 0`) + targeted tests (TASK-655/656)?
7. **Tokens** — Semantic / `*-fg`; no raw palette outside exemptions?
8. **Responsive** — `fullScreenOnMobile` where needed? Touch tier assigned (not blanket 44px)? Contracts C1–C6 hold at 360 / 390 / 768 / 1024 / 1280 / 1440 (`npm run verify:responsive`)?
9. **A11y** — Labels, headings, modal title/`titleA11y`? **WCAG 2.2 AA** (including target size SC 2.5.8, focus not obscured SC 2.4.11)?
10. **Uploads** — Went through `apiUpload`?
11. **Domain parsers** — Used `src/lib/game/*` not a local fork?
12. **Schema/codex** — SQL in `sql/`; owner approve for live codex mutate? High-risk items flagged per [Workflow §4](https://docs.google.com/document/d/1F6iZUKP9nN0YTFzOkZ6Y82sySaw0iW101f_a-7ZeQdI/edit)?
13. **ClickUp status** — When Kadin has told you to write to ClickUp: moved to **in review** with `CLICKUP_API_TOKEN` from `.env.local` (not the ClickUp plugin)? Assigned **Collin**? Otherwise note the status change in the PR.
14. **Owner QA** — User-facing? `pending-qa` + indexed in `DEVELOPER_TASK_QUEUE` Pending owner QA until owner/QA Tester PASS?
15. **Changelog** — `AI_CHANGELOG.md` entry?
16. **Design intent** — Non-obvious constraint documented (`DESIGN_INTENT` / comment)?
17. **Human gates** — New shared/ui file on allowlist + ADR? Store / API contract reviewed?
18. **Uploads** — No raw `fetch('/api/upload…')` (eslint `realms/no-raw-upload-fetch`)?
19. **Barrels** — If you changed shared/ui/hooks/services exports, ran `npm run tasks:generate-index`?
20. **Task CI locally** — Before PR: `npm run tasks:validate` (strict reconcile + related_files + docs/index/allowlist)?
21. **Regression test** — If this is a bugfix, added a regression test from the bug's repro?
22. **Git** — PR opened against `master`? **Never pushed directly to `master`?** Never merged?
23. **Decisions** — Checked `src/docs/ai/DECISIONS.md` for settled rulings that apply?

## Owner commands

**Three pillars (every audit/cleanup/debt pass):** (1) remove clutter / keep honest (**prefer net remove**), (2) verify feedback + AC actually met in code, (3) additions must be necessary and constitutional — extend shared/barrels, do not fork parallels. Cleanup/debt changelog Summaries must **lead with a deletion or consolidation bullet**.

| Command | Mode | Scope | Purpose |
|---------|------|-------|---------|
| `/audit` (or "Audit") | Read-only | This session / task | Score pillars 1–3 + PR checklist. Report only. |
| `/cleanup` (or "Cleanup") | Apply | Same as audit | Remove clutter, meet AC/feedback, shape leftovers via shared patterns. |
| `/global-audit` (or "Global audit") | Read-only | Whole repo (deep) | Thorough parallel/dead/docs inventory; classify debt-safe vs TASK vs ack. |
| `/debt` (or "Debt") | Apply | Repo-wide (gated) | Apply debt-safe deletes/wires (prefer after `/global-audit`); slim hot-path docs. |

**Session (`/audit` → `/cleanup`):** on demand after a task claims `done` or before commit/PR. Scope = this chat + task `related_files` / `related_tasks` only. Cleanup that only adds docs lines without removals or AC fixes is a failed cleanup.

**Repo (`/global-audit` → `/debt` → prefer `/audit` → `/cleanup` on the debt PR):** on demand when systemic drift piles up. Inventory first; then apply; session-audit the debt diff before merge. Not a substitute for session cleanup (and vice versa). Gated deletes → owner ack or new task.

**Task filing:** write full task blocks before bumping counts; verify id count matches. After FEATURE_INDEX table edits, check for collapsed cells (`||`).

**Implementations:** `.cursor/commands/audit.md`, `cleanup.md`, `global-audit.md`, `debt.md`.
