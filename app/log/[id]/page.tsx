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
      <div className="-mx-4 sm:mx-0 bg-ink text-cream px-4 sm:px-8 py-8 flex flex-col gap-3">
        <button
          onClick={() => router.push("/log")}
          className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-[#8D8880] hover:text-cream self-start transition-colors"
        >
          ← Brew Log
        </button>
        <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-terracotta">
          {recipe.brewMethod} ·{" "}
          {new Date(entry.created_at).toLocaleDateString("en-GB", {
            year: "numeric", month: "2-digit", day: "2-digit",
          })}
        </span>
        <h1 className="font-heading text-3xl sm:text-5xl font-extrabold tracking-tight leading-[1] text-cream">
          {recipe.coffeeName}
        </h1>
        <p className="text-[#A9A49C] font-medium">{input.roaster} · {input.origin}</p>
        <div className="font-heading text-6xl sm:text-7xl font-extrabold tracking-tight leading-[0.9] text-terracotta">
          {recipe.ratio}
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-0.5 bg-line">
        <RecipeCard label="Dose" value={`${recipe.dose}g`} tone="terracotta" />
        {isEspresso && recipe.yield ? (
          <RecipeCard label="Yield" value={`${recipe.yield}g`} tone="ink" />
        ) : (
          <RecipeCard label="Water" value={`${recipe.waterAmount}g`} tone="ink" />
        )}
        <RecipeCard label="Ratio" value={recipe.ratio} tone="surface" />
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
      <div className="flex flex-col gap-1">
        <h2 className="font-heading font-extrabold text-xl text-terracotta uppercase tracking-wide">Recipe Steps</h2>
        <div className="flex flex-col">
          {recipe.steps.map((step, i) => (
            <div key={i} className="flex gap-4 py-4 border-b border-line">
              <span className="font-heading text-2xl font-extrabold text-terracotta leading-none w-9 shrink-0">{String(i + 1).padStart(2, "0")}</span>
              <div className="flex flex-col gap-1 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-heading font-extrabold uppercase text-espresso">{step.title}</span>
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
          <h2 className="font-heading font-extrabold text-xl text-terracotta uppercase tracking-wide">Dial-In Tips</h2>
          <div className="border-t border-line">
            {recipe.adjustmentTips.map((tip, i) => (
              <p key={i} className="py-3 border-b border-line text-sm text-espresso/80 leading-relaxed">→ {tip}</p>
            ))}
          </div>
        </div>
      )}

      {/* Recipe notes */}
      {recipe.notes && (
        <div className="bg-surface border-l-2 border-terracotta p-5">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">Recipe Notes</span>
          <p className="text-espresso/80 text-sm leading-relaxed">{recipe.notes}</p>
        </div>
      )}

      {/* Rating & user notes */}
      <div className="border-t-2 border-ink pt-8 flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-heading font-extrabold text-xl text-ink uppercase tracking-wide">Your Notes</h2>
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
                className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide px-6 py-2 hover:bg-[#dd2b0f] transition-colors"
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
        className="-mx-4 sm:mx-0 bg-ink text-cream font-heading text-2xl sm:text-3xl font-extrabold uppercase tracking-tight px-4 sm:px-8 py-6 flex items-center justify-between hover:bg-[#2a2725] transition-colors"
      >
        Brew again
        <span className="text-terracotta">→</span>
      </button>
    </div>
  );
}
