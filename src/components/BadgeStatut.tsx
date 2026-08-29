import { CheckCircle2, Clock, TriangleAlert } from 'lucide-react';
import type { Sortie } from '../types';

type Props = {
  sortie: Sortie;
  late: boolean;
};

export function BadgeStatut({ sortie, late }: Props) {
  if (sortie.statut === 'revenu') {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
        <CheckCircle2 size={16} /> Revenu
      </span>
    );
  }

  if (late) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-3 py-1 text-sm font-bold text-rose-700">
        <TriangleAlert size={16} /> +7 jours
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-3 py-1 text-sm font-bold text-slate-700">
      <Clock size={16} /> Sorti
    </span>
  );
}
