import Dexie, { Table } from 'dexie';
import { Recipe, InputRecipe } from '../../types/flavordb';

export class FlavorDatabase extends Dexie {
  inputRecipes!: Table<InputRecipe, string>;
  recipes!: Table<Recipe, string>;

  constructor() {
    super('FlavorDBStudioDB');
    this.version(2).stores({
      inputRecipes: 'id, name, createdAt',
      recipes: 'id, title, baseRecipeId, synergyScore, createdAt',
    });
  }
}

export const db = new FlavorDatabase();

// Pre-seeded default input recipes for instant exploration in Recipe Studio
export const DEFAULT_INPUT_RECIPES: InputRecipe[] = [
  // {
  //   id: 'input_nasi_lemak',
  //   name: 'Malaysian Nasi Lemak',
  //   description: 'Iconic Malaysian coconut rice dish cooked in coconut milk with lemongrass, served with sambal, anchovies, hard-boiled egg, and fresh cucumber slices.',
  //   ingredients: ['Rice', 'Coconut', 'Lemongrass', 'Red Chili', 'Anchovies', 'Cucumber'],
  //   categories: [
  //     {
  //       name: 'Coconut Rice Base',
  //       ingredientIds: ['ing_rice', 'ing_coconut', 'ing_lemongrass', 'ing_vanilla', 'ing_honey'],
  //     },
  //     {
  //       name: 'Sambal & Spice',
  //       ingredientIds: ['ing_chili', 'ing_garlic', 'ing_shallot', 'ing_ginger', 'ing_pepper'],
  //     },
  //     {
  //       name: 'Anchovies & Protein',
  //       ingredientIds: ['ing_anchovies', 'ing_pork', 'ing_chicken', 'ing_beef'],
  //     },
  //     {
  //       name: 'Fresh Accompaniments',
  //       ingredientIds: ['ing_cucumber', 'ing_lime', 'ing_mint', 'ing_coriander', 'ing_basil'],
  //     },
  //   ],
  //   experimentalCategories: [
  //     {
  //       name: 'Wildcard Tropical Twist',
  //       ingredientIds: ['ing_mango', 'ing_orange', 'ing_bergamot', 'ing_rose'],
  //       isExperimental: true,
  //     },
  //     {
  //       name: 'Wildcard Roastery Accent',
  //       ingredientIds: ['ing_coffee', 'ing_chocolate', 'ing_cinnamon', 'ing_star_anise'],
  //       isExperimental: true,
  //     },
  //   ],
  //   createdAt: Date.now() - 86400000 * 4,
  // },
  // {
  //   id: 'input_margherita_pizza',
  //   name: 'Neapolitan Margherita Pizza',
  //   description: 'Classic Italian wood-fired pizza featuring vine-ripened tomatoes, sweet basil, fresh garlic, mozzarella, and extra virgin olive oil.',
  //   ingredients: ['Ripe Tomato', 'Sweet Basil', 'Fresh Garlic', 'Parmesan Cheese', 'Cultured Butter'],
  //   categories: [
  //     {
  //       name: 'Tomato & Umami Core',
  //       ingredientIds: ['ing_tomato', 'ing_garlic', 'ing_shallot', 'ing_mushroom'],
  //     },
  //     {
  //       name: 'Fresh Botanical Herbs',
  //       ingredientIds: ['ing_basil', 'ing_oregano', 'ing_thyme', 'ing_rosemary', 'ing_sage'],
  //     },
  //     {
  //       name: 'Rich Creamy Dairy',
  //       ingredientIds: ['ing_parmesan_cheese', 'ing_butter', 'ing_cream'],
  //     },
  //   ],
  //   experimentalCategories: [
  //     {
  //       name: 'Wildcard Citrus & Zest',
  //       ingredientIds: ['ing_lemon', 'ing_orange', 'ing_lime'],
  //       isExperimental: true,
  //     },
  //     {
  //       name: 'Wildcard Earthy Accent',
  //       ingredientIds: ['ing_beetroot', 'ing_hazelnut', 'ing_coffee', 'ing_almond'],
  //       isExperimental: true,
  //     },
  //   ],
  //   createdAt: Date.now() - 86400000 * 3,
  // },
  // {
  //   id: 'input_tonkotsu_ramen',
  //   name: 'Japanese Tonkotsu Ramen',
  //   description: 'Deep savory pork bone broth infused with aromatic ginger, garlic, spring onions, star anise, and warm Ceylon cinnamon.',
  //   ingredients: ['Pork', 'Fresh Ginger', 'Fresh Garlic', 'Shallots', 'Star Anise', 'Ceylon Cinnamon'],
  //   categories: [
  //     {
  //       name: 'Rich Broth & Umami Meat',
  //       ingredientIds: ['ing_pork', 'ing_beef', 'ing_chicken', 'ing_lamb', 'ing_mallard_duck'],
  //     },
  //     {
  //       name: 'Allium & Root Aromatics',
  //       ingredientIds: ['ing_garlic', 'ing_ginger', 'ing_shallot', 'ing_leek'],
  //     },
  //     {
  //       name: 'Warm Warming Spices',
  //       ingredientIds: ['ing_star_anise', 'ing_cinnamon', 'ing_pepper', 'ing_clove', 'ing_cardamom'],
  //     },
  //   ],
  //   experimentalCategories: [
  //     {
  //       name: 'Wildcard Umami Fusion',
  //       ingredientIds: ['ing_mushroom', 'ing_coffee', 'ing_hazelnut', 'ing_chocolate'],
  //       isExperimental: true,
  //     },
  //   ],
  //   createdAt: Date.now() - 86400000 * 2,
  // },
];

