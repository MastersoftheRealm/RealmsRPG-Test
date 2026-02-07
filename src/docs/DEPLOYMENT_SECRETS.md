# Deployment & Admin SDK Secrets

**Critical for:** Session cookies, campaign creation, portraits, server actions.

## The Problem

The Next.js app runs as a Cloud Function (`ssrrealmsrpgtest` in `functions/server.js`). For Firebase Admin SDK features (session cookies, `createSessionCookie`, etc.) to work, the function **must** receive service account credentials as environment variables.

## Required Configuration

### 1. Secret Manager

Create these secrets in Google Cloud Secret Manager (project `realmsrpg-test`):

| Secret Name | Description |
|-------------|-------------|
| `SERVICE_ACCOUNT_EMAIL` | Service account email (e.g. `firebase-adminsdk-xxxxx@realmsrpg-test.iam.gserviceaccount.com`) |
| `SERVICE_ACCOUNT_PRIVATE_KEY` | Full private key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` |

**Private key format:** Store with literal `\n` for newlines (two characters: backslash + n), not actual line breaks. Example:
```
-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBg...\n-----END PRIVATE KEY-----\n
```

### 2. functions/server.js — Declare Secrets

The SSR function **must** declare secrets in its config. Without this, the function receives no credentials and `/api/session` returns 500.

```javascript
const ADMIN_SDK_SECRETS = ['SERVICE_ACCOUNT_EMAIL', 'SERVICE_ACCOUNT_PRIVATE_KEY'];

exports.ssrrealmsrpgtest = onRequest(
  { region: 'us-central1', secrets: ADMIN_SDK_SECRETS },
  (req, res) => server.then((it) => it.handle(req, res))
);
```

**Do not remove or rename `ADMIN_SDK_SECRETS`.** If you add a new secret (e.g. `GOOGLE_APPLICATION_CREDENTIALS_JSON`), add it to this array and to `firebase.json`.

### 3. firebase.json

```json
"frameworksBackend": {
  "region": "us-central1",
  "secrets": ["SERVICE_ACCOUNT_EMAIL", "SERVICE_ACCOUNT_PRIVATE_KEY"]
}
```

Keep this in sync with `functions/server.js`.

### 4. src/lib/firebase/server.ts

The server reads credentials from:

1. `FIREBASE_SERVICE_ACCOUNT_KEY` or `GOOGLE_APPLICATION_CREDENTIALS_JSON` (full JSON)
2. `SERVICE_ACCOUNT_EMAIL` + `SERVICE_ACCOUNT_PRIVATE_KEY` (individual vars)

Do not change env var names without updating Secret Manager and the function config.

## Verification

After deploy:

1. Sign in on the deployed site.
2. Check browser console — no "Error creating session" or 500 on `/api/session`.
3. Create a campaign — should succeed.
4. Check Cloud Logging for the function — no "credentials not set" or similar.

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|--------------|-----|
| `/api/session` 500 | Secrets not injected into function | Add `secrets: [...]` to `onRequest` in `functions/server.js`, redeploy |
| `/api/session` 500 or "Memory limit exceeded" | SSR function using &gt;256 MiB (default) | Add `memory: 512` to `onRequest` in `functions/server.js`, redeploy |
| "Failed to create campaign" / `firebase-admin-a14c8a5423a75469` ERR_MODULE_NOT_FOUND | Firebase CLI runs `next build` (Turbopack) directly, ignoring package.json | A patch in `patches/firebase-tools+*.patch` makes Firebase run `next build --webpack`. Run `npm install patch-package` and `npm install` so postinstall applies it. |
| "Failed to create campaign" | No session cookie (session API failed) | Fix session 500 first |
| "Invalid token" / auth errors | Private key format wrong | Re-store key with `\n` as literal, redeploy |
| Works locally, fails in prod | Local uses `.env.local`; prod uses Secret Manager | Ensure secrets exist and function declares them |

## AI / Agent Safeguards

When modifying deployment or auth-related code:

1. **Never remove** `secrets: ADMIN_SDK_SECRETS` from `functions/server.js` unless replacing with an equivalent.
2. **Never change** env var names (`SERVICE_ACCOUNT_EMAIL`, `SERVICE_ACCOUNT_PRIVATE_KEY`) without updating:
   - Secret Manager secret names
   - `firebase.json` frameworksBackend.secrets
   - `functions/server.js` ADMIN_SDK_SECRETS
3. **If adding** a new credential (e.g. full JSON key): add to all three places above.
4. **After any change** to server.ts credential loading: run `npm run build` and verify deploy still works.

See also: `SECRETS_SETUP.md`, `AGENTS.md`.
