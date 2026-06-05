import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col gap-16 py-8">
      {/* Hero */}
      <section className="flex flex-col gap-6">
        <div className="inline-block">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-100 border border-amber-300 px-3 py-1">
            AI Coffee Recipe Assistant
          </span>
        </div>
        <h1 className="text-6xl sm:text-8xl font-black text-stone-900 leading-none tracking-tighter">
          Brew<br />
          <span className="text-amber-600">Better.</span>
        </h1>
        <p className="text-xl text-stone-600 max-w-lg leading-relaxed">
          Generate precise coffee recipes based on your beans, brew method, and
          gear. No guesswork — just great coffee.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 pt-2">
          <Link
            href="/generate"
            className="inline-flex items-center justify-center bg-stone-900 text-[#FAF7F2] font-bold px-8 py-4 text-lg border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 transition-colors"
          >
            Generate Recipe →
          </Link>
          <Link
            href="/log"
            className="inline-flex items-center justify-center bg-transparent text-stone-900 font-bold px-8 py-4 text-lg border-2 border-stone-900 hover:bg-stone-900 hover:text-[#FAF7F2] transition-colors"
          >
            Brew Log
          </Link>
        </div>
      </section>

      {/* Feature grid */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t-2 border-stone-900 pt-12">
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
            className="border-2 border-stone-900 p-6 flex flex-col gap-3 bg-white"
          >
            <span className="text-3xl">{f.icon}</span>
            <h3 className="font-black text-lg text-stone-900">{f.title}</h3>
            <p className="text-stone-600 text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}
