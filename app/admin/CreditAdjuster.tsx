"use client";

import { useState } from "react";

interface User {
  id: string;
  email: string;
  credit_balance: number;
}

export default function CreditAdjuster({ users }: { users: User[] }) {
  const [userId, setUserId] = useState("");
  const [amount, setAmount] = useState(0);
  const [description, setDescription] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    const res = await fetch("/api/admin/adjust-credits", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId, amount, description }),
    });
    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setResult(`Error: ${data.error}`);
    } else {
      setResult(`Done — new balance: ${data.newBalance} credits`);
      setAmount(0);
      setDescription("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="border-2 border-stone-900 bg-white p-6 flex flex-col gap-4">
      <h3 className="font-black text-lg uppercase tracking-wide">Adjust Credits</h3>
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
                {u.email} ({u.credit_balance} credits)
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
            Amount (negative to remove)
          </label>
          <input
            type="number"
            required
            value={amount}
            onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
            className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
          Reason
        </label>
        <input
          type="text"
          required
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="e.g. Refund, manual top-up, etc."
          className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500"
        />
      </div>
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
