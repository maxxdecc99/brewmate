import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return NextResponse.json({ error: "no_subscription" }, { status: 400 });
  }

  // A stored customer_id can be stale — e.g. created while Stripe was in
  // test mode, so it doesn't exist under the live secret key. There's no
  // subscription to manage for a customer that doesn't exist, so treat this
  // the same as never having had a customer_id: clear it and report
  // no_subscription rather than letting portal session creation fail.
  try {
    await stripe.customers.retrieve(profile.stripe_customer_id);
  } catch (err) {
    if (err instanceof Stripe.errors.StripeInvalidRequestError && err.code === "resource_missing") {
      const service = await createServiceClient();
      const { error: updateError } = await service
        .from("profiles")
        .update({ stripe_customer_id: null })
        .eq("id", user.id);
      if (updateError) {
        console.error("stripe/portal: clearing stale stripe_customer_id failed", {
          code: updateError.code,
          message: updateError.message,
        });
      }
      return NextResponse.json({ error: "no_subscription" }, { status: 400 });
    }
    throw err;
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${appUrl}/settings`,
  });

  return NextResponse.json({ url: portalSession.url });
}
