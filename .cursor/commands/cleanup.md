# Cleanup (session / task)

Apply **in-scope** fixes after `/audit` (preferred). Same three pillars as Audit — cleanup exists to **remove** and **correct**, not to write more process prose.

Authority: `PR_CHECKLIST.md` § Owner commands + `ARCHITECTURE_CONSTITUTION.md` anti-debt.

Optional args: `/cleanup TASK-502`. If this chat has an Audit report, that is the primary backlog.

## Three pillars (apply in order)

1. **Remove clutter** — Dead code, unused imports/exports, duplicate helpers, debug litter, unneeded compat shims, redundant wrappers. Keep docs honest *by aligning them to code* (or deleting stale claims) — not by expanding archive essays.
2. **Meet the feedback / AC** — Close gaps where the diff does not actually deliver owner feedback or acceptance criteria. Behavior first; then BV / FEATURE_INDEX / archive fields that prove it.
3. **Constitutional shape of what remains** — If something must stay or be added to meet AC: extend existing shared/ui/hook/lib (`FEATURE_INDEX` + barrels). Delete the weaker parallel fork in scope. No new shared/ui/store/API without Architect path. Prefer fewer lines that reuse globals over “small” new local copies.

## Scope (strict)

Same as `/audit`: this session’s files + task `related_files` / `related_tasks`. Not `/debt`. Not unrelated dirty tree.

## Procedure

1. **Intake** — Latest Audit report if present; else mini read-only review (do not print a full Audit unless asked).
2. **Pillar 1** — Delete / wire-to-canonical in scope.
3. **Pillar 2** — Fix unmet AC / feedback behavior; correct status (`partial` if still open).
4. **Pillar 3** — Replace in-scope forks with shared patterns; drop additions that are not required for AC.
5. **Doc sanity** — After FEATURE_INDEX / table edits, grep for collapsed rows (`||` with no cell between) and broken links to deleted files.
6. **Re-verify** — Targeted tests and/or `npm run build` if code changed. Never mark `done` early.
7. **Changelog** — Only if cleanup was meaningful. First bullet of the Summary **must** be a deletion or consolidation (file removed, fork wired to canonical, dead export dropped). Wiring a local mapper into an existing shared helper counts. Do not invent a changelog entry whose only substance is “docs honesty.”
8. **Do not commit** unless the owner asked to commit or push. Prefer one batch commit for all finished tasks in the session (list every `TASK-###` in that subject).

## Apply freely (in scope)

- Unused imports, dead helpers/exports introduced this session
- Obvious duplicate of an existing shared/ui/hook/lib → delete weaker fork, wire canonical
- Docs/BV/FEATURE_INDEX/archive fields that were wrong or incomplete for *this* task
- Token / a11y / mobile fixes on files already in scope
- Barrel regen if exports changed (`npm run tasks:generate-index`)
- Soft-trim `ACTIVE_TASKS.md` notes if this session pushed it over ~20KB

## Pause for owner ack (list, do not apply)

- Deleting a parallel system referenced outside scope
- Behavior changes beyond restoring intended AC / feedback
- New shared/ui file, store, API contract
- Live codex / schema mutations
- Broad refactors unrelated to Audit findings

## Hard rules

- Prefer **delete** over eternal compat layers.
- No new parallel patterns.
- Out-of-scope debt → `/global-audit` / `/debt` / `TASK-###`, do not expand.
- If Audit said AC incomplete, Cleanup must not claim full `done` unless every AC is truly met after fixes.
- **Anti-theater:** A cleanup that only adds documentation lines without removing clutter or fixing AC gaps is a failed cleanup — say so and stop.

## Report format

```markdown
## Cleanup — TASK-### (or session)

### Pillar outcomes
| Pillar | Result |
|--------|--------|
| 1 Clutter removed | … |
| 2 Feedback / AC met | … |
| 3 Constitutional shape | … |

### Applied
- Bullets — lead with deletions / consolidations

### Still gated (need ack)
- Bullets

### Follow-ups filed
- TASK-### / notes

### DoD
- ready for done (`verification_status: pending-qa`) | remains partial (why)

### Net
- Rough sense: removed vs added (prefer net delete when cleaning)
```
