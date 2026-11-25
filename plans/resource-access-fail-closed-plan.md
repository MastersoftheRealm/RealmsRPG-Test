# Fail closed when an access or limit read is missing

**Status:** Plan only. No fix in this commit. Revised after the critic plan pass on `37a63ede` (changes required).  
**Reviewed SHA:** `f57027a65bb8610a0571d76486f5dfe1224b2551` (origin/master). Re-checked Nov 25, 2026. Master has not moved since the Nov 20 note.  
**Supersedes the fix direction in** `plans/1dfe8wf38zz-root-cause.md`.  
**Live database (read-only, Nov 25):** `role_policies` matches `ROLE_LIMITS` for all four roles, including `can_upload_profile_picture`. `catalog_listing` on every official/species table, and `characters.visibility`, are `NOT NULL` with a `CHECK` of the legal values. Invite codes: 0 duplicated values across 12 campaigns. 4 of those 12 campaigns have no `campaign_members` row for the owner.

## Brief

**Goal.** A public catalog, a quota, or an invite code must not treat "we could not read the rule" as "allow."

**What must stay true.** A real `unlisted` species stays out of public catalogs and still loads for an admin who passes `includeUnlisted=1`. A missing `role_policies` row still uses the built-in numbers (the SQL quota function already does this) and the miss is logged. A failed read does not use those numbers. Character and library creates keep the database quota. Unlisted rows stay readable by id (ADR-0027). No new shared module. No SQL in the code fix.

