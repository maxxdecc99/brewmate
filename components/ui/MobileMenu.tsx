"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

const LOGGED_IN_ITEMS = [
  { n: "01", label: "Generate Recipe", href: "/generate" },
  { n: "02", label: "Brew Log", href: "/log" },
  { n: "03", label: "Settings", href: "/settings" },
  { n: "04", label: "Pricing", href: "/pricing" },
  { n: "05", label: "Account", href: "/account" },
  { n: "06", label: "Log Out", href: null },
];

const LOGGED_OUT_ITEMS = [
  { n: "01", label: "Pricing", href: "/pricing" },
  { n: "02", label: "Log in", href: "/auth/login" },
  { n: "03", label: "Sign up free", href: "/auth/register" },
];

export default function MobileMenu({ loggedIn }: { loggedIn: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  async function handleLogout() {
    setOpen(false);
    await createClient().auth.signOut();
    router.push("/");
    router.refresh();
  }

  const items = loggedIn ? LOGGED_IN_ITEMS : LOGGED_OUT_ITEMS;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        className="md:hidden w-10 h-10 flex items-center justify-center border-2 border-ink text-ink text-lg"
      >
        ☰
      </button>

      {open && (
        <div className="fixed inset-0 z-50 bg-terracotta flex flex-col px-6 py-6 sm:px-10 sm:py-8">
          <div className="flex items-center justify-between">
            <span className="font-heading text-sm font-bold uppercase tracking-widest text-cream">
              Menu
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-cream text-2xl leading-none"
            >
              ✕
            </button>
          </div>

          <nav className="flex flex-col mt-10">
            {items.map((item) =>
              item.href ? (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="flex items-baseline gap-3 py-4 border-b border-cream/25"
                >
                  <span className="text-xs font-bold text-cream/60">{item.n}</span>
                  <span className="font-heading text-2xl sm:text-3xl font-bold uppercase text-cream">
                    {item.label}
                  </span>
                </Link>
              ) : (
                <button
                  key={item.label}
                  onClick={handleLogout}
                  className="flex items-baseline gap-3 py-4 border-b border-cream/25 text-left"
                >
                  <span className="text-xs font-bold text-cream/60">{item.n}</span>
                  <span className="font-heading text-2xl sm:text-3xl font-bold uppercase text-cream">
                    {item.label}
                  </span>
                </button>
              )
            )}
          </nav>

          <div className="font-heading mt-auto text-4xl font-bold uppercase text-cream tracking-tight">
            BrewMate
          </div>
        </div>
      )}
    </>
  );
}
