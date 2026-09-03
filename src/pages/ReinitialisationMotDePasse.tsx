import { AlertTriangle, CheckCircle2, KeyRound } from 'lucide-react';
import { confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import type { FormEvent } from 'react';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';

export function ReinitialisationMotDePasse({ actionCode }: { actionCode: string }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function checkCode() {
      if (!auth) {
        setError('Firebase n’est pas configuré.');
        setChecking(false);
        return;
      }
      try {
        const accountEmail = await verifyPasswordResetCode(auth, actionCode);
        if (active) setEmail(accountEmail);
      } catch {
        if (active) setError('Ce lien est invalide, expiré ou a déjà été utilisé. Demande un nouveau lien depuis la page de connexion.');
      } finally {
        if (active) setChecking(false);
      }
    }

    void checkCode();
    return () => { active = false; };
  }, [actionCode]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!auth) return;
    setError(null);
    if (password.length < 6) {
      setError('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (password !== confirmation) {
      setError('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setSubmitting(true);
    try {
      await confirmPasswordReset(auth, actionCode, password);
      setSuccess(true);
    } catch {
      setError('La réinitialisation a échoué. Le lien a peut-être expiré ; demande un nouveau lien.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#cffafe_0,#f8fafc_45%,#fff7ed_100%)] p-6 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft backdrop-blur">
        <div className="text-center">
          <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${error ? 'bg-rose-100 text-rose-700' : success ? 'bg-emerald-100 text-emerald-700' : 'bg-cyan-100 text-cyan-800'}`}>
            {error ? <AlertTriangle size={30} /> : success ? <CheckCircle2 size={30} /> : <KeyRound size={30} />}
          </div>
          <h1 className="mt-5 text-3xl font-black">{success ? 'Mot de passe modifié' : 'Nouveau mot de passe'}</h1>
          {!checking && email && !success && <p className="mt-2 font-bold text-slate-600">Pour {email}</p>}
        </div>

        {checking ? (
          <p className="mt-6 text-center font-bold text-slate-600">Vérification du lien...</p>
        ) : success ? (
          <button type="button" onClick={() => window.location.replace(window.location.origin)} className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">
            Se connecter
          </button>
        ) : error && !email ? (
          <>
            <p className="mt-5 rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>
            <button type="button" onClick={() => window.location.replace(window.location.origin)} className="mt-4 w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">Retour à la connexion</button>
          </>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
            <label className="block">
              <span className="text-sm font-black text-slate-700">Nouveau mot de passe</span>
              <input type="password" autoComplete="new-password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-950" />
            </label>
            <label className="block">
              <span className="text-sm font-black text-slate-700">Confirmer le mot de passe</span>
              <input type="password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-950" />
            </label>
            {error && <p className="rounded-2xl bg-rose-100 p-3 text-sm font-bold text-rose-700">{error}</p>}
            <button type="submit" disabled={submitting} className="w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:bg-slate-300">{submitting ? 'Modification...' : 'Enregistrer le nouveau mot de passe'}</button>
          </form>
        )}
      </section>
    </main>
  );
}
