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

export interface SavedRecipe {
  id: string;
  input: CoffeeInput;
  recipe: GeneratedRecipe;
  rating: number;
  userNotes: string;
  createdAt: string;
}
