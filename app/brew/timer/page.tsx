"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { RecipeStep } from "@/types";

interface ActiveBrew {
  coffeeName: string;
  brewMethod: string;
  totalTime: string;
  steps: RecipeStep[];
}

function parseTime(t: string): number {
  const parts = t.split(":").map((p) => parseInt(p, 10) || 0);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 1) return parts[0];
  return 0;
}

function formatTime(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

export default function BrewTimerPage() {
  const router = useRouter();
  const [brew, setBrew] = useState<ActiveBrew | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem("activeBrewTimer");
    if (!raw) {
      setNotFound(true);
      return;
    }
    try {
      setBrew(JSON.parse(raw));
    } catch {
      setNotFound(true);
    }
  }, []);

  useEffect(() => {
    if (!running || !brew) return;
    intervalRef.current = setInterval(() => {
      setElapsed((e) => e + 1);
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [running, brew]);

  const stepStarts = useMemo(
    () => brew?.steps.map((s) => parseTime(s.time)) ?? [],
    [brew]
  );
  const totalSeconds = useMemo(
    () => (brew ? parseTime(brew.totalTime) : 0),
    [brew]
  );
  // Each step's end time is the next step's start time. The last step's end
  // is the recipe's total time -- but if that's missing/bad data (<= the
  // last step's own start), fall back to giving it a real, non-zero span
  // instead of marking it "done" the instant it becomes current.
  const stepEnds = useMemo(() => {
    return stepStarts.map((start, i) => {
      if (i < stepStarts.length - 1) return stepStarts[i + 1];
      return totalSeconds > start ? totalSeconds : start + 30;
    });
  }, [stepStarts, totalSeconds]);
  const effectiveTotal = stepEnds.length
    ? Math.max(totalSeconds, stepEnds[stepEnds.length - 1])
    : totalSeconds;

  if (notFound) {
    return (
      <div className="flex flex-col items-center gap-6 py-24 text-center">
        <p className="font-heading text-2xl font-bold uppercase text-ink">No active brew</p>
        <p className="text-muted">Start a timer from a recipe result or a saved brew.</p>
        <button
          onClick={() => router.push("/generate")}
          className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide px-6 py-3 hover:bg-[#dd2b0f] transition-colors"
        >
          Generate a recipe →
        </button>
      </div>
    );
  }

  if (!brew) return null;

  const finished = effectiveTotal > 0 && elapsed >= effectiveTotal;
  const progress = effectiveTotal > 0 ? Math.min(1, elapsed / effectiveTotal) : 0;

  function handleFinish() {
    sessionStorage.removeItem("activeBrewTimer");
    router.push("/log");
  }

  function handleReset() {
    if (!window.confirm("Are you sure? This will restart your brew.")) return;
    setElapsed(0);
  }

  return (
    <div className="-mx-4 sm:mx-0 -mt-10 sm:mt-0 min-h-[calc(100vh-8rem)] bg-ink text-cream flex flex-col">
      <div className="sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-cream/20 px-4 sm:px-8 py-3 flex items-center justify-between gap-4">
        <span className="font-heading text-2xl font-extrabold tracking-tight tabular-nums">
          {formatTime(elapsed)}
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setRunning((r) => !r)}
            className="font-heading font-extrabold text-xs uppercase tracking-[.16em] border border-cream/40 px-4 py-2 hover:bg-white/10 transition-colors"
          >
            {running ? "Pause" : "Resume"}
          </button>
          <button
            onClick={handleReset}
            className="font-heading font-extrabold text-xs uppercase tracking-[.16em] border border-cream/40 px-4 py-2 hover:bg-white/10 transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="px-4 sm:px-8 py-8 flex items-start justify-between gap-4">
        <div>
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-[#8D8880]">
            {finished ? "Brew complete" : "Brewing"} · {brew.coffeeName} · {brew.brewMethod}
          </span>
          <div className="mt-4 font-heading text-6xl sm:text-8xl font-extrabold tracking-tight leading-[0.86]">
            {formatTime(elapsed)}
          </div>
          <span className="mt-2 block font-heading text-[10px] font-bold uppercase tracking-[.2em] text-[#8D8880]">
            Of {brew.totalTime} total
          </span>
        </div>
      </div>

      <div className="h-1 bg-cream/20 mx-4 sm:mx-8">
        <div
          className="h-1 bg-terracotta transition-all duration-500"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      <div className="px-4 sm:px-8 py-8 flex flex-col flex-1">
        {brew.steps.map((step, i) => {
          const start = stepStarts[i] ?? 0;
          const end = stepEnds[i] ?? start;
          const isDone = !finished && elapsed >= end;
          const isCurrent = !finished && elapsed >= start && elapsed < end;
          return (
            <div key={i} className="flex gap-0">
              <div
                className={`w-14 shrink-0 font-heading font-extrabold text-sm pt-1 ${
                  isCurrent ? "text-terracotta" : isDone || finished ? "text-[#5C574F]" : "text-[#8D8880]"
                }`}
              >
                {step.time}
              </div>
              <div
                className={`flex-1 border-l-2 pb-6 pl-5 ${
                  isCurrent ? "border-terracotta" : "border-cream/20"
                }`}
              >
                {isCurrent ? (
                  <div className="bg-terracotta text-white p-4">
                    <div className="font-heading text-xl font-extrabold tracking-tight">{step.title}</div>
                    <p className="mt-2 text-sm text-white/90">{step.description}</p>
                  </div>
                ) : (
                  <>
                    <div className={`font-heading font-bold ${isDone || finished ? "text-[#5C574F]" : ""}`}>
                      {step.title}
                    </div>
                    <p className={`mt-1.5 text-sm ${isDone || finished ? "text-[#4A453E]" : "text-[#8D8880]"}`}>
                      {isDone || finished ? "Done" : step.description}
                    </p>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 border-t border-cream/20">
        <button
          onClick={() => setRunning((r) => !r)}
          className="py-8 text-center font-heading font-extrabold text-sm uppercase tracking-[.18em] border-r border-cream/20 hover:bg-white/5 transition-colors"
        >
          {running ? "Pause" : "Resume"}
        </button>
        <button
          onClick={handleFinish}
          className="py-8 text-center font-heading font-extrabold text-sm uppercase tracking-[.18em] bg-terracotta text-white hover:bg-[#dd2b0f] transition-colors"
        >
          Finish →
        </button>
      </div>
    </div>
  );
}
