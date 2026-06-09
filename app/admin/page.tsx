import { redirect } from "next/navigation";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import RecipeCard from "@/components/ui/RecipeCard";
import CreditAdjuster from "./CreditAdjuster";

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

  const [{ data: users }, { data: transactions }] = await Promise.all([
    service
      .from("profiles")
      .select("id, email, credit_balance, is_admin, created_at")
      .order("created_at", { ascending: false }),
    service
      .from("transactions")
      .select("id, user_id, type, amount, balance_after, description, price_cents, created_at, profiles(email)")
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const totalUsers = users?.length ?? 0;
  const totalCreditsSold =
    transactions
      ?.filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + t.amount, 0) ?? 0;
  const totalRevenueCents =
    transactions
      ?.filter((t) => t.type === "purchase")
      .reduce((sum, t) => sum + (t.price_cents ?? 0), 0) ?? 0;

  return (
    <div className="flex flex-col gap-10">
      <div className="border-b-2 border-stone-900 pb-6">
        <h1 className="text-5xl font-black tracking-tighter">Admin</h1>
      </div>

      {/* Stats */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <RecipeCard label="Total Users" value={totalUsers} />
          <RecipeCard label="Credits Sold" value={totalCreditsSold} />
          <RecipeCard
            label="Total Revenue"
            value={`€${(totalRevenueCents / 100).toFixed(2)}`}
          />
        </div>
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
                {["Email", "Credits", "Admin", "Registered"].map((h) => (
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
                  <td className="px-4 py-3 font-black">{u.credit_balance}</td>
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

      {/* Credit adjuster */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">
          Adjust Credits
        </h2>
        <CreditAdjuster
          users={
            users?.map((u) => ({
              id: u.id,
              email: u.email,
              credit_balance: u.credit_balance,
            })) ?? []
          }
        />
      </section>

      {/* Transactions */}
      <section className="flex flex-col gap-4">
        <h2 className="font-black text-xl uppercase tracking-wide">
          Recent Transactions
        </h2>
        <div className="border-2 border-stone-900 bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b-2 border-stone-900 bg-stone-50">
              <tr>
                {["User", "Type", "Amount", "Balance after", "Description", "Date"].map((h) => (
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
              {transactions?.map((tx) => (
                <tr key={tx.id} className="hover:bg-stone-50">
                  <td className="px-4 py-3 text-stone-600">
                    {(tx.profiles as unknown as { email: string } | null)?.email ?? "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-bold uppercase tracking-widest">
                      {tx.type}
                    </span>
                  </td>
                  <td className={`px-4 py-3 font-black ${tx.amount > 0 ? "text-green-600" : "text-stone-900"}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                  </td>
                  <td className="px-4 py-3 text-stone-500">{tx.balance_after}</td>
                  <td className="px-4 py-3 text-stone-600 max-w-xs truncate">
                    {tx.description}
                  </td>
                  <td className="px-4 py-3 text-stone-400 whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString("en-GB", {
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
    </div>
  );
}
