# Audit (session / task)

Run a **read-only** audit of the current session and/or named task. Do **not** edit files, run formatters that write, or “fix” anything — report only.

Authority: `src/docs/ai/PR_CHECKLIST.md` § Owner commands + `ARCHITECTURE_CONSTITUTION.md` Definition of Done.

Optional args after `/audit` (e.g. `/audit TASK-502`) = primary task id; otherwise infer from this chat + recent `ACTIVE_TASKS` / archive activity.

## Scope (strict)

1. Files touched in this conversation (prefer `git status` / diff).
2. Task `related_files` / `related_tasks` for the target TASK-###.
3. Docs that claim DoD for that work (`ACTIVE_TASKS`, archive block, `AI_CHANGELOG`, `BUILD_VALIDATION`, `FEATURE_INDEX` as relevant).

**Out of scope:** repo-wide debt (`/debt`), unrelated dirty files, live DB/codex mutation.

## Procedure

1. Identify target task(s) and in-scope file set.
2. Walk **PR Checklist** items 1–17 against the code and docs (verify in code; docs can lag).
3. Hunt common AI failure modes:
   - Parallel / duplicate pattern vs `FEATURE_INDEX` + barrels
   - Dead / unused code or exports introduced this session
   - Premature `done` (open AC → should be `partial`)
   - Missing changelog, BUILD_VALIDATION, DESIGN_INTENT, barrel index regen
   - Token / `dark:` / a11y / mobile gaps on touched UI
   - Upload or domain-parser forks
   - Human gates skipped (new shared/ui, store, API contract)
4. Output the report below. End with whether the owner should run `/cleanup` next.

## Report format

```markdown
## Audit — TASK-### (or session)

**Verdict:** ready for done | gaps remain | not ready (partial)

### Scope
- Files / tasks reviewed

### Pass
- Short bullets

### Gaps (fix before done)
| Severity | Finding | Evidence | Suggested fix |
|----------|---------|----------|---------------|
| blocker / major / minor | … | path or AC | … |

### Cleanup candidates
- Dead code, dupes, litter safe for `/cleanup` (even if not DoD blockers)

### Follow-ups (out of scope)
- Items for `/debt` or a new TASK-### — do not expand blast radius

### Next
- Say `/cleanup` to apply in-scope fixes, or address blockers manually.
```

## Hard rules

- **Zero edits.** No drive-by refactors.
- Prefer evidence (paths, AC text, grep) over vibes.
- If AC incomplete, verdict must not be “ready for done.”
