import { Camera, MousePointerClick, X } from 'lucide-react';
import { useMouvementsVetement } from '../firebase/useMouvements';
import { formatDate } from '../lib/dates';
import type { Vetement } from '../types';

type Props = {
  vetement: Vetement;
  onClose: () => void;
};

/** Panneau affichant toutes les fois où un vêtement est sorti ou rentré. */
export function HistoriqueVetement({ vetement, onClose }: Props) {
  const { mouvements, loading, error } = useMouvementsVetement(vetement.id);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/40 p-0 md:items-center md:p-6" onClick={onClose}>
      <div
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-xl md:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Historique</p>
            <h3 className="text-2xl font-black capitalize">{vetement.nom}</h3>
            <p className="text-sm font-bold text-slate-500">
              {vetement.fille} · {mouvements.length} mouvement(s)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600"
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </div>

        {error && <p className="mt-4 rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}
        {loading && <p className="mt-4 font-bold text-slate-500">Chargement de l’historique...</p>}
        {!loading && mouvements.length === 0 && !error && (
          <p className="mt-4 font-bold text-slate-500">Aucun mouvement enregistré pour ce vêtement.</p>
        )}

        <ol className="mt-4 space-y-3">
          {mouvements.map((mouvement) => (
            <li key={mouvement.id} className="flex gap-3 rounded-2xl border border-slate-200 p-3">
              {mouvement.photoUrl ? (
                <img src={mouvement.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-xl object-cover" loading="lazy" />
              ) : (
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-400">
                  <MousePointerClick size={20} />
                </div>
              )}
              <div className="min-w-0">
                <p className="font-black">
                  {mouvement.statut === 'sorti' ? 'Sorti' : 'Rentré'} · {formatDate(mouvement.date)}
                </p>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                  {mouvement.origine === 'photo' ? <Camera size={14} /> : <MousePointerClick size={14} />}
                  {mouvement.origine === 'photo' ? 'Depuis une photo' : 'Changement rapide'}
                </p>
                {mouvement.statut === 'sorti' && mouvement.dateRetour && (
                  <p className="text-sm font-bold text-emerald-700">Rentré le {formatDate(mouvement.dateRetour)}</p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
