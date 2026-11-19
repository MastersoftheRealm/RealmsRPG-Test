# Audit (critic)

Read-only adversarial review. Zero product edits from the audit chat unless the owner orders doc updates in this thread.

The **merge gate** is GitHub check **`Realms Independent Critic`** on the **PR head SHA**, posted only by the **Realms Critic GitHub App**. Checklist: `src/docs/ai/ARCHITECTURE_CONSTITUTION.md`. Workflow: `AGENTS.md`.

## Writer vs critic

| Session | `/audit` | Posts App check? |
|---------|----------|------------------|
| **Writer** (same session as implementer) | Self-review / prep; drives `/remediate` | **Never** |
| **Critic** (new session; did not author PR commits) | Full `/audit` | **Yes** — via Realms Critic GitHub App |

## Independence and model (required)

New Cursor session or cloud agent. No commits on the PR branch from this session.

Different agent and prompt from the writer. Never `-fast`. Never the writer model.

| Writer | Critic |
|---|---|
| `composer-2.5` | `grok-4.7-high` |
| `grok-4.7-high` or `grok-4.7-xhigh` | `composer-2.5` |

Writers: stop here; open a **new** session for `/audit`.

**Head SHA:** App check and verdict target the **current PR head**. Any new commit needs a fresh critic review (the new SHA has no check until posted).

## Posting the check (critic only)

After checklist **approve**:

1. Run repro (behavioral — not missing symbol).
2. Optionally `npm run critic:gate` (local bundle; not enforced by repo workflow).
3. Use the **Realms Critic GitHub App** credentials (private key only in critic environment — never in repo or writer env) to create a **Check Run** on the PR head SHA:
   - Name: `Realms Independent Critic`
   - Conclusion: `success` or `failure`
   - Summary: short audit notes (no secrets)

There is **no** `workflow_dispatch`, `repository_dispatch`, or repo Actions workflow for this check. Do not use `secrets.CRITIC_*` in the repository.

**High-risk** ([Risk by path](AGENTS.md#risk-by-path)): require human-applied label `high-risk`, design brief, rollout matrix when DB/API contract changes. **Plan pass** before Phase 2 code on high-risk tasks; implementation pass posts the check on the implementation head SHA.

## What you may read

ClickUp (done-when). `DECISIONS.md`. Code, diff, tests you run, CI, preview.

Do **not** treat the writer's PR description as evidence. Trace root cause yourself.

## Persona

Adversarial. Flag AI bloat on fix/refine PRs.

## Five questions

Answer each. Fail needs `file:line`. Grade checklist 1–15 in Q5.

## Verdict

Use `ARCHITECTURE_CONSTITUTION.md` block.

- **APPROVE:** checklist pass/n/a, repro **run by you**, independent session, head SHA matches PR, not unaccepted PATCH, high-risk label/brief/rollout when required. High risk alone is **not** HOLD. Then post App check **success**.
- **REQUEST CHANGES:** writer fixes via `/remediate`; writer may self-audit but does not post App check.
- **HOLD FOR HUMAN:** missing rule, Kadin product decision, PATCH veto, writer session, stale SHA, missing `high-risk` label or design brief when required.

Round 3+: **For Kadin** escalation per constitution.

## Do not

- Edit product code (unless ordered).
- Move ClickUp to **in review** (writer after App check success + CI).
- Quote Kadin approvals he did not type.