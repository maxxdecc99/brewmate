"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { RecipeRow } from "@/types";
import { getRecipeById, updateRecipe } from "@/lib/recipes";
import RecipeCard from "@/components/ui/RecipeCard";
import StarRating from "@/components/ui/StarRating";
import { Textarea } from "@/components/ui/FormField";

export default function SavedRecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<RecipeRow | null>(null);
  const [rating, setRating] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const row = await getRecipeById(id);
      if (!row || row.source !== "ai") {
        router.replace("/log");
        return;
      }
      setEntry(row);
      setRating(row.rating);
      setUserNotes(row.user_notes);
    }
    load();
  }, [id, router]);

  async function handleSave() {
    await updateRecipe(id, { rating, user_notes: userNotes });
    setSaved(true);
    setEditing(false);
  }

  if (!entry) return null;

  const recipe = entry.recipe_data!;
  const input = entry.input_data!;
  const isEspresso = recipe.brewMethod === "Espresso";

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
        <h1 className="font-heading text-4xl sm:text-6xl font-bold tracking-tight leading-none text-ink">
          {recipe.coffeeName}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-block self-start -rotate-2 font-heading text-sm font-bold text-cream bg-olive rounded-full px-3 py-1">
            {recipe.brewMethod}
          </span>
          <span className="text-line">·</span>
          <span className="text-muted font-medium">{input.roaster}</span>
          <span className="text-line">·</span>
          <span className="text-muted font-medium">{input.origin}</span>
          <span className="text-line">·</span>
          <span className="text-muted font-medium text-sm">
            {new Date(entry.created_at).toLocaleDateString("en-GB", {
              day: "numeric", month: "long", year: "numeric",
            })}
          </span>
        </div>
        <StarRating value={rating} readonly />
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
        <RecipeCard label="Temperature" value={`${recipe.temperatureC}°C`} sub={`${recipe.temperatureF}°F`} tone="surface" />
        <RecipeCard label="Total Time" value={recipe.totalTime} tone="surface" />
        {isEspresso && recipe.pressure && (
          <RecipeCard label="Pressure" value={recipe.pressure} tone="surface" />
        )}
        {isEspresso && recipe.shotTime && (
          <RecipeCard label="Shot Time" value={recipe.shotTime} tone="surface" />
        )}
      </div>

      {/* Steps */}
      <div className="flex flex-col gap-4">
        <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">Recipe Steps</h2>
        <div className="flex flex-col gap-3">
          {recipe.steps.map((step, i) => (
            <div key={i} className="rounded-2xl border border-line bg-surface p-5 flex gap-4">
              <span className="font-heading text-2xl font-bold text-terracotta leading-none mt-0.5">{i + 1}</span>
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-heading font-bold text-ink">{step.title}</span>
                  <span className="text-xs font-bold text-muted whitespace-nowrap">{step.time}</span>
                </div>
                <p className="text-muted text-sm leading-relaxed">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Adjustment tips */}
      {recipe.adjustmentTips.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">Dial-In Tips</h2>
          <div className="rounded-2xl border border-line bg-surface divide-y divide-line">
            {recipe.adjustmentTips.map((tip, i) => (
              <p key={i} className="px-5 py-3 text-sm text-ink/80 leading-relaxed">→ {tip}</p>
            ))}
          </div>
        </div>
      )}

      {/* Recipe notes */}
      {recipe.notes && (
        <div className="rounded-2xl bg-surface-soft border border-line p-5">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">Recipe Notes</span>
          <p className="text-ink/80 text-sm leading-relaxed">{recipe.notes}</p>
        </div>
      )}

      {/* Rating & user notes */}
      <div className="border-t border-line pt-8 flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading font-bold text-xl text-ink uppercase tracking-wide">Your Notes</h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-terracotta hover:opacity-80 underline underline-offset-2"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-4">
            <div>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">Rating</span>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">Notes</span>
              <Textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                placeholder="How did it taste?"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="font-heading bg-ink text-cream font-bold px-6 py-2 rounded-xl hover:bg-terracotta transition-colors"
              >
                Save
              </button>
              <button onClick={() => setEditing(false)} className="font-bold text-muted hover:text-ink">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <StarRating value={rating} readonly />
            {userNotes ? (
              <p className="text-ink/80 italic text-sm">&ldquo;{userNotes}&rdquo;</p>
            ) : (
              <p className="text-muted text-sm">No notes added yet.</p>
            )}
            {saved && <span className="text-terracotta font-bold text-sm">Saved ✓</span>}
          </div>
        )}
      </div>
    </div>
  );
}
