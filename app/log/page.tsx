"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RecipeRow } from "@/types";
import { getRecipes, deleteRecipe } from "@/lib/recipes";
import { createClient } from "@/lib/supabase/client";
import StarRating from "@/components/ui/StarRating";
import Spinner from "@/components/ui/Spinner";

const FREE_LOG_LIMIT = 10;

export default function BrewLogPage() {
  const [items, setItems] = useState<RecipeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("ALL");
  const [planInfo, setPlanInfo] = useState<{ isBrewPlus: boolean; logsUsed: number } | null>(null);

  async function load() {
    try {
      setItems(await getRecipes());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from("profiles")
        .select("is_brew_plus_active, logs_created_count")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          if (data) {
            setPlanInfo({ isBrewPlus: !!data.is_brew_plus_active, logsUsed: data.logs_created_count ?? 0 });
          }
        });
    });
  }, []);

  const methods = useMemo(
    () => Array.from(new Set(items.map((i) => i.brew_method).filter(Boolean))) as string[],
    [items]
  );
  const filtered = filter === "ALL" ? items : items.filter((i) => i.brew_method === filter);

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
        {planInfo && !planInfo.isBrewPlus && (
          <p className="font-heading text-xs font-bold uppercase tracking-widest text-[#9B9691]">
            Free plan · {planInfo.logsUsed} of {FREE_LOG_LIMIT} logs used
          </p>
        )}
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

      {methods.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          {["ALL", ...methods].map((m) => (
            <button
              key={m}
              onClick={() => setFilter(m)}
              className={`shrink-0 font-heading text-[10px] font-bold uppercase tracking-[.18em] px-4 py-2.5 transition-colors ${
                filter === m ? "bg-ink text-cream" : "border border-line text-muted hover:border-ink"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col">
        {filtered.map((item, i) => {
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

      {planInfo && !planInfo.isBrewPlus && (
        <p className="font-heading text-xs font-bold uppercase tracking-widest text-[#9B9691]">
          Free plan · {planInfo.logsUsed} of {FREE_LOG_LIMIT} logs used
        </p>
      )}
    </div>
  );
}
