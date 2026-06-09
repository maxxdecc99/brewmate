import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function CreditBadge() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("credit_balance")
    .eq("id", user.id)
    .single();

  const balance = profile?.credit_balance ?? 0;

  return (
    <Link
      href="/account"
      className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-black border-2 transition-colors ${
        balance === 0
          ? "border-red-400 text-red-600 bg-red-50 hover:bg-red-100"
          : "border-amber-400 text-amber-700 bg-amber-50 hover:bg-amber-100"
      }`}
    >
      ☕ {balance} {balance === 1 ? "credit" : "credits"}
    </Link>
  );
}
