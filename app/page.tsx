"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getRecipes } from "@/lib/recipes";
import { RecipeRow } from "@/types";
import Spinner from "@/components/ui/Spinner";
import { Label, Input } from "@/components/ui/FormField";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const WAITLIST_PERKS = [
  {
    no: "01",
    title: "Precise recipes, no noise",
    body: "Grind in microns, water temperature, a pour-by-pour schedule for the gear you already own.",
  },
  {
    no: "02",
    title: "A brew log that learns",
    body: "Rate every cup, keep the notes, and see what actually worked.",
  },
  {
    no: "03",
    title: "Dial-in corrections",
    body: "Tastes thin or sour? Grind 40µm finer and add 1°C — every cup gets a fix, not a guess.",
  },
];

const RECIPE_METRICS = [
  { label: "Dose", value: "18 g", sub: "Medium roast", tone: "surface" as const },
  { label: "Water", value: "300 g", sub: "1:16.6", tone: "surface" as const },
  { label: "Grind", value: "720µm", sub: "Comandante 24", tone: "terracotta" as const },
  { label: "Temp", value: "95°C", sub: "203°F", tone: "ink" as const },
];

const RECIPE_POURS = [
  { no: "01", step: "Bloom with 50 g, swirl once", at: "0:00" },
  { no: "02", step: "Pour to 150 g in slow spirals", at: "0:45" },
  { no: "03", step: "Pour to 300 g, keep the bed level", at: "1:30" },
  { no: "04", step: "Drawdown complete", at: "3:00" },
];

