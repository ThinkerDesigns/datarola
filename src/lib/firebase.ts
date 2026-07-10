// ponytail: minimal Firebase init — auth (email/password + Google) + Firestore only.
// db is initialized for BOTH browser and server contexts (needed for server actions).
// Auth/persistence remains browser-only since it needs localStorage/window.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (typeof process !== 'undefined' && process.env)
  ? process.env
  : typeof globalThis !== 'undefined' && (globalThis as any).process?.env
    ? (globalThis as any).process.env
    : {};

const keys: Record<string, string | undefined> = env as unknown as Record<string, string | undefined>;

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

// Browser-only flag: affects where auth/persistence is set (not db init)
export const isBrowser = typeof window !== 'undefined';

export const app = hasAllKeys && getApps().length === 0
  ? initializeApp(firebaseConfig)
  : (getApps()[0] ?? null);

// Initialize Firestore for BOTH server and client — server actions need it.
export let db: ReturnType<typeof getFirestore> | null = null;
if (app) {
  try {
    db = getFirestore(app);
  } catch {
    // If Firestore init fails, fall back to mock operations
    db = null;
  }
}

// Auth is browser-only — needs localStorage/window for persistence
export let auth: ReturnType<typeof getAuth> | null = null;
if (isBrowser && app) {
  try {
    auth = getAuth(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  } catch {
    auth = null;
  }
}
