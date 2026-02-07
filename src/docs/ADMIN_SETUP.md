# Admin Setup

How to configure admin access for the RealmsRPG admin tools (Codex Editor, etc.).

## Option A: Firestore `config/admins` (recommended)

1. Open [Firebase Console](https://console.firebase.google.com) → Firestore Database.
2. Create a document at path `config/admins`.
3. Add a field `uids` (array) with your Firebase Auth UID(s):
   ```json
   { "uids": ["your-uid-here"] }
   ```
4. To find your UID: sign in on the app, open browser DevTools → Application → Cookies, or inspect the session; or use Firebase Console → Authentication → Users and copy the UID.

## Option B: Environment variable

Set `NEXT_PUBLIC_ADMIN_UIDS` or `ADMIN_UIDS` (comma-separated UIDs):

```
NEXT_PUBLIC_ADMIN_UIDS=uid1,uid2,uid3
```

For local dev: add to `.env.local`. For production: add to Secret Manager / deployment config.

## Verifying

1. Sign in with an admin account.
2. You should see an "Admin" link in the header.
3. Visit `/admin` — you should see the Admin dashboard.
4. Non-admins are redirected to `/` when visiting `/admin`.

## Security

- `config/admins` has Firestore rules that block client reads/writes; only the server (Admin SDK) can read it.
- Admin routes are protected server-side in the layout.
