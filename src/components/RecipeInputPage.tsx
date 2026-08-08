import React, { useState, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, Plus, Trash2, CheckCircle2, ArrowRight, Wand2, BookOpen, Utensils } from 'lucide-react';
import { InputRecipe } from '../types/flavordb';
import { searchIngredients } from '../lib/flavordb/data';
import { generateCategoriesFromRecipe } from '../lib/math/clustering';
import { saveInputRecipe } from '../lib/db';

interface RecipeInputPageProps {
  onRecipeInputSubmitted: (inputRecipe: InputRecipe) => void;
}

const PRESET_RECIPES = [
  {
    name: 'Malaysian Nasi Lemak',
    description: 'Iconic Malaysian coconut rice dish cooked in coconut milk with lemongrass, served with sambal, anchovies, hard-boiled egg, and fresh cucumber slices.',
    ingredients: ['Rice', 'Coconut', 'Lemongrass', 'Red Chili', 'Anchovies', 'Cucumber'],
  },
  {
    name: 'Neapolitan Margherita Pizza',
    description: 'Wood-fired Italian pizza with vine tomatoes, sweet basil, garlic, and fresh mozzarella.',
    ingredients: ['Ripe Tomato', 'Sweet Basil', 'Fresh Garlic', 'Parmesan Cheese', 'Cultured Butter'],
  },
  {
    name: 'Japanese Tonkotsu Ramen',
    description: 'Rich pork bone broth infused with ginger, garlic, spring onions, star anise, and cinnamon.',
    ingredients: ['Pork', 'Fresh Ginger', 'Fresh Garlic', 'Shallots', 'Star Anise', 'Ceylon Cinnamon'],
  },
  {
    name: 'Mexican Tacos Al Pastor',
    description: 'Marinated roast pork tacos with pineapple zest, lime, cilantro, and garlic chili spices.',
    ingredients: ['Pork', 'Lime Zest', 'Fresh Garlic', 'Ceylon Cinnamon', 'Wildflower Honey', 'Orange Peel'],
  },
];

