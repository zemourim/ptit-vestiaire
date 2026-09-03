import { collection, doc, getDoc, onSnapshot, Timestamp, updateDoc, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Famille, LienFamille } from '../types';
import { db } from './config';
import { appelerFonction } from './useSubscription';

export async function creerFamille(userId: string, email: string, nom: string, enfants: string[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const familleRef = doc(collection(db, 'familles'));
  const batch = writeBatch(db);
  batch.set(familleRef, {
    nom: nom.trim(), enfants: enfants.map((enfant) => enfant.trim()).filter(Boolean),
    dateCreation: Timestamp.now(), proprietaireUserId: userId,
    plan: 'gratuit', stripeCustomerId: null, stripeSubscriptionId: null,
    frequencePaiement: null, dateDebutAbonnement: null, dateProchainRenouvellement: null,
    nombreRappelsEnvoyes: 0, statutAbonnement: null, nombreVetements: 0,
    echecPaiementLe: null
  });
  const lien: LienFamille = { familleId: familleRef.id, role: 'proprietaire' };
  batch.set(doc(db, 'utilisateurs', userId), { email, familles: [lien], familleIds: [familleRef.id] }, { merge: true });
  batch.set(doc(db, 'familles', familleRef.id, 'membres', userId), { userId, email, role: 'proprietaire' });
  await batch.commit();
  return familleRef.id;
}

export async function lireFamille(familleId: string): Promise<Famille | null> {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const snapshot = await getDoc(doc(db, 'familles', familleId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Famille) : null;
}

export function useFamille(familleId: string | null) {
  const [famille, setFamille] = useState<Famille | null>(null);
  const [loading, setLoading] = useState(Boolean(familleId));
  useEffect(() => {
    if (!db || !familleId) { setFamille(null); setLoading(false); return; }
    return onSnapshot(doc(db, 'familles', familleId), (snapshot) => {
      setFamille(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Famille) : null);
      setLoading(false);
    });
  }, [familleId]);
  return { famille, loading };
}

export function useFamillesUtilisateur(userId: string | null) {
  const [liens, setLiens] = useState<LienFamille[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  useEffect(() => {
    if (!db || !userId) { setLiens([]); setLoading(false); return; }
    return onSnapshot(doc(db, 'utilisateurs', userId), (snapshot) => {
      setLiens((snapshot.data()?.familles ?? []) as LienFamille[]);
      setLoading(false);
    }, () => setLoading(false));
  }, [userId]);
  return { liens, loading };
}

export async function creerInvitation(familleId: string, createurUserId: string) {
  const result = await appelerFonction<{ familleId: string; createurUserId: string }, { code: string }>('creerInvitation', { familleId, createurUserId });
  return result.code;
}

export async function rejoindreFamille(code: string, userId: string, email: string) {
  await appelerFonction('rejoindreFamille', { code: code.trim().toUpperCase(), userId, email });
}

export async function modifierEnfants(familleId: string, enfants: string[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await updateDoc(doc(db, 'familles', familleId), { enfants: enfants.map((enfant) => enfant.trim()).filter(Boolean) });
}

export function useMembresFamille(familleId: string | null) {
  const [membres, setMembres] = useState<Array<{ userId: string; email: string; role: string; bloqueParPlan?: boolean }>>([]);
  useEffect(() => {
    if (!db || !familleId) return;
    return onSnapshot(collection(db, 'familles', familleId, 'membres'), (snapshot) => setMembres(snapshot.docs.map((item) => item.data() as { userId: string; email: string; role: string; bloqueParPlan?: boolean })));
  }, [familleId]);
  return membres;
}

export async function retirerMembre(familleId: string, userId: string) {
  await appelerFonction('retirerMembre', { familleId, userId });
}
