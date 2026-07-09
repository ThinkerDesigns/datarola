'use client';

import { useState, useEffect } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { DataSource } from '@/lib/schema';

// ponytail: subscribe to user's data sources in real-time via Firestore listener.
export function useDataSources(uid: string | null): DataSource[] {
  const [sources, setSources] = useState<DataSource[]>([]);

  useEffect(() => {
    if (!uid || !db) return;
    const unsub = onSnapshot(collection(db, 'users', uid, 'dataSources'), (snap) => {
      setSources(snap.docs.map((d) => ({ id: d.id, ...d.data() } as DataSource)));
    });
    return unsub;
  }, [uid]);

  return sources;
}
