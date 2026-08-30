import { CheckCircle2, Sparkle } from 'lucide-react';
import type { LigneResolution, ChoixVetement } from '../lib/resolution';

type Props = {
  lignes: LigneResolution[];
  onChoixChange: (tag: string, choix: ChoixVetement) => void;
};

export function ResolutionVetements({ lignes, onChoixChange }: Props) {
  const aDecider = lignes.filter((ligne) => !ligne.existant);
  if (aDecider.length === 0) return null;

  return (
    <section className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
      <h3 className="text-lg font-black">Nouveaux vêtements ?</h3>
      <p className="text-sm font-bold text-amber-900">
        Ces noms ne sont pas encore au catalogue. Rattache-les à un vêtement existant pour éviter un doublon, ou confirme la création.
      </p>

      <ul className="mt-4 space-y-3">
        {aDecider.map((ligne) => (
          <li key={ligne.tag} className="rounded-2xl bg-white p-3">
            <p className="font-black capitalize">{ligne.tag}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onChoixChange(ligne.tag, null)}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black ${
                  ligne.choix === null ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <Sparkle size={15} /> Nouveau vêtement
              </button>
              {ligne.suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  type="button"
                  onClick={() => onChoixChange(ligne.tag, suggestion.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black capitalize ${
                    ligne.choix === suggestion.id ? 'bg-cyan-600 text-white' : 'bg-cyan-100 text-cyan-800'
                  }`}
                >
                  {suggestion.nom}
                </button>
              ))}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ResumeReutilises({ lignes }: { lignes: LigneResolution[] }) {
  const reutilises = lignes.filter((ligne) => ligne.existant);
  if (reutilises.length === 0) return null;

  return (
    <p className="flex flex-wrap items-center gap-2 rounded-2xl bg-emerald-50 p-3 text-sm font-bold text-emerald-800">
      <CheckCircle2 size={16} />
      Déjà au catalogue, aucun doublon créé :{' '}
      <span className="capitalize">{reutilises.map((ligne) => ligne.existant?.nom).join(', ')}</span>
    </p>
  );
}
