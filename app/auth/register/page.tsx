"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    router.push("/generate");
    router.refresh();
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter">Create account</h1>
        <p className="text-stone-500 font-medium">
          Start with{" "}
          <span className="font-black text-amber-600">3 free credits</span> — no
          credit card needed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
            Email
          </label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
            Password
          </label>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors"
            placeholder="Min. 8 characters"
          />
        </div>

        {error && (
          <div className="border-2 border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="bg-stone-900 text-[#FAF7F2] font-black py-4 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>

        <p className="text-center text-sm text-stone-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-stone-900 hover:text-amber-600 underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
