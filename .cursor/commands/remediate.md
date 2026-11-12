# Remediate

Switch from **critic** to **writer**. Take the latest `/audit` findings and fix them in product code. Then stop so a fresh `/audit` can verify.

Authority: `AGENTS.md` (Review, write/check/write loop). Critic procedure: `.cursor/commands/audit.md`.

## When to run

- The latest `/audit` verdict is **REQUEST CHANGES** and lists **Required changes** (blocking checklist or five-question fails).
- Kadin or Collin may also order `/remediate` after an audit that left only **notes**, if they want those notes fixed before merge — notes alone do not require this command.

**Do not run** when the audit verdict is:

- **APPROVE** (merge path; optional notes are not remediate unless the owner orders).
- **HOLD FOR HUMAN** (get the human decision on the task or PR first).
- **PATCH** without Kadin’s acceptance on the PR when the audit said PATCH veto applies.

## Audit ↔ remediate loop (two cycles max)

Per PR, at most **two** full cycles:

1. Write (Phase 2) → `/audit` (round 1)
2. `/remediate` → `/audit` (round 2)
3. If round-2 audit is still **REQUEST CHANGES**, **HOLD FOR HUMAN**, or an unaccepted **PATCH**, **stop**. Escalate to Collin (how) or Kadin (what / rule / merge) with the audit table and what remediate already tried. Do not start audit round 3 on the same PR unless Kadin waives the limit on the task or PR or splits the work.

Commands exist so agents follow this loop consistently; do not improvise a third rewrite pass on the same model without that waiver.

## Scope

Only what the audit **Required changes** section names (file:line and fix). Do not refactor unrelated code, refresh docs for doc-only nits, or “clean up while here.”

If a required change is not fixable without a product or rule decision, **stop** and report; do not patch around it.

## Procedure

1. Copy each **Required change** from the audit verdict into your working list.
2. Trace each item in code; fix at root cause. Honest **REAL FIX** vs **PATCH** per item.
3. Re-run the repro test the audit named. If none, run the task’s repro or the tests that cover the changed paths.
4. Commit on the task branch; push when fixes are tested (one push per remediate turn is enough).
5. **Stop.** Do not merge. Do not run `/audit` in the same turn unless the owner explicitly combines them (default: separate turn, separate mindset).

## Persona

You are the **implementer** again: extend existing patterns, smallest diff that closes the audit gaps. You are not re-arguing the audit. If a finding is wrong, say so and escalate — do not silently ignore it.

## Do not

- Expand beyond Required changes.
- Re-audit your own diff in this turn (that is `/audit`).
- Rewrite the whole task because round 1 failed broadly.
- Type approvals for Kadin or Collin.
- Move ClickUp to **complete**.

## Report

```markdown
## Remediate (after audit round N)

### Addressed
| Audit required change | What we did | REAL FIX / PATCH | Test run |
|-----------------------|-------------|------------------|----------|

### Blocked (escalate)
- …

### Left alone (out of audit scope)
- …

### Next
- `/audit` round N+1, or escalate if N was 2 and audit still blocks.
```
