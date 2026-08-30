import { Sparkles, X } from 'lucide-react';
import type { FormEvent } from 'react';
import { useState } from 'react';
import { PriseDePhoto } from '../components/PriseDePhoto';
import { SelecteurFille } from '../components/SelecteurFille';
import { analyzePhoto } from '../firebase/analyzePhoto';
import { createSortie } from '../firebase/useSorties';
import { uploadSortiePhoto } from '../firebase/useStorage';
import type { Fille } from '../types';

type Props = {
  userId: string;
  onCreated: () => void;
};

export function NouvelleSortie({ userId, onCreated }: Props) {
  const [fille, setFille] = useState<Fille>('Sanaa');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [tagInput, setTagInput] = useState('');
  const [vetements, setVetements] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  function addTag(value = tagInput) {
    const tag = value.trim().toLowerCase();
    if (!tag || vetements.includes(tag)) return;
    setVetements((current) => [...current, tag]);
    setTagInput('');
  }

  function removeTag(tag: string) {
    setVetements((current) => current.filter((item) => item !== tag));
  }

  async function handleAnalyze() {
    if (!photoDataUrl) {
      setError('Ajoute une photo avant de lancer l’analyse.');
      return;
    }

    setAnalyzing(true);
    setError(null);
    try {
      const suggestions = await analyzePhoto(photoDataUrl);
      setVetements((current) => Array.from(new Set([...current, ...suggestions.map((item) => item.toLowerCase())])));
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(message || 'Analyse IA indisponible. Tu peux saisir les vêtements à la main.');
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

    setSaving(true);
    try {
      const uploaded = await uploadSortiePhoto(photo, userId, fille);
      await createSortie({ fille, vetements, ...uploaded });
      setPhoto(null);
      setPhotoDataUrl(null);
      setVetements([]);
      setTagInput('');
      onCreated();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Enregistrement impossible. Vérifie ta connexion.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
      <section>
        <p className="text-sm font-black uppercase tracking-[0.22em] text-slate-500">Nouvelle sortie du matin</p>
        <h2 className="mt-1 text-3xl font-black">Qui part à l’école ?</h2>
      </section>

      <SelecteurFille value={fille} onChange={setFille} />
      <PriseDePhoto file={photo} onFileChange={(file, dataUrl) => { setPhoto(file); setPhotoDataUrl(dataUrl); }} />

      <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">Vêtements visibles</h3>
            <p className="text-sm font-bold text-slate-500">L’IA peut proposer une liste, tu gardes la main.</p>
          </div>
          <button
            type="button"
            onClick={() => void handleAnalyze()}
            disabled={!photoDataUrl || analyzing}
            className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-2 text-sm font-black text-cyan-800 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
          >
            <Sparkles size={16} /> {analyzing ? 'Analyse...' : 'Analyser'}
          </button>
        </div>

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

      {error && <p className="rounded-2xl bg-rose-100 p-4 text-sm font-bold text-rose-700">{error}</p>}

      <button type="submit" disabled={saving} className="w-full rounded-2xl bg-slate-950 px-5 py-4 text-lg font-black text-white disabled:bg-slate-300">
        {saving ? 'Enregistrement...' : 'Enregistrer la sortie'}
      </button>
    </form>
  );
}
