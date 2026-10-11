# Audit (while CI runs)

**Read-only.** A different model than the chat that wrote the diff. Never a slug ending in `-fast`. Do not edit product code. This is not a second QA pass. CI checks regressions.

- Implementer was `composer-2.5`: audit with `grok-4.7-medium`.
- Implementer was `grok-4.7-medium` or `grok-4.7-high`, and the diff is layout, labels, or wiring: audit with `composer-2.5`.
- Implementer was `grok-4.7-medium`, and the diff is rules math, permissions, saves, or schema: audit with `grok-4.7-high`.
- Implementer was already `grok-4.7-high` on that kind of diff: a fresh `grok-4.7-high` chat that did not write the code. If that audit disagrees, or the change can lose or expose data, do not start Claude or GPT. Comment `claude-opus-5-5-high` or `gpt-5.6-sol-high` on the ClickUp task. Do not move the task to **in review**.

## What to check

The diff. Four points:

1. One task. The diff does not take on a second task.
2. No new pattern. It extends the existing one.
3. No overwritten fix. It does not revert a fix already on `master`.
4. No invented rule. A missing written rule is a hold, not a guess.

Do not load `ARCHITECTURE_CONSTITUTION.md`, the Drive playbook, `ACTIVE_TASKS.md`, or `AI_CHANGELOG.md`. Doc wording is not a gap.

A re-audit checks only the gap this audit named.

## Report

```markdown
## Audit

**Verdict:** clean | gap

### Gap
- One finding, or "none". Which of the four points, and the path.

### Next
- `/cleanup` only when the gap is in-scope code. Then CI again.
- A layout or cross-system miss steps up one model. It is not a same-model redo.
```

## Hard rules

- Zero product edits.
- Do not move the task to **in review** from this chat. That move waits for a clean verdict and green CI.
- Do not file `TASK-###` notes.
