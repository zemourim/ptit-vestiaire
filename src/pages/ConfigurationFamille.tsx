import { KeyRound, LogOut, Plus, Trash2, Users } from 'lucide-react';
import { useState } from 'react';
import { creerFamille, rejoindreFamille } from '../firebase/useFamilles';

type Props = {
  userId: string;
  email: string;
  onCreated: () => void;
  onCancel: () => void | Promise<void>;
};

export function ConfigurationFamille({ userId, email, onCreated, onCancel }: Props) {
  const [mode, setMode] = useState<'creer' | 'rejoindre'>('creer');
  const [nom, setNom] = useState('');
  const [enfants, setEnfants] = useState(['']);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (mode === 'creer' && (!nom.trim() || enfants.every((item) => !item.trim()))) {
      setError('Indique un nom de famille et au moins un enfant.');
      return;
    }
    if (mode === 'rejoindre' && !code.trim()) {
      setError('Saisis le code partagé par le parent qui t’invite.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'creer') await creerFamille(userId, email, nom, enfants);
      else await rejoindreFamille(code, userId, email);
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : mode === 'creer' ? 'Création impossible.' : 'Impossible de rejoindre cette famille.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 p-6 text-slate-950">
      <form onSubmit={(event) => void submit(event)} className="w-full max-w-lg space-y-5 rounded-3xl bg-white p-6 shadow-soft">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-700">Première connexion</p>
            <h1 className="mt-1 text-3xl font-black">Configure ton accès</h1>
            <p className="mt-2 font-bold text-slate-500">Crée ta famille ou rejoins celle d’un autre parent.</p>
          </div>
          <button type="button" onClick={() => void onCancel()} disabled={busy} className="inline-flex shrink-0 items-center gap-2 rounded-2xl bg-slate-100 px-3 py-2 text-sm font-black text-slate-600 disabled:opacity-50" aria-label="Quitter l’inscription">
            <LogOut size={17} /> Quitter
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-2xl bg-slate-100 p-1">
          <button type="button" onClick={() => { setMode('creer'); setError(null); }} className={`rounded-xl px-3 py-3 text-sm font-black ${mode === 'creer' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>Créer une famille</button>
          <button type="button" onClick={() => { setMode('rejoindre'); setError(null); }} className={`rounded-xl px-3 py-3 text-sm font-black ${mode === 'rejoindre' ? 'bg-slate-950 text-white' : 'text-slate-600'}`}>Rejoindre</button>
        </div>

        {mode === 'creer' ? (
          <>
            <label className="block">
              <span className="font-black">Nom de la famille</span>
              <input value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Famille Martin" className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold" />
            </label>
            <fieldset>
              <legend className="font-black">Enfants suivis</legend>
              <div className="mt-2 space-y-2">
                {enfants.map((enfant, index) => (
                  <div key={index} className="flex gap-2">
                    <input value={enfant} onChange={(event) => setEnfants((items) => items.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} placeholder="Prénom" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold" />
                    <button type="button" onClick={() => setEnfants((items) => items.filter((_, itemIndex) => itemIndex !== index))} className="rounded-2xl bg-rose-50 px-3 text-rose-600" aria-label={`Supprimer la ligne ${index + 1}`} title="Supprimer cette ligne">
                      <Trash2 size={19} />
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => setEnfants((items) => [...items, ''])} className="inline-flex items-center gap-2 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-black text-slate-700">
                  <Plus size={18} /> Ajouter un enfant
                </button>
              </div>
            </fieldset>
          </>
        ) : (
          <label className="block">
            <span className="font-black">Code d’invitation</span>
            <span className="relative mt-2 block">
              <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={19} />
              <input value={code} onChange={(event) => setCode(event.target.value.toUpperCase())} placeholder="EXEMPLE123" autoCapitalize="characters" className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 font-black uppercase tracking-widest" />
            </span>
            <span className="mt-2 block text-sm font-bold text-slate-500">Demande ce code au parent déjà membre de la famille.</span>
          </label>
        )}

        {error && <p className="rounded-2xl bg-rose-100 p-3 font-bold text-rose-700">{error}</p>}
        <button disabled={busy} className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:bg-slate-300">
          {busy ? 'Validation...' : mode === 'creer' ? 'Créer ma famille' : 'Rejoindre la famille'}
        </button>
        <p className="flex items-center gap-2 text-sm font-bold text-slate-500"><Users size={16} /> Connecté avec {email}</p>
      </form>
    </main>
  );
}
