import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CarteVetement } from '../components/CarteVetement';
import { HistoriqueVetement } from '../components/HistoriqueVetement';
import { FILLES } from '../lib/constants';
import { normaliserNom } from '../lib/normalize';
import { basculerStatut, definirActif, useVetements } from '../firebase/useVetements';
import { useSettings } from '../firebase/useSettings';
import type { Fille, Vetement } from '../types';

type FiltreFille = Fille | 'Toutes';

export function GardeRobe() {
  const { vetements, loading, error } = useVetements();
  const { settings } = useSettings();
  const [filtre, setFiltre] = useState<FiltreFille>('Toutes');
  const [recherche, setRecherche] = useState('');
  const [voirArchives, setVoirArchives] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Vetement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const visibles = useMemo(() => {
    const cible = normaliserNom(recherche);
    return vetements.filter((vetement) => {
      if (!voirArchives && !vetement.actif) return false;
      if (filtre !== 'Toutes' && vetement.fille !== filtre) return false;
      if (cible && !vetement.nomNormalise.includes(cible)) return false;
      return true;
    });
  }, [vetements, filtre, recherche, voirArchives]);

  const parFille = useMemo(
    () =>
      FILLES.reduce<Record<Fille, Vetement[]>>(
        (acc, fille) => {
          acc[fille] = visibles.filter((vetement) => vetement.fille === fille);
          return acc;
        },
        { Sanaa: [], Manelle: [] }
      ),
    [visibles]
  );

  /** Un clic = un mouvement `bouton_rapide`. La liste se met à jour via onSnapshot, sans rechargement. */
  async function basculer(vetement: Vetement) {
    setActionError(null);
    setBusyId(vetement.id);
    try {
      await basculerStatut(vetement);
    } catch {
      setActionError(`Impossible de changer le statut de « ${vetement.nom} ».`);
    } finally {
      setBusyId(null);
    }
  }

  async function archiver(vetement: Vetement) {
    setActionError(null);
    try {
      await definirActif(vetement.id, !vetement.actif);
    } catch {
      setActionError(`Impossible d’archiver « ${vetement.nom} ».`);
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Garde-robe</p>
        <h2 className="mt-1 text-3xl font-black">Catalogue des vêtements</h2>
        <p className="mt-1 font-bold text-slate-500">
          Un clic sur « Marquer rentré » ou « Marquer ressorti » met le statut à jour sans reprendre de photo.
        </p>
      </div>

      <div className="space-y-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['Toutes', ...FILLES] as FiltreFille[]).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFiltre(item)}
              className={`shrink-0 rounded-full px-4 py-2 font-black ${filtre === item ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'}`}
            >
              {item}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <Search size={18} className="text-slate-400" />
          <input
            value={recherche}
            onChange={(event) => setRecherche(event.target.value)}
            placeholder="Chercher un vêtement"
            className="min-w-0 flex-1 bg-transparent font-bold outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
          <input
            type="checkbox"
            checked={voirArchives}
            onChange={(event) => setVoirArchives(event.target.checked)}
            className="h-5 w-5 rounded border-slate-300"
          />
          Afficher aussi les vêtements archivés
        </label>
      </div>

      {(error || actionError) && (
        <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{actionError ?? error}</p>
      )}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement de la garde-robe...</p>}

      {!loading && visibles.length === 0 && (
        <p className="rounded-3xl bg-white p-6 text-center font-bold text-slate-500">
          Aucun vêtement au catalogue. Enregistre une sortie avec photo pour le remplir.
        </p>
      )}

      {FILLES.filter((fille) => parFille[fille].length > 0).map((fille) => (
        <section key={fille} className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-black">{fille}</h3>
            <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 shadow-sm">
              {parFille[fille].filter((vetement) => vetement.statutActuel === 'sorti').length} sorti(s) sur {parFille[fille].length}
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {parFille[fille].map((vetement) => (
              <CarteVetement
                key={vetement.id}
                vetement={vetement}
                alertAfterDays={settings.alertAfterDays}
                busy={busyId === vetement.id}
                onToggleStatut={() => void basculer(vetement)}
                onVoirHistorique={() => setDetail(vetement)}
                onToggleActif={() => void archiver(vetement)}
              />
            ))}
          </div>
        </section>
      ))}

      {detail && <HistoriqueVetement vetement={detail} onClose={() => setDetail(null)} />}
    </section>
  );
}
