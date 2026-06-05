"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CoffeeInput,
  BrewMethod,
  Process,
  RoastLevel,
  BurrType,
  UserPreference,
  GeneratedRecipe,
  SavedRecipe,
} from "@/types";
import { saveToBrewLog } from "@/lib/brewLog";
import RecipeCard from "@/components/ui/RecipeCard";
import StarRating from "@/components/ui/StarRating";

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

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
      {children}
    </label>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full border-2 border-stone-900 bg-white px-4 py-3 text-stone-900 font-medium focus:outline-none focus:border-amber-500 transition-colors placeholder:text-stone-400"
    />
  );
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full border-2 border-stone-900 bg-white px-4 py-3 text-stone-900 font-medium focus:outline-none focus:border-amber-500 transition-colors appearance-none"
    />
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b-2 border-stone-200 pb-2">
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

      if (!res.ok || data.error) {
        setError(data.error ?? "Something went wrong.");
        setLoading(false);
        return;
      }

      setRecipe(data.recipe);
      setView("result");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleSave() {
    if (!recipe) return;
    const entry: SavedRecipe = {
      id: Date.now().toString(),
      input,
      recipe,
      rating,
      userNotes,
      createdAt: new Date().toISOString(),
    };
    saveToBrewLog(entry);
    setSaved(true);
  }

  function handleNewRecipe() {
    setView("form");
    setRecipe(null);
    setRating(0);
    setUserNotes("");
    setSaved(false);
    setError(null);
  }

  if (view === "result" && recipe) {
    const isEspresso = recipe.brewMethod === "Espresso";

    return (
      <div className="flex flex-col gap-10">
        {/* Header */}
        <div className="flex flex-col gap-3 border-b-2 border-stone-900 pb-6">
          <button
            onClick={handleNewRecipe}
            className="text-sm font-bold text-stone-500 hover:text-stone-900 self-start transition-colors"
          >
            ← New Recipe
          </button>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
            {recipe.coffeeName}
          </h1>
          <span className="text-lg text-amber-600 font-bold">
            {recipe.brewMethod}
          </span>
        </div>

        {/* Metric cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <RecipeCard label="Dose" value={`${recipe.dose}g`} />
          {isEspresso && recipe.yield ? (
            <RecipeCard label="Yield" value={`${recipe.yield}g`} />
          ) : (
            <RecipeCard label="Water" value={`${recipe.waterAmount}g`} />
          )}
          <RecipeCard label="Ratio" value={recipe.ratio} />
          <RecipeCard label="Grind" value={`${recipe.grindMicrons}µm`} />
          <RecipeCard
            label="Temperature"
            value={`${recipe.temperatureC}°C`}
            sub={`${recipe.temperatureF}°F`}
          />
          <RecipeCard label="Total Time" value={recipe.totalTime} />
          {isEspresso && recipe.pressure && (
            <RecipeCard label="Pressure" value={recipe.pressure} />
          )}
          {isEspresso && recipe.shotTime && (
            <RecipeCard label="Shot Time" value={recipe.shotTime} />
          )}
        </div>

        {/* Pre-infusion (espresso) */}
        {isEspresso && recipe.preInfusion && (
          <div className="border-2 border-amber-400 bg-amber-50 p-5">
            <span className="text-xs font-black uppercase tracking-widest text-amber-700 block mb-1">
              Pre-infusion
            </span>
            <p className="text-stone-900 font-medium">{recipe.preInfusion}</p>
          </div>
        )}

        {/* Steps */}
        <div className="flex flex-col gap-4">
          <h2 className="font-black text-xl text-stone-900 uppercase tracking-wide">
            Recipe Steps
          </h2>
          <div className="flex flex-col gap-3">
            {recipe.steps.map((step, i) => (
              <div
                key={i}
                className="border-2 border-stone-900 bg-white p-5 flex gap-4"
              >
                <span className="text-2xl font-black text-amber-500 leading-none mt-0.5">
                  {i + 1}
                </span>
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-black text-stone-900">{step.title}</span>
                    <span className="text-xs font-bold text-stone-400 whitespace-nowrap">
                      {step.time}
                    </span>
                  </div>
                  <p className="text-stone-600 text-sm leading-relaxed">
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
            <h2 className="font-black text-xl text-stone-900 uppercase tracking-wide">
              Dial-In Tips
            </h2>
            <div className="border-2 border-stone-900 bg-white divide-y-2 divide-stone-100">
              {recipe.adjustmentTips.map((tip, i) => (
                <p key={i} className="px-5 py-3 text-sm text-stone-700 leading-relaxed">
                  → {tip}
                </p>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {recipe.notes && (
          <div className="border-2 border-stone-300 bg-stone-50 p-5">
            <span className="text-xs font-black uppercase tracking-widest text-stone-400 block mb-1">
              Notes
            </span>
            <p className="text-stone-700 text-sm leading-relaxed">{recipe.notes}</p>
          </div>
        )}

        {/* Save to brew log */}
        <div className="border-t-2 border-stone-900 pt-8 flex flex-col gap-5">
          <h2 className="font-black text-xl text-stone-900 uppercase tracking-wide">
            Save to Brew Log
          </h2>
          <div className="flex flex-col gap-2">
            <Label>Your Rating</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>
          <div className="flex flex-col gap-2">
            <Label>Notes (optional)</Label>
            <textarea
              value={userNotes}
              onChange={(e) => setUserNotes(e.target.value)}
              placeholder="How did it taste? What would you change?"
              rows={3}
              className="w-full border-2 border-stone-900 bg-white px-4 py-3 text-stone-900 font-medium focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder:text-stone-400"
            />
          </div>
          {saved ? (
            <div className="flex items-center gap-4">
              <span className="font-bold text-amber-600">Saved to Brew Log ✓</span>
              <button
                onClick={() => router.push("/log")}
                className="font-bold text-stone-700 underline underline-offset-2 hover:text-stone-900"
              >
                View Log →
              </button>
            </div>
          ) : (
            <button
              onClick={handleSave}
              className="self-start bg-stone-900 text-[#FAF7F2] font-bold px-8 py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 transition-colors"
            >
              Save Recipe
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black tracking-tighter text-stone-900">
          Generate Recipe
        </h1>
        <p className="text-stone-500 font-medium">
          Tell us about your coffee and we&apos;ll craft a precision recipe.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="flex flex-col gap-10">
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
                  className={`px-3 py-3 text-sm font-bold border-2 transition-colors ${
                    input.brewMethod === m
                      ? "bg-stone-900 text-[#FAF7F2] border-stone-900"
                      : "bg-white text-stone-700 border-stone-900 hover:bg-stone-100"
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
          <div className="border-2 border-red-400 bg-red-50 px-5 py-4 text-red-700 font-medium text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="self-start bg-stone-900 text-[#FAF7F2] font-black px-10 py-4 text-lg border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Brewing…" : "Generate Recipe →"}
        </button>
      </form>
    </div>
  );
}
