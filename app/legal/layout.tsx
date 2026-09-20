import Link from "next/link";

const LEGAL_PAGES = [
  { href: "/legal/terms-of-service", label: "Terms of Service" },
  { href: "/legal/privacy-policy", label: "Privacy Policy" },
  { href: "/legal/refund-policy", label: "Refund Policy" },
];

export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-2xl mx-auto flex flex-col gap-8">
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b-2 border-ink pb-4">
        <Link
          href="/"
          className="font-heading text-xs font-bold uppercase tracking-widest text-muted hover:text-ink transition-colors"
        >
          ← GetYourBrew
        </Link>
        <span className="hidden sm:inline text-line">|</span>
        {LEGAL_PAGES.map((p) => (
          <Link
            key={p.href}
            href={p.href}
            className="font-heading text-xs font-bold uppercase tracking-widest text-ink/70 hover:text-ink transition-colors"
          >
            {p.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
