// ponytail: minimal Firebase init — auth (email/password + Google) + Firestore only.
// Must only run in the browser — SSR has no localStorage/window.

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
// Guard: only init in browser where localStorage/window exist
const isBrowser = typeof window !== 'undefined';

export const app = hasAllKeys && isBrowser && getApps().length === 0
  ? initializeApp(firebaseConfig)
  : (getApps()[0] ?? null);

export let auth: ReturnType<typeof getAuth> | null = null;
export let db: ReturnType<typeof getFirestore> | null = null;

if (isBrowser && app) {
  try {
    auth = getAuth(app);
    db = getFirestore(app);
    setPersistence(auth, browserLocalPersistence).catch(() => {});
  } catch {
    // If Firebase init fails (bad API key, network issue), fall back to mock auth
    auth = null;
    db = null;
  }
}
