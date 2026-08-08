import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  BookOpen,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  ExternalLink,
  FlaskConical,
  Sparkles,
} from 'lucide-react';
import { Recipe } from '../types/flavordb';
import { getIngredientById } from '../lib/flavordb/data';
import {
  getAllRecipes,
  deleteRecipe,
  saveRecipe,
  exportLibraryJSON,
  importLibraryJSON,
} from '../lib/db';

interface LocalDashboardProps {
  onLoadRecipeInStudio: (recipe: Recipe) => void;
}

export const LocalDashboard: React.FC<LocalDashboardProps> = ({
  onLoadRecipeInStudio,
}) => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const fetchRecipes = async () => {
    const list = await getAllRecipes();
    setRecipes(list);
  };

  useEffect(() => {
    fetchRecipes();
  }, []);

  const [deletingRecipeId, setDeletingRecipeId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    await deleteRecipe(id);
    setDeletingRecipeId(null);
    fetchRecipes();
  };

  const handleDuplicate = async (recipe: Recipe) => {
    const duplicated: Recipe = {
      ...recipe,
      id: `recipe_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      title: `${recipe.title} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveRecipe(duplicated);
    fetchRecipes();
  };

  const handleExportJSON = async () => {
    setIsExporting(true);
    try {
      const jsonStr = await exportLibraryJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `flavordb_recipes_export_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const res = await importLibraryJSON(content);
        setImportStatus(
          `Successfully imported ${res.importedRecipesCount} recipes and ${res.importedInputRecipesCount} input recipes!`
        );
        fetchRecipes();
        setTimeout(() => setImportStatus(null), 4000);
      } catch (err) {
        alert('Invalid JSON import file.');
      }
    };
    reader.readAsText(file);
  };

  const filteredRecipes = recipes.filter(
    (r) =>
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.baseRecipeName || r.tasteProfileName || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Top Banner & Library Control Bar */}
      <div className="bg-white border border-[#E2D6C5] rounded-2xl p-6 text-stone-900 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-[#9E4624]" />
            <h2 className="text-xl sm:text-2xl font-handwriting font-bold tracking-tight text-[#9E4624]">
              Local Recipe Dashboard
            </h2>
          </div>
          <p className="text-xs text-stone-600 mt-1">
            Offline-first library • {recipes.length} Saved Molecular Recipes
          </p>
        </div>

        {/* Search Input & JSON Portability Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 md:w-60">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search recipes..."
              className="w-full bg-[#FAF6F0] border border-[#D8C9B4] rounded-xl pl-9 pr-3 py-1.5 text-xs text-stone-900 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-[#9E4624]"
            />
          </div>

          <button
            onClick={handleExportJSON}
            disabled={isExporting}
            className="px-3.5 py-2 bg-[#F2EAE0] hover:bg-[#9E4624] text-stone-800 hover:text-white text-xs font-bold rounded-xl border border-[#D8C9B4] hover:border-[#9E4624] flex items-center space-x-1.5 transition-all shadow-xs group cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#9E4624] group-hover:text-white" />
            <span>Export JSON</span>
          </button>

          <label className="px-3.5 py-2 bg-[#F2EAE0] hover:bg-[#9E4624] text-stone-800 hover:text-white text-xs font-bold rounded-xl border border-[#D8C9B4] hover:border-[#9E4624] flex items-center space-x-1.5 cursor-pointer transition-all shadow-xs group">
            <Upload className="w-3.5 h-3.5 text-[#9E4624] group-hover:text-white" />
            <span>Import JSON</span>
            <input
              type="file"
              accept=".json"
              onChange={handleImportJSON}
              className="hidden"
            />
          </label>
        </div>
      </div>

      <AnimatePresence>
        {importStatus && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-[#9E4624]/10 border border-[#9E4624]/25 text-[#9E4624] text-xs font-bold rounded-xl text-center">
              {importStatus}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Recipe Grid Cards */}
      {filteredRecipes.length === 0 ? (
        <div className="text-center py-20 bg-white/60 border border-[#E2D6C5] rounded-2xl text-stone-500 text-sm space-y-3">
          <p className="font-semibold text-stone-700">No saved recipes found in your local library.</p>
          <p className="text-xs text-stone-500">
            Go to Recipe Studio to design and save your first recipe!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className="bg-white border border-[#E2D6C5] hover:border-[#9E4624]/50 rounded-2xl p-6 text-stone-900 shadow-sm hover:shadow-md flex flex-col justify-between space-y-5 transition-colors group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-handwriting font-bold text-lg sm:text-2xl text-stone-900 group-hover:text-[#9E4624] transition-colors">
                        {recipe.title}
                      </h3>
                      <span className="text-[11px] text-stone-500 block mt-0.5 font-medium">
                        Base Recipe: {recipe.baseRecipeName || recipe.tasteProfileName}
                      </span>
                      {recipe.description && (
                        <p className="text-xs text-stone-600 line-clamp-2 mt-1 font-sans">
                          {recipe.description}
                        </p>
                      )}
                    </div>

                    {/* Synergy Score Badge */}
                    {/* <div className="px-2.5 py-1 bg-[#9E4624]/10 border border-[#9E4624]/25 rounded-lg text-right shrink-0">
                      <span className="font-mono font-black text-sm text-[#9E4624] block">
                        {recipe.synergyScore}%
                      </span>
                      <span className="text-[9px] uppercase tracking-wider text-stone-500 font-bold block">
                        Synergy
                      </span>
                    </div> */}
                  </div>

                  {/* Selected Ingredients Pill List */}
                  <div className="space-y-1.5 pt-2 border-t border-[#EAE0D0]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                      Ingredient Stack
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(recipe.selections).map(([lane, ingId]) => {
                        const ing = getIngredientById(ingId as string);
                        if (!ing) return null;
                        return (
                          <span
                            key={lane}
                            className="px-2 py-0.5 text-xs bg-[#FAF6F0] text-stone-800 border border-[#E0D3C1] rounded-md font-medium"
                          >
                            {ing.name}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-[#EAE0D0] text-xs">
                  <span className="text-[10px] text-stone-500 font-medium">
                    {new Date(recipe.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDuplicate(recipe)}
                      className="p-1.5 text-stone-500 hover:text-[#9E4624] hover:bg-[#F2EAE0] rounded-lg transition-colors cursor-pointer"
                      title="Duplicate Recipe"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <AnimatePresence mode="wait">
                      {deletingRecipeId === recipe.id ? (
                        <motion.div
                          key="confirm"
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="flex items-center space-x-1"
                        >
                          <button
                            onClick={() => handleDelete(recipe.id)}
                            className="px-2 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-md transition-colors cursor-pointer"
                          >
                            Confirm
                          </button>
                          <button
                            onClick={() => setDeletingRecipeId(null)}
                            className="px-2 py-1 text-[11px] font-bold text-stone-600 hover:bg-stone-200 rounded-md transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                        </motion.div>
                      ) : (
                        <button
                          key="delete-btn"
                          onClick={() => setDeletingRecipeId(recipe.id)}
                          className="p-1.5 text-stone-500 hover:text-rose-600 hover:bg-[#F2EAE0] rounded-lg transition-colors cursor-pointer"
                          title="Delete Recipe"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </AnimatePresence>

                    <button
                      onClick={() => onLoadRecipeInStudio(recipe)}
                      className="px-3 py-1.5 bg-[#9E4624]/10 hover:bg-[#9E4624]/20 text-[#9E4624] font-bold rounded-lg border border-[#9E4624]/25 flex items-center space-x-1 transition-all cursor-pointer"
                    >
                      <span>Edit Studio</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
