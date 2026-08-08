import { Compound, Ingredient } from '../../types/flavordb';
import { getCompoundById, getIngredientById } from '../flavordb/data';

export interface SynergyCalculationResult {
  score: number; // 0 to 100
  sharedCompoundIds: string[];
  sharedCompounds: Compound[];
  topVolatiles: { compound: Compound; count: number }[];
  computeTimeMs: number;
}

/**
 * Calculates real-time recipe synergy score using pair-wise aggregate Jaccard overlap
 */
export function calculateRecipeSynergy(
  selectedIngredientIds: string[]
): SynergyCalculationResult {
  const startTime = performance.now();

  const validIds = selectedIngredientIds.filter(Boolean);
  if (validIds.length < 2) {
    return {
      score: validIds.length === 1 ? 25 : 0,
      sharedCompoundIds: [],
      sharedCompounds: [],
      topVolatiles: [],
      computeTimeMs: Math.max(0.1, Math.round((performance.now() - startTime) * 100) / 100),
    };
  }

  const ingredients: Ingredient[] = validIds
    .map((id) => getIngredientById(id))
    .filter((ing): ing is Ingredient => Boolean(ing));

  let totalIntersectionCount = 0;
  let totalUnionCount = 0;

  const compoundOccurrences = new Map<string, number>();

  // Count compound occurrences across all ingredients
  ingredients.forEach((ing) => {
    ing.compounds.forEach((cid) => {
      compoundOccurrences.set(cid, (compoundOccurrences.get(cid) || 0) + 1);
    });
  });

  // Calculate pair-wise sum(|C_i ∩ C_j|) and sum(|C_i ∪ C_j|)
  for (let i = 0; i < ingredients.length; i++) {
    for (let j = i + 1; j < ingredients.length; j++) {
      const setA = new Set(ingredients[i].compounds);
      const setB = new Set(ingredients[j].compounds);

      let intersection = 0;
      setA.forEach((cid) => {
        if (setB.has(cid)) {
          intersection++;
        }
      });

      const union = setA.size + setB.size - intersection;

      totalIntersectionCount += intersection;
      totalUnionCount += union;
    }
  }

  const rawRatio = totalUnionCount > 0 ? totalIntersectionCount / totalUnionCount : 0;
  
  // Scale and boost slightly so rich culinary pairings hit intuitive 60-95% ranges
  const score = Math.min(100, Math.round(rawRatio * 100 * 2.8));

  // Find compounds that appear in 2 or more selected ingredients
  const sharedCompoundIds: string[] = [];
  const topVolatileCounts: { compound: Compound; count: number }[] = [];

  compoundOccurrences.forEach((count, cid) => {
    if (count >= 2) {
      sharedCompoundIds.push(cid);
      const comp = getCompoundById(cid);
      if (comp) {
        topVolatileCounts.push({ compound: comp, count });
      }
    }
  });

  // Sort top shared volatiles by frequency descending
  topVolatileCounts.sort((a, b) => b.count - a.count);

  const sharedCompounds = sharedCompoundIds
    .map((cid) => getCompoundById(cid))
    .filter((c): c is Compound => Boolean(c));

  const endTime = performance.now();
  const computeTimeMs = Math.round((endTime - startTime) * 100) / 100;

  return {
    score,
    sharedCompoundIds,
    sharedCompounds,
    topVolatiles: topVolatileCounts,
    computeTimeMs: Math.max(0.1, computeTimeMs),
  };
}
