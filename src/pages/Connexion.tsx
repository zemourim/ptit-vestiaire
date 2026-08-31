import { LockKeyhole, Mail } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import type { useAuth } from '../firebase/useAuth';

type Props = {
  auth: ReturnType<typeof useAuth>;
  firebaseReady: boolean;
};

export function Connexion({ auth, firebaseReady }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [mode, setMode] = useState<'connexion' | 'inscription'>('connexion');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    try {
      if (mode === 'connexion') await auth.signIn(email, password);
      else await auth.signUp(email, password);
    } catch {
      setLocalError('Vérifie ton email et ton mot de passe.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#cffafe_0,#f8fafc_45%,#fff7ed_100%)] px-4 py-10 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="mb-8 text-center">
          <p className="text-sm font-black uppercase tracking-[0.24em] text-slate-500">PtitVestiaire</p>
          <h1 className="mt-2 text-4xl font-black">{mode === 'connexion' ? 'Connexion' : 'Créer un compte'}</h1>
          <p className="mt-3 font-bold text-slate-600">{mode === 'connexion' ? 'Connecte-toi pour accéder à ta famille.' : 'Crée ton compte parent puis configure ta famille.'}</p>
        </div>

        {!firebaseReady && (
          <div className="mb-4 rounded-2xl bg-amber-100 p-4 text-sm font-bold text-amber-900">
            Firebase n’est pas encore configuré. Copie `env.example` vers `.env` et remplis les valeurs Vite.
          </div>
        )}

        <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block">
            <span className="text-sm font-black text-slate-700">Email</span>
            <span className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <Mail size={18} className="text-slate-500" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">Mot de passe</span>
            <span className="mt-2 flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <LockKeyhole size={18} className="text-slate-500" />
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full bg-transparent outline-none"
              />
            </span>
          </label>

          {(auth.error || localError) && <p className="rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{localError ?? auth.error}</p>}

          <button
            type="submit"
            disabled={submitting || !firebaseReady}
            className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {submitting ? 'Patiente...' : mode === 'connexion' ? 'Entrer' : 'Créer mon compte'}
          </button>
        </form>
        <button type="button" onClick={() => { setMode(mode === 'connexion' ? 'inscription' : 'connexion'); setLocalError(null); }} className="mt-4 w-full text-sm font-black text-cyan-700">
          {mode === 'connexion' ? 'Nouveau parent ? Créer un compte' : 'J’ai déjà un compte : me connecter'}
        </button>
      </section>
    </main>
  );
}
