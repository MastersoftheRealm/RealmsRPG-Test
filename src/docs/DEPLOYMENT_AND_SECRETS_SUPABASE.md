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

# Optional: Firebase App Check (only if still using Firebase during migration)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=

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

## Verification

1. **Local:** Run `npm run dev`; sign in; create a campaign.
2. **Production:** Deploy to Vercel; add env vars; verify sign-in and campaign creation.

---

## Migration Note

If migrating from Firebase, the old docs (`DEPLOYMENT_SECRETS.md`, `ADMIN_SDK_SECRETS_SETUP.md`, `SECRETS_SETUP.md`) are archived in `archived_docs/` for reference.
