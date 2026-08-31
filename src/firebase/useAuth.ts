import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useEffect, useMemo, useState } from 'react';
import { allowedAdultEmails, auth } from './config';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAllowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }

    return onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
  }, []);

  const isAllowed = useMemo(() => {
    if (!user?.email) return false;
    if (allowedAdultEmails.length === 0) return true;
    return allowedAdultEmails.includes(user.email.toLowerCase());
  }, [user]);

  async function signIn(email: string, password: string) {
    if (!auth) {
      setError('Firebase n’est pas encore configuré. Renseigne le fichier .env.');
      return;
    }

    setError(null);
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      const signedEmail = credential.user.email?.toLowerCase() ?? '';
      if (allowedAdultEmails.length > 0 && !allowedAdultEmails.includes(signedEmail)) {
        await signOut(auth);
        throw new Error('Ce compte n’est pas autorisé pour PtitVestiaire.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion impossible.');
      throw caught;
    }
  }

  async function logOut() {
    if (auth) await signOut(auth);
  }

  async function signUp(email: string, password: string) {
    if (!auth) throw new Error('Firebase n’est pas encore configuré.');
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const signedEmail = credential.user.email?.toLowerCase() ?? '';
      if (allowedAdultEmails.length > 0 && !allowedAdultEmails.includes(signedEmail)) {
        await signOut(auth);
        throw new Error('Cette adresse n’est pas autorisée.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Création du compte impossible.');
      throw caught;
    }
  }

  async function signInGoogle() {
    if (!auth) throw new Error('Firebase n’est pas encore configuré.');
    setError(null);
    try {
      const credential = await signInWithPopup(auth, new GoogleAuthProvider());
      const signedEmail = credential.user.email?.toLowerCase() ?? '';
      if (allowedAdultEmails.length > 0 && !allowedAdultEmails.includes(signedEmail)) {
        await signOut(auth);
        throw new Error('Cette adresse Google n’est pas autorisée.');
      }
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion Google impossible.');
      throw caught;
    }
  }

  return { user, loading, error, isAllowed, signIn, signUp, signInGoogle, logOut };
}
