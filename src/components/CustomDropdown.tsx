import React, { useState, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronDown, Check } from 'lucide-react';

export interface DropdownOption<T extends string | number> {
  value: T;
  label: string;
  badge?: string;
  description?: string;
}

interface CustomDropdownProps<T extends string | number> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
  buttonClassName?: string;
  dropdownMenuClassName?: string;
  id?: string;
}

export function CustomDropdown<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
  buttonClassName = '',
  dropdownMenuClassName = '',
  id,
}: CustomDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen((prev) => !prev);
    }
  };

  return (
    <div ref={containerRef} className={`relative inline-block text-left max-w-full ${className}`} id={id}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`bg-[#FAF6F0] border border-[#D8C9B4] font-handwriting font-bold text-base sm:text-xl md:text-2xl text-[#9E4624] rounded-xl px-2.5 sm:px-3.5 md:px-4 py-1 sm:py-1.5 focus:outline-none focus:ring-2 focus:ring-[#9E4624] cursor-pointer shadow-xs max-w-full flex items-center justify-between gap-2 transition-all hover:bg-[#F3EBE0] ${buttonClassName}`}
      >
        <span className="truncate max-w-[200px] xs:max-w-[280px] sm:max-w-[360px] md:max-w-[480px] lg:max-w-[560px]">
          {selectedOption?.label || ''}
        </span>
        <ChevronDown
          className={`w-4 h-4 sm:w-5 sm:h-5 text-[#9E4624] shrink-0 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            role="listbox"
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute left-0 mt-1.5 z-50 w-full min-w-[220px] xs:min-w-[260px] sm:min-w-[320px] md:min-w-[380px] lg:min-w-[420px] max-w-[calc(100vw-2rem)] bg-[#FAF6F0] border border-[#D8C9B4] rounded-2xl shadow-xl py-1.5 overflow-hidden ${dropdownMenuClassName}`}
          >
            <div className="max-h-60 sm:max-h-72 lg:max-h-80 overflow-y-auto divide-y divide-[#EFE7DC]/60 custom-scrollbar">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 flex items-center justify-between transition-colors cursor-pointer group ${
                      isSelected
                        ? 'bg-[#9E4624]/12 text-[#9E4624] font-bold'
                        : 'text-stone-800 hover:bg-[#F2EAE0]'
                    }`}
                  >
                    <div className="flex flex-col pr-2">
                      <span
                        className={`font-handwriting text-base sm:text-lg lg:text-xl ${
                          isSelected
                            ? 'text-[#9E4624] font-bold'
                            : 'text-stone-800 group-hover:text-[#9E4624]'
                        }`}
                      >
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-[10px] sm:text-xs text-stone-500 font-sans mt-0.5">
                          {option.description}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
                      {option.badge && (
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase px-1.5 sm:px-2 py-0.5 rounded-full bg-[#9E4624]/10 text-[#9E4624] border border-[#9E4624]/20">
                          {option.badge}
                        </span>
                      )}
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#9E4624] stroke-[2.5]" />
                      ) : (
                        <div className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
