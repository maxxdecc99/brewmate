"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SavedRecipe } from "@/types";
import { getBrewLog, deleteFromBrewLog } from "@/lib/brewLog";
import StarRating from "@/components/ui/StarRating";

export default function BrewLogPage() {
  const [log, setLog] = useState<SavedRecipe[]>([]);

  useEffect(() => {
    setLog(getBrewLog());
  }, []);

  function handleDelete(id: string) {
    deleteFromBrewLog(id);
    setLog(getBrewLog());
  }

  if (log.length === 0) {
    return (
      <div className="flex flex-col gap-8">
        <h1 className="text-5xl font-black tracking-tighter">Brew Log</h1>
        <div className="border-2 border-stone-300 bg-white p-12 text-center flex flex-col items-center gap-4">
          <span className="text-5xl">☕</span>
          <p className="font-bold text-stone-500 text-lg">No brews logged yet.</p>
          <Link
            href="/generate"
            className="font-bold text-amber-600 hover:text-amber-700 underline underline-offset-2"
          >
            Generate your first recipe →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-baseline justify-between">
        <h1 className="text-5xl font-black tracking-tighter">Brew Log</h1>
        <span className="text-stone-400 font-bold">{log.length} brews</span>
      </div>

      <div className="flex flex-col gap-4">
        {log.map((entry) => (
          <div
            key={entry.id}
            className="border-2 border-stone-900 bg-white p-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"
          >
            <div className="flex flex-col gap-2 flex-1">
              <div className="flex items-baseline gap-3 flex-wrap">
                <Link
                  href={`/log/${entry.id}`}
                  className="text-xl font-black text-stone-900 hover:text-amber-600 transition-colors"
                >
                  {entry.recipe.coffeeName}
                </Link>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5">
                  {entry.recipe.brewMethod}
                </span>
              </div>
              <div className="flex gap-4 text-sm text-stone-500 font-medium flex-wrap">
                <span>{entry.input.roaster}</span>
                <span>·</span>
                <span>{entry.input.origin}</span>
                <span>·</span>
                <span>
                  {new Date(entry.createdAt).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
              <StarRating value={entry.rating} readonly />
              {entry.userNotes && (
                <p className="text-sm text-stone-600 italic">
                  &ldquo;{entry.userNotes}&rdquo;
                </p>
              )}
            </div>
            <div className="flex gap-3 sm:flex-col sm:items-end">
              <Link
                href={`/log/${entry.id}`}
                className="text-sm font-bold text-stone-700 hover:text-stone-900 border-b border-stone-300 hover:border-stone-900 transition-colors"
              >
                View →
              </Link>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-sm font-bold text-red-400 hover:text-red-600 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
