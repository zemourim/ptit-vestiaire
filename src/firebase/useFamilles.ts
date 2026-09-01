import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, query, setDoc, Timestamp, updateDoc, where, writeBatch } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Famille, LienFamille } from '../types';
import { db } from './config';

export async function creerFamille(userId: string, email: string, nom: string, enfants: string[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const familleRef = doc(collection(db, 'familles'));
  const batch = writeBatch(db);
  batch.set(familleRef, {
    nom: nom.trim(), enfants: enfants.map((enfant) => enfant.trim()).filter(Boolean),
    dateCreation: Timestamp.now(), proprietaireUserId: userId
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
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const code = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  await addDoc(collection(db, 'invitations'), { code, familleId, createurUserId, dateCreation: Timestamp.now() });
  return code;
}

export async function rejoindreFamille(code: string, userId: string, email: string) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const { getDocs } = await import('firebase/firestore');
  const result = await getDocs(query(collection(db, 'invitations'), where('code', '==', code.trim().toUpperCase())));
  const invitation = result.docs[0]?.data();
  if (!invitation?.familleId) throw new Error('Code d’invitation invalide.');
  const userRef = doc(db, 'utilisateurs', userId);
  const existing = await getDoc(userRef);
  const liens = ((existing.data()?.familles ?? []) as LienFamille[]).filter((lien) => lien.familleId !== invitation.familleId);
  liens.push({ familleId: invitation.familleId, role: 'invite' });
  await setDoc(userRef, { email, familles: liens, familleIds: liens.map((lien) => lien.familleId) }, { merge: true });
  await setDoc(doc(db, 'familles', invitation.familleId, 'membres', userId), { userId, email, role: 'invite' });
}

export async function modifierEnfants(familleId: string, enfants: string[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await updateDoc(doc(db, 'familles', familleId), { enfants: enfants.map((enfant) => enfant.trim()).filter(Boolean) });
}

export function useMembresFamille(familleId: string | null) {
  const [membres, setMembres] = useState<Array<{ userId: string; email: string; role: string }>>([]);
  useEffect(() => {
    if (!db || !familleId) return;
    return onSnapshot(collection(db, 'familles', familleId, 'membres'), (snapshot) => setMembres(snapshot.docs.map((item) => item.data() as { userId: string; email: string; role: string })));
  }, [familleId]);
  return membres;
}

export async function retirerMembre(familleId: string, userId: string) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await deleteDoc(doc(db, 'familles', familleId, 'membres', userId));
  const user = await getDoc(doc(db, 'utilisateurs', userId));
  const liens = ((user.data()?.familles ?? []) as LienFamille[]).filter((lien) => lien.familleId !== familleId);
  await setDoc(doc(db, 'utilisateurs', userId), { familles: liens, familleIds: liens.map((lien) => lien.familleId) }, { merge: true });
}
