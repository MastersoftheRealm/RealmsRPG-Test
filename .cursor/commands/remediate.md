# Remediate

Writer pass after critic **REQUEST CHANGES**. Fix product code, then stop for a **new critic session**.

Authority: `AGENTS.md`. Critic: `.cursor/commands/audit.md`.

## When to run

- Critic `/audit` returned **REQUEST CHANGES** with **Required changes**.

## Loop

1. Writer: build → self `/audit` + `/remediate` (prep).
2. Critic session `/audit` → posts **Realms Critic GitHub App** check on approve.
3. New commits void the check on the old SHA; critic reviews new head.

## Procedure

1. Fix only **Required changes**.
2. Re-run repro (+ optional `npm run critic:gate`).
3. Commit; push. New head SHA needs new App check from critic session.
4. **Stop.** Do not post the App check from the writer session. Do not `/audit` as critic here.

## Do not

- Combine critic `/audit` in the writer turn.
- Type Kadin approvals.