-- Durable record of the combined ToS/Privacy/14-day-withdrawal-waiver
-- consent shown on /pricing and UpgradePrompt before a Brew+ checkout
-- session is created. Stored as its own append-only table (not a column
-- on `profiles`) because consent is an event that can recur — a user may
-- cancel and resubscribe later, and each acceptance should keep its own
-- timestamp and exact wording rather than overwriting the last one.
--
-- `version` + `consent_text` are both stored (see lib/consent.ts) so we
-- never need a separate table of historical checkbox copy to prove what a
-- given user actually agreed to at the time.

CREATE TABLE IF NOT EXISTS checkout_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL CHECK (plan IN ('monthly', 'semiannual', 'annual')),
  version TEXT NOT NULL,
  consent_text TEXT NOT NULL,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE checkout_consents ENABLE ROW LEVEL SECURITY;

-- Users can see their own consent history (e.g. for support requests);
-- writes only happen via the service-role client in
-- create-subscription-checkout, so there's no INSERT/UPDATE/DELETE policy
-- for anon/authenticated — same deny-all-except-service-role pattern used
-- for `waitlist`.
DROP POLICY IF EXISTS "Users can view own consents" ON checkout_consents;
CREATE POLICY "Users can view own consents"
  ON checkout_consents FOR SELECT
  USING (auth.uid() = user_id);
