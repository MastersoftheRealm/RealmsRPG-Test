# Realms Critic GitHub App (merge gate)

Authoritative workflow rules: root `AGENTS.md` (Review, Merge). This file is **how** the critic posts the check — not a second policy.

## What it does

- Posts GitHub check run **`Realms Independent Critic`** on the **PR head commit SHA**.
- Only this GitHub App’s **integration id** may satisfy the ruleset required check (not `github-actions` / integration `15368`).
- Repo **Actions workflows must not** post this check name.

## Create and install (Kadin; agents do not)

1. GitHub → **Settings** → **Developer settings** → **GitHub Apps** → **New GitHub App**.
2. **Name:** e.g. `Realms Independent Critic`.
3. **Webhook:** inactive (not needed for check runs).
4. **Repository permissions (minimum):**
   - **Checks:** Read and write
   - **Metadata:** Read-only (mandatory)
   - **Contents:** Read-only (to read PR diff paths for high-risk label rule)
   - **Pull requests:** Read-only (to read base ref, labels, head SHA)
5. **Where can this GitHub App be installed?** Only on this account.
6. **Create** → **Generate a private key** (`.pem`, once).
7. **Install** the app on **`MastersoftheRealm/RealmsRPG-Test` only**.
8. Record **App ID**, **Client ID**, **Installation ID**, and the App’s **integration id** for rulesets (replace placeholder in PR **SETTINGS-PROPOSAL** / ruleset JSON).

## Private key storage

The App private key **must not** be stored in:

- This repository (including Actions secrets)
- `.env` / `.env.local` in the repo
- Any **Cursor environment**, user secret, or credential box that **writer** coding agents can reach

**TBD by Kadin:** separate critic-only account / runtime (exact host is not chosen in the repo).

## How the critic posts a check (implementation pass)

Using the App’s **installation ID** and **private key** (JWT, then installation access token — standard GitHub App flow):

1. Confirm PR **base ref is `master`**. If the PR targets another branch (stacked PR, wrong base), post check **`failure`** and stop — do not pass.
2. Confirm **head SHA** equals the commit under review (re-fetch PR if needed).
3. If the diff is **high-risk** per `AGENTS.md` [Risk by path](../../../AGENTS.md#risk-by-path) and the PR lacks GitHub label **`high-risk`** (human-applied), post check **`failure`** and stop.
4. Run `/audit` checklist; run repro and optionally `npm run critic:gate` locally.
5. `POST /repos/MastersoftheRealm/RealmsRPG-Test/check-runs` with:
   - `name`: `Realms Independent Critic`
   - `head_sha`: PR head SHA
   - `status`: `completed`
   - `conclusion`: `success` or `failure`
   - `output.title` / `output.summary`: short audit notes (no secrets)

**Void on push:** Checks are per-commit. After a new push, the new head SHA has no success until step 5 runs again for that SHA.

## Ruleset (Kadin applies)

Repository ruleset JSON and bypass rules live in the **SETTINGS-PROPOSAL** section of the open enforcement PR (currently #609). `AGENTS.md` and `.github/CODEOWNERS` point there until merged; after merge, copy the settled JSON into this file or `DECISIONS.md`.

**Personal account (`MastersoftheRealm`):** no OrganizationAdmin or Team bypass actors. **Only** bypass: user **CollinMorrison** (`actor_id` **94765159**, `bypass_mode` **always**). Do **not** enable repository-admin or organization-admin bypass on the ruleset.

**Stacked PRs:** `strict_required_status_checks_policy` does **not** enforce GitHub stack merge order. Written rules still require: do not merge out of stack order; do not merge without the critic check on the **current head SHA**; critic **fails** PRs whose **base ≠ `master`**.