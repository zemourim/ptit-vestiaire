import { useMemo, useState } from 'react';
import { CarteVetement } from '../components/CarteVetement';
import { HistoriqueVetement } from '../components/HistoriqueVetement';
import { FILLES } from '../lib/constants';
import { basculerStatut, useVetements } from '../firebase/useVetements';
import { useSettings } from '../firebase/useSettings';
import type { Fille, Vetement } from '../types';

export function TableauDeBord() {
  const { vetements, loading, error } = useVetements();
  const { settings } = useSettings();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Vetement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const sortis = useMemo(
    () => vetements.filter((vetement) => vetement.actif && vetement.statutActuel === 'sorti'),
    [vetements]
  );

  const byFille = useMemo(
    () =>
      FILLES.reduce<Record<Fille, Vetement[]>>(
        (acc, fille) => {
          acc[fille] = sortis
            .filter((vetement) => vetement.fille === fille)
            .sort((a, b) => (a.dateDernierMouvement?.toMillis() ?? 0) - (b.dateDernierMouvement?.toMillis() ?? 0));
          return acc;
        },
        { Sanaa: [], Manelle: [] }
      ),
    [sortis]
  );

  async function marquerRentre(vetement: Vetement) {
    setActionError(null);
    setBusyId(vetement.id);
    try {
      await basculerStatut(vetement);
    } catch {
      setActionError(`Impossible de mettre à jour « ${vetement.nom} ».`);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Tableau de bord</p>
        <h2 className="mt-1 text-3xl font-black">Vêtements encore sortis</h2>
        <p className="mt-1 font-bold text-slate-500">Du plus ancien au plus récent. Clique sur « Historique » pour voir toutes les sorties d’un vêtement.</p>
      </div>

      {(error || actionError) && (
        <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{actionError ?? error}</p>
      )}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement du catalogue...</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {FILLES.map((fille) => (
          <section key={fille} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-2xl font-black">{fille}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 shadow-sm">
                {byFille[fille].length} sorti(s)
              </span>
            </div>
            {byFille[fille].length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white/75 p-6 text-center font-bold text-slate-500">
                Rien à surveiller pour {fille}.
              </p>
            ) : (
              <div className="space-y-4">
                {byFille[fille].map((vetement) => (
                  <CarteVetement
                    key={vetement.id}
                    vetement={vetement}
                    alertAfterDays={settings.alertAfterDays}
                    busy={busyId === vetement.id}
                    onToggleStatut={() => void marquerRentre(vetement)}
                    onVoirHistorique={() => setDetail(vetement)}
                  />
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {detail && <HistoriqueVetement vetement={detail} onClose={() => setDetail(null)} />}
    </section>
  );
}
