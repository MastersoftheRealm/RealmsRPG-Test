# Deployment & Secrets — Supabase + Vercel

> **Replaces:** `DEPLOYMENT_SECRETS.md`, `SECRETS_SETUP.md`, `ADMIN_SDK_SECRETS_SETUP.md`  
> **Stack:** Next.js, Supabase (PostgreSQL, Auth, Storage), Prisma, Vercel

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

# Database (from Supabase → Settings → Database)
# Session Pooler (port 6543) for serverless — append ?pgbouncer=true (required for Prisma + PgBouncer)
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
# Direct (port 5432) for migrations — no pgbouncer param
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Production (Vercel Dashboard)

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | All | Anon/public key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | All | **Server-only** — never expose to client |
| `DATABASE_URL` | All | Session Pooler (port 6543), **must end with `?pgbouncer=true`** |
| `DIRECT_URL` | All | Direct connection (port 5432) for Prisma migrations |

**Never** use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`.

---

## Supabase Storage Buckets

The app uses two buckets for image uploads. **Create these in Supabase Dashboard → Storage:**

| Bucket | Purpose | Path pattern |
|--------|---------|--------------|
| `portraits` | Character portraits | `{userId}/{characterId}.{ext}` |
| `profile-pictures` | User avatars | `{userId}.{ext}` |

### RLS Policies

Enable RLS on each bucket. The app needs **SELECT, INSERT, UPDATE, and DELETE** for portrait uploads (list existing, remove old file, then upload/upsert). The canonical policy set is in **`prisma/supabase-storage-policies.sql`** — run that file in Supabase Dashboard → SQL Editor.

- **Read (SELECT):** Public or own path
- **Insert/Update/Delete:** Only the user’s own path (`portraits`: first folder = `auth.uid()`; `profile-pictures`: filename prefix = `auth.uid()`)

**Create buckets:** In Supabase Dashboard → Storage → New bucket, create `portraits` and `profile-pictures`. Enable public access if you want public URLs (the app uses `getPublicUrl`). Then run **`prisma/supabase-storage-policies.sql`** in the SQL Editor.

**Portrait upload fails with "new row violates row-level security policy"?**  
Run `prisma/supabase-storage-policies.sql`. If you previously only added INSERT + SELECT (e.g. from an older snippet), add the UPDATE and DELETE policies for the `portraits` bucket from that file.

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
2. **Database table** — `admins` table with `user_id`; check via Prisma
3. **Environment variable** — `ADMIN_UIDS` (comma-separated user IDs)

See `ADMIN_SETUP.md` for current implementation.

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
| `DATABASE_URL` | `postgresql://...` **+ `?pgbouncer=true`** | Supabase → Database → Session Pooler (port 6543); append `?pgbouncer=true` |
| `DIRECT_URL` | `postgresql://...` | Supabase → Database → Direct connection (port 5432) |
| `ADMIN_UIDS` | `uid1,uid2` | Your Supabase Auth user IDs (optional, for admin) |

**Never** use `NEXT_PUBLIC_` for `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`.

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

## Verification

1. **Local:** Run `npm run dev`; sign in; create a campaign.
2. **Production:** Deploy to Vercel; add env vars; verify sign-in and campaign creation.

---

## Troubleshooting

### "column user_profiles.role does not exist"

After adding user roles, the database must have the `role` column on `user_profiles`. If you see this error (e.g. when changing username, loading profile, or using "Add to my library"):

1. **Apply pending Prisma migrations** (recommended):
   ```bash
   npx prisma migrate deploy
   ```
   This uses `DIRECT_URL` and applies the `20260214000000_add_user_role` migration, which adds `users.UserRole` and `user_profiles.role` with default `'new_player'`. Existing rows get the default automatically.

2. **Or run the SQL manually** (e.g. in Supabase SQL Editor):
   ```sql
   CREATE TYPE "users"."UserRole" AS ENUM ('new_player', 'playtester', 'developer', 'admin');
   ALTER TABLE "users"."user_profiles" ADD COLUMN IF NOT EXISTS "role" "users"."UserRole" NOT NULL DEFAULT 'new_player';
   ```

Until this migration is applied, any code that reads or writes `UserProfile` (username change, profile load, admin users list, add-to-library) will fail.

---

### Realtime: "permission denied for schema campaigns" / "permission denied for schema users" (PoolingReplicationError)

If campaign roll log or character **HP/EN/AP** don’t update in real time and you see `PoolingReplicationError` with `insufficient_privilege` / `permission denied for schema campaigns` or `permission denied for schema users`, the Realtime service can’t access those custom schemas when applying RLS. The same fix enables:

- **Campaign roll log** (campaigns.campaign_rolls)
- **HP, EN, and AP sync** between encounter combat and character sheets (users.characters)

**Fix:** Run the Realtime-related block from **`prisma/supabase-rls-policies.sql`** in Supabase Dashboard → SQL Editor. It must include:

```sql
GRANT USAGE ON SCHEMA campaigns TO anon, authenticated, service_role, authenticator;
GRANT USAGE ON SCHEMA users TO anon, authenticated, service_role, authenticator;
```

(Do **not** grant to a role like `supabase_realtime` unless your project explicitly has that role; it does not exist in standard Supabase projects and will cause "role does not exist" errors.)

---

## Migration Note

If migrating from Firebase, the old docs (`DEPLOYMENT_SECRETS.md`, `ADMIN_SDK_SECRETS_SETUP.md`, `SECRETS_SETUP.md`) were previously archived and have since been removed as part of codebase cleanup.
