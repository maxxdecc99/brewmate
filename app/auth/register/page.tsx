"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isPasswordValid, getPasswordErrors } from "@/lib/passwordValidation";
import PasswordChecklist from "@/components/ui/PasswordChecklist";
import { Label, Input } from "@/components/ui/FormField";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsDuplicate(false);

    if (!isPasswordValid(password)) {
      const missing = getPasswordErrors(password);
      setError("Password must include: " + missing.map(s => s.toLowerCase()).join(", ") + ".");
      setLoading(false);
      return;
    }

    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      const msg = error.message?.toLowerCase() ?? "";
      if (msg.includes("already registered") || msg.includes("already exists")) {
        setIsDuplicate(true);
      } else {
        setError(error.message);
      }
      setLoading(false);
      return;
    }

    // Email enumeration protection: Supabase returns a fake success with no
    // identities when the email is already taken.
    if (data.user && data.user.identities?.length === 0) {
      setIsDuplicate(true);
      setLoading(false);
      return;
    }

    if (!data.session) {
      setConfirmed(true);
      return;
    }

    router.push("/generate");
    router.refresh();
  }

  if (confirmed) {
    return (
      <div className="max-w-md mx-auto flex flex-col gap-8 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">Check your email</h1>
          <p className="text-muted font-medium">
            We sent a confirmation link to{" "}
            <span className="font-bold text-ink">{email}</span>.
          </p>
        </div>

        <div className="border-2 border-ink px-4 py-4 text-espresso text-sm font-medium">
          Click the link in your email to verify your account before logging in.
        </div>

        <p className="text-center text-sm text-muted">
          Already verified?{" "}
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
      <span className="font-heading text-lg font-extrabold uppercase tracking-tight leading-[0.9] text-muted">
        Get your<br />brew
      </span>
      <div className="flex flex-col gap-2 border-b-2 border-ink pb-6">
        <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">Create account</h1>
        <p className="text-muted font-medium">
          Start with{" "}
          <span className="font-bold text-terracotta">3 free credits</span> — no
          credit card needed.
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
        <div>
          <Label>Password</Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
          <PasswordChecklist password={password} />
        </div>

        {isDuplicate && (
          <div className="border-2 border-terracotta px-4 py-3 text-terracotta text-sm font-bold">
            An account with this email already exists.{" "}
            <Link
              href="/auth/login"
              className="font-bold underline underline-offset-2 hover:text-red-900"
            >
              Try logging in instead
            </Link>
            , or use{" "}
            <Link
              href="/auth/forgot-password"
              className="font-bold underline underline-offset-2 hover:text-red-900"
            >
              Forgot password
            </Link>{" "}
            if you don&apos;t remember your password.
          </div>
        )}

        {error && (
          <div className="border-2 border-terracotta px-4 py-3 text-terracotta text-sm font-bold">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide py-4 hover:bg-[#dd2b0f] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Creating account…" : "Create account →"}
        </button>

        <p className="text-center text-sm text-muted">
          Already have an account?{" "}
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
