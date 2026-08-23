"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SUBSCRIPTION_PLANS, type PlanId } from "@/lib/subscriptionPlans";
import Spinner from "@/components/ui/Spinner";

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
      <div className="flex flex-col gap-2 text-center border-b-2 border-ink pb-8">
        <span className="font-heading text-xs font-bold uppercase tracking-widest text-terracotta">/// Subscription</span>
        <h1 className="font-heading text-6xl font-extrabold uppercase tracking-tight text-ink">Brew+</h1>
        <p className="text-muted font-medium">
          Unlimited AI recipes and unlimited logs — cancel anytime.
        </p>
      </div>

      {/* Already subscribed */}
      {mounted && hasRealSubscription && (
        <div className="border-2 border-ink px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="font-bold text-espresso">
            ☕ You&apos;re already on Brew+ — manage your subscription in Settings.
          </p>
          <Link
            href="/settings"
            className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide px-6 py-3 hover:bg-[#dd2b0f] transition-colors whitespace-nowrap"
          >
            Manage subscription →
          </Link>
        </div>
      )}

      {/* Plan rows */}
      <div className="border-b-2 border-ink">
        {SUBSCRIPTION_PLANS.map((plan, i) => (
          <div
            key={plan.id}
            className="flex flex-col sm:flex-row sm:items-center gap-3 border-t-2 border-ink p-5"
          >
            <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted shrink-0 w-8">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="flex-1 flex flex-col gap-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-heading text-sm font-extrabold uppercase tracking-wide text-ink">
                  {plan.label}
                </span>
                {plan.badge && (
                  <span className="font-heading text-[9px] font-bold uppercase tracking-widest bg-ink text-cream px-1.5 py-0.5">
                    {plan.badge}
                  </span>
                )}
                {mounted && hasRealSubscription && currentPlan === plan.id && (
                  <span className="font-heading text-[9px] font-bold uppercase tracking-widest bg-terracotta text-white px-1.5 py-0.5">
                    Current Plan
                  </span>
                )}
              </div>
              <span className="font-heading text-4xl font-extrabold tracking-tight text-espresso">
                {plan.priceLabel}
                <span className="text-sm font-bold text-muted"> {plan.interval}</span>
              </span>
              {plan.billedAs && (
                <span className="text-sm text-muted font-medium">{plan.billedAs}</span>
              )}
            </div>
            {mounted && hasRealSubscription ? (
              currentPlan === plan.id ? (
                <span className="font-heading text-center py-3 px-5 border border-line text-muted font-bold text-xs uppercase tracking-widest shrink-0">
                  ✓ Your current plan
                </span>
              ) : (
                <button
                  onClick={handleSwitchPlan}
                  disabled={portalLoading}
                  className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide py-3 px-6 hover:bg-[#dd2b0f] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 shrink-0"
                >
                  {portalLoading && <Spinner />}
                  {portalLoading ? "Redirecting…" : "Switch plan →"}
                </button>
              )
            ) : (
              <button
                onClick={() => handleChoosePlan(plan.id)}
                disabled={!mounted || checkingAuth || purchasing !== null}
                className="font-heading bg-terracotta text-white font-bold uppercase tracking-wide py-3 px-6 hover:bg-[#dd2b0f] disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2 shrink-0"
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
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-wide text-terracotta">
          Free vs Brew+
        </h2>
        <div className="border-2 border-ink overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-ink">
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
