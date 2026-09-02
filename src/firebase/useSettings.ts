import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { DEFAULT_ALERT_AFTER_DAYS } from '../lib/constants';
import type { AppSettings } from '../types';
import { db } from './config';
import { familleIdCourante } from './familleCourante';

const fallbackSettings: AppSettings = { alertAfterDays: DEFAULT_ALERT_AFTER_DAYS };

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const familleId = familleIdCourante();
    if (!db || !familleId) {
      setLoading(false);
      return;
    }

    return onSnapshot(
      doc(db, 'settings', familleId),
      (snapshot) => {
        const data = snapshot.data() as Partial<AppSettings> | undefined;
        setSettings({ alertAfterDays: data?.alertAfterDays ?? DEFAULT_ALERT_AFTER_DAYS });
        setLoading(false);
        setError(null);
      },
      (caught) => {
        setError(
          caught.code === 'permission-denied'
            ? 'Accès aux réglages Firestore refusé. Publie firestore.rules dans le bon projet Firebase.'
            : caught.message || 'Impossible de charger les réglages.'
        );
        setLoading(false);
      }
    );
  }, []);

  async function updateSettings(nextSettings: AppSettings) {
    if (!db) throw new Error('Firebase n’est pas configuré.');
    const familleId = familleIdCourante();
    if (!familleId) throw new Error('Aucune famille active.');
    await setDoc(doc(db, 'settings', familleId), { ...nextSettings, familleId }, { merge: true });
  }

  return { settings, loading, error, updateSettings };
}
