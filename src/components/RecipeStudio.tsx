import React, { useState, useEffect, useMemo } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  FlaskConical,
  RefreshCw,
  Save,
  Sparkles,
  Zap,
  CheckCircle2,
  ChevronDown,
  Info,
  Flame,
  Utensils,
  CookingPot,
  Cherry,
  Wheat,
  Leaf,
  Wine,
  Coffee,
} from 'lucide-react';
import { Ingredient, Recipe, InputRecipe } from '../types/flavordb';
import { getIngredientById, formatCompoundName } from '../lib/flavordb/data';
import { calculateRecipeSynergy } from '../lib/math/synergy';
import { ensureLaneMinimumOptions } from '../lib/math/clustering';
import { saveRecipe, getAllRecipes } from '../lib/db';
import { ChemicalSubstitutionModal } from './ChemicalSubstitutionModal';
import { CustomDropdown, DropdownOption } from './CustomDropdown';

interface RecipeStudioProps {
  inputRecipes: InputRecipe[];
  activeInputRecipe: InputRecipe | null;
  activeSavedRecipe?: Recipe | null;
  onSelectInputRecipe: (recipe: InputRecipe) => void;
  onRecipeSaved: () => void;
  onUpdateLatency: (ms: number) => void;
}

export const RecipeStudio: React.FC<RecipeStudioProps> = ({
  inputRecipes,
  activeInputRecipe,
  activeSavedRecipe,
  onSelectInputRecipe,
  onRecipeSaved,
  onUpdateLatency,
}) => {
  const currentInputRecipe = activeInputRecipe || inputRecipes[0] || null;

  // Local Dashboard Recipes state
  const [dashboardRecipes, setDashboardRecipes] = useState<Recipe[]>([]);
  const [selectedOptionId, setSelectedOptionId] = useState<string>('');

  // Selections state: map categoryName -> ingredientId
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [showExperimental, setShowExperimental] = useState(true);
  const [recipeTitle, setRecipeTitle] = useState('');
  const [recipeDescription, setRecipeDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(false);

  // Substitution modal target ingredient state
  const [subModalTarget, setSubModalTarget] = useState<{
    ingredient: Ingredient;
    categoryName: string;
  } | null>(null);

  const loadDashboardRecipes = async () => {
    const list = await getAllRecipes();
    setDashboardRecipes(list);
  };

  useEffect(() => {
    loadDashboardRecipes();
  }, []);

  // Construct options for dropdown: Dashboard Recipes first, then Base Recipes
  const dropdownOptions = useMemo(() => {
    const options: DropdownOption<string>[] = [];

    // Local Dashboard Recipes
    dashboardRecipes.forEach((r) => {
      options.push({
        value: r.id,
        label: r.title,
        badge: 'Saved Recipe',
        description: r.description
          ? `${r.description}`
          : `Based on ${r.baseRecipeName}`,
      });
    });

    // Base Input Recipes
    inputRecipes.forEach((p) => {
      options.push({
        value: p.id,
        label: p.name,
        badge: 'Base Recipe',
        description: p.description || `${p.ingredients.length} base ingredients`,
      });
    });

    return options;
  }, [dashboardRecipes, inputRecipes]);

  // Handle dropdown selection (either a saved dashboard recipe or a base input recipe)
  const handleDropdownChange = (selectedId: string) => {
    setSelectedOptionId(selectedId);

    const dashboardItem = dashboardRecipes.find((r) => r.id === selectedId);
    if (dashboardItem) {
      const matchingInput =
        inputRecipes.find((p) => p.id === dashboardItem.baseRecipeId) || inputRecipes[0];
      onSelectInputRecipe(matchingInput);

      const newSelections: Record<string, string> = {};
      const categories = showExperimental && matchingInput.experimentalCategories
        ? [...matchingInput.categories, ...matchingInput.experimentalCategories]
        : matchingInput.categories;

      categories.forEach((cat) => {
        if (dashboardItem.selections && dashboardItem.selections[cat.name]) {
          newSelections[cat.name] = dashboardItem.selections[cat.name];
        } else if (cat.ingredientIds.length > 0) {
          newSelections[cat.name] = cat.ingredientIds[0];
        }
      });

      setSelections(newSelections);
      setRecipeTitle(dashboardItem.title);
      setRecipeDescription(dashboardItem.description || '');
      return;
    }

    const inputItem = inputRecipes.find((p) => p.id === selectedId);
    if (inputItem) {
      onSelectInputRecipe(inputItem);
    }
  };

  // Sync selectedOptionId when activeSavedRecipe prop changes
  useEffect(() => {
    if (activeSavedRecipe) {
      handleDropdownChange(activeSavedRecipe.id);
    }
  }, [activeSavedRecipe]);

  // Initialize selections when base input recipe changes and current option is a base recipe
  useEffect(() => {
    if (!currentInputRecipe) return;

    const isDashboardRecipe = dashboardRecipes.some((r) => r.id === selectedOptionId);
    if (isDashboardRecipe) return;

    setSelectedOptionId(currentInputRecipe.id);

    const initialSelections: Record<string, string> = {};
    currentInputRecipe.categories.forEach((cat) => {
      if (cat.ingredientIds.length > 0) {
        initialSelections[cat.name] = cat.ingredientIds[0];
      }
    });

    if (showExperimental && currentInputRecipe.experimentalCategories) {
      currentInputRecipe.experimentalCategories.forEach((cat) => {
        if (cat.ingredientIds.length > 0) {
          initialSelections[cat.name] = cat.ingredientIds[0];
        }
      });
    }

    setSelections(initialSelections);
    setRecipeTitle(`Variant: ${currentInputRecipe.name}`);
    setRecipeDescription(currentInputRecipe.description || '');
  }, [currentInputRecipe, showExperimental, dashboardRecipes]);

  // Compute Real-time Synergy Score and Shared Compounds
  const selectedIngredientIds = useMemo(
    () => Object.values(selections).filter(Boolean),
    [selections]
  );

  const synergyResult = useMemo(() => {
    return calculateRecipeSynergy(selectedIngredientIds);
  }, [selectedIngredientIds]);

  useEffect(() => {
    onUpdateLatency(synergyResult.computeTimeMs);
  }, [synergyResult.computeTimeMs, onUpdateLatency]);

  const handleSelectIngredientInLane = (categoryName: string, ingredientId: string) => {
    setSelections((prev) => ({
      ...prev,
      [categoryName]: ingredientId,
    }));
  };

  const handleSwapFromModal = (newIngredient: Ingredient) => {
    if (!subModalTarget) return;
    handleSelectIngredientInLane(subModalTarget.categoryName, newIngredient.id);
  };

  const handleSaveRecipe = async () => {
    if (!currentInputRecipe || !recipeTitle.trim()) return;

    setIsSaving(true);
    try {
      const newRecipe: Recipe = {
        id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        title: recipeTitle,
        description: recipeDescription.trim() || undefined,
        baseRecipeId: currentInputRecipe.id,
        baseRecipeName: currentInputRecipe.name,
        selections,
        synergyScore: synergyResult.score,
        sharedCompounds: synergyResult.sharedCompoundIds,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveRecipe(newRecipe);
      await loadDashboardRecipes();
      setSelectedOptionId(newRecipe.id);
      setSaveSuccessMsg(true);
      setTimeout(() => setSaveSuccessMsg(false), 3000);
      onRecipeSaved();
    } finally {
      setIsSaving(false);
    }
  };

  if (!currentInputRecipe) {
    return (
      <div className="text-center py-20 text-stone-500">
        No input recipes available. Please enter a recipe on the Recipe Input page.
      </div>
    );
  }

  const rawLanes = showExperimental
    ? [...currentInputRecipe.categories, ...(currentInputRecipe.experimentalCategories || [])]
    : currentInputRecipe.categories;

  const allLanes = useMemo(
    () => rawLanes.map((lane) => ensureLaneMinimumOptions(lane, 5)),
    [rawLanes]
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Recipe Select Bar & Control Header */}
      <div className="bg-white border border-[#E2D6C5] rounded-2xl p-6 text-stone-900 shadow-md flex flex-col gap-2.5 sm:gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-handwriting font-bold tracking-tight text-[#9E4624] flex items-center space-x-2">
              <Utensils className="w-5 h-5" />
              <span>Choose a Recipe to Modify</span>
            </h2>
            <div className="flex items-center space-x-3 mt-0.5 sm:mt-1">
              <CustomDropdown
                options={dropdownOptions}
                value={selectedOptionId || currentInputRecipe.id}
                onChange={handleDropdownChange}
              />
            </div>
            {currentInputRecipe.description && (
              <p className="text-xs text-stone-600 font-medium mt-1.5 line-clamp-2 max-w-xl">
                {currentInputRecipe.description}
              </p>
            )}
          </div>

          {/* Experimental Wildcard Toggle Switch */}
          <div className="flex items-center justify-between sm:justify-start space-x-3 bg-[#F2EAE0] px-3.5 py-1.5 sm:py-2.5 rounded-xl border border-[#E0D3C1]">
            <div className="flex items-center space-x-2">
              <Zap className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span className="text-xs font-bold text-stone-800">
                Show Wildcard Lanes
              </span>
            </div>
            <button
              onClick={() => setShowExperimental(!showExperimental)}
              className={`w-10 h-5 sm:w-11 sm:h-6 flex items-center rounded-full p-0.5 sm:p-1 transition-colors shrink-0 ${showExperimental ? 'bg-[#9E4624]' : 'bg-stone-300'
                }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-sm transform transition-transform ${showExperimental ? 'translate-x-5' : 'translate-x-0'
                  }`}
              />
            </button>
          </div>
        </div>

        {/* Recipe Save Section */}
        <div className="pt-2 sm:pt-3 border-t border-[#EAE0D0] flex flex-col sm:flex-row sm:items-end gap-2 sm:gap-3">
          <input
            type="text"
            value={recipeTitle}
            onChange={(e) => setRecipeTitle(e.target.value)}
            placeholder="Recipe Title..."
            className="flex-1 bg-[#FAF6F0] border border-[#D8C9B4] rounded-xl px-3 py-1.5 sm:py-2 text-xs sm:text-sm font-handwriting text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9E4624]"
          />

          <input
            type="text"
            value={recipeDescription}
            onChange={(e) => setRecipeDescription(e.target.value)}
            placeholder="Recipe Description (optional)..."
            className="flex-1 bg-[#FAF6F0] border border-[#D8C9B4] rounded-xl px-3 py-1.5 sm:py-2.5 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9E4624]"
          />

          <button
            id="btn-save-recipe"
            onClick={handleSaveRecipe}
            disabled={isSaving || !recipeTitle.trim()}
            className="sm:w-auto py-2 sm:py-2.75 px-4 bg-[#9E4624] hover:bg-[#85381A] text-amber-50 font-bold text-xs rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-50 shrink-0"
          >
            <Save className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Recipe'}</span>
          </button>
        </div>

        <AnimatePresence>
          {saveSuccessMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="p-1.5 bg-[#9E4624]/10 border border-[#9E4624]/25 text-[#9E4624] text-[11px] font-bold rounded-lg text-center">
                ✓ Saved to Local Library!
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Main Studio Grid: Left Gauge + Right Category Lanes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Synergy Card + Kitchen Illustrations */}
        <div className="lg:col-span-4 lg:self-start space-y-4">
          {/* Real-time Synergy Gauge Card */}
          <div className="bg-white border border-[#E2D6C5] rounded-2xl p-3.5 sm:p-5 lg:p-4 xl:p-5 text-stone-900 shadow-md flex flex-col space-y-2.5 sm:space-y-4 lg:space-y-3">
            <div>
              <div className="flex items-center justify-between border-b border-[#EAE0D0] pb-1.5 sm:pb-2.5 lg:pb-2 mb-2 sm:mb-3 lg:mb-2">
                <span className="text-[11px] sm:text-xs font-extrabold uppercase tracking-wider text-[#9E4624] flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#9E4624]" />
                  <span>Pair-wise Synergy Rating</span>
                </span>
              </div>

              {/* Top Shared Volatiles Callout */}
              <div className="space-y-1 sm:space-y-2 lg:space-y-1.5 pt-1 sm:pt-2 lg:pt-1">
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-stone-600 block">
                  Top Shared Volatile Compounds
                </span>

                {synergyResult.topVolatiles.length === 0 ? (
                  <p className="text-[11px] sm:text-xs text-stone-500 italic">
                    Select 2 or more ingredients to calculate shared volatile molecules.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1 sm:gap-1.5 max-h-20 sm:max-h-32 lg:max-h-24 xl:max-h-28 overflow-y-auto">
                    {synergyResult.topVolatiles.map(({ compound, count }) => (
                      <span
                        key={compound.id}
                        className="px-2 py-0.5 text-[10px] sm:text-xs font-semibold bg-[#9E4624]/10 text-[#9E4624] border border-[#9E4624]/25 rounded-lg flex items-center space-x-1"
                      >
                        <span>{formatCompoundName(compound.name)}</span>
                        <span className="text-[9px] bg-[#9E4624] text-amber-50 px-1 py-0.1 rounded-full font-bold">
                          x{count}
                        </span>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Kitchen Illustrations – fills empty bottom-left space on laptop */}
          <div className="hidden lg:flex flex-col items-center justify-center py-8 px-4 opacity-[0.18] select-none pointer-events-none" aria-hidden="true">
            <div className="grid grid-cols-3 gap-x-6 gap-y-5">
              <CookingPot className="w-10 h-10 text-[#9E4624] -rotate-6" />
              <Cherry className="w-8 h-8 text-[#9E4624] rotate-12 mt-2" />
              <Wheat className="w-9 h-9 text-[#9E4624] -rotate-3" />
              <Leaf className="w-8 h-8 text-[#9E4624] rotate-6 ml-2" />
              <Sparkles className="w-10 h-10 text-[#9E4624] -rotate-12" />
              <Wine className="w-8 h-8 text-[#9E4624] rotate-3 mt-1" />
              <Coffee className="w-9 h-9 text-[#9E4624] rotate-6" />
              <Utensils className="w-7 h-7 text-[#9E4624] -rotate-6 mt-1 ml-2" />
              <FlaskConical className="w-9 h-9 text-[#9E4624] rotate-12" />
            </div>
            <p className="mt-4 text-[10px] font-handwriting text-stone-400 tracking-wide">the molecular kitchen</p>
          </div>
        </div>

        {/* Right Column: Active Ingredient Deck (Grid Layout) + Category Lanes (Compact) */}
        <div className="lg:col-span-8 space-y-4 sm:space-y-5">
          {/* Active Ingredient Deck & Substitution Trigger */}
          <div className="bg-white border border-[#E2D6C5] rounded-2xl p-3.5 sm:p-5 text-stone-900 shadow-md space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAE0D0] pb-2">
              <div>
                <h3 className="font-handwriting font-bold text-lg sm:text-xl text-[#9E4624] flex items-center space-x-1.5">
                  <Utensils className="w-3.5 h-3.5 text-[#9E4624]" />
                  <span>Active Ingredient Deck</span>
                </h3>
                <p className="text-[10px] sm:text-[11px] text-stone-600">
                  Click any card to substitute by molecular similarity.
                </p>
              </div>
              <span className="text-[10px] sm:text-xs font-mono font-bold text-[#9E4624] bg-[#9E4624]/10 px-2 py-0.5 rounded-lg border border-[#9E4624]/20 shrink-0">
                {Object.keys(selections).length} Active
              </span>
            </div>

            {/* Responsive Grid Layout */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-2.5">
              <AnimatePresence>
                {Object.entries(selections).map(([laneName, ingId]) => {
                  const ing = getIngredientById(ingId as string);
                  if (!ing) return null;

                  return (
                    <motion.div
                      key={laneName}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      onClick={() =>
                        setSubModalTarget({ ingredient: ing, categoryName: laneName })
                      }
                      className="bg-[#FAF6F0] border border-[#E0D3C1] hover:border-[#9E4624] rounded-xl p-2.5 sm:p-3 cursor-pointer transition-colors duration-100 hover:bg-white group shadow-2xs flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-0.5 sm:mb-1 gap-1">
                          <span className="text-[9px] sm:text-[10px] font-extrabold text-stone-500 uppercase tracking-wide truncate">
                            {laneName}
                          </span>
                          <span className="text-[9px] font-bold text-[#9E4624] group-hover:underline flex items-center space-x-0.5 shrink-0">
                            <RefreshCw className="w-2.5 h-2.5" />
                            <span className="hidden sm:inline">Substitute</span>
                          </span>
                        </div>

                        <h4 className="font-handwriting font-bold text-base sm:text-lg text-stone-900 group-hover:text-[#9E4624] transition-colors duration-100 leading-snug truncate">
                          {ing.name}
                        </h4>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {ing.compounds.slice(0, 2).map((cid) => (
                          <span
                            key={cid}
                            className="px-1 py-0.1 text-[8px] sm:text-[9px] bg-[#EADECB] text-stone-700 font-medium rounded truncate"
                          >
                            {formatCompoundName(cid)}
                          </span>
                        ))}
                        {ing.compounds.length > 2 && (
                          <span className="px-1 py-0.1 text-[8px] sm:text-[9px] bg-[#EADECB] text-stone-600 font-medium rounded">
                            +{ing.compounds.length - 2}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Category Lanes (Vertically Compact) */}
          <div className="bg-white border border-[#E2D6C5] rounded-2xl p-3.5 sm:p-5 text-stone-900 shadow-md space-y-2.5 sm:space-y-3">
            <div className="flex items-center justify-between border-b border-[#EAE0D0] pb-2">
              <div>
                <h3 className="font-handwriting font-bold text-lg sm:text-xl text-[#9E4624]">
                  Category Lanes (Single-Choice Selection)
                </h3>
                <p className="text-[10px] sm:text-[11px] text-stone-600">
                  Pick 1 ingredient per lane to adjust your flavor stack.
                </p>
              </div>
            </div>

            {/* Compact Horizontal Lanes */}
            <div className="space-y-2 sm:space-y-2.5">
              <AnimatePresence initial={false}>
                {allLanes.map((lane) => {
                  const currentSelectedId = selections[lane.name];

                  return (
                    <motion.div
                      key={lane.name}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="bg-[#FAF6F0] border border-[#E0D3C1] rounded-xl px-2.5 py-1.5 sm:px-3 sm:py-2 space-y-1 sm:space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-handwriting font-bold text-[#9E4624] tracking-wide flex items-center space-x-1.5">
                          <span className="text-sm sm:text-base">{lane.name}</span>
                          {lane.isExperimental && (
                            <span className="px-1.5 py-0.2 text-[8px] sm:text-[9px] bg-amber-100 text-amber-900 border border-amber-300 rounded-full font-bold">
                              Wildcard
                            </span>
                          )}
                        </span>
                        <span className="text-[9px] sm:text-[10px] text-stone-500 font-medium">
                          {lane.ingredientIds.length} options
                        </span>
                      </div>

                      {/* Compact Horizontal scroll/wrap of ingredient chips */}
                      <div className="flex flex-wrap gap-1 sm:gap-1.5">
                        {lane.ingredientIds.map((ingId) => {
                          const ing = getIngredientById(ingId);
                          if (!ing) return null;

                          const isSelected = currentSelectedId === ing.id;

                          return (
                            <button
                              key={ing.id}
                              onClick={() =>
                                handleSelectIngredientInLane(lane.name, ing.id)
                              }
                              className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[11px] sm:text-xs transition-colors duration-100 flex items-center space-x-1 border cursor-pointer active:scale-95 ${isSelected
                                ? 'bg-[#9E4624] text-amber-50 border-[#9E4624] shadow-2xs font-bold'
                                : 'bg-white hover:bg-[#F2EAE0] text-stone-800 border-[#D8C9B4] font-medium'
                                }`}
                            >
                              <span>{ing.name}</span>
                              {isSelected && <CheckCircle2 className="w-3 h-3 text-amber-50" />}
                            </button>
                          );
                        })}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Pure Chemical Substitution Modal Overlay */}
      {subModalTarget && (
        <ChemicalSubstitutionModal
          targetIngredient={subModalTarget.ingredient}
          categoryName={subModalTarget.categoryName}
          onClose={() => setSubModalTarget(null)}
          onSwapIngredient={handleSwapFromModal}
        />
      )}
    </div>
  );
};
