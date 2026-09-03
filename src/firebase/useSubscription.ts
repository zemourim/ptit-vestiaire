import { httpsCallable } from 'firebase/functions';
import { cloudFunctions } from './config';

export async function appelerFonction<TRequest, TResponse>(nom: string, data: TRequest): Promise<TResponse> {
  if (!cloudFunctions) throw new Error('Cloud Functions n’est pas configuré.');
  const call = httpsCallable<TRequest, TResponse>(cloudFunctions, nom);
  return (await call(data)).data;
}

export async function ouvrirCheckout(familleId: string, frequence: 'mensuel' | 'annuel') {
  const { url } = await appelerFonction<{ familleId: string; frequence: 'mensuel' | 'annuel'; returnUrl: string }, { url: string }>(
    'creerSessionCheckout',
    { familleId, frequence, returnUrl: `${window.location.origin}/#reglages` }
  );
  window.location.assign(url);
}

export async function ouvrirPortailStripe(familleId: string) {
  const { url } = await appelerFonction<{ familleId: string; returnUrl: string }, { url: string }>('creerSessionPortail', {
    familleId,
    returnUrl: `${window.location.origin}/#reglages`
  });
  window.location.assign(url);
}
