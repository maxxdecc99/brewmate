"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CoffeeInput,
  BrewMethod,
  Process,
  RoastLevel,
  BurrType,
  UserPreference,
  GeneratedRecipe,
} from "@/types";
import { saveAIRecipe, isLogLimitError } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/client";
import RecipeCard from "@/components/ui/RecipeCard";
import StarRating from "@/components/ui/StarRating";
import Spinner from "@/components/ui/Spinner";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import { Label, Input, Select, Textarea } from "@/components/ui/FormField";

const BREW_METHODS: BrewMethod[] = [
  "V60",
  "Kalita",
  "Chemex",
  "AeroPress",
  "French Press",
  "Espresso",
];
const PROCESSES: Process[] = [
  "washed",
  "natural",
  "honey",
  "anaerobic",
  "decaf",
  "unknown",
];
const ROAST_LEVELS: RoastLevel[] = [
  "light",
  "medium",
  "dark",
  "filter roast",
  "espresso roast",
  "unknown",
];
const BURR_TYPES: BurrType[] = ["flat", "conical", "unknown"];
const PREFERENCES: UserPreference[] = [
  "balanced",
  "sweeter",
  "brighter",
  "stronger",
  "lower acidity",
];

const DEFAULT_INPUT: CoffeeInput = {
  coffeeName: "",
  roaster: "",
  origin: "",
  variety: "",
  process: "washed",
  roastLevel: "light",
  tastingNotes: "",
  brewMethod: "V60",
  dose: 15,
  grinder: "",
  burrType: "unknown",
  preference: "balanced",
};

type View = "form" | "result";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta border-b border-line pb-2">
        {title}
      </h2>
      {children}
    </div>
  );
}

