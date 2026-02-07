# Admin SDK Secrets — Fresh Setup Guide

Complete audit and setup for Admin SDK credentials used by session cookies, campaign creation, and server actions.

## Secret Names (Use Exactly)

| Secret Name | Description | Used By |
|-------------|-------------|---------|
| `SERVICE_ACCOUNT_EMAIL` | `firebase-adminsdk-fbsvc@realmsrpg-test.iam.gserviceaccount.com` | server.ts |
| `SERVICE_ACCOUNT_PRIVATE_KEY` | Private key with literal `\n` for newlines | server.ts |

**All three places must use these exact names:**
1. `functions/server.js` — `ADMIN_SDK_SECRETS` array
2. `firebase.json` — `hosting.frameworksBackend.secrets`
3. Google Cloud Secret Manager — secret names

---

## Audit: Where These Are Referenced

| File | What |
|------|------|
| `functions/server.js` | `ADMIN_SDK_SECRETS = ['SERVICE_ACCOUNT_EMAIL', 'SERVICE_ACCOUNT_PRIVATE_KEY']` |
| `firebase.json` | `hosting.frameworksBackend.secrets` |
| `src/lib/firebase/server.ts` | `process.env.SERVICE_ACCOUNT_EMAIL`, `process.env.SERVICE_ACCOUNT_PRIVATE_KEY` |
| `scripts/update-admin-secrets.ps1` | Creates/updates secrets with these names |

---

## Gcloud CLI Commands (Run in Order)

### 1. Set project

```powershell
gcloud config set project realmsrpg-test
```

### 2. Ensure Secret Manager API is enabled

```powershell
gcloud services enable secretmanager.googleapis.com --project=realmsrpg-test
```

### 3. Create secrets from your JSON (recommended: use the script)

```powershell
.\scripts\update-admin-secrets.ps1 -KeyPath "c:\Users\Kadin\Desktop\Code\RealmsRPG-Test\admin_sdk_secrets.json"
```

**Or manually via gcloud:**

```powershell
# Create SERVICE_ACCOUNT_EMAIL
echo -n "firebase-adminsdk-fbsvc@realmsrpg-test.iam.gserviceaccount.com" | gcloud secrets create SERVICE_ACCOUNT_EMAIL --replication-policy=automatic --data-file=- --project=realmsrpg-test

# Create SERVICE_ACCOUNT_PRIVATE_KEY (private key must use literal \n, not real newlines)
# Use the script or Secret Manager UI for the key — easier to avoid format errors
```

### 4. Grant Cloud Run service account permission to read secrets

The default compute service account must have `Secret Manager Secret Accessor`:

```powershell
gcloud projects add-iam-policy-binding realmsrpg-test `
  --member="serviceAccount:829555734488-compute@developer.gserviceaccount.com" `
  --role="roles/secretmanager.secretAccessor"
```

### 4b. Grant signBlob for session cookies (if seeing "Permission 'iam.serviceAccounts.signBlob' denied")

If Cloud Logging shows this error, grant the compute SA permission to sign as the Firebase Admin SA:

```powershell
gcloud iam service-accounts add-iam-policy-binding firebase-adminsdk-fbsvc@realmsrpg-test.iam.gserviceaccount.com `
  --member="serviceAccount:829555734488-compute@developer.gserviceaccount.com" `
  --role="roles/iam.serviceAccountTokenCreator" `
  --project=realmsrpg-test
```

### 5. Verify secrets exist

```powershell
gcloud secrets list --project=realmsrpg-test
```

### 6. Deploy

```powershell
firebase deploy
```

---

## Private Key Format (Critical)

The private key **must** be stored with literal `\n` (backslash + n), **not** actual newlines. The server does:

```ts
privateKey?.replace(/\\n/g, '\n')
```

So the env var value should look like:
```
-----BEGIN PRIVATE KEY-----\nMIIEvwIBADANBg...\n-----END PRIVATE KEY-----\n
```

The `update-admin-secrets.ps1` script handles this conversion automatically.

---

## After Setup

1. **Delete** `admin_sdk_secrets.json` (or move it outside the repo) — it contains the private key.
2. **Sign out and sign back in** on the deployed site.
3. **Verify** `/api/session` returns 200 in Network tab.
4. **Create a campaign** — should succeed.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Permission denied on secret | Compute SA missing Secret Accessor | Run gcloud IAM command above |
| signBlob permission denied | Compute SA cannot sign as Firebase Admin SA | Run gcloud command in section 4b above |
| Secret Version is DESTROYED | Old version was disabled/deleted | Add new version, redeploy |
| /api/session 500 | Secrets not reaching function | Verify IAM, redeploy, check Cloud Logging |
| Works locally, fails in prod | Local uses .env.local | Ensure Secret Manager + IAM correct |

---

## Cloud Logging (to see actual errors)

```
resource.type="cloud_run_revision"
resource.labels.service_name="ssrrealmsrpgtest"
severity>=ERROR
```
