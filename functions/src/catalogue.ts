import { Timestamp } from 'firebase-admin/firestore';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db, normaliserNom, requireMember, stringValue } from './server.js';

type Entry = { nom?: unknown; vetementId?: unknown };
type AddRequest = { familleId?: unknown; fille?: unknown; photoUrl?: unknown; typeAjout?: unknown; entrees?: Entry[] };

export const enregistrerAjoutVetements = onCall<AddRequest>(async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  const fille = stringValue(request.data.fille, 80);
  const photoUrl = stringValue(request.data.photoUrl, 3000);
  const typeAjout = request.data.typeAjout === 'catalogue' ? 'catalogue' : 'sortie';
  const entrees = Array.isArray(request.data.entrees) ? request.data.entrees.slice(0, 20) : [];
  if (!familleId || !fille || !photoUrl || entrees.length === 0) throw new HttpsError('invalid-argument', 'Ajout invalide.');
  await requireMember(request, familleId);

  const familyRef = db.doc(`familles/${familleId}`);
  const familySnapshot = await familyRef.get();
  if (!familySnapshot.exists) throw new HttpsError('not-found', 'Famille introuvable.');
  const premium = familySnapshot.get('plan') === 'payant';
  const enfants = (familySnapshot.get('enfants') as unknown[] | undefined)?.filter((item): item is string => typeof item === 'string') ?? [];
  if (!premium && enfants[0] !== fille) throw new HttpsError('failed-precondition', 'Cet enfant est archivé avec la formule gratuite.');

  const nouveaux = entrees.filter((entry) => !stringValue(entry.vetementId, 100));
  const countSnapshot = await db.collection('vetements').where('familleId', '==', familleId).count().get();
  const baselineCount = countSnapshot.data().count;
  const existingRefs = entrees.map((entry) => stringValue(entry.vetementId, 100)).filter(Boolean).map((id) => db.doc(`vetements/${id}`));
  await db.runTransaction(async (transaction) => {
    const currentFamily = await transaction.get(familyRef);
    const existing = existingRefs.length ? await transaction.getAll(...existingRefs) : [];
    if (existing.some((snapshot) => !snapshot.exists || snapshot.get('familleId') !== familleId || snapshot.get('bloqueParPlan') === true)) {
      throw new HttpsError('permission-denied', 'Un vêtement sélectionné n’est pas accessible.');
    }
    const currentCount = typeof currentFamily.get('nombreVetements') === 'number' ? currentFamily.get('nombreVetements') as number : baselineCount;
    if (currentFamily.get('plan') !== 'payant' && currentCount + nouveaux.length > 20) throw new HttpsError('resource-exhausted', 'La formule gratuite est limitée à 20 vêtements.');
    const now = Timestamp.now();
    for (const entry of entrees) {
      const nom = stringValue(entry.nom, 120);
      const existingId = stringValue(entry.vetementId, 100);
      if (!nom) throw new HttpsError('invalid-argument', 'Le nom d’un vêtement est vide.');
      const clothingRef = existingId ? db.doc(`vetements/${existingId}`) : db.collection('vetements').doc();
      const movementRef = db.collection('mouvements').doc();
      if (typeAjout === 'sortie') transaction.create(movementRef, { vetementId: clothingRef.id, familleId, fille, date: now, photoUrl, statut: 'sorti', dateRetour: null, origine: 'photo' });
      if (existingId) {
        if (typeAjout === 'sortie') transaction.update(clothingRef, { statutActuel: 'sorti', dernierMouvementId: movementRef.id, dateDernierMouvement: now });
      } else {
        transaction.create(clothingRef, { fille, familleId, nom, nomNormalise: normaliserNom(nom), photoReference: photoUrl, dateCreation: now, actif: true, bloqueParPlan: false, statutActuel: typeAjout === 'sortie' ? 'sorti' : 'revenu', dernierMouvementId: typeAjout === 'sortie' ? movementRef.id : null, dateDernierMouvement: typeAjout === 'sortie' ? now : null });
      }
    }
    if (nouveaux.length) transaction.set(familyRef, { nombreVetements: currentCount + nouveaux.length }, { merge: true });
  });
  return { nouveaux: nouveaux.length };
});

