# Independent Engineering Audit — API Surface, AuthN/AuthZ, Input Validation

**Date:** 2026-08-13
**Scope:** `src/app/api/**` (31 route files + 11 test files), `src/proxy.ts`, `src/lib/supabase/**`, `src/components/auth/**`, `src/app/(auth)/**`, `src/app/auth/**`, `src/lib/validation/**`, shared helpers (`src/lib/api-validation.ts`, `src/lib/api-error.ts`, `src/lib/rate-limit.ts`, `src/lib/admin.ts`, `src/lib/role-policy.ts`, `src/lib/library-columnar.ts`, `src/lib/owner-library-for-view.ts`, `src/lib/validate-image.ts`, `src/lib/safe-redirect.ts`, `src/lib/ensure-user-profile.ts`), `next.config.ts`, `vercel.json`.
**Method:** Full read of every file in scope. Where a code path depends on database behaviour (RLS, unique constraints, storage bucket flags) I verified against the live Supabase project `lbqhiwudvifmkjtkccdg` with read-only `SELECT`s against `pg_policies`, `pg_index`, `storage.buckets`, and the Supabase security advisor. Docs were not trusted; several are stale (noted below).
**Constraint honoured:** read-only. No file was created, edited or deleted except this report. No build, install, or git write command was run.

Two files outside the literal scope list are included because they are the *only* write path for campaigns and codex data, and the brief asks about service-role/RLS bypass: `src/app/(main)/campaigns/actions.ts` and `src/app/(main)/admin/codex/actions.ts`.

---

## 0. What is genuinely fine (so you know coverage is real)

I want to be explicit about this because the finding list below is long and could give a worse impression than the code deserves.

- **No unauthenticated mutating route exists.** Every `POST`/`PATCH`/`DELETE` in `src/app/api/**` calls `getSession()` or `requireAdminSession()` before touching data. I checked all 31 route files individually.
- **`getSession()` is safe.** `src/lib/supabase/session.ts:26` calls `supabase.auth.getUser()`, not `auth.getSession()`. The name is misleading (see P3-1) but the implementation is the correct, server-verified call. The one `auth.getSession()` in the codebase is `src/app/(auth)/reset-password/page.tsx:49`, client-side, used only to decide whether to render the form — the actual password change is enforced by Supabase.
- **No secret is exposed to the client.** `SUPABASE_SERVICE_ROLE_KEY` appears only in server modules (`src/lib/supabase/server.ts:43`, `src/app/api/admin/users/route.ts:18`, `src/app/api/admin/users/update-role/route.ts:17`, `src/app/(auth)/actions.ts:21`). No `NEXT_PUBLIC_*` variable holds a secret; the only two are the project URL and the publishable key.
- **No private response is cached publicly.** `/api/codex` (`route.ts:448`) and `/api/official/[type]` (`route.ts:143,166`) set `private, max-age=0, must-revalidate`; every other route sets no cache header and is dynamic because it reads cookies. There is no `revalidate`, no `unstable_cache`, no `force-static`, no `fetch(..., {next:{revalidate}})` anywhere in the API tree. **`src/docs/DATA_HANDLING.md:22,53` and `DEPLOYMENT_AND_SECRETS_SUPABASE.md:143` claim these routes serve `public, max-age=300, s-maxage=600` — that documentation is wrong and describes a P0 that no longer exists in code.** Fix the docs, not the code.
- **RLS is real and correct, and it is the actual backstop.** Verified live: `characters`, `campaigns`, `campaign_members`, `campaign_rolls`, `crafting_sessions`, `encounters`, `user_profiles`, `user_powers`, `user_items`, `user_enhanced_items`, `usernames` all have owner-scoped policies keyed on `auth.uid()`. Supabase's security advisor reports **zero** `rls_disabled_in_public` lints. The only advisory is `auth_leaked_password_protection` (see P2-11).
- **Storage is well configured.** All three public buckets enforce `file_size_limit = 5 MB` and an image-only `allowed_mime_types` allowlist at the bucket level, on top of the application's magic-byte check. `storage.objects` policies scope writes and listing to `{uid}/…` (portraits) and `{uid}.…` (profile pictures). `codex-art` has no `authenticated` INSERT policy at all — only the service role can write it. Path traversal is not possible: the portrait path is built from `user.uid` plus a regex-validated UUID (`upload/portrait/route.ts:17,44`) and the extension comes from detected magic bytes, never the filename (`validate-image.ts:43-73`).
- **Upload validation is above average.** `detectImageMime` reads the first 12 bytes and derives both the stored extension and the `contentType`, so a `.svg`/`.html` polyglot cannot be stored with an executable content type.
- **Ownership checks are consistently `.eq('user_id', user.uid)` on both read and write**, and IDOR returns 404 rather than 403 (no existence oracle). This is done correctly and uniformly across characters, crafting, encounters, enhanced items, and library.
- **Campaign roll spoofing is properly blocked** (`campaigns/[id]/rolls/route.ts:184-194`): the roster entry must belong to the caller, or the caller must be the owner, and the displayed character name is taken from the roster, not the request body.
- **Admin surface has a real server-side role check** backed by `user_profiles.role` (`src/lib/admin.ts:21-36`), and `role_policies` additionally enforces admin-only writes at the RLS layer. The last-admin demotion guard (`update-role/route.ts:66-81`) and the append-only `admin_role_audit` insert are good.
- **Redirect sanitisation is correct.** `sanitizeRedirectPath` (`src/lib/safe-redirect.ts:7-23`) rejects `//`, `/x:`, and any `://`, and is applied at every callback/redirect site.
- **Prototype pollution is blocked** on the JSON-blob mutation schemas (`api-validation.ts:86-99`).
- **Security headers are present and sane** (`next.config.ts:39-99`): HSTS with preload, `nosniff`, `frame-ancestors 'self'`, `object-src 'none'`, `base-uri`/`form-action` locked to self, a restrictive `Permissions-Policy`.

