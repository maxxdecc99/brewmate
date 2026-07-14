-- Tracks which Brew+ plan (monthly/semiannual/annual) a real Stripe
-- subscriber is on, synced from the subscription's price id by the
-- webhook. NULL for free/complimentary users (no real Stripe
-- subscription) or if a subscription's price falls outside the 3 known
-- plans. Needed so the pricing page can show a "Current plan" badge
-- without the client ever needing to know raw Stripe price ids.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_plan TEXT NULL
    CHECK (subscription_plan IN ('monthly', 'semiannual', 'annual'));
