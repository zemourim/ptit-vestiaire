import { LogOut, MailCheck, RefreshCw, Send } from 'lucide-react';
import { useState } from 'react';

type Props = {
  email: string;
  onResend: () => Promise<void>;
  onRefresh: () => Promise<boolean>;
  onLogout: () => Promise<void>;
};

export function VerificationEmail({ email, onResend, onRefresh, onLogout }: Props) {
  const [busy, setBusy] = useState<'resend' | 'refresh' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function resend() {
    setBusy('resend');
    setError(null);
    setMessage(null);
    try {
      await onResend();
      setMessage('Un nouvel email de vérification vient d’être envoyé.');
    } catch {
      setError('Impossible de renvoyer l’email pour le moment. Réessaie dans quelques minutes.');
    } finally {
      setBusy(null);
    }
  }

  async function refresh() {
    setBusy('refresh');
    setError(null);
    setMessage(null);
    try {
      const verified = await onRefresh();
      if (!verified) setMessage('L’adresse n’est pas encore vérifiée. Ouvre le lien reçu par email puis réessaie.');
    } catch {
      setError('Impossible de vérifier le statut de l’adresse pour le moment.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[radial-gradient(circle_at_top,#cffafe_0,#f8fafc_45%,#fff7ed_100%)] p-6 text-slate-950">
      <section className="w-full max-w-md rounded-[2rem] border border-white/80 bg-white/90 p-6 text-center shadow-soft backdrop-blur">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-cyan-100 text-cyan-800"><MailCheck size={30} /></div>
        <p className="mt-5 text-sm font-black uppercase tracking-[0.22em] text-cyan-700">Vérification email</p>
        <h1 className="mt-2 text-3xl font-black">Consulte ta boîte mail</h1>
        <p className="mt-3 font-bold text-slate-600">Un lien de vérification a été envoyé à :</p>
        <p className="mt-1 break-all font-black text-slate-950">{email}</p>
        <p className="mt-3 text-sm font-bold text-slate-500">Ouvre le lien reçu, puis reviens ici pour continuer.</p>

        {(message || error) && <p className={`mt-5 rounded-2xl p-3 text-sm font-bold ${error ? 'bg-rose-100 text-rose-700' : 'bg-cyan-50 text-cyan-800'}`}>{error ?? message}</p>}

        <button type="button" onClick={() => void refresh()} disabled={busy !== null} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:bg-slate-300">
          <RefreshCw size={18} /> {busy === 'refresh' ? 'Vérification...' : 'J’ai vérifié mon adresse'}
        </button>
        <button type="button" onClick={() => void resend()} disabled={busy !== null} className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-cyan-100 px-5 py-4 font-black text-cyan-900 disabled:opacity-50">
          <Send size={18} /> {busy === 'resend' ? 'Envoi...' : 'Renvoyer l’email'}
        </button>
        <button type="button" onClick={() => void onLogout()} disabled={busy !== null} className="mt-3 inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-black text-slate-500 disabled:opacity-50">
          <LogOut size={17} /> Utiliser une autre adresse
        </button>
      </section>
    </main>
  );
}
