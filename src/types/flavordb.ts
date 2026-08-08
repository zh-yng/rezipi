export interface Ingredient {
  id: string;
  name: string;
  category: string;
  compounds: string[]; // array of compound IDs
  description?: string;
  color?: string;
}

export interface Compound {
  id: string;
  name: string;
  flavor_profile: string[];
  casNumber?: string;
}

export interface FlavorDBDataset {
  ingredients: Ingredient[];
  compounds: Compound[];
}

export interface RecipeCategory {
  name: string;
  ingredientIds: string[];
  isExperimental?: boolean;
}

export interface InputRecipe {
  id: string;
  name: string;
  description?: string;
  ingredients: string[]; // List of ingredient names/ids in the user-inputted recipe
  categories: RecipeCategory[];
  experimentalCategories: RecipeCategory[];
  createdAt: number;
}

export interface RecipeSelection {
  [categoryName: string]: string; // categoryName -> ingredientId
}

export interface Recipe {
  id: string;
  title: string;
  description?: string;
  baseRecipeId: string;
  baseRecipeName: string;
  selections: RecipeSelection;
  synergyScore: number; // 0 to 100
  sharedCompounds: string[];
  computeLatencyMs?: number;
  createdAt: number;
  updatedAt: number;
  // Legacy support fallback properties
  tasteProfileId?: string;
  tasteProfileName?: string;
}

export interface SubstitutionResult {
  candidate: Ingredient;
  similarityScore: number; // 0 to 1
  sharedCompounds: Compound[];
  uniqueTargetCompounds: Compound[];
  uniqueCandidateCompounds: Compound[];
}

export interface BenchmarkMetrics {
  lastComputeTimeMs: number;
  totalCalculations: number;
}