export const supprimerVetement = onCall<{ familleId?: unknown; vetementId?: unknown }>(async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  const vetementId = stringValue(request.data.vetementId, 100);
  await requireMember(request, familleId);
  const ref = db.doc(`vetements/${vetementId}`);
  const familyRef = db.doc(`familles/${familleId}`);
  const baseline = (await db.collection('vetements').where('familleId', '==', familleId).count().get()).data().count;
  await db.runTransaction(async (transaction) => {
    const [snapshot, family] = await transaction.getAll(ref, familyRef);
    if (!snapshot.exists || snapshot.get('familleId') !== familleId) throw new HttpsError('not-found', 'Vêtement introuvable.');
    const count = typeof family.get('nombreVetements') === 'number' ? family.get('nombreVetements') as number : baseline;
    transaction.delete(ref);
    transaction.set(familyRef, { nombreVetements: Math.max(0, count - 1) }, { merge: true });
  });
  return { ok: true };
});

export const fusionnerVetements = onCall<{ familleId?: unknown; sourceId?: unknown; cibleId?: unknown }>(async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  const sourceId = stringValue(request.data.sourceId, 100);
  const cibleId = stringValue(request.data.cibleId, 100);
  if (!sourceId || !cibleId || sourceId === cibleId) throw new HttpsError('invalid-argument', 'Fusion invalide.');
  await requireMember(request, familleId);
  const sourceRef = db.doc(`vetements/${sourceId}`);
  const targetRef = db.doc(`vetements/${cibleId}`);
  const [source, target] = await db.getAll(sourceRef, targetRef);
  if (!source.exists || !target.exists || source.get('familleId') !== familleId || target.get('familleId') !== familleId) throw new HttpsError('not-found', 'Vêtement introuvable.');
  const [sourceMoves, targetMoves] = await Promise.all([
    db.collection('mouvements').where('familleId', '==', familleId).where('vetementId', '==', sourceId).get(),
    db.collection('mouvements').where('familleId', '==', familleId).where('vetementId', '==', cibleId).get()
  ]);
  const allMoves = [...sourceMoves.docs, ...targetMoves.docs].sort((a, b) => (b.get('date')?.toMillis?.() ?? 0) - (a.get('date')?.toMillis?.() ?? 0));
  for (let start = 0; start < sourceMoves.docs.length; start += 400) {
    const batch = db.batch();
    sourceMoves.docs.slice(start, start + 400).forEach((move) => batch.update(move.ref, { vetementId: cibleId }));
    await batch.commit();
  }
  const latest = allMoves[0];
  const familyRef = db.doc(`familles/${familleId}`);
  const baseline = (await db.collection('vetements').where('familleId', '==', familleId).count().get()).data().count;
  await db.runTransaction(async (transaction) => {
    const [freshSource, family] = await transaction.getAll(sourceRef, familyRef);
    if (!freshSource.exists) throw new HttpsError('not-found', 'Le doublon a déjà été supprimé.');
    const count = typeof family.get('nombreVetements') === 'number' ? family.get('nombreVetements') as number : baseline;
    transaction.set(targetRef, { statutActuel: latest?.get('statut') ?? 'revenu', dernierMouvementId: latest?.id ?? null, dateDernierMouvement: latest?.get('date') ?? null }, { merge: true });
    transaction.delete(sourceRef);
    transaction.set(familyRef, { nombreVetements: Math.max(0, count - 1) }, { merge: true });
  });
  return { deplaces: sourceMoves.size };
});

