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
  /** Donnée conservée après une rétrogradation, mais inutilisable tant que le plan reste gratuit. */
  bloqueParPlan?: boolean;
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
export type PlanFamille = 'gratuit' | 'payant';
export type FrequencePaiement = 'mensuel' | 'annuel' | null;
export type StatutAbonnement = 'actif' | 'en_attente_renouvellement' | 'expire' | null;
export type Famille = {
  id: string;
  nom: string;
  dateCreation: Timestamp;
  proprietaireUserId: string;
  enfants: string[];
  plan?: PlanFamille;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  frequencePaiement?: FrequencePaiement;
  dateDebutAbonnement?: Timestamp | null;
  dateProchainRenouvellement?: Timestamp | null;
  nombreRappelsEnvoyes?: number;
  statutAbonnement?: StatutAbonnement;
  nombreVetements?: number;
  echecPaiementLe?: Timestamp | null;
};
export type LienFamille = { familleId: string; role: RoleFamille };
export type Utilisateur = { id: string; email: string; familles: LienFamille[]; familleIds?: string[] };

export type AppSettings = {
  alertAfterDays: number;
};

export function planFamille(famille: Famille | null | undefined): PlanFamille {
  return famille?.plan === 'payant' ? 'payant' : 'gratuit';
}

export function enfantsActifs(famille: Famille | null | undefined): string[] {
  const enfants = famille?.enfants?.filter(Boolean) ?? [];
  return planFamille(famille) === 'payant' ? enfants : enfants.slice(0, 1);
}
