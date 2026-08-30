import imageCompression from 'browser-image-compression';

/** Cible ~200-300 Ko pour rester durablement dans le quota gratuit Firebase Storage. */
const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.28,
  maxWidthOrHeight: 1280,
  initialQuality: 0.78,
  fileType: 'image/jpeg',
  useWebWorker: true,
} as const;

export async function compresserPhoto(file: File): Promise<File> {
  const compressed = await imageCompression(file, COMPRESSION_OPTIONS);
  const name = file.name.replace(/\.[^./\\]+$/, '') + '.jpg';
  return new File([compressed], name, { type: compressed.type, lastModified: Date.now() });
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Impossible de lire la photo.'));
    reader.readAsDataURL(file);
  });
}

export function splitDataUrl(dataUrl: string) {
  const [header, payload] = dataUrl.split(',');
  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? 'image/jpeg';
  return { mimeType, imageBase64: payload };
}
