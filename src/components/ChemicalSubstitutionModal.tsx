import React from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, FlaskConical, RefreshCw, CheckCircle2, ChevronRight, Zap } from 'lucide-react';
import { Ingredient, SubstitutionResult } from '../types/flavordb';
import { getPureChemicalSubstitutes } from '../lib/math/substitution';
import { formatCompoundName } from '../lib/flavordb/data';

interface ChemicalSubstitutionModalProps {
  targetIngredient: Ingredient | null;
  categoryName?: string;
  onClose: () => void;
  onSwapIngredient: (newIngredient: Ingredient) => void;
}

export const ChemicalSubstitutionModal: React.FC<ChemicalSubstitutionModalProps> = ({
  targetIngredient,
  categoryName,
  onClose,
  onSwapIngredient,
}) => {
  if (!targetIngredient) return null;

  const substitutes: SubstitutionResult[] = getPureChemicalSubstitutes(
    targetIngredient,
    10
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-stone-900/60 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="bg-white border border-[#E2D6C5] rounded-2xl w-full max-w-3xl max-h-[92vh] sm:max-h-[90vh] flex flex-col shadow-2xl text-stone-900 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="p-3.5 sm:p-5 bg-[#F2EAE0] border-b border-[#E0D3C1] flex items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center space-x-2.5 sm:space-x-3 min-w-0">
              <div className="p-2 sm:p-2.5 bg-[#9E4624]/15 text-[#9E4624] rounded-xl ring-1 ring-[#9E4624]/30 shrink-0 mt-0.5 sm:mt-0">
                <FlaskConical className="w-4 h-4 sm:w-6 sm:h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h3 className="font-handwriting font-bold text-lg sm:text-2xl text-[#9E4624] leading-tight">
                    Pure Chemical Substitution Engine
                  </h3>
                  <span className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-[#9E4624]/10 text-[#9E4624] border border-[#9E4624]/25 rounded-full shrink-0">
                    100% Molecular Overlap
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 leading-snug">
                  Category Bias Disabled • Ranked purely by volatile Jaccard similarity score
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 text-stone-400 hover:text-[#9E4624] hover:bg-[#EADECB] rounded-lg transition-colors shrink-0"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Target Ingredient Card Info */}
          <div className="px-3.5 py-2.5 sm:px-6 sm:py-4 bg-[#FAF6F0] border-b border-[#E2D6C5] flex flex-row items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-stone-500 block">
                Selected Target In {categoryName || 'Recipe Lane'}
              </span>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-3 mt-0.5">
                <span className="font-handwriting font-bold text-lg sm:text-2xl text-[#9E4624] truncate">
                  {targetIngredient.name}
                </span>
                <span className="px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs bg-[#EADECB] text-stone-800 rounded-md font-semibold shrink-0">
                  {targetIngredient.category}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-stone-600 mt-0.5 line-clamp-1 sm:line-clamp-2">{targetIngredient.description}</p>
            </div>

            <div className="text-right text-[11px] sm:text-xs text-stone-600 shrink-0">
              <span className="font-mono text-[#9E4624] font-bold text-xs sm:text-sm">
                {targetIngredient.compounds.length}
              </span>{' '}
              Volatiles
            </div>
          </div>

          {/* Substitutes Candidates List */}
          <div className="p-3.5 sm:p-6 overflow-y-auto space-y-3 sm:space-y-4 flex-1 custom-scrollbar">
            <h4 className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-stone-600 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <span>Top Candidate Substitutes</span>
              <span className="text-[10px] sm:text-[11px] text-stone-500 font-normal">
                Zero culinary bias • Strict chemical match
              </span>
            </h4>

            {substitutes.length === 0 ? (
              <div className="text-center py-8 text-stone-500 text-sm font-medium">
                No chemical substitutes found exceeding volatile match threshold.
              </div>
            ) : (
              substitutes.map((sub, idx) => {
                const matchPercent = Math.round(sub.similarityScore * 100);

                return (
                  <motion.div
                    key={sub.candidate.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.03 }}
                    className="bg-[#FAF6F0] border border-[#E0D3C1] hover:border-[#9E4624]/50 rounded-xl p-3 sm:p-4 transition-all hover:bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-xs"
                  >
                    <div className="space-y-1.5 sm:space-y-2 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="text-[11px] sm:text-xs font-extrabold font-mono text-stone-400">
                          #{idx + 1}
                        </span>
                        <span className="font-handwriting font-bold text-stone-900 text-base sm:text-xl">
                          {sub.candidate.name}
                        </span>
                        <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-[#EADECB] text-stone-800 rounded font-medium">
                          {sub.candidate.category}
                        </span>
                        {sub.candidate.category !== targetIngredient.category && (
                          <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-300 rounded font-bold flex items-center space-x-1">
                            <Zap className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-amber-700" />
                            <span>Cross-Category Wildcard</span>
                          </span>
                        )}
                      </div>

                      {/* Shared Volatiles Badges */}
                      <div className="flex flex-wrap gap-1 sm:gap-1.5 pt-0.5">
                        {sub.sharedCompounds.map((comp) => (
                          <span
                            key={comp.id}
                            className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold bg-[#9E4624]/10 text-[#9E4624] border border-[#9E4624]/25 rounded"
                            title={`Shared Volatile: ${formatCompoundName(comp.name)}`}
                          >
                            ✓ {formatCompoundName(comp.name)}
                          </span>
                        ))}

                        {sub.uniqueCandidateCompounds.slice(0, 3).map((comp) => (
                          <span
                            key={comp.id}
                            className="px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-medium bg-[#EADECB] text-stone-600 rounded"
                            title={`Unique Candidate Volatile: ${formatCompoundName(comp.name)}`}
                          >
                            + {formatCompoundName(comp.name)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Match Percentage & Swap Action */}
                    <div className="flex items-center justify-between sm:justify-end space-x-3 sm:space-x-4 border-t sm:border-t-0 border-[#E0D3C1] pt-2 sm:pt-0">
                      <div className="text-left sm:text-right">
                        <div className="text-base sm:text-lg font-black font-mono text-[#9E4624]">
                          {matchPercent}%
                        </div>
                        <div className="text-[9px] sm:text-[10px] uppercase text-stone-500 font-bold">
                          Chemical Match
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          onSwapIngredient(sub.candidate);
                          onClose();
                        }}
                        className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#9E4624] hover:bg-[#85381A] text-amber-50 font-bold text-xs rounded-xl shadow-xs flex items-center space-x-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Swap</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
