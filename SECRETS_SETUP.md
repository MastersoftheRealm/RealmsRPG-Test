# Google Cloud Secrets Setup

This guide explains how to configure Google Cloud Secrets for Firebase configuration and service account credentials.

## How It Works

The Next.js app uses Google Cloud Secret Manager for sensitive credentials:

1. **Secrets are stored in Google Cloud Secret Manager** (not in environment variables)
2. **Firebase Hosting automatically injects client config** via the `/__/firebase/init.json` endpoint
3. **Service account credentials are injected** as environment variables in the Cloud Function backend
4. **For local dev**, the app falls back to `.env.local` values

## Production Setup (Using Google Cloud Secrets)

### 1. Client-Side Firebase Configuration

The vanilla site already has these secrets configured. The Next.js app uses the same ones:

- `API_KEY`
- `APP_ID`
- `AUTH_DOMAIN`
- `DATABASE_URL`
- `MEASUREMENT_ID`
- `MESSAGING_SENDER_ID`
- `PROJECT_ID`
- `STORAGE_BUCKET`
- `RECAPTCHA_SECRET_KEY`
- `RECAPTCHA_SITE_KEY`

### 2. Service Account Credentials (for Server-Side Features)

For server-side session management and Admin SDK features, the following secrets are configured:

- `SERVICE_ACCOUNT_EMAIL` - The service account email address
- `SERVICE_ACCOUNT_PRIVATE_KEY` - The service account private key

**Note:** Cannot use `FIREBASE_` prefix as it's reserved by Firebase.

These are automatically injected as environment variables when deployed to Firebase Hosting.

#### Creating/Updating Service Account Secrets

```bash
# Set the service account email
echo "your-service-account@project.iam.gserviceaccount.com" | firebase functions:secrets:set SERVICE_ACCOUNT_EMAIL --project your-project --data-file -

# Set the private key (create temp file first)
firebase functions:secrets:set SERVICE_ACCOUNT_PRIVATE_KEY --project your-project --data-file private-key.txt
```

### 3. Configure firebase.json

The `firebase.json` file must list the secrets in the `frameworksBackend.secrets` array:

```json
{
  "hosting": {
    "frameworksBackend": {
      "region": "us-central1",
      "secrets": [
        "SERVICE_ACCOUNT_EMAIL",
        "SERVICE_ACCOUNT_PRIVATE_KEY"
      ]
    }
  }
}
```

### 4. Deploy to Firebase Hosting

When you deploy to Firebase Hosting, the platform automatically:
- Reads secrets from Google Cloud Secret Manager
- Generates the `/__/firebase/init.json` endpoint for client config
- Injects service account credentials as environment variables in the backend
- Grants necessary IAM permissions

```bash
firebase deploy --only hosting
```

### 5. The App Uses Credentials Automatically

On the server-side:
- Service account credentials are loaded from environment variables
- Used for Firebase Admin SDK operations (session cookies, etc.)
- Falls back to Application Default Credentials if not configured

On the client-side:
- Fetches `/__/firebase/init.json` (production)
- Falls back to `.env.local` values (local development)

## Local Development Setup

For local development (when not using Firebase Hosting):

1. Copy the example environment file:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in your Firebase configuration from the Firebase Console:
   - Go to Firebase Console > Project Settings > General
   - Scroll to "Your apps" section
   - Copy the configuration values

3. The app will use these local values when `/__/firebase/init.json` is not available.

## Verification

After deploying, verify the config endpoint works:

```bash
# Visit this URL in your browser (replace with your domain):
https://your-domain.web.app/__/firebase/init.json

# Should return your Firebase configuration JSON
```

## Security Notes

- ✅ Firebase configuration values (API keys, project IDs, etc.) are **safe to expose client-side**
- ✅ They identify your Firebase project but don't grant access without authentication
- ✅ Security comes from Firebase Security Rules, not from hiding config
- ⚠️ Never commit `.env.local` to version control (already in `.gitignore`)
- ⚠️ RECAPTCHA_SECRET_KEY and admin credentials should remain server-side only (Cloud Functions)

## Migration from Vanilla Site

The Next.js app is designed to work seamlessly with your existing Google Cloud Secrets setup:

- ✅ Uses the same secrets already configured for the vanilla site
- ✅ No additional secret configuration needed
- ✅ Same deployment process
- ✅ Compatible with existing Firebase project

Simply deploy the Next.js app and it will use the existing secrets automatically.
