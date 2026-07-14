import { NextRequest, NextResponse } from "next/server";
import { stripe, PLAN_PRICE_IDS } from "@/lib/stripe";
import type { PlanId } from "@/lib/subscriptionPlans";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { plan } = await req.json();
  const priceId = PLAN_PRICE_IDS[plan as PlanId];

  if (!priceId) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  let customerId = profile?.stripe_customer_id ?? null;

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: { user_id: user.id },
    });
    customerId = customer.id;

    // profiles has no UPDATE policy for `authenticated` — must use the
    // service-role client, or this silently updates 0 rows.
    const service = await createServiceClient();
    await service.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    subscription_data: { metadata: { user_id: user.id } },
    metadata: { user_id: user.id },
    success_url: `${appUrl}/account?success=true`,
    cancel_url: `${appUrl}/pricing?cancelled=true`,
  });

  return NextResponse.json({ url: session.url });
}
