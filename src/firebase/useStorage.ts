import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import type { Fille } from '../types';
import { storage } from './config';

export async function uploadSortiePhoto(file: File, userId: string, fille: Fille) {
  if (!storage) throw new Error('Firebase Storage n’est pas configuré.');
  const extension = file.name.split('.').pop() || 'jpg';
  const path = `sorties/${userId}/${Date.now()}-${fille.toLowerCase()}.${extension}`;
  const photoRef = ref(storage, path);
  await uploadBytes(photoRef, file, { contentType: file.type });
  const photoUrl = await getDownloadURL(photoRef);
  return { photoUrl, photoPath: path };
}
