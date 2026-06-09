import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt } from "@/lib/prompts";
import { createClient } from "@/lib/supabase/server";
import { CoffeeInput } from "@/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  // Auth check
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Check credit balance before AI call
  const { data: profile } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", user.id)
    .single();

  if (!profile || profile.credit_balance < 1) {
    return NextResponse.json({ error: "insufficient_credits" }, { status: 402 });
  }

  const input: CoffeeInput = await req.json();

  if (!input.coffeeName || !input.brewMethod || !input.dose) {
    return NextResponse.json(
      { error: "Missing required fields: coffeeName, brewMethod, dose" },
      { status: 400 }
    );
  }

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
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
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
      // Log but return recipe — don't punish user for DB hiccup
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
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
