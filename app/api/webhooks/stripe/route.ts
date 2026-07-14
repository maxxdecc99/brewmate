import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe, PRICE_ID_TO_PLAN } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

// current_period_end lives per-item on this Stripe API version, not on the
// top-level Subscription object.
async function syncFromSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.error("Webhook: subscription missing metadata.user_id", sub.id);
    return;
  }

  const active = sub.status === "active" || sub.status === "trialing";
  const periodEnd = sub.items.data[0]?.current_period_end;
  const priceId = sub.items.data[0]?.price.id;
  const planKey = priceId ? PRICE_ID_TO_PLAN[priceId] ?? null : null;

  const supabase = await createServiceClient();
  const { error } = await supabase
    .from("profiles")
    .update(
      active
        ? {
            subscription_tier: "brew_plus",
            subscription_expires_at: periodEnd ? new Date(periodEnd * 1000).toISOString() : null,
            stripe_subscription_id: sub.id,
            subscription_cancel_at_period_end: sub.cancel_at_period_end,
            subscription_plan: planKey,
          }
        : {
            subscription_tier: "free",
            subscription_expires_at: null,
            stripe_subscription_id: sub.id,
            subscription_cancel_at_period_end: false,
            subscription_plan: null,
          }
    )
    .eq("id", userId);

  if (error) console.error("Webhook: failed to sync profile from subscription:", error);
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode === "subscription" && session.metadata?.user_id) {
        const supabase = await createServiceClient();
        const { error } = await supabase
          .from("profiles")
          .update({
            stripe_customer_id: session.customer as string,
            stripe_subscription_id: session.subscription as string,
          })
          .eq("id", session.metadata.user_id);
        if (error) console.error("Webhook: failed to persist customer/subscription id:", error);
      }
      break;
    }

    case "customer.subscription.created":
    case "customer.subscription.updated":
      await syncFromSubscription(event.data.object as Stripe.Subscription);
      break;

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.user_id;
      if (userId) {
        const supabase = await createServiceClient();
        const { error } = await supabase
          .from("profiles")
          .update({
            subscription_tier: "free",
            subscription_expires_at: null,
            subscription_cancel_at_period_end: false,
            subscription_plan: null,
          })
          .eq("id", userId);
        if (error) console.error("Webhook: failed to clear subscription on delete:", error);
      }
      break;
    }

    default:
      // Not separately handling invoice.payment_failed — Stripe's dunning
      // flow eventually surfaces as a subscription status change, already
      // covered above.
      break;
  }

  return NextResponse.json({ received: true });
}
