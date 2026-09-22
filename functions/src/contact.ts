import { createHash } from ‘node:crypto’;
import { Timestamp } from ‘firebase-admin/firestore’;
import { HttpsError, onCall } from ‘firebase-functions/v2/https’;
import { db, stringValue } from ‘./server.js’;
import { getSecret } from ‘./secrets.js’;

type ContactRequest = {
  nom?: unknown;
  email?: unknown;
  sujet?: unknown;
  message?: unknown;
  website?: unknown;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>’"]/g, (character) => ({ ‘&’: ‘&amp;’, ‘<’: ‘&lt;’, ‘>’: ‘&gt;’, "’": ‘&#39;’, ‘"’: ‘&quot;’ })[character] ?? character);
}

export const envoyerMessageContact = onCall<ContactRequest>(async (request) => {
  try {
    // Champ invisible rempli par certains robots : on répond sans envoyer de message.
    if (stringValue(request.data.website, 200)) return { ok: true };

    const nom = stringValue(request.data.nom, 100);
    const email = stringValue(request.data.email, 320).toLowerCase();
    const sujet = stringValue(request.data.sujet, 120);
    const message = stringValue(request.data.message, 4000);
    if (nom.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || sujet.length < 2 || message.length < 10) {
      throw new HttpsError(‘invalid-argument’, ‘Vérifie les informations du formulaire.’);
    }

    const apiKey = await getSecret(‘RESEND_API_KEY’);
    const recipient = await getSecret(‘CONTACT_RECIPIENT’);
    const from = process.env.EMAIL_FROM || ‘noreply@resend.dev’;

    if (!apiKey) throw new HttpsError(‘internal’, ‘RESEND_API_KEY not found’);
    if (!recipient) throw new HttpsError(‘internal’, ‘CONTACT_RECIPIENT not found’);

    const ip = (request.raw?.headers?.get?.(‘x-forwarded-for’) as string | undefined) || ‘inconnue’;
    const day = new Date().toISOString().slice(0, 10);
    const rateId = createHash(‘sha256’).update(`${day}:${ip}`).digest(‘hex’);
    const rateRef = db.doc(`contactRateLimits/${rateId}`);
    await db.runTransaction(async (transaction) => {
      const snapshot = await transaction.get(rateRef);
      const count = (snapshot.get(‘count’) as number | undefined) ?? 0;
      if (count >= 5) throw new HttpsError(‘resource-exhausted’, ‘Trop de messages ont été envoyés. Réessaie demain.’);
      transaction.set(rateRef, { count: count + 1, date: day, derniereTentative: Timestamp.now() }, { merge: true });
    });

    const response = await fetch(‘https://api.resend.com/emails’, {
      method: ‘POST’,
      headers: { Authorization: `Bearer ${apiKey}`, ‘Content-Type’: ‘application/json’ },
      body: JSON.stringify({
        from,
        to: [recipient],
        reply_to: email,
        subject: `[PtitVestiaire] ${sujet}`,
        html: `<p><strong>Nom :</strong> ${escapeHtml(nom)}</p><p><strong>Email de réponse :</strong> ${escapeHtml(email)}</p><p><strong>Sujet :</strong> ${escapeHtml(sujet)}</p><hr><p>${escapeHtml(message).replace(/\n/g, ‘<br>’)}</p>`
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new HttpsError(‘unavailable’, `Resend error ${response.status}: ${errorText}`);
    }
    return { ok: true };
  } catch (error) {
    if (error instanceof HttpsError) throw error;
    throw new HttpsError(‘internal’, error instanceof Error ? error.message : String(error));
  }
});
