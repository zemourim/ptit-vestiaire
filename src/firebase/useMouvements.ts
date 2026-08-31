import {
  collection,
  doc,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
  Timestamp,
  where,
  writeBatch
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { normaliserNom } from '../lib/normalize';
import type { Fille, Mouvement } from '../types';
import { db } from './config';
import { familleIdCourante } from './familleCourante';

function messageErreur(caught: { code?: string; message?: string }) {
  return caught.code === 'permission-denied'
    ? 'Accès Firestore refusé. Publie firestore.rules dans le projet Firebase utilisé.'
    : caught.message || 'Impossible de charger les mouvements.';
}

function useFluxMouvements(contraintes: QueryConstraint[], actif: boolean, cle: string) {
  const [mouvements, setMouvements] = useState<Mouvement[]>([]);
  const [loading, setLoading] = useState(actif);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!actif) {
      setMouvements([]);
      setLoading(false);
      return;
    }
    if (!db) {
      setError('Firebase n’est pas configuré.');
      setLoading(false);
      return;
    }

    setLoading(true);
    return onSnapshot(
      query(collection(db, 'mouvements'), where('familleId', '==', familleIdCourante() ?? '__aucune__'), ...contraintes),
      (snapshot) => {
        setMouvements(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as Mouvement));
        setLoading(false);
        setError(null);
      },
      (caught) => {
        setError(messageErreur(caught));
        setLoading(false);
      }
    );
    // `contraintes` est reconstruit à chaque rendu : `cle` décrit son contenu réel.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cle, actif]);

  return { mouvements, loading, error };
}

/** Historique complet d'un vêtement, du plus récent au plus ancien. */
export function useMouvementsVetement(vetementId: string | null) {
  return useFluxMouvements(
    [where('vetementId', '==', vetementId ?? '__aucun__'), orderBy('date', 'desc')],
    Boolean(vetementId),
    `vetement:${vetementId}`
  );
}

/** Journal global, éventuellement filtré par fille. */
export function useJournalMouvements(fille: Fille | 'Toutes', maximum = 120) {
  const contraintes: QueryConstraint[] = [];
  if (fille !== 'Toutes') contraintes.push(where('fille', '==', fille));
  contraintes.push(orderBy('date', 'desc'), limitTo(maximum));
  return useFluxMouvements(contraintes, true, `journal:${fille}:${maximum}`);
}

export type EntreeSortie = {
  nom: string;
  /** `null` = le vêtement doit être créé dans le catalogue. */
  vetementId: string | null;
};

/**
 * Enregistre la sortie du matin : un mouvement `sorti` par vêtement identifié sur
 * la photo. Les vêtements déjà au catalogue sont réutilisés tels quels, les autres
 * sont créés au passage. Tout part dans un seul batch, donc soit tout est écrit,
 * soit rien ne l'est.
 */
export async function enregistrerSortiePhoto(fille: Fille, photoUrl: string, entrees: EntreeSortie[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  if (entrees.length === 0) throw new Error('Aucun vêtement à enregistrer.');
  const firestore = db;
  const maintenant = Timestamp.now();
  const familleId = familleIdCourante();
  if (!familleId) throw new Error('Aucune famille sélectionnée.');
  const batch = writeBatch(firestore);

  entrees.forEach((entree) => {
    const nom = entree.nom.trim();
    const mouvementRef = doc(collection(firestore, 'mouvements'));
    const vetementRef = entree.vetementId
      ? doc(firestore, 'vetements', entree.vetementId)
      : doc(collection(firestore, 'vetements'));

    batch.set(mouvementRef, {
      vetementId: vetementRef.id,
      familleId,
      fille,
      date: maintenant,
      photoUrl,
      statut: 'sorti',
      dateRetour: null,
      origine: 'photo'
    });

    if (entree.vetementId) {
      batch.update(vetementRef, {
        statutActuel: 'sorti',
        dernierMouvementId: mouvementRef.id,
        dateDernierMouvement: maintenant
      });
    } else {
      batch.set(vetementRef, {
        fille,
        familleId,
        nom,
        nomNormalise: normaliserNom(nom),
        photoReference: photoUrl,
        dateCreation: maintenant,
        actif: true,
        statutActuel: 'sorti',
        dernierMouvementId: mouvementRef.id,
        dateDernierMouvement: maintenant
      });
    }
  });

  await batch.commit();
}

/**
 * Ajoute uniquement les nouveaux vêtements au catalogue. Aucun mouvement n'est
 * créé : ils commencent donc logiquement « revenus », à la maison.
 */
export async function enregistrerAjoutCataloguePhoto(fille: Fille, photoUrl: string, entrees: EntreeSortie[]) {
  if (!db) throw new Error('Firebase n’est pas configuré.');
  const nouveaux = entrees.filter((entree) => !entree.vetementId);
  if (nouveaux.length === 0) throw new Error('Tous ces vêtements sont déjà présents au catalogue.');

  const maintenant = Timestamp.now();
  const familleId = familleIdCourante();
  if (!familleId) throw new Error('Aucune famille sélectionnée.');
  const batch = writeBatch(db);
  nouveaux.forEach((entree) => {
    const vetementRef = doc(collection(db!, 'vetements'));
    const nom = entree.nom.trim();
    batch.set(vetementRef, {
      fille,
      familleId,
      nom,
      nomNormalise: normaliserNom(nom),
      photoReference: photoUrl,
      dateCreation: maintenant,
      actif: true,
      statutActuel: 'revenu',
      dernierMouvementId: null,
      dateDernierMouvement: null
    });
  });
  await batch.commit();
}
