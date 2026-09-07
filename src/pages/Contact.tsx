import { CheckCircle2, Send } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { PiedDePage } from '../components/PiedDePage';
import { envoyerMessageContact } from '../firebase/contact';

export function Contact() {
  const [form, setForm] = useState({ nom: '', email: '', sujet: 'Question générale', message: '', website: '' });
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError(null);
    try {
      await envoyerMessageContact(form);
      setSent(true);
      setForm({ nom: '', email: '', sujet: 'Question générale', message: '', website: '' });
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Le message n’a pas pu être envoyé. Réessaie plus tard.');
    } finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#cffafe_0,#f8fafc_34%,#fff7ed_100%)] text-slate-950">
      <header className="border-b border-white/70 bg-white/85 backdrop-blur"><div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4"><a href="#" className="font-black">PtitVestiaire</a><a href="#" className="rounded-2xl bg-slate-100 px-4 py-2 text-sm font-black">Retour</a></div></header>
      <main className="mx-auto max-w-3xl px-4 py-10">
        <section className="rounded-[2rem] border border-white/80 bg-white/90 p-6 shadow-soft md:p-10">
          <p className="text-sm font-black uppercase tracking-[0.22em] text-cyan-800">Nous écrire</p>
          <h1 className="mt-2 text-4xl font-black">Contact</h1>
          <p className="mt-3 font-bold leading-7 text-slate-600">Une question sur l’application, votre abonnement ou vos données ? Envoyez-nous un message avec ce formulaire.</p>

          {sent ? <div className="mt-8 rounded-3xl bg-emerald-50 p-6 text-emerald-800"><CheckCircle2 size={28} /><h2 className="mt-3 text-xl font-black">Message envoyé</h2><p className="mt-1 font-bold">Nous vous répondrons à l’adresse indiquée dans le formulaire.</p><button type="button" onClick={() => setSent(false)} className="mt-5 rounded-2xl bg-emerald-700 px-5 py-3 font-black text-white">Envoyer un autre message</button></div> : (
            <form onSubmit={(event) => void submit(event)} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Nom"><input required minLength={2} maxLength={100} autoComplete="name" value={form.nom} onChange={(event) => setForm((value) => ({ ...value, nom: event.target.value }))} className="input-contact" /></Field>
                <Field label="Adresse e-mail"><input required type="email" maxLength={320} autoComplete="email" value={form.email} onChange={(event) => setForm((value) => ({ ...value, email: event.target.value }))} className="input-contact" /></Field>
              </div>
              <Field label="Sujet"><select value={form.sujet} onChange={(event) => setForm((value) => ({ ...value, sujet: event.target.value }))} className="input-contact"><option>Question générale</option><option>Aide avec mon compte</option><option>Abonnement et paiement</option><option>Confidentialité et données</option><option>Signaler un problème</option></select></Field>
              <Field label="Message"><textarea required minLength={10} maxLength={4000} rows={7} value={form.message} onChange={(event) => setForm((value) => ({ ...value, message: event.target.value }))} className="input-contact resize-y" /></Field>
              <label className="hidden" aria-hidden="true">Site web<input tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => setForm((value) => ({ ...value, website: event.target.value }))} /></label>
              <label className="flex items-start gap-3 text-sm font-bold text-slate-600"><input required type="checkbox" className="mt-1 h-4 w-4" /><span>J’accepte que les informations saisies soient utilisées pour répondre à ma demande. Consultez la <a href="#confidentialite" className="font-black text-cyan-800 underline">politique de confidentialité</a>.</span></label>
              {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}
              <button disabled={busy} className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-4 font-black text-white disabled:bg-slate-300"><Send size={18} /> {busy ? 'Envoi…' : 'Envoyer le message'}</button>
            </form>
          )}
        </section>
      </main>
      <PiedDePage />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="font-black text-slate-700">{label}</span><span className="mt-2 block">{children}</span></label>;
}
