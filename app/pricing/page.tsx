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
      <div className="flex flex-col gap-2 text-center border-b-2 border-stone-900 pb-8">
        <h1 className="text-5xl font-black tracking-tighter">Brew+</h1>
        <p className="text-stone-500 font-medium">
          Unlimited AI recipes and unlimited logs — cancel anytime.
        </p>
      </div>

      {/* Already subscribed */}
      {mounted && hasRealSubscription && (
        <div className="border-2 border-amber-400 bg-amber-50 px-5 py-4 flex items-center justify-between flex-wrap gap-3">
          <p className="font-bold text-stone-900">
            ☕ You&apos;re already on Brew+ — manage your subscription in Settings.
          </p>
          <Link
            href="/settings"
            className="bg-stone-900 text-[#FAF7F2] font-bold px-6 py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 transition-colors whitespace-nowrap"
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
            className={`border-2 border-stone-900 bg-white p-6 flex flex-col gap-4 relative ${
              plan.badge ? "ring-2 ring-amber-400 ring-offset-1" : ""
            }`}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-4 text-xs font-black uppercase tracking-widest bg-amber-400 text-stone-900 px-2 py-0.5">
                {plan.badge}
              </span>
            )}
            {mounted && hasRealSubscription && currentPlan === plan.id && (
              <span className="absolute -top-3 right-4 text-xs font-black uppercase tracking-widest bg-stone-900 text-[#FAF7F2] px-2 py-0.5">
                Current Plan
              </span>
            )}
            <div className="flex flex-col gap-0.5">
              <span className="text-lg font-black text-stone-500 uppercase tracking-wide">
                {plan.label}
              </span>
              <span className="text-4xl font-black text-stone-900">
                {plan.priceLabel}
                <span className="text-base font-bold text-stone-400"> {plan.interval}</span>
              </span>
              {plan.billedAs && (
                <span className="text-sm text-stone-500 font-medium">{plan.billedAs}</span>
              )}
            </div>
            {mounted && hasRealSubscription ? (
              currentPlan === plan.id ? (
                <span className="text-center py-3 border-2 border-stone-200 text-stone-400 font-bold text-sm uppercase tracking-widest">
                  ✓ Your current plan
                </span>
              ) : (
                <button
                  onClick={handleSwitchPlan}
                  disabled={portalLoading}
                  className="bg-stone-900 text-[#FAF7F2] font-bold py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
                >
                  {portalLoading && <Spinner />}
                  {portalLoading ? "Redirecting…" : "Switch plan →"}
                </button>
              )
            ) : (
              <button
                onClick={() => handleChoosePlan(plan.id)}
                disabled={!mounted || checkingAuth || purchasing !== null}
                className="bg-stone-900 text-[#FAF7F2] font-bold py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 transition-colors inline-flex items-center justify-center gap-2"
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
        <h2 className="font-black text-xl uppercase tracking-wide text-center">
          Free vs Brew+
        </h2>
        <div className="border-2 border-stone-900 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-stone-900 bg-stone-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-stone-500">
                  Feature
                </th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-stone-500">
                  Free
                </th>
                <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-amber-600">
                  Brew+
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {FEATURES.map((f) => (
                <tr key={f.label}>
                  <td className="px-4 py-3 font-bold">{f.label}</td>
                  <td className="px-4 py-3 text-stone-500">{f.free}</td>
                  <td className="px-4 py-3 font-bold text-amber-700">{f.brewPlus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
