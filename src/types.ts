import type { Timestamp } from 'firebase/firestore';

export type Fille = 'Sanaa' | 'Manelle';
export type StatutSortie = 'sorti' | 'revenu';

export type Sortie = {
  id: string;
  fille: Fille;
  date: Timestamp;
  photoUrl: string;
  photoPath?: string;
  vetements: string[];
  statut: StatutSortie;
  dateRetour: Timestamp | null;
};

export type NouvelleSortieData = Omit<Sortie, 'id' | 'date' | 'dateRetour' | 'statut'>;

export type AppSettings = {
  alertAfterDays: number;
};