---

## 1. Per-route table

Legend — authN: does the handler verify a server-side session. ownership: does it verify the caller owns/may access the specific resource. zod: is the request body/params validated with a schema. RL: rate limited. test: has a co-located `.test.ts` exercising this method.

| Route | Methods | authN? | ownership check? | zod? | rate limit? | test? |
|---|---|---|---|---|---|---|
| `/api/admin/changelogs` | GET | yes (admin) | admin role | n/a (query allowlist + clamp) | yes (uid+ip) | no |
| `/api/admin/check` | GET | optional | n/a | n/a | **no** | no |
| `/api/admin/role-policies` | GET | yes (admin) | admin role | n/a | **no** | no |
| `/api/admin/role-policies` | PATCH | yes (admin) | admin role | yes (`.strict()`) | yes (strict) | no |
| `/api/admin/users` | GET | yes (admin) | admin role | n/a | yes (uid+ip) | **yes** |
| `/api/admin/users/update-role` | PATCH | yes (admin) | admin + last-admin guard | yes (`.strict()`) | yes (strict) | no |
| `/api/campaigns` | GET | yes | member/owner scoping | n/a | yes (uid+ip) | yes |
| `/api/campaigns/[id]` | GET | yes | member/owner, 404 on miss | n/a | **no** | yes |
| `/api/campaigns/invite/[code]` | GET | yes | n/a (returns id+name only) | format regex | yes (**ip only**) | no |
| `/api/campaigns/[id]/characters/[userId]/[characterId]` | GET | yes | roster + membership + RM/scope | n/a | **no** | **no** |
| `/api/campaigns/[id]/rolls` | GET | yes | member check | n/a | **no** | **no** |
| `/api/campaigns/[id]/rolls` | POST | yes | member + roster-bound author | yes | yes (uid+ip) | **no** |
| `/api/characters` | GET | yes | `user_id` scoped | n/a | **no** | yes |
| `/api/characters` | POST | yes | `user_id` + quota | partial (catchall) | yes (**ip only**) | yes |
| `/api/characters/[id]` | GET | optional | owner / public / campaign | n/a | **no** | yes |
| `/api/characters/[id]` | PATCH | yes | owner-scoped | partial (catchall) | yes (**ip only**) | yes |
| `/api/characters/[id]` | DELETE | yes | owner-scoped | id trim only | yes (**ip only**) | yes |
| `/api/codex` | GET | none (public) | n/a | n/a | **no** | **no** |
| `/api/crafting` | GET | yes | `user_id` scoped | n/a | **no** | yes (401 only) |
| `/api/crafting` | POST | yes | `user_id`, **no quota** | yes (passthrough) | yes (**ip only**) | yes (401 only) |
| `/api/crafting/[id]` | GET/PATCH/DELETE | yes | owner-scoped | PATCH yes | yes (**ip only**) | yes |
| `/api/encounters` | GET | yes | `user_id` scoped | n/a | **no** | yes (401 only) |
| `/api/encounters` | POST | yes | `user_id`, **no quota** | yes (`.strict()`) | yes (**ip only**) | yes (401 only) |
| `/api/encounters/[id]` | GET/PATCH/DELETE | yes | owner-scoped | PATCH yes | yes (**ip only**) | yes |
| `/api/images` | GET | none (public) | n/a | category allowlist | **no** | **no** |
| `/api/images` | POST | yes (admin) | admin role | **no** (manual, multipart) | yes (upload) | **no** |
| `/api/images/[id]` | GET | none (public) | n/a | n/a | **no** | **no** |
| `/api/images/[id]` | PATCH/DELETE | yes (admin) | admin role | **no** (manual) | **no** | **no** |
| `/api/images/[id]/replace` | POST | yes (admin) | admin role | **no** (manual, multipart) | yes (upload) | **no** |
| `/api/images/[id]/usage` | GET | yes (admin) | admin role | n/a | **no** | **no** |
| `/api/official/[type]` | GET | none (public) | n/a | type allowlist | **no** | **no** |
| `/api/official/[type]` | POST/DELETE | yes (admin) | admin role | **weak** (`publicItemSchema`) | **no** | **no** |
| `/api/official/enhanced-items` | GET/POST/PATCH/DELETE | yes (admin) | admin role | POST/PATCH `.strict()` | **no** | **no** |
| `/api/upload/portrait` | POST | yes | **character ownership verified** | multipart, manual + magic bytes | yes (uid+ip) | **no** |
| `/api/upload/profile-picture` | POST | yes | self + role permission | multipart, manual + magic bytes | yes (uid+ip) | **no** |
| `/api/user/enhanced-items` | GET | yes | `user_id` scoped | n/a | **no** | yes (401 only) |
| `/api/user/enhanced-items` | POST | yes | `user_id`, **no quota** | yes (passthrough) | yes (**ip only**) | yes (401 only) |
| `/api/user/enhanced-items/[id]` | PATCH/DELETE | yes | owner-scoped | PATCH yes | yes (**ip only**) | yes |
| `/api/user/library/[type]` | GET | yes | `user_id` scoped | type allowlist | **no** | yes (401 only) |
| `/api/user/library/[type]` | POST | yes | `user_id` + quota | partial (catchall) | yes (uid+ip) | yes (401 only) |
| `/api/user/library/[type]/[id]` | GET/PATCH/DELETE | yes | owner-scoped | PATCH partial | yes (**ip only**) | yes |
| `/auth/callback` | GET | n/a (PKCE exchange) | n/a | n/a | **no** | **no** |
| `/auth/confirm` | GET | n/a (OTP verify) | n/a | n/a | **no** | **no** |

