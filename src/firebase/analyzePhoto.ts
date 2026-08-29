import { httpsCallable } from 'firebase/functions';
import { splitDataUrl } from '../lib/images';
import { cloudFunctions } from './config';

export async function analyzePhoto(dataUrl: string): Promise<string[]> {
  if (!cloudFunctions) throw new Error('Cloud Functions n’est pas configuré.');
  const analyzeVetements = httpsCallable<{ imageBase64: string; mimeType: string }, { vetements: string[] }>(
    cloudFunctions,
    'analyzeVetements'
  );
  const response = await analyzeVetements(splitDataUrl(dataUrl));
  return response.data.vetements ?? [];
}
