import {
  collection,
  limit as limitTo,
  onSnapshot,
  orderBy,
  query,
  type QueryConstraint,
  Timestamp,
  where
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import type { Fille, Mouvement } from '../types';
import { db } from './config';
import { familleIdCourante } from './familleCourante';
import { appelerFonction } from './useSubscription';

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
export function useMouvementsVetement(vetementId: string | null, historiqueIllimite = false) {
  const [depuis] = useState(() => Timestamp.fromMillis(Date.now() - 30 * 86_400_000));
  const contraintes: QueryConstraint[] = [where('vetementId', '==', vetementId ?? '__aucun__')];
  if (!historiqueIllimite) contraintes.push(where('date', '>=', depuis));
  contraintes.push(orderBy('date', 'desc'));
  return useFluxMouvements(
    contraintes,
    Boolean(vetementId),
    `vetement:${vetementId}:${historiqueIllimite}`
  );
}

/** Journal global, éventuellement filtré par fille. */
export function useJournalMouvements(fille: Fille | 'Tout', maximum = 120, historiqueIllimite = false) {
  const [depuis] = useState(() => Timestamp.fromMillis(Date.now() - 30 * 86_400_000));
  const contraintes: QueryConstraint[] = [];
  if (fille !== 'Tout') contraintes.push(where('fille', '==', fille));
  if (!historiqueIllimite) contraintes.push(where('date', '>=', depuis));
  contraintes.push(orderBy('date', 'desc'), limitTo(maximum));
  return useFluxMouvements(contraintes, true, `journal:${fille}:${maximum}:${historiqueIllimite}`);
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
  if (entrees.length === 0) throw new Error('Aucun vêtement à enregistrer.');
  const familleId = familleIdCourante();
  if (!familleId) throw new Error('Aucune famille sélectionnée.');
  await appelerFonction('enregistrerAjoutVetements', { familleId, fille, photoUrl, entrees, typeAjout: 'sortie' });
}

/**
 * Ajoute uniquement les nouveaux vêtements au catalogue. Aucun mouvement n'est
 * créé : ils commencent donc logiquement « revenus », à la maison.
 */
export async function enregistrerAjoutCataloguePhoto(fille: Fille, photoUrl: string, entrees: EntreeSortie[]) {
  const nouveaux = entrees.filter((entree) => !entree.vetementId);
  if (nouveaux.length === 0) throw new Error('Tous ces vêtements sont déjà présents au catalogue.');
  const familleId = familleIdCourante();
  if (!familleId) throw new Error('Aucune famille sélectionnée.');
  await appelerFonction('enregistrerAjoutVetements', { familleId, fille, photoUrl, entrees: nouveaux, typeAjout: 'catalogue' });
}
