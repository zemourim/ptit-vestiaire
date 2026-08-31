import { Plus, Users } from 'lucide-react';
import { useState } from 'react';
import { creerFamille } from '../firebase/useFamilles';

type Props = { userId: string; email: string; onCreated: () => void };

export function ConfigurationFamille({ userId, email, onCreated }: Props) {
  const [nom, setNom] = useState('');
  const [enfants, setEnfants] = useState(['']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!nom.trim() || enfants.every((item) => !item.trim())) { setError('Indique un nom de famille et au moins un enfant.'); return; }
    setBusy(true); setError(null);
    try { await creerFamille(userId, email, nom, enfants); onCreated(); }
    catch (caught) { setError(caught instanceof Error ? caught.message : 'Création impossible.'); }
    finally { setBusy(false); }
  }
  return <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-950"><form onSubmit={(event) => void submit(event)} className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-soft"><div><p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Première connexion</p><h1 className="mt-1 text-3xl font-black">Crée ta famille</h1><p className="mt-2 font-bold text-slate-500">Ajoute les enfants dont tu veux suivre les vêtements.</p></div><label className="block"><span className="font-black">Nom de la famille</span><input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Famille Martin" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold" /></label><fieldset><legend className="font-black">Enfants suivis</legend><div className="mt-2 space-y-2">{enfants.map((enfant, index) => <div key={index} className="flex gap-2"><input value={enfant} onChange={(event) => setEnfants((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Prénom" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold" />{index === enfants.length - 1 && <button type="button" onClick={() => setEnfants((items) => [...items, ''])} className="rounded-2xl bg-slate-100 px-3" aria-label="Ajouter un enfant"><Plus /></button>}</div>)}</div></fieldset>{error && <p className="rounded-2xl bg-rose-100 p-3 font-bold text-rose-700">{error}</p>}<button disabled={busy} className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:bg-slate-300">{busy ? 'Création...' : 'Créer ma famille'}</button><p className="flex items-center gap-2 text-sm font-bold text-slate-500"><Users size={16} /> Connecté avec {email}</p></form></main>;
}
