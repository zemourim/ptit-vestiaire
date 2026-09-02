import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';
import { doc, getDoc, getFirestore, serverTimestamp, setDoc, writeBatch } from 'firebase/firestore';
import { getStorage, ref, uploadBytes } from 'firebase/storage';

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
const password = `Test-${stamp}-Aa!`;

async function creerFoyer(numero) {
  const app = initializeApp(config, `isolation-${stamp}-${numero}`);
  const email = `isolation-${stamp}-${numero}@example.com`;
  const credential = await createUserWithEmailAndPassword(getAuth(app), email, password);
  const db = getFirestore(app);
  const familleRef = doc(db, 'familles', `test-${stamp}-${numero}`);
  const batch = writeBatch(db);
  batch.set(familleRef, { nom: `Famille Test ${numero}`, enfants: [`Enfant ${numero}`], dateCreation: serverTimestamp(), proprietaireUserId: credential.user.uid });
  batch.set(doc(db, 'utilisateurs', credential.user.uid), { email, familles: [{ familleId: familleRef.id, role: 'proprietaire' }], familleIds: [familleRef.id] });
  batch.set(doc(db, 'familles', familleRef.id, 'membres', credential.user.uid), { userId: credential.user.uid, email, role: 'proprietaire' });
  await batch.commit();
  await credential.user.getIdToken(true);
  const vetementRef = doc(db, 'vetements', `test-${stamp}-${numero}`);
  await setDoc(vetementRef, { familleId: familleRef.id, fille: `Enfant ${numero}`, nom: `Vêtement test ${numero}`, nomNormalise: `vetement test ${numero}`, photoReference: null, dateCreation: serverTimestamp(), actif: true, statutActuel: 'revenu', dernierMouvementId: null, dateDernierMouvement: null });
  const mouvementRef = doc(db, 'mouvements', `test-${stamp}-${numero}`);
  await setDoc(mouvementRef, { familleId: familleRef.id, vetementId: vetementRef.id, fille: `Enfant ${numero}`, date: serverTimestamp(), photoUrl: null, statut: 'sorti', dateRetour: null, origine: 'bouton_rapide' });
  return { app, db, email, userId: credential.user.uid, familleId: familleRef.id, vetementRef, mouvementRef };
}

async function doitEtreRefuse(action, libelle) {
  try { await action(); throw new Error(`${libelle}: accès accepté à tort`); }
  catch (error) {
    if (error.message?.includes('accepté à tort')) throw error;
    process.stdout.write(`OK refusé: ${libelle}\n`);
  }
}

const familleA = await creerFoyer('A');
const familleB = await creerFoyer('B');
await doitEtreRefuse(() => getDoc(doc(familleA.db, 'familles', familleB.familleId)), 'lecture famille étrangère');
await doitEtreRefuse(() => getDoc(doc(familleA.db, 'utilisateurs', familleB.userId)), 'lecture utilisateur étranger');
await doitEtreRefuse(() => getDoc(doc(familleA.db, 'vetements', familleB.vetementRef.id)), 'lecture vêtement étranger');
await doitEtreRefuse(() => getDoc(doc(familleA.db, 'mouvements', familleB.mouvementRef.id)), 'lecture mouvement étranger');
await doitEtreRefuse(() => setDoc(doc(familleA.db, 'vetements', familleB.vetementRef.id), { familleId: familleA.familleId }, { merge: true }), 'prise de contrôle vêtement étranger');
await uploadBytes(ref(getStorage(familleA.app), `familles/${familleA.familleId}/sorties/${getAuth(familleA.app).currentUser.uid}/test.txt`), new Blob(['test'], { type: 'image/png' }));
await doitEtreRefuse(() => uploadBytes(ref(getStorage(familleA.app), `familles/${familleB.familleId}/sorties/${getAuth(familleA.app).currentUser.uid}/attaque.png`), new Blob(['test'], { type: 'image/png' })), 'upload Storage famille étrangère');
process.stdout.write(`Isolation validée entre ${familleA.email} et ${familleB.email}\n`);
