-- Unified recipes table for both AI-generated and manual recipes.
-- source = 'ai'     → input_data (CoffeeInput) + recipe_data (GeneratedRecipe) are populated
-- source = 'manual' → recipe_text is populated; input_data/recipe_data are NULL

CREATE TABLE IF NOT EXISTS recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('ai', 'manual')),
  title TEXT NOT NULL,
  brew_method TEXT,
  bean TEXT,
  recipe_text TEXT,
  input_data JSONB,
  recipe_data JSONB,
  rating INTEGER NOT NULL DEFAULT 0,
  user_notes TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own recipes" ON recipes;
CREATE POLICY "Users can manage own recipes"
  ON recipes FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
