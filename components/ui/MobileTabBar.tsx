"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "Home", href: "/", match: (p: string) => p === "/" },
  { label: "Brew", href: "/generate", match: (p: string) => p.startsWith("/generate") },
  { label: "Log", href: "/log", match: (p: string) => p.startsWith("/log") },
  { label: "You", href: "/account", match: (p: string) => p.startsWith("/account") || p.startsWith("/settings") },
];

export default function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav className="sm:hidden fixed bottom-0 inset-x-0 z-40 grid grid-cols-4 border-t-2 border-ink bg-cream">
      {TABS.map((tab) => {
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
