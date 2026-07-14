"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { saveManualRecipe, isLogLimitError } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";
import UpgradePrompt from "@/components/ui/UpgradePrompt";

const BREW_METHODS = [
  "V60", "Kalita", "Chemex", "AeroPress", "French Press", "Espresso", "Other",
];

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors placeholder:text-stone-400"
    />
  );
}

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
        <Spinner className="h-8 w-8 text-stone-400" />
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
          className="text-sm font-bold text-stone-500 hover:text-stone-900 self-start transition-colors"
        >
          ← Brew Log
        </button>
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-4xl font-black tracking-tighter">Add Your Recipe</h1>
            <span className="text-xs font-black uppercase tracking-widest bg-stone-200 text-stone-600 px-2 py-0.5 border border-stone-300">
              Free
            </span>
          </div>
          <p className="text-stone-500 font-medium">
            Log a recipe you already know — no AI needed. All fields are optional.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-8">

        {/* Identity */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b-2 border-stone-200 pb-2">
            Coffee
          </h2>
          <div>
            <Label>Recipe Title</Label>
            <TextInput value={title} onChange={setTitle} placeholder="e.g. My go-to V60, Mum's French Press" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Brew Method</Label>
              <select
                value={brewMethod}
                onChange={(e) => setBrewMethod(e.target.value)}
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors appearance-none"
              >
                <option value="">— Select —</option>
                {BREW_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <Label>Coffee / Roaster</Label>
              <TextInput value={bean} onChange={setBean} placeholder="e.g. Koppi Yirgacheffe" />
            </div>
          </div>
        </div>

        {/* Recipe parameters */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b-2 border-stone-200 pb-2">
            Recipe
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Ratio</Label>
              <TextInput value={ratio} onChange={setRatio} placeholder="e.g. 1:16" />
            </div>
            <div>
              <Label>Water Temperature</Label>
              <TextInput value={waterTemp} onChange={setWaterTemp} placeholder="e.g. 94°C" />
            </div>
            <div>
              <Label>Grind Setting</Label>
              <TextInput value={grindSetting} onChange={setGrindSetting} placeholder="e.g. 24 clicks on Comandante" />
            </div>
            <div>
              <Label>Total Brew Time</Label>
              <TextInput value={totalTime} onChange={setTotalTime} placeholder="e.g. 3:00" />
            </div>
          </div>
          <div>
            <Label>Bloom</Label>
            <TextInput value={bloom} onChange={setBloom} placeholder="e.g. 45g for 45s" />
          </div>
          <div>
            <Label>Brew Steps / Pour Schedule</Label>
            <textarea
              value={brewSteps}
              onChange={(e) => setBrewSteps(e.target.value)}
              rows={5}
              className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors resize-y placeholder:text-stone-400"
              placeholder={"e.g.\n0:00 — Bloom 45g\n0:45 — Pour to 150g\n1:30 — Pour to 250g\n3:00 — Drawdown complete"}
            />
          </div>
        </div>

        {/* Notes */}
        <div className="flex flex-col gap-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b-2 border-stone-200 pb-2">
            Notes
          </h2>
          <div>
            <Label>Tasting Notes / Personal Notes</Label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder:text-stone-400"
              placeholder="How did it taste? What would you change next time?"
            />
          </div>
        </div>

        {error && (
          <div className="border-2 border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="flex gap-4 items-center">
          <button
            type="submit"
            disabled={loading}
            className="bg-stone-900 text-[#FAF7F2] font-black px-8 py-4 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Saving…" : "Save to Brew Log →"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/log")}
            className="font-bold text-stone-500 hover:text-stone-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
