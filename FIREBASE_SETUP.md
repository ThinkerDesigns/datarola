# Firebase Setup (Required for CSV Upload, AI Queries, Data Sources)

All writes to Firestore are currently failing with **PERMISSION_DENIED**. This requires two setup steps:

## Step 1: Enable Firestore Test Mode (30 seconds)

1. Go to [Firebase Console](https://console.firebase.google.com/project/ddsdatarola/firestore)
2. Click the **Rules** tab under "Firestore Database"
3. Replace all rules with:
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
4. Click **Publish**

This allows all reads/writes for now (you'll tighten rules later when you add proper auth).

## Step 2: Add Admin SDK Service Account (for server-side writes)

1. Go to [Project Settings](https://console.firebase.google.com/project/ddsdatarola/settings/general/)
2. Scroll down to **Your apps** → click **Admin SDK** section
3. Click **"Generate private key"** → downloads a JSON file
4. Copy the `project_id`, `client_email`, and `private_key` values
5. Add these to your `.env.local`:

```
FIREBASE_PROJECT_ID=ddsdatarola
FIREBASE_CLIENT_EMAIL=your-service-account@ddsdatarola.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

6. Restart the dev server: `kill $(pgrep -f next) && npm run dev`

After step 1, CSV uploads and AI queries will start working immediately. Step 2 makes them work with real security.
