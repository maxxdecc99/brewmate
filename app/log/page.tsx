"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { RecipeRow } from "@/types";
import { getRecipes, deleteRecipe } from "@/lib/recipes";
import StarRating from "@/components/ui/StarRating";
import Spinner from "@/components/ui/Spinner";

export default function BrewLogPage() {
  const [items, setItems] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      setItems(await getRecipes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleDelete(id: string) {
    await deleteRecipe(id);
    load();
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-5xl font-black tracking-tighter">Brew Log</h1>
        <div className="flex items-center gap-3 text-stone-400 font-bold">
          <Spinner />
          <span>Loading your brews…</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-baseline justify-between flex-wrap gap-3">
          <h1 className="text-5xl font-black tracking-tighter">Brew Log</h1>
          <Link
            href="/log/add"
            className="font-bold text-stone-700 border-2 border-stone-900 px-4 py-2 text-sm hover:bg-stone-900 hover:text-[#FAF7F2] transition-colors"
          >
            + Add your recipe
          </Link>
        </div>
        <div className="border-2 border-stone-300 bg-white p-12 text-center flex flex-col items-center gap-4">
          <span className="text-5xl">☕</span>
          <p className="font-bold text-stone-500 text-lg">No brews logged yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Link
              href="/generate"
              className="font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
            >
              Generate a recipe with AI →
            </Link>
            <span className="text-stone-300 hidden sm:block">|</span>
            <Link
              href="/log/add"
              className="font-bold text-stone-600 hover:text-stone-900 underline underline-offset-2"
            >
              Add your own recipe (free) →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <div className="flex items-baseline gap-3">
          <h1 className="text-5xl font-black tracking-tighter">Brew Log</h1>
          <span className="text-stone-400 font-bold">{items.length} brews</span>
        </div>
        <Link
          href="/log/add"
          className="font-bold text-stone-700 border-2 border-stone-900 px-4 py-2 text-sm hover:bg-stone-900 hover:text-[#FAF7F2] transition-colors"
        >
          + Add your recipe
        </Link>
      </div>

      <div className="flex flex-col gap-4">
        {items.map((item) => {
          const href = item.source === "ai" ? `/log/${item.id}` : `/log/manual/${item.id}`;

          return (
            <div
              key={item.id}
              className={`border-2 bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between ${
                item.source === "ai" ? "border-stone-900" : "border-stone-400 bg-stone-50"
              }`}
            >
              <div className="flex flex-col gap-2 flex-1">
                <div className="flex items-baseline gap-3 flex-wrap">
                  <Link
                    href={href}
                    className="text-xl font-black text-stone-900 hover:text-amber-600 transition-colors"
                  >
                    {item.title || "Untitled Recipe"}
                  </Link>
                  {item.source === "ai" ? (
                    <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5">
                      AI Recipe
                    </span>
                  ) : (
                    <span className="text-xs font-black uppercase tracking-widest text-stone-600 bg-stone-200 border border-stone-300 px-2 py-0.5">
                      Your Recipe
                    </span>
                  )}
                  {item.brew_method && (
                    <span className="text-xs font-bold uppercase tracking-widest text-stone-500 bg-white border border-stone-200 px-2 py-0.5">
                      {item.brew_method}
                    </span>
                  )}
                </div>
                <div className="flex gap-3 text-sm text-stone-500 font-medium flex-wrap">
                  {item.source === "ai" && item.input_data && (
                    <>
                      <span>{item.input_data.roaster}</span>
                      <span>·</span>
                      <span>{item.input_data.origin}</span>
                      <span>·</span>
                    </>
                  )}
                  {item.source === "manual" && item.bean && (
                    <>
                      <span>{item.bean}</span>
                      <span>·</span>
                    </>
                  )}
                  <span>
                    {new Date(item.created_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
                <StarRating value={item.rating} readonly />
                {item.user_notes && (
                  <p className="text-sm text-stone-600 italic">&ldquo;{item.user_notes}&rdquo;</p>
                )}
              </div>
              <div className="flex gap-3 sm:flex-col sm:items-end">
                <Link
                  href={href}
                  className="text-sm font-bold text-stone-700 hover:text-stone-900 border-b border-stone-300 hover:border-stone-900 transition-colors"
                >
                  View →
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="text-sm font-bold text-red-400 hover:text-red-600 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
