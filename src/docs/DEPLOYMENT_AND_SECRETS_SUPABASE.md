# Deployment & Secrets — Supabase + Vercel

> **Replaces:** `DEPLOYMENT_SECRETS.md`, `SECRETS_SETUP.md`, `ADMIN_SDK_SECRETS_SETUP.md`  
> **Stack:** Next.js, Supabase (PostgreSQL, Auth, Storage), Vercel. No Prisma — all table access via Supabase client.

---

## Overview

RealmsRPG uses **Vercel** for hosting and **Supabase** for database, auth, and storage. Secrets are managed via **environment variables** (`.env.local` for local, Vercel Dashboard for production). **No Google Cloud Secret Manager.**

---

## Required Environment Variables

### Local Development (`.env.local`)

```env
# Supabase (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<anon/public_key>
SUPABASE_SERVICE_ROLE_KEY=<service_role_key>

# Optional: only if you run external DB tools (migrations are run as SQL in Supabase Dashboard)
# DATABASE_URL="postgresql://..."
# DIRECT_URL="postgresql://..."
```

### Production (Vercel Dashboard)

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | All | Anon/public key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | All | **Server-only** — never expose to client |

**Optional — durable rate limiting (TASK-645 / TASK-669):** Live on Vercel as of 2026-08-13 via marketplace Upstash Redis (`upstash-kv-cordovan-notebook`, free). The app reads `KV_REST_API_URL` + `KV_REST_API_TOKEN` (or `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`). Without them, limiters fall back to per-instance in-memory windows (weaker on Vercel).

| Variable | Scope | Notes |
|----------|-------|-------|
| `KV_REST_API_URL` | Server | Injected by Upstash marketplace (production + preview + development) |
| `KV_REST_API_TOKEN` | Server | Injected by Upstash marketplace |
| `UPSTASH_REDIS_REST_URL` | Server | Alternate names; not required if `KV_REST_API_*` is set |
| `UPSTASH_REDIS_REST_TOKEN` | Server | Alternate names; not required if `KV_REST_API_*` is set |

**Error monitoring (TASK-745):** Live on Vercel as of 2026-08-13 via marketplace Sentry (`sentry-copper-canvas`, Developer $0). `NEXT_PUBLIC_SENTRY_DSN` is injected on production + preview. The app no-ops when unset. `getSentryEnvironment()` already uses `VERCEL_ENV`.

**Canonical site URL:** Production `NEXT_PUBLIC_SITE_URL=https://realmsrpg.com` (auth redirects + CSRF origin allowlist). Preview uses the request host.