---

## 2. Findings

### P0

#### P0-1 — Any public character leaks the owner's entire private custom library to anonymous callers, via service_role
**`src/lib/owner-library-for-view.ts:29-35`**, called from **`src/app/api/characters/[id]/route.ts:66`** (and `:95`, and `campaigns/[id]/characters/[userId]/[characterId]/route.ts:141`).

```ts
// owner-library-for-view.ts:29-35
const supabase = createServiceRoleClient();
const [powerRes, techniqueRes, itemRes, creatureRes] = await Promise.all([
  supabase.from('user_powers').select('*').eq('user_id', ownerUserId),
  supabase.from('user_techniques').select('*').eq('user_id', ownerUserId),
  supabase.from('user_items').select('*').eq('user_id', ownerUserId),
  supabase.from('user_creatures').select('*').eq('user_id', ownerUserId),
]);
```

`GET /api/characters/[id]` requires no session (`route.ts:41` reads the session but does not require it). If the character's `data.visibility === 'public'`, line 66 runs this helper and line 67 returns `libraryForView` in the response body.

The authorization decision made upstream is *"this one character is public"*. The data returned is *"every custom power, technique, armament and creature this user has ever saved"* — `select('*')` with no filter to the entities the character actually references. RLS on `user_powers` / `user_techniques` / `user_items` / `user_creatures` is strictly `user_id = auth.uid()` (verified live), so this data is otherwise unreachable by anyone but the owner. The service-role client is used specifically to step around that policy, and nothing narrows the result to what the viewer was authorized to see.

Concretely: an unauthenticated attacker who has any public character ID (they are shared by design, and enumerable across accounts by anyone who collects share links) receives that user's complete unpublished homebrew, including work-in-progress items never attached to any character. For a TTRPG startup, users' unpublished homebrew is the product's main user-generated asset.

**Why it matters:** private, RLS-protected rows belonging to user A are served to an unauthenticated third party. This is exactly the "service_role used to bypass RLS without a matching ownership check" pattern, and it is reachable with no credentials.

**Fix:** resolve the set of library entity IDs actually referenced by the character being viewed (loadout/powers/techniques/armaments/creature refs in `charRow.data`) and pass it into `getOwnerLibraryForView` as an `.in('id', referencedIds)` filter, returning `[]` when the set is empty. Add a `refIds: string[]` parameter and make it required so no caller can accidentally re-introduce the unfiltered form. Same change applies to the RM view at `campaigns/[id]/characters/.../route.ts:141`, though the blast radius there is limited to campaign members.

---

### P1

#### P1-1 — Username uniqueness is unenforceable through RLS; the "taken" checks always pass and the failed write is reported as success
**`src/app/(auth)/actions.ts:36`, `:188`, `:227-246`**

Three places check username uniqueness by querying `user_profiles` with the **caller's** RLS-scoped client:

```ts
// actions.ts:227-233 (changeUsernameAction)
const { data: taken } = await supabase
  .from('user_profiles').select('id')
  .eq('username', normalized).neq('id', user.uid).maybeSingle();
if (taken) return { success: false, error: 'This username is already taken' };
```

Verified live: the only SELECT policy on `user_profiles` is `Users can read own profile` → `id = auth.uid()`. The `.neq('id', user.uid)` clause therefore guarantees zero rows, always. `taken` is always `null`. The same defect breaks `checkUsernameAvailableAction` (`:188` — always reports `available: true`) and `generateDefaultUsername` (`:36` — its collision loop can never detect a collision).

Verified live: `user_profiles.username` has a UNIQUE index (`user_profiles_username_key`), and `usernames.username` is the primary key. So the write *does* get rejected — but the code never checks:

```ts
// actions.ts:236-246
if (currentUsername) {
  await supabase.from('usernames').delete().eq('username', currentUsername);  // succeeds
}
await supabase.from('usernames').upsert({ username: normalized, ... });        // 409 / RLS denial, unchecked
await supabase.from('user_profiles').update({ username: normalized, ... });    // unique violation, unchecked
...
return { success: true };
```

**Impact:** a user who picks a taken username sees "available", submits, gets a success response, and their username silently does not change. Worse, line 236 has already deleted their existing `usernames` row, so they end up with a `user_profiles.username` that has no matching `usernames` entry. The same path in `createUserProfileAction:97-105` means a generated-name collision at signup silently fails to create the profile row, which then breaks every FK-dependent insert (`ensureUserProfile` masks this later, but the username is lost).

