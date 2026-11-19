# Realms Critic GitHub App (merge gate)

Authoritative workflow: root `AGENTS.md` (Review, Merge). This file is setup, ruleset JSON, and how the critic posts the check.

## What it does

- Posts check run **`Realms Independent Critic`** on the **PR head SHA**.
- Ruleset pins that check to **this App’s integration id** (the App’s numeric **App ID** — same value GitHub uses as `integration_id` in required-status-check rules).
- **Repo Actions and repo secrets cannot satisfy** that required check once the ruleset is live with the App’s `integration_id` — they are not a substitute for the critic App.

## What this gate does *not* fix (yet)

The ruleset + App bind **writer coding agents** to an independent critic check **once writer bots no longer run with repository owner/admin rights**.

**Today:** Cursor and cloud **writer** agents act through **Kadin’s owner account** (`MastersoftheRealm`). That account can **edit or delete the ruleset**, merge without checks until the ruleset is active, and bypass policy in ways a non-admin bot could not. **Splitting writer bots from owner/admin access is Kadin’s pending product decision** (not implemented in this PR).

Until that split: the App stops **forgeable in-repo critic workflows** (PR #607 lesson); it does **not** fully stop a writer session that already has owner GitHub access from weakening enforcement outside the critic path.

## Create and install (Kadin; agents do not)

1. GitHub → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. **Name:** e.g. `Realms Independent Critic`.
3. **Webhook:** inactive.
4. **Repository permissions (minimum):**
   - **Checks:** Read and write
   - **Metadata:** Read-only (mandatory)
   - **Pull requests:** Read-only (base ref, labels, head SHA, file list for high-risk label rule via `pulls.listFiles`)
5. **Where can this GitHub App be installed?** Only on this account.
6. **Create** → **Generate a private key** (`.pem`, once).
7. **Install** on **`MastersoftheRealm/RealmsRPG-Test` only**.
8. Record **App ID** (= **`integration_id`** in the ruleset below), **Installation ID**, and **Client ID**.

## Private key storage

Must **not** be in: this repo, Actions secrets, `.env`, or any **Cursor environment / user secret / credential box that writer agents can reach**.

**TBD by Kadin:** separate critic-only account / runtime (exact host not chosen in repo).

## Authentication (critic runtime)

1. Build a **JWT** signed with the App’s private key (**RS256**):
   - `iss`: App ID (integer)
   - `iat`, `exp`: **`exp` at most 10 minutes** after `iat`
2. `POST https://api.github.com/app/installations/{installation_id}/access_tokens` with `Authorization: Bearer <JWT>`.
3. Use the returned **installation access token** for API calls (e.g. create check run).

## How the critic posts a check

1. `GET` pull request → **`base.ref` must be `master`**. Else check **`failure`** (stacked / wrong base).
2. **`head.sha`** must match the commit under review.
3. If diff is high-risk per `AGENTS.md` [Risk by path](../../../AGENTS.md#risk-by-path) and label **`high-risk`** is missing (human-applied), check **`failure`**.
4. Run `/audit` (`.cursor/commands/audit.md`): do **not** treat the writer’s PR description as evidence; grade constitution 1–15; run repro (+ optional `npm run critic:gate`).
5. `POST /repos/MastersoftheRealm/RealmsRPG-Test/check-runs` with `name`: `Realms Independent Critic`, `head_sha`, `conclusion` `success` or `failure`.

**Void on push:** Each commit needs its own check. A new push → new head SHA → critic run again.

## Repository ruleset (Kadin applies — agents do not)

**Account:** `MastersoftheRealm` is a **personal** account — no OrganizationAdmin / Team bypass. **Only** bypass actor: user **CollinMorrison**, `actor_id` **94765159**, `bypass_mode` **always**. Disable **repository admin bypass** and **organization admin bypass** on this ruleset.

**After apply:** Confirm the ruleset API/UI accepted the **User** bypass on this personal-account repo (GitHub sometimes treats bypass differently than org repos).

**`strict_required_status_checks_policy: true`:** Every merge to `master` requires checks on the **current** PR head. When `master` moves, open PRs often need a **merge / update branch** → **new head SHA** → **new critic run** (extra cost; intentional).

**Stack order:** Strict checks do **not** enforce GitHub stack merge order. Policy: no merging out of stack order; critic **failure** if `base.ref !== master` (see `AGENTS.md`).

Replace `REALMS_CRITIC_APP_ID` with the App’s numeric **App ID** (same as `integration_id`):

```json
{
  "name": "master — merge gate (Realms Critic App)",
  "target": "branch",
  "enforcement": "active",
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/master"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion", "parameters": {} },
    { "type": "non_fast_forward", "parameters": {} },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 0,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "required_status_checks": [
          {
            "context": "Realms Independent Critic",
            "integration_id": "REALMS_CRITIC_APP_ID"
          },
          {
            "context": "verify",
            "integration_id": 15368
          },
          {
            "context": "Lint, contrast & static gates",
            "integration_id": 15368
          },
          {
            "context": "Visual regression & accessibility",
            "integration_id": 15368
          }
        ]
      }
    }
  ],
  "bypass_actors": [
    {
      "actor_id": 94765159,
      "actor_type": "User",
      "bypass_mode": "always"
    }
  ]
}
```