export const creerInvitation = onCall<{ familleId?: unknown; createurUserId?: unknown }>(async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  const { uid } = await requireMember(request, familleId);
  const family = await db.doc(`familles/${familleId}`).get();
  const members = await db.collection(`familles/${familleId}/membres`).get();
  const invitedCount = members.docs.filter((item) => item.get('role') === 'invite' && item.get('bloqueParPlan') !== true).length;
  if (family.get('plan') !== 'payant' && invitedCount >= 1) throw new HttpsError('resource-exhausted', 'La formule gratuite est limitée à un membre invité.');
  const code = crypto.randomUUID().replaceAll('-', '').slice(0, 10).toUpperCase();
  await db.doc(`invitations/${code}`).create({ code, familleId, createurUserId: uid, dateCreation: Timestamp.now() });
  return { code };
});

export const rejoindreFamille = onCall<{ code?: unknown; userId?: unknown; email?: unknown }>(async (request) => {
  if (!request.auth || request.auth.token.email_verified !== true) throw new HttpsError('unauthenticated', 'Connecte-toi et valide ton e-mail.');
  const code = stringValue(request.data.code, 20).toUpperCase();
  const email = stringValue(request.data.email, 320);
  if (stringValue(request.data.userId, 128) !== request.auth.uid) throw new HttpsError('permission-denied', 'Compte invalide.');
  const invitationRef = db.doc(`invitations/${code}`);
  const invitation = await invitationRef.get();
  const familleId = stringValue(invitation.get('familleId'), 100);
  if (!invitation.exists || !familleId) throw new HttpsError('not-found', 'Code d’invitation invalide.');
  const familyRef = db.doc(`familles/${familleId}`);
  const userRef = db.doc(`utilisateurs/${request.auth.uid}`);
  const quotaRef = db.doc(`familles/${familleId}/quotas/invite-gratuit`);
  await db.runTransaction(async (transaction) => {
    const [freshInvitation, family, user, quota] = await transaction.getAll(invitationRef, familyRef, userRef, quotaRef);
    if (!freshInvitation.exists) throw new HttpsError('not-found', 'Ce code a déjà été utilisé.');
    if (family.get('plan') !== 'payant' && quota.exists && quota.get('userId') !== request.auth?.uid) throw new HttpsError('resource-exhausted', 'Cette famille a atteint sa limite de membre invité.');
    const links = ((user.get('familles') as Array<{ familleId: string; role: string }> | undefined) ?? []).filter((link) => link.familleId !== familleId);
    links.push({ familleId, role: 'invite' });
    transaction.set(userRef, { email, familles: links, familleIds: links.map((link) => link.familleId) }, { merge: true });
    transaction.set(db.doc(`familles/${familleId}/membres/${request.auth!.uid}`), { userId: request.auth!.uid, email, role: 'invite', bloqueParPlan: false });
    if (family.get('plan') !== 'payant') transaction.set(quotaRef, { userId: request.auth!.uid });
    transaction.delete(invitationRef);
  });
  return { familleId };
});

export const retirerMembre = onCall<{ familleId?: unknown; userId?: unknown }>(async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  const userId = stringValue(request.data.userId, 128);
  const familyRef = db.doc(`familles/${familleId}`);
  const family = await familyRef.get();
  await requireMember(request, familleId);
  if (family.get('proprietaireUserId') !== request.auth?.uid) throw new HttpsError('permission-denied', 'Seul le propriétaire peut retirer un membre.');
  const memberRef = db.doc(`familles/${familleId}/membres/${userId}`);
  const userRef = db.doc(`utilisateurs/${userId}`);
  const quotaRef = db.doc(`familles/${familleId}/quotas/invite-gratuit`);
  await db.runTransaction(async (transaction) => {
    const [member, user, quota] = await transaction.getAll(memberRef, userRef, quotaRef);
    if (!member.exists || member.get('role') !== 'invite') throw new HttpsError('not-found', 'Membre invité introuvable.');
    const links = ((user.get('familles') as Array<{ familleId: string; role: string }> | undefined) ?? []).filter((link) => link.familleId !== familleId);
    transaction.set(userRef, { familles: links, familleIds: links.map((link) => link.familleId), removedFamilyId: familleId }, { merge: true });
    transaction.delete(memberRef);
    if (quota.exists && quota.get('userId') === userId) transaction.delete(quotaRef);
  });
  return { ok: true };
});
