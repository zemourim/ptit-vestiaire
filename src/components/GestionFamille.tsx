import { Copy, Plus, Save, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { creerInvitation, lireFamille, modifierEnfants } from '../firebase/useFamilles';
import { familleIdCourante } from '../firebase/familleCourante';
import type { Famille } from '../types';

export function GestionFamille({ userId }: { userId: string }) {
  const [famille, setFamille] = useState<Famille | null>(null);
  const [enfants, setEnfants] = useState<string[]>([]);
  const [code, setCode] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const familleId = familleIdCourante();
  useEffect(() => { if (familleId) void lireFamille(familleId).then((value) => { setFamille(value); setEnfants(value?.enfants ?? []); }); }, [familleId]);
  async function save() { if (!familleId) return; await modifierEnfants(familleId, enfants); setMessage('Enfants enregistrés.'); }
  async function invite() { if (!familleId) return; const value = await creerInvitation(familleId, userId); setCode(value); setMessage('Code créé, partage-le avec l’autre parent.'); }
  if (!famille) return null;
  return <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><h3 className="text-lg font-black">{famille.nom}</h3><p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-500"><Users size={16} /> Gestion de la famille</p><label className="mt-4 block"><span className="font-black">Enfants suivis</span><div className="mt-2 space-y-2">{enfants.map((enfant, index) => <input key={index} value={enfant} onChange={(event) => setEnfants((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} className="block w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold" />)}<button type="button" onClick={() => setEnfants((items) => [...items, ''])} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black"><Plus size={16} /> Ajouter un enfant</button></div></label><div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => void save()} className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 font-black text-white"><Save size={17} /> Enregistrer</button><button type="button" onClick={() => void invite()} className="inline-flex items-center gap-2 rounded-2xl bg-cyan-100 px-4 py-3 font-black text-cyan-800"><Users size={17} /> Inviter un parent</button></div>{code && <div className="mt-4 flex items-center justify-between rounded-2xl bg-emerald-50 p-4"><span><span className="block text-xs font-black uppercase text-emerald-700">Code d’invitation</span><strong className="text-2xl tracking-widest text-emerald-900">{code}</strong></span><button type="button" onClick={() => void navigator.clipboard?.writeText(code)} className="rounded-xl bg-white p-2 text-emerald-700" aria-label="Copier le code"><Copy size={18} /></button></div>}{message && <p className="mt-3 text-sm font-bold text-slate-600">{message}</p>}</section>;
}
