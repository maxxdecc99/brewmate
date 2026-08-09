import Link from "next/link";

const COPY: Record<
  "ai_locked" | "log_limit",
  { title: string; body: string }
> = {
  ai_locked: {
    title: "AI recipes are a Brew+ feature",
    body: "Upgrade to Brew+ for unlimited AI-generated recipes, tailored to your beans and gear.",
  },
  log_limit: {
    title: "You've saved 10 logs — nice work",
    body: "That's the limit on the Free plan. Upgrade to Brew+ for unlimited logs, so nothing you brew ever gets left out.",
  },
};

export default function UpgradePrompt({ reason }: { reason: "ai_locked" | "log_limit" }) {
  const { title, body } = COPY[reason];

  return (
    <div className="rounded-2xl bg-surface border border-line p-8 flex flex-col items-center text-center gap-4 max-w-md mx-auto shadow-sm">
      <span className="text-4xl">☕</span>
      <h2 className="font-heading text-2xl font-bold tracking-tight text-espresso">{title}</h2>
      <p className="text-muted font-medium">{body}</p>
      <Link
        href="/pricing"
        className="font-heading bg-terracotta text-white font-bold px-8 py-3 rounded-xl hover:opacity-90 transition-colors"
      >
        See Brew+ plans →
      </Link>
    </div>
  );
}
