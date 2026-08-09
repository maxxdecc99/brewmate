import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero */}
      <section className="flex flex-col gap-6">
        <div className="inline-block">
          <span className="font-heading inline-block -rotate-2 text-xs font-bold uppercase tracking-widest text-ink bg-gold rounded-full px-4 py-1.5">
            ☕ AI Coffee Recipe Assistant
          </span>
        </div>
        <h1 className="font-heading text-6xl sm:text-8xl font-bold text-ink leading-none tracking-tight">
          Brew<br />
          <span className="text-terracotta">Better.</span>
        </h1>
        <p className="text-xl text-muted max-w-lg leading-relaxed">
          Generate precise coffee recipes based on your beans, brew method, and
          gear. No guesswork — just great coffee.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link
            href="/generate"
            className="font-heading inline-flex items-center justify-center bg-ink text-cream font-bold px-8 py-4 text-lg rounded-xl hover:bg-terracotta transition-colors"
          >
            Generate Recipe →
          </Link>
          <Link
            href="/log"
            className="font-heading inline-flex items-center justify-center bg-surface text-ink font-bold px-8 py-4 text-lg rounded-xl border border-line hover:bg-gold transition-colors"
          >
            Brew Log
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: "☕",
            title: "Any Brew Method",
            desc: "V60, Chemex, AeroPress, French Press, Espresso — all covered.",
          },
          {
            icon: "⚗️",
            title: "Precision Recipes",
            desc: "Grind size in microns, exact temps, step-by-step pour guides.",
          },
          {
            icon: "📓",
            title: "Brew Log",
            desc: "Save recipes, rate them, and build your personal coffee journal.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-line bg-surface p-6 flex flex-col gap-3"
          >
            <span className="text-3xl">{f.icon}</span>
            <h3 className="font-heading font-bold text-lg text-ink">{f.title}</h3>
            <p className="text-muted text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
