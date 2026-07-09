'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

// ponytail: if Firebase is not configured yet, fall back to mock auth for development
const IS_CONFIGURED = !!auth;

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<UserCredential>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({} as AuthState);

export function useAuth() { return useContext(Ctx); }

function syncUser(user: User): void {
  if (!IS_CONFIGURED || !db) return; // skip in dev without config
  setDoc(doc(db, 'users', user.uid), {
    email: user.email ?? '',
    displayName: user.displayName ?? null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    plan: 'free',
    sourcesUsed: 0,
  }, { merge: true }).catch(() => {});
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      // Dev fallback: when Firebase isn't configured, pretend we signed in as alice@company.com
      setUser({
        uid: 'dev-user-001',
        email: 'alice@company.com',
        displayName: 'Alice Chen',
        emailVerified: true,
        isAnonymous: false,
        metadata: { creationTime: '', lastSignInTime: '' },
        providerData: [],
        refreshToken: '',
        tenantId: null,
        toJSON() { return {}; },
        get accessToken() { return ''; },
        getIdToken() { return Promise.resolve(''); },
        getIdTokenResult() { return Promise.resolve({} as any); },
        reload() { return Promise.resolve(); },
        delete() { return Promise.resolve(); },
      } as unknown as User);
      setLoading(false);
      return () => {};
    }
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) syncUser(u);
      setLoading(false);
    });
  }, []);

  // When Firebase isn't configured (dev without .env), use a stub that pretends auth works
  const stub = async (_: unknown) => ({ user: null } as any);

  const signIn: AuthState['signIn'] = IS_CONFIGURED
    ? (email, password) => signInWithEmailAndPassword(auth!, email, password)
    : stub as AuthState['signIn'];

  const signUp: AuthState['signUp'] = IS_CONFIGURED
    ? async (email, password) => {
        const cred = await createUserWithEmailAndPassword(auth!, email, password);
        syncUser(cred.user);
      }
    : stub as AuthState['signUp'];

  const signInWithGoogle: AuthState['signInWithGoogle'] = IS_CONFIGURED
    ? async () => {
        const provider = new GoogleAuthProvider();
        const cred = await signInWithPopup(auth!, provider);
        syncUser(cred.user);
      }
    : stub as AuthState['signInWithGoogle'];

  const signOut: AuthState['signOut'] = IS_CONFIGURED
    ? () => fbSignOut(auth!)
    : stub as AuthState['signOut'];

  return (
    <Ctx.Provider value={{
      user,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
    }}>
      {children}
    </Ctx.Provider>
  );
}
