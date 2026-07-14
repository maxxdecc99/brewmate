import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Verify admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { targetUserId, tier, expiresAt } = await req.json();

  if (!targetUserId || (tier !== "free" && tier !== "brew_plus")) {
    return NextResponse.json({ error: "Missing/invalid fields" }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data, error } = await service.rpc("admin_grant_subscription", {
    target_user_id: targetUserId,
    new_tier: tier,
    new_expires_at: tier === "brew_plus" ? expiresAt ?? null : null,
  });

  if (error) {
    console.error("admin_grant_subscription error:", error);
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }

  return NextResponse.json({ profile: data });
}
