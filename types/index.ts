export type BrewMethod =
  | "V60"
  | "Kalita"
  | "Chemex"
  | "AeroPress"
  | "French Press"
  | "Espresso";

export type Process =
  | "washed"
  | "natural"
  | "honey"
  | "anaerobic"
  | "decaf"
  | "unknown";

export type RoastLevel =
  | "light"
  | "medium"
  | "dark"
  | "filter roast"
  | "espresso roast"
  | "unknown";

export type BurrType = "flat" | "conical" | "unknown";

export type UserPreference =
  | "balanced"
  | "sweeter"
  | "brighter"
  | "stronger"
  | "lower acidity";

export interface CoffeeInput {
  coffeeName: string;
  roaster: string;
  origin: string;
  variety?: string;
  process: Process;
  roastLevel: RoastLevel;
  tastingNotes: string;
  brewMethod: BrewMethod;
  dose: number;
  grinder?: string;
  burrType?: BurrType;
  preference: UserPreference;
}

export interface RecipeStep {
  title: string;
  description: string;
  time: string;
}

export interface GeneratedRecipe {
  coffeeName: string;
  brewMethod: string;
  dose: number;
  waterAmount: number;
  ratio: string;
  grindMicrons: number;
  temperatureC: number;
  temperatureF: number;
  totalTime: string;
  steps: RecipeStep[];
  adjustmentTips: string[];
  notes: string;
  // Espresso-specific
  yield?: number;
  pressure?: string;
  preInfusion?: string;
  shotTime?: string;
}

export interface RecipeRow {
  id: string;
  user_id: string;
  source: "ai" | "manual";
  title: string | null;
  brew_method: string | null;
  bean: string | null;
  recipe_text: string | null;
  ratio: string | null;
  grind_setting: string | null;
  water_temp: string | null;
  bloom: string | null;
  brew_steps: string | null;
  total_time: string | null;
  input_data: CoffeeInput | null;
  recipe_data: GeneratedRecipe | null;
  rating: number;
  user_notes: string;
  created_at: string;
}

export interface ManualRecipe {
  id: string;
  title: string;
  brewMethod?: string;
  bean?: string;
  recipe: string;
  rating: number;
  userNotes: string;
  createdAt: string;
}

export interface SavedRecipe {
  id: string;
  input: CoffeeInput;
  recipe: GeneratedRecipe;
  rating: number;
  userNotes: string;
  createdAt: string;
}

export type SubscriptionTier = "free" | "brew_plus";

export interface Profile {
  id: string;
  email: string;
  is_admin: boolean;
  subscription_tier: SubscriptionTier;
  subscription_expires_at: string | null;
  logs_created_count: number;
  is_brew_plus_active: boolean;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_cancel_at_period_end: boolean;
  subscription_plan: "monthly" | "semiannual" | "annual" | null;
  created_at: string;
}
