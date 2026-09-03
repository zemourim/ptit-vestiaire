import { Timestamp } from 'firebase-admin/firestore';
import { defineSecret } from 'firebase-functions/params';
import { logger } from 'firebase-functions';
import { onSchedule } from 'firebase-functions/v2/scheduler';
import { HttpsError, onCall, onRequest } from 'firebase-functions/v2/https';
import Stripe from 'stripe';
import { db, requireOwner, stringValue } from './server.js';
import { delaiGraceEcoule, rappelApplicable, type BillingFrequency } from './subscriptionPolicy.js';

const stripeSecretKey = defineSecret('STRIPE_SECRET_KEY');
const stripeWebhookSecret = defineSecret('STRIPE_WEBHOOK_SECRET');
const stripeMonthlyPrice = defineSecret('STRIPE_PRICE_MONTHLY');
const stripeAnnualPrice = defineSecret('STRIPE_PRICE_ANNUAL');
const resendApiKey = defineSecret('RESEND_API_KEY');
const appPublicUrl = defineSecret('APP_PUBLIC_URL');
const emailFrom = defineSecret('EMAIL_FROM');

const stripeSecrets = [stripeSecretKey, stripeMonthlyPrice, stripeAnnualPrice];
const emailSecrets = [resendApiKey, appPublicUrl, emailFrom];

function stripeClient() {
  return new Stripe(stripeSecretKey.value());
}

function allowedReturnUrl(value: unknown) {
  const fallback = `${appPublicUrl.value().replace(/\/$/, '')}/#reglages`;
  const candidate = stringValue(value, 1000);
  try {
    const expected = new URL(appPublicUrl.value()).origin;
    return new URL(candidate).origin === expected ? candidate : fallback;
  } catch { return fallback; }
}

async function ownerEmail(familleId: string) {
  const family = await db.doc(`familles/${familleId}`).get();
  const owner = await db.doc(`utilisateurs/${family.get('proprietaireUserId')}`).get();
  return stringValue(owner.get('email'), 320);
}

async function sendEmail(to: string, subject: string, html: string) {
  if (!to) return;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendApiKey.value()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: emailFrom.value(), to: [to], subject, html })
  });
  if (!response.ok) throw new Error(`Resend ${response.status}: ${await response.text()}`);
}

function subscriptionInfo(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0];
  const interval = item?.price.recurring?.interval;
  return {
    frequencePaiement: interval === 'year' ? 'annuel' : 'mensuel',
    dateProchainRenouvellement: Timestamp.fromMillis((item?.current_period_end ?? Math.floor(Date.now() / 1000)) * 1000)
  } as const;
}

async function setBlockedRecords(familleId: string, blocked: boolean) {
  const [clothes, members] = await Promise.all([
    db.collection('vetements').where('familleId', '==', familleId).orderBy('dateCreation', 'asc').get(),
    db.collection(`familles/${familleId}/membres`).get()
  ]);
  const invited = members.docs.filter((item) => item.get('role') === 'invite').sort((a, b) => a.id.localeCompare(b.id));
  const writes: Array<{ ref: FirebaseFirestore.DocumentReference; value: boolean }> = [];
  clothes.docs.forEach((item, index) => writes.push({ ref: item.ref, value: blocked && index >= 20 }));
  invited.forEach((item, index) => writes.push({ ref: item.ref, value: blocked && index >= 1 }));
  for (let start = 0; start < writes.length; start += 400) {
    const batch = db.batch();
    writes.slice(start, start + 400).forEach((write) => batch.set(write.ref, { bloqueParPlan: write.value }, { merge: true }));
    await batch.commit();
  }
  const quotaRef = db.doc(`familles/${familleId}/quotas/invite-gratuit`);
  if (blocked && invited[0]) await quotaRef.set({ userId: invited[0].id });
  else await quotaRef.delete().catch(() => undefined);
}

async function activatePaidPlan(familleId: string, customerId: string, subscription: Stripe.Subscription, sendConfirmation = true) {
  const familyRef = db.doc(`familles/${familleId}`);
  const before = await familyRef.get();
  const info = subscriptionInfo(subscription);
  await familyRef.set({
    plan: 'payant', stripeCustomerId: customerId, stripeSubscriptionId: subscription.id,
    ...info, dateDebutAbonnement: before.get('dateDebutAbonnement') ?? Timestamp.now(),
    nombreRappelsEnvoyes: 0, rappelsEnvoyesCycle: [], statutAbonnement: 'actif', echecPaiementLe: null
  }, { merge: true });
  await setBlockedRecords(familleId, false);
  if (sendConfirmation) {
    const email = await ownerEmail(familleId);
    await sendEmail(email, before.get('plan') === 'payant' ? 'Renouvellement PtitVestiaire confirmé' : 'Bienvenue dans PtitVestiaire Payant', `<p>Bonjour,</p><p>Votre abonnement PtitVestiaire est actif. Merci pour votre confiance.</p><p>Vous pouvez le gérer à tout moment depuis les réglages de l’application.</p>`);
  }
}

