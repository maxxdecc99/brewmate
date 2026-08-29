"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/lib/subscriptionPlans";
import Spinner from "./Spinner";

const COPY: Record<
  "ai_locked" | "log_limit",
  { eyebrow: string; title: string; body: string }
> = {
  ai_locked: {
    eyebrow: "Brew+ feature",
    title: "AI recipes need Brew+",
    body: "Upgrade to Brew+ for unlimited AI-generated recipes, tailored to your beans and gear.",
  },
  log_limit: {
    eyebrow: "Log limit reached",
    title: "You've saved 10 logs",
    body: "That's the limit on Free. Brew+ gives unlimited logs and unlimited AI recipes, so nothing you brew gets left out.",
  },
};

const FEATURES: { label: string; free: string; brewPlus: string }[] = [
  { label: "Recipe logs", free: "Up to 10", brewPlus: "Unlimited" },
  { label: "AI recipes", free: "Not included", brewPlus: "Unlimited" },
  { label: "Future features", free: "—", brewPlus: "Included" },
];

export default function UpgradePrompt({ reason }: { reason: "ai_locked" | "log_limit" }) {
  const { eyebrow, title, body } = COPY[reason];
  const [purchasing, setPurchasing] = useState<PlanId | null>(null);

  async function handleChoosePlan(planId: PlanId) {
    setPurchasing(planId);
    try {
      const res = await fetch("/api/create-subscription-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: planId }),
      });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setPurchasing(null);
    }
  }

  return (
    <div className="-mx-4 sm:mx-0 flex flex-col max-w-2xl">
      <div className="bg-terracotta text-white px-4 sm:px-8 py-8 flex flex-col gap-3">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-white/80">{eyebrow}</span>
        <h2 className="font-heading text-3xl sm:text-4xl font-extrabold uppercase tracking-tight leading-[0.95]">{title}</h2>
        <p className="text-white/90 font-medium">{body}</p>
      </div>

      <div className="border-x border-line sm:border-x-0">
        {SUBSCRIPTION_PLANS.map((plan, i) => (
          <div
            key={plan.id}
            className={`flex items-center gap-4 px-4 sm:px-8 py-5 border-b-2 border-ink ${
              plan.badge ? "bg-surface" : ""
            }`}
          >
            <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted w-6 shrink-0">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-xs font-extrabold uppercase tracking-wide">{plan.label}</span>
                {plan.badge && (
                  <span className="font-heading text-[8px] font-bold uppercase tracking-[.16em] bg-ink text-cream px-1.5 py-0.5">
                    {plan.badge}
                  </span>
                )}
              </div>
              <span className="font-heading text-2xl font-extrabold tracking-tight">
                {plan.priceLabel}
                <span className="text-xs font-bold text-muted"> {plan.interval}</span>
              </span>
              {plan.billedAs && <span className="text-xs text-muted font-medium">{plan.billedAs}</span>}
            </div>
            <button
              onClick={() => handleChoosePlan(plan.id)}
              disabled={purchasing !== null}
              className={`shrink-0 font-heading text-[10px] font-bold uppercase tracking-[.16em] px-4 py-3.5 transition-colors inline-flex items-center gap-2 disabled:opacity-50 ${
                plan.badge ? "bg-terracotta text-white hover:bg-[#dd2b0f]" : "border-2 border-ink hover:bg-ink hover:text-cream"
              }`}
            >
              {purchasing === plan.id && <Spinner />}
              {purchasing === plan.id ? "Redirecting…" : "Choose"}
            </button>
          </div>
        ))}
      </div>

      <div className="px-4 sm:px-8 py-6 flex flex-col gap-3">
        <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-terracotta">Free vs Brew+</span>
        <div className="grid grid-cols-[1.4fr_1fr_1fr] gap-y-3 text-sm">
          <span className="font-heading text-[9px] font-bold uppercase tracking-[.16em] text-muted">Feature</span>
          <span className="font-heading text-[9px] font-bold uppercase tracking-[.16em] text-muted">Free</span>
          <span className="font-heading text-[9px] font-bold uppercase tracking-[.16em] text-terracotta">Brew+</span>
          {FEATURES.map((f) => (
            <Fragment key={f.label}>
              <span className="font-bold text-espresso border-t border-line pt-3">{f.label}</span>
              <span className="text-muted border-t border-line pt-3">{f.free}</span>
              <span className="font-bold text-terracotta border-t border-line pt-3">{f.brewPlus}</span>
            </Fragment>
          ))}
        </div>
      </div>

      <Link
        href="/log"
        className="text-center font-heading text-xs font-bold uppercase tracking-[.16em] text-muted hover:text-ink py-4 transition-colors"
      >
        Not now — back to my log
      </Link>
    </div>
  );
}
