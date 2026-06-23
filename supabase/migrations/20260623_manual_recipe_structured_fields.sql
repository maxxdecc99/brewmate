-- Add structured fields to manual recipes.
-- title is made nullable so no field is required on a manual recipe entry.
ALTER TABLE recipes
  ALTER COLUMN title DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS ratio TEXT,
  ADD COLUMN IF NOT EXISTS grind_setting TEXT,
  ADD COLUMN IF NOT EXISTS water_temp TEXT,
  ADD COLUMN IF NOT EXISTS bloom TEXT,
  ADD COLUMN IF NOT EXISTS brew_steps TEXT,
  ADD COLUMN IF NOT EXISTS total_time TEXT;
