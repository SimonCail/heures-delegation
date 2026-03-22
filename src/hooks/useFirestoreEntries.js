import { useEffect, useRef, useState } from 'react';
import {
  collection,
  onSnapshot,
  writeBatch,
  doc,
} from 'firebase/firestore';
import { db } from '../firebase';

export function useFirestoreEntries(userId) {
  const [entries, setEntriesLocal] = useState([]);
  const [loading, setLoading] = useState(true);
  const entriesRef = useRef([]);

  const entriesCol = collection(db, 'users', userId, 'entries');

  useEffect(() => {
    const unsub = onSnapshot(entriesCol, (snapshot) => {
      const data = snapshot.docs.map((d) => ({ ...d.data(), id: d.id }));
      entriesRef.current = data;
      setEntriesLocal(data);
      setLoading(false);
    });
    return unsub;
  }, [userId]);

  // Migrate localStorage data on first load
  useEffect(() => {
    if (loading) return;
    const stored = localStorage.getItem('delegation-entries');
    if (!stored) return;
    try {
      const localEntries = JSON.parse(stored);
      if (!Array.isArray(localEntries) || localEntries.length === 0) return;
      if (entriesRef.current.length > 0) return; // Firestore already has data

      const batch = writeBatch(db);
      for (const entry of localEntries) {
        batch.set(doc(entriesCol, entry.id), entry);
      }
      batch.commit().then(() => {
        localStorage.removeItem('delegation-entries');
      });
    } catch {
      // ignore parse errors
    }
  }, [loading, userId]);

  const setEntries = (newEntriesOrFn) => {
    const newEntries =
      typeof newEntriesOrFn === 'function'
        ? newEntriesOrFn(entriesRef.current)
        : newEntriesOrFn;

    const prev = entriesRef.current;
    const prevMap = new Map(prev.map((e) => [e.id, e]));
    const newMap = new Map(newEntries.map((e) => [e.id, e]));

    // Split into batches of 500 (Firestore limit)
    const ops = [];

    for (const [id, entry] of newMap) {
      if (!prevMap.has(id)) {
        ops.push({ type: 'set', id, data: entry });
      } else if (JSON.stringify(prevMap.get(id)) !== JSON.stringify(entry)) {
        ops.push({ type: 'set', id, data: entry });
      }
    }
    for (const id of prevMap.keys()) {
      if (!newMap.has(id)) {
        ops.push({ type: 'delete', id });
      }
    }

    if (ops.length === 0) return;

    const BATCH_SIZE = 500;
    for (let i = 0; i < ops.length; i += BATCH_SIZE) {
      const chunk = ops.slice(i, i + BATCH_SIZE);
      const batch = writeBatch(db);
      for (const op of chunk) {
        const ref = doc(entriesCol, op.id);
        if (op.type === 'set') batch.set(ref, op.data);
        else batch.delete(ref);
      }
      batch.commit();
    }
  };

  return [entries, setEntries, loading];
}
