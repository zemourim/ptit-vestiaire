import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { compresserPhoto, TAILLE_MAX_UPLOAD } from '../lib/images';
import type { Fille } from '../types';
import { storage } from './config';
import { familleIdCourante } from './familleCourante';

export async function uploadSortiePhoto(file: File, userId: string, fille: Fille) {
  if (!storage) throw new Error('Firebase Storage n’est pas configuré.');
  const familleId = familleIdCourante();
  if (!familleId) throw new Error('Aucune famille sélectionnée.');
  // Filet de sécurité : si une version périmée de l'app envoie l'original, on compresse ici aussi.
  const photo = file.size > TAILLE_MAX_UPLOAD ? await compresserPhoto(file) : file;
  const extension = photo.name.split('.').pop() || 'jpg';
  const path = `familles/${familleId}/sorties/${userId}/${Date.now()}-${fille.toLowerCase()}.${extension}`;
  const photoRef = ref(storage, path);
  await uploadBytes(photoRef, photo, { contentType: photo.type });
  const photoUrl = await getDownloadURL(photoRef);
  return { photoUrl, photoPath: path };
}
