# Realms Critic GitHub App (merge gate)

Authoritative workflow: root `AGENTS.md` (Review, Merge). This file is setup, ruleset JSON, and how the critic posts the check.

## Installed app (live values)

| Field | Value |
|-------|--------|
| **App ID** / ruleset **`integration_id`** | **5837498** |
| **App slug** | `realms-independent-critic` |
| **Installation ID** (`MastersoftheRealm/RealmsRPG-Test`) | **183782952** |
| **Check run name** | `Realms Independent Critic` |
| **Ruleset applied** | **2026-11-19** (Kadin; JSON below uses `5837498`) |

Live verification: check run **135810298321** on PR **#607**, posted by App **5837498**.

## What it does

- Posts check run **`Realms Independent Critic`** on the **PR head SHA**.
- Ruleset pins that check to **this App’s integration id** (the App’s numeric **App ID** — same value GitHub uses as `integration_id` in required-status-check rules).
- **Repo Actions and repo secrets cannot satisfy** that required check once the ruleset is live with the App’s `integration_id` — they are not a substitute for the critic App.

## What this gate does *not* fix (yet)

The ruleset + App bind **writer coding agents** to an independent critic check **once writer bots no longer run with repository owner/admin rights**.

**Today:** Cursor and cloud **writer** agents act through **Kadin’s owner account** (`MastersoftheRealm`). That account can **edit or delete the ruleset**, merge without checks until the ruleset is active, and bypass policy in ways a non-admin bot could not. **Splitting writer bots from owner/admin access is Kadin’s pending product decision** (not implemented in this PR).

Until that split: the App stops **forgeable in-repo critic workflows** (PR #607 lesson); it does **not** fully stop a writer session that already has owner GitHub access from weakening enforcement outside the critic path.

## Create and install (Kadin; agents do not)

Done for this repo (see **Installed app**). For a fresh environment:

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

Must **not** be in: this repo, Actions secrets, or `.env` committed to git.

### Interim (until account split)

**Location:** Cursor **Personal** runtime secret **`REALMS_CRITIC_APP_KEY_B64`** — standard **base64** encoding of the App’s **PKCS#1 PEM** private key (not base64url).

**Use (critic runtime only):**

1. Read the secret in the critic session; **never print** it or commit it.
2. Decode **outside the repo** to a temp file (e.g. `mktemp`), mode **600**.
3. Sign the App JWT with that file; **delete the file** after use.

**Accepted risk (Kadin, 2026-11-19):** Until the planned **account split** (write-only bot GitHub account + critic-only Cursor account), **writer agents can read** this Personal secret. That is weaker than the long-term target (key reachable only from critic-only credentials). At the split: **generate a new App private key**, store it only on the critic-only side, **delete** the old key on GitHub and remove **`REALMS_CRITIC_APP_KEY_B64`**.

Do **not** put the PEM or base64 value in repo files, PR text, or logs.

## GitHub API headers (every call)

GitHub rejects requests without a **User-Agent**. Send on **every** GitHub REST request (JWT step, installation token, check run, `GET` pull):

| Header | Value |
|--------|--------|
| `Accept` | `application/vnd.github+json` |
| `X-GitHub-Api-Version` | `2022-11-28` |
| `User-Agent` | A stable app name (e.g. `RealmsIndependentCritic/1.0`) |

## Authentication (critic runtime)

### 1. App JWT

- **Header:** `{"alg":"RS256","typ":"JWT"}` (JSON, then encode).
- **Payload:** `iss` = App ID **5837498** as a **string** (GitHub accepts string `iss`); `iat` and `exp` as integer Unix seconds.
- **Clock skew:** Set **`iat = now - 60`** and **`exp = now + 540`** (nine minutes after `iat`, **`exp` within 10 minutes** of real time). Avoid `iat` in the future relative to GitHub’s clock.
- **Encoding:** Each of header and payload → **base64url** of the UTF-8 JSON, **no padding** (`=` stripped).
- **Signature:** Sign the string **`{base64url_header}.{base64url_payload}`** with **RSA-SHA256** using the PKCS#1 PEM; append **`.` + base64url(signature, no padding)**.

`Authorization: Bearer <jwt>` on the installation-token request (plus [headers above](#github-api-headers-every-call)).

### 2. Installation access token

```http
POST https://api.github.com/app/installations/183782952/access_tokens
Authorization: Bearer <app_jwt>
```

- **Body:** may be **empty** (`{}` or no body).
- **Response:** use the **`token`** field (installation access token), valid for **about one hour**.

Use `Authorization: Bearer <installation_token>` for subsequent API calls (same headers).

### 3. How the critic posts a check

1. `GET /repos/MastersoftheRealm/RealmsRPG-Test/pulls/{pull_number}` → **`base.ref` must be `master`**. Else check **`failure`** (stacked / wrong base).
2. **`head.sha`** must match the commit under review.
3. If diff is high-risk per `AGENTS.md` [Risk by path](../../../AGENTS.md#risk-by-path) and label **`high-risk`** is missing (human-applied), check **`failure`**.
4. Run `/audit` (`.cursor/commands/audit.md`): do **not** treat the writer’s PR description as evidence; grade constitution 1–15; run repro (+ optional `npm run critic:gate`).
5. `POST /repos/MastersoftheRealm/RealmsRPG-Test/check-runs` with at minimum:

```json
{
  "name": "Realms Independent Critic",
  "head_sha": "<pr-head-sha>",
  "status": "completed",
  "completed_at": "<ISO-8601 UTC, e.g. 2026-11-19T18:00:00Z>",
  "conclusion": "success"
}
```

Use `"conclusion": "failure"` when the audit fails or gates fail. GitHub expects **`status`: `completed`** and **`completed_at`** alongside **`conclusion`** for a finished check (not `conclusion` alone).

**Void on push:** Each commit needs its own check. A new push → new head SHA → critic run again.

## Repository ruleset (Kadin applies — agents do not)

**Account:** `MastersoftheRealm` is a **personal** account — no OrganizationAdmin / Team bypass. **Only** bypass actor: user **CollinMorrison**, `actor_id` **94765159**, `bypass_mode` **always**. Disable **repository admin bypass** and **organization admin bypass** on this ruleset.

**Applied 2026-11-19** with critic App **`integration_id` `5837498`**.

**After apply:** Confirm the ruleset API/UI accepted the **User** bypass on this personal-account repo (GitHub sometimes treats bypass differently than org repos).

**`strict_required_status_checks_policy: true`:** Every merge to `master` requires checks on the **current** PR head. When `master` moves, open PRs often need a **merge / update branch** → **new head SHA** → **new critic run** (extra cost; intentional).

**Stack order:** Strict checks do **not** enforce GitHub stack merge order. Policy: no merging out of stack order; critic **failure** if `base.ref !== master` (see `AGENTS.md`).

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
            "integration_id": 5837498
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