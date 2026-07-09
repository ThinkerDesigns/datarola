// ponytail: minimal Firebase init — auth (email/password + Google) + Firestore only
import { initializeApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const keys = process.env as unknown as Record<string, string | undefined>;

const firebaseConfig: Record<string, string> = {};
for (const key of [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
]) {
  firebaseConfig[key.replace('NEXT_PUBLIC_', '')] = keys[key] ?? '';
}

const hasAllKeys = Object.values(firebaseConfig).every((v) => v.length > 0);

export const app = hasAllKeys && getApps().length === 0
  ? initializeApp(firebaseConfig)
  : (getApps()[0] ?? null);

export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

if (auth) {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

