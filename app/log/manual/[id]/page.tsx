"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeRow } from "@/types";
import { getRecipeById, updateRecipe } from "@/lib/recipes";
import RecipeCard from "@/components/ui/RecipeCard";
import StarRating from "@/components/ui/StarRating";
import { Label, Input, Select, Textarea } from "@/components/ui/FormField";

const BREW_METHODS = [
  "V60", "Kalita", "Chemex", "AeroPress", "French Press", "Espresso", "Other",
];

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

  const CARD_TONES: ("terracotta" | "gold" | "olive" | "surface")[] = [
    "terracotta", "gold", "olive", "surface",
  ];

  // --- Render ---
  return (
    <div className="flex flex-col gap-10">
      {/* Header */}
      <div className="flex flex-col gap-3 border-b border-line pb-6">
        <button
          onClick={() => router.push("/log")}
          className="text-sm font-bold text-muted hover:text-ink self-start transition-colors"
        >
          ← Brew Log
        </button>
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight leading-none text-ink">
              {entry.title || "Untitled Recipe"}
            </h1>
            <span className="font-heading text-xs font-bold uppercase tracking-widest bg-surface-soft text-ink/70 border border-line rounded-full px-2.5 py-0.5 shrink-0">
              Your Recipe
            </span>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {entry.brew_method && (
              <>
                <span className="text-lg text-ink/70 font-bold">{entry.brew_method}</span>
                <span className="text-line">·</span>
              </>
            )}
            {entry.bean && (
              <>
                <span className="text-muted font-medium">{entry.bean}</span>
                <span className="text-line">·</span>
              </>
            )}
            <span className="text-muted font-medium text-sm">
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
          <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">Recipe</h2>
          {metricCards.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {metricCards.map((c, i) => (
                <RecipeCard key={c.label} label={c.label} value={c.value} tone={CARD_TONES[i % CARD_TONES.length]} />
              ))}
            </div>
          )}
          {entry.bloom && (
            <div className="rounded-2xl border border-line bg-surface p-5">
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">Bloom</span>
              <p className="font-bold text-ink">{entry.bloom}</p>
            </div>
          )}
          {entry.brew_steps && (
            <div className="flex flex-col gap-3">
              <h3 className="font-heading font-bold text-sm uppercase tracking-widest text-muted">
                Brew Steps / Pour Schedule
              </h3>
              <div className="rounded-2xl border border-line bg-surface p-5">
                <p className="text-ink/80 text-sm leading-relaxed whitespace-pre-wrap font-medium">
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
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta border-b border-line pb-2">
              Coffee
            </h2>
            <div>
              <Label>Recipe Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. My go-to V60" />
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

          {/* Rating & notes */}
          <div className="flex flex-col gap-4">
            <h2 className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta border-b border-line pb-2">
              Notes
            </h2>
            <div>
              <Label>Rating</Label>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <Label>Tasting Notes / Personal Notes</Label>
              <Textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                placeholder="How did it taste?"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="font-heading bg-ink text-cream font-bold px-6 py-3 rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            <button
              onClick={handleCancelEdit}
              className="font-bold text-muted hover:text-ink transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Your Notes (read view) + Edit toggle */}
      {!editing && (
        <div className="border-t border-line pt-8 flex flex-col gap-5">
          <div className="flex items-baseline justify-between">
            <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">Your Notes</h2>
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-terracotta hover:opacity-80 underline underline-offset-2"
            >
              Edit recipe
            </button>
          </div>
          <div className="flex flex-col gap-3">
            <StarRating value={entry.rating} readonly />
            {entry.user_notes ? (
              <p className="text-ink/80 italic text-sm">&ldquo;{entry.user_notes}&rdquo;</p>
            ) : (
              <p className="text-muted text-sm">No notes added yet.</p>
            )}
            {saved && <span className="text-terracotta font-bold text-sm">Saved ✓</span>}
          </div>
        </div>
      )}
    </div>
  );
}
