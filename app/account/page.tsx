"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import Spinner from "@/components/ui/Spinner";

interface Profile {
  email: string;
  subscription_tier: "free" | "brew_plus";
  subscription_expires_at: string | null;
  logs_created_count: number;
  is_brew_plus_active: boolean;
  stripe_customer_id: string | null;
  created_at: string;
}

const FREE_LOG_LIMIT = 10;

function AccountContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPageLoading(false); return; }

      const { data: prof } = await supabase
        .from("profiles")
        .select(
          "email, subscription_tier, subscription_expires_at, logs_created_count, is_brew_plus_active, stripe_customer_id, created_at"
        )
        .eq("id", user.id)
        .single();

      setProfile(prof);
      setPageLoading(false);
    }
    load();
  }, []);

  async function handleManageSubscription() {
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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 border-b-2 border-ink pb-6">
        <h1 className="font-heading text-5xl font-extrabold uppercase tracking-tight text-ink">Account</h1>
        {profile && (
          <p className="text-muted font-medium">{profile.email}</p>
        )}
      </div>

      {/* Status banners */}
      {success && (
        <div className="border-2 border-ink px-5 py-4 font-bold text-espresso">
          ✓ Payment successful — your Brew+ subscription will activate within a few seconds.
        </div>
      )}
      {cancelled && (
        <div className="border border-line bg-surface-soft px-5 py-4 font-medium text-espresso/70">
          Checkout cancelled. You were not charged.
        </div>
      )}

      {/* Your Plan */}
      <section className="flex flex-col gap-4">
        <h2 className="font-heading font-extrabold text-xl uppercase tracking-wide text-terracotta">Your Plan</h2>
        {pageLoading ? (
          <div className="border border-line bg-surface p-6 flex items-center gap-3 text-muted font-medium">
            <Spinner />
            <span>Loading…</span>
          </div>
        ) : profile?.is_brew_plus_active ? (
          <div className="border border-line bg-surface p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
                  Current Plan
                </span>
                <span className="font-heading inline-flex items-center gap-2 text-3xl font-extrabold uppercase text-terracotta">
                  ☕ Brew+
                </span>
              </div>
              <span className="text-sm font-medium text-muted">
                {profile.subscription_expires_at
                  ? `Active until ${new Date(profile.subscription_expires_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "long", year: "numeric",
                    })}`
                  : "Active — no expiry"}
              </span>
            </div>
            {profile.stripe_customer_id && (
              <button
                onClick={handleManageSubscription}
                disabled={portalLoading}
                className="font-heading self-start bg-terracotta text-white font-bold uppercase tracking-wide px-6 py-3 hover:bg-[#dd2b0f] disabled:opacity-50 transition-colors inline-flex items-center gap-2"
              >
                {portalLoading && <Spinner />}
                {portalLoading ? "Redirecting…" : "Manage subscription →"}
              </button>
            )}
          </div>
        ) : (
          <div className="border border-line bg-surface p-6 flex flex-col gap-4">
            <div>
              <span className="font-heading text-xs font-bold uppercase tracking-widest text-muted block mb-1">
                Current Plan
              </span>
              <span className="font-heading text-3xl font-extrabold uppercase text-espresso">Free</span>
            </div>
            <p className="text-espresso/70 font-medium">
              {profile?.logs_created_count ?? 0} of {FREE_LOG_LIMIT} free logs used.
              Brew+ gives you unlimited logs and unlimited AI recipes.
            </p>
            <Link
              href="/pricing"
              className="font-heading self-start bg-terracotta text-white font-bold uppercase tracking-wide px-6 py-3 hover:bg-[#dd2b0f] transition-colors"
            >
              Upgrade to Brew+ →
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountContent />
    </Suspense>
  );
}
