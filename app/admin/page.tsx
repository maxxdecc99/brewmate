import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/ui/RecipeCard";
import SubscriptionAdjuster from "./SubscriptionAdjuster";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: selfProfile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!selfProfile?.is_admin) redirect("/");

  const service = await createServiceClient();

  const { data: users } = await service
    .from("profiles")
    .select(
      "id, email, is_admin, subscription_tier, subscription_expires_at, logs_created_count, is_brew_plus_active, created_at"
    )
    .order("created_at", { ascending: false });

  const totalUsers = users?.length ?? 0;
  const totalBrewPlus = users?.filter((u) => u.is_brew_plus_active).length ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <div className="border-b-2 border-stone-900 pb-6">
        <h1 className="text-5xl font-black tracking-tighter">Admin</h1>
      </div>

      {/* Stats */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <RecipeCard label="Total Users" value={totalUsers} />
          <RecipeCard label="Active Brew+" value={totalBrewPlus} />
        </div>
        <p className="text-sm text-stone-500 font-medium">
          For live subscription revenue, MRR, and churn, see the{" "}
          <a
            href="https://dashboard.stripe.com/test/subscriptions"
            target="_blank"
            rel="noreferrer"
            className="underline hover:text-amber-700"
          >
            Stripe Dashboard
          </a>
          .
        </p>
      </section>

      {/* Users table */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">
          Users ({totalUsers})
        </h2>
        <div className="border-2 border-stone-900 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-stone-900 bg-stone-50">
              <tr>
                {["Email", "Plan", "Expires", "Logs", "Admin", "Registered"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest text-stone-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {users?.map((u) => (
                <tr key={u.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 font-medium">{u.email}</td>
                  <td className="px-4 py-3">
                    {u.is_brew_plus_active ? (
                      <span className="text-xs font-black uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5">
                        Brew+
                      </span>
                    ) : (
                      <span className="text-xs font-black uppercase tracking-widest text-stone-500 bg-stone-50 border border-stone-300 px-2 py-0.5">
                        Free
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {u.subscription_expires_at
                      ? new Date(u.subscription_expires_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3 font-black">{u.logs_created_count}</td>
                  <td className="px-4 py-3">
                    {u.is_admin ? (
                      <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-300 px-2 py-0.5">
                        Admin
                      </span>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-stone-500">
                    {new Date(u.created_at).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Subscription adjuster */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">
          Adjust Subscription
        </h2>
        <SubscriptionAdjuster
          users={
            users?.map((u) => ({
              id: u.id,
              email: u.email,
              subscription_tier: u.subscription_tier,
            })) ?? []
          }
        />
      </section>
    </div>
  );
}
