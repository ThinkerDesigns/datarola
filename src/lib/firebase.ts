// ponytail: minimal Firebase init — auth (email/password + Google) + Firestore only.
// db is initialized for BOTH browser and server contexts (needed for server actions).
// Auth/persistence remains browser-only since it needs localStorage/window.

import { initializeApp, getApps } from 'firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const env = (typeof process !== 'undefined' && process.env)
  ? process.env
  : typeof globalThis !== 'undefined' && (globalThis as any).process?.env
    ? (globalThis as any).process.env
    : {};

const keys: Record<string, string | undefined> = env as unknown as Record<string, string | undefined>;

function getEnv(key: string): string {
  const val = keys[key];
  return typeof val === 'string' ? val : '';
}

const firebaseConfig: Record<string, string> = {
  apiKey: getEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  authDomain: getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
};

const hasAllKeys = Object.values(firebaseConfig).every((v) => v.length > 0);

// ponytail: runtime diagnostic — logs to help debug Firebase init in dev
if (typeof window !== 'undefined') {
  console.log('[firebase]', {
    hasProcess: typeof process !== 'undefined',
    configKeys: Object.keys(firebaseConfig),
    allPresent: hasAllKeys,
    missing: Object.entries(firebaseConfig).filter(([, v]) => !v).map(([k]) => k),
  });
}

// Browser-only flag: affects where auth/persistence is set (not db init)
export const isBrowser = typeof window !== 'undefined';

let appInstance: ReturnType<typeof initializeApp> | null = null;
if (hasAllKeys && getApps().length === 0) {
  try {
    appInstance = initializeApp(firebaseConfig);
  } catch (e: unknown) {
    if (typeof window !== 'undefined') {
      console.error('[firebase] initializeApp failed:', e instanceof Error ? e.message : e);
    }
    appInstance = null;
  }
} else if (getApps().length > 0) {
  appInstance = getApps()[0] ?? null;
}

// Initialize Firestore for BOTH server and client — server actions need it.
export let db: ReturnType<typeof getFirestore> | null = null;
if (appInstance) {
  try {
    db = getFirestore(appInstance);
  } catch {
    db = null;
  }
}

// Auth is browser-only. CRITICAL: Clear ALL persistence tokens BEFORE setting session-only mode.
// Previous auth might have used browserLocalPersistence which stores tokens in IndexedDB —
// setPersistence doesn't remove existing tokens, it only sets the policy for future ones.
export let auth: ReturnType<typeof getAuth> | null = null;
if (isBrowser && appInstance) {
  try {
    const rawAuth = getAuth(appInstance);

    // Force a sign-out first to clear any in-memory state.
    // This ensures the session is completely reset before we set new persistence.
    if (typeof window !== 'undefined') {
      // Remove all Firebase auth tokens from localStorage
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('firebase:authUser:')) {
          localStorage.removeItem(key);
        }
      }
    }

    // Clear any stored auth state from IndexedDB.
    try {
      const indexedDBKey = `firebaseLocalStorageDb`;
      const request = indexedDB.deleteDatabase(indexedDBKey);
      request.onsuccess = () => {};
      request.onerror = () => {};
    } catch {
      // Ignore errors — the DB might not exist or be accessible
    }

    // Now set session-only persistence for future auth operations.
    setPersistence(rawAuth, browserSessionPersistence).catch(() => {});
    auth = rawAuth;
  } catch {
    auth = null;
  }
}
