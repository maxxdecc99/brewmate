// One-off script: creates the 3 Brew+ subscription Products + Prices in
// Stripe test mode. Idempotent via a `brewmate_plan` metadata tag.
//
// Usage: node --env-file=.env.local scripts/create-stripe-plans.mjs

import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error("STRIPE_SECRET_KEY is not set. Run with: node --env-file=.env.local scripts/create-stripe-plans.mjs");
  process.exit(1);
}
if (!process.env.STRIPE_SECRET_KEY.startsWith("sk_test_")) {
  console.error("STRIPE_SECRET_KEY is not a test-mode key. Refusing to run against a live account.");
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-05-27.dahlia",
});

const PLANS = [
  { key: "monthly", name: "BrewMate Brew+ — Monthly", unit_amount: 399, interval: "month", interval_count: 1 },
  { key: "semiannual", name: "BrewMate Brew+ — 6 Months", unit_amount: 1494, interval: "month", interval_count: 6 },
  { key: "annual", name: "BrewMate Brew+ — Annual", unit_amount: 2388, interval: "year", interval_count: 1 },
];

async function main() {
  const results = {};

  for (const plan of PLANS) {
    const existing = await stripe.prices.search({
      query: `metadata['brewmate_plan']:'${plan.key}'`,
    });

    if (existing.data.length > 0) {
      console.log(`${plan.key}: already exists -> ${existing.data[0].id}`);
      results[plan.key] = existing.data[0].id;
      continue;
    }

    const product = await stripe.products.create({
      name: plan.name,
      metadata: { brewmate_plan: plan.key },
    });

    const price = await stripe.prices.create({
      product: product.id,
      currency: "eur",
      unit_amount: plan.unit_amount,
      recurring: { interval: plan.interval, interval_count: plan.interval_count },
      metadata: { brewmate_plan: plan.key },
    });

    console.log(`${plan.key}: created -> ${price.id}`);
    results[plan.key] = price.id;
  }

  console.log("\nAdd these to .env.local:\n");
  console.log(`STRIPE_PRICE_MONTHLY=${results.monthly}`);
  console.log(`STRIPE_PRICE_SEMIANNUAL=${results.semiannual}`);
  console.log(`STRIPE_PRICE_ANNUAL=${results.annual}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
