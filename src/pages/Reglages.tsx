import { KeyRound, Merge, Save } from 'lucide-react';
import { GestionFamille } from '../components/GestionFamille';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { useSettings } from '../firebase/useSettings';
import { fusionnerVetements, useVetements } from '../firebase/useVetements';

type Props = {
  userEmail: string;
  userId: string;
  hasPasswordProvider: boolean;
  onChangePassword: (currentPassword: string, newPassword: string) => Promise<void>;
};

export function Reglages({ userEmail, userId, hasPasswordProvider, onChangePassword }: Props) {
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
        {hasPasswordProvider ? (
          <PasswordForm onChangePassword={onChangePassword} />
        ) : (
          <p className="mt-3 text-sm font-bold text-slate-500">Ce compte utilise Google. Son mot de passe se gère directement dans le compte Google.</p>
        )}
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <h3 className="text-lg font-black">Informations et confidentialité</h3>
        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm font-black text-cyan-800">
          <a href="#a-propos" className="underline">Qui sommes-nous ?</a>
          <a href="#faq" className="underline">FAQ</a>
          <a href="#cgu" className="underline">Conditions d’utilisation</a>
          <a href="#confidentialite" className="underline">Confidentialité</a>
          <a href="#cookies" className="underline">Cookies</a>
          <a href="#mentions-legales" className="underline">Mentions légales</a>
        </div>
      </section>
    </section>
  );
}

function PasswordForm({ onChangePassword }: { onChangePassword: Props['onChangePassword'] }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    if (newPassword.length < 6) {
      setMessage('Le nouveau mot de passe doit contenir au moins 6 caractères.');
      return;
    }
    if (newPassword !== confirmation) {
      setMessage('Les deux nouveaux mots de passe ne correspondent pas.');
      return;
    }

    setBusy(true);
    try {
      await onChangePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmation('');
      setMessage('Mot de passe modifié.');
    } catch {
      setMessage('Mot de passe actuel incorrect ou session trop ancienne. Réessaie.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mt-5 space-y-3 border-t border-slate-100 pt-5" onSubmit={(event) => void handlePassword(event)}>
      <h4 className="inline-flex items-center gap-2 font-black"><KeyRound size={18} /> Modifier mon mot de passe</h4>
      <input aria-label="Mot de passe actuel" type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} placeholder="Mot de passe actuel" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-950" />
      <input aria-label="Nouveau mot de passe" type="password" autoComplete="new-password" required minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} placeholder="Nouveau mot de passe" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-950" />
      <input aria-label="Confirmation du nouveau mot de passe" type="password" autoComplete="new-password" required minLength={6} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Confirmer le nouveau mot de passe" className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-950" />
      <button type="submit" disabled={busy} className="rounded-2xl bg-slate-950 px-5 py-3 font-black text-white disabled:bg-slate-300">{busy ? 'Modification...' : 'Modifier le mot de passe'}</button>
      {message && <p className="text-sm font-bold text-slate-600">{message}</p>}
    </form>
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
