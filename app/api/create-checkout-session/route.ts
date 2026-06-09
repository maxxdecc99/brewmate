import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { CREDIT_PACKAGES } from "@/lib/creditPackages";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { credits } = await req.json();
  const pkg = CREDIT_PACKAGES.find((p) => p.credits === credits);

  if (!pkg) {
    return NextResponse.json({ error: "Invalid credit package" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: pkg.priceCents,
          product_data: {
            name: `BrewMate — ${pkg.label}`,
            description: `${pkg.credits} recipe generation credits`,
          },
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    metadata: {
      user_id: user.id,
      credits: String(pkg.credits),
      price_cents: String(pkg.priceCents),
    },
    success_url: `${appUrl}/account?success=true`,
    cancel_url: `${appUrl}/account?cancelled=true`,
  });

  return NextResponse.json({ url: session.url });
}
