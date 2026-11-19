# Remediate

Switch from **critic** to **writer**. Take the latest `/audit` findings and fix them in product code. Then stop so a fresh **critic session** can `/audit` and post the GitHub check.

Authority: `AGENTS.md` (Review). Critic procedure: `.cursor/commands/audit.md`.

`/cleanup` is removed. It is not an alias.

## When to run

- Latest **critic** `/audit` is **REQUEST CHANGES** with **Required changes**.
- Kadin may order `/remediate` after notes only.

**Do not run** on critic **APPROVE**, **HOLD FOR HUMAN**, or unaccepted **PATCH**.

## Loop

1. Writer build → self `/audit` + `/remediate` (prep; no GitHub check).
2. Critic session `/audit` → posts **`Realms Independent Critic`** on approve.
3. New commits void the check; repeat from 2.

After two full critic↔remediate cycles, round 3+ must warn Kadin (`audit.md`).

## Scope

Only audit **Required changes**. Prefer deleting bloat the audit named.

## Procedure

1. Copy required changes.
2. Fix at root cause (REAL FIX / PATCH per item).
3. Re-run repro + `node scripts/critic-gate-tests.mjs`.
4. Commit; push when tested. New head SHA voids critic check — new independent `/audit` required.
5. **Stop.** Do not merge. Do not `/audit` as critic in this writer session. Do not post the GitHub check from here.

## Do not

- Expand beyond Required changes.
- Re-audit as critic in the same turn.
- Type Kadin approvals.

## Report

```markdown
## Remediate (after critic round N)

### Addressed
| Audit required change | What we did | REAL FIX / PATCH | Test run |
|-----------------------|-------------|------------------|----------|

### Next
Independent critic session: `/audit` on new head SHA, then dispatch `critic-verdict`.
```