**Never** use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY`. `DATABASE_URL` / `DIRECT_URL` are optional for the Next.js app; they are **required for local full-database backups** (`npm run db:backup`).

### Local database backup

From the project root, with `DATABASE_URL` (and preferably `DIRECT_URL`, port 5432) in `.env.local` or `.env`:

```bash
npm run db:backup
```

Writes `backups/supabase-<timestamp>/` (`roles.sql`, `schema.sql`, `data.sql`). **Postgres client tools** (`pg_dump` on PATH) or **Supabase CLI** (+ Docker for CLI dumps) must be installed. This backs up the database only — not Storage. See [scripts/README.md](../../scripts/README.md).

### Generated Database types

After applying schema migrations, regenerate checked-in Postgres row types:

```bash
npm run db:types
```

Writes `src/types/database.types.ts` (ADR-0020). Review the git diff; do not hand-edit that file. Optional `SUPABASE_PROJECT_ID` override. This is type generation, not a data backup.

### Local Storage backup (files)

```bash
npm run storage:backup
```

Downloads all objects from `portraits` and `profile-pictures` to `backups/storage-<timestamp>/` (plus `manifest.json`). Requires `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` or `.env`. Override buckets: `STORAGE_BACKUP_BUCKETS=portraits,profile-pictures`.

**Full local backup (database + files):**

```bash
npm run backup:all
```

All app tables live in the **public** schema. **Schema reference:** [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md). **Which SQL to run and in what order:** [sql/README.md](../../sql/README.md). Run SQL in owner-approved database apply (see 07-database-operations.md).

---

## Supabase Storage Buckets

The app uses two buckets for image uploads. **Create these in Supabase Dashboard → Storage:**

| Bucket | Purpose | Path pattern |
|--------|---------|--------------|
| `portraits` | Character portraits | `{userId}/{characterId}.{ext}` |
| `profile-pictures` | User avatars | `{userId}.{ext}` |

### RLS Policies

Enable RLS on each bucket. The app needs **SELECT, INSERT, UPDATE, and DELETE** for portrait uploads (list existing, remove old file, then upload/upsert). Confirm Storage RLS on buckets `portraits` and `profile-pictures` in the Supabase Dashboard (Storage → bucket → Policies). Historical canonical policies were in `sql/supabase-storage-policies.sql` (deleted 2026-10-29; see git history). New applies need owner approval (see [ai/guide/07-database-operations.md](ai/guide/07-database-operations.md)).

- **Read (SELECT):** Authenticated users may list/read only their own path (not bucket-wide). Public **read-by-key** (images in the UI) uses **Public bucket** CDN URLs from `getPublicUrl`, not bucket-wide Storage SELECT.
- **Insert/Update/Delete:** Only the user’s own path (`portraits`: first folder = `auth.uid()`; `profile-pictures`: filename prefix = `auth.uid()`)

**Create buckets:** In Supabase Dashboard → Storage → New bucket, create `portraits` and `profile-pictures`. Enable public access if you want public URLs (the app uses `getPublicUrl`). Then confirm Storage policies on those buckets in the live database (definitions were in `sql/supabase-storage-policies.sql`, deleted 2026-10-29; see git history) with owner approval if changes are needed (see [ai/guide/07-database-operations.md](ai/guide/07-database-operations.md)).

**Security hardening (TASK-326):** After base storage policies, confirm scoped Storage SELECT (no bucket-wide listing) on the live buckets; hardening steps were in `sql/supabase-storage-select-hardening-2026-06.sql` (deleted 2026-10-29; see git history). That change removes bucket-wide public SELECT (prevents Storage API listing). Keep both buckets marked **Public bucket** so direct object URLs still load in the app.

**Portrait upload fails with "new row violates row-level security policy"?**  
If Storage uploads fail, compare live Storage policies on buckets `portraits` and `profile-pictures` to SUPABASE_SCHEMA.md (§ storage / session writes). If INSERT works but UPDATE or DELETE fails, add or fix those operations in the Dashboard for the user’s own path (definitions were in `sql/supabase-storage-policies.sql`, deleted 2026-10-29; see git history).

**Portrait uploads to the bucket but won’t load (400 or 403, “Failed to load resource”)?**  
1. **Make the bucket public** — The app uses **public** URLs for portraits. In Supabase Dashboard → **Storage** → select the **portraits** bucket → **Configuration** (or bucket settings) → turn **Public bucket** on. If it’s off, image requests often get **400** or **403** and the sheet shows no portrait. Do the same for **profile-pictures** if profile avatars don’t load.  
2. **After changing bucket or config** — Restart the dev server or redeploy. The character sheet loads portraits directly (unoptimized) and falls back to the placeholder if the image request fails.

---

## Session Handling

- **Supabase Auth** handles sessions via `@supabase/ssr` (cookies).
- Middleware refreshes sessions automatically.
- No Firebase Admin SDK or custom session API.

---

## Auth: Leaked-password protection (TASK-326)

Supabase security advisors flag **Leaked password protection** when disabled. This is **not** configured via SQL — enable it in the Dashboard:

1. **Supabase Dashboard** → **Authentication** → **Providers** (or **Auth** settings, depending on UI version).
2. Find **Leaked password protection** (Have I Been Pwned / HIBP check).
3. **Enable** it so new passwords and password changes are rejected if they appear in known breach lists.

Applies to email/password sign-up and password updates (including **My Account** password change). OAuth-only users are unaffected. Re-check **Dashboard → Advisors → Security** after enabling.

---

## Auth: CAPTCHA + signup abuse protection (TASK-899)

Supabase Auth accepts direct `/auth/v1/signup` calls with the public key. **Server-side CAPTCHA** (Turnstile or hCaptcha) blocks scripted bulk signups once enabled in the Dashboard **and** the frontend passes `options.captchaToken`.

**Safe default (today):** If `NEXT_PUBLIC_TURNSTILE_SITE_KEY` is unset, auth pages render **no widget** and send **no** captcha token — behavior matches pre–TASK-899 production until you complete DEV-015.

**Order matters:** deploy the frontend env + widget **before** toggling CAPTCHA on, or legitimate signups will fail.

**CSP (required, site-wide):** Security headers apply to **every page** (`next.config.ts` `/:path*`), not only auth routes. Turnstile loads `https://challenges.cloudflare.com/turnstile/v0/api.js`, embeds a challenge iframe, and calls back to that origin. The app CSP (`src/lib/security/content-security-policy.ts`) allowlists only `https://challenges.cloudflare.com` (no broader Cloudflare wildcards) on **`script-src`**, **`frame-src`**, and **`connect-src`** (see [Cloudflare Turnstile CSP](https://developers.cloudflare.com/turnstile/reference/content-security-policy/)). CI verifies the **served** header matches the builder via `src/lib/security/content-security-policy-headers.test.ts`. After deploy, spot-check `/register`, `/login`, and a normal app page (e.g. `/library`) with DevTools open — **no** CSP violations mentioning `challenges.cloudflare.com` (widget appears only on auth pages when the site key is set).

