import type { Timestamp } from 'firebase/firestore';

export function formatDate(timestamp: Timestamp) {
  return timestamp.toDate().toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

export function daysSince(timestamp: Timestamp) {
  const start = timestamp.toDate().getTime();
  const diff = Date.now() - start;
  return Math.max(0, Math.floor(diff / 86_400_000));
}

export function isLate(timestamp: Timestamp, thresholdDays: number) {
  return daysSince(timestamp) > thresholdDays;
}
