import { RecipeCategory, InputRecipe } from '../../types/flavordb';
import { getAllIngredients, getIngredientById, getIngredientByName } from '../flavordb/data';
import { calculateJaccardSimilarity } from './similarity';

/**
 * Ensures a category lane has at least minCount (default 5) ingredient options.
 * Pads with relevant or candidate ingredients from the dataset if needed.
 */
export function ensureLaneMinimumOptions(category: RecipeCategory, minCount = 5): RecipeCategory {
  if (category.ingredientIds.length >= minCount) {
    return category;
  }

  const existingIds = new Set(category.ingredientIds);
  const newIds = [...category.ingredientIds];
  const allIngredients = getAllIngredients();

  const categoryKeywords = category.name.toLowerCase().split(/\s+/);
  const sampleIngredientCategories = newIds
    .map((id) => getIngredientById(id)?.category?.toLowerCase())
    .filter(Boolean) as string[];

  // 1. Match category
  for (const ing of allIngredients) {
    if (newIds.length >= minCount) break;
    if (existingIds.has(ing.id)) continue;

    const ingCategory = ing.category.toLowerCase();
    const isCategoryMatch =
      sampleIngredientCategories.some((sc) => ingCategory.includes(sc) || sc.includes(ingCategory)) ||
      categoryKeywords.some((kw) => kw.length > 3 && (ingCategory.includes(kw) || kw.includes(ingCategory)));

    if (isCategoryMatch) {
      existingIds.add(ing.id);
      newIds.push(ing.id);
    }
  }

  // 2. Fallback pad
  for (const ing of allIngredients) {
    if (newIds.length >= minCount) break;
    if (existingIds.has(ing.id)) continue;

    existingIds.add(ing.id);
    newIds.push(ing.id);
  }

  return {
    ...category,
    ingredientIds: newIds,
  };
}

/**
 * Analyzes a user-inputted recipe of ingredients and generates functional flavor categories + experimental wildcard categories
 */
export function generateCategoriesFromRecipe(
  recipeName: string,
  ingredientInputs: string[],
  description?: string
): InputRecipe {
  // 1. Normalize ingredient inputs to valid FlavorDB ingredients
  const normalizedIngredientsSet = new Set<string>();

  ingredientInputs.forEach((rawName) => {
    if (!rawName || !rawName.trim()) return;
    const ing = getIngredientByName(rawName.trim()) || getIngredientById(rawName.trim());
    if (ing) {
      normalizedIngredientsSet.add(ing.id);
    }
  });

  const recipeIngredientIds = Array.from(normalizedIngredientsSet);

  // Group recipe ingredients into functional categories by primary category
  const categoryMap = new Map<string, string[]>();

  recipeIngredientIds.forEach((id) => {
    const ing = getIngredientById(id);
    if (!ing) return;

    const catName = ing.category ? `${ing.category} Lane` : 'Aromatic Base Lane';
    if (!categoryMap.has(catName)) {
      categoryMap.set(catName, []);
    }
    categoryMap.get(catName)!.push(id);
  });

  // Convert map to RecipeCategory array
  let categories: RecipeCategory[] = Array.from(categoryMap.entries()).map(
    ([name, ingredientIds]) => ({
      name,
      ingredientIds,
      isExperimental: false,
    })
  );

  // If fewer than 3 categories, ensure baseline lanes exist
  if (categories.length < 3) {
    const defaultLanes = ['Herb & Botanical Lane', 'Citrus & Zest Lane', 'Spices & Warmth Lane'];
    defaultLanes.forEach((laneName) => {
      if (!categories.some((c) => c.name.toLowerCase().includes(laneName.split(' ')[0].toLowerCase()))) {
        const sampleIngs = getAllIngredients()
          .filter((i) => i.category.toLowerCase().includes(laneName.split(' ')[0].toLowerCase()))
          .map((i) => i.id)
          .slice(0, 5);
        if (sampleIngs.length > 0) {
          categories.push({
            name: laneName,
            ingredientIds: sampleIngs,
            isExperimental: false,
          });
        }
      }
    });
  }

  // Ensure every functional category lane has at least 5 ingredient options
  categories = categories.map((cat) => ensureLaneMinimumOptions(cat, 5));

  // 2. Discover Experimental Wildcard Categories
  // Collect all compounds present across recipe's ingredients
  const recipeCompounds = new Set<string>();
  recipeIngredientIds.forEach((id) => {
    const ing = getIngredientById(id);
    if (ing) {
      ing.compounds.forEach((cid) => recipeCompounds.add(cid));
    }
  });

  const recipeCompoundList = Array.from(recipeCompounds);

  // Scan non-recipe ingredients with high Jaccard overlap
  const experimentalCandidateIds: string[] = [];
  const allIngredients = getAllIngredients();

  allIngredients.forEach((ing) => {
    if (recipeIngredientIds.includes(ing.id)) return;

    const similarity = calculateJaccardSimilarity(recipeCompoundList, ing.compounds);
    if (similarity >= 0.10) {
      experimentalCandidateIds.push(ing.id);
    }
  });

  // Group candidates into wildcard categories
  const experimentalMap = new Map<string, string[]>();
  experimentalCandidateIds.forEach((id) => {
    const ing = getIngredientById(id);
    if (!ing) return;
    const wildCatName = `Wildcard ${ing.category}`;
    if (!experimentalMap.has(wildCatName)) {
      experimentalMap.set(wildCatName, []);
    }
    experimentalMap.get(wildCatName)!.push(id);
  });

  let experimentalCategories: RecipeCategory[] = Array.from(
    experimentalMap.entries()
  ).map(([name, ingredientIds]) => ({
    name,
    ingredientIds,
    isExperimental: true,
  }));

  // Ensure every wildcard category lane has at least 5 ingredient options
  experimentalCategories = experimentalCategories
    .map((cat) => ensureLaneMinimumOptions(cat, 5))
    .slice(0, 3); // Limit top 3 experimental

  return {
    id: `input_recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    name: recipeName || 'Custom Input Recipe',
    description: description?.trim() || undefined,
    ingredients: ingredientInputs.filter((i) => i && i.trim().length > 0),
    categories,
    experimentalCategories,
    createdAt: Date.now(),
  };
}
