import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Fille, NouvelleSortieData, Sortie } from '../types';
import { db } from './config';

type SortieFilters = {
  fille?: Fille | 'Toutes';
  onlySorties?: boolean;
};

export function useSorties(filters: SortieFilters = {}) {
  const [sorties, setSorties] = useState<Sortie[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase n’est pas configuré.');
      setLoading(false);
      return;
    }

    const constraints: QueryConstraint[] = [];
    if (filters.fille && filters.fille !== 'Toutes') constraints.push(where('fille', '==', filters.fille));
    if (filters.onlySorties) constraints.push(where('statut', '==', 'sorti'));
    constraints.push(orderBy('date', filters.onlySorties ? 'asc' : 'desc'));

    const sortiesQuery = query(collection(db, 'sorties'), ...constraints);
    const unsubscribe = onSnapshot(
      sortiesQuery,
      (snapshot) => {
        setSorties(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Sortie));
        setLoading(false);
        setError(null);
      },
      (caught) => {
        setError(caught.message || 'Impossible de charger les sorties.');
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [filters.fille, filters.onlySorties]);

  return { sorties, loading, error };
}

export async function createSortie(data: NouvelleSortieData) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await addDoc(collection(db, 'sorties'), {
    ...data,
    date: serverTimestamp(),
    statut: 'sorti',
    dateRetour: null
  });
}

export async function markSortieReturned(sortieId: string) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await updateDoc(doc(db, 'sorties', sortieId), {
    statut: 'revenu',
    dateRetour: Timestamp.now()
  });
}

export async function markManyReturned(sortieIds: string[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const firestore = db;
  const batch = writeBatch(firestore);
  sortieIds.forEach((sortieId) => {
    batch.update(doc(firestore, 'sorties', sortieId), {
      statut: 'revenu',
      dateRetour: Timestamp.now()
    });
  });
  await batch.commit();
}
