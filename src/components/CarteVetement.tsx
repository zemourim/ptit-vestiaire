import { Archive, ArchiveRestore, History, Loader2, LogIn, LogOut, Shirt, Trash2 } from 'lucide-react';
import { BadgeStatut } from './BadgeStatut';
import { daysSince, formatDate, isLate } from '../lib/dates';
import { getFilleStyles } from '../lib/constants';
import type { Vetement } from '../types';

type Props = {
  vetement: Vetement;
  alertAfterDays: number;
  busy?: boolean;
  onToggleStatut?: () => void;
  onVoirHistorique?: () => void;
  onToggleActif?: () => void;
  onSupprimer?: () => void;
};

export function CarteVetement({ vetement, alertAfterDays, busy, onToggleStatut, onVoirHistorique, onToggleActif, onSupprimer }: Props) {
  const sorti = vetement.statutActuel === 'sorti';
  const jours = vetement.dateDernierMouvement ? daysSince(vetement.dateDernierMouvement) : null;
  const late = sorti && vetement.dateDernierMouvement ? isLate(vetement.dateDernierMouvement, alertAfterDays) : false;

  return (
    <article
      className={`overflow-hidden rounded-3xl border bg-white shadow-sm transition ${
        late ? 'border-rose-200' : 'border-slate-200'
      } ${vetement.actif ? '' : 'opacity-60'}`}
    >
      {vetement.photoReference ? (
        <img src={vetement.photoReference} alt={vetement.nom} className="h-44 w-full object-cover" loading="lazy" />
      ) : (
        <div className="grid h-44 w-full place-items-center bg-slate-100 text-slate-400">
          <Shirt size={40} />
        </div>
      )}

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-lg font-black capitalize">{vetement.nom}</p>
            <p className={`text-sm font-bold ${getFilleStyles(vetement.fille).text}`}>{vetement.fille}</p>
          </div>
          <BadgeStatut statut={vetement.statutActuel} late={late} jours={jours} />
        </div>

        <p className="text-sm font-bold text-slate-500">
          {vetement.dateDernierMouvement
            ? `${sorti ? 'Sorti' : 'Rentré'} le ${formatDate(vetement.dateDernierMouvement)}`
            : 'Aucun mouvement enregistré'}
          {!vetement.actif && ' · archivé'}
        </p>

        <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
          {onToggleStatut && (
            <button
              type="button"
              onClick={onToggleStatut}
              disabled={busy}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-black text-white transition disabled:opacity-60 ${
                sorti ? 'bg-emerald-600' : 'bg-slate-950'
              }`}
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : sorti ? <LogIn size={16} /> : <LogOut size={16} />}
              {sorti ? 'Marquer rentré' : 'Marquer ressorti'}
            </button>
          )}
          {onVoirHistorique && (
            <button
              type="button"
              onClick={onVoirHistorique}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-sm font-black text-slate-700"
            >
              <History size={16} /> Historique
            </button>
          )}
          {onToggleActif && (
            <button
              type="button"
              onClick={onToggleActif}
              className="ml-auto inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-slate-500"
              title={vetement.actif ? 'Archiver ce vêtement' : 'Remettre dans la garde-robe'}
            >
              {vetement.actif ? <Archive size={16} /> : <ArchiveRestore size={16} />}
            </button>
          )}
          {onSupprimer && (
            <button
              type="button"
              onClick={onSupprimer}
              className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black text-rose-600"
              title="Supprimer ce vêtement"
              aria-label={`Supprimer ${vetement.nom}`}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
