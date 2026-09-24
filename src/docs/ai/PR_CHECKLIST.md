# PR Checklist — AI failure modes

Use before marking a task `done` or opening a PR. Keep answers short.

1. **Search first** — Checked `FEATURE_INDEX` + barrels? Not re-implementing?
2. **No parallel pattern** — Extended existing shell/hook/API, or ADR/owner ack?
3. **AC complete** — Every acceptance criterion met? Else `partial` + follow-ups.
4. **related_files** — Every listed path exists in the repo (real file/dir; no invented module names)? Match the diff? Globs (`*`) ok; directories ok if tracked children exist.
5. **Delivery sync (default)** — Branch `task/TASK-###-…`? PR open with `TASK-###` in subject? One Website ClickUp card **`in review`** + Collin, or `clickup_sync: pending` noted? Owner batch → one card listing all ids. MCP budget: no mass ClickUp calls (`CLICKUP_GITHUB_WORKFLOW.md`).
6. **Commit subjects** — Subject(s) list every newly `done` `TASK-###` (`git log --grep=TASK-###`). Batched PRs must list **all** IDs. Ranges like `TASK-530–534` do **not** count. Squash merges that drop subjects need a follow-up reconcile commit.
7. **Build** — `npm run build` green? When touching TS/JS: `npm run typecheck` + `npm run lint` (`--max-warnings 0`) + targeted tests (TASK-655/656)?
8. **Tokens** — Semantic / `*-fg`; no raw palette outside exemptions?
9. **Responsive** — `fullScreenOnMobile` where needed? Touch tier assigned (not blanket 44px)? Contracts C1–C6 hold at 360 / 390 / 768 / 1024 / 1280 / 1440 (`npm run verify:responsive`)?
10. **A11y** — Labels, headings, modal title/`titleA11y`?
11. **Uploads** — Went through `apiUpload`?
12. **Domain parsers** — Used `src/lib/game/*` not a local fork?
13. **Schema/codex** — SQL in `sql/`; owner approve for live codex mutate?
14. **ACTIVE_TASKS** — Status updated; `done` moved to archive with `verification_status` set?
15. **Owner QA** — User-facing? `pending-qa` + indexed in `DEVELOPER_TASK_QUEUE` Pending owner QA until owner PASS? (ClickUp **`testing`** after merge.)
16. **Changelog** — `AI_CHANGELOG.md` entry?
17. **Design intent** — Non-obvious constraint documented (`DESIGN_INTENT` / comment)?
18. **Human gates** — New shared/ui file on allowlist + ADR? Store / API contract reviewed?
19. **Uploads** — No raw `fetch('/api/upload…')` (eslint `realms/no-raw-upload-fetch`)?
20. **Barrels** — If you changed shared/ui/hooks/services exports, ran `npm run tasks:generate-index`?
21. **Task CI locally** — Before push / PR: `npm run tasks:validate` (strict reconcile + related_files + docs/index/allowlist)?

## Owner commands

**Three pillars (every audit/cleanup/debt pass):** (1) remove clutter / keep honest (**prefer net remove**), (2) verify feedback + AC actually met in code, (3) additions must be necessary and constitutional — extend shared/barrels, do not fork parallels. Cleanup/debt changelog Summaries must **lead with a deletion or consolidation bullet**.

| Command | Mode | Scope | Purpose |
|---------|------|-------|---------|
| `/audit` (or “Audit”) | Read-only | This session / TASK-### | Score pillars 1–3 + PR checklist. Report only. |
| `/cleanup` (or “Cleanup”) | Apply | Same as audit | Remove clutter, meet AC/feedback, shape leftovers via shared patterns. |
| `/global-audit` (or “Global audit”) | Read-only | Whole repo (deep) | Thorough parallel/dead/docs inventory; classify debt-safe vs TASK vs ack. |
| `/debt` (or “Debt”) | Apply | Repo-wide (gated) | Apply debt-safe deletes/wires (prefer after `/global-audit`); slim hot-path docs. |

**Session (`/audit` → `/cleanup`):** on demand after a task claims `done` or before commit/PR. Scope = this chat + task `related_files` / `related_tasks` only. Cleanup that only adds docs lines without removals or AC fixes is a failed cleanup.

**Repo (`/global-audit` → `/debt` → prefer `/audit` → `/cleanup` on the debt PR):** on demand when systemic drift piles up. Inventory first; then apply; session-audit the debt diff before merge. Not a substitute for session cleanup (and vice versa). Gated deletes → owner ack or new `TASK-###`.

**Task filing:** write full `TASK-###` blocks before bumping `Next task ID` / Counts; verify id count matches. After FEATURE_INDEX table edits, check for collapsed cells (`||`).

**Implementations:** `.cursor/commands/audit.md`, `cleanup.md`, `global-audit.md`, `debt.md`.
