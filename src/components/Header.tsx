import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FlaskConical, BookOpen, Utensils, Menu, X, ChevronRight } from 'lucide-react';

interface HeaderProps {
  activeTab: 'input' | 'studio' | 'dashboard';
  setActiveTab: (tab: 'input' | 'studio' | 'dashboard') => void;
  lastComputeLatencyMs: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  lastComputeLatencyMs,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'input', labelFull: '1. Recipe Input', labelShort: 'Input', icon: Utensils, description: 'Input base ingredients & generate categories' },
    { id: 'studio', labelFull: '2. Recipe Studio', labelShort: 'Studio', icon: FlaskConical, description: 'Design recipe variants & substitute molecules' },
    { id: 'dashboard', labelFull: '3. Local Dashboard', labelShort: 'Dashboard', icon: BookOpen, description: 'Saved local recipe library & JSON export' },
  ] as const;

  const currentTab = tabs.find((t) => t.id === activeTab) || tabs[0];

  const handleTabClick = (tabId: 'input' | 'studio' | 'dashboard') => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#F5EFE6]/95 backdrop-blur-md border-b border-[#E2D6C5] text-stone-900 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-14 sm:h-20 lg:h-22 flex items-center justify-between gap-2">
        {/* Brand Title */}
        <div
          className="flex items-center space-x-2 sm:space-x-2.5 cursor-pointer shrink-0"
          onClick={() => handleTabClick('studio')}
        >
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#9E4624] via-[#B85830] to-[#7F3417] flex items-center justify-center shadow-md shadow-[#9E4624]/25 ring-1 ring-[#9E4624]/30">
            <FlaskConical className="w-4 h-4 sm:w-5 sm:h-5 text-amber-50" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-handwriting font-bold text-xl sm:text-2xl tracking-tight text-[#9E4624]">
                REZIPI
              </h1>
              {/* Mobile Active Tab Pill Badge */}
              <span className="sm:hidden text-[10px] font-bold text-[#9E4624] bg-[#9E4624]/10 border border-[#9E4624]/20 px-2 py-0.5 rounded-full">
                {currentTab.labelShort}
              </span>
            </div>
            <p className="text-xs text-stone-600 hidden md:block font-medium">
              Molecular Recipe Design & Chemical Substitution
            </p>
          </div>
        </div>

        {/* Desktop / Tablet Tab Navigation */}
        <nav className="hidden sm:flex items-center space-x-1 sm:space-x-2 bg-[#EADECB] p-1 rounded-xl ring-1 ring-[#D8C9B4]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => handleTabClick(tab.id)}
                className={`relative flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-4 lg:px-5 py-1.5 sm:py-2 lg:py-3 rounded-lg text-xs font-semibold transition-colors duration-100 z-10 cursor-pointer ${
                  isActive ? 'text-amber-50' : 'text-stone-700 hover:text-[#9E4624] hover:bg-[#F5EFE6]/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabBadge"
                    className="absolute inset-0 bg-[#9E4624] rounded-lg shadow-md -z-10"
                    transition={{ type: 'spring', stiffness: 450, damping: 32 }}
                  />
                )}
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden md:inline">{tab.labelFull}</span>
                <span className="md:hidden">{tab.labelShort}</span>
              </button>
            );
          })}
        </nav>

        {/* Mobile Hamburger Menu Button */}
        <div className="flex sm:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Toggle Navigation Menu"
            className="p-2 text-stone-700 hover:text-[#9E4624] hover:bg-[#EADECB] rounded-xl border border-[#D8C9B4] transition-colors cursor-pointer active:scale-95"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Dropdown */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="sm:hidden bg-[#F5EFE6] border-b border-[#E2D6C5] shadow-lg overflow-hidden"
          >
            <div className="px-3 py-3 space-y-1.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#9E4624] text-amber-50 border-[#9E4624] shadow-sm font-bold'
                        : 'bg-white text-stone-800 border-[#E0D3C1] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`p-2 rounded-lg ${
                          isActive ? 'bg-white/20 text-amber-50' : 'bg-[#9E4624]/10 text-[#9E4624]'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold">{tab.labelFull}</div>
                        <div
                          className={`text-[10px] ${
                            isActive ? 'text-amber-100/90' : 'text-stone-500'
                          }`}
                        >
                          {tab.description}
                        </div>
                      </div>
                    </div>
                    <ChevronRight
                      className={`w-4 h-4 ${isActive ? 'text-amber-50' : 'text-stone-400'}`}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
