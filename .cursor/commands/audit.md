# Audit (critic)

Read-only adversarial review. A **different agent and a different prompt** from the writer. Zero product edits. Do not merge, push, or write to ClickUp, Drive, or the database.

This is the critic: rules compliance **and** a brutal separate review. It replaces the retired four-point `/audit` (Oct 28, 2026). Checklist and verdict wording live in `src/docs/ai/ARCHITECTURE_CONSTITUTION.md`. Workflow, risk, and the PATCH veto live in `AGENTS.md`. Do not restate them.

## Model

Never a slug ending in `-fast`. Never the agent that wrote the diff.

| Writer | Critic |
|---|---|
| `composer-2.5` | `grok-4.7-high` |
| `grok-4.7-high` or `grok-4.7-xhigh` | `composer-2.5` |

If you are the writer, stop and hand this command to the other model. Do not start Claude or GPT.

## What you may read

The ClickUp task (intent and done-when), `src/docs/ai/DECISIONS.md` for rulings on the topic, the code path, the diff, CI, and the preview URL when one exists.

Do **not** treat the writer's PR description, survey, or reasoning as evidence. Trace the root cause in the code yourself **before** you use the diff to check the fix. The writer's REAL FIX / PATCH label is a claim to test, not a fact.

## What to attack

Grade checklist items 1–15 in `ARCHITECTURE_CONSTITUTION.md` (pass / fail / n/a, `file:line` on every fail). Then challenge the change:

- Is the stated root cause the one the code actually takes?
- Forks, copy-paste, dead code, or a second helper that should have been deleted?
- A rule number or formula typed into code, or a missing written rule treated as a guess?
- REAL FIX claimed while the cause is still there (that is a PATCH)?
- Scope past one task, or a revert of a fix already on `master`?
- High-risk paths in `AGENTS.md` (Risk by path) without the approval that path requires?

Only correctness, security, data-safety, and checklist failures block. Everything else is a note. A note does not become a task from this chat.

Run the repro test. Reading the diff is not the review. Check CI; green CI is not proof.

Rules-math or rules-value diffs: do not invent a ruling. HOLD and send them to the Rules Balance Analyst before Kadin signs off.

## Fallback senior review

When Kadin has invoked the Collin-unavailable fallback (`AGENTS.md`), run this command twice. Same model rules. Same refusal to read the writer's justification.

- **Plan pass** (before he decides): task, his intent, the brief's options, and your own survey of the code. Challenge the root cause, the assumptions, and whether an option is over-built or too thin. Append that challenge to the brief unedited.
- **Implementation pass:** his intent and decision, the diff, CI, and the preview URL. Not the writer's PR body. Trace the cause, then grade the checklist and label REAL FIX or PATCH. Head the verdict `## Senior fallback review: plan | implementation` and add the extra lines named under Fallback senior review in `ARCHITECTURE_CONSTITUTION.md`.

If the task crosses systems, stop and say to split it. Do not jump to a bigger model to finish a wide task.

A second `/audit` checks only the gap the previous REQUEST CHANGES named. Two rounds maximum (`AGENTS.md`, Review).

## Verdict

Use the reviewer verdict block in `ARCHITECTURE_CONSTITUTION.md` (APPROVE, REQUEST CHANGES, or HOLD FOR HUMAN), including the plain-language block for Kadin on every high-risk PR and whenever he must decide.

- **APPROVE** only when you are not the writer, blocking items pass, the repro was run, CI is green, and your label is not an unaccepted PATCH.
- **REQUEST CHANGES** names one in-scope gap the writer can fix. `/cleanup` applies only that gap.
- **HOLD FOR HUMAN** when the path is high-risk, a rule is missing or conflicting, a product decision is open, you are not independent of the writer, or your label is PATCH.

## Do not

- Edit product code, docs, or this command's repo from the audit chat.
- Move the ClickUp task to **in review**. That waits for APPROVE and green CI.
- File task notes or quote an approval the human did not type.
