import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { buildPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { CoffeeInput } from "@/types";

// Plain admin client — no cookies, no user session, always bypasses RLS
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const client = new Anthropic();

async function logFailure(userId: string, currentBalance: number, description: string) {
  try {
    const { error } = await getAdminClient().from("transactions").insert({
      user_id: userId,
      type: "refund",
      amount: 0,
      balance_after: currentBalance,
      description,
    });
    if (error) console.error("logFailure insert error:", error.message);
  } catch (e) {
    console.error("logFailure threw:", e);
  }
}

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Fetch profile — create it if missing (trigger may have failed silently)
  let { data: profile } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const service = getAdminClient();
    await service.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
      credit_balance: 3,
    }).select().single();
    await service.from("transactions").insert({
      user_id: user.id,
      type: "bonus",
      amount: 3,
      balance_after: 3,
      description: "Welcome bonus — 3 free credits",
    });
    profile = { credit_balance: 3 };
  }

  if (profile.credit_balance < 1) {
    return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const input: CoffeeInput = await req.json();

  if (!input.coffeeName || !input.brewMethod || !input.dose) {
    return NextResponse.json(
      { error: "Missing required fields: coffeeName, brewMethod, dose" },
      { status: 400 }
    );
  }

  // Credit is deducted AFTER a successful generation (see deduct_credit below).
  // If generation fails at any point before that, no credit is charged.
  // Failures are logged to the transactions table (type: 'refund', amount: 0)
  // so there is an audit trail of what happened and when.
  try {
    const prompt = buildPrompt(input);
    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let recipe;
    try {
      recipe = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed:", rawText);
      await logFailure(
        user.id,
        profile.credit_balance,
        `Generation failed (unparseable AI response) — ${input.coffeeName} / ${input.brewMethod} — credit not charged`,
      );
      return NextResponse.json(
        { error: "Something went wrong generating your recipe. Please try again." },
        { status: 422 }
      );
    }

    // Deduct credit atomically after successful generation
    const { error: deductError } = await supabase.rpc("deduct_credit", {
      user_uuid: user.id,
      description_text: `Recipe: ${input.coffeeName} — ${input.brewMethod}`,
    });

    if (deductError) {
      if (deductError.message.includes("insufficient_credits")) {
        return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
      }
      // Non-fatal DB hiccup — log it but still return the recipe
      console.error("Credit deduction failed:", deductError);
    }

    // Get updated balance for client
    const { data: updated } = await supabase
      .from("profiles")
      .select("credit_balance")
      .eq("id", user.id)
      .single();

    return NextResponse.json({ recipe, creditsRemaining: updated?.credit_balance ?? null });
  } catch (err) {
    console.error("generate-recipe error:", err);
    await logFailure(
      user.id,
      profile.credit_balance,
      `Generation failed (API error) — ${input.coffeeName} / ${input.brewMethod} — credit not charged`,
    );
    return NextResponse.json(
      { error: "Something went wrong generating your recipe. Please try again." },
      { status: 500 }
    );
  }
}