**Done when.** The tests in [Tests](#tests) pass, and the [In this PR](#in-this-pr-code-fix-no-sql) sites no longer fail open. The invite-code collision and the campaign-insert quota stay deferred until the SQL follow-up.

## Root cause

**Acute bug, already fixed.** PR #491. One helper, `src/lib/server/assert-resource-http-access.ts:6-26`, used to let the character and campaign pages render on anything except 404. It now denies. That does not reproduce on this SHA. It was one helper and two callers, not a general pattern.

**What is left is one habit.** When the value that decides access or a limit is missing, unknown, or the read failed, some code substitutes the permissive built-in (listed, `ROLE_LIMITS`, or "this invite code is free") instead of stopping.

Two of those grants are latent. The species column cannot be null, and the live policy rows equal the built-in numbers. The code path is live. The extra grant appears the day the constraint is dropped, or the day a live policy is tighter than `ROLE_LIMITS` and that read fails.

The invite-code check is a real hole with a different shape. It is not an outage-only fallback. The user client cannot see every campaign, there is no unique index, and an owner can overwrite `invite_code`. Zero codes are duplicated today. Closing it properly needs SQL. This PR only stops the check from treating a **failed read** as "unused."

Label for the code fix: **REAL FIX** for the catalog filter, the policy read, and the invite-code read error. The invite-code collision and the campaign-count bypass stay open until the SQL follow-up. That follow-up is the real fix for those two. This plan does not pretend the TypeScript throw closes them.

## In this PR (code fix, no SQL)

1. **Codex species catalog.** In `buildCodexPayloadUncached` (`api/codex/route.ts`), when `includeUnlisted` is false, read `codex_species` with `.eq('catalog_listing', 'listed')` before `mapCodexSpecies`, and throw on error, same as `official-library-server.ts:39`. On the **raw** rows, before `mapCodexSpecies`, also drop any row whose `catalog_listing` is not strictly `=== 'listed'`. Delete the filter at `route.ts:399-404`, which runs `parseCatalogListing` after the mapper has already rewritten the value. Admin `includeUnlisted=1` skips both checks. Do not change `parseCatalogListing`. It is the display default (the column default is `listed`, and `catalog-listing.test.ts` locks null → listed).

   `eq` is the same allowlist `/api/official` already uses. If the column is missing, that query errors and `GET /api/codex` already returns 500 with `Cache-Control: private, no-store` (`route.ts:516-544`). A check after `mapCodexSpecies` cannot be the backstop: `row-map.ts:172` has already turned null and unknown into `listed`. The raw `=== 'listed'` check is what still hides a row if a later edit drops the `eq` or a caller returns rows the filter did not apply to.

2. **Role policy read.** In `getRolePolicyForRole` and `getRolePolicyForUser` (`role-policy.ts:92-115`), throw when the Supabase call returns `error`. Keep the fallback only when `error` is null and the row is null:
   - Unknown or missing profile → `new_player`.
   - Missing `role_policies` row → `ROLE_LIMITS` for that role, and `reportError` from `@/lib/observability` with a config-error scope. Today the miss is silent.
   That missing-row result matches `role_policy_limits_for_role`'s `CASE`. Callers already turn throws into a failed action or a 500 (`createCampaignAction` `:130-132`, character POST, `getUserProfileAction` `:252-254`). Do not add `max_campaigns` to the SQL function here.

   A failed `user_profiles` read must be tested on `getRolePolicyForUser` itself. `createCampaignAction` calls `ensureUserProfile` at `actions.ts:95`, and that helper already throws on a profile read error (`ensure-user-profile.ts:24`). An action test that fails every `user_profiles` select already returns `success: false` on master, so it does not show this bug. Failing only `select('role')` would, because `ensureUserProfile` selects `id`. The required test is the direct one.

3. **Invite-code read error only.** In `ensureUniqueInviteCode` (`campaigns/actions.ts:48-58`), throw when the uniqueness select returns `error`. Today `{ error }` is ignored, `existing` is empty, and the new code is treated as free. The throw does not make the check see campaigns RLS hides, and it does not stop an owner from copying a code onto their own row. Those stay in the SQL follow-up.

## Deferred SQL follow-up

Needs Kadin's OK and a named backup before any SQL runs. One follow-up, not this PR. High-risk (`sql/`).

- **Campaign insert quota.** `campaigns_owner_insert` (baseline `:15015`) only checks `owner_id = auth.uid()`, and `authenticated` has `GRANT ALL` (`:17448`). A signed-in user can insert a campaign without `createCampaignAction`. The action's TypeScript quota does not cover that path.
- **Invite codes.** `ensureUniqueInviteCode` reads with the user client, so RLS (`campaigns_select_participants`, baseline `:15029`) hides campaigns the user is not in. A code on one of those campaigns looks unused, and the insert succeeds because `campaigns_invite_code_idx` (baseline `:12124`) is not unique. Separately, `campaigns_owner_update` (`:15022`) lets an owner rewrite every column, including `invite_code`. A member of campaign A can copy A's code onto their own campaign. Joining through the action then errors: `maybeSingle()` at `actions.ts:200-208` returns an error when two rows match, and the action responds "Failed to look up invite code." The join function's `SELECT * INTO` (baseline `:2590-2596`) is not `STRICT`. If that function runs against a duplicated code, Postgres keeps the first row and the character can be written onto the wrong campaign. The action does not call the function when `maybeSingle()` errors. The function is still unsafe. Live count of duplicated codes: 0. The follow-up adds a unique index and stops owners from changing `invite_code`.
- **Grants to list in that follow-up, not to change here.** Live `information_schema` shows `authenticated` has `SELECT`, `INSERT`, `UPDATE`, `DELETE`, `TRUNCATE`, `REFERENCES`, and `TRIGGER` on both `campaigns` and `role_policies`. RLS does not apply to `TRUNCATE`. The follow-up decides whether to revoke `TRUNCATE`, `TRIGGER`, and `REFERENCES`.
- **Known data, not this bug.** 4 live campaigns have no owner row in `campaign_members`. `createCampaignAction` only logs a failed owner-membership write (`actions.ts:121-127`). Repair is not part of the code fix.

## Site list

"Open" means a missing value or a failed read is treated as allow. "Closed" means the request stops, returns not-found, or uses a stricter stand-in. "Reachable" means a production request can hit that branch today and get more access than the stored rule.

| Site | On missing value or failed read | Reachable extra grant today? |
|---|---|---|
| Page preflight `assert-resource-http-access.ts:29-58` (callers: character layout `:22`, campaign layout `:23`) | Closed. 404 not-found, 401 login, network/429/5xx throws | No. Fixed by #491 |
| `parseCatalogListing` `catalog-listing.ts:49-51` | **Open.** Anything other than the string `unlisted` becomes `listed` | Only through the codex catalog below. Display callers are not the public gate |
| `mapCodexSpecies` `row-map.ts:172`, then the codex filter `api/codex/route.ts:399-404` | **Open.** The mapper rewrites a null or unknown listing to `listed` before the filter runs. Species are loaded with `select *` (`public-table-select.ts:29`) | **No.** Live `codex_species.catalog_listing` is `NOT NULL` + `CHECK (listed, unlisted)` (baseline `:9332-9335`, confirmed Nov 25). The same constraint is on all six `official_*` tables |
| `GET /api/official` `official-library-server.ts:38` and `:74-76` | Closed. Public reads use `eq('catalog_listing','listed')` and throw on error | No |
| CDN backstop `public-cdn-cache.ts:30-34` | **Open** for a missing listing (only the exact string `unlisted` blocks the public cache). After `mapCodexSpecies`, a null is already `listed` | No, for the same constraint |
| `getRolePolicyForRole` `role-policy.ts:92-101` | **Open.** `{ error }` is ignored. A failed `role_policies` read looks like no row and returns `ROLE_LIMITS` (`role-limits.ts:21-62`) | **The branch is live. No extra grant today.** Live rows equal the built-ins (Nov 25). A tighter live row plus a failed read would grant the built-in |
| `getRolePolicyForUser` profile read `role-policy.ts:109-115` | Closed relative to the built-in ladder. A failed or missing profile becomes `new_player`, then still subject to the policy read above | No extra grant while `new_player` stays the floor. It does mis-label the role during an outage |
| `rowToPolicy` missing `can_upload_profile_picture` `role-policy.ts:66-69` | **Open in TypeScript** (falls back to the built-in, true for playtester and above). Storage is closed: `auth_can_upload_profile_picture` uses `coalesce(..., false)` (baseline `:1794-1804`) and the upload policies call it (`:15788`) | No. The upload uses the user client. Live rows set the key |
| `createCampaignAction` quota `campaigns/actions.ts:76-93` | **Open** on a failed policy read, then inserts. No quota trigger | Failed-read grants nothing extra today (numbers match). Direct insert skips the action even when the read works. Deferred |
| `ensureUniqueInviteCode` `campaigns/actions.ts:48-58` | **Open.** A read error is ignored, so the code is treated as free. The user client cannot see other people's campaigns. `campaigns_owner_update` (`:15022`) lets an owner set `invite_code` to any value | **Real.** 0 duplicate codes live, so nobody has used it yet. A failed read can accept a code today. Copying a visible code, or colliding with a hidden one, is possible today and needs the SQL follow-up |
| Join player cap `campaigns/actions.ts:221` passed as `p_max_players_per_campaign` (`:276`) | **Open only for the number.** The RPC recounts members (baseline `:2633-2652`) and is granted only to `service_role` (`:16727`). A failed `campaign_members` read at `actions.ts:213` can make the pre-check too loose; the RPC still applies the number it was given | No extra grant while the live cap equals the built-in |
| Character create pre-check `api/characters/route.ts:49-65` and library inserts via `insert_user_library_row_with_quota` | The TypeScript pre-check is open on a policy read error. The insert calls `assert_account_create_quota` → `role_policy_limits_for_role` (baseline `:3605-3656`). A **read error** aborts that function. A **missing row** uses the same built-in `CASE` (not a `RAISE`). The function does not cover campaigns or the player cap | No extra character or library grant on a read error |
| `isAdmin` `admin.ts:21-35` | Closed. Error or any non-admin role returns false | No |
| `resolveCharacterVisibility` `character-list-columns.ts:17`, used by `GET /api/characters/[id]` `:93` | Closed. Null or unknown becomes `private`. Column is `NOT NULL` + `CHECK` (baseline `:8804`, `:8869`) | No |
| `GET /api/campaigns/[id]` `:40-64` | Closed. Query error throws (500). Non-member is 404 | No |
| `getCampaignForAccess` / `getSceneAccess` `tabletop/server.ts:273-317` | Closed. `{ error }` ignored, so an outage becomes null and then 404 | No grant. An outage is reported as not found |
| Campaign actions `actions.ts:334`, `:467`, `:541`, `:586` | Closed. Ignored error becomes "Campaign not found" | No grant |
| Tabletop token `visible` `tabletop/server.ts:142`, filtered at `tabletop/visibility.ts:27` | **Open if the field were null** (`?? true`). Column is `NOT NULL DEFAULT true` (baseline `:10130`) | No |
| Sheet header `isOwner` `sheet-header-identity.tsx:86` | **Open if the sheet context is missing** (`?? true`). Both sheet routes set `isOwner` on the provider | No on current pages |
| Encounter/tabletop reads that ignore `{ error }` after the caller is authorized (`encounters/[id]/tabletop/route.ts:62`, `:86`, `:92`; `tabletop/server.ts:337-349`; active-scene `:26`; action route `:34`) | Closed for access. A failed scene or token read can skip or duplicate rows | Not an access grant |
| Library-section "missing means visible" `character-library-section-visibility.ts:6` | Owner display preference, not authorization | No |
| `standardLimiter` `rate-limit.ts:198-207`, `:260` | Redis error falls back to the per-instance window. Invite, auth, upload, and the strict limiter already use `failClosed: true` | Not this bug |
| Character legality when the feat catalog throws `character-legality.ts:686-688` | The save still proceeds and is marked uncomputable | Out of scope |
| Owner membership write `actions.ts:121-127` | A failed insert is logged and the action still returns success. 4 live campaigns have no owner member row | Not a fail-open grant. Data gap for the SQL follow-up |

`src/lib/api-client.ts:111` (`404` → null) is a client fetch helper, not an access check. `src/proxy.ts:26-31` does not redirect `/api/`. Hard-protected redirects in `src/lib/supabase/middleware.ts:37-44` are pages only. `fetchInternalApi` (`internal-api-fetch.ts:22-25`) uses default `fetch`, which follows redirects, and the preflight treats any final 2xx as allowed (`assert-resource-http-access.ts:41`). Nothing in the proxy produces that redirect today.

Codex and official `SELECT` policies are `USING (true)` on purpose (ADR-0027). Unlisted is hidden from catalogs, not secret by id.

## Tests

The two tests already on this branch fail on current code for the behavioral reason. They stay red until the code fix. The codex mock's `eq` currently returns every row (`route.test.ts:93`). The fix has to make `eq` keep only matching rows, or the "hide unlisted" test breaks for the wrong reason. The raw `=== 'listed'` backstop is what makes the no-listing test fail before the fix even if the mock's `eq` is a no-op: today's filter uses `parseCatalogListing` and serves the row.

| Test | Path | Fails before | Passes after | Done-when |
|---|---|---|---|---|
| `src/app/api/codex/route.test.ts` "hides a species with no catalog_listing value…" | `GET /api/codex?collection=species` | The row is in `body.species` | It is absent; `species-1` remains. Assert `eq('catalog_listing','listed')` on that query | Public catalog matches `/api/official`, with the raw backstop |
| Existing "keeps unlisted species hidden…" and the admin `includeUnlisted=1` test | same route | Already pass | Still pass. The admin request must not add `eq` or the raw backstop | Unlisted stays hidden publicly and visible to an admin |
| New codex case: the species select returns an error | `GET /api/codex` | **Already passes** on master (`route.ts:538-544`) | Still 500, body `error: 'Failed to load codex'`, `Cache-Control` is `private, no-store` | A thrown catalog read is not cached as a public success |
| `create-campaign-role-policy.test.ts` "refuses the campaign when the role policy read fails…" | `createCampaignAction` | Inserts under the built-in limit of 1 | `success === false` and `campaigns` length 0 | The action does not create a campaign when the policy read fails |
| Same file, "allows one" and "allows none" | same action | Already pass | Still pass | A real row is what the action enforces |
| New `src/lib/role-policy.test.ts`: failed `role_policies` read | `getRolePolicyForUser` | Resolves with `ROLE_LIMITS` | Rejects | The helper throws. The action test alone only shows the catch |
| New case in that file: failed `user_profiles` read | `getRolePolicyForUser` | Resolves as `new_player` | Rejects | Not an action test. `ensureUserProfile` already throws on `select('id')`, so a blanket profile failure does not fail `createCampaignAction` on master |
| New case in that file: `role_policies` returns no error and no row | `getRolePolicyForUser` | Returns `ROLE_LIMITS[role]` and does not log | Still returns `ROLE_LIMITS[role]`, and `reportError` was called for a config error | Missing row stays the built-in and is no longer silent |
| `npx vitest run src/lib/library/catalog-listing.test.ts` | `parseCatalogListing` | Passes | Still expects null → `listed` | Display default unchanged |
| New case on `ensureUniqueInviteCode` via `createCampaignAction`: only the `invite_code` select returns an error | `createCampaignAction` | Returns success and inserts. `!existing` is true, and the later owner-count select (`actions.ts:78-82`) still succeeds, so it does not hide the bug | `success === false` and no insert | A failed uniqueness read does not mint a code. Failing every `campaigns` select does not count: the count query already throws on master |

No new SQL test. This PR does not change `sql/`.

## Noted, not in this PR

- **Header username.** `getUserProfileAction` (`actions.ts:220-254`) loads the profile and then `getRolePolicyForUser`. If that throw lands in the existing catch, the action returns `{ profile: null, error }`. `useProfile` (`use-profile.ts:39-41`) then has no username, and the header avatar initial (`header.tsx:436-446`) falls through to the auth display name, email, or `?`. Display only. No access change. Accepted cost of failing closed. Do not special-case the header.
- **Preflight redirects.** Optional later: pass `redirect: 'manual'` in `fetchInternalApi` and treat 3xx as deny in `denyResourcePage`. Not in this PR. Question 4 stays "leave the preflight."
- Token `visible ?? true`, sheet `isOwner ?? true`, the CDN string check, swallowed tabletop reads, and `standardLimiter` stay as in the site list.

## Risk

This plan commit is standard risk: `plans/` only, plus the tests already on the branch. It does not touch a high-risk path.

The code fix is standard risk if it stays in `src/app/api/codex/route.ts`, `src/lib/role-policy.ts`, `src/app/(main)/campaigns/actions.ts` (`ensureUniqueInviteCode` only), and the tests above. `role-policy.ts` is not on the high-risk path list. Do not edit `sql/`, `src/lib/supabase/`, or auth routes in that fix. No rollout matrix: no schema and no request-shape change. Public codex responses can only lose rows that are not `listed`, which they cannot contain today.

The deferred SQL follow-up is high-risk. It needs its own plan, a backup, and Kadin's OK before apply.

## Questions for Kadin

Critic plan pass on `37a63ede` recommends **yes** to all four. They stay open until you say so.

1. **Ship the codex allowlist, the role-policy throw, and the invite-code read-error throw in this same PR** after you accept the plan? Critic: yes. The SQL for invite codes and the campaign quota stays a follow-up.
2. **A missing `role_policies` row** keeps `ROLE_LIMITS` for that role and logs a config error. A **failed read** throws. Critic: yes.
3. **Defer the database work** until a follow-up you approve, with a backup first. That follow-up is the campaign-insert quota, a unique `invite_code`, owners blocked from editing `invite_code`, and a decision on the `TRUNCATE` / `TRIGGER` / `REFERENCES` grants. Critic: yes.
4. **Leave the page preflight as it is?** Any final HTTP success counts as allowed. Nothing redirects `/api/` today. The optional `redirect: 'manual'` note is not part of this yes. Critic: yes.
