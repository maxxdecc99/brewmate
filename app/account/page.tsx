"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CREDIT_PACKAGES } from "@/lib/creditPackages";

interface Transaction {
  id: string;
  type: "purchase" | "used" | "bonus" | "admin_adjustment";
  amount: number;
  balance_after: number;
  description: string;
  created_at: string;
}

interface Profile {
  email: string;
  credit_balance: number;
  created_at: string;
}

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  purchase: { label: "Purchase", color: "text-green-700 bg-green-50 border-green-300" },
  used: { label: "Used", color: "text-stone-600 bg-stone-50 border-stone-300" },
  bonus: { label: "Bonus", color: "text-amber-700 bg-amber-50 border-amber-300" },
  admin_adjustment: { label: "Admin", color: "text-blue-700 bg-blue-50 border-blue-300" },
};

function AccountContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");

  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [purchasing, setPurchasing] = useState<number | null>(null);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const [{ data: prof }, { data: tx }] = await Promise.all([
        supabase.from("profiles").select("email, credit_balance, created_at").eq("id", user.id).single(),
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      ]);

      setProfile(prof);
      setTransactions(tx ?? []);
    }
    load();
  }, []);

  async function handlePurchase(credits: number) {
    setPurchasing(credits);
    try {
      const res = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credits }),
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
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2 border-b-2 border-stone-900 pb-6">
        <h1 className="text-5xl font-black tracking-tighter">Account</h1>
        {profile && (
          <p className="text-stone-500 font-medium">{profile.email}</p>
        )}
      </div>

      {/* Status banners */}
      {success && (
        <div className="border-2 border-green-400 bg-green-50 px-5 py-4 font-bold text-green-800">
          ✓ Payment successful — credits will be added within a few seconds.
        </div>
      )}
      {cancelled && (
        <div className="border-2 border-stone-300 bg-stone-50 px-5 py-4 font-medium text-stone-600">
          Payment cancelled. Your credits were not charged.
        </div>
      )}

      {/* Credit balance */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">Credits</h2>
        <div className="border-2 border-stone-900 bg-white p-6 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400 block mb-1">
              Current Balance
            </span>
            <span className="text-5xl font-black text-stone-900">
              {profile?.credit_balance ?? "—"}
            </span>
          </div>
          <span className="text-4xl">☕</span>
        </div>
      </section>

      {/* Buy credits */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">Buy Credits</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {CREDIT_PACKAGES.map((pkg) => (
            <div
              key={pkg.credits}
              className={`border-2 border-stone-900 bg-white p-5 flex flex-col gap-3 relative ${
                pkg.popular ? "ring-2 ring-amber-400 ring-offset-1" : ""
              }`}
            >
              {pkg.popular && (
                <span className="absolute -top-3 left-4 text-xs font-black uppercase tracking-widest bg-amber-400 text-stone-900 px-2 py-0.5">
                  Popular
                </span>
              )}
              <div className="flex flex-col gap-0.5">
                <span className="text-2xl font-black">{pkg.credits} credits</span>
                <span className="text-stone-500 text-sm font-medium">
                  {(pkg.priceCents / pkg.credits / 100).toFixed(2)} € / credit
                </span>
              </div>
              <span className="text-3xl font-black text-amber-600">{pkg.priceLabel}</span>
              <button
                onClick={() => handlePurchase(pkg.credits)}
                disabled={purchasing !== null}
                className="bg-stone-900 text-[#FAF7F2] font-bold py-3 border-2 border-stone-900 hover:bg-amber-600 hover:border-amber-600 disabled:opacity-50 transition-colors"
              >
                {purchasing === pkg.credits ? "Redirecting…" : "Buy now →"}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Transaction history */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-stone-400 font-medium">No transactions yet.</p>
        ) : (
          <div className="border-2 border-stone-900 bg-white divide-y-2 divide-stone-100">
            {transactions.map((tx) => {
              const meta = TYPE_LABELS[tx.type] ?? { label: tx.type, color: "text-stone-500 bg-stone-50 border-stone-200" };
              return (
                <div key={tx.id} className="px-5 py-4 flex items-center justify-between gap-4">
                  <div className="flex flex-col gap-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-xs font-black uppercase tracking-widest px-2 py-0.5 border ${meta.color}`}>
                        {meta.label}
                      </span>
                      <span className="text-sm text-stone-600 truncate">{tx.description}</span>
                    </div>
                    <span className="text-xs text-stone-400">
                      {new Date(tx.created_at).toLocaleDateString("en-GB", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <div className="flex flex-col items-end gap-0.5 shrink-0">
                    <span className={`font-black text-lg ${tx.amount > 0 ? "text-green-600" : "text-stone-900"}`}>
                      {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                    </span>
                    <span className="text-xs text-stone-400">→ {tx.balance_after} left</span>
                  </div>
                </div>
              );
            })}
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
