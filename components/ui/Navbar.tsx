import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b-2 border-stone-900 bg-[#FAF7F2]">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="text-2xl font-black tracking-tight text-stone-900 hover:text-amber-600 transition-colors"
        >
          BrewMate
        </Link>
        <div className="flex gap-6">
          <Link
            href="/generate"
            className="font-bold text-stone-700 hover:text-stone-900 border-b-2 border-transparent hover:border-amber-500 transition-all pb-0.5"
          >
            Generate
          </Link>
          <Link
            href="/log"
            className="font-bold text-stone-700 hover:text-stone-900 border-b-2 border-transparent hover:border-amber-500 transition-all pb-0.5"
          >
            Brew Log
          </Link>
        </div>
      </div>
    </nav>
  );
}
