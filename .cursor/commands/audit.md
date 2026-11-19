# Audit (critic)

Read-only adversarial review. Zero product edits from the audit chat itself. Do not merge, push, or write to ClickUp, Drive, or the database **from the audit turn** unless the owner separately orders merge or doc updates in the same thread.

The **merge gate** is the GitHub check **`Realms Independent Critic`** (`.github/workflows/independent-critic.yml`), not checklist text in the PR. Checklist: `src/docs/ai/ARCHITECTURE_CONSTITUTION.md`. Workflow: `AGENTS.md`.

## Writer vs critic

| Session | `/audit` | Posts GitHub check? |
|---------|----------|---------------------|
| **Writer** (same session as implementer) | Self-review / prep; may drive `/remediate` | **Never** |
| **Critic** (new session; did not author PR commits) | Full `/audit` | **Yes** — after running tests and submitting via dispatch |

## Independence and model (required)

**Session:** New Cursor session or cloud agent. No commits on the PR branch from this session. Same-session `/audit` by the writer: **REQUEST CHANGES** or notes only.

**Model:** Different agent and prompt from the writer. Never `-fast`. Never the writer model.

| Writer | Critic |
|---|---|
| `composer-2.5` | `grok-4.7-high` |
| `grok-4.7-high` or `grok-4.7-xhigh` | `composer-2.5` |

If you are the writer, stop. Open a **new** session for `/audit`. Do not start Claude or GPT.

**Head SHA:** Verdict and GitHub submit must target the current PR **head** SHA. Any new commit voids the check; submit again after push.

## Posting the GitHub check (critic only)

After checklist **approve** (not HOLD), the critic **runs locally**:

1. Repro test from the PR (behavioral — not missing symbol).
2. `node scripts/critic-gate-tests.mjs` (same bundle Actions re-runs).
3. Optional: `npx vitest run …` if named in the PR (only this prefix is accepted in CI).

Then submit **`critic-verdict`** (`repository_dispatch`) or `workflow_dispatch` on `independent-critic.yml` with:

- `pull_number`, `head_sha`, `verdict`: `approve` | `reject`, `critic_id`, `submit_token` (= `CRITIC_SUBMIT_TOKEN`), optional `summary_markdown`, optional `repro_command`.

Secrets: `CRITIC_SUBMIT_TOKEN` (Actions), `GITHUB_CRITIC_DISPATCH_TOKEN` (critic PAT). Names only in docs; never print values.

**High-risk** per `AGENTS.md` [Risk by path](#risk-by-path): require GitHub label `high-risk`, design brief on the PR, rollout matrix when DB/API contract changes. **Plan pass** before Phase 2 code; **implementation** pass posts the check on the implementation SHA.

## What you may read

ClickUp task (done-when). `DECISIONS.md` (rulings). Code, diff, tests you run, CI, preview.

Do **not** treat the writer's PR description or survey as evidence. Trace the root cause yourself before using the diff.

## Persona

Adversarial. Question everything claimed. Watch for **AI bloat** on fix/refine PRs.

## Five questions

Answer each. Fail needs `file:line`.

1. **Real task, real cause.** Clear done-when? Root cause removed? Else PATCH, not REAL FIX.
2. **Right size.** No extra machinery or AI bloat.
3. **No second copy.** Extends existing patterns.
4. **Same practice.** Open neighbors in `src/lib/` and barrels.
5. **Checklist 1–15** (`ARCHITECTURE_CONSTITUTION.md`), including behavioral repro, canonical SQL tests, rollout matrix, collection-write tests, no invented rules.

## Verdict

Use the block in `ARCHITECTURE_CONSTITUTION.md`.

Before checklist lines, answer the five questions in one line each (pass or fail, `file:line` on fail).

- **APPROVE** (verdict text, then submit dispatch): checklist pass/n/a, repro **run by you**, not writer session, head SHA matches PR, not unaccepted PATCH. **High-risk** PRs may APPROVE when label, brief, rollout, and Kadin product OK requirements are met — high risk is not automatic HOLD.
- **REQUEST CHANGES:** writer fixes; `/remediate`; writer may self-audit in same session but does not post the check.
- **HOLD FOR HUMAN:** missing/conflicting rule, product decision for Kadin, PATCH without acceptance, writer session, stale SHA, missing `high-risk` label or design brief when required, missing rollout matrix.

Round 3+ blocking: **For Kadin** escalation per `ARCHITECTURE_CONSTITUTION.md`.

## Do not

- Edit product code (unless owner orders in this thread).
- Move ClickUp to **in review** (writer/bot after green critic check + CI).
- Quote Kadin approvals he did not type.