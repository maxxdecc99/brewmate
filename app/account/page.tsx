"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { getRecipes } from "@/lib/recipes";
import Spinner from "@/components/ui/Spinner";
import LogoutButton from "@/components/ui/LogoutButton";

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
  const [brewCount, setBrewCount] = useState(0);
  const [pageLoading, setPageLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setPageLoading(false); return; }

      const [{ data: prof }, recipes] = await Promise.all([
        supabase
          .from("profiles")
          .select(
            "email, subscription_tier, subscription_expires_at, logs_created_count, is_brew_plus_active, stripe_customer_id, created_at"
          )
          .eq("id", user.id)
          .single(),
        getRecipes(),
      ]);

      setProfile(prof);
      setBrewCount(recipes.length);
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

  const logsLeft = profile?.is_brew_plus_active
    ? "∞"
    : String(Math.max(0, FREE_LOG_LIMIT - (profile?.logs_created_count ?? 0)));

  return (
    <div className="flex flex-col gap-0 -mx-4 sm:mx-0">
      <div className="px-4 sm:px-0 pb-6">
        {profile && (
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">
            {profile.email}
          </span>
        )}
        <h1 className="mt-3 font-heading text-7xl sm:text-8xl font-extrabold uppercase tracking-tight leading-[0.86] text-ink">
          You
        </h1>
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

      {pageLoading ? (
        <div className="px-4 sm:px-0 py-8 flex items-center gap-3 text-muted font-medium">
          <Spinner />
          <span>Loading…</span>
        </div>
      ) : (
        <>
          {/* Current plan band */}
          {profile?.is_brew_plus_active ? (
            <div className="bg-terracotta text-white px-4 sm:px-8 py-7 flex flex-col gap-1">
              <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-white/70">
                Current Plan
              </span>
              <span className="mt-2 font-heading text-4xl font-extrabold uppercase tracking-tight">Brew+</span>
              <span className="mt-2 text-sm text-white/85 font-medium">
                {profile.subscription_expires_at
                  ? `Renews ${new Date(profile.subscription_expires_at).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}`
                  : "Active — no expiry"}
              </span>
              {profile.stripe_customer_id && (
                <button
                  onClick={handleManageSubscription}
                  disabled={portalLoading}
                  className="mt-5 border border-white/80 px-4 py-4 flex items-center justify-between font-heading text-xs font-bold uppercase tracking-[.2em] hover:bg-white/10 disabled:opacity-50 transition-colors"
                >
                  {portalLoading ? "Redirecting…" : "Manage subscription"}
                  <span>→</span>
                </button>
              )}
            </div>
          ) : (
            <div className="bg-ink text-cream px-4 sm:px-8 py-7 flex flex-col gap-1">
              <span className="font-heading text-[10px] font-bold uppercase tracking-[.2em] text-[#8D8880]">
                Current Plan
              </span>
              <span className="mt-2 font-heading text-4xl font-extrabold uppercase tracking-tight">Free</span>
              <p className="mt-2 text-sm text-[#A9A49C] font-medium">
                {profile?.logs_created_count ?? 0} of {FREE_LOG_LIMIT} free logs used.
              </p>
              <Link
                href="/pricing"
                className="mt-5 bg-terracotta text-white px-4 py-4 flex items-center justify-between font-heading text-xs font-bold uppercase tracking-[.2em] hover:bg-[#dd2b0f] transition-colors"
              >
                Upgrade to Brew+
                <span>→</span>
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-2 border-b border-line">
            <div className="px-4 sm:px-8 py-6 border-r border-line">
              <div className="font-heading text-4xl font-extrabold tracking-tight text-ink">{brewCount}</div>
              <div className="mt-3 font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">Brews Logged</div>
            </div>
            <div className="px-4 sm:px-8 py-6">
              <div className="font-heading text-4xl font-extrabold tracking-tight text-ink">{logsLeft}</div>
              <div className="mt-3 font-heading text-[10px] font-bold uppercase tracking-[.2em] text-muted">Logs Left</div>
            </div>
          </div>

          {/* Quick actions */}
          <Link
            href="/settings"
            className="px-4 sm:px-8 py-5 flex items-center justify-between border-b border-line hover:bg-ink/[.03] transition-colors"
          >
            <span className="font-heading font-bold text-sm tracking-wide">Settings</span>
            <span className="text-muted">→</span>
          </Link>
          <div className="px-4 sm:px-8 py-5 flex items-center justify-between">
            <LogoutButton />
          </div>
        </>
      )}
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