1. **Cloudflare Turnstile** (free) → create a site for `realmsrpg.com` (+ localhost for dev). Copy **site key** + **secret key**.
2. **Vercel** → `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = site key (Production + Preview).
3. **Supabase Dashboard** → **Authentication** → **Bot and Abuse Protection** → enable CAPTCHA → paste **secret key** → provider = Turnstile.
4. While there: tighten **Rate Limits** (signup / email sends) and **minimum password length** (recommend ≥8).
5. Also enable **Leaked password protection** (DEV-001 / TASK-353) if not already on.

Frontend: `/register`, `/login`, and `/forgot-password` render `AuthTurnstile` when the site key is set (`src/components/auth/auth-turnstile.tsx`).

**security.txt:** `public/.well-known/security.txt` (RFC 9116) — refresh `Expires` annually.

---

## Admin Setup

Admins are configured in `public.user_profiles`:

1. Find user ID in Supabase Authentication → Users.
2. Set `user_profiles.role = 'admin'` for that user (owner-approved admin UI or migration).

See `ADMIN_SETUP.md` for current implementation.

---

## Vercel free tier usage

On the free tier, watch **Edge Requests**, **Fast Data Transfer** (CDN → users), and **Edge Request CPU Duration** (charged when >10ms per request). See **`src/docs/PERFORMANCE_AND_EDGE.md`**.

- **Proxy (Edge):** `src/proxy.ts` runs on every *matching* request. We exclude high-volume public APIs (`/api/codex`, `/api/public`) from the matcher so those routes don’t count as Edge Requests or Edge CPU.
- **Caching:** `/api/codex` and `/api/public/[type]` GET responses use `Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=300` so browsers and CDN cache for 5–10 minutes and repeated requests don’t re-download the same payload (reduces Fast Data Transfer).
- **Adding new public APIs:** Exclude them from the proxy matcher in `proxy.ts` if they don’t need session refresh, and set cache headers on GET if the response is cacheable.

---

## Phase 7: Vercel Deployment

### Step 1: Connect repo

1. Go to [vercel.com](https://vercel.com) and sign in.
2. **Add New** → **Project** → Import your GitHub repo (`RealmsRPG-Test`).
3. Framework Preset: Next.js (auto-detected).
4. Don’t deploy yet — add env vars first.

### Step 2: Add environment variables

1. Project → **Settings** → **Environment Variables**.
2. Add each variable (Production, Preview, Development):

| Name | Value | Where to get it |
|------|-------|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxx.supabase.co` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | `eyJ...` (anon key) | Supabase → Settings → API → anon public |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` (service_role key) | Supabase → Settings → API → service_role |

**Never** use `NEXT_PUBLIC_` for `SUPABASE_SERVICE_ROLE_KEY`.

### Step 3: Deploy

1. **Deployments** → **Redeploy** (or merge a reviewed PR to `master` to trigger auto-deploy). Agents never push to `master` directly.
2. After build, visit your Vercel URL (e.g. `realms-rpg-next.vercel.app`) or your custom domain (e.g. **realmsrpg.com**).
3. Test: sign in, create a character, upload a portrait.

**Ignored builds (docs/test-only):** `vercel.json` runs `scripts/vercel-ignore-build.sh` so commits that only touch docs/agent/task-queue paths (`src/docs/`, `*.md`, `.cursor/`, `.github/`, `sql/`, seed/codex CSV) **or** Playwright tests/snapshots (`tests/`, `playwright.*.config.ts`) **skip** Vercel builds. This avoids Hobby **Deployment rate limited — retry in 24 hours** failures from rapid docs-only or visual-baseline merges. App/`src` code changes still deploy. If master shows a red Vercel check with that rate-limit message while GitHub Actions are green, production is usually still on the last successful app deploy — wait for the window or upgrade; do not treat it as an app build break.

### Step 3b: Web Analytics (optional but recommended)

App code mounts Vercel Web Analytics in the root layout (`src/app/layout.tsx` → `<Analytics />` from `@vercel/analytics/next`). No env vars are required.

1. In the Vercel project → **Analytics** → **Enable** Web Analytics (Dashboard-only; track as **DEV-006** in ClickUp).
2. Deploy (or wait for the next production deploy) so `/_vercel/insights/*` routes are provisioned.
3. Verify: open the live site, DevTools → Network → look for a same-origin `…/view` (or `/_vercel/insights/view`) request after navigation.
4. **CSP:** `next.config.ts` builds policy from `src/lib/security/content-security-policy.ts`. Besides `'self'`, notable allowlists: `https://va.vercel-scripts.com` on `script-src` / `connect-src` (local/dev analytics debug); production Web Analytics uses same-origin `/_vercel/insights/*`. Sentry browser envelopes need `https://*.sentry.io`, `https://*.ingest.sentry.io`, and `https://*.ingest.us.sentry.io` on `connect-src` (CSP `*` is one label). Auth CAPTCHA (when enabled) needs `https://challenges.cloudflare.com` on `script-src`, `frame-src`, and `connect-src`. The toolbar websocket is `wss://ws-us3.pusher.com` on `connect-src`. `wss://*.vercel.live` does not match that host. Local `next dev` also allows `ws://localhost:*` and `ws://127.0.0.1:*`. Do not remove those hosts without re-checking analytics, Turnstile (if keys are set), the toolbar console, and error reporting in both environments.
5. Privacy copy: `/privacy` discloses anonymous usage analytics via the host (see `privacy-copy.ts`).

Speed Insights is **not** installed unless separately prioritized (different package + CSP considerations).

### Step 4: Custom domain (e.g. realmsrpg.com)

1. **Vercel:** Project → Settings → Domains → Add `realmsrpg.com` (and `www.realmsrpg.com` if desired). Follow Vercel’s DNS instructions (A/CNAME records).
2. After the domain is verified, traffic to realmsrpg.com will serve the same app. No code changes required; auth redirects use the request host (including x-forwarded-host).

### Step 5: Auth redirect URLs

1. **Supabase** → Authentication → URL Configuration:
   - **Site URL:** For production use your live URL, e.g. `https://realmsrpg.com` (or your Vercel URL before custom domain).
   - **Redirect URLs:** Add all origins where the app runs:
     - Local: `http://localhost:3000/auth/callback`, `http://localhost:3000/auth/confirm`
     - Production (Vercel): `https://your-app.vercel.app/auth/callback`, `https://your-app.vercel.app/auth/confirm`
     - Production (custom domain): `https://realmsrpg.com/auth/callback`, `https://realmsrpg.com/auth/confirm` (and `https://www.realmsrpg.com/...` if you use www)
   - If Redirect URLs are missing, Supabase may redirect to Site URL with `?code=...`; the app redirects to `/auth/callback` as a fallback.
   - **Site URL must use HTTPS** in production (e.g. `https://realmsrpg.com`, not `http://`). HTTP Site URLs break OAuth PKCE cookie scope and cause `flow_state_not_found` on Google sign-in.
   - Ensure `https://realmsrpg.com/auth/callback` (and `/auth/confirm`) are in **Redirect URLs**, not only the Vercel preview URL.
2. **Google OAuth (if used):** In Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs, add:
   - `https://realmsrpg.com/auth/callback` (and `https://www.realmsrpg.com/auth/callback` if you use www)
   - Your Vercel URL redirect if you still use it.

---

## One-shot SQL: idempotent full setup

If you want to set (or fix) schemas, tables, RLS, and Realtime in one go without tracking what’s already applied:

1. Get **Kadin explicit OK** and a fresh backup, then use the process in [ai/guide/07-database-operations.md](ai/guide/07-database-operations.md) (Supabase Dashboard or MCP on the approved project only).
2. Restore from a Supabase backup or apply owner-approved DDL. The live database is the source of truth; deleted migration files exist only in git history (`sql/README.md` describes what remains in the repo).

Schema and RLS are not applied from this repository’s deleted scripts. After a fresh environment has `public` tables, confirm Storage RLS on buckets `portraits` and `profile-pictures` in the Dashboard if the app uses uploads (policy names and rules are documented in SUPABASE_SCHEMA.md; historical script was `sql/supabase-storage-policies.sql`, deleted 2026-10-29).

---

## Verification

1. **Local:** Run `npm run dev`; sign in; create a campaign.
2. **Production:** Deploy to Vercel; add env vars; verify sign-in and campaign creation.

---

## Troubleshooting

### GET /api/codex 500 or codex data empty

All **codex_*** tables live in **public**. If you get 500:

1. **GRANTs + RLS (most common):** The API uses the anon key. You need **table-level GRANT SELECT** for anon/authenticated and **RLS policies**. Without GRANTs you get `42501: permission denied for table codex_feats`.  
   **Fix:** In the live database, confirm RLS and SELECT policies on each `codex_*` table and `core_rules` allow anon/authenticated reads (Table Editor → Policies). Historical policies were documented in `sql/supabase-codex-rls-public.sql` (deleted 2026-10-29; see git history). Owner-approved DDL only (see [ai/guide/07-database-operations.md](ai/guide/07-database-operations.md)).
2. **Tables in public:** In Table Editor, confirm `public.codex_feats`, `codex_skills`, `codex_species`, `codex_traits`, `codex_parts`, `codex_properties`, `codex_equipment`, `codex_archetypes`, `codex_creature_feats`, and `core_rules` exist.
3. **Connection / env:** Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (anon key) in Vercel.

The API returns a `hint` in the 500 body when it detects permission/RLS errors; use that to confirm and run the RLS script.

**How to get the exact error (to tell support or debug):**

- **Response body:** Call `GET https://realmsrpg.com/api/codex?debug=1`. The 500 JSON will include `debug: { message, code }` with the real Postgres/Supabase error (e.g. `"permission denied for table codex_feats"`, or `"42P01"` for relation not found). Paste that when asking for help.
- **Vercel:** Project → Logs → filter by `/api/codex`. Look for `[Codex API] Database error:` and the message that follows.
- **Supabase:** Dashboard → **Logs** → Postgres (or API). Look for failed queries or RLS violations around the time of the request.
- **RLS check:** In owner-approved database apply (see 07-database-operations.md) run:  
  `SET ROLE anon; SELECT * FROM public.codex_feats LIMIT 1;`  
  If that returns "permission denied" or 0 rows when the table has data, RLS is blocking anon. Confirm each codex table and `core_rules` has a SELECT policy in the live database (see `sql/supabase-codex-rls-public.sql`, deleted 2026-10-29; git history) in Table Editor → Policies.
- **Script errors:** If the RLS script failed partway (e.g. a table name typo or missing table), later policies may not have been created. Re-run the script and note any red error lines; fix missing tables first, then run the script again.

---

### "column user_profiles.role does not exist"

After adding user roles, the database must have the `role` column on `user_profiles`. Run SQL in owner-approved database apply (see 07-database-operations.md) (e.g. add `role` to `public.user_profiles` with type matching your enum and default `'new_player'`). Until applied, profile and admin features that read/write role may fail.

---

### Realtime: "permission denied for schema" (PoolingReplicationError)

If campaign roll log or character **HP/EN/AP** don’t update in real time and you see `PoolingReplicationError` or `permission denied for schema`, the Realtime publication and RLS on **`public`** tables may be misconfigured. The same fix enables:

- **Campaign roll log** (`public.campaign_rolls`)
- **HP, EN, and AP sync** between encounter combat and character sheets (`public.characters`)

**Fix:** In Supabase Dashboard → **Database → Publications**, confirm `supabase_realtime` (or your publication name) includes `public.campaign_rolls` and `public.characters`. In **Table Editor**, confirm RLS SELECT policies allow campaign participants (and owners) to read rows their clients subscribe to. Owner-approved DDL only (see [ai/guide/07-database-operations.md](ai/guide/07-database-operations.md)). Historical Realtime/RLS examples were in `sql/archive/supabase-rls-policies.sql` and Path C consolidation files (deleted 2026-10-29; see git history).

---

## Migration Note

If migrating from Firebase, the old docs (`DEPLOYMENT_SECRETS.md`, `ADMIN_SDK_SECRETS_SETUP.md`, `SECRETS_SETUP.md`) were previously archived and have since been removed as part of codebase cleanup.
