import { Crown, History, Loader2, LogIn, Shirt, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Abonnement } from '../components/Abonnement';
import { HistoriqueVetement } from '../components/HistoriqueVetement';
import { getFilleStyles } from '../lib/constants';
import { daysSince, formatDate } from '../lib/dates';
import { basculerStatut, useVetements } from '../firebase/useVetements';
import { useSettings } from '../firebase/useSettings';
import type { Famille, Fille, Vetement } from '../types';

type Props = { enfants: string[]; famille: Famille; userId: string };

export function TableauDeBord({ enfants, famille, userId }: Props) {
  const premium = famille.plan === 'payant';
  const owner = famille.proprietaireUserId === userId;
  const { vetements, loading, error } = useVetements();
  const { settings } = useSettings();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [detail, setDetail] = useState<Vetement | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const sortis = useMemo(
    () => vetements.filter((vetement) => vetement.actif && !vetement.bloqueParPlan && vetement.statutActuel === 'sorti'),
    [vetements]
  );

  const byFille = useMemo(
    () =>
      enfants.reduce<Record<Fille, Vetement[]>>(
        (acc, fille) => {
          acc[fille] = sortis
            .filter((vetement) => vetement.fille === fille)
            .sort((a, b) => (a.dateDernierMouvement?.toMillis() ?? 0) - (b.dateDernierMouvement?.toMillis() ?? 0));
          return acc;
        },
        {}
      ),
    [sortis, enfants]
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
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Aperçu</p>
        <h2 className="mt-1 text-3xl font-black">Aperçu des vêtements</h2>
        <p className="mt-1 font-bold text-slate-500">Du plus ancien au plus récent. Marque un vêtement rentré directement depuis sa vignette.</p>
      </div>

      {!premium && (
        <section className="flex flex-col gap-4 rounded-3xl border border-violet-200 bg-gradient-to-r from-violet-50 to-cyan-50 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 font-black text-violet-800"><Crown size={19} /> Formule gratuite</p>
            <p className="mt-1 text-sm font-bold text-slate-600">Débloquez la reconnaissance IA et les enfants, vêtements, membres et l’historique illimités.</p>
          </div>
          {owner ? (
            <button type="button" onClick={() => setUpgradeOpen(true)} className="shrink-0 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">Passer à la formule payante</button>
          ) : (
            <p className="shrink-0 text-sm font-black text-violet-800">Le propriétaire peut débloquer la formule.</p>
          )}
        </section>
      )}

      {(error || actionError) && (
        <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{actionError ?? error}</p>
      )}
      {loading && <p className="rounded-2xl bg-white p-4 font-bold text-slate-600">Chargement du catalogue...</p>}

      <div className="grid gap-5 lg:grid-cols-2">
        {enfants.map((fille) => (
          <section key={fille} className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className={`text-2xl font-black ${getFilleStyles(fille).text}`}>{fille}</h3>
              <span className="rounded-full bg-white px-3 py-1 text-sm font-black text-slate-600 shadow-sm">
                {byFille[fille].length} sorti(s)
              </span>
            </div>
            {byFille[fille].length === 0 ? (
              <p className="rounded-3xl border border-dashed border-slate-300 bg-white/75 p-6 text-center font-bold text-slate-500">
                Rien à surveiller pour {fille}.
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {byFille[fille].map((vetement) => (
                  <article key={vetement.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    {vetement.photoReference ? (
                      <img src={vetement.photoReference} alt={vetement.nom} className="h-28 w-full object-cover" loading="lazy" />
                    ) : (
                      <div className="grid h-28 place-items-center bg-slate-100 text-slate-400"><Shirt size={28} /></div>
                    )}
                    <div className="p-3">
                      <p className="truncate font-black capitalize" title={vetement.nom}>{vetement.nom}</p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {vetement.dateDernierMouvement ? `Sorti le ${formatDate(vetement.dateDernierMouvement)}` : 'Date inconnue'}
                      </p>
                      {vetement.dateDernierMouvement && <p className={`text-xs font-black ${daysSince(vetement.dateDernierMouvement) > settings.alertAfterDays ? 'text-rose-600' : 'text-slate-500'}`}>Depuis {daysSince(vetement.dateDernierMouvement)} jour(s)</p>}
                      <div className="mt-3 grid gap-2">
                        <button type="button" onClick={() => void marquerRentre(vetement)} disabled={busyId === vetement.id} className="inline-flex items-center justify-center gap-1 rounded-xl bg-emerald-600 px-2 py-2 text-xs font-black text-white disabled:bg-emerald-300">
                          {busyId === vetement.id ? <Loader2 size={14} className="animate-spin" /> : <LogIn size={14} />} Rentré
                        </button>
                        <button type="button" onClick={() => setDetail(vetement)} className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-2 py-2 text-xs font-black text-slate-700"><History size={14} /> Historique</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        ))}
      </div>

      {detail && <HistoriqueVetement vetement={detail} historiqueIllimite={premium} onClose={() => setDetail(null)} />}
      {upgradeOpen && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-slate-950/50 p-0 md:items-center md:p-6" onClick={() => setUpgradeOpen(false)}>
          <div role="dialog" aria-modal="true" aria-label="Choisir une formule payante" className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-white p-4 shadow-xl md:rounded-3xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-2 flex justify-end">
              <button type="button" onClick={() => setUpgradeOpen(false)} className="rounded-full bg-slate-100 p-2 text-slate-600" aria-label="Fermer"><X size={19} /></button>
            </div>
            <Abonnement famille={famille} userId={userId} />
          </div>
        </div>
      )}
    </section>
  );
}
