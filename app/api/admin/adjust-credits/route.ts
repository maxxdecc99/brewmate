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

  const { targetUserId, amount, description } = await req.json();

  if (!targetUserId || typeof amount !== "number" || !description) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const service = await createServiceClient();
  const { data, error } = await service.rpc("admin_adjust_credits", {
    target_user_id: targetUserId,
    credit_amount: amount,
    description_text: description,
  });

  if (error) {
    console.error("admin_adjust_credits error:", error);
    return NextResponse.json({ error: "Failed to adjust credits" }, { status: 500 });
  }

  return NextResponse.json({ newBalance: data });
}
