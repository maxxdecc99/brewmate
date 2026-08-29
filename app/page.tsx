"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getRecipes } from "@/lib/recipes";
import { RecipeRow } from "@/types";
import Spinner from "@/components/ui/Spinner";

const FEATURES = [
  {
    n: "01",
    title: "Any brew method",
    desc: "V60, Kalita, Chemex, AeroPress, French Press, Espresso — each with its own recipe logic.",
  },
  {
    n: "02",
    title: "Precision recipes",
    desc: "Grind in microns, exact temperature, pour-by-pour timing and dial-in corrections.",
  },
  {
    n: "03",
    title: "A brew log that learns",
    desc: "Rate every cup, keep the notes, and see what actually worked.",
  },
];

function Stars({ value }: { value: number }) {
  return (
    <span className="font-heading text-sm tracking-[3px] text-terracotta">
      {"★".repeat(value)}
      <span className="text-line">{"★".repeat(5 - value)}</span>
    </span>
  );
}

function Dashboard({ recipes }: { recipes: RecipeRow[] }) {
  const last = recipes[0];
  const lastRecipe = last?.source === "ai" ? last.recipe_data : null;
  const lastInput = last?.source === "ai" ? last.input_data : null;
  const avgRating =
    recipes.length > 0
      ? (recipes.reduce((sum, r) => sum + r.rating, 0) / recipes.length).toFixed(1)
      : "—";

  return (
    <div className="flex flex-col gap-0 -mx-4 sm:mx-0">
      <div className="px-4 sm:px-0 pb-6">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">
          {new Date().toLocaleDateString("en-GB", { weekday: "long" }).toUpperCase()} ·{" "}
          {new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </span>
        <h1 className="mt-3 font-heading text-6xl sm:text-8xl font-extrabold uppercase tracking-tight leading-[0.82] text-ink">
          Get your<br />brew
        </h1>
      </div>

      {last ? (
        <Link
          href={last.source === "ai" ? `/log/${last.id}` : `/log/manual/${last.id}`}
          className="bg-terracotta text-white px-4 sm:px-8 py-7 flex flex-col gap-1 hover:bg-[#dd2b0f] transition-colors"
        >
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-white/70">
            Last dialled in
          </span>
          <span className="mt-2 font-heading text-3xl font-extrabold tracking-tight">
            {last.title || "Untitled Recipe"}
          </span>
          {lastInput && (
            <span className="text-sm text-white/80 font-medium">
              {lastInput.roaster} · {lastInput.origin}
            </span>
          )}
          {lastRecipe && (
            <div className="grid grid-cols-3 gap-4 mt-6">
              <div className="border-t border-white/45 pt-3">
                <div className="font-heading text-2xl font-extrabold tracking-tight">{lastRecipe.ratio}</div>
                <div className="mt-2 font-heading text-[9px] font-bold uppercase tracking-[.2em] text-white/75">Ratio</div>
              </div>
              <div className="border-t border-white/45 pt-3">
                <div className="font-heading text-2xl font-extrabold tracking-tight">{lastRecipe.grindMicrons}<span className="text-sm">µm</span></div>
                <div className="mt-2 font-heading text-[9px] font-bold uppercase tracking-[.2em] text-white/75">Grind</div>
              </div>
              <div className="border-t border-white/45 pt-3">
                <div className="font-heading text-2xl font-extrabold tracking-tight">{lastRecipe.temperatureC}<span className="text-sm">°C</span></div>
                <div className="mt-2 font-heading text-[9px] font-bold uppercase tracking-[.2em] text-white/75">Temp</div>
              </div>
            </div>
          )}
          <div className="mt-6 border border-white/80 px-4 py-4 flex items-center justify-between">
            <span className="font-heading text-xs font-bold uppercase tracking-[.2em]">Open recipe</span>
            <span>→</span>
          </div>
        </Link>
      ) : (
        <div className="bg-ink text-cream px-4 sm:px-8 py-10 flex flex-col gap-3">
          <span className="font-heading text-2xl font-extrabold uppercase tracking-tight">Nothing dialled in yet</span>
          <p className="text-cream/70 font-medium text-sm max-w-sm">
            Generate your first AI recipe or log one you already know.
          </p>
        </div>
      )}

      <Link
        href="/generate"
        className="bg-ink text-cream px-4 sm:px-8 py-8 flex items-center justify-between gap-4 hover:bg-[#2a2725] transition-colors"
      >
        <span className="font-heading text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[0.86]">
          Dial in<br />a brew
        </span>
        <span className="text-terracotta text-4xl">→</span>
      </Link>

      <div className="grid grid-cols-2 border-b border-line">
        <div className="px-4 sm:px-8 py-6 border-r border-line">
          <div className="font-heading text-4xl font-extrabold tracking-tight text-ink">{recipes.length}</div>
          <div className="mt-3 font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">Brews Logged</div>
        </div>
        <div className="px-4 sm:px-8 py-6">
          <div className="font-heading text-4xl font-extrabold tracking-tight text-ink">{avgRating}</div>
          <div className="mt-3 font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">Avg Rating</div>
        </div>
      </div>

      {recipes.length > 0 && (
        <div className="flex flex-col px-4 sm:px-8">
          <div className="pt-6 pb-3 flex items-center justify-between">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">Recent</span>
            <Link href="/log" className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-terracotta hover:opacity-70">
              All →
            </Link>
          </div>
          {recipes.slice(0, 3).map((r) => (
            <Link
              key={r.id}
              href={r.source === "ai" ? `/log/${r.id}` : `/log/manual/${r.id}`}
              className="flex items-center justify-between gap-3 py-4 border-t border-line"
            >
              <div>
                <div className="font-heading font-extrabold text-lg tracking-tight text-ink">{r.title || "Untitled Recipe"}</div>
                <div className="mt-1.5 font-heading text-[10px] font-bold uppercase tracking-[.15em] text-muted">
                  {r.brew_method ?? "—"}{r.source === "ai" && r.recipe_data ? ` · ${r.recipe_data.ratio}` : ""}
                </div>
              </div>
              <Stars value={r.rating} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [checking, setChecking] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [recipes, setRecipes] = useState<RecipeRow[]>([]);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      setLoggedIn(!!user);
      if (user) {
        setRecipes(await getRecipes());
      }
      setChecking(false);
    });
  }, []);

  if (checking) {
    return (
      <div className="flex items-center justify-center py-24">
        <Spinner className="h-8 w-8 text-muted" />
      </div>
    );
  }

  if (loggedIn) {
    return <Dashboard recipes={recipes} />;
  }

  return (
    <div className="flex flex-col gap-16 -mx-4 sm:mx-0">
      {/* Hero */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-10 bg-cream">
        <div className="w-full max-w-4xl mx-auto px-4 py-16 sm:py-24 flex flex-col gap-6">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
            /// AI Coffee Recipe System · Est. 2026
          </span>
          <h1 className="font-heading text-6xl sm:text-8xl font-extrabold text-ink leading-[0.86] tracking-tight uppercase">
            Brew<br />
            <span className="text-terracotta">Better.</span>
          </h1>
          <p className="text-lg text-muted max-w-lg leading-relaxed">
            Your beans, your gear, your palate — one precise recipe. No
            guesswork, no folklore.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/generate"
              className="font-heading inline-flex items-center justify-center bg-terracotta text-white font-bold uppercase tracking-wide px-8 py-4 text-base hover:bg-[#dd2b0f] transition-colors"
            >
              Generate a recipe →
            </Link>
            <Link
              href="/log"
              className="font-heading inline-flex items-center justify-center bg-transparent text-ink font-bold uppercase tracking-wide px-8 py-4 text-base border-2 border-ink hover:bg-ink/5 transition-colors"
            >
              Open brew log
            </Link>
          </div>
        </div>
      </section>

      {/* Index — what it does */}
      <section className="flex flex-col gap-2 px-4 sm:px-0">
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted">
          Index — what it does
        </span>
        <div className="h-0.5 bg-ink" />
        {FEATURES.map((f) => (
          <div
            key={f.n}
            className="flex gap-4 py-5 border-b border-line"
          >
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta pt-1">
              {f.n}
            </span>
            <div className="flex flex-col gap-1">
              <h3 className="font-heading font-extrabold uppercase text-lg text-ink">{f.title}</h3>
              <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
            </div>
          </div>
        ))}
      </section>

      {/* CTA band */}
      <section className="bg-terracotta text-white px-4 sm:px-10 py-10 flex flex-col gap-5">
        <p className="font-heading text-3xl sm:text-4xl font-extrabold uppercase leading-[0.95] tracking-tight max-w-2xl">
          Coffee is a variable problem. We solve it per cup.
        </p>
        <Link
          href="/pricing"
          className="font-heading self-start bg-cream text-terracotta font-bold uppercase tracking-wide px-6 py-3 text-sm hover:bg-white transition-colors"
        >
          See Brew+ plans →
        </Link>
      </section>

      <p className="font-heading text-[10px] font-bold uppercase tracking-widest text-muted px-4 sm:px-0 -mt-8">
        GetYourBrew /// 2026 /// V60 · Kalita · Chemex · AeroPress · French Press · Espresso
      </p>
    </div>
  );
}
