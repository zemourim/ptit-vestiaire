import { createHash } from 'node:crypto';
import { Timestamp } from 'firebase-admin/firestore';
import { defineSecret, defineString } from 'firebase-functions/params';
import { HttpsError, onCall } from 'firebase-functions/v2/https';
import { db, stringValue } from './server.js';

const resendApiKey = defineSecret('RESEND_API_KEY');
const emailFrom = defineString('EMAIL_FROM');
const contactRecipient = defineSecret('CONTACT_RECIPIENT');

type ContactRequest = {
  nom?: unknown;
  email?: unknown;
  sujet?: unknown;
  message?: unknown;
  website?: unknown;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character] ?? character);
}

export const envoyerMessageContact = onCall<ContactRequest>({ secrets: [resendApiKey, contactRecipient] }, async (request) => {
  // Champ invisible rempli par certains robots : on répond sans envoyer de message.
  if (stringValue(request.data.website, 200)) return { ok: true };

  const nom = stringValue(request.data.nom, 100);
  const email = stringValue(request.data.email, 320).toLowerCase();
  const sujet = stringValue(request.data.sujet, 120);
  const message = stringValue(request.data.message, 4000);
  if (nom.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || sujet.length < 2 || message.length < 10) {
    throw new HttpsError('invalid-argument', 'Vérifie les informations du formulaire.');
  }

  const ip = request.rawRequest.ip || request.rawRequest.header('x-forwarded-for') || 'inconnue';
  const day = new Date().toISOString().slice(0, 10);
  const rateId = createHash('sha256').update(`${day}:${ip}`).digest('hex');
  const rateRef = db.doc(`contactRateLimits/${rateId}`);
  await db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(rateRef);
    const count = (snapshot.get('count') as number | undefined) ?? 0;
    if (count >= 5) throw new HttpsError('resource-exhausted', 'Trop de messages ont été envoyés. Réessaie demain.');
    transaction.set(rateRef, { count: count + 1, date: day, derniereTentative: Timestamp.now() }, { merge: true });
  });

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey.value()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: emailFrom.value(),
      to: [contactRecipient.value()],
      reply_to: email,
      subject: `[PtitVestiaire] ${sujet}`,
      html: `<p><strong>Nom :</strong> ${escapeHtml(nom)}</p><p><strong>Email de réponse :</strong> ${escapeHtml(email)}</p><p><strong>Sujet :</strong> ${escapeHtml(sujet)}</p><hr><p>${escapeHtml(message).replace(/\n/g, '<br>')}</p>`
    })
  });
  if (!response.ok) throw new HttpsError('unavailable', 'Le message n’a pas pu être transmis. Réessaie plus tard.');
  return { ok: true };
});
