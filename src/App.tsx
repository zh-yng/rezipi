import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Header } from './components/Header';
import { RecipeInputPage } from './components/RecipeInputPage';
import { RecipeStudio } from './components/RecipeStudio';
import { LocalDashboard } from './components/LocalDashboard';
import { GradientBackground } from './components/GradientBackground';
import { InputRecipe, Recipe } from './types/flavordb';
import { getAllInputRecipes, DEFAULT_INPUT_RECIPES } from './lib/db';

export default function App() {
  const [activeTab, setActiveTab] = useState<'input' | 'studio' | 'dashboard'>('input');
  const [inputRecipes, setInputRecipes] = useState<InputRecipe[]>(DEFAULT_INPUT_RECIPES);
  const [activeInputRecipe, setActiveInputRecipe] = useState<InputRecipe | null>(DEFAULT_INPUT_RECIPES[0]);
  const [lastComputeLatencyMs, setLastComputeLatencyMs] = useState<number>(0.8);

  const refreshInputRecipes = async () => {
    const list = await getAllInputRecipes();
    if (list.length > 0) {
      setInputRecipes(list);
      if (!activeInputRecipe) {
        setActiveInputRecipe(list[0]);
      }
    }
  };

  useEffect(() => {
    refreshInputRecipes();
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [activeTab]);

  const [activeSavedRecipe, setActiveSavedRecipe] = useState<Recipe | null>(null);

  const handleRecipeInputSubmitted = (newRecipeInput: InputRecipe) => {
    setInputRecipes((prev) => [newRecipeInput, ...prev]);
    setActiveInputRecipe(newRecipeInput);
    setActiveSavedRecipe(null);
    setActiveTab('studio');
  };

  const handleLoadRecipeInStudio = (recipe: Recipe) => {
    setActiveSavedRecipe(recipe);
    const targetId = recipe.baseRecipeId || recipe.tasteProfileId;
    const matching = inputRecipes.find((p) => p.id === targetId) || inputRecipes[0];
    if (matching) {
      setActiveInputRecipe(matching);
    }
    setActiveTab('studio');
  };

  return (
    <GradientBackground className="text-stone-900 font-sans antialiased selection:bg-[#9E4624] selection:text-amber-50">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        lastComputeLatencyMs={lastComputeLatencyMs}
      />

      {/* View Content */}
      <main className="flex-1 pb-16 min-h-[calc(100vh-8rem)]">
        <AnimatePresence mode="wait">
          {activeTab === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <RecipeInputPage onRecipeInputSubmitted={handleRecipeInputSubmitted} />
            </motion.div>
          )}

          {activeTab === 'studio' && (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <RecipeStudio
                inputRecipes={inputRecipes}
                activeInputRecipe={activeInputRecipe}
                activeSavedRecipe={activeSavedRecipe}
                onSelectInputRecipe={(inputRecipe) => {
                  setActiveInputRecipe(inputRecipe);
                  setActiveSavedRecipe(null);
                }}
                onRecipeSaved={refreshInputRecipes}
                onUpdateLatency={setLastComputeLatencyMs}
              />
            </motion.div>
          )}

          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
            >
              <LocalDashboard onLoadRecipeInStudio={handleLoadRecipeInStudio} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#E5DACB]/80 bg-[#F2EAE0]/70 backdrop-blur-xs py-6 text-center text-xs text-stone-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="font-medium text-stone-700">REZIPI • Molecular Recipe Design Engine</span>
          <span className="font-mono text-stone-500">Offline-First • Molecular Volatiles Jaccard Clustering</span>
        </div>
      </footer>
    </GradientBackground>
  );
}
