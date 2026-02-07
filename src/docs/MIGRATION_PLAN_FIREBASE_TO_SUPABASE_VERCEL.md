# RealmsRPG Migration Plan: Firebase → Supabase + Vercel + Next.js Preferred Stack

> **Purpose:** Step-by-step plan to migrate from Firebase (Hosting, Firestore, RTDB, Auth, Storage) to a Next.js–preferred stack: Vercel, Supabase (PostgreSQL), Supabase Auth, Prisma, and `.env`–based secrets.

**Last updated:** Feb 2026

---

## Executive Summary

| Current | Target |
|--------|--------|
| Firebase Hosting + Frameworks | Vercel |
| Firebase Auth | Supabase Auth |
| Firestore | Supabase (PostgreSQL) via Prisma |
| Realtime Database | Supabase (PostgreSQL) |
| Firebase Storage | Supabase Storage |
| GCloud Secret Manager | `.env` / Vercel Env Vars |
| Firebase Admin SDK | Supabase server client + Prisma |

---

## Cost & Free-Tier Guidance

### Vercel

- **Hobby (Free):** Personal projects, non-commercial use. 100GB bandwidth, serverless functions. **Sufficient for low-usage launch.**
- **Pro ($20/mo):** Commercial use, team features, password protection. Only needed when you go commercial or need team features.
- **User action:** Sign up at [vercel.com](https://vercel.com) and connect your GitHub repo. No subscription required for Hobby.

### Supabase

- **Free:** 500MB database, 1GB file storage, 50K monthly active users, 2GB bandwidth. **Sufficient for low-usage launch.**
- **Pro ($25/mo):** 8GB database, 100GB storage. Only needed when you outgrow free tier.
- **User action:** Your project `RealmsRPG-Test` is already created. No paid plan needed initially.

---

## What AI Cannot Do (You Must Do These)

| Action | Why |
|--------|-----|
| Create Vercel/Supabase accounts | Requires your credentials |
| Enable Google OAuth in Supabase | Dashboard access |
| Add env vars to Vercel Dashboard | Secure credential storage |
| Export Google Sheets to CSV | Access to your Sheets |
| Reset Supabase DB password | Security-sensitive |
| Deploy from Vercel | Linked to your GitHub/deploy keys |

---

## Phase 0: User Actions (Before Code Changes)

These steps require you to perform them manually; AI cannot do them.

### 0.1 Vercel Setup

1. **Create Vercel account** (if not already): [vercel.com/signup](https://vercel.com/signup)
2. **Import project:** Connect GitHub → select `RealmsRPG-Test` repo
3. **Configure build:**
   - Framework: Next.js (auto-detected)
   - Build Command: `npm run build` (or `next build --webpack` if needed)
   - Output Directory: `.next`
4. **Do not deploy yet** — we'll add env vars first in a later phase

### 0.2 Supabase Setup

1. **Project:** Already created as `RealmsRPG-Test` (project ID: `[PROJECT-REF]`)
2. **Enable Auth providers:**
   - Supabase Dashboard → Authentication → Providers
   - Enable **Email** (enabled by default)
   - Enable **Google:** Add OAuth Client ID and Secret from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
     - Create OAuth 2.0 Client ID (Web application)
     - Add authorized redirect URI: `https://[PROJECT-REF].supabase.co/auth/v1/callback`
     - Copy Client ID and Client Secret into Supabase Google provider
3. **Database password:** If you haven't set one, go to Database Settings → Reset database password. You'll need this for `DATABASE_URL`.
4. **Storage bucket:** Create bucket `portraits` (and optionally `profile-pictures`) with RLS policies (we'll define in Phase 4)

### 0.3 Google Sheets → Data Export

1. **Export each sheet** as CSV (File → Download → CSV)
2. **Naming convention:** `feats.csv`, `parts.csv`, `properties.csv`, `species_traits.csv`, etc.
3. **Place exported files** in `scripts/seed-data/` (create this folder)
4. **Column headers** must match the Prisma schema we define — we'll create a mapping script

### 0.4 Environment Variables (Local)

Create `.env.local` in project root (gitignored). Never commit secrets.

```env
# Supabase (from Supabase Dashboard → Settings → API)
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT-REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=<your_publishable_key>
SUPABASE_SERVICE_ROLE_KEY=<your_secret_key>

# Database (Direct connection for Prisma - from Supabase → Settings → Database)
# Use Session Pooler (port 6543) for serverless/Vercel - better connection handling
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
# Or direct (port 5432) for migrations - Direct connection may require IPv4 add-on on some networks
DIRECT_URL="postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres"
```

**User action:** Copy your project URL and keys from Supabase Dashboard → Settings → API. For `DATABASE_URL`, use Settings → Database → Connection string. **Supabase offers two modes:**
- **Session Pooler (port 6543):** Recommended for Vercel/serverless — add `?pgbouncer=true` if needed
- **Direct (port 5432):** For migrations; some networks (IPv4-only) may need the IPv4 add-on or Session Pooler

Get the pooler connection string from: Database Settings → Connection string → "Use connection pooling" → URI.

### 0.5 Create `.env.example`

Create a template (no real values) for documentation:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

---

## Phase 1: Database Schema & Prisma Setup

### 1.1 Install Dependencies

```bash
npm install prisma @prisma/client @supabase/supabase-js @supabase/ssr
npm install -D prisma
```

### 1.2 Initialize Prisma

```bash
npx prisma init
```

### 1.3 Prisma Schema (High-Level)

Below is the schema structure. Full schema will be generated in implementation.

**Tables to create:**

| Table | Purpose | Source |
|-------|---------|--------|
| `users` | User profiles (displayName, username, photoURL) | Firestore `users` |
| `usernames` | Username → uid lookup | Firestore `usernames` |
| `characters` | Player characters (user_id FK) | Firestore `users/{uid}/character` |
| `user_powers` | User library: powers | Firestore `users/{uid}/library` |
| `user_techniques` | User library: techniques | Firestore `users/{uid}/techniqueLibrary` |
| `user_items` | User library: items | Firestore `users/{uid}/itemLibrary` |
| `user_creatures` | User library: creatures | Firestore `users/{uid}/creatureLibrary` |
| `campaigns` | Campaigns with owner/members | Firestore `campaigns` |
| `campaign_rolls` | Roll log per campaign | Firestore `campaigns/{id}/rolls` |
| `codex_feats` | Game reference: feats | Firestore `codex_feats` |
| `codex_skills` | Game reference: skills | Firestore `codex_skills` |
| `codex_species` | Game reference: species | Firestore `codex_species` |
| `codex_traits` | Game reference: traits | Firestore `codex_traits` |
| `codex_parts` | Power/technique parts | Firestore `codex_parts` |
| `codex_properties` | Item properties | Firestore `codex_properties` |
| `codex_equipment` | Equipment items | Firestore `codex_equipment` |
| `codex_archetypes` | Archetypes | Firestore `codex_archetypes` |
| `codex_creature_feats` | Creature feats | Firestore `codex_creature_feats` / RTDB `creature_feats` |

**JSONB columns:** Character data (abilities, powers, skills, etc.) will use `JsonB` for flexible nested structures, matching current Firestore documents.

### 1.4 Row Level Security (RLS)

Supabase uses PostgreSQL RLS. Policies will mirror current Firestore rules:

- **Users:** `users.id = auth.uid()` for read/write
- **Characters:** `user_id = auth.uid()`
- **User libraries:** Same pattern
- **Codex tables:** Public read, no write (admin via service role)
- **Campaigns:** Owner or member can read; owner can update/delete

### 1.5 User Action: Run Migrations

After schema is created:

```bash
npx prisma migrate dev --name init
```

---

## Phase 2: Supabase Client & Auth Utilities

### 2.1 Create Supabase Clients

**Files to create:**

- `src/utils/supabase/client.ts` — Browser client (publishable key)
- `src/utils/supabase/server.ts` — Server client (cookie-aware)
- `src/utils/supabase/middleware.ts` — Session refresh middleware

(Use the exact structure from Supabase Next.js guide — already provided in your question.)

### 2.2 Auth Replacement Strategy

**Option A: Supabase Auth (recommended)**  
- Native Supabase integration, simpler
- `supabase.auth.signInWithPassword`, `supabase.auth.signUp`, `supabase.auth.signInWithOAuth({ provider: 'google' })`
- Sessions via cookies handled by `@supabase/ssr`
- Supports: Email, Google, GitHub, Discord, etc.

**Option B: NextAuth.js + Supabase**  
- Use if you need OAuth providers not in Supabase's list
- Supabase as database adapter for sessions
- More configuration, but flexible

**Recommendation:** Use Supabase Auth. It supports email/password and Google (same as current Firebase Auth). NextAuth adds complexity without clear benefit for this stack.

### 2.3 Session Handling

- Replace `src/lib/firebase/session.ts` with Supabase session utilities
- Replace `/api/session` route: Supabase middleware handles session refresh; we may keep a thin route for compatibility or remove it
- `getSession()` → `supabase.auth.getSession()` (server)
- `createSession` / `clearSession` → Supabase sign-in/sign-out

---

## Phase 3: File Storage (Supabase Storage)

### 3.1 Storage Buckets

| Bucket | Purpose | Path pattern |
|--------|---------|--------------|
| `portraits` | Character portraits | `{userId}/{characterId}.jpg` |
| `profile-pictures` | User avatars | `{userId}.jpg` |

### 3.2 RLS for Storage

- Users can read/write only their own files (`auth.uid()` matches path)

### 3.3 Code Changes

- Replace `ref`, `uploadBytes`, `getDownloadURL` from Firebase Storage with Supabase Storage API:

```ts
const { data, error } = await supabase.storage
  .from('portraits')
  .upload(`${userId}/${characterId}.jpg`, file, { upsert: true });
const { data: { publicUrl } } = supabase.storage.from('portraits').getPublicUrl(path);
```

---

## Phase 4: Service & Hook Migration

### 4.1 Character Service

- Replace `character-service.ts` Firestore calls with Prisma or Supabase client
- Use `character` table with `user_id` FK

### 4.2 User Library

- Replace `use-user-library.ts` Firestore collection references with Supabase/Prisma queries
- Tables: `user_powers`, `user_techniques`, `user_items`, `user_creatures`

### 4.3 Codex / Game Data

- Replace `use-firestore-codex.ts` and `use-rtdb.ts` with Prisma or Supabase queries
- All codex data lives in PostgreSQL tables

### 4.4 Campaign Service

- Replace `campaign-service.ts` Firestore with Prisma/Supabase

### 4.5 Auth Hook

- Replace `use-auth.ts` Firebase Auth with Supabase Auth
- Replace `useSessionSync` with Supabase middleware (no custom sync needed)

---

## Phase 5: Remove Firebase

### 5.1 Deprecate

- `src/lib/firebase/*` — delete after migration
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`
- `functions/` directory — Cloud Functions (`savePowerToLibrary` etc.) are **not used** by the app; the app uses direct Firestore client writes. Safe to remove.
- `patches/firebase-tools+*.patch`

### 5.2 Package.json

Remove:

```json
"firebase", "firebase-admin", "firebase-tools"
```

### 5.3 Environment Cleanup

- Remove all `NEXT_PUBLIC_FIREBASE_*` and `SERVICE_ACCOUNT_*` references
- Remove `RECAPTCHA_SITE_KEY` if App Check is不再 needed (Supabase has built-in protection)

---

## Phase 6: Google Sheets Import

### 6.1 Seed Script Structure

```
scripts/
  seed-data/
    feats.csv
    parts.csv
    properties.csv
    species.csv
    traits.csv
    skills.csv
    archetypes.csv
    creature_feats.csv
    equipment.csv
  seed-to-supabase.ts   # or seed-to-prisma.ts
```

### 6.2 Import Options

**Option A: Prisma seed**  
- Use `prisma/seed.ts` to read CSVs and insert via Prisma
- Run: `npx prisma db seed`

**Option B: Supabase Table Editor**  
- Manually import CSV via Supabase Dashboard → Table Editor → Import

**Option C: Custom script**  
- Node script that reads CSV, maps columns to schema, uses Prisma or Supabase client to insert

**User action:** Provide CSV files; we'll create the seed script with column mapping. You may need to adjust column names in Sheets to match schema (e.g., `ability_req` vs `ability_req`).

---

## Phase 7: Vercel Deployment

### 7.1 Vercel Environment Variables

In Vercel Dashboard → Project → Settings → Environment Variables, add:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL` (use Vercel's "encrypted" option; never expose in client)

### 7.2 Deploy

- Push to main → Vercel auto-deploys
- Or: `vercel --prod` from CLI

---

## Implementation Order (Suggested)

| Order | Phase | Description |
|-------|-------|-------------|
| 1 | 0 | User: Vercel + Supabase setup, export Sheets, create `.env.local` |
| 2 | 1 | Prisma schema, migrations, seed script skeleton |
| 3 | 6 | Import Google Sheets data via seed script |
| 4 | 2 | Supabase clients, auth utilities |
| 5 | 4 | Migrate auth (use-auth, login, register, session) |
| 6 | 4 | Migrate codex hooks (use-firestore-codex, use-rtdb) |
| 7 | 4 | Migrate character-service, use-user-library |
| 8 | 4 | Migrate campaign-service |
| 9 | 3 | Migrate storage (portraits, profile pictures) |
| 10 | 5 | Remove Firebase, clean package.json |
| 11 | 7 | Deploy to Vercel |

---

## Security Checklist

- [ ] All secrets in `.env.local` and Vercel env vars (never in code)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` only on server (never `NEXT_PUBLIC_`)
- [ ] RLS enabled on all Supabase tables
- [ ] Storage RLS policies restrict access by `auth.uid()`
- [ ] Username uniqueness and rate limiting preserved (server-side)
- [ ] Session cookies httpOnly, secure, sameSite

---

## Files to Create/Modify (Summary)

**Create:**
- `prisma/schema.prisma`
- `src/utils/supabase/client.ts`
- `src/utils/supabase/server.ts`
- `src/utils/supabase/middleware.ts`
- `scripts/seed-to-supabase.ts` (or Prisma seed)
- `.env.example`

**Modify:**
- `src/hooks/use-auth.ts`
- `src/hooks/use-session-sync.ts` (or remove; Supabase middleware handles)
- `src/hooks/use-user-library.ts`
- `src/hooks/use-firestore-codex.ts` → replace with Prisma/Supabase
- `src/hooks/use-rtdb.ts` → remove or replace
- `src/services/character-service.ts`
- `src/services/campaign-service.ts`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/register/page.tsx`
- `src/app/(auth)/actions.ts`
- `src/app/api/session/route.ts` (adapt or remove)
- `src/app/(main)/characters/[id]/page.tsx` (portrait upload)
- `src/app/(main)/my-account/page.tsx` (profile picture)
- `middleware.ts` (add Supabase session refresh)
- `package.json`

**Delete:**
- `src/lib/firebase/*`
- `firebase.json`, `firestore.rules`, `storage.rules`, `database.rules.json`
- `functions/`
- `patches/firebase-tools+*.patch`

---

## User Actions Checklist (Printable)

Copy this and check off as you go:

- [ ] Create Vercel account, import repo
- [ ] Enable Google OAuth in Supabase Auth
- [ ] Export Google Sheets as CSV → `scripts/seed-data/`
- [ ] Create `.env.local` with Supabase + DB URL
- [ ] Create `.env.example` (no real values)
- [ ] Run `npx prisma migrate dev` after schema is ready
- [ ] Add env vars to Vercel project
- [ ] Reset Supabase DB password if needed (for `DATABASE_URL`)

---

## Phase 7b: Documentation Cleanup

**After Phase 5:** Update all documentation to reflect Supabase/Prisma/Vercel stack. See `src/docs/DOCUMENTATION_MIGRATION_AUDIT.md` for full scope:

- Update AGENTS.md, AGENT_GUIDE.md, ARCHITECTURE.md
- Archive DEPLOYMENT_SECRETS, ADMIN_SDK_SECRETS_SETUP, SECRETS_SETUP
- Create DEPLOYMENT_AND_SECRETS_SUPABASE.md ✅
- Rename RTDB → Codex globally (TASK-145)

---

## Phase Completion Audit (Feb 2026)

| Phase | Status | Notes |
|-------|--------|-------|
| **Phase 0** | ✅ User actions | Vercel, Supabase, CSV export, `.env.local` |
| **Phase 1** | ✅ Done | Prisma schema, migrations, seed script |
| **Phase 2** | ✅ Done | Supabase client/server/middleware |
| **Phase 3** | ⏳ Not started | Storage (portraits, profile pics) → Supabase Storage |
| **Phase 4** | 🔄 Partial | Auth ✅, Codex ✅. character-service, use-user-library, campaign-service still Firestore (TASK-148) |
| **Phase 5** | ⏳ Not started | Remove Firebase (delete firebase/, firebase.json, etc.) |
| **Phase 6** | ✅ Done | Seed script, db:seed |
| **Phase 7** | ⏳ Not started | Vercel deploy, env vars |
| **Phase 7b** | 🔄 In progress | Doc audit (TASK-144) ✅, RTDB→Codex (TASK-145) ✅, gold→currency (TASK-147) ✅ |

**Resolved:** TASK-146 (build errors) ✅, TASK-149 (admin codex → Prisma) ✅. **Remaining:** TASK-148 (character/library/campaign → Prisma).

---

## Progress Log

- **2026-02-07:** Phase 1 complete — Prisma schema, migrations, seed script. Phase 2 complete — Supabase client/server/middleware utilities. Build passes. Prisma downgraded to 5.22 for stability (Prisma 6/7 had WASM module issues).
- **2026-02-07:** Documentation audit created — DOCUMENTATION_MIGRATION_AUDIT.md, DEPLOYMENT_AND_SECRETS_SUPABASE.md. AGENTS.md, AGENT_GUIDE.md, README.md, .cursor/rules updated for Supabase. TASK-144, TASK-145 added for doc cleanup and RTDB→Codex rename.
- **2026-02-07:** Phase audit added. TASK-145 promoted to critical (RTDB refs confusing during migration). TASK-146 (build errors), TASK-147 (gold→currency), TASK-148 (character/library/campaign Prisma), TASK-149 (admin codex actions Prisma) added.
- **2026-02-07:** TASK-145 done (RTDB→Codex rename). TASK-146 done (TypeScript build fixes). TASK-147 done (gold→currency terminology). TASK-149 done (admin codex actions → Prisma). TASK-148 pending (Phase 4: character-service, use-user-library, campaign-service → Prisma; coordinate with Phase 4 agent).

---

## Next Steps

When you're ready to start implementation:

1. **Phase 0:** Complete all user actions above.
2. **Phase 1:** Request the full Prisma schema and migration.
3. **Phase 6:** Provide CSV column headers from your Sheets; we'll create the seed script.
4. **Phases 2–5:** Implement in order as outlined.
5. **Phase 7b:** Execute documentation cleanup per DOCUMENTATION_MIGRATION_AUDIT.md.

If you prefer to tackle one phase at a time, specify which phase and we can proceed step by step.
