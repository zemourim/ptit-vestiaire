import { CheckCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CarteVetement } from '../components/CarteVetement';
import { FILLES } from '../lib/constants';
import { markManyReturned, markSortieReturned, useSorties } from '../firebase/useSorties';
import { useSettings } from '../firebase/useSettings';
import type { Fille } from '../types';

export function TableauDeBord() {
  const { sorties, loading, error } = useSorties({ onlySorties: true });
  const { settings } = useSettings();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);

  const byFille = useMemo(() => {
    return FILLES.reduce<Record<Fille, typeof sorties>>((acc, fille) => {
      acc[fille] = sorties.filter((sortie) => sortie.fille === fille);
      return acc;
    }, { Sanaa: [], Manelle: [] });
  }, [sorties]);

  async function returnSelected(ids = selectedIds) {
    setActionError(null);
    try {
      await markManyReturned(ids);
      setSelectedIds((current) => current.filter((id) => !ids.includes(id)));
    } catch {
      setActionError('Impossible de marquer ces vêtements comme revenus.');
    }
  }

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Tableau de bord</p>
          <h2 className="mt-1 text-3xl font-black">Vêtements encore sortis</h2>
        </div>
        {selectedIds.length > 0 && (
          <button
            type="button"
            onClick={() => void returnSelected()}
            className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 font-black text-white"
          >
            <CheckCheck size={18} /> Tout marquer revenu
          </button>
        )}
      </div>

      {(error || actionError) && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{actionError ?? error}</p>}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement des sorties...</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {FILLES.map((fille) => (
          <section key={fille} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">{fille}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 shadow-sm">{byFille[fille].length} sorti(s)</span>
            </div>
            {byFille[fille].length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white/75 p-6 text-center font-bold text-slate-500">Rien à surveiller pour {fille}.</p>
            ) : (
              <div className="space-y-4">
                {byFille[fille].map((sortie) => (
                  <CarteVetement
                    key={sortie.id}
                    sortie={sortie}
                    alertAfterDays={settings.alertAfterDays}
                    selected={selectedIds.includes(sortie.id)}
                    onSelectedChange={(checked) => {
                      setSelectedIds((current) => (checked ? [...current, sortie.id] : current.filter((id) => id !== sortie.id)));
                    }}
                    onMarkReturned={() => void markSortieReturned(sortie.id)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>
    </section>
  );
}
