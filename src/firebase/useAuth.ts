import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  GoogleAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reload,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  type User
} from 'firebase/auth';
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
  resetPassword: (email: string) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  hasPasswordProvider: boolean;
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
      await sendEmailVerification(credential.user, { url: window.location.origin });
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

  async function resetPassword(email: string) {
    if (!auth) throw new Error('Firebase n’est pas encore configuré.');
    setError(null);
    await sendPasswordResetEmail(auth, email.trim(), { url: window.location.origin });
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    if (!user?.email) throw new Error('Aucun compte email connecté.');
    const credential = EmailAuthProvider.credential(user.email, currentPassword);
    await reauthenticateWithCredential(user, credential);
    await updatePassword(user, newPassword);
  }

  async function sendVerification() {
    if (!user) throw new Error('Aucun utilisateur connecté.');
    if (!user.emailVerified) await sendEmailVerification(user, { url: window.location.origin });
  }

  async function refreshVerification() {
    if (!user) return false;
    await reload(user);
    await user.getIdToken(true);
    setVerificationVersion((version) => version + 1);
    return user.emailVerified;
  }

  const hasPasswordProvider = Boolean(user?.providerData.some((provider) => provider.providerId === 'password'));

  return {
    user,
    loading,
    error,
    isAllowed,
    signIn,
    signUp,
    signInGoogle,
    resetPassword,
    changePassword,
    hasPasswordProvider,
    sendVerification,
    refreshVerification,
    logOut
  };
}
