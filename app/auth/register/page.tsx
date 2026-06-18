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
  const [confirmed, setConfirmed] = useState(false);
  const [isDuplicate, setIsDuplicate] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsDuplicate(false);

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
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
          <h1 className="text-4xl font-black tracking-tighter">Check your email</h1>
          <p className="text-stone-500 font-medium">
            We sent a confirmation link to{" "}
            <span className="font-bold text-stone-900">{email}</span>.
          </p>
        </div>

        <div className="border-2 border-amber-500 bg-amber-50 px-4 py-4 text-amber-900 text-sm font-medium">
          Click the link in your email to verify your account before logging in.
        </div>

        <p className="text-center text-sm text-stone-500">
          Already verified?{" "}
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

        {isDuplicate && (
          <div className="border-2 border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
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