**Fix:** move all three uniqueness checks to a server-side path that can actually see other rows — either a `SECURITY DEFINER` Postgres function `username_is_available(text)` returning only a boolean (no row data, no enumeration surface), or the service-role client behind the existing `strictLimiter`. Then check the error from every `usernames`/`user_profiles` write and map `23505` to "already taken", and reorder so the old `usernames` row is only deleted after the new one is successfully claimed (or do both in one RPC/transaction).

#### P1-2 — Character mutation bodies are effectively unvalidated; every game stat is client-authoritative
**`src/lib/api-validation.ts:103-116`**, consumed at **`src/app/api/characters/route.ts:91`** and **`src/app/api/characters/[id]/route.ts:129`**

```ts
export const characterUpdateSchema = withSafeJsonBlob({
  name: z.string().min(1).max(100).optional(),
  level: z.number().int().min(1).max(20).optional(),
  visibility: z.enum(['private','campaign','public']).optional(),
  portrait: z.string().min(1).max(4000).optional(),
});
// withSafeJsonBlob = z.object(shape).catchall(z.unknown()).refine(≤500 top-level keys, no __proto__)
```

`level` is the only numeric game value clamped anywhere on the server. `abilities`, `health`, `energy`, `currency`, `trainingPoints`, skill ranks, feats, and the entire loadout arrive through `catchall(z.unknown())`, get merged into the stored JSONB at `[id]/route.ts:147`, and are read back verbatim. `prepareCharacterForSave` (`src/lib/character-save.ts:10-34`) strips derived fields and normalizes names — it does not validate or clamp anything.

Notably, `src/lib/validation/schemas.ts` already contains the right schemas (`abilitiesSchema` clamps −2..6 at `:60-67`, `defenseSkillsSchema` clamps 0..3 at `:101-108`, `resourcePoolSchema` at `:116-120`) and **none of them are imported by any API route**. `src/lib/validation/**` is dead relative to the server: `schemas.ts` is only used by the login/register/forgot-password forms.

**Impact:** a player in a campaign can `PATCH` arbitrary stats. The Realm Master's read-only sheet view (`campaigns/[id]/characters/.../route.ts`) and the encounter-scope endpoint both surface those values as authoritative, so cheating is invisible on the RM side. There is no audit trail on character writes. This may be an accepted trade-off for a single-player-owned sheet, but it is not documented as one anywhere I could find, and it is not consistent with `characterUpdateSchema` bothering to clamp `level`.

**Fix:** decide explicitly and write it down. If stats stay client-authoritative, say so in `DESIGN_INTENT.md` and drop the misleading `level` clamp. If not, wire the existing `abilitiesSchema`/`defenseSkillsSchema`/`resourcePoolSchema` into `characterUpdateSchema` as optional sub-objects and add a server-side derived-max check for health/energy using `computeMaxHealthEnergy`, which the server already imports elsewhere (`campaigns/[id]/characters/.../route.ts:12`).

#### P1-3 — `/api/encounters` and `/api/crafting` (and `/api/user/enhanced-items`) have no per-role quota
**`src/app/api/encounters/route.ts:70-112`**, **`src/app/api/crafting/route.ts:66-117`**, **`src/app/api/user/enhanced-items/route.ts:58-118`**

`POST /api/characters` (`route.ts:97-113`) and `POST /api/user/library/[type]` (`route.ts:162-250`) both fetch `getRolePolicyForUser` and reject at quota. These three do not. `src/lib/role-limits.ts:21-62` has no `maxEncounters`, `maxCraftingSessions`, or `maxEnhancedItems` field at all.

Combined with a 30-request/minute limiter and a 2 MB accepted body (`api-validation.ts:20`), one `new_player` account can write ~43k rows/day at up to 2 MB each. `encounterUpdateSchema.combatants` is `z.array(z.record(z.string(), z.unknown()))` with **no `.max()`** (`api-validation.ts:140,153`); same for `craftingSessionCreateSchema.sessions` (`:211`) and `campaignRollCreateSchema.roll.dice` (`:334`). Every array in the API is unbounded.

**Fix:** add `maxEncounters` / `maxCraftingSessions` / `maxEnhancedItems` to `RoleLimits` + `role_policies`, and apply the same count-then-403 pattern already used in `characters/route.ts:98-113`. Independently, put `.max(n)` on every `z.array(...)` in `api-validation.ts` — combatants ~200, sessions ~200, dice ~100.

#### P1-4 — Rate-limit keys are derived from a client-supplied header, and 14 handlers use IP alone
**`src/lib/rate-limit.ts:182-187`** and 14 call sites.

```ts
// rate-limit.ts:185
const raw = forwarded?.split(',')[0]?.trim() || realIp?.trim() || 'unknown';
```

`resolveClientIp` takes the **first** entry of `x-forwarded-for`. That is the left-most, least-trustworthy hop. If any proxy in the chain appends rather than replaces the header — which is the standard `X-Forwarded-For` semantic, and is what happens the moment a CDN, WAF, or custom proxy is put in front of Vercel — the first entry is fully attacker-controlled and every IP-keyed limiter becomes trivially bypassable by rotating a header value. This is worth verifying against your actual edge configuration rather than assuming; the safe form does not depend on the answer.

