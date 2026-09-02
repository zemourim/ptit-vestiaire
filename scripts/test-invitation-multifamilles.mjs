import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';

process.loadEnvFile('.env.multi-familles');
const config = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID
};
const stamp = Date.now();
const password = `Invitation-${stamp}-Aa!`;

async function nouveauCompte(numero) {
  const app = initializeApp(config, `invitation-${stamp}-${numero}`);
  const email = `invitation-${stamp}-${numero}@example.com`;
  const credential = await createUserWithEmailAndPassword(getAuth(app), email, password);
  return { db: getFirestore(app), email, user: credential.user };
}

const proprietaire = await nouveauCompte('proprietaire');
const invite = await nouveauCompte('invite');
const familleId = `invitation-${stamp}`;
const code = `TEST${String(stamp).slice(-6)}`;

const creation = writeBatch(proprietaire.db);
creation.set(doc(proprietaire.db, 'familles', familleId), {
  nom: 'Famille Invitation Test', enfants: ['Enfant test'],
  dateCreation: serverTimestamp(), proprietaireUserId: proprietaire.user.uid
});
creation.set(doc(proprietaire.db, 'utilisateurs', proprietaire.user.uid), {
  email: proprietaire.email,
  familles: [{ familleId, role: 'proprietaire' }],
  familleIds: [familleId]
});
creation.set(doc(proprietaire.db, 'familles', familleId, 'membres', proprietaire.user.uid), {
  userId: proprietaire.user.uid, email: proprietaire.email, role: 'proprietaire'
});
await creation.commit();
await proprietaire.user.getIdToken(true);
await setDoc(doc(proprietaire.db, 'invitations', code), {
  code, familleId, createurUserId: proprietaire.user.uid, dateCreation: serverTimestamp()
});

const invitationRef = doc(invite.db, 'invitations', code);
const invitation = await getDoc(invitationRef);
if (invitation.data()?.familleId !== familleId) throw new Error('Invitation introuvable.');

const adhesion = writeBatch(invite.db);
adhesion.set(doc(invite.db, 'utilisateurs', invite.user.uid), {
  email: invite.email,
  familles: [{ familleId, role: 'invite' }],
  familleIds: [familleId],
  joinCode: code
});
adhesion.set(doc(invite.db, 'familles', familleId, 'membres', invite.user.uid), {
  userId: invite.user.uid, email: invite.email, role: 'invite'
});
adhesion.delete(invitationRef);
await adhesion.commit();
await invite.user.getIdToken(true);

const famille = await getDoc(doc(invite.db, 'familles', familleId));
if (!famille.exists()) throw new Error('Le parent invité ne peut pas lire la famille rejointe.');
if ((await getDoc(invitationRef)).exists()) throw new Error('Le code n’a pas été consommé.');
process.stdout.write(`Invitation validée pour ${invite.email} dans ${famille.data().nom}.\n`);
