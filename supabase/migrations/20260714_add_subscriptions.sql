-- Adds subscription columns to profiles. credit_balance and transactions
-- are left untouched (deprecated in-app, not dropped).

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'brew_plus')),
  ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS logs_created_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT NULL,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT NULL;

ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_stripe_customer_id_key;
ALTER TABLE profiles ADD CONSTRAINT profiles_stripe_customer_id_key UNIQUE (stripe_customer_id);

-- One-time backfill: existing users already have logs. Without this, a
-- user with 40 existing recipes would read "0 of 10 used" the moment
-- their 6-month grandfathered Brew+ lapses -- effectively granting a
-- second free allowance on top of what they already have.
UPDATE profiles p
SET logs_created_count = sub.cnt
FROM (SELECT user_id, COUNT(*) AS cnt FROM recipes GROUP BY user_id) sub
WHERE p.id = sub.user_id;

-- Legacy grant: every existing user gets 6 months of Brew+, no Stripe
-- subscription behind it (stripe_subscription_id stays NULL).
UPDATE profiles
SET subscription_tier = 'brew_plus',
    subscription_expires_at = NOW() + INTERVAL '6 months'
WHERE subscription_tier = 'free';

-- Computed column: PostgREST exposes a function whose sole arg is a
-- table's row type as a virtual selectable column. Pure computation, no
-- table lookups inside -- unlike every other function in this schema,
-- this one does NOT need SECURITY DEFINER, but does need EXECUTE granted
-- explicitly.
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
-- existing deduct_credit pattern) avoids any TOCTOU race between
-- concurrent inserts from the same user (e.g. two tabs).
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

-- Admin RPC: grant/extend/revoke. new_tier='free' always clears expiry.
-- new_tier='brew_plus' with new_expires_at=NULL grants a permanent (never
-- expiring) subscription.
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

-- Stop writing the deprecated welcome-bonus transaction row on signup.
-- Profile insert unchanged in spirit; new columns take their defaults.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, COALESCE(NEW.email, ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;
