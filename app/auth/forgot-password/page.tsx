"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (error) {
      setError("Something went wrong. Please try again.");
      setLoading(false);
      return;
    }

    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="max-w-md mx-auto flex flex-col gap-8 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter">Check your email</h1>
          <p className="text-stone-500 font-medium">
            We sent a password reset link to{" "}
            <span className="font-bold text-stone-900">{email}</span>.
          </p>
        </div>

        <div className="border-2 border-amber-500 bg-amber-50 px-4 py-4 text-amber-900 text-sm font-medium">
          Click the link in your email to set a new password. The link expires in 1 hour.
        </div>

        <p className="text-center text-sm text-stone-500">
          Back to{" "}
          <Link
            href="/auth/login"
            className="font-bold text-stone-900 hover:text-amber-600 underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter">Forgot password?</h1>
        <p className="text-stone-500 font-medium">
          Enter your email and we&apos;ll send you a reset link.
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
          {loading ? "Sending…" : "Send reset link →"}
        </button>

        <p className="text-center text-sm text-stone-500">
          Remember your password?{" "}
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
