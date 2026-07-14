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
    .select("is_brew_plus_active")
    .eq("id", user.id)
    .single();

  if (!profile) {
    const service = getAdminClient();
    await service.from("profiles").insert({
      id: user.id,
      email: user.email ?? "",
    }).select().single();
    profile = { is_brew_plus_active: false };
  }

  if (!profile.is_brew_plus_active) {
    return NextResponse.json({ error: "subscription_required" }, { status: 403 });
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
        { error: "Something went wrong generating your recipe. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("generate-recipe error:", err);
    return NextResponse.json(
      { error: "Something went wrong generating your recipe. Please try again." },
      { status: 500 }
    );
  }
}
