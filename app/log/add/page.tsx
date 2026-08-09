"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveManualRecipe, isLogLimitError } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import UpgradePrompt from "@/components/ui/UpgradePrompt";
import { Label, Input, Select, Textarea } from "@/components/ui/FormField";

const BREW_METHODS = [
  "V60", "Kalita", "Chemex", "AeroPress", "French Press", "Espresso", "Other",
];

export default function AddRecipePage() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [brewMethod, setBrewMethod] = useState("");
  const [bean, setBean] = useState("");
  const [ratio, setRatio] = useState("");
  const [grindSetting, setGrindSetting] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [bloom, setBloom] = useState("");
  const [brewSteps, setBrewSteps] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [canSave, setCanSave] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("is_brew_plus_active, logs_created_count")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setCanSave(!!data?.is_brew_plus_active || (data?.logs_created_count ?? 0) < 10);
        });
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await saveManualRecipe({
        title: title.trim() || undefined,
        brewMethod: brewMethod || undefined,
        bean: bean.trim() || undefined,
        ratio: ratio.trim() || undefined,
        grindSetting: grindSetting.trim() || undefined,
        waterTemp: waterTemp.trim() || undefined,
        bloom: bloom.trim() || undefined,
        brewSteps: brewSteps.trim() || undefined,
        totalTime: totalTime.trim() || undefined,
        userNotes: notes.trim() || undefined,
      });
      router.push("/log");
    } catch (err) {
      // isLogLimitError is the authoritative check here (race: canSave was
      // true on load but the limit was hit meanwhile, e.g. another tab).
      if (isLogLimitError(err)) {
        setCanSave(false);
      } else {
        setError("Failed to save recipe. Please try again.");
      }
      setLoading(false);
    }
  }

  if (canSave === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-muted" />
      </div>
    );
  }

  if (!canSave) {
    return <UpgradePrompt reason="log_limit" />;
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-3">
        <button
          onClick={() => router.push("/log")}
          className="text-sm font-bold text-muted hover:text-ink self-start transition-colors"
        >
          ← Brew Log
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Add Your Recipe</h1>
            <span className="font-heading text-xs font-bold uppercase tracking-widest bg-surface-soft text-ink/70 border border-line rounded-full px-2.5 py-0.5">
              Free
            </span>
          </div>
          <p className="text-muted font-medium">
            Log a recipe you already know — no AI needed. All fields are optional.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* Identity */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta border-b border-line pb-2">
            Coffee
          </h2>
          <div>
            <Label>Recipe Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My go-to V60, Mum's French Press" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Brew Method</Label>
              <Select
                value={brewMethod}
                onChange={(e) => setBrewMethod(e.target.value)}
              >
                <option value="">— Select —</option>
                {BREW_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
            <div>
              <Label>Coffee / Roaster</Label>
              <Input value={bean} onChange={(e) => setBean(e.target.value)} placeholder="e.g. Koppi Yirgacheffe" />
            </div>
          </div>
        </div>

        {/* Recipe parameters */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta border-b border-line pb-2">
            Recipe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Ratio</Label>
              <Input value={ratio} onChange={(e) => setRatio(e.target.value)} placeholder="e.g. 1:16" />
            </div>
            <div>
              <Label>Water Temperature</Label>
              <Input value={waterTemp} onChange={(e) => setWaterTemp(e.target.value)} placeholder="e.g. 94°C" />
            </div>
            <div>
              <Label>Grind Setting</Label>
              <Input value={grindSetting} onChange={(e) => setGrindSetting(e.target.value)} placeholder="e.g. 24 clicks on Comandante" />
            </div>
            <div>
              <Label>Total Brew Time</Label>
              <Input value={totalTime} onChange={(e) => setTotalTime(e.target.value)} placeholder="e.g. 3:00" />
            </div>
          </div>
          <div>
            <Label>Bloom</Label>
            <Input value={bloom} onChange={(e) => setBloom(e.target.value)} placeholder="e.g. 45g for 45s" />
          </div>
          <div>
            <Label>Brew Steps / Pour Schedule</Label>
            <Textarea
              value={brewSteps}
              onChange={(e) => setBrewSteps(e.target.value)}
              rows={5}
              placeholder={"e.g.\n0:00 — Bloom 45g\n0:45 — Pour to 150g\n1:30 — Pour to 250g\n3:00 — Drawdown complete"}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-4">
          <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta border-b border-line pb-2">
            Notes
          </h2>
          <div>
            <Label>Tasting Notes / Personal Notes</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="How did it taste? What would you change next time?"
            />
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-4 items-center">
          <button
            type="submit"
            disabled={loading}
            className="font-heading bg-ink text-cream font-bold px-8 py-4 rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving…" : "Save to Brew Log →"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/log")}
            className="font-bold text-muted hover:text-ink transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
