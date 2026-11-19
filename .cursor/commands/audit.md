# Audit (critic)

Read-only adversarial review. Zero product edits unless the owner orders doc updates in this thread.

Merge gate: GitHub check **`Realms Independent Critic`** on **PR head SHA**, posted only by the **Realms Critic GitHub App**. Setup: `src/docs/ai/REALMS_CRITIC_GITHUB_APP.md`. Checklist: `src/docs/ai/ARCHITECTURE_CONSTITUTION.md`. Workflow: `AGENTS.md`.

## Writer vs critic

| Session | `/audit` | Posts App check? |
|---------|----------|------------------|
| **Writer** | Self-review / prep; `/remediate` | **Never** |
| **Critic** (new session) | Full `/audit` | **Yes** |

## Independence and model

New session; no PR-branch commits from this session. Different model from writer (never `-fast`). Writers stop; open a new session.

**Head SHA:** Target current PR head; new commit needs new check.

## Before posting the check

1. **Base ref:** `pulls.get` → `base.ref` must be **`master`**. Otherwise post App check **`failure`** (wrong base / stacked child) and stop.
2. **High-risk label:** If the diff matches `AGENTS.md` [Risk by path](AGENTS.md#risk-by-path) and label **`high-risk`** is missing (humans apply; agents do not), post App check **`failure`** and stop.
3. Run repro (behavioral). Optionally `npm run critic:gate`.
4. On full checklist **approve**, post App check **`success`** via JWT → installation token → [Create check run](src/docs/ai/REALMS_CRITIC_GITHUB_APP.md) on **head SHA**.

No repo Actions, `workflow_dispatch`, or `CRITIC_*` secrets.

**High-risk:** design brief before Phase 2 code; rollout matrix when DB/API contract changes.

## Verdict

- **APPROVE:** gates above pass; checklist pass/n/a; not unaccepted PATCH. Post **`success`** on head SHA (or **`failure`** if any gate fails — label/base are hard fails).
- **REQUEST CHANGES:** writer `/remediate`; no App check from writer session.
- **HOLD FOR HUMAN:** missing rule, Kadin product decision, PATCH veto, writer session, stale SHA.

## Do not

Edit product code (unless ordered). Move ClickUp to **in review** (writer after App success + CI). Quote Kadin approvals he did not type.