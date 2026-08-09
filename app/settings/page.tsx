"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { isPasswordValid, getPasswordErrors } from "@/lib/passwordValidation";
import PasswordChecklist from "@/components/ui/PasswordChecklist";
import Spinner from "@/components/ui/Spinner";
import { Label, Input } from "@/components/ui/FormField";

interface SubscriptionProfile {
  subscription_tier: "free" | "brew_plus";
  subscription_expires_at: string | null;
  is_brew_plus_active: boolean;
  stripe_subscription_id: string | null;
  subscription_cancel_at_period_end: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");

  // Subscription
  const [subProfile, setSubProfile] = useState<SubscriptionProfile | null>(null);
  const [subLoading, setSubLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  // Email change
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
      if (!user) { setSubLoading(false); return; }

      supabase
        .from("profiles")
        .select(
          "subscription_tier, subscription_expires_at, is_brew_plus_active, stripe_subscription_id, subscription_cancel_at_period_end"
        )
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setSubProfile(data);
          setSubLoading(false);
        });
    });
  }, []);

  async function handleManageSubscription() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setPortalLoading(false);
    }
  }

  async function handleEmailChange(e: React.FormEvent) {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    if (newEmail === userEmail) {
      setEmailError("That's already your current email address.");
      return;
    }

    setEmailLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ email: newEmail });

    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSuccess(true);
      setNewEmail("");
    }
    setEmailLoading(false);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (!isPasswordValid(newPassword)) {
      const missing = getPasswordErrors(newPassword);
      setPasswordError("Password must include: " + missing.map(s => s.toLowerCase()).join(", ") + ".");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError("New password must be different from your current password.");
      return;
    }

    setPasswordLoading(true);
    const supabase = createClient();

    // Verify current password by re-authenticating
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: currentPassword,
    });

    if (signInError) {
      setPasswordError("Current password is incorrect.");
      setPasswordLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      setPasswordError(error.message);
    } else {
      setPasswordSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
    setPasswordLoading(false);
  }

  async function handleDeleteAccount(e: React.FormEvent) {
    e.preventDefault();
    setDeleteError(null);

    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type DELETE (all caps) to confirm.');
      return;
    }

    setDeleteLoading(true);
    const res = await fetch("/api/delete-account", { method: "DELETE" });
    const json = await res.json();

    if (!res.ok) {
      setDeleteError(json.error ?? "Something went wrong. Please try again.");
      setDeleteLoading(false);
      return;
    }

    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-12 py-8">
      <div className="flex flex-col gap-2 border-b border-line pb-6">
        <h1 className="font-heading text-5xl font-bold tracking-tight text-ink">Settings</h1>
        {userEmail && <p className="text-muted font-medium">{userEmail}</p>}
      </div>

      {/* Subscription */}
      <section className="flex flex-col gap-5">
        <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-ink">Subscription</h2>

        {subLoading ? (
          <div className="rounded-2xl border border-line bg-surface p-6 flex items-center gap-3 text-muted font-medium">
            <Spinner />
            <span>Loading…</span>
          </div>
        ) : subProfile?.is_brew_plus_active && subProfile.stripe_subscription_id ? (
          <div className="rounded-2xl border border-line bg-surface p-6 flex flex-col gap-4">
            <div>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
                Current Plan
              </span>
              <span className="font-heading text-2xl font-bold text-terracotta">☕ Brew+ — Active</span>
              {subProfile.subscription_expires_at && (
                <p className="text-muted font-medium mt-1">
                  {subProfile.subscription_cancel_at_period_end ? "Expires on " : "Renews on "}
                  {formatDate(subProfile.subscription_expires_at)}
                </p>
              )}
            </div>
            <button
              onClick={handleManageSubscription}
              disabled={portalLoading}
              className="font-heading self-start bg-ink text-cream font-bold px-6 py-3 rounded-xl hover:bg-terracotta disabled:opacity-50 transition-colors inline-flex items-center gap-2"
            >
              {portalLoading && <Spinner />}
              {portalLoading ? "Redirecting…" : "Manage subscription →"}
            </button>
          </div>
        ) : subProfile?.is_brew_plus_active ? (
          <div className="rounded-2xl border border-line bg-surface p-6 flex flex-col gap-4">
            <div>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
                Current Plan
              </span>
              <span className="font-heading text-2xl font-bold text-terracotta">
                ☕ Brew+ — Complimentary
                {subProfile.subscription_expires_at && (
                  <span className="text-muted font-medium text-base">
                    {" "}(expires {formatDate(subProfile.subscription_expires_at)})
                  </span>
                )}
              </span>
              <p className="text-muted font-medium mt-1">
                Subscribe before your complimentary period ends to keep full access.
              </p>
            </div>
            <Link
              href="/pricing"
              className="font-heading self-start bg-ink text-cream font-bold px-6 py-3 rounded-xl hover:bg-terracotta transition-colors"
            >
              Subscribe to keep Brew+ →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-line bg-surface p-6 flex flex-col gap-4">
            <div>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
                Current Plan
              </span>
              <span className="font-heading text-2xl font-bold text-ink">Free plan</span>
            </div>
            <Link
              href="/pricing"
              className="font-heading self-start bg-ink text-cream font-bold px-6 py-3 rounded-xl hover:bg-terracotta transition-colors"
            >
              Upgrade to Brew+ →
            </Link>
          </div>
        )}
      </section>

      <hr className="border-line" />

      {/* Change Email */}
      <section className="flex flex-col gap-5">
        <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-ink">Change Email</h2>

        {emailSuccess ? (
          <div className="rounded-xl bg-gold px-4 py-4 text-ink text-sm font-medium">
            Verification email sent to <span className="font-bold">{newEmail || "your new address"}</span>.
            Click the link in that email to confirm the change — your email won&apos;t update until you do.
          </div>
        ) : (
          <form onSubmit={handleEmailChange} className="flex flex-col gap-4">
            <div>
              <Label>New Email Address</Label>
              <Input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="new@example.com"
              />
            </div>

            {emailError && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                {emailError}
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="font-heading self-start bg-ink text-cream font-bold px-6 py-3 rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {emailLoading ? "Sending…" : "Send verification email →"}
            </button>
          </form>
        )}
      </section>

      <hr className="border-line" />

      {/* Change Password */}
      <section className="flex flex-col gap-5">
        <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-ink">Change Password</h2>

        {passwordSuccess ? (
          <div className="rounded-xl border border-green-300 bg-green-50 px-4 py-4 text-green-800 text-sm font-bold">
            ✓ Password updated successfully.
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min. 8 characters"
              />
              <PasswordChecklist password={newPassword} />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            {passwordError && (
              <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="font-heading self-start bg-ink text-cream font-bold px-6 py-3 rounded-xl hover:bg-terracotta disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? "Updating…" : "Update password →"}
            </button>
          </form>
        )}
      </section>

      <hr className="border-line" />

      {/* Danger Zone */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-red-600">Danger Zone</h2>
          <p className="text-muted text-sm font-medium">These actions are permanent and cannot be undone.</p>
        </div>

        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="font-heading font-bold text-ink">Delete Account</p>
            <p className="text-sm text-ink/70 font-medium">
              Your account, profile, and all saved recipes will be permanently deleted.
              Any active Brew+ subscription will be <span className="font-bold">cancelled immediately and is non-refundable</span>.
            </p>
          </div>

          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
            <div>
              <Label>Type DELETE to confirm</Label>
              <input
                type="text"
                required
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full rounded-xl border border-red-300 bg-surface px-4 py-3 font-mono font-bold focus:outline-none focus:border-red-500 transition-colors"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <div className="rounded-xl border border-red-400 bg-surface px-4 py-3 text-red-700 text-sm font-medium">
                {deleteError}
              </div>
            )}

            <button
              type="submit"
              disabled={deleteLoading || deleteConfirm !== "DELETE"}
              className="font-heading self-start bg-red-600 text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleteLoading ? "Deleting…" : "Delete my account permanently"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
