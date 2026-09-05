import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Plain admin client — no cookies, no user session, always bypasses RLS.
// The waitlist table has no public policies, so all writes go through here.
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function GET() {
  const supabase = getAdminClient();
  const { count } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ count: count ?? 0 });
}

export async function POST(req: NextRequest) {
  let email: unknown;
  try {
    ({ email } = await req.json());
  } catch {
    return NextResponse.json({ error: "That email doesn't look right" }, { status: 400 });
  }

  if (typeof email !== "string" || !EMAIL_RE.test(email.trim())) {
    return NextResponse.json({ error: "That email doesn't look right" }, { status: 400 });
  }

  const normalized = email.trim().toLowerCase();
  const supabase = getAdminClient();

  const { error: insertError } = await supabase
    .from("waitlist")
    .insert({ email: normalized });

  if (insertError && insertError.code !== "23505") {
    console.error("waitlist insert failed:", insertError);
    return NextResponse.json({ error: "Something went wrong. Try again." }, { status: 500 });
  }

  const { count } = await supabase
    .from("waitlist")
    .select("id", { count: "exact", head: true });

  return NextResponse.json({ position: count ?? 0 });
}
