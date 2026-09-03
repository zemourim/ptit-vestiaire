import { createUserWithEmailAndPassword, GoogleAuthProvider, onAuthStateChanged, reload, sendEmailVerification, signInWithEmailAndPassword, signInWithPopup, signOut, type User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { auth } from './config';

type AuthState = {
  user: User | null;
  loading: boolean;
  error: string | null;
  isAllowed: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  sendVerification: () => Promise<void>;
  refreshVerification: () => Promise<boolean>;
  logOut: () => Promise<void>;
};

export function useAuth(): AuthState {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [, setVerificationVersion] = useState(0);

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

  const isAllowed = Boolean(user);

  async function signIn(email: string, password: string) {
    if (!auth) {
      setError('Firebase n’est pas encore configuré. Renseigne le fichier .env.');
      return;
    }

    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
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
      await sendEmailVerification(credential.user);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Création du compte impossible.');
      throw caught;
    }
  }

  async function signInGoogle() {
    if (!auth) throw new Error('Firebase n’est pas encore configuré.');
    setError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Connexion Google impossible.');
      throw caught;
    }
  }

  async function sendVerification() {
    if (!user) throw new Error('Aucun utilisateur connecté.');
    if (!user.emailVerified) await sendEmailVerification(user);
  }

  async function refreshVerification() {
    if (!user) return false;
    await reload(user);
    await user.getIdToken(true);
    setVerificationVersion((version) => version + 1);
    return user.emailVerified;
  }

  return { user, loading, error, isAllowed, signIn, signUp, signInGoogle, sendVerification, refreshVerification, logOut };
}
