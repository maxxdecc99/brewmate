"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { isPasswordValid, getPasswordErrors } from "@/lib/passwordValidation";
import PasswordChecklist from "@/components/ui/PasswordChecklist";

export default function SettingsPage() {
  const router = useRouter();
  const [userEmail, setUserEmail] = useState("");

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
    createClient().auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setUserEmail(user.email);
    });
  }, []);

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
      <div className="flex flex-col gap-2 border-b-2 border-stone-900 pb-6">
        <h1 className="text-5xl font-black tracking-tighter">Settings</h1>
        {userEmail && <p className="text-stone-500 font-medium">{userEmail}</p>}
      </div>

      {/* Change Email */}
      <section className="flex flex-col gap-5">
        <h2 className="font-black text-xl uppercase tracking-wide">Change Email</h2>

        {emailSuccess ? (
          <div className="border-2 border-amber-500 bg-amber-50 px-4 py-4 text-amber-900 text-sm font-medium">
            Verification email sent to <span className="font-bold">{newEmail || "your new address"}</span>.
            Click the link in that email to confirm the change — your email won&apos;t update until you do.
          </div>
        ) : (
          <form onSubmit={handleEmailChange} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                New Email Address
              </label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="new@example.com"
              />
            </div>

            {emailError && (
              <div className="border-2 border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                {emailError}
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="self-start bg-stone-900 text-[#FAF7F2] font-black px-6 py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {emailLoading ? "Sending…" : "Send verification email →"}
            </button>
          </form>
        )}
      </section>

      <hr className="border-stone-200" />

      {/* Change Password */}
      <section className="flex flex-col gap-5">
        <h2 className="font-black text-xl uppercase tracking-wide">Change Password</h2>

        {passwordSuccess ? (
          <div className="border-2 border-green-400 bg-green-50 px-4 py-4 text-green-800 text-sm font-bold">
            ✓ Password updated successfully.
          </div>
        ) : (
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                Current Password
              </label>
              <input
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="Min. 8 characters"
              />
              <PasswordChecklist password={newPassword} />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full border-2 border-stone-900 bg-white px-4 py-3 font-medium focus:outline-none focus:border-amber-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            {passwordError && (
              <div className="border-2 border-red-400 bg-red-50 px-4 py-3 text-red-700 text-sm font-medium">
                {passwordError}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="self-start bg-stone-900 text-[#FAF7F2] font-black px-6 py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {passwordLoading ? "Updating…" : "Update password →"}
            </button>
          </form>
        )}
      </section>

      <hr className="border-stone-200" />

      {/* Danger Zone */}
      <section className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          <h2 className="font-black text-xl uppercase tracking-wide text-red-600">Danger Zone</h2>
          <p className="text-stone-500 text-sm font-medium">These actions are permanent and cannot be undone.</p>
        </div>

        <div className="border-2 border-red-400 bg-red-50 p-6 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <p className="font-black text-stone-900">Delete Account</p>
            <p className="text-sm text-stone-600 font-medium">
              Your account, profile, and all saved recipes will be permanently deleted.
              Any remaining credits are <span className="font-bold">forfeited and non-refundable</span>.
            </p>
          </div>

          <form onSubmit={handleDeleteAccount} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-1">
                Type DELETE to confirm
              </label>
              <input
                type="text"
                required
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full border-2 border-red-400 bg-white px-4 py-3 font-mono font-bold focus:outline-none focus:border-red-600 transition-colors"
                placeholder="DELETE"
                autoComplete="off"
              />
            </div>

            {deleteError && (
              <div className="border-2 border-red-600 bg-white px-4 py-3 text-red-700 text-sm font-medium">
                {deleteError}
              </div>
            )}

            <button
              type="submit"
              disabled={deleteLoading || deleteConfirm !== "DELETE"}
              className="self-start bg-red-600 text-white font-black px-6 py-3 border-2 border-red-600 hover:bg-red-700 hover:border-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {deleteLoading ? "Deleting…" : "Delete my account permanently"}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
