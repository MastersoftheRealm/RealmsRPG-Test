# Audit (before merge)

**Read-only.** A different model than the chat that wrote the diff. Never a slug ending in `-fast`. Do not edit product code.

- Implementer was `composer-2.5`: audit with `grok-4.7-medium`.
- Implementer was `grok-4.7-medium` or `grok-4.7-high`, and the diff is layout, labels, or wiring: audit with `composer-2.5`.
- Implementer was `grok-4.7-medium`, and the diff is rules math, permissions, saves, or schema: audit with `grok-4.7-high`.
- Implementer was already `grok-4.7-high` on that kind of diff: a fresh `grok-4.7-high` chat that did not write the code. If that audit disagrees, or the change can lose or expose data, do not start Claude or GPT. Comment `claude-opus-5-5-high` or `gpt-5.6-sol-high` on the ClickUp task and leave the PR in **in review**.

## What to read

The diff, and the rules that diff touches (mobile and accessibility when UI files changed, codex when SQL or reference data changed, `GAME_RULES.md` when math changed). Do not re-read `ARCHITECTURE_CONSTITUTION.md`, the Drive playbook, `ACTIVE_TASKS.md`, or `AI_CHANGELOG.md`.

A re-audit checks only the failed point. It does not score the whole change again.

## What to score

1. The diff does what the ClickUp acceptance criteria ask. Evidence is the code and the repro test, not a changelog.
2. The diff does not add a parallel pattern. It extends the existing one.
3. In-scope dead code the diff itself added.

Doc wording, missing changelog lines, and task-note honesty are not gaps.

## Report

```markdown
## Audit

**Verdict:** ready | gap

### Failed point
- One finding, or "none". Path and what the AC asked for.

### Cleanup
- Say `/cleanup` only when that finding is an in-scope behavior or code gap.
- A cross-system or layout miss steps up once. It is not a same-model redo, and it is not a full re-audit.
```

## Hard rules

- Zero product edits.
- If the acceptance criteria are unmet, the verdict is not ready.
- Do not file `TASK-###` notes. A follow-up the owner asked for goes on ClickUp.
