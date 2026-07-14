-- Tracks whether an active Brew+ subscription is set to cancel at the end
-- of its current period (vs. auto-renewing). Needed to show "Renews on X"
-- vs "Expires on X" on the account/settings pages. Synced from Stripe's
-- `cancel_at_period_end` field by the webhook handler, same pattern as
-- subscription_tier/subscription_expires_at.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false;
