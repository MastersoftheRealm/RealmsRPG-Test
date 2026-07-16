# Cleanup (session / task)

Apply **in-scope** cleanup after an Audit (preferred) or a fresh scoped review. Fix Audit findings first, then remove dead/duplicate/litter in the same file set.

Authority: `src/docs/ai/PR_CHECKLIST.md` § Owner commands + `ARCHITECTURE_CONSTITUTION.md` anti-debt.

Optional args after `/cleanup` (e.g. `/cleanup TASK-502`) = primary task id. If this chat already has an Audit report, treat it as the primary backlog.

## Scope (strict)

Same as `/audit`: this session’s files + task `related_files` / `related_tasks`. Not `/debt` (repo-wide). Not unrelated dirty tree files.

## Procedure

1. **Intake** — Use the latest Audit report in this chat if present; else run a mini read-only review (do not print a full Audit unless asked).
2. **Fix Audit gaps** — Close in-scope DoD / PR-checklist gaps (code + docs honesty).
3. **Second pass** — Dead code, unused imports/exports, duplicated helpers that fork existing barrels/`FEATURE_INDEX` patterns, leftover debug, docs that lag the code.
4. **Re-verify DoD** — If code meaningfully changed: targeted tests and/or `npm run build` as appropriate. Keep status honest: `partial` + follow-ups if AC still open; never mark `done` early.
5. **Report** what changed vs left gated.

## Apply freely (in scope)

- Unused imports, dead helpers, unused exports introduced this session
- Obvious duplicate of an existing shared/ui/hook/lib pattern → delete the weaker fork and wire the existing one
- Docs/changelog/BUILD_VALIDATION/FEATURE_INDEX/task archive honesty for this task
- Token / a11y / mobile fixes on files already in scope
- Barrel regen if exports changed (`npm run tasks:generate-index`)

## Pause for owner ack (list, do not apply)

- Deleting a parallel system that may still be referenced outside scope
- Behavior changes beyond restoring the intended AC
- New shared/ui file, new store, API contract change
- Live codex / schema mutations
- Broad refactors or style rewrites unrelated to findings

## Hard rules

- Prefer **delete** over eternal compat layers.
- No new parallel patterns; no Architect-class invention without ADR/ack.
- Out-of-scope debt → `/debt` or `ACTIVE_TASKS` follow-up, do not expand.
- If Audit said AC incomplete, Cleanup must not claim full `done` unless every AC is truly met after fixes.
- Append `AI_CHANGELOG.md` when cleanup is meaningful.

## Report format

```markdown
## Cleanup — TASK-### (or session)

### Applied
- Bullets (what removed/fixed)

### Still gated (need ack)
- Bullets

### Follow-ups filed
- TASK-### / notes

### DoD
- ready for done (`verification_status: pending-qa`) | remains partial (why)
```
