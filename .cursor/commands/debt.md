# Debt (repo-wide apply sprint)

Apply **gated** repo-wide anti-debt. Prefer after a fresh `/global-audit` in this chat (or treat optional args as a narrow slice).

Authority: `ARCHITECTURE_CONSTITUTION.md` § Anti-debt + `PR_CHECKLIST.md` § Owner commands.

**Not** session scope — use `/audit` → `/cleanup` for one TASK-### / this chat’s files.
**Not** a substitute for `/global-audit` — inventory first when drift is unclear; this command deletes/wires.

Optional args: `/debt docs-only` · `/debt from-audit` (apply only the “debt-safe” rows from the latest `/global-audit` report) · default = checklist below.

## Three pillars (same intent as session cleanup)

1. **Remove clutter** — Dead code, unused exports, stale hot-path docs, changelog rotation.
2. **Honesty vs code** — Fix FEATURE_INDEX / DATA_HANDLING / ACTIVE_TASKS claims that lag reality.
3. **Unify to canonical** — Delete weaker forks; wire `FEATURE_INDEX` + barrels; extend shared rather than adding parallels.

## Scope

Whole repo within gates below. Prefer evidence (grep, `FEATURE_INDEX`, barrels) over vibes.

## Procedure

1. **Intake** — If a `/global-audit` report exists in this chat, prioritize its **debt-safe** rows (honor **do-not-fold**). Else run a quick inventory (not a full global-audit writeup unless needed).
2. **Apply in-scope** — Delete weaker duplicates, slim hot-path docs, rotate changelog (see checklist).
3. **File follow-ups** — Gated → new `TASK-###` in `ACTIVE_TASKS.md` (specific fix), not more ritual prose. Use **atomic task-filing** below.
4. **Doc sanity** — After FEATURE_INDEX table edits, grep for collapsed cells (`||` with empty middle). Confirm deleted symbols are not still advertised as live.
5. **Verify** — `npm run build` if code changed; targeted tests if behavior touched; `npm run tasks:generate-index` + `tasks:validate-shared-ui` if barrels/allowlist touched.
6. **Log** — Append `AI_CHANGELOG.md` listing **deletions/consolidations** (required every run). First Summary bullet = a deletion or consolidation; prefer **net remove** on the diff.
7. **Before merge** — Prefer session `/audit` → `/cleanup` on the debt PR. Mark draft PRs **ready for review** before `gh pr merge` (draft merge fails).

## Atomic task-filing (required when creating TASK-###)

1. Append the **full** task block(s) in one write (id, title, AC, related_files, notes).
2. **Then** bump `Next task ID` and `Counts:` to match reality.
3. Verify: `rg -c '^- id: TASK-' src/docs/ai/ACTIVE_TASKS.md` equals Counts; each new id appears as a real block (not only a mention in another task’s notes).
4. If filing pushed ACTIVE over ~20KB, trim notes / soft-close residuals **in the same commit**.

## Checklist (default run)

- **Duplication greps** — raw `fetch('/api/upload`, local `formatDuration`-style forks, parallel selection/list shells vs `FEATURE_INDEX` + barrels (`npm run tasks:validate-shared-ui` if shared/ui touched).
- **ACTIVE_TASKS** — Archive `done` / superseded blocks; trim noise; keep agent-eligible hot path lean (target &lt;20KB). Fix `status`/`remaining_work` that lag shipped code.
- **AI_CHANGELOG** — Move entries older than ~60 days to `src/docs/ai/archive/AI_CHANGELOG_ARCHIVE.md` (create if missing).
- **Parallel systems** — Delete the weaker fork and wire the canonical pattern; ship a first slice + `TASK-###` if the rest is large.

## Apply freely

- Unused imports/exports, dead helpers, docs that lag code
- Obvious duplicate of existing shared/ui/hook/lib → delete weaker fork (in-repo references only)
- Archive done/superseded tasks; changelog rotation; barrel regen after export changes (`npm run tasks:generate-index`)

## Pause for owner ack (list, do not apply)

- Deleting a system that may still be referenced broadly
- Behavior changes beyond debt removal
- New shared/ui, store, API contract, ADR-class work
- Live codex / schema mutations
- Multi-file refactors better scoped as a dedicated `TASK-###`

## Hard rules

- Prefer **delete** over eternal compat layers.
- No new parallel patterns.
- Gated work → `TASK-###`, not an expanded `/debt` blast radius.
- Repeatable: no “done” status — log and stop.
- **Anti-theater:** Do not spend the sprint only rewriting docs. If nothing was deleted or wired to canonical, say so.

## Report format

```markdown
## Debt sprint

### Applied
- Bullets (deletions, consolidations, doc trims) — lead with deletions

### Gated (need ack or TASK-###)
- Bullets

### Follow-ups filed
- TASK-### — one line each

### Verification
- build / tests run (or N/A docs-only)

### Net
- Rough removed vs added
```
