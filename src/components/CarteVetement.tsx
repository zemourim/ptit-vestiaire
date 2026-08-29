import { Check, Shirt } from 'lucide-react';
import { BadgeStatut } from './BadgeStatut';
import { daysSince, formatDate, isLate } from '../lib/dates';
import { filleStyles } from '../lib/constants';
import type { Sortie } from '../types';

type Props = {
  sortie: Sortie;
  alertAfterDays: number;
  selected?: boolean;
  onSelectedChange?: (checked: boolean) => void;
  onMarkReturned?: () => void;
};

export function CarteVetement({ sortie, alertAfterDays, selected, onSelectedChange, onMarkReturned }: Props) {
  const late = sortie.statut === 'sorti' && isLate(sortie.date, alertAfterDays);

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
      <img src={sortie.photoUrl} alt={`Tenue de ${sortie.fille}`} className="h-56 w-full object-cover" loading="lazy" />
      <div className="space-y-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className={`text-xl font-black ${filleStyles[sortie.fille].text}`}>{sortie.fille}</p>
            <p className="text-sm font-bold text-slate-500">{formatDate(sortie.date)} · il y a {daysSince(sortie.date)} j</p>
          </div>
          <BadgeStatut sortie={sortie} late={late} />
        </div>

        <div className="flex flex-wrap gap-2">
          {sortie.vetements.map((vetement) => (
            <span key={vetement} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
              <Shirt size={15} /> {vetement}
            </span>
          ))}
        </div>

        {sortie.statut === 'sorti' && (
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 pt-3">
            {onSelectedChange && (
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={selected}
                  onChange={(event) => onSelectedChange(event.target.checked)}
                  className="h-5 w-5 rounded border-slate-300"
                />
                Sélectionner
              </label>
            )}
            {onMarkReturned && (
              <button
                type="button"
                onClick={onMarkReturned}
                className="ml-auto inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 text-sm font-black text-white"
              >
                <Check size={16} /> Marquer revenu
              </button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