export const RecipeInputPage: React.FC<RecipeInputPageProps> = ({
  onRecipeInputSubmitted,
}) => {
  const [recipeName, setRecipeName] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [ingredients, setIngredients] = useState<string[]>(['', '', '']);

  // Stable slot IDs so AnimatePresence only animates genuine adds/removes,
  // not content changes (which previously caused flicker on preset switch).
  const nextSlotId = useRef(3);
  const slotIds = useRef<number[]>([0, 1, 2]);

  const [activeSuggestionIdx, setActiveSuggestionIdx] = useState<number | null>(null);
  const [createdInputRecipe, setCreatedInputRecipe] = useState<InputRecipe | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generatedPaneRef = useRef<HTMLDivElement | null>(null);

  const handleIngredientChange = (index: number, value: string) => {
    const updated = [...ingredients];
    updated[index] = value;
    setIngredients(updated);
  };

  const addIngredientField = () => {
    slotIds.current = [...slotIds.current, nextSlotId.current++];
    setIngredients((prev) => [...prev, '']);
  };

  const removeIngredientField = (index: number) => {
    if (ingredients.length <= 3) return;
    slotIds.current = slotIds.current.filter((_, i) => i !== index);
    setIngredients((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSelectPreset = (preset: (typeof PRESET_RECIPES)[0]) => {
    const newIngredients = [...preset.ingredients];
    const currentLen = slotIds.current.length;
    const newLen = newIngredients.length;

    if (newLen > currentLen) {
      // Add new stable IDs for extra slots
      const extras = Array.from({ length: newLen - currentLen }, () => nextSlotId.current++);
      slotIds.current = [...slotIds.current, ...extras];
    } else if (newLen < currentLen) {
      // Trim slot IDs to match shorter list
      slotIds.current = slotIds.current.slice(0, newLen);
    }
    // Existing slot IDs are reused → no flicker for those positions

    setRecipeName(preset.name);
    setRecipeDescription(preset.description);
    setIngredients(newIngredients);
  };

  const handleAnalyzeRecipe = async () => {
    const validIngredients = ingredients.filter((ing) => ing.trim().length > 0);
    if (validIngredients.length === 0) return;

    setIsGenerating(true);
    try {
      const generated = generateCategoriesFromRecipe(recipeName, validIngredients, recipeDescription);
      await saveInputRecipe(generated);
      setCreatedInputRecipe(generated);
      setTimeout(() => {
        generatedPaneRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-[#F2EAE0] border border-[#E0D3C1] rounded-2xl p-6 sm:p-6 text-stone-900 shadow-md relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-[#9E4624]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center space-x-3 mb-2">
          <div className="p-1.5 sm:p-2 bg-[#9E4624]/15 text-[#9E4624] rounded-lg ring-1 ring-[#9E4624]/30">
            <Utensils className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>

        <h2 className="text-xl sm:text-3xl font-handwriting font-bold tracking-tight text-[#9E4624]">
          Put in your base recipe, and discover wild variations!
        </h2>
        <p className="mt-1 sm:mt-2 text-stone-700 text-xs sm:text-sm max-w-3xl leading-relaxed">
          We'll examine the molecular overlap, find ingredient categories, and generate wildcard pairings for the Recipe Studio.
        </p>

        {/* Recipe Title & Description Input */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 tracking-wide">
              Recipe Title
            </label>
            <input
              id="input-recipe-name"
              type="text"
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              placeholder="e.g. Malaysian Nasi Lemak"
              className="w-full bg-white border border-[#D8C9B4] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9E4624] transition-all shadow-xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1.5 tracking-wide">
              Description
            </label>
            <input
              id="input-recipe-description"
              type="text"
              value={recipeDescription}
              onChange={(e) => setRecipeDescription(e.target.value)}
              placeholder="e.g. Fragrant coconut rice served with sambal and roasted nuts..."
              className="w-full bg-white border border-[#D8C9B4] rounded-xl px-4 py-2.5 text-sm text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-2 focus:ring-[#9E4624] transition-all shadow-xs font-medium"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-stone-600 mr-1">Quick Presets:</span>
          {PRESET_RECIPES.map((preset, idx) => (
            <button
              key={idx}
              onClick={() => handleSelectPreset(preset)}
              className="px-3 py-1 bg-white hover:bg-[#9E4624] text-stone-800 hover:text-white border border-[#D8C9B4] text-xs font-semibold rounded-lg transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Ingredient Input Card */}
      <div className="bg-white border border-[#E2D6C5] rounded-2xl p-6 text-stone-800 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-[#EAE0D0] pb-3">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-[#9E4624]" />
            <h3 className="font-handwriting font-bold text-lg sm:text-2xl text-[#9E4624]">
              Ingredients List ({ingredients.length} items)
            </h3>
          </div>
          <span className="text-xs text-stone-500 font-medium">
            Search for your ingredients
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <AnimatePresence>
            {ingredients.map((ingVal, idx) => {
              const suggestions = searchIngredients(ingVal, 5);
              const showSuggestions = activeSuggestionIdx === idx && ingVal.length > 0;

              return (
                <motion.div
                  key={slotIds.current[idx]}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="relative"
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 rounded-full bg-[#EADECB] text-[#9E4624] font-mono text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </div>

                    <input
                      type="text"
                      value={ingVal}
                      onFocus={() => setActiveSuggestionIdx(idx)}
                      onChange={(e) => handleIngredientChange(idx, e.target.value)}
                      placeholder="Type ingredient name (e.g. Lemon Peel)..."
                      className="w-full bg-[#FAF6F0] border border-[#D8C9B4] rounded-xl px-3.5 py-2 text-xs text-stone-900 font-medium placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9E4624]"
                    />

                    {ingredients.length > 3 && (
                      <button
                        onClick={() => removeIngredientField(idx)}
                        className="p-1.5 text-stone-400 hover:text-[#9E4624] hover:bg-[#FAF6F0] rounded-lg transition-colors cursor-pointer"
                        title="Remove ingredient"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Dropdown */}
                  <AnimatePresence>
                    {showSuggestions && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.15 }}
                        className="absolute z-30 left-8 right-8 mt-1 bg-white border border-[#D8C9B4] rounded-xl shadow-xl max-h-48 overflow-y-auto custom-scrollbar"
                      >
                        {suggestions.map((sug) => (
                          <div
                            key={sug.id}
                            onClick={() => {
                              handleIngredientChange(idx, sug.name);
                              setActiveSuggestionIdx(null);
                            }}
                            className="px-3.5 py-2 text-xs text-stone-800 hover:bg-[#9E4624]/10 hover:text-[#9E4624] cursor-pointer flex items-center justify-between border-b border-[#EAE0D0] last:border-0"
                          >
                            <span className="font-bold">{sug.name}</span>
                            <span className="text-[10px] text-stone-600 bg-[#EADECB] px-2 py-0.5 rounded font-semibold">
                              {sug.category}
                            </span>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        <button
          onClick={addIngredientField}
          className="py-2.5 px-4 text-xs font-bold text-[#9E4624] bg-[#9E4624]/10 hover:bg-[#9E4624]/20 rounded-xl border border-[#9E4624]/25 flex items-center justify-center space-x-1.5 transition-all w-full sm:w-auto cursor-pointer active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Add Another Ingredient</span>
        </button>
      </div>

      {/* Action Button: Generate Categories */}
      <div className="flex justify-center pt-2">
        <button
          id="btn-generate-recipe-categories"
          onClick={handleAnalyzeRecipe}
          disabled={isGenerating || ingredients.filter((i) => i.trim()).length === 0}
          className="px-8 py-3.5 bg-[#9E4624] hover:bg-[#85381A] text-amber-50 font-extrabold text-sm rounded-xl shadow-lg shadow-[#9E4624]/20 flex items-center space-x-2 border border-[#9E4624]/30 transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 cursor-pointer"
        >
          <Wand2 className="w-5 h-5 text-amber-100" />
          <span>
            {isGenerating ? 'Analyzing Volatiles...' : 'Generate Studio Categories'}
          </span>
        </button>
      </div>

      {/* Generated Categories Preview Card */}
      <AnimatePresence>
        {createdInputRecipe && (
          <motion.div
            ref={generatedPaneRef}
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="bg-white border border-[#9E4624]/40 rounded-2xl p-6 text-stone-900 shadow-xl space-y-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#EAE0D0] pb-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-6 h-6 text-[#9E4624] shrink-0" />
                <div>
                  <h3 className="text-lg sm:text-2xl font-handwriting font-bold text-[#9E4624]">
                    Categories Generated for: {createdInputRecipe.name}
                  </h3>
                  {createdInputRecipe.description && (
                    <p className="text-xs text-stone-700 italic font-medium mt-0.5">
                      "{createdInputRecipe.description}"
                    </p>
                  )}
                  <p className="text-xs text-stone-600 mt-1">
                    Derived {createdInputRecipe.categories.length} functional category lanes +{' '}
                    {createdInputRecipe.experimentalCategories.length} wildcard lanes.
                  </p>
                </div>
              </div>

              <button
                id="btn-open-in-studio"
                onClick={() => onRecipeInputSubmitted(createdInputRecipe)}
                className="px-5 py-2.5 bg-[#9E4624] hover:bg-[#85381A] text-amber-50 font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all shadow-sm"
              >
                <span>Load in Recipe Studio</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* Functional Category Lanes */}
            <div>
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#9E4624] mb-3">
                Functional Categories
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {createdInputRecipe.categories.map((cat, cIdx) => (
                  <div
                    key={cIdx}
                    className="bg-[#FAF6F0] border border-[#E2D6C5] rounded-xl p-3.5"
                  >
                    <span className="text-base font-handwriting font-bold text-stone-900 block mb-1">
                      {cat.name}
                    </span>
                    <span className="text-[11px] text-stone-600 font-medium">
                      {cat.ingredientIds.length} candidate ingredients
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Experimental Wildcard Categories */}
            {createdInputRecipe.experimentalCategories.length > 0 && (
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 mb-3">
                  Wildcard Categories (Chemical Synergy Overlap)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {createdInputRecipe.experimentalCategories.map((cat, cIdx) => (
                    <div
                      key={cIdx}
                      className="bg-amber-50 border border-amber-200 rounded-xl p-3.5"
                    >
                      <span className="text-xs font-bold text-amber-900 block mb-1">
                        {cat.name}
                      </span>
                      <span className="text-[11px] text-amber-800/80 font-medium">
                        Unlocked by molecular volatile overlap
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
