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
        className="font-bold text-stone-500 hover:text-stone-900 transition-colors text-sm"
      >
        Log out
      </button>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 px-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="bg-[#FAF7F2] border-2 border-stone-900 p-8 flex flex-col gap-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-black tracking-tighter text-stone-900">
                Log out?
              </h2>
              <p className="text-stone-500 font-medium text-sm">
                Are you sure you want to log out?
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleLogout}
                className="bg-stone-900 text-[#FAF7F2] font-bold px-5 py-2.5 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 transition-colors text-sm"
              >
                Log out
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="font-bold text-stone-500 hover:text-stone-900 transition-colors text-sm px-2"
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
