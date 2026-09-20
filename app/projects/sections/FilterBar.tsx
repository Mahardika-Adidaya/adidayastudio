"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Menu, Check, X } from "lucide-react";
import {
  PROJECT_CATEGORIES,
  PROJECT_SUBCATEGORIES,
} from "@/data/projectCategories";

export type Filter = {
  category: string | null;
  subcategory: string | null;
  search?: string;
};

type FilterBarProps = {
  onFilterChange: (filter: Filter) => void;
  initialFilter?: Filter;
};

export default function FilterBar({ onFilterChange, initialFilter }: FilterBarProps) {
  const [category, setCategory] = useState<string>("All");
  const [subcategory, setSubcategory] = useState<string>("All");
  const [search, setSearch] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isFilterOpen, setIsFilterOpen] = useState<boolean>(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const dockRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [dockHeight, setDockHeight] = useState<number>(54);

  // Synchronize search & filter circle size with exact red dock height
  useEffect(() => {
    const updateHeight = () => {
      if (dockRef.current) {
        setDockHeight(dockRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, []);

  // Notify parent on any filter change
  useEffect(() => {
    onFilterChange({
      category: category === "All" ? null : category,
      subcategory: subcategory === "All" ? null : subcategory,
      search: search.trim() || undefined,
    });
  }, [category, subcategory, search, onFilterChange]);

  // Sync initial filter from URL params
  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.category) setCategory(initialFilter.category);
      if (initialFilter.subcategory) setSubcategory(initialFilter.subcategory);
      if (initialFilter.search) {
        setSearch(initialFilter.search);
        setIsSearchOpen(true);
      }
    }
  }, [initialFilter]);

  // Focus input when search bar opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
        if (isSearchOpen && !search) {
          setIsSearchOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen, search]);

  const categoriesWithAll = ["All", ...PROJECT_CATEGORIES];
  const subcategoriesWithAll = ["All", ...PROJECT_SUBCATEGORIES];
  const isSubcategoryActive = subcategory !== "All";
  const isSearchActive = Boolean(search || isSearchOpen);

  return (
    <div ref={filterRef} className="relative w-full max-w-5xl mx-auto flex flex-col items-center z-30 px-4">
      
      {/* FILTER CONTROLS ROW */}
      <div className="flex items-center justify-center gap-2 w-full max-w-full">
        
        {/* 1. ORIGINAL RED CAPSULE DOCK */}
        <div
          ref={dockRef}
          className="border border-adidaya-red rounded-full p-2 flex gap-2 overflow-x-auto no-scrollbar max-w-full relative min-w-0"
        >
          {categoriesWithAll.map((cat) => {
            const isActive = category === cat;

            return (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  setSubcategory("All");
                }}
                className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none shrink-0 ${
                  isActive
                    ? "text-white font-bold"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="project-category-active"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                    className="absolute inset-0 bg-adidaya-red rounded-full -z-10 shadow-md shadow-red-900/40"
                  />
                )}
                <span>{cat}</span>
              </button>
            );
          })}
        </div>

        {/* 2. SEARCH BUTTON (PERFECT CIRCLE MATCHING DOCK HEIGHT 100%) */}
        <button
          onClick={() => {
            setIsSearchOpen((prev) => !prev);
            setIsFilterOpen(false);
          }}
          aria-label="Toggle search"
          style={{ width: dockHeight, height: dockHeight }}
          className={`rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 ${
            isSearchActive
              ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)]"
              : "border border-white/20 bg-white/[0.04] hover:border-white/40 hover:bg-white/[0.08]"
          }`}
        >
          <Search
            className={`w-5 h-5 transition-colors ${
              isSearchActive ? "text-adidaya-red" : "text-white/80"
            }`}
            strokeWidth={1.5}
          />
        </button>

        {/* 3. FILTER BUTTON (PERFECT CIRCLE MATCHING DOCK HEIGHT 100% WITH 3-BAR MENU ICON) */}
        <div className="relative shrink-0">
          <button
            onClick={() => {
              setIsFilterOpen((prev) => !prev);
            }}
            aria-label="Filter subcategories"
            style={{ width: dockHeight, height: dockHeight }}
            className={`rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 ${
              isSubcategoryActive || isFilterOpen
                ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)]"
                : "border border-white/20 bg-white/[0.04] hover:border-white/40 hover:bg-white/[0.08]"
            }`}
          >
            <Menu
              className={`w-5 h-5 transition-colors ${
                isSubcategoryActive || isFilterOpen ? "text-adidaya-red" : "text-white/80"
              }`}
              strokeWidth={1.5}
            />
          </button>

          {/* GLASSY PULLDOWN DROPDOWN MENU */}
          <AnimatePresence>
            {isFilterOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.96 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="absolute right-0 top-full mt-3 w-60 sm:w-64 bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl shadow-black/80 z-50 max-w-[calc(100vw-32px)]"
              >
                <div className="max-h-72 overflow-y-auto space-y-1.5 no-scrollbar p-0.5">
                  {subcategoriesWithAll.map((sub) => {
                    const isActive = subcategory === sub;
                    return (
                      <button
                        key={sub}
                        onClick={() => {
                          setSubcategory(sub);
                          setIsFilterOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-between transition-colors whitespace-nowrap ${
                          isActive
                            ? "text-adidaya-red font-semibold bg-white/[0.08]"
                            : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                        }`}
                      >
                        <span>{sub === "All" ? "All Subcategories" : sub}</span>
                        {isActive && <Check className="w-4 h-4 text-adidaya-red shrink-0 ml-3" />}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* FLOATING GLASS SEARCH BAR */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute top-full mt-3 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:w-full max-w-lg z-50 pointer-events-auto"
          >
            <div className="flex items-center w-full bg-white/[0.05] border border-white/10 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg shadow-black/20">
              <Search className="w-4 h-4 text-adidaya-red shrink-0 mr-3" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects..."
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder:text-adidaya-text-muted outline-none"
              />
              <button
                onClick={() => {
                  setSearch("");
                  setIsSearchOpen(false);
                }}
                aria-label="Close search"
                className="p-1 text-adidaya-text-muted hover:text-white rounded-full hover:bg-white/10 transition shrink-0 select-none"
              >
                <X className="w-4 h-4" strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}


