import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.user_id;
    const credits = parseInt(session.metadata?.credits ?? "0");
    const priceCents = parseInt(session.metadata?.price_cents ?? "0");

    if (!userId || !credits) {
      console.error("Webhook: missing metadata", session.metadata);
      return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
    }

    const supabase = await createServiceClient();
    const { error } = await supabase.rpc("add_purchased_credits", {
      user_uuid: userId,
      credit_amount: credits,
      stripe_session: session.id,
      description_text: `${credits} credits purchased`,
      price_cents_amount: priceCents,
    });

    if (error) {
      console.error("Webhook: failed to add credits:", error);
      return NextResponse.json({ error: "Failed to add credits" }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
