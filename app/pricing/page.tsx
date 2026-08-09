"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/lib/subscriptionPlans";
import Spinner from "@/components/ui/Spinner";
import { Drop } from "@/components/ui/Decor";

const FEATURES: { label: string; free: string; brewPlus: string }[] = [
  { label: "Recipe logs", free: "Up to 10 (manual only)", brewPlus: "Unlimited" },
  { label: "AI recipe generation", free: "Not included", brewPlus: "Unlimited" },
  { label: "Future features", free: "—", brewPlus: "Included" },
];

export default function PricingPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [purchasing, setPurchasing] = useState<PlanId | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  // Only a *real* Stripe subscription should short-circuit the pricing
  // page. Complimentary Brew+ (granted via migration/admin, no
  // stripe_subscription_id) still needs to go through checkout to become
  // a real subscriber — otherwise there's no way for them to ever reach
  // "Manage subscription" and the flow becomes circular.
  const [hasRealSubscription, setHasRealSubscription] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<PlanId | null>(null);

  // Entitlement is only known client-side (fetched after mount from
  // Supabase), so the very first paint must render identically on the
  // server and the client's pre-hydration pass — otherwise React flags a
  // hydration mismatch on the `disabled` prop / plan-vs-banner branch.
  // Gating on `mounted` (false on both server and the client's first
  // render, flipped in an effect that only runs post-hydration) keeps
  // that first paint deterministic; the real entitlement state then
  // applies on the very next render, same as any normal client update.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setLoggedIn(!!user);
      if (!user) { setCheckingAuth(false); return; }

      supabase
        .from("profiles")
        .select("is_brew_plus_active, stripe_subscription_id, subscription_plan")
        .eq("id", user.id)
        .single()
        .then(({ data }) => {
          setHasRealSubscription(!!data?.is_brew_plus_active && !!data?.stripe_subscription_id);
          setCurrentPlan((data?.subscription_plan as PlanId | null) ?? null);
          setCheckingAuth(false);
        });
    });
  }, []);

  async function handleChoosePlan(planId: PlanId) {
    if (!loggedIn) {
      window.location.href = "/auth/login?next=/pricing";
      return;
    }
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

  // For a real subscriber, clicking any other plan must go through the
  // Stripe Customer Portal (which already supports plan switching) rather
  // than creating a second checkout session/subscription.
  async function handleSwitchPlan() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const { url, error } = await res.json();
      if (error) throw new Error(error);
      window.location.href = url;
    } catch (err) {
      console.error(err);
      setPortalLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-12">
      <div className="relative flex flex-col gap-2 text-center border-b border-line pb-8">
        <Drop className="pointer-events-none hidden sm:block absolute top-0 right-8 w-3 h-4 text-terracotta/30" />
        <h1 className="font-heading text-5xl font-bold tracking-tight text-ink">Brew+</h1>
        <p className="text-muted font-medium">
          Unlimited AI recipes and unlimited logs — cancel anytime.
        </p>
      </div>

      {/* Already subscribed */}
      {mounted && hasRealSubscription && (
        <div className="rounded-2xl bg-gold px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="font-bold text-espresso">
            ☕ You&apos;re already on Brew+ — manage your subscription in Settings.
          </p>
          <Link
            href="/settings"
            className="font-heading bg-terracotta text-white font-bold px-6 py-3 rounded-xl hover:opacity-90 transition-colors whitespace-nowrap"
          >
            Manage subscription →
          </Link>
        </div>
      )}

      {/* Plan cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div
            key={plan.id}
            className="rounded-2xl bg-surface border border-line p-6 flex flex-col gap-4 relative shadow-sm"
          >
            {plan.badge && (
              <span className="font-heading absolute -top-3 left-4 -rotate-3 text-xs font-bold uppercase tracking-widest bg-terracotta text-white rounded-full px-2.5 py-0.5">
                {plan.badge}
              </span>
            )}
            {mounted && hasRealSubscription && currentPlan === plan.id && (
              <span className="font-heading absolute -top-3 right-4 text-xs font-bold uppercase tracking-widest bg-terracotta text-white rounded-full px-2.5 py-0.5">
                Current Plan
              </span>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="font-heading text-lg font-bold text-muted uppercase tracking-wide">
                {plan.label}
              </span>
              <span className="font-heading text-4xl font-bold text-espresso">
                {plan.priceLabel}
                <span className="text-base font-bold text-muted"> {plan.interval}</span>
              </span>
              {plan.billedAs && (
                <span className="text-sm text-muted font-medium">{plan.billedAs}</span>
              )}
            </div>
            {mounted && hasRealSubscription ? (
              currentPlan === plan.id ? (
                <span className="font-heading text-center py-3 rounded-xl border border-line text-muted font-bold text-sm uppercase tracking-widest">
                  ✓ Your current plan
                </span>
              ) : (
                <button
                  onClick={handleSwitchPlan}
                  disabled={portalLoading}
                  className="font-heading bg-terracotta text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {portalLoading && <Spinner />}
                  {portalLoading ? "Redirecting…" : "Switch plan →"}
                </button>
              )
            ) : (
              <button
                onClick={() => handleChoosePlan(plan.id)}
                disabled={!mounted || checkingAuth || purchasing !== null}
                className="font-heading bg-terracotta text-white font-bold py-3 rounded-xl hover:opacity-90 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                {purchasing === plan.id && <Spinner />}
                {purchasing === plan.id ? "Redirecting…" : "Choose plan →"}
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Feature comparison */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading font-bold text-xl uppercase tracking-wide text-center text-ink">
          Free vs Brew+
        </h2>
        <div className="rounded-2xl border border-line bg-surface overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-line bg-surface-soft">
              <tr>
                <th className="px-4 py-3 text-left font-heading text-xs font-bold uppercase tracking-widest text-muted">
                  Feature
                </th>
                <th className="px-4 py-3 text-left font-heading text-xs font-bold uppercase tracking-widest text-muted">
                  Free
                </th>
                <th className="px-4 py-3 text-left font-heading text-xs font-bold uppercase tracking-widest text-terracotta">
                  Brew+
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {FEATURES.map((f) => (
                <tr key={f.label}>
                  <td className="px-4 py-3 font-bold text-espresso">{f.label}</td>
                  <td className="px-4 py-3 text-muted">{f.free}</td>
                  <td className="px-4 py-3 font-bold text-terracotta">{f.brewPlus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
