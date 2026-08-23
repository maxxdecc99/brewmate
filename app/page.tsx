import Link from "next/link";
import Image from "next/image";

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

export default function Home() {
  return (
    <div className="flex flex-col gap-16 -mx-4 sm:mx-0">
      {/* Hero */}
      <section className="relative w-screen left-1/2 -translate-x-1/2 -mt-10 min-h-[560px] sm:min-h-[680px] flex items-end overflow-hidden border-b-2 border-ink">
        <Image
          src="/hero.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative z-10 w-full max-w-4xl mx-auto px-4 py-12 sm:py-16 flex flex-col gap-6">
          <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
            /// AI Coffee Recipe System · Est. 2026
          </span>
          <h1 className="font-heading text-6xl sm:text-8xl font-extrabold text-white leading-[0.86] tracking-tight uppercase">
            Brew<br />
            Better.
          </h1>
          <p className="text-lg text-white/80 max-w-lg leading-relaxed">
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
              className="font-heading inline-flex items-center justify-center bg-transparent text-white font-bold uppercase tracking-wide px-8 py-4 text-base border-2 border-white hover:bg-white/10 transition-colors"
            >
              Open brew log
            </Link>
          </div>
        </div>
      </section>

      {/* Direct-flash band */}
      <div className="h-40 sm:h-56 border-y-2 border-ink bg-[repeating-linear-gradient(135deg,var(--color-surface)_0_9px,var(--color-surface-soft)_9px_18px)] flex items-end px-4 sm:px-0 pb-4">
        <span className="font-mono text-[10px] font-medium uppercase tracking-widest bg-ink text-cream px-2 py-1">
          [ Direct flash · pour shot ]
        </span>
      </div>

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
        BrewMate /// 2026 /// V60 · Kalita · Chemex · AeroPress · French Press · Espresso
      </p>
    </div>
  );
}
