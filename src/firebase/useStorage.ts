import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { compresserPhoto, TAILLE_MAX_UPLOAD } from '../lib/images';
import type { Fille } from '../types';
import { storage } from './config';

export async function uploadSortiePhoto(file: File, userId: string, fille: Fille) {
  if (!storage) throw new Error('Firebase Storage n’est pas configuré.');
  // Filet de sécurité : si une version périmée de l'app envoie l'original, on compresse ici aussi.
  const photo = file.size > TAILLE_MAX_UPLOAD ? await compresserPhoto(file) : file;
  const extension = photo.name.split('.').pop() || 'jpg';
  const path = `sorties/${userId}/${Date.now()}-${fille.toLowerCase()}.${extension}`;
  const photoRef = ref(storage, path);
  await uploadBytes(photoRef, photo, { contentType: photo.type });
  const photoUrl = await getDownloadURL(photoRef);
  return { photoUrl, photoPath: path };
}
