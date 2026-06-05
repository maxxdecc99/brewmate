"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { SavedRecipe } from "@/types";
import { getBrewLogEntry, updateBrewLogEntry } from "@/lib/brewLog";
import RecipeCard from "@/components/ui/RecipeCard";
import StarRating from "@/components/ui/StarRating";

export default function SavedRecipeDetail() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [entry, setEntry] = useState<SavedRecipe | null>(null);
  const [rating, setRating] = useState(0);
  const [userNotes, setUserNotes] = useState("");
  const [editing, setEditing] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const found = getBrewLogEntry(id);
    if (!found) {
      router.replace("/log");
      return;
    }
    setEntry(found);
    setRating(found.rating);
    setUserNotes(found.userNotes);
  }, [id, router]);

  function handleSave() {
    updateBrewLogEntry(id, { rating, userNotes });
    setSaved(true);
    setEditing(false);
  }

  if (!entry) return null;

  const { recipe, input } = entry;
  const isEspresso = recipe.brewMethod === "Espresso";

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
        <h1 className="text-4xl sm:text-6xl font-black tracking-tighter leading-none">
          {recipe.coffeeName}
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-lg text-amber-600 font-bold">
            {recipe.brewMethod}
          </span>
          <span className="text-stone-400">·</span>
          <span className="text-stone-500 font-medium">{input.roaster}</span>
          <span className="text-stone-400">·</span>
          <span className="text-stone-500 font-medium">{input.origin}</span>
          <span className="text-stone-400">·</span>
          <span className="text-stone-500 font-medium text-sm">
            {new Date(entry.createdAt).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </span>
        </div>
        <StarRating value={rating} readonly />
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

      {/* Notes from recipe */}
      {recipe.notes && (
        <div className="border-2 border-stone-300 bg-stone-50 p-5">
          <span className="text-xs font-black uppercase tracking-widest text-stone-400 block mb-1">
            Recipe Notes
          </span>
          <p className="text-stone-700 text-sm leading-relaxed">{recipe.notes}</p>
        </div>
      )}

      {/* Rating & user notes */}
      <div className="border-t-2 border-stone-900 pt-8 flex flex-col gap-5">
        <div className="flex items-baseline justify-between">
          <h2 className="font-black text-xl text-stone-900 uppercase tracking-wide">
            Your Notes
          </h2>
          {!editing && (
            <button
              onClick={() => setEditing(true)}
              className="text-sm font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <div className="flex flex-col gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1">
                Rating
              </span>
              <StarRating value={rating} onChange={setRating} />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-stone-500 block mb-1">
                Notes
              </span>
              <textarea
                value={userNotes}
                onChange={(e) => setUserNotes(e.target.value)}
                rows={3}
                placeholder="How did it taste?"
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 text-stone-900 font-medium focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder:text-stone-400"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                className="bg-stone-900 text-[#FAF7F2] font-bold px-6 py-2 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="font-bold text-stone-500 hover:text-stone-700"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <StarRating value={rating} readonly />
            {userNotes ? (
              <p className="text-stone-700 italic text-sm">
                &ldquo;{userNotes}&rdquo;
              </p>
            ) : (
              <p className="text-stone-400 text-sm">No notes added yet.</p>
            )}
            {saved && (
              <span className="text-amber-600 font-bold text-sm">Saved ✓</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
