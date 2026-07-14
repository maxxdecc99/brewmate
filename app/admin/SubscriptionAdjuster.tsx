"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  subscription_tier: "free" | "brew_plus";
}

export default function SubscriptionAdjuster({ users }: { users: User[] }) {
  const [userId, setUserId] = useState("");
  const [tier, setTier] = useState<"free" | "brew_plus">("brew_plus");
  const [months, setMonths] = useState(1);
  const [permanent, setPermanent] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const expiresAt =
      tier === "brew_plus" && !permanent
        ? new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000).toISOString()
        : null;

    const res = await fetch("/api/admin/adjust-subscription", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, tier, expiresAt }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult(`Error: ${data.error}`);
    } else {
      setResult(
        tier === "free"
          ? "Done — reverted to Free."
          : `Done — Brew+ granted${expiresAt ? ` until ${new Date(expiresAt).toLocaleDateString("en-GB")}` : " (permanent)"}.`
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-stone-900 bg-white p-6 flex flex-col gap-4">
      <h3 className="font-black text-lg uppercase tracking-wide">Adjust Subscription</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
            User
          </label>
          <select
            required
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="">Select user…</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.email} ({u.subscription_tier === "brew_plus" ? "Brew+" : "Free"})
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
            Tier
          </label>
          <select
            value={tier}
            onChange={(e) => setTier(e.target.value as "free" | "brew_plus")}
            className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500"
          >
            <option value="brew_plus">Brew+</option>
            <option value="free">Free</option>
          </select>
        </div>
      </div>

      {tier === "brew_plus" && (
        <div className="flex items-end gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
              Extend by (months)
            </label>
            <input
              type="number"
              min={1}
              disabled={permanent}
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value) || 1)}
              className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 disabled:opacity-50"
            />
          </div>
          <label className="flex items-center gap-2 pb-3 font-medium text-sm">
            <input
              type="checkbox"
              checked={permanent}
              onChange={(e) => setPermanent(e.target.checked)}
            />
            Permanent (no expiry)
          </label>
        </div>
      )}

      {result && (
        <div className={`px-4 py-3 text-sm font-medium border-2 ${result.startsWith("Error") ? "border-red-400 bg-red-50 text-red-700" : "border-green-400 bg-green-50 text-green-700"}`}>
          {result}
        </div>
      )}
      <button
        type="submit"
        disabled={loading}
        className="self-start bg-stone-900 text-[#FAF7F2] font-bold px-8 py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 transition-colors"
      >
        {loading ? "Saving…" : "Apply"}
      </button>
    </form>
  );
}
