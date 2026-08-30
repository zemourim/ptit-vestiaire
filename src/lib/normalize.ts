/**
 * Normalisation et rapprochement des noms de vêtements.
 *
 * Objectif : "Manteau Bleu", "manteau bleu" et "manteaux bleus" doivent désigner
 * le même document du catalogue, pour ne jamais créer de doublon.
 */

/** Minuscules, sans accent, sans ponctuation, espaces normalisés, pluriels simples retirés. */
export function normaliserNom(nom: string): string {
  return nom
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
    .map((mot) => (mot.length > 3 && mot.endsWith('s') ? mot.slice(0, -1) : mot))
    .join(' ');
}

/** Distance de Levenshtein, en O(n) mémoire. */
function distance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  let ligne = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const suivante = [i];
    for (let j = 1; j <= b.length; j += 1) {
      const cout = a[i - 1] === b[j - 1] ? 0 : 1;
      suivante[j] = Math.min(ligne[j] + 1, suivante[j - 1] + 1, ligne[j - 1] + cout);
    }
    ligne = suivante;
  }
  return ligne[b.length];
}

/** 1 = identique, 0 = totalement différent. */
export function similarite(a: string, b: string): number {
  const longueur = Math.max(a.length, b.length);
  if (longueur === 0) return 1;
  return 1 - distance(a, b) / longueur;
}

/** En dessous de ce score, deux noms ne sont même pas proposés comme proches. */
export const SEUIL_SUGGESTION = 0.7;
