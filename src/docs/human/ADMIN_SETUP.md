# Admin Setup

How to configure admin access for the RealmsRPG admin tools (Codex Editor, etc.).

**Stack:** Supabase Auth + `user_profiles.role` (no Firestore).

---

## Configuration

Admin access is controlled by `user_profiles.role = 'admin'` in Supabase.

Grant or revoke admin only with **owner approval** on the target database (Dashboard user management or an approved migration). Agents do not run role-change SQL. See [07-database-operations.md](../ai/guide/07-database-operations.md).

---

## Verifying

1. Sign in with an admin account.
2. You should see an "Admin" link in the header.
3. Visit `/admin` — you should see the Admin dashboard.
4. Non-admins are redirected to `/` when visiting `/admin`.

---

## Migration & Deploy

| Step | Command / Action |
|------|-------------------|
| Run schema/RLS | Owner-approved SQL on the target environment only — see `DEPLOYMENT_AND_SECRETS_SUPABASE.md` and [07-database-operations.md](../ai/guide/07-database-operations.md) |
| Seed Codex data | `npm run db:seed` only when env points at an approved non-production database |
| Core rules JSON | `node scripts/seed-core-rules.js --export-json` (repo files only) |
| Deploy to Vercel | Push to the default branch; production promotion is owner-controlled in Vercel |

See `DEPLOYMENT_AND_SECRETS_SUPABASE.md` for env vars and deployment overview.

---

## Public Library (planned)

The app has a **Codex** (reference data) and **user Library** (private items). A **public library** feature (admin-curated items users can "Add to my library") is planned but not yet implemented. When available, admins will save items to the public library from the creators; users will browse and copy them. Track status in ClickUp.

---

## Implementation

- `src/lib/admin.ts` — `isAdmin(uid)` reads `user_profiles.role`
- `src/app/api/admin/check/route.ts` — Client-side admin check via API
