# Cleanup

Apply only an in-scope behavior or code gap from the latest `/audit`. Doc nits are not a cleanup. Do not start a cleanup when the audit found nothing.

## Scope

The failed point and the files that point touches. Do not re-read the constitution. Do not rewrite behavior outside that gap. Do not update `ACTIVE_TASKS.md` or append `AI_CHANGELOG.md`.

## Procedure

1. Fix the failed point.
2. Re-run the regression test for that repro.
3. Stop. A re-audit, if one is needed, checks only that point.

## Do not apply

- Wording, changelog, or task-note edits.
- A second implementation of the whole bug on the same model.
- Anything outside the audit gap. That includes `/global-audit` and `/debt`, which are unused on a task.

## Report

```markdown
## Cleanup

### Fixed
- The failed point, and the test that now covers it.

### Left alone
- Doc nits and out-of-scope code.
```
