# Cleanup

Apply only the in-scope gap the latest **PR Reviewer** REQUEST CHANGES verdict named. Doc nits are not a cleanup. Do not start a cleanup when PR Reviewer found nothing fixable by the writer. After the fix, CI runs again. A follow-up PR Reviewer pass checks only that gap.

## Scope

The failed point and the files that point touches. Do not re-read the constitution. Do not rewrite behavior outside that gap. Do not update `ACTIVE_TASKS.md` or append `AI_CHANGELOG.md`.

## Procedure

1. Fix the failed point.
2. Re-run the regression test for that repro.
3. Stop. A follow-up PR Reviewer pass, if one is needed, checks only that point.

## Do not apply

- Wording, changelog, or task-note edits.
- A second implementation of the whole bug on the same model.
- Anything outside the PR Reviewer gap. That includes `/global-audit` and `/debt`, which are unused on a task.

## Report

```markdown
## Cleanup

### Fixed
- The failed point, and the test that now covers it.

### Left alone
- Doc nits and out-of-scope code.
```
