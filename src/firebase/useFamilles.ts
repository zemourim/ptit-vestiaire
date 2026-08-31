import { addDoc, collection, doc, getDoc, Timestamp, updateDoc } from 'firebase/firestore';
import type { Famille, LienFamille } from '../types';
import { db } from './config';

export async function creerFamille(userId: string, email: string, nom: string, enfants: string[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const familleRef = await addDoc(collection(db, 'familles'), {
    nom: nom.trim(), enfants: enfants.map((enfant) => enfant.trim()).filter(Boolean),
    dateCreation: Timestamp.now(), proprietaireUserId: userId
  });
  const lien: LienFamille = { familleId: familleRef.id, role: 'proprietaire' };
  await updateDoc(doc(db, 'utilisateurs', userId), { email, familles: [lien], familleIds: [familleRef.id] });
  return familleRef.id;
}

export async function lireFamille(familleId: string): Promise<Famille | null> {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const snapshot = await getDoc(doc(db, 'familles', familleId));
  return snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Famille) : null;
}