Separately, 14 handlers bypass `resolveClientIp`/`buildRateLimitKey` entirely and use the **raw header string with no user id**:

`characters/route.ts:80-81`, `characters/[id]/route.ts:113-114` and `:171-172`, `crafting/route.ts:68-69`, `crafting/[id]/route.ts:66-67` and `:137-138`, `encounters/route.ts:72-73`, `encounters/[id]/route.ts:73-74` and `:136-137`, `user/enhanced-items/route.ts:60-61`, `user/enhanced-items/[id]/route.ts:19-20` and `:84-85`, `user/library/[type]/[id]/route.ts:94-95` and `:196-197`.

These share one 30/min budget across every user behind a NAT or corporate egress, and give an authenticated abuser a limiter they can sidestep without even needing the header trick (the key is the whole comma-joined string, so any variation produces a fresh bucket).

**Fix:** in `resolveClientIp`, prefer `x-real-ip` (Vercel sets it to the true client IP) and fall back to the **last** `x-forwarded-for` entry, or use `ipAddress()` from `@vercel/functions`. Then replace all 14 raw-header call sites with `buildRateLimitKey('<action>', { userId: user.uid, ip: resolveClientIp(request.headers) })`, which already exists and is used correctly by the other 12 handlers.

---

### P2

#### P2-1 — Duplication: 38 hand-written 401 blocks across 24 files, 2 admin-guard patterns, 2 rate-limit-key patterns, 26 hand-written 429 blocks
There is no route wrapper. Every handler repeats:

```ts
const { user, error } = await getSession();
if (error || !user?.uid) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
```

Counts: **38** `status: 401` returns across **24** route files; **26** `status: 429` returns; **8** inline `if (!(await isAdmin(user.uid)))` checks (`official/[type]/route.ts:183,281`, `images/route.ts:106`, `images/[id]/route.ts:49,119`, `images/[id]/replace/route.ts:33`, `images/[id]/usage/route.ts:23`) versus **5** files using the newer `requireAdminSession()` (`admin/users`, `admin/users/update-role`, `admin/role-policies`, `admin/changelogs`, `official/enhanced-items`). Two parallel admin guards with different response bodies (`'Admin access required'` vs `'Admin only'` vs `'Forbidden'`) and different rate-limit behaviour.

This is the root cause of most P2/P3 items below: every gap (missing limiter, missing `Retry-After` derivation, missing try/catch) is a place where one of ~40 copies drifted.

**Fix:** one `withApiRoute({ auth: 'required'|'optional'|'admin', limiter, schema })(handler)` wrapper in `src/lib/api-route.ts`, returning `{ user, supabase, body }`. Migrate the 6 image/official inline-admin routes first (they are the ones missing limiters), then the 14 legacy-limiter routes.

#### P2-2 — `validateJson` accepts `text/plain`, and no route checks `Origin`
**`src/lib/api-validation.ts:32`**

```ts
if (!ct.includes('application/json') && !ct.includes('text/plain')) { ... 415 }
```

`text/plain` and `multipart/form-data` are CORS *simple* content types: a cross-origin request using them triggers no preflight. Nothing in the codebase checks `Origin` or a CSRF token. The only thing preventing cross-site state change is Supabase's cookie `SameSite=Lax` default — which is a dependency on a library default, on every route, with no test asserting it.

**Fix:** drop `text/plain` from the allowlist (no client sends it — `api-client.ts:42` always sets `application/json`), and add an `Origin`/`Sec-Fetch-Site` check to the shared wrapper from P2-1, covering the multipart upload routes too.

#### P2-3 — Body size limit is skipped when `Content-Length` is absent
**`src/lib/api-validation.ts:43-52`**

```ts
const cl = request.headers.get('content-length');
if (cl && parseInt(cl, 10) > MAX_PAYLOAD_BYTES) { ... 413 }
```

A chunked (`Transfer-Encoding: chunked`) request has no `Content-Length`, so the 2 MB guard is skipped and `await request.json()` buffers whatever arrives. Vercel's platform limit (4.5 MB) caps the damage today, but the application's own limit is advisory only. The 500-key cap in `isSafeMutationPayload` counts **top-level keys only** — `{"a": {…10,000 nested keys…}}` passes.

**Fix:** read the body as a stream with a byte counter, or `await request.text()` and check `.length` before `JSON.parse`. Add a depth/size check to `isSafeMutationPayload`.

#### P2-4 — `ensureUserProfile` resets `created_at` on every character and library write
**`src/lib/ensure-user-profile.ts:19-29`**

```ts
await supabase.from('user_profiles').upsert(
  { id: uid, created_at: now, updated_at: now }, { onConflict: 'id' }
);
```

`upsert` on conflict issues `UPDATE ... SET created_at = now`. This runs on every `POST /api/characters` (`route.ts:140,156`), every `POST /api/user/library/[type]` (`route.ts:161`), and `createCampaignAction` (`campaigns/actions.ts:79`). Every user's signup timestamp is silently rewritten to their most recent save. `upload/profile-picture/route.ts:85-87` has an explicit comment about avoiding exactly this (TASK-331) — the fix was applied there and not here.

**Fix:** `.upsert({ id: uid, created_at: now, updated_at: now }, { onConflict: 'id', ignoreDuplicates: true })`, or split into a `select`-then-`insert`.