function Waitlist() {
  const [state, setState] = useState<"pending" | "submitting" | "joined">("pending");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [position, setPosition] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && typeof data.count === "number") setTotalCount(data.count);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError("That email doesn't look right");
      return;
    }

    setError("");
    setState("submitting");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmed }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        setState("pending");
        return;
      }
      setPosition(data.position);
      setState("joined");
    } catch {
      setError("Something went wrong. Try again.");
      setState("pending");
    }
  }

  const metricTone: Record<string, string> = {
    surface: "bg-surface text-espresso",
    terracotta: "bg-terracotta text-white",
    ink: "bg-ink text-cream",
  };

  return (
    <div className="flex flex-col gap-16 -mx-4 sm:mx-0">
      {/* Hero */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-10 bg-cream">
        <div className="w-full max-w-4xl mx-auto px-4 py-16 sm:py-24 flex flex-col gap-6">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
            /// AI Coffee Recipe System · Est. 2026
          </span>
          <h1 className="font-heading text-6xl sm:text-8xl font-extrabold text-ink leading-[0.86] tracking-tight uppercase">
            Get early<br />access.
          </h1>
          <p className="text-lg text-muted max-w-lg leading-relaxed">
            Describe the bean, the method and the gear you own — GetYourBrew
            returns one precise recipe: grind in microns, water temperature, a
            pour-by-pour schedule.
          </p>
          <div className="flex flex-wrap gap-3 sm:gap-8 items-baseline border-t border-line pt-4">
            <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">
              Launching soon
            </span>
            <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">
              Web · Brew+ €1,99
            </span>
          </div>
        </div>
      </section>

      {/* Email capture */}
      <section className="border-t-2 border-b-2 border-ink px-4 sm:px-0">
        {state === "joined" ? (
          <div className="bg-ink text-cream -mx-4 sm:mx-0 px-4 sm:px-8 py-8 flex flex-col gap-3">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
              ✓ You&apos;re on the list
            </span>
            <div className="font-heading text-4xl sm:text-5xl font-extrabold uppercase tracking-tight leading-[0.86]">
              No. {position?.toLocaleString("nl-NL")}
              <span className="text-sm font-bold tracking-[.2em] text-cream/60"> in queue</span>
            </div>
            <p className="text-cream/70 text-sm font-medium max-w-md">
              We&apos;ll mail {email} the moment your batch opens. One mail, no
              newsletter.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="py-8 flex flex-col gap-5">
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
              01 — Your email
            </span>
            <div className="flex flex-wrap gap-5 items-end">
              <div className="flex-1 min-w-[220px]">
                <Label>Email address</Label>
                <Input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError("");
                  }}
                  placeholder="you@roastery.com"
                />
              </div>
              <button
                type="submit"
                disabled={state === "submitting"}
                className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide px-8 py-4 text-base hover:bg-[#dd2b0f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {state === "submitting" ? "Joining…" : "Join the waitlist →"}
              </button>
            </div>
            {error && (
              <div className="border-2 border-terracotta px-4 py-3 text-terracotta text-sm font-bold">
                {error}
              </div>
            )}
            <span className="text-sm text-muted font-medium">
              {totalCount != null
                ? `${totalCount.toLocaleString("nl-NL")} brewers ahead of you. Batches open weekly.`
                : "One mail when your batch opens. Nothing else."}
            </span>
          </form>
        )}
      </section>

      {/* Recipe preview */}
      <section className="flex flex-col gap-4 px-4 sm:px-0">
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
          /// A recipe, not folklore
        </span>
        <div className="border-2 border-ink">
          <div className="bg-ink text-cream px-4 sm:px-6 py-5 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex flex-col gap-1.5">
              <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-cream/60">
                Friedhats · Nyeri, Kenya
              </span>
              <span className="font-heading text-2xl font-extrabold uppercase tracking-tight leading-none">
                V60 · 1:16.6
              </span>
            </div>
            <span className="font-heading text-[10px] font-bold uppercase tracking-widest bg-terracotta text-white px-2 py-0.5">
              AI
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line">
            {RECIPE_METRICS.map((m) => (
              <div key={m.label} className={`p-4 flex flex-col gap-1 ${metricTone[m.tone]}`}>
                <span className="font-heading text-[10px] font-bold uppercase tracking-widest opacity-70">
                  {m.label}
                </span>
                <span className="font-heading text-2xl font-bold leading-none">{m.value}</span>
                <span className="text-sm opacity-70">{m.sub}</span>
              </div>
            ))}
          </div>
          <div className="bg-surface-soft">
            {RECIPE_POURS.map((p) => (
              <div
                key={p.no}
                className="flex gap-5 items-baseline px-4 sm:px-6 py-3.5 border-t border-line"
              >
                <span className="font-heading text-[10px] font-bold tracking-[.2em] text-terracotta min-w-[22px]">
                  {p.no}
                </span>
                <span className="flex-1 text-sm font-medium text-espresso">{p.step}</span>
                <span className="font-heading text-sm font-extrabold tracking-tight">{p.at}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted font-medium">
          Preview of the recipe screen. Tastes thin or sour? The app grinds
          40µm finer and adds 1°C.
        </p>
      </section>

      {/* Perks */}
      <section className="flex flex-col gap-px bg-line -mx-4 sm:mx-0">
        {WAITLIST_PERKS.map((perk) => (
          <div key={perk.no} className="bg-cream px-4 sm:px-8 py-6 flex gap-6 items-baseline">
            <span className="font-heading text-[10px] font-bold tracking-[.2em] text-terracotta">
              {perk.no}
            </span>
            <div className="flex flex-col gap-2">
              <span className="font-heading text-xl font-extrabold uppercase tracking-tight">
                {perk.title}
              </span>
              <span className="text-sm text-espresso font-medium max-w-lg">{perk.body}</span>
            </div>
          </div>
        ))}
      </section>

      {/* Pricing */}
      <section className="bg-terracotta text-white px-4 sm:px-8 py-8 flex flex-wrap gap-6 items-baseline justify-between">
        <div className="flex flex-col gap-2">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-white/80">
            /// Brew+ at launch
          </span>
          <span className="font-heading text-4xl font-extrabold tracking-tight">
            €1,99<span className="text-sm font-bold tracking-[.2em]"> / month</span>
          </span>
        </div>
        <span className="text-sm text-white/90 font-medium max-w-xs">
          Waitlist members keep launch pricing for the first year.
        </span>
      </section>

      <footer className="border-t-2 border-ink pt-5 px-4 sm:px-0 flex flex-wrap gap-3 justify-between">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">
          GetYourBrew · No guesswork, no noise
        </span>
        <div className="flex flex-wrap gap-5 items-baseline">
          <a
            href="https://instagram.com/getyourbrew"
            target="_blank"
            rel="noopener noreferrer"
            className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-ink hover:opacity-70"
          >
            Instagram @getyourbrew →
          </a>
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">
            Email only · Unsubscribe anytime
          </span>
        </div>
      </footer>
    </div>
  );
}

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

  return <Waitlist />;
}
