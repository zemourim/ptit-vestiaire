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
