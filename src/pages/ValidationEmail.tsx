import { AlertTriangle, MailCheck } from 'lucide-react';
import { applyActionCode, reload } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from '../firebase/config';
import { PiedDePage } from '../components/PiedDePage';

export function ValidationEmail({ actionCode }: { actionCode: string }) {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function validate() {
      if (!auth) {
        setError('Firebase n’est pas configuré.');
        return;
      }
      try {
        await applyActionCode(auth, actionCode);
        if (auth.currentUser) {
          await reload(auth.currentUser);
          await auth.currentUser.getIdToken(true);
        }
        if (active) window.location.replace(window.location.origin);
      } catch {
        if (active) setError('Ce lien de vérification est invalide, expiré ou a déjà été utilisé.');
      }
    }

    void validate();
    return () => { active = false; };
  }, [actionCode]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#cffafe_0,#f8fafc_45%,#fff7ed_100%)] text-slate-950">
    <main className="grid min-h-[calc(100vh-8rem)] place-items-center p-6">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-6 text-center shadow-soft backdrop-blur">
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${error ? 'bg-rose-100 text-rose-700' : 'bg-cyan-100 text-cyan-800'}`}>
          {error ? <AlertTriangle size={30} /> : <MailCheck size={30} />}
        </div>
        <h1 className="mt-5 text-3xl font-black">{error ? 'Lien non valide' : 'Validation en cours...'}</h1>
        <p className="mt-3 font-bold text-slate-600">{error ?? 'Ton adresse email est en cours de vérification. Tu vas être redirigé automatiquement.'}</p>
        {error && <button type="button" onClick={() => window.location.replace(window.location.origin)} className="mt-6 w-full rounded-2xl bg-slate-950 px-5 py-4 font-black text-white">Retour à PtitVestiaire</button>}
      </section>
    </main>
    <PiedDePage />
    </div>
  );
}
