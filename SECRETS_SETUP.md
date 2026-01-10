# Google Cloud Secrets Setup

This guide explains how to configure Google Cloud Secrets for Firebase configuration, matching the vanilla site's approach.

## How It Works

The Next.js app uses the same Google Cloud Secret Manager approach as the vanilla site:

1. **Secrets are stored in Google Cloud Secret Manager** (not in environment variables)
2. **Firebase Hosting automatically injects them** via the `/__/firebase/init.json` endpoint
3. **The app fetches config at runtime** from this endpoint
4. **For local dev**, the app falls back to `.env.local` values

## Production Setup (Using Google Cloud Secrets)

### 1. Set Up Secrets in Google Cloud Secret Manager

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

### 2. Deploy to Firebase Hosting

When you deploy to Firebase Hosting, the platform automatically:
- Reads secrets from Google Cloud Secret Manager
- Generates the `/__/firebase/init.json` endpoint
- Injects your Firebase configuration

```bash
firebase deploy --only hosting
```

### 3. The App Fetches Config Automatically

On page load, the Next.js app:
1. Tries to fetch `/__/firebase/init.json` (production)
2. Falls back to `.env.local` values (local development)
3. Initializes Firebase with the fetched config

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
