# Admin Setup

How to configure admin access for the RealmsRPG admin tools (Codex Editor, etc.).

**Stack:** Supabase Auth + `user_profiles.role` (no Firestore).

---

## Configuration

Admin access is controlled by `user_profiles.role = 'admin'` in Supabase.

To grant admin:

1. Find the user's UID in Supabase Dashboard → Authentication → Users.
2. In Supabase SQL Editor, run:

```sql
update public.user_profiles
set role = 'admin'
where id = '<user-uid>';
```

To remove admin:

```sql
update public.user_profiles
set role = 'developer' -- or new_player / playtester
where id = '<user-uid>';
```

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
| Run schema/RLS | Run SQL files in Supabase Dashboard → SQL Editor (see `DEPLOYMENT_AND_SECRETS_SUPABASE.md`) |
| Seed Codex data | `npm run db:seed` (node script using Supabase client; requires `.env` with `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`) |
| Seed core rules | `node scripts/seed-core-rules.js` |
| Deploy to Vercel | Push to `main` (auto-deploy) or `vercel --prod` from CLI |

See `DEPLOYMENT_AND_SECRETS_SUPABASE.md` for full deployment steps and env vars.

---

## Public Library (planned)

The app has a **Codex** (reference data) and **user Library** (private items). A **public library** feature (admin-curated items users can "Add to my library") is planned but not yet implemented. When available, admins will save items to the public library from the creators; users will browse and copy them. See `AI_TASK_QUEUE.md` (TASK-136, TASK-141) for implementation status.

---

## Implementation

- `src/lib/admin.ts` — `isAdmin(uid)` reads `user_profiles.role`
- `src/app/api/admin/check/route.ts` — Client-side admin check via API
