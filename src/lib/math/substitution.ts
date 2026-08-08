import { Ingredient, SubstitutionResult } from '../../types/flavordb';
import { getAllIngredients } from '../flavordb/data';
import { calculateJaccardSimilarity, getCompoundBreakdown } from './similarity';

/**
 * Ranks all available ingredients in FlavorDB strictly by chemical compound overlap
 * with a target ingredient. NO culinary category or classification bias applied.
 */
export function getPureChemicalSubstitutes(
  targetIngredient: Ingredient,
  limit = 10
): SubstitutionResult[] {
  const allIngredients = getAllIngredients();

  const results: SubstitutionResult[] = [];

  for (const candidate of allIngredients) {
    if (candidate.id === targetIngredient.id) continue;

    const similarityScore = calculateJaccardSimilarity(
      targetIngredient.compounds,
      candidate.compounds
    );

    if (similarityScore > 0) {
      const breakdown = getCompoundBreakdown(targetIngredient, candidate);

      results.push({
        candidate,
        similarityScore: Math.round(similarityScore * 100) / 100,
        sharedCompounds: breakdown.shared,
        uniqueTargetCompounds: breakdown.uniqueA,
        uniqueCandidateCompounds: breakdown.uniqueB,
      });
    }
  }

  // Sort strictly by chemical similarity score descending
  results.sort((a, b) => b.similarityScore - a.similarityScore);

  return results.slice(0, limit);
}
