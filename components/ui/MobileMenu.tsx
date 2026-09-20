"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

// Mobile-only hamburger for the logged-out nav (Pricing / Log in / Sign up
// free) — those three links no longer fit horizontally next to the logo on
// small screens. Logged-in mobile nav is handled entirely by MobileTabBar
// (the fixed bottom bar), so this renders nothing when `loggedIn` is true;
// gating on that same auth-state prop (passed down from Navbar's server
// component) rather than the current path is the point — see the removed
// isWaitlist path-based special case this replaces.
export default function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (loggedIn) return null;

  return (
    <div className="md:hidden relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        className="w-10 h-10 flex items-center justify-center border-2 border-ink text-ink text-lg"
      >
        {open ? "✕" : "☰"}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-ink/20"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <nav className="absolute right-0 top-[calc(100%+8px)] z-50 w-56 flex flex-col border-2 border-ink bg-cream">
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-4 py-3.5 text-sm border-b border-line transition-colors"
            >
              Pricing
            </Link>
            <Link
              href="/auth/login"
              onClick={() => setOpen(false)}
              className="font-heading font-bold uppercase tracking-wide text-ink/70 hover:text-ink hover:bg-ink/5 px-4 py-3.5 text-sm border-b border-line transition-colors"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              onClick={() => setOpen(false)}
              className="font-heading font-bold uppercase tracking-wide bg-terracotta text-white px-4 py-3.5 text-sm hover:bg-[#dd2b0f] transition-colors"
            >
              Sign up free
            </Link>
          </nav>
        </>
      )}
    </div>
  );
}
