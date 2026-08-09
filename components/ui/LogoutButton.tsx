"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LogoutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <button
        onClick={() => setShowConfirm(true)}
        className="font-heading font-bold text-ink/60 hover:text-ink hover:bg-espresso-soft rounded-full px-3 py-2 transition-colors text-sm"
      >
        Log out
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-espresso/60 px-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-cream rounded-2xl p-8 flex flex-col gap-6 w-full max-w-sm shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-2xl font-bold tracking-tight text-ink">
                Log out?
              </h2>
              <p className="text-muted font-medium text-sm">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="font-heading bg-terracotta text-white font-bold px-5 py-2.5 rounded-xl hover:opacity-90 transition-colors text-sm"
              >
                Log out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="font-heading font-bold text-muted hover:text-ink transition-colors text-sm px-2"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
