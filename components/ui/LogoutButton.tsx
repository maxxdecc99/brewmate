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
        className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-3 py-2 transition-colors text-sm"
      >
        Log out
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/60 px-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-cream border-2 border-ink p-8 flex flex-col gap-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h2 className="font-heading text-2xl font-bold uppercase tracking-tight text-ink">
                Log out?
              </h2>
              <p className="text-muted font-medium text-sm">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide px-5 py-2.5 hover:bg-[#dd2b0f] transition-colors text-sm"
              >
                Log out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="font-heading font-bold uppercase tracking-wide text-muted hover:text-ink transition-colors text-sm px-2"
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
