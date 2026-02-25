# Admin Setup

How to configure admin access for the RealmsRPG admin tools (Codex Editor, etc.).

**Stack:** Supabase Auth + env vars (no Firestore).

---

## Configuration

Set `ADMIN_UIDS` or `NEXT_PUBLIC_ADMIN_UIDS` (comma-separated Supabase Auth UIDs):

```
ADMIN_UIDS=uid1,uid2,uid3
```

- **Local:** Add to `.env.local`
- **Production:** Add to Vercel Dashboard → Project → Settings → Environment Variables

**To find your UID:** Supabase Dashboard → Authentication → Users → click your user → copy the UUID.

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

- `src/lib/admin.ts` — `isAdmin(uid)` reads from env
- `src/app/api/admin/check/route.ts` — Client-side admin check via API
