-- GetYourBrew Database Schema
-- Run this in the Supabase SQL editor

-- Profiles table (extends auth.users)
-- credit_balance is deprecated (kept for historical/audit purposes only,
-- no longer used for gating) in favor of the subscription columns below.
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  credit_balance INTEGER NOT NULL DEFAULT 3,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('free', 'brew_plus')),
  subscription_expires_at TIMESTAMPTZ NULL,
  logs_created_count INTEGER NOT NULL DEFAULT 0,
  stripe_customer_id TEXT NULL UNIQUE,
  stripe_subscription_id TEXT NULL,
  subscription_cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  subscription_plan TEXT NULL CHECK (subscription_plan IN ('monthly', 'semiannual', 'annual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table (every credit change logged)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'used', 'bonus', 'admin_adjustment', 'refund')),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  stripe_session_id TEXT,
  price_cents INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS: users can only see their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

-- RLS: users can only see their own transactions
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile on signup. New subscription columns take their
-- defaults ('free', NULL, 0, NULL, NULL) -- no bonus transaction is
-- written anymore since credits are deprecated.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Atomic credit deduction (prevents race conditions)
CREATE OR REPLACE FUNCTION deduct_credit(user_uuid UUID, description_text TEXT DEFAULT 'Recipe generated')
RETURNS INTEGER AS $$
DECLARE
  updated_balance INTEGER;
BEGIN
  UPDATE profiles
  SET credit_balance = credit_balance - 1
  WHERE id = user_uuid AND credit_balance > 0
  RETURNING credit_balance INTO updated_balance;

  IF updated_balance IS NULL THEN
    RAISE EXCEPTION 'insufficient_credits';
  END IF;

  INSERT INTO transactions (user_id, type, amount, balance_after, description)
  VALUES (user_uuid, 'used', -1, updated_balance, description_text);

  RETURN updated_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add credits after Stripe payment (idempotent via stripe_session_id)
CREATE OR REPLACE FUNCTION add_purchased_credits(
  user_uuid UUID,
  credit_amount INTEGER,
  stripe_session TEXT,
  description_text TEXT,
  price_cents_amount INTEGER DEFAULT 0
)
RETURNS INTEGER AS $$
DECLARE
  updated_balance INTEGER;
BEGIN
  -- Idempotency: skip if this session was already processed
  IF EXISTS (SELECT 1 FROM transactions WHERE stripe_session_id = stripe_session) THEN
    SELECT credit_balance INTO updated_balance FROM profiles WHERE id = user_uuid;
    RETURN updated_balance;
  END IF;

  UPDATE profiles
  SET credit_balance = credit_balance + credit_amount
  WHERE id = user_uuid
  RETURNING credit_balance INTO updated_balance;

  INSERT INTO transactions (user_id, type, amount, balance_after, description, stripe_session_id, price_cents)
  VALUES (user_uuid, 'purchase', credit_amount, updated_balance, description_text, stripe_session, price_cents_amount);

  RETURN updated_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Admin: adjust credits (add or remove) -- deprecated, kept for historical
-- compatibility only. Use admin_grant_subscription for the subscription model.
CREATE OR REPLACE FUNCTION admin_adjust_credits(
  target_user_id UUID,
  credit_amount INTEGER,
  description_text TEXT
)
RETURNS INTEGER AS $$
DECLARE
  updated_balance INTEGER;
BEGIN
  UPDATE profiles
  SET credit_balance = GREATEST(0, credit_balance + credit_amount)
  WHERE id = target_user_id
  RETURNING credit_balance INTO updated_balance;

  INSERT INTO transactions (user_id, type, amount, balance_after, description)
  VALUES (target_user_id, 'admin_adjustment', credit_amount, updated_balance, description_text);

  RETURN updated_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Subscription model (Brew+)
-- ============================================================

-- Entitlement check exposed as a PostgREST computed column: a function
-- whose sole argument is a table's row type is auto-exposed as a virtual
-- selectable column (e.g. `.select("subscription_tier, is_brew_plus_active")`).
-- Pure computation, no table lookups inside -- unlike every other function
-- in this file, this one does NOT need SECURITY DEFINER, but does need
-- EXECUTE granted explicitly.
CREATE OR REPLACE FUNCTION is_brew_plus_active(p profiles)
RETURNS BOOLEAN LANGUAGE sql STABLE AS $$
  SELECT p.subscription_tier = 'brew_plus'
     AND (p.subscription_expires_at IS NULL OR p.subscription_expires_at > NOW());
$$;
GRANT EXECUTE ON FUNCTION is_brew_plus_active(profiles) TO authenticated, anon;

-- Log-limit enforcement. MUST be SECURITY DEFINER: profiles has no UPDATE
-- policy for authenticated/anon, so a non-definer trigger would silently
-- update 0 rows under RLS instead of enforcing anything -- a silent
-- bypass of the entire feature. Single atomic UPDATE (mirrors the
-- deduct_credit pattern above) avoids any TOCTOU race between concurrent
-- inserts from the same user (e.g. two tabs).
CREATE OR REPLACE FUNCTION enforce_log_limit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE profiles
  SET logs_created_count = logs_created_count + 1
  WHERE id = NEW.user_id
    AND (is_brew_plus_active(profiles) OR logs_created_count < 10)
  RETURNING logs_created_count INTO new_count;

  IF new_count IS NULL THEN
    RAISE EXCEPTION 'log_limit_reached';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_log_limit_trigger ON recipes;
CREATE TRIGGER enforce_log_limit_trigger
  BEFORE INSERT ON recipes
  FOR EACH ROW EXECUTE FUNCTION enforce_log_limit();

-- Admin: grant/extend/revoke a user's subscription. new_tier='free' always
-- clears expiry. new_tier='brew_plus' with new_expires_at=NULL grants a
-- permanent (never-expiring) subscription.
CREATE OR REPLACE FUNCTION admin_grant_subscription(
  target_user_id UUID, new_tier TEXT, new_expires_at TIMESTAMPTZ DEFAULT NULL
) RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE updated_row profiles;
BEGIN
  IF new_tier NOT IN ('free', 'brew_plus') THEN RAISE EXCEPTION 'invalid_tier'; END IF;
  UPDATE profiles
  SET subscription_tier = new_tier,
      subscription_expires_at = CASE WHEN new_tier = 'free' THEN NULL ELSE new_expires_at END
  WHERE id = target_user_id
  RETURNING * INTO updated_row;
  IF updated_row IS NULL THEN RAISE EXCEPTION 'user_not_found'; END IF;
  RETURN updated_row;
END;
$$;
