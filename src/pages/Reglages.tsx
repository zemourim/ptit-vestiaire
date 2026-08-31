import { Merge, Save } from 'lucide-react';
import { GestionFamille } from '../components/GestionFamille';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { allowedAdultEmails } from '../firebase/config';
import { useSettings } from '../firebase/useSettings';
import { fusionnerVetements, useVetements } from '../firebase/useVetements';

type Props = {
  userEmail: string;
  userId: string;
};

export function Reglages({ userEmail, userId }: Props) {
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

      <FusionDoublons />
      <GestionFamille userId={userId} />

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

/**
 * Administration : rattacher un doublon au bon vêtement.
 *
 * Les mouvements du doublon sont transférés vers le vêtement conservé, puis le
 * doublon est supprimé. Aucun historique n'est perdu.
 */
function FusionDoublons() {
  const { vetements, loading } = useVetements();
  const [sourceId, setSourceId] = useState('');
  const [cibleId, setCibleId] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const source = vetements.find((vetement) => vetement.id === sourceId) ?? null;
  const cible = vetements.find((vetement) => vetement.id === cibleId) ?? null;
  const memeFille = !source || !cible || source.fille === cible.fille;

  async function handleFusion() {
    if (!source || !cible) return;
    if (!window.confirm(`Fusionner « ${source.nom} » dans « ${cible.nom} » ? Le premier sera supprimé.`)) return;

    setBusy(true);
    setMessage(null);
    try {
      const deplaces = await fusionnerVetements(source.id, cible.id);
      setMessage(`${deplaces} mouvement(s) rattaché(s) à « ${cible.nom} ».`);
      setSourceId('');
      setCibleId('');
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : 'Fusion impossible.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black">Fusionner deux vêtements en doublon</h3>
      <p className="mt-2 text-sm font-bold text-slate-500">
        Le vêtement à supprimer cède tous ses mouvements à celui que tu conserves.
      </p>

      {loading ? (
        <p className="mt-4 font-bold text-slate-500">Chargement du catalogue...</p>
      ) : (
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-sm font-black text-slate-700">Doublon à supprimer</span>
            <select
              value={sourceId}
              onChange={(event) => setSourceId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-slate-950"
            >
              <option value="">Choisir…</option>
              {vetements.map((vetement) => (
                <option key={vetement.id} value={vetement.id}>
                  {vetement.fille} · {vetement.nom}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-black text-slate-700">Vêtement à conserver</span>
            <select
              value={cibleId}
              onChange={(event) => setCibleId(event.target.value)}
              className="mt-1 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold outline-none focus:ring-2 focus:ring-slate-950"
            >
              <option value="">Choisir…</option>
              {vetements
                .filter((vetement) => vetement.id !== sourceId)
                .map((vetement) => (
                  <option key={vetement.id} value={vetement.id}>
                    {vetement.fille} · {vetement.nom}
                  </option>
                ))}
            </select>
          </label>

          {!memeFille && (
            <p className="text-sm font-bold text-amber-700">Ces deux vêtements ne sont pas attribués à la même fille.</p>
          )}

          <button
            type="button"
            onClick={() => void handleFusion()}
            disabled={!source || !cible || busy}
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:bg-slate-300"
          >
            <Merge size={18} /> {busy ? 'Fusion...' : 'Fusionner'}
          </button>
          {message && <p className="text-sm font-bold text-slate-600">{message}</p>}
        </div>
      )}
    </section>
  );
}
