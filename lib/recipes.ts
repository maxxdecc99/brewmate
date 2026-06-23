import { createClient } from "@/lib/supabase/client";
import { RecipeRow, CoffeeInput, GeneratedRecipe } from "@/types";

export async function getRecipes(): Promise<RecipeRow[]> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as RecipeRow[];
}

export async function getRecipeById(id: string): Promise<RecipeRow | null> {
  const supabase = createClient();
  const { data } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .single();
  return (data as RecipeRow) ?? null;
}

export async function saveAIRecipe(
  recipe: GeneratedRecipe,
  input: CoffeeInput,
  rating: number,
  userNotes: string
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").insert({
    source: "ai",
    title: recipe.coffeeName,
    brew_method: recipe.brewMethod,
    input_data: input,
    recipe_data: recipe,
    rating,
    user_notes: userNotes,
  });
  if (error) throw error;
}

export async function saveManualRecipe(params: {
  title?: string;
  brewMethod?: string;
  bean?: string;
  ratio?: string;
  grindSetting?: string;
  waterTemp?: string;
  bloom?: string;
  brewSteps?: string;
  totalTime?: string;
  userNotes?: string;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").insert({
    source: "manual",
    title: params.title || null,
    brew_method: params.brewMethod || null,
    bean: params.bean || null,
    ratio: params.ratio || null,
    grind_setting: params.grindSetting || null,
    water_temp: params.waterTemp || null,
    bloom: params.bloom || null,
    brew_steps: params.brewSteps || null,
    total_time: params.totalTime || null,
    user_notes: params.userNotes || "",
    rating: 0,
  });
  if (error) throw error;
}

export async function updateRecipe(
  id: string,
  updates: {
    rating?: number;
    user_notes?: string;
    title?: string | null;
    brew_method?: string | null;
    bean?: string | null;
    ratio?: string | null;
    grind_setting?: string | null;
    water_temp?: string | null;
    bloom?: string | null;
    brew_steps?: string | null;
    total_time?: string | null;
  }
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").update(updates).eq("id", id);
  if (error) throw error;
}

export async function deleteRecipe(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("recipes").delete().eq("id", id);
  if (error) throw error;
}
