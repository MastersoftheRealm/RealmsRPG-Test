# PR Checklist — AI failure modes

Use before marking a task `done` or opening a PR. Keep answers short.

1. **Search first** — Checked `FEATURE_INDEX` + barrels? Not re-implementing?
2. **No parallel pattern** — Extended existing shell/hook/API, or ADR/owner ack?
3. **AC complete** — Every acceptance criterion met? Else `partial` + follow-ups.
4. **related_files** — Paths exist and match the diff?
5. **Build** — `npm run build` (and targeted tests) green?
6. **Tokens** — Semantic / `*-fg`; no raw palette outside exemptions?
7. **Mobile** — `fullScreenOnMobile` / 44px targets where needed?
8. **A11y** — Labels, headings, modal title/`titleA11y`?
9. **Uploads** — Went through `apiUpload`?
10. **Domain parsers** — Used `src/lib/game/*` not a local fork?
11. **Schema/codex** — SQL in `sql/`; owner approve for live codex mutate?
12. **ACTIVE_TASKS** — Status updated; `done` moved to archive with `verification_status` set?
13. **Owner QA** — User-facing? `pending-qa` + indexed in `DEVELOPER_TASK_QUEUE` Pending owner QA until owner PASS?
14. **Changelog** — `AI_CHANGELOG.md` entry?
15. **Design intent** — Non-obvious constraint documented (`DESIGN_INTENT` / comment)?
16. **Human gates** — New shared/ui file on allowlist + ADR? Store / API contract reviewed?
17. **Uploads** — No raw `fetch('/api/upload…')` (eslint `realms/no-raw-upload-fetch`)?
18. **Barrels** — If you changed shared/ui/hooks/services exports, ran `npm run tasks:generate-index`?

## Owner commands

| Command | Mode | Scope | Purpose |
|---------|------|-------|---------|
| `/audit` (or “Audit”) | Read-only | This session / TASK-### | Score against items 1–17 + common AI mistakes. Report only. |
| `/cleanup` (or “Cleanup”) | Apply | Same as audit | Fix Audit findings, then dead/dupe/litter in that file set. |
| `/debt` (or “Debt”) | Apply | Repo-wide (gated) | Recurring anti-debt sprint: dupes, slim `ACTIVE_TASKS`, changelog rotation. |

**Session (`/audit` → `/cleanup`):** on demand after a task claims `done` or before commit/PR. Scope = this chat + task `related_files` / `related_tasks` only.

**Repo (`/debt`):** on demand when debt piles up. Not a substitute for session cleanup (and vice versa). Gated deletes → owner ack or new `TASK-###`.

**Implementations:** `.cursor/commands/audit.md`, `cleanup.md`, `debt.md`.
