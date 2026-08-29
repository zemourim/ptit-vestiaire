import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { DEFAULT_ALERT_AFTER_DAYS } from '../lib/constants';
import type { AppSettings } from '../types';
import { db } from './config';

const fallbackSettings: AppSettings = { alertAfterDays: DEFAULT_ALERT_AFTER_DAYS };

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(fallbackSettings);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!db) {
      setLoading(false);
      return;
    }

    return onSnapshot(
      doc(db, 'settings', 'global'),
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
    await setDoc(doc(db, 'settings', 'global'), nextSettings, { merge: true });
  }

  return { settings, loading, error, updateSettings };
}
