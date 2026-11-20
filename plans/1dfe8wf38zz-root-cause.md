# 1dfe8wf38zz — Fail-open resource-access checks (root cause only)

**Reviewed SHA:** `f57027a6` (origin/master, Nov 20, 2026). No fix in this PR. Database: one read-only SELECT on `role_policies`.

## Symptom (allegation LIB3-002)

Resource-access checks deny only on 404 and let everything else through.

## Proven cause: real, one-off, already fixed

- **Where:** one shared helper, `src/lib/server/assert-resource-http-access.ts`, two callers (`src/app/(detail)/characters/[id]/layout.tsx:22`, `src/app/(detail)/campaigns/[id]/layout.tsx:23`).
- **Earlier fix that caused it:** `f2e04fde` ("return HTTP 404 on character and campaign denial pages") added `if (res.status === 404) notFound();`. Any other result (401, 429, 5xx, a thrown fetch) let the page render.
- **Impact was a page shell, not data:** both pages are client components that load data from the same APIs, and those APIs deny on their own.
- **Fixed by PR #491** (`8f417e80`, Nov 8): `denyResourcePage` (`:6-26`) maps 404 to not-found, 401 to the login redirect, and network/429/5xx to `ResourceAccessUnavailableError`; anything else is not-found. Proof: the current 12 tests run against the `f2e04fde` file fail 6 (401, 429 twice, 503 twice, network). On master all 12 pass.
- **Disposition:** fixed. It does not reproduce on master.

## Survey: every access check today

| Path | On error or no row |
|---|---|
| Detail-page preflight (`assert-resource-http-access.ts:29-58`) | Closed |
| `GET /api/characters/[id]` (`route.ts:74-148`); null visibility becomes private (`character-list-columns.ts:17`) | Closed (throw → 500, no row → 404) |
| Campaign character view → `get_campaign_character_relational_document` (`sql/schema/0000_baseline_2026-11-20.sql:1906-1985`; `character-persistence-server.ts:62-89`) | Closed; `visibility` is NOT NULL + CHECK (`:8804`, `:8869`) |
| Owner library / enrichment, service role after caller authorizes (`owner-library-for-view.ts:63-67`, `character-view-enrichment-server.ts:55-73`) | Closed (throw) |
| User library, crafting, encounters, enhanced items, portrait upload (`.eq('user_id', uid)` + throw) | Closed |
| `GET /api/campaigns/[id]` (`route.ts:40-64`), rolls (`route.ts:77-107`) | Closed |
| Tabletop `getCampaignForAccess` / `getSceneAccess` (`tabletop/server.ts:273-317`): `{ error }` ignored, membership left to RLS (`campaigns_select_participants`, sql `:15029`) | Closed (null → 404) |
| Campaign actions (`campaigns/actions.ts:334,467,541,586`): `{ error }` ignored | Closed, but an outage is reported as "Campaign not found" |
| `isAdmin` (`admin.ts:26-35`): `{ error }` ignored; every admin route, action and layout uses it | Closed (false) |
| Official unlisted filter (`official-library-server.ts:38,76`): SQL `catalog_listing = 'listed'` | Closed |
| **Codex species unlisted filter** (`api/codex/route.ts:399-404` via `parseCatalogListing`, `catalog-listing.ts:49-51`): missing or unknown value counts as listed | **Open (latent)** |
| **Role policy** (`role-policy.ts:92-101`, `:109-115`): `{ error }` ignored; a failed `role_policies` read returns the built-in `ROLE_LIMITS` (`role-limits.ts:21-62`) | **Open whenever the database is stricter than the built-in values** |

**Role-policy callers.** These rely only on the TypeScript value: `createCampaignAction` (`actions.ts:76-93`) and the join player cap (`actions.ts:221`, passed into the join RPC). These have a database backstop: the profile picture (storage RLS `auth_can_upload_profile_picture`, sql `:1794-1805`), and the character and library quotas (`role_policy_limits_for_role`, sql `:3605`, which raises on a read error).

## One-off or widespread

The alleged bug was one-off: one shared helper, two callers, now fixed. No forked copy of "deny only on 404" remains. The only other 404 → null (`api-client.ts:111`) is a client fetch helper, not an access check. Two latent fail-to-default spots remain, and each sits in a **fork**:

1. **Listing filter, two copies.** The `/api/official` path uses a SQL allowlist. The `/api/codex` path filters in JS and defaults to listed.
2. **Role limits, three copies:** the `role_policies` rows, `ROLE_LIMITS` in TypeScript, and the SQL `CASE` in `role_policy_limits_for_role`. The TypeScript copy treats a read error like a missing row. The SQL copy raises.

Neither one leaks today. `catalog_listing` is NOT NULL + CHECK (sql `:9332-9335`) and is read with `*`. Live `role_policies` equals `ROLE_LIMITS` (read-only SELECT, Nov 20).

## Tests in this PR (fail on master; the repo has no expected-to-fail convention)

- `src/app/api/codex/route.test.ts`, "hides a species with no catalog_listing value…": the species is served to the public.
- `src/app/(main)/campaigns/create-campaign-role-policy.test.ts`, "refuses the campaign when the role policy read fails…": the campaign is created under the built-in limit. Its two controls (policy allows one, policy allows none) pass.

## Fix direction (not implemented)

1. Filter species in the codex query the same way the official path does, which removes the JS default.
2. In `role-policy.ts`, check `{ error }` and throw (callers already turn throws into failures). Keep the missing-row fallback.
3. Collapsing the three copies of the limits is a separate cleanup.

## Open questions

1. Are role-policy quotas in scope here, or a separate task? (Suggest separate. It touches roles.)
2. Fix the latent codex fork even though the constraint blocks it today? (Suggest yes. It is small and deletes a fork.)
3. The preflight treats any 2xx as allowed, including after a followed redirect. `/api/` is never redirected by `src/proxy.ts` today. Leave as is?
4. Some swallowed errors are data integrity, not access: `encounters/[id]/tabletop/route.ts:62,86,92`, `tabletop/server.ts:337-349`, `campaigns/actions.ts:213`. File them separately?
