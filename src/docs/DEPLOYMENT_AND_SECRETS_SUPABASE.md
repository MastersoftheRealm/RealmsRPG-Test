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

**Never** use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY`. `DATABASE_URL` / `DIRECT_URL` are optional (only for external migration tools); the app uses the Supabase client only.

All app tables live in the **public** schema. **Schema reference:** [SUPABASE_SCHEMA.md](SUPABASE_SCHEMA.md). **Which SQL to run and in what order:** [sql/README.md](../../sql/README.md). Run SQL in Supabase Dashboard → SQL Editor.

---

## Supabase Storage Buckets

The app uses two buckets for image uploads. **Create these in Supabase Dashboard → Storage:**

| Bucket | Purpose | Path pattern |
|--------|---------|--------------|
| `portraits` | Character portraits | `{userId}/{characterId}.{ext}` |
| `profile-pictures` | User avatars | `{userId}.{ext}` |

### RLS Policies

Enable RLS on each bucket. The app needs **SELECT, INSERT, UPDATE, and DELETE** for portrait uploads (list existing, remove old file, then upload/upsert). The canonical policy set is in **`sql/supabase-storage-policies.sql`** — run that file in Supabase Dashboard → SQL Editor.

- **Read (SELECT):** Public or own path
- **Insert/Update/Delete:** Only the user’s own path (`portraits`: first folder = `auth.uid()`; `profile-pictures`: filename prefix = `auth.uid()`)

**Create buckets:** In Supabase Dashboard → Storage → New bucket, create `portraits` and `profile-pictures`. Enable public access if you want public URLs (the app uses `getPublicUrl`). Then run **`sql/supabase-storage-policies.sql`** in the SQL Editor.

**Portrait upload fails with "new row violates row-level security policy"?**  
Run `sql/supabase-storage-policies.sql`. If you previously only added INSERT + SELECT (e.g. from an older snippet), add the UPDATE and DELETE policies for the `portraits` bucket from that file.

**Portrait uploads to the bucket but won’t load (400 or 403, “Failed to load resource”)?**  
1. **Make the bucket public** — The app uses **public** URLs for portraits. In Supabase Dashboard → **Storage** → select the **portraits** bucket → **Configuration** (or bucket settings) → turn **Public bucket** on. If it’s off, image requests often get **400** or **403** and the sheet shows no portrait. Do the same for **profile-pictures** if profile avatars don’t load.  
2. **After changing bucket or config** — Restart the dev server or redeploy. The character sheet loads portraits directly (unoptimized) and falls back to the placeholder if the image request fails.

---

## Session Handling

- **Supabase Auth** handles sessions via `@supabase/ssr` (cookies).
- Middleware refreshes sessions automatically.
- No Firebase Admin SDK or custom session API.

---

## Admin Setup

Admins are configured via one of:

1. **Supabase `auth.users` metadata** — Add `role: 'admin'` to user metadata
2. **Database table** — `admins` table with `user_id` (if used)
3. **Environment variable** — `ADMIN_UIDS` (comma-separated user IDs)

See `ADMIN_SETUP.md` for current implementation.

---

## Vercel free tier usage

On the free tier, watch **Edge Requests**, **Fast Data Transfer** (CDN → users), and **Edge Request CPU Duration** (charged when >10ms per request). For a full audit of CDN/query usage and optimization tips, see **`src/docs/ai/CDN_QUERY_AUDIT_2026-02-24.md`**.

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
| `ADMIN_UIDS` | `uid1,uid2` | Your Supabase Auth user IDs (optional, for admin) |

**Never** use `NEXT_PUBLIC_` for `SUPABASE_SERVICE_ROLE_KEY`.

### Step 3: Deploy

1. **Deployments** → **Redeploy** (or push to `main` to trigger auto-deploy).
2. After build, visit your Vercel URL (e.g. `realms-rpg-next.vercel.app`) or your custom domain (e.g. **realmsrpg.com**).
3. Test: sign in, create a character, upload a portrait.

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
   - If Redirect URLs are missing, Supabase may redirect to Site URL with `?code=...`; the app will redirect to `/auth/callback` as a fallback.
2. **Google OAuth (if used):** In Google Cloud Console → APIs & Services → Credentials → your OAuth client → Authorized redirect URIs, add:
   - `https://realmsrpg.com/auth/callback` (and `https://www.realmsrpg.com/auth/callback` if you use www)
   - Your Vercel URL redirect if you still use it.

---

