import { CarteVetement } from '../components/CarteVetement';
import { FILLES } from '../lib/constants';
import { useSettings } from '../firebase/useSettings';
import { useSorties } from '../firebase/useSorties';
import type { Fille } from '../types';
import { useState } from 'react';

type Filter = Fille | 'Toutes';

export function Historique() {
  const [filter, setFilter] = useState<Filter>('Toutes');
  const { sorties, loading, error } = useSorties({ fille: filter });
  const { settings } = useSettings();

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Historique</p>
        <h2 className="mt-1 text-3xl font-black">Toutes les sorties</h2>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['Toutes', ...FILLES] as Filter[]).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setFilter(item)}
            className={`rounded-full px-4 py-2 font-black ${filter === item ? 'bg-slate-950 text-white' : 'bg-white text-slate-600'}`}
          >
            {item}
          </button>
        ))}
      </div>

      {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement de l’historique...</p>}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorties.map((sortie) => (
          <CarteVetement key={sortie.id} sortie={sortie} alertAfterDays={settings.alertAfterDays} />
        ))}
      </div>

      {!loading && sorties.length === 0 && <p className="rounded-3xl bg-white p-6 text-center font-bold text-slate-500">Aucune sortie enregistrée.</p>}
    </section>
  );
}