#### P2-5 — `deleteAccountAction` ignores every delete result and orphans rows
**`src/app/(auth)/actions.ts:256-293`**

Fourteen sequential `await supabase.from(...).delete()` calls, none with an error check, followed unconditionally by `supabaseAdmin.auth.admin.deleteUser(user.uid)`. If any delete is refused (RLS, FK, transient), the auth identity is destroyed anyway and the rows become permanently unreachable orphans — no session can ever match `user_id` again.

`campaign_rolls` is never deleted at all. Verified live: its DELETE policy allows the author, so rows the user wrote in other people's campaigns (containing their `characterName`) survive account deletion indefinitely.

There is also no re-authentication and no rate limit on this action, even though `getAuthErrorMessage` has a `'delete-account'` context implying a password prompt exists somewhere in the UI.

**Fix:** move the cascade into a single `SECURITY DEFINER` Postgres function called with the service-role client, delete `campaign_rolls` by `user_id`, and only call `auth.admin.deleteUser` if it returns success.

#### P2-6 — `GET /api/campaigns/[id]` has no try/catch and no rate limit
**`src/app/api/campaigns/[id]/route.ts:42-81`** — the only route handler in the tree with no error handling. Any thrown error (network blip to Supabase, malformed row) propagates to Next's default handler: a 500 whose body includes the message and, in non-production, the stack. Every other route wraps in try/catch and returns a generic `{ error }`.

**Fix:** wrap in try/catch using `apiErrorResponse` like its siblings; add the `standardLimiter` call that `GET /api/campaigns` already has.

#### P2-7 — Mutating routes with no rate limit at all
`PATCH`/`DELETE /api/images/[id]` (`route.ts:44,114`), `POST`/`DELETE /api/official/[type]` (`route.ts:174,272`), all four methods on `/api/official/enhanced-items`, `GET /api/images/[id]/usage`, `GET /api/admin/role-policies`. All are admin-gated so the risk is a compromised or careless admin session rather than an anonymous attacker, but `DELETE /api/images/[id]` cascades through `clearRealmsImageRefs` across every codex table and `DELETE /api/official/[type]` destroys reference data — these are the highest-consequence writes in the app and the least throttled. `GET /api/codex` (unauthenticated, joins 11 tables, returns the full payload) is also unlimited.

#### P2-8 — `GET /api/images` is unauthenticated, unbounded, and takes an unescaped LIKE pattern
**`src/app/api/images/route.ts:45-98`**

`query.ilike('name', '%${q}%')` at `:85` with no `LIMIT` at `:76-79`. `q` is not escaped, so `%` and `_` from the client become wildcards — `?q=_` matches everything. `user/library/[type]/route.ts:67` does escape these (`nameFilter.replace(/[%_\\]/g, c => '\\'+c)`), so the correct pattern exists in the codebase and was not applied here. There is no `LIMIT` on the row set either, so the whole image bank is returned on every call, unauthenticated.

**Fix:** escape LIKE metacharacters, add `.limit(200)` plus pagination, and require a session (this is admin-authoring data; verified live, the `realms_images` RLS policy is `SELECT ... USING (true)` for `public`, so the row-level layer will not help).

#### P2-9 — Any campaign member can read any roster character's live HP/energy, including private ones
**`src/app/api/campaigns/[id]/characters/[userId]/[characterId]/route.ts:58-132`**

`?scope=encounter` skips both the RM-only gate (`:59`) and the `visibility === 'private'` gate (`:95-100`), and returns abilities, current/max health, current/max energy, action points, and evasion to **any** campaign member. The docblock says this is for adding combatants to encounters — but encounters are an RM activity, and this lets any player read another player's private sheet vitals.

**Fix:** restrict `scope=encounter` to `isRM`, or narrow the payload to what the encounter tracker actually needs and confirm that includes another player's *current* HP.

#### P2-10 — `deleteCodexDoc` / `createCodexDoc` / `updateCodexDoc` / `saveArchetypeWithPath` return raw Postgres messages to the client
**`src/app/(main)/admin/codex/actions.ts:301,356,388,520`** — `return { success: false, error: e instanceof Error ? e.message : ... }` where `e` was constructed from `error.message` of the Supabase response. Constraint names, column names, and table names reach the browser. Admin-only, but it directly contradicts the convention stated in `src/lib/api-error.ts:1-4` and followed by every route handler.

Same class: `deleteCodexDoc:370` deletes without checking the row exists first, and `saveArchetypeWithPath:478-502` deletes all `codex_archetype_levels` for the archetype and then re-inserts, with no transaction — a failure between the two leaves the archetype with zero levels.

#### P2-11 — Leaked-password protection is disabled, and password minimums are inconsistent
Supabase advisor `auth_leaked_password_protection` = WARN (verified live). Register requires 6 characters (`src/lib/validation/schemas.ts:23,29`); reset-password requires 8 (`src/app/(auth)/reset-password/page.tsx:22`). Both are client-side only — Supabase's own minimum is the real enforcement.

**Fix:** enable HaveIBeenPwned checking in the Supabase Auth dashboard, raise the project's minimum password length there, and align both client schemas to match.

