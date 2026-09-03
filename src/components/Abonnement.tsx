import { CreditCard, Crown, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { ouvrirCheckout, ouvrirPortailStripe } from '../firebase/useSubscription';
import { planFamille, type Famille } from '../types';

export function Abonnement({ famille, userId }: { famille: Famille; userId: string }) {
  const premium = planFamille(famille) === 'payant';
  const owner = famille.proprietaireUserId === userId;
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(frequence: 'mensuel' | 'annuel') {
    setBusy(frequence); setError(null);
    try { await ouvrirCheckout(famille.id, frequence); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Paiement indisponible.'); setBusy(null); }
  }

  async function portal() {
    setBusy('portail'); setError(null);
    try { await ouvrirPortailStripe(famille.id); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Portail indisponible.'); setBusy(null); }
  }

  return (
    <section id="abonnement" className="rounded-3xl border border-violet-200 bg-gradient-to-br from-white to-violet-50 p-5 shadow-sm">
      <p className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-[0.18em] text-violet-700"><Crown size={18} /> Abonnement</p>
      <h3 className="mt-2 text-2xl font-black">Formule {premium ? 'Payante' : 'Gratuite'}</h3>
      {!owner && <p className="mt-2 font-bold text-slate-600">Seul le propriétaire de la famille peut gérer la facturation.</p>}
      {owner && (
      <>
      {premium ? (
        <>
          <p className="mt-2 font-bold text-slate-600">Abonnement {famille.frequencePaiement ?? ''} · statut {famille.statutAbonnement ?? 'actif'}.</p>
          <button type="button" onClick={() => void portal()} disabled={Boolean(busy)} className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:bg-slate-300"><ExternalLink size={18} /> Gérer mon abonnement</button>
        </>
      ) : (
        <>
          <p className="mt-2 font-bold text-slate-600">Débloquez les enfants, vêtements, membres et l’historique illimités, ainsi que la reconnaissance IA.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <button type="button" onClick={() => void checkout('annuel')} disabled={Boolean(busy)} className="rounded-2xl bg-slate-950 px-5 py-4 text-left font-black text-white disabled:bg-slate-300"><CreditCard size={18} className="mr-2 inline" /> 24,99 € / an<span className="mt-1 block text-xs text-slate-300">Le tarif le plus avantageux</span></button>
            <button type="button" onClick={() => void checkout('mensuel')} disabled={Boolean(busy)} className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-left font-black disabled:text-slate-300"><CreditCard size={18} className="mr-2 inline" /> 2,99 € / mois<span className="mt-1 block text-xs text-slate-500">Sans engagement annuel</span></button>
          </div>
        </>
      )}
      {busy && <p className="mt-3 text-sm font-bold text-slate-500">Redirection sécurisée vers Stripe…</p>}
      {error && <p className="mt-3 rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{error}</p>}
      </>
      )}
    </section>
  );
}
