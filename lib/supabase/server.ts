import "server-only";
import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try {
            toSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component — cookies can't be set here
          }
        },
      },
    }
  );
}

// Service role client: bypasses RLS, for webhooks and admin ops.
//
// Deliberately a plain supabase-js client with no cookies. A cookie-backed
// (@supabase/ssr) client picks up the signed-in user's session and sends
// *their* access token instead of the service role key, so RLS still
// applies — which silently broke the checkout_consents insert and the
// profiles updates for every logged-in request.
//
// This bypasses RLS completely: callers must do their own auth/admin
// checks with createClient() *before* using it.
export async function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
