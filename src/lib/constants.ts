import type { Fille } from '../types';

/** Valeurs historiques, uniquement utilisées en repli pour les anciennes données. */
export const FILLES: Fille[] = ['Sanaa', 'Manelle'];
export const DEFAULT_ALERT_AFTER_DAYS = 7;

const filleStyles: Record<string, { badge: string; panel: string; ring: string; text: string }> = {
  Sanaa: {
    badge: 'bg-sanaa-100 text-sanaa-700',
    panel: 'from-sanaa-50 to-white border-sanaa-100',
    ring: 'ring-sanaa-500',
    text: 'text-sanaa-700'
  },
  Manelle: {
    badge: 'bg-manelle-100 text-manelle-700',
    panel: 'from-manelle-50 to-white border-manelle-100',
    ring: 'ring-manelle-500',
    text: 'text-manelle-700'
  }
};

export function getFilleStyles(fille: string) {
  if (filleStyles[fille]) return filleStyles[fille];
  const total = [...fille].reduce((somme, caractere) => somme + caractere.charCodeAt(0), 0);
  return total % 2 === 0 ? filleStyles.Sanaa : filleStyles.Manelle;
}