## One-shot SQL: idempotent full setup

If you want to set (or fix) schemas, tables, RLS, and Realtime in one go without tracking what’s already applied:

1. Open **Supabase Dashboard → SQL Editor**.
2. Paste and run the schema/RLS SQL files as needed (e.g. **`sql/path-c-phase0-consolidate-to-public.sql`** for full Path C setup, or **`sql/supabase-idempotent-full.sql`** if that file exists and matches your target state).

Schema and RLS are applied by running SQL in the Dashboard; the app does **not** use Prisma or `prisma migrate`. After schema setup, run **`sql/supabase-storage-policies.sql`** once if you need Storage RLS for the `portraits` and `profile-pictures` buckets.

---

## Verification

1. **Local:** Run `npm run dev`; sign in; create a campaign.
2. **Production:** Deploy to Vercel; add env vars; verify sign-in and campaign creation.

---

## Troubleshooting

### GET /api/codex 500 or codex data empty

All **codex_*** tables live in **public**. If you get 500:

1. **GRANTs + RLS (most common):** The API uses the anon key. You need **table-level GRANT SELECT** for anon/authenticated and **RLS policies**. Without GRANTs you get `42501: permission denied for table codex_feats`.  
   **Fix:** Run **`sql/supabase-codex-rls-public.sql`** in Supabase Dashboard → SQL Editor. It enables RLS and adds “Anyone can read” (SELECT TO public) on all codex_* and core_rules (and grants SELECT to anon/authenticated).
2. **Tables in public:** In Table Editor, confirm `public.codex_feats`, `codex_skills`, `codex_species`, `codex_traits`, `codex_parts`, `codex_properties`, `codex_equipment`, `codex_archetypes`, `codex_creature_feats`, and `core_rules` exist.
3. **Connection / env:** Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (anon key) in Vercel.

The API returns a `hint` in the 500 body when it detects permission/RLS errors; use that to confirm and run the RLS script.

**How to get the exact error (to tell support or debug):**

- **Response body:** Call `GET https://realmsrpg.com/api/codex?debug=1`. The 500 JSON will include `debug: { message, code }` with the real Postgres/Supabase error (e.g. `"permission denied for table codex_feats"`, or `"42P01"` for relation not found). Paste that when asking for help.
- **Vercel:** Project → Logs → filter by `/api/codex`. Look for `[Codex API] Database error:` and the message that follows.
- **Supabase:** Dashboard → **Logs** → Postgres (or API). Look for failed queries or RLS violations around the time of the request.
- **RLS check:** In Supabase SQL Editor run:  
  `SET ROLE anon; SELECT * FROM public.codex_feats LIMIT 1;`  
  If that returns "permission denied" or 0 rows when the table has data, RLS is blocking anon. Re-run `sql/supabase-codex-rls-public.sql` and confirm each table has a policy (Table Editor → table → RLS policies).
- **Script errors:** If the RLS script failed partway (e.g. a table name typo or missing table), later policies may not have been created. Re-run the script and note any red error lines; fix missing tables first, then run the script again.

---

### "column user_profiles.role does not exist"

After adding user roles, the database must have the `role` column on `user_profiles`. Run SQL in Supabase Dashboard → SQL Editor (e.g. add `role` to `public.user_profiles` with type matching your enum and default `'new_player'`). Until applied, profile and admin features that read/write role may fail.

---

### Realtime: "permission denied for schema campaigns" / "permission denied for schema users" (PoolingReplicationError)

If campaign roll log or character **HP/EN/AP** don’t update in real time and you see `PoolingReplicationError` or `permission denied for schema`, the Realtime publication and RLS may need to be applied for `public` (all tables are in `public` after Path C). The same fix enables:

- **Campaign roll log** (campaigns.campaign_rolls)
- **HP, EN, and AP sync** between encounter combat and character sheets (users.characters)

**Fix:** Run the Realtime/RLS block from your schema SQL (e.g. **`sql/supabase-rls-policies.sql`** or the Path C consolidation script) in Supabase Dashboard → SQL Editor. After Path C, all tables are in `public`; ensure Realtime publication includes `public.campaign_rolls` and `public.characters` and that RLS allows SELECT for the roles that need live updates.

---

## Migration Note

If migrating from Firebase, the old docs (`DEPLOYMENT_SECRETS.md`, `ADMIN_SDK_SECRETS_SETUP.md`, `SECRETS_SETUP.md`) were previously archived and have since been removed as part of codebase cleanup.
