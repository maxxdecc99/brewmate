"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeRow } from "@/types";
import { getRecipeById, updateRecipe } from "@/lib/recipes";
import RecipeCard from "@/components/ui/RecipeCard";
import StarRating from "@/components/ui/StarRating";

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

export default function ManualRecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<RecipeRow | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Edit state — mirrors every editable field
  const [title, setTitle] = useState("");
  const [brewMethod, setBrewMethod] = useState("");
  const [bean, setBean] = useState("");
  const [ratio, setRatio] = useState("");
  const [grindSetting, setGrindSetting] = useState("");
  const [waterTemp, setWaterTemp] = useState("");
  const [bloom, setBloom] = useState("");
  const [brewSteps, setBrewSteps] = useState("");
  const [totalTime, setTotalTime] = useState("");
  const [rating, setRating] = useState(0);
  const [userNotes, setUserNotes] = useState("");

  useEffect(() => {
    async function load() {
      const row = await getRecipeById(id);
      if (!row || row.source !== "manual") {
        router.replace("/log");
        return;
      }
      setEntry(row);
      // Seed edit fields from loaded data
      setTitle(row.title ?? "");
      setBrewMethod(row.brew_method ?? "");
      setBean(row.bean ?? "");
      setRatio(row.ratio ?? "");
      setGrindSetting(row.grind_setting ?? "");
      setWaterTemp(row.water_temp ?? "");
      setBloom(row.bloom ?? "");
      setBrewSteps(row.brew_steps ?? "");
      setTotalTime(row.total_time ?? "");
      setRating(row.rating);
      setUserNotes(row.user_notes);
    }
    load();
  }, [id, router]);

  async function handleSave() {
    setSaving(true);
    await updateRecipe(id, {
      title: title.trim() || null,
      brew_method: brewMethod || null,
      bean: bean.trim() || null,
      ratio: ratio.trim() || null,
      grind_setting: grindSetting.trim() || null,
      water_temp: waterTemp.trim() || null,
      bloom: bloom.trim() || null,
      brew_steps: brewSteps.trim() || null,
      total_time: totalTime.trim() || null,
      rating,
      user_notes: userNotes,
    });
    // Update local entry so the read view reflects the changes immediately
    setEntry((prev) => prev && {
      ...prev,
      title: title.trim() || null,
      brew_method: brewMethod || null,
      bean: bean.trim() || null,
      ratio: ratio.trim() || null,
      grind_setting: grindSetting.trim() || null,
      water_temp: waterTemp.trim() || null,
      bloom: bloom.trim() || null,
      brew_steps: brewSteps.trim() || null,
      total_time: totalTime.trim() || null,
      rating,
      user_notes: userNotes,
    });
    setSaving(false);
    setSaved(true);
    setEditing(false);
  }

  function handleCancelEdit() {
    if (!entry) return;
    // Reset fields back to what was last saved
    setTitle(entry.title ?? "");
    setBrewMethod(entry.brew_method ?? "");
    setBean(entry.bean ?? "");
    setRatio(entry.ratio ?? "");
    setGrindSetting(entry.grind_setting ?? "");
    setWaterTemp(entry.water_temp ?? "");
    setBloom(entry.bloom ?? "");
    setBrewSteps(entry.brew_steps ?? "");
    setTotalTime(entry.total_time ?? "");
    setRating(entry.rating);
    setUserNotes(entry.user_notes);
    setEditing(false);
  }

  if (!entry) return null;

  // --- Read view helpers ---
  const metricCards: { label: string; value: string }[] = [
    entry.ratio        && { label: "Ratio",       value: entry.ratio },
    entry.water_temp   && { label: "Temperature", value: entry.water_temp },
    entry.grind_setting && { label: "Grind",      value: entry.grind_setting },
    entry.total_time   && { label: "Total Time",  value: entry.total_time },
  ].filter(Boolean) as { label: string; value: string }[];

  const hasStructuredContent =
    metricCards.length > 0 || entry.bloom || entry.brew_steps;

  // --- Render ---
  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b-2 border-stone-900 pb-6">
        <button
          onClick={() => router.push("/log")}
          className="text-sm font-bold text-stone-500 hover:text-stone-900 self-start transition-colors"
        >
          ← Brew Log
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
              {entry.title || "Untitled Recipe"}
            </h1>
            <span className="text-xs font-black uppercase tracking-widest bg-stone-200 text-stone-600 px-2 py-0.5 border border-stone-300 shrink-0">
              Your Recipe
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {entry.brew_method && (
              <>
                <span className="text-lg text-stone-600 font-bold">{entry.brew_method}</span>
                <span className="text-stone-400">·</span>
              </>
            )}
            {entry.bean && (
              <>
                <span className="text-stone-500 font-medium">{entry.bean}</span>
                <span className="text-stone-400">·</span>
              </>
            )}
            <span className="text-stone-500 font-medium text-sm">
              {new Date(entry.created_at).toLocaleDateString("en-GB", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </span>
          </div>
        </div>
        <StarRating value={entry.rating} readonly />
      </div>

      {/* Structured recipe content (read view) */}
      {!editing && hasStructuredContent && (
        <div className="flex flex-col gap-6">
          <h2 className="font-black text-xl text-stone-900 uppercase tracking-wide">Recipe</h2>
          {metricCards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {metricCards.map((c) => (
                <RecipeCard key={c.label} label={c.label} value={c.value} />
              ))}
            </div>
          )}
          {entry.bloom && (
            <div className="border-2 border-stone-900 bg-white p-5">
              <span className="text-xs font-black uppercase tracking-widest text-stone-400 block mb-1">Bloom</span>
              <p className="font-bold text-stone-900">{entry.bloom}</p>
            </div>
          )}
          {entry.brew_steps && (
            <div className="flex flex-col gap-3">
              <h3 className="font-black text-sm uppercase tracking-widest text-stone-500">
                Brew Steps / Pour Schedule
              </h3>
              <div className="border-2 border-stone-900 bg-white p-5">
                <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap font-medium">
                  {entry.brew_steps}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="flex flex-col gap-8">
          {/* Coffee */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b-2 border-stone-200 pb-2">
              Coffee
            </h2>
            <div>
              <Label>Recipe Title</Label>
              <TextInput value={title} onChange={setTitle} placeholder="e.g. My go-to V60" />
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

          {/* Rating & notes */}
          <div className="flex flex-col gap-4">
            <h2 className="text-xs font-black uppercase tracking-widest text-amber-600 border-b-2 border-stone-200 pb-2">
              Notes
            </h2>
            <div>
              <Label>Rating</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <Label>Tasting Notes / Personal Notes</Label>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                placeholder="How did it taste?"
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 text-stone-900 font-medium focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder:text-stone-400"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-stone-900 text-[#FAF7F2] font-bold px-6 py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={handleCancelEdit}
              className="font-bold text-stone-500 hover:text-stone-700 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Your Notes (read view) + Edit toggle */}
      {!editing && (
        <div className="border-t-2 border-stone-900 pt-8 flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-black text-xl text-stone-900 uppercase tracking-wide">Your Notes</h2>
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              Edit recipe
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <StarRating value={entry.rating} readonly />
            {entry.user_notes ? (
              <p className="text-stone-700 italic text-sm">&ldquo;{entry.user_notes}&rdquo;</p>
            ) : (
              <p className="text-stone-400 text-sm">No notes added yet.</p>
            )}
            {saved && <span className="text-amber-600 font-bold text-sm">Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
