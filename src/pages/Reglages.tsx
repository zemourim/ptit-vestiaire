import { Save } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { allowedAdultEmails } from '../firebase/config';
import { useSettings } from '../firebase/useSettings';

type Props = {
  userEmail: string;
};

export function Reglages({ userEmail }: Props) {
  const { settings, error, updateSettings } = useSettings();
  const [alertAfterDays, setAlertAfterDays] = useState(settings.alertAfterDays);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    try {
      await updateSettings({ alertAfterDays: Math.max(1, alertAfterDays) });
      setMessage('Réglages enregistrés.');
    } catch {
      setMessage('Impossible d’enregistrer les réglages.');
    }
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Réglages</p>
        <h2 className="mt-1 text-3xl font-black">Préférences familiales</h2>
      </div>

      <form className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm" onSubmit={(event) => void handleSubmit(event)}>
        <label className="block">
          <span className="text-sm font-black text-slate-700">Alerte rouge après</span>
          <span className="mt-2 flex items-center gap-3">
            <input
              type="number"
              min={1}
              max={60}
              value={alertAfterDays}
              onChange={(event) => setAlertAfterDays(Number(event.target.value))}
              className="w-28 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-black outline-none focus:ring-2 focus:ring-slate-950"
            />
            <span className="font-bold text-slate-600">jours sans retour</span>
          </span>
        </label>

        <button type="submit" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white">
          <Save size={18} /> Enregistrer
        </button>
        {(message || error) && <p className="mt-3 text-sm font-bold text-slate-600">{message ?? error}</p>}
      </form>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black">Accès adulte</h3>
        <p className="mt-2 font-bold text-slate-600">Connecté avec {userEmail || 'un compte Firebase'}.</p>
        <p className="mt-2 text-sm font-bold text-slate-500">
          Comptes autorisés : {allowedAdultEmails.length > 0 ? allowedAdultEmails.join(', ') : 'tous les comptes créés dans Firebase Authentication'}.
        </p>
      </section>
    </section>
  );
}
