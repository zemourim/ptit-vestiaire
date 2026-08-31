import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where,
  writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { normaliserNom, SEUIL_SUGGESTION, similarite } from '../lib/normalize';
import type { Fille, StatutVetement, Vetement } from '../types';
import { db } from './config';
import { familleIdCourante } from './familleCourante';

/** Firestore refuse un batch de plus de 500 écritures. */
const TAILLE_BATCH = 400;

function messageErreur(caught: { code?: string; message?: string }) {
  return caught.code === 'permission-denied'
    ? 'Accès Firestore refusé. Publie firestore.rules dans le projet Firebase utilisé.'
    : caught.message || 'Impossible de charger le catalogue.';
}

/**
 * Le catalogue reste petit (quelques dizaines de vêtements) : on le charge en entier
 * et on filtre côté client, ce qui évite des index composites et permet la recherche
 * approximative de noms sans requête supplémentaire.
 */
export function useVetements() {
  const [vetements, setVetements] = useState<Vetement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setError('Firebase n’est pas configuré.');
      setLoading(false);
      return;
    }

    const familleId = familleIdCourante();
    const catalogue = query(collection(db, 'vetements'), where('familleId', '==', familleId ?? '__aucune__'), orderBy('nom'));
    return onSnapshot(
      catalogue,
      (snapshot) => {
        setVetements(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Vetement));
        setLoading(false);
        setError(null);
      },
      (caught) => {
        setError(messageErreur(caught));
        setLoading(false);
      }
    );
  }, []);

  return { vetements, loading, error };
}

/** Vêtement du catalogue portant exactement le même nom normalisé, pour la même fille. */
export function trouverVetementExistant(catalogue: Vetement[], fille: Fille, nom: string) {
  const cible = normaliserNom(nom);
  return catalogue.find((vetement) => vetement.fille === fille && vetement.nomNormalise === cible) ?? null;
}

/** Vêtements dont le nom ressemble à `nom` sans être identique, du plus proche au moins proche. */
export function suggererVetementsProches(catalogue: Vetement[], fille: Fille, nom: string, limite = 3) {
  const cible = normaliserNom(nom);
  return catalogue
    .filter((vetement) => vetement.fille === fille && vetement.nomNormalise !== cible)
    .map((vetement) => ({ vetement, score: similarite(cible, vetement.nomNormalise) }))
    .filter((item) => item.score >= SEUIL_SUGGESTION)
    .sort((a, b) => b.score - a.score)
    .slice(0, limite)
    .map((item) => item.vetement);
}

/**
 * Change le statut d'un vêtement en un clic, sans photo.
 *
 * Écrit le mouvement et met à jour le vêtement dans un même batch : le catalogue
 * ne peut jamais pointer vers un mouvement inexistant.
 */
export async function basculerStatut(vetement: Vetement) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const firestore = db;
  const nouveauStatut: StatutVetement = vetement.statutActuel === 'sorti' ? 'revenu' : 'sorti';
  const maintenant = Timestamp.now();

  const batch = writeBatch(firestore);
  const mouvementRef = doc(collection(firestore, 'mouvements'));
  batch.set(mouvementRef, {
    vetementId: vetement.id,
    familleId: vetement.familleId,
    fille: vetement.fille,
    date: maintenant,
    photoUrl: null,
    statut: nouveauStatut,
    dateRetour: nouveauStatut === 'revenu' ? maintenant : null,
    origine: 'bouton_rapide'
  });

  // On clôt la sortie précédente pour que son historique porte sa date de retour.
  if (nouveauStatut === 'revenu' && vetement.dernierMouvementId) {
    batch.update(doc(firestore, 'mouvements', vetement.dernierMouvementId), { dateRetour: maintenant });
  }

  batch.update(doc(firestore, 'vetements', vetement.id), {
    statutActuel: nouveauStatut,
    dernierMouvementId: mouvementRef.id,
    dateDernierMouvement: maintenant
  });

  await batch.commit();
  return nouveauStatut;
}

export async function renommerVetement(vetementId: string, nom: string) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await updateDoc(doc(db, 'vetements', vetementId), { nom: nom.trim(), nomNormalise: normaliserNom(nom) });
}

/** Archive au lieu de supprimer : l'historique des mouvements reste consultable. */
export async function definirActif(vetementId: string, actif: boolean) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await updateDoc(doc(db, 'vetements', vetementId), { actif });
}

/**
 * Les mouvements sont volontairement conservés : ils constituent le journal
 * familial. L'historique global les affiche alors comme « Vêtement supprimé ».
 */
export async function supprimerVetement(vetementId: string) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  await deleteDoc(doc(db, 'vetements', vetementId));
}

/**
 * Fusionne un doublon dans le vêtement à conserver : tous les mouvements de la
 * source sont réattribués à la cible, puis la source est supprimée. Le statut de
 * la cible est recalculé à partir du mouvement le plus récent des deux.
 */
export async function fusionnerVetements(sourceId: string, cibleId: string) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  if (sourceId === cibleId) throw new Error('Choisis deux vêtements différents.');
  const firestore = db;

  const [source, cible] = await Promise.all([
    getDocs(query(collection(firestore, 'mouvements'), where('familleId', '==', familleIdCourante() ?? '__aucune__'), where('vetementId', '==', sourceId))),
    getDocs(query(collection(firestore, 'mouvements'), where('familleId', '==', familleIdCourante() ?? '__aucune__'), where('vetementId', '==', cibleId)))
  ]);

  for (let debut = 0; debut < source.docs.length; debut += TAILLE_BATCH) {
    const batch = writeBatch(firestore);
    source.docs.slice(debut, debut + TAILLE_BATCH).forEach((mouvement) => {
      batch.update(mouvement.ref, { vetementId: cibleId });
    });
    await batch.commit();
  }

  const tous = [...source.docs, ...cible.docs]
    .map((item) => ({ id: item.id, ...item.data() }) as { id: string; date: Timestamp; statut: StatutVetement })
    .sort((a, b) => b.date.toMillis() - a.date.toMillis());
  const dernier = tous[0] ?? null;

  await updateDoc(doc(firestore, 'vetements', cibleId), {
    statutActuel: dernier?.statut ?? 'revenu',
    dernierMouvementId: dernier?.id ?? null,
    dateDernierMouvement: dernier?.date ?? null
  });

  await deleteDoc(doc(firestore, 'vetements', sourceId));
  return source.docs.length;
}
