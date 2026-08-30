import { suggererVetementsProches, trouverVetementExistant } from '../firebase/useVetements';
import type { Fille, Vetement } from '../types';

/** `null` = créer un nouveau vêtement au catalogue, sinon l'id du vêtement réutilisé. */
export type ChoixVetement = string | null;

export type LigneResolution = {
  tag: string;
  existant: Vetement | null;
  suggestions: Vetement[];
  choix: ChoixVetement;
};

/**
 * Pour chaque tag, décide s'il correspond déjà à un vêtement du catalogue.
 *
 * Un nom strictement identique après normalisation est réutilisé d'office : c'est
 * ce qui empêche les doublons. Les noms seulement proches sont proposés à
 * l'utilisateur, qui tranche entre « c'est le même » et « c'est un nouveau ».
 */
export function calculerResolutions(
  catalogue: Vetement[],
  fille: Fille,
  tags: string[],
  overrides: Record<string, ChoixVetement>
): LigneResolution[] {
  return tags.map((tag) => {
    const existant = trouverVetementExistant(catalogue, fille, tag);
    const suggestions = existant ? [] : suggererVetementsProches(catalogue, fille, tag);
    const choix = tag in overrides ? overrides[tag] : (existant?.id ?? null);
    return { tag, existant, suggestions, choix };
  });
}
