import { Camera, ImageUp } from 'lucide-react';
import { useEffect, useState } from 'react';
import { fileToDataUrl } from '../lib/images';

type Props = {
  file: File | null;
  onFileChange: (file: File | null, previewUrl: string | null) => void;
};

export function PriseDePhoto({ file, onFileChange }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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

    const objectUrl = URL.createObjectURL(nextFile);
    setPreview(objectUrl);
    onFileChange(nextFile, await fileToDataUrl(nextFile));
  }

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
      <label className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center">
        {preview ? (
          <img src={preview} alt="Aperçu de la sortie" className="max-h-80 w-full rounded-2xl object-cover" />
        ) : (
          <span className="flex flex-col items-center gap-3 text-slate-700">
            <span className="rounded-full bg-white p-4 shadow-sm">
              <Camera size={34} />
            </span>
            <span className="text-lg font-black">Prendre une photo</span>
            <span className="text-sm text-slate-500">Caméra arrière sur téléphone, fichier image sur ordinateur.</span>
          </span>
        )}
        <input
          className="sr-only"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(event) => void handleChange(event.target.files?.[0])}
        />
      </label>
      {file && (
        <p className="mt-3 flex items-center gap-2 text-sm font-bold text-slate-600">
          <ImageUp size={16} /> {file.name}
        </p>
      )}
      {error && <p className="mt-3 text-sm font-bold text-rose-600">{error}</p>}
    </section>
  );
}