export default function GeneratePage() {
  const router = useRouter();
  const [view, setView] = useState<View>("form");
  const [input, setInput] = useState<CoffeeInput>(DEFAULT_INPUT);
  const [recipe, setRecipe] = useState<GeneratedRecipe | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rating, setRating] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [saved, setSaved] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveLimitReached, setSaveLimitReached] = useState(false);
  const [entitled, setEntitled] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) {
        router.push("/auth/login?next=/generate");
        return;
      }
      supabase
        .from("profiles")
        .select("is_brew_plus_active")
        .eq("id", user.id)
        .single()
        .then(({ data }) => setEntitled(data?.is_brew_plus_active ?? false));
    });
  }, [router]);

  function set<K extends keyof CoffeeInput>(key: K, value: CoffeeInput[K]) {
    setInput((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRecipe(null);

    try {
      const res = await fetch("/api/generate-recipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      const data = await res.json();

      if (res.status === 403 || data.error === "subscription_required") {
        // Defensive: covers a subscription lapsing between page load and
        // submit (e.g. a long-idle tab). Re-gate the page.
        setEntitled(false);
        setLoading(false);
        return;
      }

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      router.refresh();
      setRecipe(data.recipe);
      setView("result");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!recipe) return;
    setSaveLoading(true);
    setSaveError(null);
    setSaveLimitReached(false);
    try {
      await saveAIRecipe(recipe, input, rating, userNotes);
      setSaved(true);
    } catch (err) {
      if (isLogLimitError(err)) {
        setSaveLimitReached(true);
      } else {
        setSaveError("Failed to save recipe. Please try again.");
      }
    } finally {
      setSaveLoading(false);
    }
  }

  function handleNewRecipe() {
    setView("form");
    setRecipe(null);
    setRating(0);
    setUserNotes("");
    setSaved(false);
    setError(null);
  }

  if (entitled === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-muted" />
      </div>
    );
  }

  if (entitled === false) {
    return <UpgradePrompt reason="ai_locked" />;
  }

  if (view === "result" && recipe) {
    const isEspresso = recipe.brewMethod === "Espresso";

    return (
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b border-line pb-6">
          <button
            onClick={handleNewRecipe}
            className="text-sm font-bold text-muted hover:text-ink self-start transition-colors"
          >
            ← New Recipe
          </button>
          <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight leading-none text-ink">
            {recipe.coffeeName}
          </h1>
          <span className="inline-block self-start -rotate-2 font-heading text-sm font-bold text-cream bg-olive rounded-full px-3 py-1">
            {recipe.brewMethod}
          </span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RecipeCard label="Dose" value={`${recipe.dose}g`} tone="terracotta" />
          {isEspresso && recipe.yield ? (
            <RecipeCard label="Yield" value={`${recipe.yield}g`} tone="gold" />
          ) : (
            <RecipeCard label="Water" value={`${recipe.waterAmount}g`} tone="gold" />
          )}
          <RecipeCard label="Ratio" value={recipe.ratio} tone="olive" />
          <RecipeCard label="Grind" value={`${recipe.grindMicrons}µm`} tone="surface" />
          <RecipeCard
            label="Temperature"
            value={`${recipe.temperatureC}°C`}
            sub={`${recipe.temperatureF}°F`}
            tone="surface"
          />
          <RecipeCard label="Total Time" value={recipe.totalTime} tone="surface" />
          {isEspresso && recipe.pressure && (
            <RecipeCard label="Pressure" value={recipe.pressure} tone="surface" />
          )}
          {isEspresso && recipe.shotTime && (
            <RecipeCard label="Shot Time" value={recipe.shotTime} tone="surface" />
          )}
        </div>

        {/* Pre-infusion (espresso) */}
        {isEspresso && recipe.preInfusion && (
          <div className="rounded-2xl bg-gold p-5">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-ink/70 block mb-1">
              Pre-infusion
            </span>
            <p className="text-ink font-medium">{recipe.preInfusion}</p>
          </div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">
            Recipe Steps
          </h2>
          <div className="flex flex-col gap-3">
            {recipe.steps.map((step, i) => (
              <div
                key={i}
                className="rounded-2xl border border-line bg-surface p-5 flex gap-4"
              >
                <span className="font-heading text-2xl font-bold text-terracotta leading-none mt-0.5">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-heading font-bold text-ink">{step.title}</span>
                    <span className="text-xs font-bold text-muted whitespace-nowrap">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-muted text-sm leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Adjustment tips */}
        {recipe.adjustmentTips.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">
              Dial-In Tips
            </h2>
            <div className="rounded-2xl border border-line bg-surface divide-y divide-line">
              {recipe.adjustmentTips.map((tip, i) => (
                <p key={i} className="px-5 py-3 text-sm text-ink/80 leading-relaxed">
                  → {tip}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="rounded-2xl bg-surface-soft border border-line p-5">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
              Notes
            </span>
            <p className="text-ink/80 text-sm leading-relaxed">{recipe.notes}</p>
          </div>
        )}

        {/* Save to brew log */}
        <div className="border-t border-line pt-8 flex flex-col gap-5">
          <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">
            Save to Brew Log
          </h2>
          <div className="flex flex-col gap-2">
            <Label>Your Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Notes (optional)</Label>
            <Textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="How did it taste? What would you change?"
              rows={3}
            />
          </div>
          {saved ? (
            <div className="flex items-center gap-4">
              <span className="font-bold text-terracotta">Saved to Brew Log ✓</span>
              <button
                onClick={() => router.push("/log")}
                className="font-bold text-ink/70 underline underline-offset-2 hover:text-ink"
              >
                View Log →
              </button>
            </div>
          ) : saveLimitReached ? (
            <UpgradePrompt reason="log_limit" />
          ) : (
            <div className="flex flex-col gap-3">
              {saveError && (
                <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="font-heading self-start bg-ink text-cream font-bold px-8 py-3 rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {saveLoading ? "Saving…" : "Save Recipe"}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-ink">
          Generate Recipe
        </h1>
        <p className="text-muted font-medium">
          Tell us about your coffee and we&apos;ll craft a precision recipe.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-10">
        <fieldset disabled={loading} className="contents">
        {/* Coffee info */}
        <Section title="Coffee Info">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Coffee Name *</Label>
              <Input
                required
                placeholder="e.g. Yirgacheffe Kochere"
                value={input.coffeeName}
                onChange={(e) => set("coffeeName", e.target.value)}
              />
            </div>
            <div>
              <Label>Roaster *</Label>
              <Input
                required
                placeholder="e.g. Koppi"
                value={input.roaster}
                onChange={(e) => set("roaster", e.target.value)}
              />
            </div>
            <div>
              <Label>Origin *</Label>
              <Input
                required
                placeholder="e.g. Ethiopia"
                value={input.origin}
                onChange={(e) => set("origin", e.target.value)}
              />
            </div>
            <div>
              <Label>Variety (optional)</Label>
              <Input
                placeholder="e.g. Heirloom, Gesha"
                value={input.variety ?? ""}
                onChange={(e) => set("variety", e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Process *</Label>
              <Select
                value={input.process}
                onChange={(e) => set("process", e.target.value as Process)}
              >
                {PROCESSES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Roast Level *</Label>
              <Select
                value={input.roastLevel}
                onChange={(e) => set("roastLevel", e.target.value as RoastLevel)}
              >
                {ROAST_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label>Tasting Notes *</Label>
            <Input
              required
              placeholder="e.g. blueberry, jasmine, dark chocolate"
              value={input.tastingNotes}
              onChange={(e) => set("tastingNotes", e.target.value)}
            />
          </div>
        </Section>

        {/* Brew setup */}
        <Section title="Brew Setup">
          <div>
            <Label>Brew Method *</Label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {BREW_METHODS.map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => set("brewMethod", m)}
                  className={`font-heading rounded-xl px-3 py-3 text-sm font-bold transition-colors ${
                    input.brewMethod === m
                      ? "bg-ink text-cream"
                      : "bg-surface text-ink/70 border border-line hover:bg-gold hover:text-ink"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Coffee Dose (g) *</Label>
              <Input
                required
                type="number"
                min={5}
                max={50}
                step={0.5}
                value={input.dose}
                onChange={(e) => set("dose", parseFloat(e.target.value) || 15)}
              />
            </div>
            <div>
              <Label>Preference *</Label>
              <Select
                value={input.preference}
                onChange={(e) =>
                  set("preference", e.target.value as UserPreference)
                }
              >
                {PREFERENCES.map((p) => (
                  <option key={p} value={p}>
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Section>

        {/* Grinder */}
        <Section title="Grinder (Optional)">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Grinder Model</Label>
              <Input
                placeholder="e.g. Comandante C40"
                value={input.grinder ?? ""}
                onChange={(e) => set("grinder", e.target.value)}
              />
            </div>
            <div>
              <Label>Burr Type</Label>
              <Select
                value={input.burrType ?? "unknown"}
                onChange={(e) => set("burrType", e.target.value as BurrType)}
              >
                {BURR_TYPES.map((b) => (
                  <option key={b} value={b}>
                    {b.charAt(0).toUpperCase() + b.slice(1)}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </Section>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-5 py-4 text-red-700 font-medium text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={loading}
            className="font-heading bg-ink text-cream font-bold px-10 py-4 text-lg rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-3"
          >
            {loading && <Spinner />}
            {loading ? "Brewing…" : "Generate Recipe →"}
          </button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
