# Fail closed when an access or limit read is missing

**Status:** Plan only. No fix in this change.  
**Reviewed SHA:** `f57027a65bb8610a0571d76486f5dfe1224b2551` (origin/master). Re-checked Nov 25, 2026. Master has not moved since the Nov 20 note.  
**Supersedes the fix direction in** `plans/1dfe8wf38zz-root-cause.md`.  
**Live database (read-only, Nov 25):** `role_policies` matches `ROLE_LIMITS` for all four roles, including `can_upload_profile_picture`. `catalog_listing` on every official/species table, and `characters.visibility`, are `NOT NULL` with a `CHECK` of the legal values.

## Brief

**Goal.** A public catalog or a quota must not treat "we could not read the rule" as "allow."

**What must stay true.** A real `unlisted` species stays out of public catalogs and still loads for an admin who passes `includeUnlisted=1`. A missing `role_policies` row still uses the built-in numbers (the SQL quota function already does this). A failed read does not. Character and library creates keep the database quota. Unlisted rows stay readable by id (ADR-0027). No new shared module. No SQL change in the fix that follows this plan.

**Done when.** The tests in [Tests](#tests) pass on the real route or action, and the sites in [Fix](#fix) no longer fail open.

## Root cause

**Acute bug, already fixed.** PR #491. One helper, `src/lib/server/assert-resource-http-access.ts:6-26`, used to let the character and campaign pages render on anything except 404. It now denies. That does not reproduce on this SHA. It was one helper and two callers, not a general pattern.

**What is left is one generalized habit, two places that still grant something.** When the value that decides access or a limit is missing, unknown, or the read failed, the code substitutes the permissive built-in (listed, or `ROLE_LIMITS`) instead of stopping. Most other checks in the app already stop. These two do not. Neither grants extra access on production today: the species column cannot be null, and the live policy rows equal the built-in numbers. The code path is live. The extra grant appears the day the constraint is dropped, or the day a live policy is tighter than `ROLE_LIMITS` and that read fails.

Label for the follow-up fix: **REAL FIX** for those two paths. It is not a new framework.

## Site list

"Open" means a missing value or a failed read is treated as allow. "Closed" means the request stops, returns not-found, or uses a stricter stand-in. "Reachable" means a production request can hit that branch today and get more access than the stored rule.

| Site | On missing value or failed read | Reachable extra grant today? |
|---|---|---|
| Page preflight `assert-resource-http-access.ts:29-58` (callers: character layout `:22`, campaign layout `:23`) | Closed. 404 not-found, 401 login, network/429/5xx throws | No. Fixed by #491 |
| `parseCatalogListing` `catalog-listing.ts:49-51` | **Open.** Anything other than the string `unlisted` becomes `listed` | Only through the codex catalog below. Display callers (admin forms, official card mappers) are not the public gate |
| `mapCodexSpecies` `row-map.ts:172`, then the codex filter `api/codex/route.ts:399-404` | **Open.** The mapper rewrites a null or unknown listing to `listed` before the filter runs, so the filter cannot see the raw value. Species are loaded with `select *` (`public-table-select.ts:29`) and then filtered in JavaScript | **No.** Live `codex_species.catalog_listing` is `NOT NULL` + `CHECK (listed, unlisted)` (baseline `:9332-9335`, confirmed on the database Nov 25). The same constraint is on all six `official_*` tables |
| `GET /api/official` `official-library-server.ts:38` and `:74-76` | Closed. Public reads use `eq('catalog_listing','listed')` and throw on error | No |
| CDN backstop `public-cdn-cache.ts:30-34` | **Open** for a missing listing (only the exact string `unlisted` blocks the public cache). After `mapCodexSpecies`, a null is already `listed`, so this check never sees the bad value | No, for the same constraint |
| `getRolePolicyForRole` `role-policy.ts:92-101` | **Open.** `{ error }` is ignored. A failed `role_policies` read looks like no row and returns `ROLE_LIMITS` (`role-limits.ts:21-62`) | **The branch is live. No extra grant today.** Live rows equal the built-in numbers (read-only SELECT, Nov 25). A tighter live row plus a failed read would grant the built-in |
| `getRolePolicyForUser` profile read `role-policy.ts:109-115` | Closed relative to the built-in ladder. A failed or missing profile becomes `new_player`, the strictest built-in, then still subject to the policy read above | No extra grant while `new_player` stays the floor. It does mis-label the role during an outage |
| `rowToPolicy` missing `can_upload_profile_picture` `role-policy.ts:66-69` | **Open in TypeScript** (falls back to the built-in, which is true for playtester, developer, and admin). Storage is closed: `auth_can_upload_profile_picture` uses `coalesce(..., false)` (baseline `:1794-1804`) and the upload policies call it (`:15788`) | No. The upload uses the user client, so storage denies a missing key. Live rows all set the key |
| `createCampaignAction` `campaigns/actions.ts:76-93` | **Open**, because it uses `getRolePolicyForUser` and then inserts. There is no quota trigger. `campaigns_owner_insert` (baseline `:15015`) only checks `owner_id = auth.uid()`, and `authenticated` has `GRANT ALL` (`:17448`) | The **failed-read** branch grants nothing extra today (numbers match). A **direct insert that skips this action** ignores the quota even when the read works. That bypass is a different hole; see questions |
| Join player cap `campaigns/actions.ts:221` passed into `join_campaign_character_relational` as `p_max_players_per_campaign` (`:276`) | **Open only for the number.** The RPC recounts members itself (baseline `:2633-2652`) and is granted only to `service_role` (`:16727`). A failed `campaign_members` read at `actions.ts:213` can make the pre-check too loose; the RPC still applies whatever number it was given | Same as the policy read: no extra grant while the live cap equals the built-in |
| Character create pre-check `api/characters/route.ts:49-65` and library inserts via `insert_user_library_row_with_quota` | The TypeScript pre-check is open on a policy read error, but the insert calls `assert_account_create_quota` → `role_policy_limits_for_role` (baseline `:3605-3656`). A **read error** aborts that function (fail closed). A **missing row** uses the same built-in `CASE` as `ROLE_LIMITS` (not a `RAISE`). The function does not cover campaigns or the player cap | No extra character or library grant on a read error. Missing-row fallback is the same numbers as TypeScript |
| `isAdmin` `admin.ts:21-35` | Closed. Error or any non-admin role returns false. `catch` returns false | No |
| `resolveCharacterVisibility` `character-list-columns.ts:17`, used by `GET /api/characters/[id]` `:93` | Closed. Null or unknown becomes `private`. Column is `NOT NULL` + `CHECK` (baseline `:8804`, `:8869`), confirmed live | No |
| `GET /api/campaigns/[id]` `:40-64` | Closed. Query error throws (500). Non-member is 404 | No |
| `getCampaignForAccess` / `getSceneAccess` `tabletop/server.ts:273-317` | Closed. `{ error }` ignored, so an outage becomes null and then 404. RLS `campaigns_select_participants` (`:15029`) is the membership gate | No grant. An outage is reported as not found |
| Campaign actions `actions.ts:334`, `:467`, `:541`, `:586` | Closed. Ignored error becomes "Campaign not found" | No grant |
| Tabletop token `visible` `tabletop/server.ts:142`, filtered at `tabletop/visibility.ts:27` | **Open if the field were null** (`?? true` shows the token to players). Column is `NOT NULL DEFAULT true` (baseline `:10130`) and the read is `select *` | No |
| Sheet header `isOwner` `sheet-header-identity.tsx:86` | **Open if the sheet context is missing** (`?? true`). Both sheet routes set `isOwner` on `CharacterSheetProvider` before the header renders | No on current pages. The API still checks ownership |
| Encounter/tabletop reads that ignore `{ error }` after the caller is already authorized (`encounters/[id]/tabletop/route.ts:62`, `:86`, `:92`; `tabletop/server.ts:337-349`; active-scene `:26`; action route `:34`) | Closed for access (failed lookup becomes not found, or the write still hits RLS). A failed scene/token read can skip or duplicate rows | Not an access grant |
| Library-section "missing means visible" `character-library-section-visibility.ts:6` | Display preference the owner set. Not an authorization check | No |
| `standardLimiter` `rate-limit.ts:198-207`, `:260` | On a Redis error, falls back to the per-instance memory window. It does not remove the limit. Invite, auth, upload, and the strict limiter already pass `failClosed: true` | Not this bug |
| Character legality when the feat catalog throws `character-legality.ts:686-688` | The save still proceeds and the response is marked uncomputable. That is a product rule for legality warnings, not a resource grant | Out of scope |

`src/lib/api-client.ts:111` (`404` → null) is a client fetch helper. It is not an access check. `src/proxy.ts:26-31` does not redirect `/api/`. Hard-protected redirects in `src/lib/supabase/middleware.ts:37-44` are pages (`/my-account`, `/account`, `/campaigns/*`), not API routes. `fetchInternalApi` uses default `fetch`, which follows redirects, and the preflight treats any final 2xx as allowed (`assert-resource-http-access.ts:41`). Nothing in the proxy produces that redirect today.

Codex and official `SELECT` policies are `USING (true)` on purpose (ADR-0027). Unlisted is hidden from catalogs, not secret by id. The bug is the catalog filter, not RLS.

## Fix

No new helper. The app already has the closed pattern: `if (error) throw error`, and the official catalog already has the allowlist. Use those. Do not change `parseCatalogListing`. It is the display default (the column default is `listed`, and `catalog-listing.test.ts` locks null → listed). Using it as a security filter is what is wrong.

1. **Codex species catalog.** In `buildCodexPayloadUncached` (`api/codex/route.ts`), when `includeUnlisted` is false, read `codex_species` with `.eq('catalog_listing', 'listed')` before `mapCodexSpecies`. Throw on error, same as `official-library-server.ts:39`. Delete the JavaScript filter at `route.ts:399-404`. Admin `includeUnlisted=1` stays unfiltered. A later select that drops the column then errors the request instead of publishing every row.

2. **Role policy read.** In `getRolePolicyForRole` and `getRolePolicyForUser`, throw when the Supabase call returns `error`. Keep the fallback only when `error` is null and the row is null: unknown or missing profile → `new_player`; missing `role_policies` row → `ROLE_LIMITS` for that role. That missing-row behavior matches `role_policy_limits_for_role`'s `CASE`. Callers already turn throws into a failed action or a 500 (`createCampaignAction` `:130-132`, character POST, `getUserProfileAction` `:252-254`). Do not add `max_campaigns` to the SQL function in this fix.

3. **Do not change** the storage function, the join RPC's member recount, `isAdmin`, character visibility, or the page preflight.

**Out of scope**

- Collapsing `ROLE_LIMITS`, the `role_policies` rows, and the SQL `CASE` into one source. Separate cleanup.
- A database quota on `campaigns` insert. See question 3.
- Rewriting `parseCatalogListing`, the CDN backstop, token `visible ?? true`, or sheet `isOwner ?? true`.
- The swallowed tabletop reads that mis-report an outage or can duplicate a scene. Not an access grant.
- Making `standardLimiter` fail closed.

## Tests

The two tests already on this branch fail on current code for the behavioral reason. They stay red until the fix. The codex mock's `eq` currently returns every row (`route.test.ts:93`). The fix has to make `eq` keep only matching rows, or a correct SQL filter still looks like a failure and the existing "hide unlisted" test breaks for the wrong reason.

| Test | Path | Fails before | Passes after | Done-when |
|---|---|---|---|---|
| `src/app/api/codex/route.test.ts` "hides a species with no catalog_listing value…" | `GET /api/codex?collection=species` | The row with no listing is in `body.species` | It is absent; `species-1` remains. Assert the species query was called with `eq('catalog_listing','listed')` | Public catalog matches `/api/official` |
| Existing codex test "keeps unlisted species hidden…" and the admin `includeUnlisted=1` test | same route | Already pass | Still pass. Admin request must not add the `eq` | Unlisted stays hidden publicly and visible to an admin |
| `create-campaign-role-policy.test.ts` "refuses the campaign when the role policy read fails…" | `createCampaignAction` | Inserts a campaign under the built-in limit of 1 | `success === false` and `campaigns` length 0 | A failed policy read does not create a campaign |
| Same file, "allows one" and "allows none" | same action | Already pass | Still pass | A real row is what the action enforces |
| New case in that file: `user_profiles` select returns an error | same action | Today the code continues as `new_player` and can insert | `success === false` and no insert | A failed profile read is not a guessed role |
| New case: `role_policies` returns no error and no row | same action | Passes (inserts under the built-in) | Still inserts when the built-in allows one | Missing row stays the built-in, distinct from a failed read |
| `npx vitest run src/lib/library/catalog-listing.test.ts` | `parseCatalogListing` | Passes | Still expects null → `listed` | Display default unchanged |

No new SQL test. This fix does not change `sql/`.

## Risk

This plan change is standard risk: `plans/` plus the two tests already on the branch. It does not touch a high-risk path.

The fix that follows is also standard risk **if it stays in** `src/app/api/codex/route.ts`, `src/lib/role-policy.ts`, and the tests above. `role-policy.ts` is not in the high-risk path list. Do not edit `sql/`, `src/lib/supabase/`, or auth routes in that fix. No rollout matrix: no schema and no API request/response contract change. Public codex responses can only lose rows that are not `listed`, which they cannot contain today.

A campaign-insert quota in the database would be high-risk (`sql/`), needs a backup and your OK, and is not part of this fix.

## Questions for Kadin

1. **Ship the codex allowlist and the role-policy throw in this same PR** after you accept the plan? Recommend yes. Both are the same habit, neither needs a database change, and the failing tests are already here.
2. **A missing `role_policies` row** keeps the built-in numbers (what the character/library SQL function does today). A **failed read** stops the action. Recommend that split. Say if a missing row should stop the action too.
3. **Separate hole, not this bug.** A signed-in user can insert their own `campaigns` row without `createCampaignAction`. The database does not count campaigns. That bypass works even when the policy read succeeds. Recommend a follow-up, not this fix. A follow-up would add a quota in the database, like characters already have, and needs your OK plus a backup before any SQL runs.
4. **Leave the page preflight as it is?** Any final HTTP success, including a redirect that landed on a 200, counts as allowed. Nothing redirects `/api/` today. Recommend leave it.
