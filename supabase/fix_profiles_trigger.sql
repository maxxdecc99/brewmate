-- ============================================================
-- FIX: profiles not created on signup
-- Run this in the Supabase SQL editor (Dashboard → SQL Editor)
-- ============================================================

-- ── STEP 1: Drop & recreate handle_new_user without silent swallowing ────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, credit_balance, is_admin)
  VALUES (NEW.id, COALESCE(NEW.email, ''), 3, false)
  ON CONFLICT (id) DO NOTHING;

  -- Only log the welcome bonus if the profile insert actually happened
  IF FOUND THEN
    INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
    VALUES (NEW.id, 'bonus', 3, 3, 'Welcome bonus — 3 free credits');
  END IF;

  RETURN NEW;
END;
$$;

-- ── STEP 2: Recreate the trigger on auth.users ────────────────────────────────

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── STEP 3: Backfill existing auth.users with no profile row ─────────────────

-- Insert missing profile rows
INSERT INTO public.profiles (id, email, credit_balance, is_admin)
SELECT
  au.id,
  COALESCE(au.email, ''),
  3,
  false
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Log a welcome bonus transaction for every newly backfilled profile
-- (skip users who already had a bonus transaction, just in case)
INSERT INTO public.transactions (user_id, type, amount, balance_after, description)
SELECT
  p.id,
  'bonus',
  3,
  3,
  'Welcome bonus — 3 free credits (backfilled)'
FROM public.profiles p
LEFT JOIN public.transactions t
  ON t.user_id = p.id AND t.type = 'bonus'
WHERE t.id IS NULL;

-- ── STEP 4: Verify ────────────────────────────────────────────────────────────

-- Should show 0 rows if the backfill succeeded
SELECT au.id, au.email
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;
