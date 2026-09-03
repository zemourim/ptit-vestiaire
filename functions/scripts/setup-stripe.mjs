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

console.log(JSON.stringify({
  productId: product.id,
  STRIPE_PRICE_MONTHLY: monthly.id,
  STRIPE_PRICE_ANNUAL: annual.id
}, null, 2));
