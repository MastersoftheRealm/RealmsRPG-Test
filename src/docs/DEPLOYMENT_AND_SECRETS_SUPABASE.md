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
# Session Pooler (port 6543) for serverless — recommended for Vercel
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
# Direct (port 5432) for migrations
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

### Production (Vercel Dashboard)

In Vercel → Project → Settings → Environment Variables, add:

| Variable | Scope | Notes |
|----------|-------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | All | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | All | Anon/public key (safe for client) |
| `SUPABASE_SERVICE_ROLE_KEY` | All | **Server-only** — never expose to client |
| `DATABASE_URL` | All | Use Session Pooler string for serverless |

**Never** use `NEXT_PUBLIC_` prefix for `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`.

---

## Supabase Storage Buckets

The app uses two buckets for image uploads. **Create these in Supabase Dashboard → Storage:**

| Bucket | Purpose | Path pattern |
|--------|---------|--------------|
| `portraits` | Character portraits | `{userId}/{characterId}.{ext}` |
| `profile-pictures` | User avatars | `{userId}.{ext}` |

### RLS Policies

Enable RLS on each bucket. Add policies so authenticated users can:

- **Read:** Any file (public URLs; or restrict to own path if using private bucket)
- **Insert/Update:** Only their own path

**profile-pictures** — path is `{userId}.{ext}` (flat, no folder). Allow uploads only when the filename (before extension) matches `auth.uid()`:

```sql
-- Allow authenticated users to upload their own profile picture (path: userId.ext)
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND name LIKE (auth.uid()::text || '.%'));

-- Allow public read
CREATE POLICY "Profile pictures are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');
```

**portraits** — path is `{userId}/{characterId}.{ext}`. The first path segment must match `auth.uid()`:

```sql
-- Allow authenticated users to upload portraits to their folder
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portraits' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public read
CREATE POLICY "Portraits are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portraits');
```

**Create buckets:** In Supabase Dashboard → Storage → New bucket, create `portraits` and `profile-pictures`. Enable public access if you want public URLs (the app uses `getPublicUrl`). Then add the RLS policies above via SQL Editor or Storage → Policies.

### Copy-paste ready (SQL Editor)

1. Supabase Dashboard → **SQL Editor** → New query  
2. Paste the block below → click **Run**

```sql
-- Profile pictures: users can upload only their own (path: userId.ext)
CREATE POLICY "Users can upload own profile picture"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'profile-pictures' AND name LIKE (auth.uid()::text || '.%'));

CREATE POLICY "Profile pictures are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'profile-pictures');

-- Portraits: users can upload only to their folder (path: userId/characterId.ext)
CREATE POLICY "Users can upload own portraits"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'portraits' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Portraits are publicly readable"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'portraits');
```

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
| `DATABASE_URL` | `postgresql://...` | Supabase → Settings → Database → Connection string (Session Pooler, port 6543) |
| `ADMIN_UIDS` | `uid1,uid2` | Your Supabase Auth user IDs (optional, for admin) |

**Never** use `NEXT_PUBLIC_` for `SUPABASE_SERVICE_ROLE_KEY` or `DATABASE_URL`.

### Step 3: Deploy

1. **Deployments** → **Redeploy** (or push to `main` to trigger auto-deploy).
2. After build, visit your Vercel URL (e.g. `realms-rpg-next.vercel.app`).
3. Test: sign in, create a character, upload a portrait.

### Step 4: Auth redirect (if needed)

1. **Supabase** → Authentication → URL Configuration:
   - **Site URL:** your Vercel URL (e.g. `https://your-app.vercel.app`)
   - **Redirect URLs:** Add `https://your-app.vercel.app/auth/callback`, `https://your-app.vercel.app/auth/confirm`
2. **Google OAuth:** Add your Vercel URL to authorized redirect URIs in Google Cloud Console.

---

## Verification

1. **Local:** Run `npm run dev`; sign in; create a campaign.
2. **Production:** Deploy to Vercel; add env vars; verify sign-in and campaign creation.

---

## Migration Note

If migrating from Firebase, the old docs (`DEPLOYMENT_SECRETS.md`, `ADMIN_SDK_SECRETS_SETUP.md`, `SECRETS_SETUP.md`) are archived in `archived_docs/` for reference.
