import type { Fille } from '../types';

export const FILLES: Fille[] = ['Sanaa', 'Manelle'];
export const DEFAULT_ALERT_AFTER_DAYS = 7;

export const filleStyles: Record<Fille, { badge: string; panel: string; ring: string; text: string }> = {
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
