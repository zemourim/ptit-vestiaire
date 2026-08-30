import { CheckCircle2, Clock, TriangleAlert } from 'lucide-react';
import type { StatutVetement } from '../types';

type Props = {
  statut: StatutVetement;
  late?: boolean;
  /** Nombre de jours dans le statut actuel, affiché quand il est connu. */
  jours?: number | null;
};

export function BadgeStatut({ statut, late = false, jours = null }: Props) {
  if (statut === 'revenu') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
        <CheckCircle2 size={16} /> À la maison
      </span>
    );
  }

  const suffixe = jours === null ? '' : ` · ${jours} j`;

  if (late) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
        <TriangleAlert size={16} /> Sorti{suffixe}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700">
      <Clock size={16} /> Sorti{suffixe}
    </span>
  );
}
