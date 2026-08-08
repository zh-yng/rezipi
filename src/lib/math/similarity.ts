import { Compound, Ingredient } from '../../types/flavordb';
import { getCompoundById } from '../flavordb/data';

/**
 * Calculates Jaccard Similarity between two sets of compounds
 * J(A, B) = |A ∩ B| / |A ∪ B|
 */
export function calculateJaccardSimilarity(
  compoundsA: string[],
  compoundsB: string[]
): number {
  if (!compoundsA.length || !compoundsB.length) return 0;

  const setA = new Set(compoundsA);
  const setB = new Set(compoundsB);

  let intersectionCount = 0;
  for (const item of setA) {
    if (setB.has(item)) {
      intersectionCount++;
    }
  }

  const unionSize = setA.size + setB.size - intersectionCount;
  if (unionSize === 0) return 0;

  return intersectionCount / unionSize;
}

/**
 * Retrieves full Compound objects for shared vs unique compound sets
 */
export function getCompoundBreakdown(
  ingredientA: Ingredient,
  ingredientB: Ingredient
): {
  shared: Compound[];
  uniqueA: Compound[];
  uniqueB: Compound[];
} {
  const setA = new Set(ingredientA.compounds);
  const setB = new Set(ingredientB.compounds);

  const sharedIds: string[] = [];
  const uniqueAIds: string[] = [];
  const uniqueBIds: string[] = [];

  setA.forEach((cid) => {
    if (setB.has(cid)) {
      sharedIds.push(cid);
    } else {
      uniqueAIds.push(cid);
    }
  });

  setB.forEach((cid) => {
    if (!setA.has(cid)) {
      uniqueBIds.push(cid);
    }
  });

  const shared = sharedIds
    .map((id) => getCompoundById(id))
    .filter((c): c is Compound => Boolean(c));
  const uniqueA = uniqueAIds
    .map((id) => getCompoundById(id))
    .filter((c): c is Compound => Boolean(c));
  const uniqueB = uniqueBIds
    .map((id) => getCompoundById(id))
    .filter((c): c is Compound => Boolean(c));

  return { shared, uniqueA, uniqueB };
}
