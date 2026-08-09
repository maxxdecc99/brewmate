"use client";

import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Label, Input } from "@/components/ui/FormField";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/generate";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unverified, setUnverified] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setUnverified(false);
    setResendState("idle");

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const isUnconfirmed =
        error.message?.toLowerCase().includes("email not confirmed") ||
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (error as any).code === "email_not_confirmed";

      if (isUnconfirmed) {
        setUnverified(true);
      } else {
        setError("Invalid email or password.");
      }
      setLoading(false);
      return;
    }

    router.push(next);
    router.refresh();
  }

  async function handleResend() {
    setResendState("loading");
    const supabase = createClient();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    setResendState(error ? "error" : "sent");
  }

  return (
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
      <div>
        <div className="flex items-center justify-between mb-1">
          <Label>Password</Label>
          <Link
            href="/auth/forgot-password"
            className="text-xs font-bold text-muted hover:text-terracotta underline underline-offset-2"
          >
            Forgot password?
          </Link>
        </div>
        <Input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>

      {unverified && (
        <div className="flex flex-col gap-2">
          <div className="rounded-xl bg-gold px-4 py-3 text-espresso text-sm font-medium">
            Please verify your email before logging in. Check your inbox for the confirmation link.
          </div>
          {resendState === "sent" ? (
            <p className="text-xs text-center text-muted font-medium">
              Verification email sent — check your inbox.
            </p>
          ) : (
            <button
              type="button"
              onClick={handleResend}
              disabled={resendState === "loading"}
              className="text-xs font-bold text-center text-muted hover:text-terracotta underline underline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendState === "loading" ? "Sending…" : "Resend verification email"}
            </button>
          )}
          {resendState === "error" && (
            <p className="text-xs text-center text-red-600 font-medium">
              Failed to resend. Please try again.
            </p>
          )}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="font-heading bg-terracotta text-white font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Logging in…" : "Log in →"}
      </button>

      <p className="text-center text-sm text-muted">
        No account yet?{" "}
        <Link
          href="/auth/register"
          className="font-bold text-ink hover:text-terracotta underline underline-offset-2"
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
        <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Welcome back</h1>
        <p className="text-muted font-medium">Log in to your BrewMate account.</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  );
}