async function downgrade(familleId: string) {
  await db.doc(`familles/${familleId}`).set({ plan: 'gratuit', statutAbonnement: 'expire' }, { merge: true });
  await setBlockedRecords(familleId, true);
  const email = await ownerEmail(familleId);
  await sendEmail(email, 'Votre famille repasse à la formule gratuite', `<p>Bonjour,</p><p>Le paiement de votre abonnement PtitVestiaire n’a pas pu être régularisé pendant le délai de grâce. Votre famille utilise désormais la formule gratuite.</p><p>Vos données supplémentaires sont conservées et seront réactivées si vous reprenez un abonnement depuis les réglages.</p>`);
}

export const creerSessionCheckout = onCall<{ familleId?: unknown; frequence?: unknown; returnUrl?: unknown }>({ secrets: [...stripeSecrets, appPublicUrl] }, async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  if (request.data.frequence !== 'annuel' && request.data.frequence !== 'mensuel') throw new HttpsError('invalid-argument', 'Périodicité invalide.');
  const frequence = request.data.frequence;
  const { family } = await requireOwner(request, familleId);
  if (family.get('plan') === 'payant' && family.get('stripeSubscriptionId')) throw new HttpsError('failed-precondition', 'Cet abonnement est déjà actif. Utilise le portail client.');
  const stripe = stripeClient();
  let customerId = stringValue(family.get('stripeCustomerId'), 100);
  if (!customerId) {
    const customer = await stripe.customers.create({ email: stringValue(request.auth?.token.email, 320), metadata: { familleId } });
    customerId = customer.id;
    await family.ref.set({ stripeCustomerId: customerId }, { merge: true });
  }
  const returnUrl = allowedReturnUrl(request.data.returnUrl);
  const termsUrl = `${new URL(appPublicUrl.value()).origin}/#cgv`;
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription', customer: customerId,
    line_items: [{ price: frequence === 'annuel' ? stripeAnnualPrice.value() : stripeMonthlyPrice.value(), quantity: 1 }],
    success_url: `${returnUrl}${returnUrl.includes('?') ? '&' : '?'}paiement=succes`, cancel_url: returnUrl,
    client_reference_id: familleId, metadata: { familleId, frequence },
    subscription_data: { metadata: { familleId, frequence } }, allow_promotion_codes: true,
    consent_collection: { terms_of_service: 'required' },
    custom_text: { terms_of_service_acceptance: { message: `J’accepte les [conditions générales de vente](${termsUrl}) et demande l’accès immédiat au service.` } }
  });
  if (!session.url) throw new HttpsError('internal', 'Stripe n’a pas retourné de lien de paiement.');
  return { url: session.url };
});

export const creerSessionPortail = onCall<{ familleId?: unknown; returnUrl?: unknown }>({ secrets: [stripeSecretKey, appPublicUrl] }, async (request) => {
  const familleId = stringValue(request.data.familleId, 100);
  const { family } = await requireOwner(request, familleId);
  const customerId = stringValue(family.get('stripeCustomerId'), 100);
  if (!customerId) throw new HttpsError('failed-precondition', 'Aucun compte de facturation n’est associé.');
  const session = await stripeClient().billingPortal.sessions.create({ customer: customerId, return_url: allowedReturnUrl(request.data.returnUrl) });
  return { url: session.url };
});

async function findFamily(customerId: string, metadata?: Stripe.Metadata | null) {
  const fromMetadata = stringValue(metadata?.familleId, 100);
  if (fromMetadata) return fromMetadata;
  const result = await db.collection('familles').where('stripeCustomerId', '==', customerId).limit(1).get();
  return result.docs[0]?.id ?? '';
}

