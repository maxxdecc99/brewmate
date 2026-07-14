import Stripe from "stripe";
import type { PlanId } from "@/lib/subscriptionPlans";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-05-27.dahlia",
});

export const PLAN_PRICE_IDS: Record<PlanId, string> = {
  monthly: process.env.STRIPE_PRICE_MONTHLY!,
  semiannual: process.env.STRIPE_PRICE_SEMIANNUAL!,
  annual: process.env.STRIPE_PRICE_ANNUAL!,
};

// Reverse of PLAN_PRICE_IDS — lets the webhook translate a subscription's
// Stripe price id back into our plan key, so it can be stored/displayed
// without the client ever needing to know raw Stripe price ids.
export const PRICE_ID_TO_PLAN: Record<string, PlanId> = Object.fromEntries(
  (Object.entries(PLAN_PRICE_IDS) as [PlanId, string][]).map(([plan, priceId]) => [priceId, plan])
);
