"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  CoffeeInput,
  BrewMethod,
  Process,
  RoastLevel,
  BurrType,
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
};

type View = "form" | "result";

function Section({
  n,
  title,
  optional,
  children,
}: {
  n: string;
  title: string;
  optional?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
        {n} — {title}{" "}
        {optional && <span className="text-muted">(Optional)</span>}
      </h2>
      <div className="h-0.5 bg-ink" />
      {children}
    </div>
  );
}

function Chip({
  label,
  active,
  onClick,
  fillInk = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  fillInk?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-heading px-3 py-2.5 text-xs font-bold uppercase tracking-wide border transition-colors ${
        active
          ? fillInk
            ? "bg-ink text-cream border-ink"
            : "bg-terracotta text-white border-terracotta"
          : "bg-transparent text-espresso/70 border-line hover:border-ink"
      }`}
    >
      {label}
    </button>
  );
}

const GENERATING_STEPS = [
  "Reading the bean",
  "Matching grind to your gear",
  "Writing the pour schedule",
  "Dial-in corrections",
];

function GeneratingOverlay({ input }: { input: CoffeeInput }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => Math.min(s + 1, GENERATING_STEPS.length - 1));
    }, 900);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-terracotta text-white flex flex-col overflow-y-auto">
      <div className="max-w-4xl mx-auto w-full px-4 py-16 flex flex-col gap-10 flex-1">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-white/80">
          {input.brewMethod} · {input.coffeeName || "Your coffee"} · {input.dose}g
        </span>
        <h1 className="font-heading text-5xl sm:text-7xl font-extrabold uppercase tracking-tight leading-[0.86]">
          Dialling<br />it in
        </h1>
        <div className="flex flex-col mt-4">
          {GENERATING_STEPS.map((label, i) => (
            <div
              key={label}
              className="flex items-center justify-between py-4 border-t border-white/45 font-heading font-bold text-sm"
            >
              <span className={i > step ? "text-white/45" : ""}>{label}</span>
              <span>{i < step ? "✓" : i === step ? "···" : ""}</span>
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex flex-col gap-3">
          <div className="h-1 bg-white/35">
            <div
              className="h-1 bg-white transition-all duration-700"
              style={{ width: `${((step + 1) / GENERATING_STEPS.length) * 100}%` }}
            />
          </div>
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-white/85">
            Usually a few seconds
          </span>
        </div>
      </div>
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

    const specCards = [
      { label: "Dose", value: `${recipe.dose}g` },
      isEspresso && recipe.yield
        ? { label: "Yield", value: `${recipe.yield}g` }
        : { label: "Water", value: `${recipe.waterAmount}g` },
      { label: "Ratio", value: recipe.ratio },
      { label: "Grind", value: `${recipe.grindMicrons}µm` },
      { label: "Temperature", value: `${recipe.temperatureC}°C`, sub: `${recipe.temperatureF}°F` },
      { label: "Total Time", value: recipe.totalTime },
      ...(isEspresso && recipe.pressure ? [{ label: "Pressure", value: recipe.pressure }] : []),
      ...(isEspresso && recipe.shotTime ? [{ label: "Shot Time", value: recipe.shotTime }] : []),
    ];
    const toneAt = (i: number): "terracotta" | "ink" | "surface" =>
      i % 3 === 0 ? "terracotta" : i % 3 === 2 ? "ink" : "surface";

    return (
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="-mx-4 sm:mx-0 bg-ink text-cream px-4 sm:px-8 py-8 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-terracotta pt-1">
              {recipe.brewMethod} Recipe
            </span>
            <button
              onClick={handleNewRecipe}
              className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-cream border border-cream/55 px-3 py-2 hover:bg-cream/10 transition-colors shrink-0"
            >
              New
            </button>
          </div>
          <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1] text-cream">
            {recipe.coffeeName}
          </h1>
          <div className="font-heading text-6xl sm:text-7xl font-extrabold tracking-tight leading-[0.9] text-terracotta">
            {recipe.ratio}
          </div>
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-[#8D8880]">
            Brew Ratio
          </span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 bg-line">
          {specCards.map((c, i) => (
            <RecipeCard key={c.label} label={c.label} value={c.value} sub={"sub" in c ? c.sub : undefined} tone={toneAt(i)} />
          ))}
        </div>

        {/* Pre-infusion (espresso) */}
        {isEspresso && recipe.preInfusion && (
          <div className="border-l-2 border-terracotta bg-surface p-5">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
              Pre-infusion
            </span>
            <p className="text-espresso font-medium">{recipe.preInfusion}</p>
          </div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-extrabold text-xl text-terracotta uppercase tracking-wide">
            Recipe Steps
          </h2>
          <div className="flex flex-col">
            {recipe.steps.map((step, i) => (
              <div
                key={i}
                className="flex gap-4 py-4 border-b border-line"
              >
                <span className="font-heading text-2xl font-extrabold text-terracotta leading-none w-9 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-heading font-extrabold uppercase text-espresso">{step.title}</span>
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
          <button
            onClick={() => {
              sessionStorage.setItem(
                "activeBrewTimer",
                JSON.stringify({
                  coffeeName: recipe.coffeeName,
                  brewMethod: recipe.brewMethod,
                  totalTime: recipe.totalTime,
                  steps: recipe.steps,
                })
              );
              router.push("/brew/timer");
            }}
            className="font-heading self-start mt-2 bg-ink text-cream font-bold uppercase tracking-wide px-6 py-3 hover:bg-[#2a2725] transition-colors inline-flex items-center gap-2"
          >
            Start Brew Timer →
          </button>
        </div>

        {/* Adjustment tips */}
        {recipe.adjustmentTips.length > 0 && (
          <div className="flex flex-col gap-3">
            <h2 className="font-heading font-extrabold text-xl text-terracotta uppercase tracking-wide">
              Dial-In Tips
            </h2>
            <div className="border-t border-line">
              {recipe.adjustmentTips.map((tip, i) => (
                <p key={i} className="py-3 border-b border-line text-sm text-espresso/80 leading-relaxed">
                  → {tip}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="bg-surface border-l-2 border-terracotta p-5">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
              Notes
            </span>
            <p className="text-espresso/80 text-sm leading-relaxed">{recipe.notes}</p>
          </div>
        )}

        {/* Save to brew log */}
        <div className="border-t-2 border-ink pt-8 flex flex-col gap-5">
          <h2 className="font-heading font-extrabold text-xl text-ink uppercase tracking-wide">
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
              <span className="font-heading font-bold uppercase text-terracotta">Saved to Brew Log ✓</span>
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
                <div className="border-2 border-terracotta px-4 py-3 text-terracotta text-sm font-bold">
                  {saveError}
                </div>
              )}
              <button
                onClick={handleSave}
                disabled={saveLoading}
                className="font-heading self-start bg-terracotta text-white font-bold uppercase tracking-wide px-8 py-3 hover:bg-[#dd2b0f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
      {loading && <GeneratingOverlay input={input} />}
      <div className="flex flex-col gap-2 border-b-2 border-ink pb-6">
        <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">
          Generate
        </h1>
        <p className="text-muted font-medium">
          Tell us about your coffee and we&apos;ll craft a precision recipe.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-10">
        <fieldset disabled={loading} className="contents">
        {/* Coffee info */}
        <Section n="01" title="Coffee Info">
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
        <Section n="02" title="Brew Setup">
          <div>
            <Label>Brew Method *</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BREW_METHODS.map((m) => (
                <Chip
                  key={m}
                  label={m}
                  active={input.brewMethod === m}
                  onClick={() => set("brewMethod", m)}
                />
              ))}
            </div>
          </div>

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
        </Section>

        {/* Grinder */}
        <Section n="03" title="Grinder" optional>
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
              <div className="flex flex-wrap gap-2 pt-1">
                {BURR_TYPES.map((b) => (
                  <Chip
                    key={b}
                    label={b}
                    active={(input.burrType ?? "unknown") === b}
                    fillInk
                    onClick={() => set("burrType", b)}
                  />
                ))}
              </div>
            </div>
          </div>
        </Section>

        {error && (
          <div className="border-2 border-terracotta px-5 py-4 text-terracotta font-bold text-sm">
            {error}
          </div>
        )}

        <div className="flex items-center gap-4 flex-wrap">
          <button
            type="submit"
            disabled={loading}
            className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide px-10 py-4 text-base hover:bg-[#dd2b0f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center gap-3"
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
