"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isPasswordValid, getPasswordErrors } from "@/lib/passwordValidation";
import PasswordChecklist from "@/components/ui/PasswordChecklist";
import { Label, Input } from "@/components/ui/FormField";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isPasswordValid(password)) {
      const missing = getPasswordErrors(password);
      setError("Password must include: " + missing.map(s => s.toLowerCase()).join(", ") + ".");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError("Could not update password. Your reset link may have expired.");
      setLoading(false);
      return;
    }

    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  return (
    <div className="max-w-md mx-auto flex flex-col gap-8 py-8">
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-ink">Set new password</h1>
        <p className="text-muted font-medium">Choose a strong password for your account.</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <Label>New password</Label>
          <Input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Min. 8 characters"
          />
          <PasswordChecklist password={password} />
        </div>
        <div>
          <Label>Confirm new password</Label>
          <Input
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
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
          className="font-heading bg-terracotta text-white font-bold py-4 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Updating…" : "Update password →"}
        </button>
      </form>
    </div>
  );
}
