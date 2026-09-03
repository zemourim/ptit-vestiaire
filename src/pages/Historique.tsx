import { Camera, MousePointerClick } from 'lucide-react';
import { useMemo, useState } from 'react';
import { HistoriqueVetement } from '../components/HistoriqueVetement';
import { getFilleStyles } from '../lib/constants';
import { formatDate } from '../lib/dates';
import { useJournalMouvements } from '../firebase/useMouvements';
import { useVetements } from '../firebase/useVetements';
import type { Fille, Vetement } from '../types';

type Filter = Fille | 'Tout';

export function Historique({ enfants, premium }: { enfants: string[]; premium: boolean }) {
  const [filter, setFilter] = useState<Filter>('Tout');
  const { mouvements, loading, error } = useJournalMouvements(filter, 120, premium);
  const { vetements } = useVetements();
  const [detail, setDetail] = useState<Vetement | null>(null);

  const parId = useMemo(() => new Map(vetements.map((vetement) => [vetement.id, vetement])), [vetements]);

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Historique</p>
        <h2 className="mt-1 text-3xl font-black">Tous les mouvements</h2>
        <p className="mt-1 font-bold text-slate-500">Chaque sortie et chaque retour, du plus récent au plus ancien.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['Tout', ...enfants] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`shrink-0 rounded-full px-4 py-2 font-black ${filter === item ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {!premium && <p className="rounded-2xl bg-violet-50 p-3 text-sm font-bold text-violet-800">La formule gratuite affiche et conserve les 30 derniers jours. <a href="#reglages" className="font-black underline">Débloquer l’historique illimité</a></p>}

      {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement de l’historique...</p>}

      <ol className="space-y-3">
        {mouvements.map((mouvement) => {
          const vetement = parId.get(mouvement.vetementId) ?? null;
          return (
            <li key={mouvement.id}>
              <button
                type="button"
                onClick={() => vetement && setDetail(vetement)}
                disabled={!vetement}
                className="flex w-full items-center gap-3 rounded-3xl border border-slate-200 bg-white p-3 text-left shadow-sm disabled:cursor-default"
              >
                {mouvement.photoUrl ? (
                  <img src={mouvement.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" loading="lazy" />
                ) : (
                  <div className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-400">
                    <MousePointerClick size={20} />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-lg font-black capitalize">{vetement?.nom ?? 'Vêtement supprimé'}</p>
                  <p className={`text-sm font-bold ${getFilleStyles(mouvement.fille).text}`}>{mouvement.fille}</p>
                  <p className="mt-1 inline-flex items-center gap-1 text-sm font-bold text-slate-500">
                    {mouvement.origine === 'photo' ? <Camera size={14} /> : <MousePointerClick size={14} />}
                    {formatDate(mouvement.date)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
                    mouvement.statut === 'sorti' ? 'bg-slate-200 text-slate-700' : 'bg-emerald-100 text-emerald-700'
                  }`}
                >
                  {mouvement.statut === 'sorti' ? 'Sorti' : 'Rentré'}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {!loading && mouvements.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-center font-bold text-slate-500">Aucun mouvement enregistré.</p>
      )}

      {detail && <HistoriqueVetement vetement={detail} historiqueIllimite={premium} onClose={() => setDetail(null)} />}
    </section>
  );
}
