# Cleanup

Apply only the in-scope gap the latest `/audit` **REQUEST CHANGES** verdict named (`.cursor/commands/audit.md`). Doc nits are not a cleanup. Review is limited to two rounds (`AGENTS.md`, Review): if this is the round-two verdict and the gap cannot be closed properly, stop and escalate to Collin instead.

## Scope

The failed point and the files it touches. Do not rewrite behavior outside that gap.

## Procedure

1. Fix the failed point at its root. If only a patch is possible, say so and stop.
2. Re-run the regression test for the repro.
3. Stop. The next reviewer pass checks only that point.

## Do not apply

- Wording, changelog or task-note edits.
- A second implementation of the whole task on the same model.
- Anything outside the reviewer's gap.

## Report

```markdown
## Cleanup (round 1 | 2)

### Fixed
- The failed point, REAL FIX or PATCH, and the test that now covers it.

### Left alone
- Doc nits and out-of-scope code.
```
