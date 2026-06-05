import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { buildPrompt } from "@/lib/prompts";
import { CoffeeInput } from "@/types";

const client = new Anthropic();

export async function POST(req: NextRequest) {
  try {
    const input: CoffeeInput = await req.json();

    if (!input.coffeeName || !input.brewMethod || !input.dose) {
      return NextResponse.json(
        { error: "Missing required fields: coffeeName, brewMethod, dose" },
        { status: 400 }
      );
    }

    const prompt = buildPrompt(input);

    const message = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const rawText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Strip markdown code fences if model wrapped the JSON
    const cleaned = rawText
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/, "")
      .trim();

    let recipe;
    try {
      recipe = JSON.parse(cleaned);
    } catch {
      console.error("JSON parse failed. Raw output:", rawText);
      return NextResponse.json(
        {
          error:
            "AI returned invalid JSON. Please try again.",
          raw: rawText,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({ recipe });
  } catch (err) {
    console.error("generate-recipe error:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
