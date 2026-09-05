-- CRITICAL SECURITY FIX (pre-launch audit): several SECURITY DEFINER
-- functions were callable directly via PostgREST RPC by the anon AND
-- authenticated roles, with no internal caller check. Supabase's own
-- advisor flags this as anon/authenticated_security_definer_function_
-- executable. Concretely, any signed-in user could have called e.g.
--   supabase.rpc('admin_grant_subscription', { target_user_id: <self>,
--     new_tier: 'brew_plus', new_expires_at: null })
-- directly from the browser and granted themselves permanent Brew+ for
-- free, completely bypassing the is_admin check in
-- app/api/admin/adjust-subscription and the Stripe billing flow. The same
-- pattern applied to add_purchased_credits (mint arbitrary credits with a
-- made-up stripe_session string) and admin_adjust_credits/deduct_credit
-- (read/drain any other user's credit_balance by passing their user_id).
--
-- Root cause: Postgres/Supabase grants EXECUTE on new functions to PUBLIC
-- by default. SECURITY DEFINER only changes whose privileges the function
-- runs WITH (bypassing RLS) — it does nothing to restrict WHO can call it.
--
-- Fix: revoke the default PUBLIC execute grant on every one of these
-- functions. admin_grant_subscription is the only one actually called by
-- app code (via the service-role client, from an already is_admin-gated
-- API route), so it alone keeps EXECUTE for service_role. The two trigger
-- functions (handle_new_user, enforce_log_limit) don't need EXECUTE
-- granted to anyone — Postgres invokes triggers internally regardless of
-- the firing role's function privileges.

REVOKE EXECUTE ON FUNCTION admin_grant_subscription(UUID, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_grant_subscription(UUID, TEXT, TIMESTAMPTZ) TO service_role;

REVOKE EXECUTE ON FUNCTION admin_adjust_credits(UUID, INTEGER, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION admin_adjust_credits(UUID, INTEGER, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION deduct_credit(UUID, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION deduct_credit(UUID, TEXT) TO service_role;

REVOKE EXECUTE ON FUNCTION add_purchased_credits(UUID, INTEGER, TEXT, TEXT, INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION add_purchased_credits(UUID, INTEGER, TEXT, TEXT, INTEGER) TO service_role;

REVOKE EXECUTE ON FUNCTION enforce_log_limit() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION handle_new_user() FROM PUBLIC, anon, authenticated;

-- Secondary hardening (Supabase advisor: function_search_path_mutable).
-- Pins search_path on every SECURITY DEFINER / callable function so a
-- malicious search_path can't shadow an unqualified identifier inside
-- them. Defense in depth on top of the EXECUTE revokes above.
ALTER FUNCTION deduct_credit(UUID, TEXT) SET search_path = public;
ALTER FUNCTION add_purchased_credits(UUID, INTEGER, TEXT, TEXT, INTEGER) SET search_path = public;
ALTER FUNCTION admin_adjust_credits(UUID, INTEGER, TEXT) SET search_path = public;
ALTER FUNCTION is_brew_plus_active(profiles) SET search_path = public;
ALTER FUNCTION enforce_log_limit() SET search_path = public;
ALTER FUNCTION admin_grant_subscription(UUID, TEXT, TIMESTAMPTZ) SET search_path = public;
