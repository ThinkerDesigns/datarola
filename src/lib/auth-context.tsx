'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as fbSignOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth as firebaseAuth, db } from '@/lib/firebase';

interface AuthState {
  user: User | null;
  loading: boolean;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
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

function setDevName(name: string): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('dr_dev_name', name);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  // Track whether Firebase auth is actually working
  const [fbReady, setFbReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    console.log('[auth-context] firebaseAuth:', !!firebaseAuth);
    console.log('[auth-context] db:', !!db);

    if (!firebaseAuth) {
      // No Firebase — fall back to localStorage dev accounts
      console.warn('[auth-context] Firebase auth unavailable, using local dev accounts');
      const name = getDevName();
      // Don't auto-login on sign-in/sign-up pages — the form must be visible.
      // Returning visitors with existing credentials can still use those forms normally.
      if (name && typeof window !== 'undefined') {
        const path = window.location.pathname;
        if (path === '/sign-in' || path === '/sign-up') return;
      }
      if (name) {
        setUser({
          uid: getDevUid(), email: '', displayName: name, emailVerified: false, isAnonymous: true,
          metadata: { creationTime: '', lastSignInTime: '' }, providerData: [], refreshToken: '',
          tenantId: null, toJSON() { return {}; }, get accessToken() { return ''; },
          getIdToken() { return Promise.resolve(''); }, getIdTokenResult() { return Promise.resolve({} as any); },
          reload() { return Promise.resolve(); }, delete() { return Promise.resolve(); },
        } as unknown as User);
      }
      setLoading(false);
      setFbReady(true);
      return;
    }

    const unsub = onAuthStateChanged(firebaseAuth, (u) => {
      console.log('[auth] user changed:', u?.displayName ?? 'null');
      setUser(u);
      setLoading(false);
    });

    return () => { if (unsub) unsub(); };
  }, []);

  // Set fbReady flag after mount so we know FB was attempted
  useEffect(() => {
    setFbReady(true);
  }, []);

  const fb = firebaseAuth;

  const signInWithEmail: AuthState['signInWithEmail'] = fb && fbReady
    ? async (email, password) => {
        console.log('[auth] signing in with email:', email);
        const cred = await signInWithEmailAndPassword(fb, email, password);
        setUser(cred.user);
        syncUser(cred.user);
      }
    : async (_email, _password) => {
        // Dev fallback: create local account
        console.log('[auth] dev mode sign-in');
        const name = getDevName() || 'Anonymous';
        if (!getDevName()) setDevName(name);
        setUser({
          uid: getDevUid(), email: _email, displayName: name, emailVerified: false, isAnonymous: true,
          metadata: { creationTime: '', lastSignInTime: '' }, providerData: [], refreshToken: '',
          tenantId: null, toJSON() { return {}; }, get accessToken() { return ''; },
          getIdToken() { return Promise.resolve(''); }, getIdTokenResult() { return Promise.resolve({} as any); },
          reload() { return Promise.resolve(); }, delete() { return Promise.resolve(); },
        } as unknown as User);
      };

  const signUpWithEmail: AuthState['signUpWithEmail'] = fb && fbReady
    ? async (email, password, name) => {
        console.log('[auth] creating account for:', email);
        const cred = await createUserWithEmailAndPassword(fb, email, password);
        if (cred.user && name) await updateProfile(cred.user, { displayName: name });
        setUser(cred.user);
        syncUser(cred.user);
      }
    : async (_email, _password, _name) => {
        // Dev fallback: create local account
        console.log('[auth] dev mode sign-up for:', _email);
        setDevName(_name || 'Anonymous');
        setUser({
          uid: getDevUid(), email: _email, displayName: _name || 'Anonymous', emailVerified: false, isAnonymous: true,
          metadata: { creationTime: '', lastSignInTime: '' }, providerData: [], refreshToken: '',
          tenantId: null, toJSON() { return {}; }, get accessToken() { return ''; },
          getIdToken() { return Promise.resolve(''); }, getIdTokenResult() { return Promise.resolve({} as any); },
          reload() { return Promise.resolve(); }, delete() { return Promise.resolve(); },
        } as unknown as User);
      };

  const signOut: AuthState['signOut'] = fb && fbReady
    ? () => fbSignOut(fb)
    : async () => {
        console.log('[auth] dev mode sign-out — clearing local data');
        setUser(null);
        setLoading(false);
        if (typeof window !== 'undefined') {
          localStorage.removeItem('dr_dev_uid');
          localStorage.removeItem('dr_dev_name');
          localStorage.removeItem('dr_plan');
          localStorage.removeItem('dr_connections');
          window.location.replace('/');
        }
      };

  return (
    <Ctx.Provider value={{ user, loading, signInWithEmail, signUpWithEmail, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
