"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const LOGGED_IN_TABS = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Brew", href: "/generate", match: (p: string) => p.startsWith("/generate") },
  { label: "Log", href: "/log", match: (p: string) => p.startsWith("/log") },
  { label: "You", href: "/account", match: (p: string) => p.startsWith("/account") || p.startsWith("/settings") },
];

const LOGGED_OUT_TABS = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Pricing", href: "/pricing", match: (p: string) => p.startsWith("/pricing") },
  { label: "Log In", href: "/auth/login", match: (p: string) => p.startsWith("/auth/login") },
  { label: "Sign Up", href: "/auth/register", match: (p: string) => p.startsWith("/auth/register") },
];

export default function MobileTabBar() {
  const pathname = usePathname();
  // null = auth state not known yet. Kept distinct from `false` (confirmed
  // logged out) so the bar renders nothing until the check resolves,
  // instead of flashing the wrong tab set for logged-in users on load.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => setLoggedIn(!!user));
  }, []);

  if (loggedIn === null) return null;

  const tabs = loggedIn ? LOGGED_IN_TABS : LOGGED_OUT_TABS;

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t-2 border-ink bg-cream">
      {tabs.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`font-heading text-center py-3 pb-5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
              active ? "bg-ink text-cream" : "text-muted"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
