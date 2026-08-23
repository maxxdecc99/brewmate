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
        <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">Brew Log</h1>
        <div className="flex items-center gap-3 text-muted font-bold">
          <Spinner />
          <span>Loading your brews…</span>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <div className="flex items-baseline justify-between flex-wrap gap-3 border-b-2 border-ink pb-6">
          <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">Brew Log</h1>
          <Link
            href="/log/add"
            className="font-heading font-bold uppercase tracking-wide text-ink border-2 border-ink px-4 py-2 text-sm hover:bg-terracotta hover:text-white hover:border-terracotta transition-colors"
          >
            + Add your recipe
          </Link>
        </div>
        <div className="border-2 border-line p-12 text-center flex flex-col items-center gap-4">
          <span className="text-5xl">☕</span>
          <p className="font-heading font-bold uppercase text-muted text-lg">No brews logged yet.</p>
          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Link
              href="/generate"
              className="font-bold text-terracotta hover:opacity-80 underline underline-offset-2"
            >
              Generate a recipe with AI →
            </Link>
            <span className="text-line hidden sm:block">|</span>
            <Link
              href="/log/add"
              className="font-bold text-espresso/70 hover:text-espresso underline underline-offset-2"
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
      <div className="flex items-baseline justify-between flex-wrap gap-3 border-b-2 border-ink pb-6">
        <div className="flex items-baseline gap-3">
          <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">Brew Log</h1>
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">{items.length} brews</span>
        </div>
        <Link
          href="/log/add"
          className="font-heading font-bold uppercase tracking-wide text-ink border-2 border-ink px-4 py-2 text-sm hover:bg-terracotta hover:text-white hover:border-terracotta transition-colors"
        >
          + Add your recipe
        </Link>
      </div>

      <div className="flex flex-col">
        {items.map((item, i) => {
          const href = item.source === "ai" ? `/log/${item.id}` : `/log/manual/${item.id}`;

          return (
            <div
              key={item.id}
              className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between py-5 border-b border-line"
            >
              <div className="flex gap-4 flex-1">
                <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted pt-1 shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="flex flex-col gap-2 flex-1">
                  <div className="flex items-baseline gap-3 flex-wrap">
                    <Link
                      href={href}
                      className="font-heading text-xl font-extrabold uppercase text-espresso hover:text-terracotta transition-colors"
                    >
                      {item.title || "Untitled Recipe"}
                    </Link>
                    {item.source === "ai" ? (
                      <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-white bg-terracotta px-2 py-0.5">
                        AI
                      </span>
                    ) : (
                      <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-espresso/70 border border-line px-2 py-0.5">
                        Manual
                      </span>
                    )}
                    {item.brew_method && (
                      <span className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted border border-line px-2 py-0.5">
                        {item.brew_method}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-3 text-sm text-muted font-medium flex-wrap">
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
                    <p className="text-sm text-espresso/70 italic">&ldquo;{item.user_notes}&rdquo;</p>
                  )}
                </div>
              </div>
              <div className="flex gap-3 sm:flex-col sm:items-end pl-9 sm:pl-0">
                <Link
                  href={href}
                  className="font-heading text-xs font-bold uppercase tracking-wide text-espresso/70 hover:text-espresso border-b border-line hover:border-espresso transition-colors"
                >
                  View →
                </Link>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="font-heading text-xs font-bold uppercase tracking-wide text-terracotta hover:opacity-70 transition-opacity"
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
