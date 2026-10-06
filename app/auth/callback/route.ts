import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

// Only allow same-site relative paths, so `next` can't redirect off-site
// (e.g. "//evil.com" or "@evil.com").
function safeNext(next: string | null, fallback: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : fallback;
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = safeNext(
    searchParams.get("next"),
    type === "recovery" ? "/auth/reset-password" : "/generate"
  );

  let reason: string;

  if (tokenHash && type) {
    // Email-template links ({{ .TokenHash }}): verified server-side, so they
    // work in any browser/device — no PKCE code-verifier cookie needed.
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("auth/callback verifyOtp failed:", { type, error_code: error.code, status: error.status, message: error.message });
    reason = error.code ?? "verify_failed";
  } else if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("auth/callback exchangeCodeForSession failed:", { error_code: error.code, status: error.status, message: error.message });
    reason = error.code ?? "exchange_failed";
  } else {
    // Supabase reports verify failures (expired/used link) via error params.
    const errorCode = searchParams.get("error_code") ?? searchParams.get("error");
    console.error("auth/callback called without code or token_hash:", {
      error: searchParams.get("error"),
      error_code: searchParams.get("error_code"),
      error_description: searchParams.get("error_description"),
    });
    reason = errorCode ?? "missing_code";
  }

  const url = new URL("/auth/login", origin);
  url.searchParams.set("error", "auth_error");
  url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}
