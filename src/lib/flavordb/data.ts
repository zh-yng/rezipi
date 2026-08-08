import flavorDataRaw from '../../data/flavordb.json';
import { Compound, FlavorDBDataset, Ingredient } from '../../types/flavordb';

export const FLAVOR_DB: FlavorDBDataset = flavorDataRaw as FlavorDBDataset;

// Fast lookup maps
const INGREDIENT_MAP = new Map<string, Ingredient>();
const INGREDIENT_NAME_MAP = new Map<string, Ingredient>();
const COMPOUND_MAP = new Map<string, Compound>();

FLAVOR_DB.ingredients.forEach((ing) => {
  INGREDIENT_MAP.set(ing.id, ing);
  INGREDIENT_NAME_MAP.set(ing.name.toLowerCase(), ing);
});

FLAVOR_DB.compounds.forEach((comp) => {
  COMPOUND_MAP.set(comp.id, comp);
});

export function getIngredientById(id: string): Ingredient | undefined {
  return INGREDIENT_MAP.get(id);
}

export function getIngredientByName(name: string): Ingredient | undefined {
  if (!name) return undefined;
  const normalized = name.trim().toLowerCase();
  
  // Exact match
  if (INGREDIENT_NAME_MAP.has(normalized)) {
    return INGREDIENT_NAME_MAP.get(normalized);
  }

  // Partial substring match
  return FLAVOR_DB.ingredients.find(
    (ing) =>
      ing.name.toLowerCase().includes(normalized) ||
      normalized.includes(ing.name.toLowerCase())
  );
}

export function getCompoundById(id: string): Compound | undefined {
  return COMPOUND_MAP.get(id);
}

export function getAllIngredients(): Ingredient[] {
  return FLAVOR_DB.ingredients;
}

export function formatCompoundName(nameOrId: string): string {
  if (!nameOrId) return '';
  return nameOrId.replace(/^c_/, '').replace(/_/g, ' ');
}

export function getAllCompounds(): Compound[] {
  return FLAVOR_DB.compounds;
}

export function searchIngredients(query: string, limit = 10): Ingredient[] {
  if (!query.trim()) return FLAVOR_DB.ingredients.slice(0, limit);
  const q = query.toLowerCase().trim();

  return FLAVOR_DB.ingredients
    .filter(
      (ing) =>
        ing.name.toLowerCase().includes(q) ||
        ing.category.toLowerCase().includes(q) ||
        ing.compounds.some((cid) => {
          const comp = getCompoundById(cid);
          return comp && comp.name.toLowerCase().includes(q);
        })
    )
    .slice(0, limit);
}
