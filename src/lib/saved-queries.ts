'use server';

// Saved queries — store user's useful queries for later reference.
import { db } from '@/lib/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, where, getDoc } from 'firebase/firestore';

export interface SavedQuery {
  id: string;
  uid: string;
  question: string;
  sql?: string;
  columns: string[];
  rowCount: number;
  savedAt: number;
}

export async function saveQuery(uid: string, params: { question: string; sql?: string; columns: string[]; rowCount: number }): Promise<SavedQuery> {
  if (!db) throw new Error('Firebase not configured');
  const docRef = await addDoc(collection(db, 'users', uid, 'savedQueries'), {
    ...params,
    uid,
    savedAt: Date.now(),
  });
  const savedQuery: SavedQuery = { id: docRef.id, question: params.question, sql: params.sql, columns: params.columns, rowCount: params.rowCount, savedAt: Date.now(), uid };
  return savedQuery;
}

export async function listSavedQueries(uid: string): Promise<SavedQuery[]> {
  if (!db) return [];
  const snap = await getDocs(query(collection(db, 'users', uid, 'savedQueries'), orderBy('savedAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as SavedQuery));
}

export async function deleteSavedQuery(uid: string, qId: string) {
  if (!db) return;
  // Verify ownership
  const ref = doc(db, 'users', uid, 'savedQueries', qId);
  const snap = await getDoc(ref);
  if (!snap.exists() || (snap.data() as any).uid !== uid) return;
  await deleteDoc(ref);
}
