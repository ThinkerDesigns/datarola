'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  signInWithPopup,
  getRedirectResult,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
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

  // Browser-only: set up auth listener once on mount.
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!firebaseAuth) return;

    // Consume any pending redirect result FIRST (Google OAuth callback).
    getRedirectResult(firebaseAuth)
      .then((result) => {
        if (result && result.user) {
          console.log('[auth] redirect consumed:', result.user.displayName ?? 'no name');
        }
      })
      .catch(() => {});

    // Then listen for auth state changes.
    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      console.log('[auth] user changed:', u?.displayName ?? 'null');
      setUser(u);
      setLoading(false);
    });

    return () => { if (unsub) unsub(); };
  }, []);

  // Capture for TS narrowing.
  const fb = firebaseAuth;

  const signInWithGoogle: AuthState['signInWithGoogle'] = fb
    ? async () => {
        console.log('[auth] signing in with Google...');
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(fb, provider);
        console.log('[auth] Google login complete:', cred.user.displayName ?? 'no name');
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
