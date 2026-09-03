import Stripe from 'stripe';

const secret = process.env.STRIPE_SECRET_KEY;
if (!secret?.startsWith('sk_test_')) {
  throw new Error('Définis STRIPE_SECRET_KEY avec une clé Stripe de test (sk_test_...). Le script refuse volontairement le mode live.');
}

const stripe = new Stripe(secret);
const products = await stripe.products.search({ query: "metadata['ptitvestiaire']='subscription'" });
const product = products.data[0] ?? await stripe.products.create({
  name: 'PtitVestiaire Payant',
  description: 'Fonctionnalités illimitées et reconnaissance automatique des vêtements.',
  metadata: { ptitvestiaire: 'subscription' }
});

async function ensurePrice(interval, amount, lookupKey) {
  const existing = await stripe.prices.list({ product: product.id, active: true, limit: 100 });
  return existing.data.find((price) => price.lookup_key === lookupKey) ?? stripe.prices.create({
    product: product.id,
    currency: 'eur',
    unit_amount: amount,
    recurring: { interval },
    lookup_key: lookupKey
  });
}

const monthly = await ensurePrice('month', 299, 'ptitvestiaire_monthly');
const annual = await ensurePrice('year', 2499, 'ptitvestiaire_annual');

const webhookUrl = process.env.STRIPE_WEBHOOK_URL
  ?? 'https://europe-west1-ptit-vestiaire-multifamilles.cloudfunctions.net/stripeWebhook';
const webhookEvents = [
  'checkout.session.completed',
  'invoice.paid',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'customer.subscription.deleted'
];
const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
let webhook = endpoints.data.find((endpoint) => endpoint.url === webhookUrl);
let webhookSecret = null;
if (!webhook) {
  webhook = await stripe.webhookEndpoints.create({ url: webhookUrl, enabled_events: webhookEvents });
  webhookSecret = webhook.secret;
}

const portalConfigurations = await stripe.billingPortal.configurations.list({ active: true, limit: 100 });
if (portalConfigurations.data.length === 0) {
  await stripe.billingPortal.configurations.create({
    business_profile: { headline: 'Gérez votre abonnement PtitVestiaire' },
    features: {
      invoice_history: { enabled: true },
      payment_method_update: { enabled: true },
      subscription_cancel: { enabled: true, mode: 'at_period_end', proration_behavior: 'none' }
    }
  });
}

console.log(JSON.stringify({
  productId: product.id,
  STRIPE_PRICE_MONTHLY: monthly.id,
  STRIPE_PRICE_ANNUAL: annual.id,
  webhookUrl,
  STRIPE_WEBHOOK_SECRET: webhookSecret ?? 'Endpoint déjà existant : récupère ou renouvelle son secret dans le Dashboard Stripe.'
}, null, 2));
