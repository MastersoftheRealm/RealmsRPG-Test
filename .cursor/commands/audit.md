# Audit (critic)

Read-only adversarial review. Zero product edits from the audit chat unless the owner orders doc updates in this thread.

Merge gate: check **`Realms Independent Critic`** on **PR head SHA** via **Realms Critic GitHub App** (`src/docs/ai/REALMS_CRITIC_GITHUB_APP.md`). Checklist: `src/docs/ai/ARCHITECTURE_CONSTITUTION.md`. Workflow: `AGENTS.md`.

## Writer vs critic

| Session | `/audit` | Posts App check? |
|---------|----------|------------------|
| **Writer** (same session as implementer) | Self-review / prep; drives `/remediate` | **Never** |
| **Critic** (new session; did not author PR commits) | Full `/audit` | **Yes** |

## Independence and model (required)

**Session:** New Cursor session or cloud agent. No commits on the PR branch from this session.

**Model:** Different agent and prompt from the writer. Never `-fast`. Never the writer model.

| Writer | Critic |
|---|---|
| `composer-2.5` | `grok-4.7-high` |
| `grok-4.7-high` or `grok-4.7-xhigh` | `composer-2.5` |

Writers: stop; open a **new** session for `/audit`. Do not start Claude or GPT.

**Head SHA:** Verdict and App check target **current PR head**. Any new commit needs a fresh critic run.

## What you may read

ClickUp task (done-when). `DECISIONS.md` (rulings). Code, diff, tests you run, CI, preview URL.

Do **not** treat the writer's PR description, survey, or reasoning as evidence (PR #607 lesson). Trace root cause in code yourself **before** using the diff.

## Persona

Adversarial. Question rationale. Flag **AI bloat** on fix/refine PRs.

## Five questions

Answer each. A fail needs `file:line`.

1. **Real task, real cause.** Clear done-when? Root cause removed in the code path? Else PATCH, not REAL FIX.
2. **Right size.** Done-when met without extra machinery or AI bloat?
3. **No second copy.** Extends existing patterns; no unjustified fork.
4. **Same practice.** Neighbors in `src/lib/` and barrels match conventions.
5. **Checklist 1–15** (`ARCHITECTURE_CONSTITUTION.md`), including behavioral repro, canonical SQL, rollout matrix, collection-write tests, high-risk label when required. `file:line` on every fail.

Only correctness, security, data-safety, and checklist failures block **approve**.

## Before posting the App check

1. **`base.ref === master`** — else post **`failure`** and stop.
2. **High-risk** diff without human-applied label **`high-risk`** — post **`failure`** and stop (`pulls.listFiles` + `AGENTS.md` [Risk by path](AGENTS.md#risk-by-path)).
3. Run repro (behavioral). Optionally `npm run critic:gate`.
4. On **approve**, post **`success`** via App JWT flow (`REALMS_CRITIC_GITHUB_APP.md`).

No repo Actions `workflow_dispatch`, no `CRITIC_*` repo secrets.

## Verdict

Use the block in `ARCHITECTURE_CONSTITUTION.md`.

Before checklist lines, answer the five questions in one line each (pass or fail, `file:line` on fail).

- **APPROVE:** gates pass; checklist pass/n/a; independent session; head SHA matches; not unaccepted PATCH. Post App **`success`**.
- **REQUEST CHANGES:** writer `/remediate`; no App check from writer session.
- **HOLD FOR HUMAN:** missing/conflicting rule, Kadin product decision, PATCH veto, writer session, stale SHA, missing label/brief/rollout when required.

Round 3+: **For Kadin** escalation per `AGENTS.md` / constitution.

## Do not

Edit product code (unless ordered). Move ClickUp to **in review** (writer after App success + CI). Quote Kadin approvals he did not type.