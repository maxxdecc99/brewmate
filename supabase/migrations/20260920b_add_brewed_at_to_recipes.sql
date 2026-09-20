-- Marks when a brew was actually completed via the brew-timer "Finish"
-- step, distinct from `created_at` (set when the AI recipe was generated
-- and auto-saved, before the user has brewed or rated it).
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS brewed_at TIMESTAMPTZ NULL;
