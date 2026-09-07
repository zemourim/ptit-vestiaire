import { appelerFonction } from './useSubscription';

export type MessageContact = {
  nom: string;
  email: string;
  sujet: string;
  message: string;
  website: string;
};

export async function envoyerMessageContact(message: MessageContact) {
  await appelerFonction<MessageContact, { ok: boolean }>('envoyerMessageContact', message);
}
