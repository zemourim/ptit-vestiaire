import { BookOpen, LogOut, Sparkles, X } from 'lucide-react';
import { FirebaseError } from 'firebase/app';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import { PriseDePhoto } from '../components/PriseDePhoto';
import { SelecteurFille } from '../components/SelecteurFille';
import { ResolutionVetements, ResumeReutilises } from '../components/ResolutionVetements';
import { calculerResolutions, type ChoixVetement } from '../lib/resolution';
import { analyzePhoto } from '../firebase/analyzePhoto';
import { enregistrerAjoutCataloguePhoto, enregistrerSortiePhoto, type EntreeSortie } from '../firebase/useMouvements';
import { useVetements } from '../firebase/useVetements';
import { uploadSortiePhoto } from '../firebase/useStorage';
import { familleIdCourante } from '../firebase/familleCourante';
import { UpgradeNotice } from '../components/UpgradeNotice';
import type { Famille, Fille } from '../types';

type Props = {
  userId: string;
  enfants: string[];
  famille: Famille;
  onCreated: () => void;
};

type TypeAjout = 'sortie' | 'catalogue';

export function NouvelleSortie({ userId, enfants, famille, onCreated }: Props) {
  const [fille, setFille] = useState<Fille>(enfants[0]);
  const [typeAjout, setTypeAjout] = useState<TypeAjout>('sortie');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [vetements, setVetements] = useState<string[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ChoixVetement>>({});
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const { vetements: catalogue } = useVetements();

  const lignes = useMemo(
    () => calculerResolutions(catalogue, fille, vetements, overrides),
    [catalogue, fille, vetements, overrides]
  );

  function addTag(value = tagInput) {
    const tag = value.trim().toLowerCase();
    if (!tag || vetements.includes(tag)) return;
    setVetements((current) => [...current, tag]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setVetements((current) => current.filter((item) => item !== tag));
    setOverrides((current) => Object.fromEntries(Object.entries(current).filter(([cle]) => cle !== tag)));
  }

  async function handleAnalyze() {
    if (!photoDataUrl) {
      setError('Ajoute une photo avant de lancer l’analyse.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      if (famille.plan !== 'payant') throw new Error('La reconnaissance IA est réservée à la formule payante.');
      const familleId = familleIdCourante();
      if (!familleId) throw new Error('Aucune famille sélectionnée.');
      const suggestions = await analyzePhoto(photoDataUrl, familleId);
      setVetements((current) => Array.from(new Set([...current, ...suggestions.map((item) => item.toLowerCase())])));
    } catch (caught) {
      if (caught instanceof FirebaseError) {
        setError(`Analyse impossible (${caught.code}) : ${caught.message}`);
      } else {
        setError(caught instanceof Error ? caught.message : 'Analyse IA indisponible. Tu peux saisir les vêtements à la main.');
      }
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!photo) {
      setError('Prends ou choisis une photo avant d’enregistrer.');
      return;
    }

    if (vetements.length === 0) {
      setError('Ajoute au moins un vêtement visible.');
      return;
    }

    // Deux tags peuvent viser le même vêtement du catalogue : on n'écrit qu'un mouvement.
    const dejaVus = new Set<string>();
    const entrees: EntreeSortie[] = [];
    lignes.forEach((ligne) => {
      if (ligne.choix) {
        if (dejaVus.has(ligne.choix)) return;
        dejaVus.add(ligne.choix);
      }
      entrees.push({ nom: ligne.tag, vetementId: ligne.choix });
    });

    if (typeAjout === 'catalogue' && !entrees.some((entree) => !entree.vetementId)) {
      setError('Tous ces vêtements sont déjà présents au catalogue.');
      return;
    }

    const nombreNouveaux = entrees.filter((entree) => !entree.vetementId).length;
    if (famille.plan !== 'payant' && catalogue.length + nombreNouveaux > 20) {
      setError('La formule gratuite est limitée à 20 vêtements. Passe à la formule payante pour en ajouter davantage.');
      return;
    }

    setSaving(true);
    try {
      const { photoUrl } = await uploadSortiePhoto(photo, userId, fille);
      if (typeAjout === 'sortie') {
        await enregistrerSortiePhoto(fille, photoUrl, entrees);
      } else {
        await enregistrerAjoutCataloguePhoto(fille, photoUrl, entrees);
      }
      setPhoto(null);
      setPhotoDataUrl(null);
      setVetements([]);
      setOverrides({});
      setTagInput('');
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enregistrement impossible. Vérifie ta connexion.');
    } finally {
      setSaving(false);
    }
  }

  const nouveaux = lignes.filter((ligne) => ligne.choix === null).length;

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <section>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Ajouter des vêtements</p>
        <h2 className="mt-1 text-3xl font-black">Pour qui est cet ajout ?</h2>
      </section>

      <SelecteurFille value={fille} onChange={setFille} enfants={enfants} />
      {famille.plan !== 'payant' && <p className="rounded-2xl bg-white p-3 text-sm font-bold text-slate-600">Garde-robe gratuite : {catalogue.length}/20 vêtements.</p>}
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-sm font-black text-slate-700">Quel type d’ajout ?</legend>
        <label className={`cursor-pointer rounded-3xl border-2 p-4 ${typeAjout === 'sortie' ? 'border-slate-950 bg-slate-950 text-white' : 'border-slate-200 bg-white'}`}>
          <input className="sr-only" type="radio" name="type-ajout" checked={typeAjout === 'sortie'} onChange={() => setTypeAjout('sortie')} />
          <span className="flex items-start gap-3"><LogOut className="mt-0.5 shrink-0" size={21} /><span><span className="block font-black">C’est une sortie</span><span className={`mt-1 block text-sm font-bold ${typeAjout === 'sortie' ? 'text-slate-200' : 'text-slate-500'}`}>Crée ou réutilise le vêtement et le marque sorti.</span></span></span>
        </label>
        <label className={`cursor-pointer rounded-3xl border-2 p-4 ${typeAjout === 'catalogue' ? 'border-cyan-600 bg-cyan-600 text-white' : 'border-slate-200 bg-white'}`}>
          <input className="sr-only" type="radio" name="type-ajout" checked={typeAjout === 'catalogue'} onChange={() => setTypeAjout('catalogue')} />
          <span className="flex items-start gap-3"><BookOpen className="mt-0.5 shrink-0" size={21} /><span><span className="block font-black">Juste ajouter à la garde-robe</span><span className={`mt-1 block text-sm font-bold ${typeAjout === 'catalogue' ? 'text-cyan-50' : 'text-slate-500'}`}>Ajoute seulement les nouveaux vêtements, déjà à la maison.</span></span></span>
        </label>
      </fieldset>
      <PriseDePhoto file={photo} onFileChange={(file, dataUrl) => { setPhoto(file); setPhotoDataUrl(dataUrl); }} />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Vêtements visibles</h3>
            <p className="text-sm font-bold text-slate-500">Ajoute les vêtements manuellement{famille.plan === 'payant' ? ' ou utilise la suggestion par IA' : ''}.</p>
          </div>
          {famille.plan === 'payant' && <button
              type="button"
              onClick={() => void handleAnalyze()}
              disabled={!photoDataUrl || analyzing}
              className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            >
              <Sparkles size={16} /> {analyzing ? 'Analyse...' : 'Analyser'}
            </button>}
        </div>

        {famille.plan !== 'payant' && <div className="mt-3"><UpgradeNotice>La reconnaissance automatique par IA est réservée à la formule payante.</UpgradeNotice></div>}

        <div className="mt-4 flex gap-2">
          <input
            value={tagInput}
            onChange={(event) => setTagInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addTag();
              }
            }}
            placeholder="ex : manteau bleu"
            className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 outline-none focus:ring-2 focus:ring-slate-950"
          />
          <button type="button" onClick={() => addTag()} className="rounded-2xl bg-slate-950 px-4 py-3 font-black text-white">
            Ajouter
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          {vetements.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => removeTag(tag)}
              className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm font-black text-slate-700"
            >
              {tag} <X size={15} />
            </button>
          ))}
        </div>
      </section>

      {vetements.length > 0 && (
        <div className="space-y-3">
          <ResumeReutilises lignes={lignes} />
          <ResolutionVetements
            lignes={lignes}
            onChoixChange={(tag, choix) => setOverrides((current) => ({ ...current, [tag]: choix }))}
          />
        </div>
      )}

      {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}

      <button type="submit" disabled={saving} className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300">
        {saving
          ? 'Enregistrement...'
          : nouveaux > 0
            ? typeAjout === 'sortie'
              ? `Enregistrer la sortie (${nouveaux} nouveau(x) vêtement(s))`
              : `Ajouter à la garde-robe (${nouveaux} nouveau(x) vêtement(s))`
            : typeAjout === 'sortie' ? 'Enregistrer la sortie' : 'Ajouter à la garde-robe'}
      </button>
    </form>
  );
}
