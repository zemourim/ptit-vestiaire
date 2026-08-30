import { Camera, ImageUp, Images, Loader2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { compresserPhoto, fileToDataUrl } from '../lib/images';

type Props = {
  file: File | null;
  onFileChange: (file: File | null, previewUrl: string | null) => void;
};

export function PriseDePhoto({ file, onFileChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [compressing, setCompressing] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  async function handleChange(nextFile: File | undefined) {
    setError(null);
    if (!nextFile) {
      onFileChange(null, null);
      setPreview(null);
      return;
    }

    if (!nextFile.type.startsWith('image/')) {
      setError('Choisis une photo au format image.');
      return;
    }

    setCompressing(true);
    try {
      const compressed = await compresserPhoto(nextFile);
      setPreview(URL.createObjectURL(compressed));
      onFileChange(compressed, await fileToDataUrl(compressed));
    } catch {
      setError('Compression de la photo impossible. Réessaie avec une autre image.');
      onFileChange(null, null);
      setPreview(null);
    } finally {
      setCompressing(false);
    }
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        {compressing ? (
          <span className="flex flex-col items-center gap-3 text-slate-700">
            <Loader2 size={34} className="animate-spin" />
            <span className="text-lg font-black">Optimisation de la photo...</span>
            <span className="text-sm text-slate-500">On allège l’image avant de l’envoyer.</span>
          </span>
        ) : preview ? (
          <img src={preview} alt="Aperçu de la sortie" className="max-h-80 w-full rounded-2xl object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-3 text-slate-700">
            <span className="rounded-full bg-white p-4 shadow-sm">
              <Camera size={34} />
            </span>
            <span className="text-lg font-black">Ajouter une photo</span>
            <span className="text-sm text-slate-500">Prends-en une maintenant ou choisis-en une déjà enregistrée.</span>
          </span>
        )}
        {!compressing && (
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2 font-black text-white"
            >
              <Camera size={17} /> Prendre une photo
            </button>
            <button
              type="button"
              onClick={() => galleryInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 font-black text-slate-700 shadow-sm"
            >
              <Images size={17} /> Choisir dans la galerie
            </button>
          </div>
        )}
      </div>
      <input
        ref={cameraInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        capture="environment"
        disabled={compressing}
        onChange={(event) => void handleChange(event.target.files?.[0])}
      />
      <input
        ref={galleryInputRef}
        className="sr-only"
        type="file"
        accept="image/*"
        disabled={compressing}
        onChange={(event) => void handleChange(event.target.files?.[0])}
      />
      {file && !compressing && (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600">
          <ImageUp size={16} /> {file.name} · {Math.round(file.size / 1024)} Ko
        </p>
      )}
      {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}
    </section>
  );
}