let isInitializing: Promise<void> | null = null;

// Database initialization helper
export async function initDatabase() {
  if (isInitializing) {
    return isInitializing;
  }

  isInitializing = (async () => {
    try {
      // Clear out custom input recipes if necessary or populate DEFAULT_INPUT_RECIPES
      const defaultIds = new Set(DEFAULT_INPUT_RECIPES.map((p) => p.id));
      const allInputRecipes = await db.inputRecipes.toArray();
      const customIds = allInputRecipes
        .filter((p) => !defaultIds.has(p.id))
        .map((p) => p.id);

      if (customIds.length > 0) {
        await db.inputRecipes.bulkDelete(customIds);
      }

      await db.inputRecipes.bulkPut(DEFAULT_INPUT_RECIPES);

      const recipeCount = await db.recipes.count();
    } catch (err) {
      console.warn('Database initialization warning:', err);
    }
  })();

  return isInitializing;
}

// Data Access Objects (DAOs)
export async function getAllInputRecipes(): Promise<InputRecipe[]> {
  await initDatabase();
  return db.inputRecipes.orderBy('createdAt').reverse().toArray();
}

export async function saveInputRecipe(inputRecipe: InputRecipe): Promise<string> {
  await db.inputRecipes.put(inputRecipe);
  return inputRecipe.id;
}

export async function deleteInputRecipe(id: string): Promise<void> {
  await db.inputRecipes.delete(id);
}

export async function getAllRecipes(): Promise<Recipe[]> {
  await initDatabase();
  return db.recipes.orderBy('createdAt').reverse().toArray();
}

export async function saveRecipe(recipe: Recipe): Promise<string> {
  await db.recipes.put(recipe);
  return recipe.id;
}

export async function deleteRecipe(id: string): Promise<void> {
  await db.recipes.delete(id);
}

// Import / Export JSON utilities
export async function exportLibraryJSON(): Promise<string> {
  const inputRecipes = await db.inputRecipes.toArray();
  const recipes = await db.recipes.toArray();

  const exportData = {
    app: 'FlavorDB Recipe Design & Discovery Engine',
    version: '2.0',
    exportedAt: new Date().toISOString(),
    inputRecipes,
    recipes,
  };

  return JSON.stringify(exportData, null, 2);
}

export async function importLibraryJSON(jsonString: string): Promise<{
  importedInputRecipesCount: number;
  importedRecipesCount: number;
}> {
  const data = JSON.parse(jsonString);

  let inputRecipesCount = 0;
  let recipesCount = 0;

  if (Array.isArray(data.inputRecipes)) {
    await db.inputRecipes.bulkPut(data.inputRecipes);
    inputRecipesCount = data.inputRecipes.length;
  } else if (Array.isArray(data.tasteProfiles)) {
    // Migration fallback for legacy exports
    const converted = data.tasteProfiles.map((p: any) => ({
      id: p.id,
      name: p.name,
      ingredients: p.referenceRecipes ? p.referenceRecipes.flat() : [],
      categories: p.categories || [],
      experimentalCategories: p.experimentalCategories || [],
      createdAt: p.createdAt || Date.now(),
    }));
    await db.inputRecipes.bulkPut(converted);
    inputRecipesCount = converted.length;
  }

  if (Array.isArray(data.recipes)) {
    const sanitizedRecipes = data.recipes.map((r: any) => ({
      ...r,
      baseRecipeId: r.baseRecipeId || r.tasteProfileId || 'input_mediterranean',
      baseRecipeName: r.baseRecipeName || r.tasteProfileName || 'Custom Input Recipe',
    }));
    await db.recipes.bulkPut(sanitizedRecipes);
    recipesCount = data.recipes.length;
  }

  return { importedInputRecipesCount: inputRecipesCount, importedRecipesCount: recipesCount };
}
