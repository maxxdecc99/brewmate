-- BrewMate Database Schema
-- Run this in the Supabase SQL editor

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  credit_balance INTEGER NOT NULL DEFAULT 3,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Transactions table (every credit change logged)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'used', 'bonus', 'admin_adjustment')),
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
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);

-- RLS: users can only see their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT USING (auth.uid() = user_id);

-- Auto-create profile + bonus credits on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, credit_balance)
  VALUES (NEW.id, NEW.email, 3);

  INSERT INTO transactions (user_id, type, amount, balance_after, description)
  VALUES (NEW.id, 'bonus', 3, 3, 'Welcome bonus — 3 free credits');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

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

-- Admin: adjust credits (add or remove)
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
