import type { Timestamp } from 'firebase/firestore';

export type Fille = string;
export type StatutVetement = 'sorti' | 'revenu';
export type OrigineMouvement = 'photo' | 'bouton_rapide';

/** Catalogue permanent : un document par vêtement réel, réutilisé à chaque sortie. */
export type Vetement = {
  id: string;
  familleId: string;
  fille: Fille;
  nom: string;
  /** Nom sans accent ni casse, pour retrouver un vêtement existant sans créer de doublon. */
  nomNormalise: string;
  photoReference: string | null;
  dateCreation: Timestamp;
  actif: boolean;
  statutActuel: StatutVetement;
  dernierMouvementId: string | null;
  /** Dénormalisation de la date du dernier mouvement : évite une requête par vêtement à l'affichage. */
  dateDernierMouvement: Timestamp | null;
};

/** Événement daté : ce vêtement est sorti, ou ce vêtement est rentré. */
export type Mouvement = {
  id: string;
  familleId: string;
  vetementId: string;
  fille: Fille;
  date: Timestamp;
  photoUrl: string | null;
  statut: StatutVetement;
  /** Sur un mouvement `sorti`, renseigné quand le vêtement rentre. Sur un `revenu`, égal à `date`. */
  dateRetour: Timestamp | null;
  origine: OrigineMouvement;
};

export type RoleFamille = 'proprietaire' | 'invite';
export type Famille = { id: string; nom: string; dateCreation: Timestamp; proprietaireUserId: string; enfants: string[] };
export type LienFamille = { familleId: string; role: RoleFamille };
export type Utilisateur = { id: string; email: string; familles: LienFamille[]; familleIds?: string[] };

export type AppSettings = {
  alertAfterDays: number;
};
