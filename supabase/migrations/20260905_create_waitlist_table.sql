-- Pre-launch waitlist signups collected from the logged-out homepage.
-- Writes go through app/api/waitlist using the service-role client, so
-- RLS is enabled with no policies (deny-all for anon/authenticated).

CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
