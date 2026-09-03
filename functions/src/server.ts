import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { HttpsError, type CallableRequest } from 'firebase-functions/v2/https';
import { setGlobalOptions } from 'firebase-functions/v2/options';

if (getApps().length === 0) initializeApp();
setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });
export const db = getFirestore();

export async function requireMember(request: CallableRequest<unknown>, familleId: string) {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Connecte-toi pour continuer.');
  if (request.auth.token.email_verified !== true) throw new HttpsError('permission-denied', 'Valide ton adresse e-mail.');
  const member = await db.doc(`familles/${familleId}/membres/${request.auth.uid}`).get();
  if (!member.exists || member.get('bloqueParPlan') === true) throw new HttpsError('permission-denied', 'Accès refusé à cette famille.');
  return { uid: request.auth.uid, member };
}

export async function requireOwner(request: CallableRequest<unknown>, familleId: string) {
  const auth = await requireMember(request, familleId);
  const family = await db.doc(`familles/${familleId}`).get();
  if (!family.exists || family.get('proprietaireUserId') !== auth.uid) throw new HttpsError('permission-denied', 'Seul le propriétaire peut gérer cet abonnement.');
  return { ...auth, family };
}

export function normaliserNom(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function stringValue(value: unknown, max = 200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}
