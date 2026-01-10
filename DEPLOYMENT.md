# Firebase Deployment Guide

This guide explains how to deploy the Realms RPG Next.js application to Firebase.

## Prerequisites

1. [Firebase CLI](https://firebase.google.com/docs/cli) installed and logged in
2. Node.js 20+ installed
3. Firebase project created with:
   - Firestore database
   - Realtime Database
   - Authentication (Email/Password enabled)
   - Storage
   - Cloud Functions

## Quick Start Deployment

```bash
# 1. Install dependencies
npm install
cd functions && npm install && cd ..

# 2. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Firebase config

# 3. Build the application
npm run build

# 4. Deploy everything to Firebase
firebase deploy

# Or deploy specific components:
firebase deploy --only hosting
firebase deploy --only functions
firebase deploy --only firestore:rules
firebase deploy --only database:rules
firebase deploy --only storage:rules
```

## Environment Configuration

### Firebase Configuration with Google Cloud Secrets

This application uses **Google Cloud Secret Manager** for Firebase configuration, matching the vanilla site's approach. When deployed to Firebase Hosting, the configuration is automatically injected via the `/__/firebase/init.json` endpoint.

**For Production (Firebase Hosting)**:
- No environment variables needed! Firebase Hosting automatically injects your config.
- The app fetches config from `/__/firebase/init.json` at runtime.
- Configure secrets in Google Cloud Secret Manager (same as vanilla site).

**For Local Development**:

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Fill in the Firebase configuration values from your Firebase Console > Project Settings > General > Your apps > Web app.

3. The app will use `.env.local` values when `/__/firebase/init.json` is not available (local dev).

### Production Deployment

Firebase App Hosting automatically injects environment variables. Set them via:

```bash
# Set each secret
firebase apphosting:secrets:set FIREBASE_ADMIN_PRIVATE_KEY

# Or use the Firebase Console
# Go to: App Hosting > Your Backend > Secrets & Environment Variables
```

Required environment variables for production:

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth Domain |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase Project ID |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Storage Bucket |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Messaging Sender ID |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase App ID |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL` | Yes | Realtime Database URL |
| `FIREBASE_ADMIN_PRIVATE_KEY` | Server only | Admin SDK private key (set as secret) |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | Server only | Admin SDK client email |

## Deployment Methods

### Enable Next.js Support (First Time Only)

Firebase needs the webframeworks experiment enabled for Next.js SSR support:

```bash
firebase experiments:enable webframeworks
```

### Option 1: Firebase App Hosting (Recommended for Next.js SSR)

Firebase App Hosting provides first-class support for Next.js with SSR, API routes, and middleware.

1. **Initialize App Hosting** (if not already done):
   ```bash
   firebase init apphosting
   ```

2. **Deploy**:
   ```bash
   firebase apphosting:backends:create --project YOUR_PROJECT_ID
   ```
   Or connect to GitHub for automatic deployments.

3. **Configuration** (`firebase.json`):
   ```json
   {
     "hosting": {
       "source": ".",
       "frameworksBackend": {
         "region": "us-central1"
       }
     }
   }
   ```

### Option 2: Firebase Hosting with Cloud Functions

For more control over the deployment process:

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   ```bash
   firebase deploy --only hosting,functions
   ```

### Option 3: Static Export (No SSR)

If you don't need SSR or API routes:

1. **Configure Next.js for static export** (`next.config.ts`):
   ```typescript
   const nextConfig = {
     output: 'export',
   };
   ```

2. **Build and export**:
   ```bash
   npm run build
   ```

3. **Deploy to Firebase Hosting**:
   ```bash
   firebase deploy --only hosting
   ```

## Security Rules

Ensure your Firebase security rules are properly configured before deployment.

### Firestore Rules (`firestore.rules`)
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // User's library collections
      match /{collection}/{docId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
    
    // Characters
    match /characters/{charId} {
      allow read: if request.auth != null && resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && request.resource.data.userId == request.auth.uid;
      allow update, delete: if request.auth != null && resource.data.userId == request.auth.uid;
    }
  }
}
```

### Realtime Database Rules (`database.rules.json`)
```json
{
  "rules": {
    "feats": { ".read": true },
    "skills": { ".read": true },
    "species": { ".read": true },
    "traits": { ".read": true },
    "powers": { ".read": true },
    "techniques": { ".read": true },
    "equipment": { ".read": true },
    "properties": { ".read": true }
  }
}
```

### Storage Rules (`storage.rules`)
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Deployment Checklist

Before deploying to production:

- [ ] All environment variables are set
- [ ] Firebase security rules are deployed
- [ ] Firestore indexes are deployed
- [ ] Authentication methods are enabled
- [ ] Custom domain is configured (optional)
- [ ] Error monitoring is set up (optional)

## Commands Reference

```bash
# Build the application
npm run build

# Deploy everything
firebase deploy

# Deploy only hosting
firebase deploy --only hosting

# Deploy only rules
firebase deploy --only firestore:rules,database:rules,storage:rules

# Deploy only indexes
firebase deploy --only firestore:indexes

# View deployment status
firebase hosting:channel:list

# Create a preview channel
firebase hosting:channel:deploy preview --expires 7d
```

## Troubleshooting

### Build fails with "Cannot find module"
- Run `npm install` to ensure all dependencies are installed
- Clear Next.js cache: `rm -rf .next`

### Firebase SDK not initializing
- Verify all `NEXT_PUBLIC_*` environment variables are set
- Check that the Firebase config matches your project

### 404 errors on dynamic routes
- Ensure App Hosting is configured (not static hosting)
- Check `next.config.ts` doesn't have `output: 'export'`

### CORS errors
- Configure CORS on Cloud Functions
- Ensure API routes use proper headers

## Related Resources

- [Firebase App Hosting Documentation](https://firebase.google.com/docs/app-hosting)
- [Next.js on Firebase](https://firebase.google.com/docs/hosting/frameworks/nextjs)
- [Firebase Security Rules](https://firebase.google.com/docs/rules)