#### P2-12 — `ilike` on an admin-supplied username can match the wrong user
**`src/app/api/admin/users/update-role/route.ts:51`** — `profileQuery.ilike('username', (username ?? '').toLowerCase())`. `adminUpdateRoleSchema` (`api-validation.ts:369-379`) does not reject `%`/`_`, so `{"username":"a%","role":"admin"}` promotes whichever user sorts first. Admin-only and requires intent to abuse, but a typo'd paste containing `%` silently changes the wrong account's role.

**Fix:** use `.eq('username', username.toLowerCase())` — the column already stores the normalized lowercase form.

#### P2-13 — `campaigns.invite_code` has no unique index and its uniqueness check is RLS-blind
**`src/app/(main)/campaigns/actions.ts:39-47`** loops looking for an unused code via `supabase.from('campaigns').select('id').eq('invite_code', code)` with the user's client. Verified live: the `campaigns` SELECT policy is `auth_is_campaign_participant(id)`, so this query can never see another user's campaign — the loop always returns on the first iteration. Verified live: `campaigns_invite_code_idx` is **not** unique, so the database will not catch a collision either.

At 32^8 ≈ 1.1e12 the practical collision risk is negligible, but the invariant that `joinCampaignAction:165-169` relies on (`.eq('invite_code', code).maybeSingle()`) is unenforced, and `maybeSingle()` throws on duplicates rather than degrading gracefully.

**Fix:** add `CREATE UNIQUE INDEX ... ON campaigns (invite_code)` and either drop the dead pre-check or run it with the service-role client.

#### P2-14 — Portraits and profile pictures are world-readable by URL regardless of character visibility
Verified live: `portraits`, `profile-pictures`, and `codex-art` buckets all have `public = true`. `getPublicUrl` at `upload/portrait/route.ts:100` produces an unauthenticated CDN URL for a private character's portrait. The path is `{uuid}/{uuid}.{ext}` so it is not guessable, and object listing *is* RLS-scoped (verified) — this is security-by-unguessable-URL, not an open directory. It becomes a real leak only if a portrait URL escapes (a character shared as public and later set private keeps a live URL forever; there is no cache-busting or re-key on visibility change).

**Fix:** acceptable as-is if documented; otherwise move `portraits` to a private bucket and serve signed URLs from the character read path, which already knows the viewer's authorization.

---

### P3

- **P3-1 — `getSession()` is a misleading name.** `src/lib/supabase/session.ts:20` wraps `auth.getUser()`. Given that `auth.getSession()` is the well-known unsafe server-side call, naming the safe wrapper `getSession` invites someone to "simplify" it into the unsafe form. Rename to `getVerifiedUser()`.
- **P3-2 — Dead code.** `src/lib/supabase/session.ts:59-65` `requireAuth()` is used only by server actions, never by a route handler; `src/lib/validation/schemas.ts:60-122` (`abilitiesSchema`, `characterCreationSchema`, `defenseSkillsSchema`, `resourcePoolSchema`, `characterBasicsSchema`) is imported by nothing — see P1-2. `src/lib/supabase/index.ts` re-exports three symbols; every consumer imports from `./server` or `./client` directly.
- **P3-3 — `Retry-After` is hardcoded to `'60'`** in 20 of 26 rate-limit responses, while `retryAfterSecondsFromReset` (`rate-limit.ts:42`) exists and is used in only 4 (`admin/changelogs:60`, `admin/role-policies:66`, `admin/users:40`, `admin/users/update-role:38`).
- **P3-4 — `POST /api/user/enhanced-items` never checks `currencyCost`/`potency` against the crafting rules** the way `/api/official/enhanced-items` does (`enhanced-items/route.ts:117-131` recomputes `currencyCost` and `rarity` server-side; the user-facing route at `user/enhanced-items/route.ts:76-85` copies whatever the client sent).
- **P3-5 — `list('', { limit: 100 })`** at `upload/profile-picture/route.ts:65` caps a bucket-root listing at 100 objects before RLS narrowing; if Supabase Storage applies the limit before the policy filter, an old-extension file can survive the cleanup and orphan in the bucket. Use `search: user.uid` instead of scanning the root.
- **P3-6 — CSP allows `'unsafe-inline'` and `'unsafe-eval'`** in `script-src` (`next.config.ts:48`), so the CSP provides no XSS mitigation. Mitigating context: I grepped the whole `src` tree and there is **no** `dangerouslySetInnerHTML` anywhere, so React's escaping is doing the work. Worth a nonce-based CSP eventually, not urgent.
- **P3-7 — `codex/route.ts:474-486`** builds a `hint` string from the raw error message when `NODE_ENV === 'development'`. The admin gate (`canExposeCodexDebug:451-456`) is correct for production; the `|| process.env.NODE_ENV === 'development'` on line 475 is redundant with it and makes the condition harder to audit.
- **P3-8 — `official/[type]/route.ts:192` validates with `publicItemSchema`**, which is `withSafeJsonBlob({ id?, name? })` — every other field passes through `catchall` into `bodyToColumnar`. `bodyToColumnar` does allowlist which keys become columns (`library-columnar.ts:45-83,422-443`), and unknown keys land in the `payload` JSONB rather than in a column, so there is **no** column-level mass assignment here — but nothing bounds what goes into `payload`.
- **P3-9 — `/auth/callback` and `/auth/confirm` have no rate limit.** Both are token-verification endpoints; Supabase applies its own limits server-side, so this is defence-in-depth only.
- **P3-10 — `resolveClientIp` truncates at 64 chars** (`rate-limit.ts:186`) which is fine for an IP but silently mangles a long forwarded chain into a shared key prefix.

