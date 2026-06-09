"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/generate";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  return (
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
          placeholder="••••••••"
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
        {loading ? "Logging in…" : "Log in →"}
      </button>

      <p className="text-center text-sm text-stone-500">
        No account yet?{" "}
        <Link
          href="/auth/register"
          className="font-bold text-stone-900 hover:text-amber-600 underline underline-offset-2"
        >
          Sign up free
        </Link>
      </p>
    </form>
  );
}

export default function LoginPage() {
  return (
    <div className="max-w-md mx-auto flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter">Welcome back</h1>
        <p className="text-stone-500 font-medium">Log in to your BrewMate account.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
