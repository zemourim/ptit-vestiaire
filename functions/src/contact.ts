import { HttpsError, onCall } from ‘firebase-functions/v2/https’;

type ContactRequest = {
  nom?: unknown;
  email?: unknown;
  sujet?: unknown;
  message?: unknown;
  website?: unknown;
};

export const envoyerMessageContact = onCall<ContactRequest>(async (request) => {
  return { ok: true, test: ‘success’ };
});
