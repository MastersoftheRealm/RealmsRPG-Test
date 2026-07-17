# Debt (repo-wide cleanup sprint)

Recurring **repo-wide** anti-debt pass. Run on demand when docs drift, dupes accumulate, or `ACTIVE_TASKS` bloats.

Authority: `ARCHITECTURE_CONSTITUTION.md` § Anti-debt + `PR_CHECKLIST.md` § Owner commands.

**Not** session scope — use `/audit` then `/cleanup` for a single task or this chat’s files.

Optional args after `/debt` (e.g. `/debt docs-only`) narrow focus; default = full checklist below.

## Scope

Whole repo within gates below. Prefer evidence (grep, `FEATURE_INDEX`, barrels) over vibes.

## Procedure

1. **Inventory** — Quick pass: parallel helpers, upload/domain-parser forks, stale task blocks, changelog size, obvious dead exports.
2. **Apply in-scope** — Delete weaker duplicates, slim hot-path docs, rotate changelog (see checklist).
3. **File follow-ups** — Anything gated → new `TASK-###` in `ACTIVE_TASKS.md` (specific fix), not more ritual prose.
4. **Verify** — `npm run build` if code changed; targeted tests if behavior touched.
5. **Log** — Append `AI_CHANGELOG.md` listing deletions/consolidations (required every run).

## Checklist (default run)

- **Duplication greps** — raw `fetch('/api/upload`, local `formatDuration`-style forks, parallel selection/list shells vs `FEATURE_INDEX` + barrels (`npm run tasks:validate-shared-ui` if shared/ui touched).
- **ACTIVE_TASKS** — Archive `done` blocks; trim noise; keep agent-eligible hot path lean (target &lt;20KB).
- **AI_CHANGELOG** — Move entries older than ~60 days to `src/docs/ai/archive/AI_CHANGELOG.archive.md` (create if missing).
- **Parallel systems** — Delete the weaker fork and wire the canonical pattern; ship a first slice + `TASK-###` if the rest is large.

## Apply freely

- Unused imports/exports, dead helpers, docs that lag code
- Obvious duplicate of existing shared/ui/hook/lib → delete weaker fork (in-repo references only)
- Archive done tasks; changelog rotation; barrel regen after export changes (`npm run tasks:generate-index`)

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

## Report format

```markdown
## Debt sprint

### Applied
- Bullets (deletions, consolidations, doc trims)

### Gated (need ack or TASK-###)
- Bullets

### Follow-ups filed
- TASK-### — one line each

### Verification
- build / tests run (or N/A docs-only)
```
