"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/FormField";

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
          <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Check your email</h1>
          <p className="text-muted font-medium">
            We sent a password reset link to{" "}
            <span className="font-bold text-ink">{email}</span>.
          </p>
        </div>

        <div className="rounded-xl bg-gold px-4 py-4 text-ink text-sm font-medium">
          Click the link in your email to set a new password. The link expires in 1 hour.
        </div>

        <p className="text-center text-sm text-muted">
          Back to{" "}
          <Link
            href="/auth/login"
            className="font-bold text-ink hover:text-terracotta underline underline-offset-2"
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
        <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Forgot password?</h1>
        <p className="text-muted font-medium">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <Label>Email</Label>
          <Input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-heading bg-ink text-cream font-bold py-4 rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Sending…" : "Send reset link →"}
        </button>

        <p className="text-center text-sm text-muted">
          Remember your password?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-ink hover:text-terracotta underline underline-offset-2"
          >
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}