export const stripeWebhook = onRequest({ secrets: [stripeSecretKey, stripeWebhookSecret, ...emailSecrets] }, async (request, response) => {
  const signature = request.header('stripe-signature');
  if (!signature) { response.status(400).send('Signature manquante'); return; }
  let event: Stripe.Event;
  try { event = stripeClient().webhooks.constructEvent(request.rawBody, signature, stripeWebhookSecret.value()); }
  catch (caught) { logger.error('Webhook Stripe invalide', caught); response.status(400).send('Signature invalide'); return; }

  try {
    const stripe = stripeClient();
    const eventRef = db.doc(`stripeEvents/${event.id}`);
    try { await eventRef.create({ type: event.type, recuLe: Timestamp.now() }); }
    catch { response.status(200).json({ received: true, duplicate: true }); return; }
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
      const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
      const familleId = stringValue(session.metadata?.familleId, 100);
      if (subscriptionId && customerId && familleId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        if (session.payment_status === 'paid') await activatePaidPlan(familleId, customerId, subscription, false);
        else await db.doc(`familles/${familleId}`).set({ stripeCustomerId: customerId, stripeSubscriptionId: subscriptionId, ...subscriptionInfo(subscription), statutAbonnement: 'en_attente_renouvellement' }, { merge: true });
      }
    } else if (event.type === 'invoice.paid' || event.type === 'invoice.payment_failed') {
      const invoice = event.data.object;
      const subscriptionValue = invoice.parent?.subscription_details?.subscription;
      const subscriptionId = typeof subscriptionValue === 'string' ? subscriptionValue : subscriptionValue?.id;
      const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
      if (subscriptionId && customerId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId);
        const familleId = await findFamily(customerId, subscription.metadata);
        if (familleId && event.type === 'invoice.paid') await activatePaidPlan(familleId, customerId, subscription, true);
        if (familleId && event.type === 'invoice.payment_failed') {
          const ref = db.doc(`familles/${familleId}`);
          const current = await ref.get();
          await ref.set({ statutAbonnement: 'en_attente_renouvellement', echecPaiementLe: current.get('echecPaiementLe') ?? Timestamp.now() }, { merge: true });
        }
      }
    } else if (event.type === 'customer.subscription.updated') {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      const familleId = await findFamily(customerId, subscription.metadata);
      if (familleId) await db.doc(`familles/${familleId}`).set({ ...subscriptionInfo(subscription), stripeSubscriptionId: subscription.id }, { merge: true });
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
      const familleId = await findFamily(customerId, subscription.metadata);
      if (familleId) await downgrade(familleId);
    }
    response.status(200).json({ received: true });
  } catch (caught) {
    logger.error('Traitement webhook Stripe échoué', { eventId: event.id, caught });
    await db.doc(`stripeEvents/${event.id}`).delete().catch(() => undefined);
    response.status(500).send('Erreur de traitement');
  }
});

export const verifierAbonnements = onSchedule({ schedule: 'every day 08:00', timeZone: 'Europe/Paris', secrets: emailSecrets }, async () => {
  const now = Date.now();
  const allFamilies = await db.collection('familles').get();
  for (const family of allFamilies.docs.filter((item) => item.get('plan') === 'payant')) {
    const renewal = family.get('dateProchainRenouvellement') as Timestamp | null;
    if (!renewal) continue;
    const days = Math.ceil((renewal.toMillis() - now) / 86_400_000);
    const frequency: BillingFrequency = family.get('frequencePaiement') === 'annuel' ? 'annuel' : 'mensuel';
    const sent = (family.get('rappelsEnvoyesCycle') as string[] | undefined) ?? [];
    const reminderKey = rappelApplicable(frequency, days);
    if (reminderKey) {
      const key = `${renewal.toMillis()}:${reminderKey}`;
      if (!sent.includes(key)) {
        await sendEmail(await ownerEmail(family.id), 'Prochain renouvellement PtitVestiaire', `<p>Bonjour,</p><p>Votre abonnement PtitVestiaire sera renouvelé dans ${days} jour(s). Vérifiez votre moyen de paiement depuis les réglages si nécessaire.</p>`);
        sent.push(key);
        await family.ref.set({ rappelsEnvoyesCycle: sent, nombreRappelsEnvoyes: sent.length, statutAbonnement: 'en_attente_renouvellement' }, { merge: true });
      }
    }
    const failedAt = family.get('echecPaiementLe') as Timestamp | null;
    if (failedAt && delaiGraceEcoule(frequency, failedAt.toMillis(), now)) await downgrade(family.id);
  }

  const cutoff = Timestamp.fromMillis(now - 30 * 86_400_000);
  for (const family of allFamilies.docs.filter((item) => item.get('plan') !== 'payant')) {
    const oldMoves = await db.collection('mouvements').where('familleId', '==', family.id).where('date', '<', cutoff).limit(400).get();
    if (!oldMoves.empty) { const batch = db.batch(); oldMoves.docs.forEach((move) => batch.delete(move.ref)); await batch.commit(); }
  }
});