---

## 3. Delete / merge candidates

1. **Merge 40 copies of the auth/limiter/validate/error preamble into one `withApiRoute` wrapper** (P2-1). Highest-leverage change in this report: 38 × 401 blocks, 26 × 429 blocks, 24 files.
2. **Delete the inline `isAdmin` guard from 6 route handlers**, use `requireAdminSession()` everywhere: `official/[type]/route.ts:183,281`, `images/route.ts:106`, `images/[id]/route.ts:49,119`, `images/[id]/replace/route.ts:33`, `images/[id]/usage/route.ts:23`.
3. **Delete the legacy `const ip = request.headers.get('x-forwarded-for') ?? 'unknown'` pattern from all 14 sites**, use `buildRateLimitKey` + `resolveClientIp` (P1-4).
4. **Delete `src/lib/validation/schemas.ts:60-122`** (unused ability/defense/resource/character schemas) — or, better, wire them into `characterUpdateSchema` and keep them (P1-2). Do not leave them sitting there implying validation that does not happen.
5. **Delete `requireAuth()` from `src/lib/supabase/session.ts:59-65`** or make it the single entry point for server actions; today it is half-used (`(auth)/actions.ts` and `campaigns/actions.ts` use it, `admin/codex/actions.ts:34-39` hand-rolls its own).
6. **Delete `src/lib/supabase/index.ts`** — no consumer imports through it.
7. **Merge the two `VALID_TYPES` / `TABLE_MAP` definitions** duplicated verbatim between `official/[type]/route.ts:29-38`, `user/library/[type]/route.ts:29-41`, and `user/library/[type]/[id]/route.ts:26-38` into `library-columnar.ts`.
8. **Fix the stale caching claims** in `src/docs/DATA_HANDLING.md:22,53` and `src/docs/DEPLOYMENT_AND_SECRETS_SUPABASE.md:143`. They describe public CDN caching that the code does not do. A future change made "to match the docs" would be a genuine P0.

## 4. Missing tests

11 test files exist, all following a good pattern (401 + IDOR-returns-404 + happy path). Coverage is concentrated on the user-owned CRUD routes and absent on everything privileged.

**Mutating routes with no test at all:**

| Route | Methods untested | Why it matters |
|---|---|---|
| `/api/admin/users/update-role` | PATCH | Privilege escalation surface. Needs: non-admin → 403; last-admin demotion → 409; `username: 'a%'` matches only the exact user (P2-12). |
| `/api/admin/role-policies` | PATCH | Changes quotas globally. Needs: non-admin → 403; unknown `permissions` key rejected by `.strict()`. |
| `/api/official/[type]` | POST, DELETE | Destroys shared reference data. Needs: non-admin → 403; invalid `type` → 400. |
| `/api/official/enhanced-items` | POST, PATCH, DELETE | Needs: non-admin → 403; server recomputes `currencyCost`/`rarity` and ignores client values. |
| `/api/images` | POST | Needs: non-admin → 403; non-image magic bytes → 400; >5 MB → 400; extension derived from content not filename. |
| `/api/images/[id]` | PATCH, DELETE | Needs: non-admin → 403; delete clears refs before removing the row. |
| `/api/images/[id]/replace` | POST | Needs: non-admin → 403; magic-byte rejection. |
| `/api/upload/portrait` | POST | Needs: non-owner `characterId` → 404 (the ownership check at `:68-79` is untested); non-UUID `characterId` → 400 (path-traversal guard). |
| `/api/upload/profile-picture` | POST | Needs: role without `canUploadProfilePicture` → 403. |
| `/api/campaigns/[id]/rolls` | POST | Needs: non-member → 403; rolling as another player's character → 403 (`:184-194`, the anti-spoof check). |
| `/api/campaigns/invite/[code]` | GET | Needs: unauthenticated → 401; malformed code → 400; rate limit → 429. |
| `/api/campaigns/[id]/characters/[userId]/[characterId]` | GET | Needs: non-member → 403; member without RM → 403 on full view; `scope=encounter` behaviour (P2-9). |
| `/api/characters/[id]` | GET (campaign path) | The `visibility: 'campaign'` branch (`:70-99`) and the `libraryForView` payload (P0-1) are untested. |
| `/api/codex`, `/api/images` GET, `/api/official/[type]` GET | GET | Untested; these are the only unauthenticated routes in the app. |

**Untested shared helpers with security-relevant logic:** `src/lib/api-validation.ts` `validateJson` (415 / 413 / prototype-pollution rejection), `src/lib/admin.ts` `requireAdminSession`, `src/lib/owner-library-for-view.ts`, `src/lib/validate-image.ts` (magic-byte matrix, including the WebP special case at `:52-61`). `src/lib/rate-limit.ts`, `src/lib/auth-errors.ts`, and `src/lib/validation/auth-email.test.ts` do have tests.

**Existing tests that assert less than they appear to:** `crafting/route.test.ts`, `encounters/route.test.ts`, `user/enhanced-items/route.test.ts`, and `user/library/[type]/route.test.ts` each contain exactly one case (`returns 401 when session is missing`). The `POST` handlers in those four files — including the quota logic in `user/library/[type]/route.ts:162-250` — are not exercised.
