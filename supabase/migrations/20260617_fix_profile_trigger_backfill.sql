-- Migration: ensure handle_new_user trigger is live + backfill missing profiles
-- Safe to run multiple times (idempotent)

-- 1. Recreate the trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  BEGIN
    INSERT INTO public.profiles (id, email, credit_balance)
    VALUES (NEW.id, COALESCE(NEW.email, ''), 3)
    ON CONFLICT (id) DO NOTHING;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  BEGIN
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (NEW.id, 'bonus', 3, 3, 'Welcome bonus — 3 free credits');
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recreate the trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 3. Backfill: create profiles for existing auth users that have no profile row
INSERT INTO public.profiles (id, email, credit_balance, is_admin, created_at)
SELECT
  u.id,
  COALESCE(u.email, ''),
  3,
  false,
  u.created_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- 4. Backfill: add welcome transactions for those same users (if not already present)
INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
SELECT
  p.id,
  'bonus',
  3,
  3,
  'Welcome bonus — 3 free credits (backfilled)'
FROM public.profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM public.transactions t
  WHERE t.user_id = p.id AND t.type = 'bonus'
);
