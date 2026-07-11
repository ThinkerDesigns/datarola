'use client';

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  setPersistence,
  browserSessionPersistence,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({} as AuthState);

export function useAuth() { return useContext(Ctx); }

function syncUser(user: User): void {
  if (!db) return;
  setDoc(doc(db, 'users', user.uid), {
    email: user.email ?? '',
    displayName: user.displayName ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    plan: 'free',
    sourcesUsed: 0,
  }, { merge: true }).catch(() => {});
}

function getDevUid(): string {
  if (typeof localStorage === 'undefined') return `dev-${Date.now()}`;
  let uid = localStorage.getItem('dr_dev_uid');
  if (!uid) {
    uid = crypto.randomUUID ? crypto.randomUUID() : `dev-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem('dr_dev_uid', uid);
  }
  return uid;
}

function getDevName(): string {
  if (typeof localStorage === 'undefined') return '';
  return localStorage.getItem('dr_dev_name') ?? '';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const didInitRef = useRef(false);

  // Initialize: set persistence and listen for auth changes. Never sign out during mount.
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    // Use session-only persistence to prevent stored tokens from auto-restoring.
    if (firebaseAuth) {
      setPersistence(firebaseAuth, browserSessionPersistence).catch(() => {});
    }

    // Set up auth listener last — it only fires on actual state changes now.
    if (firebaseAuth) {
      return onAuthStateChanged(firebaseAuth, (u) => {
        console.log('[auth] user changed:', u?.displayName ?? 'null');
        setUser(u);
        setLoading(false);
      });
    }

    // Dev fallback — no Firebase configured. Identity from localStorage only.
    const uid = getDevUid();
    const name = getDevName() || 'Anonymous';
    setUser({
      uid, email: 'user@localhost', displayName: name, emailVerified: false, isAnonymous: true,
      metadata: { creationTime: '', lastSignInTime: '' }, providerData: [], refreshToken: '',
      tenantId: null, toJSON() { return {}; }, get accessToken() { return ''; },
      getIdToken() { return Promise.resolve(''); }, getIdTokenResult() { return Promise.resolve({} as any); },
      reload() { return Promise.resolve(); }, delete() { return Promise.resolve(); },
    } as unknown as User);
    setLoading(false);
  }, []);

  // Capture for TS narrowing — the ternary doesn't narrow module-level exports.
  const fb = firebaseAuth;

  const signInWithGoogle: AuthState['signInWithGoogle'] = fb
    ? async () => {
        console.log('[auth] signing in with Google...');
        await setPersistence(fb, browserSessionPersistence);
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(fb, provider);
        console.log('[auth] Google login complete:', cred.user.displayName ?? 'no display name');
        setUser(cred.user);
        syncUser(cred.user);
      }
    : (async () => {
        let name = getDevName();
        if (!name) { name = 'Anonymous'; setDevName(name); }
        const uid = getDevUid();
        console.log('[auth] dev mode sign-in:', name);
        setUser({
          uid, email: 'user@localhost', displayName: name, emailVerified: false, isAnonymous: true,
          metadata: { creationTime: '', lastSignInTime: '' }, providerData: [], refreshToken: '',
          tenantId: null, toJSON() { return {}; }, get accessToken() { return ''; },
          getIdToken() { return Promise.resolve(''); }, getIdTokenResult() { return Promise.resolve({} as any); },
          reload() { return Promise.resolve(); }, delete() { return Promise.resolve(); },
        } as unknown as User);
      }) as AuthState['signInWithGoogle'];

  const signOut: AuthState['signOut'] = fb
    ? () => fbSignOut(fb)
    : async () => {
        setUser(null);
        setLoading(false);
      };

  return (
    <Ctx.Provider value={{
      user,
      loading,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}

function setDevName(name: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dr_dev_name', name);
  }
}
