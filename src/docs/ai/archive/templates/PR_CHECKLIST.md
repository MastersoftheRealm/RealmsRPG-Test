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
12. **ACTIVE_TASKS** — Status updated; `done` moved to archive?
13. **Changelog** — `AI_CHANGELOG.md` entry?
14. **Design intent** — Non-obvious constraint documented (`DESIGN_INTENT` / comment)?
15. **Human gates** — New shared/ui file, store, or API contract reviewed?
