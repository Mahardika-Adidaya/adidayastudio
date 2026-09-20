"use client";

import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

export const INSIGHT_CATEGORIES = [
  "Studio Stories",
  "Design Dialogues",
  "Craft & Construction",
  "Business Briefings",
  "Research Records",
  "News & Notes",
];

type FilterBarInsightProps = {
  category: string;
  onCategoryChange: (c: string) => void;
  search: string;
  onSearchChange: (s: string) => void;
};

export default function FilterBarInsight({
  category,
  onCategoryChange,
  search,
  onSearchChange,
}: FilterBarInsightProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const categoriesWithAll = ["All", ...INSIGHT_CATEGORIES];

  return (
    <div className="flex flex-col items-center gap-6 w-full mt-10">

      {/* CATEGORY TABS */}
      <div className="border border-adidaya-red rounded-full p-2 flex gap-3 overflow-x-auto no-scrollbar max-w-full relative">
        {categoriesWithAll.map((cat) => {
          const isActive = category === cat;

          return (
            <button
              key={cat}
              onClick={() => onCategoryChange(cat)}
              className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none
                ${
                  isActive
                    ? "text-white"
                    : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                }
              `}
            >
              {isActive && (
                <motion.div
                  layoutId="insight-category-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 bg-adidaya-red rounded-full -z-10 shadow-md shadow-red-900/40"
                />
              )}
              <span>{cat}</span>
            </button>
          );
        })}
      </div>

      {/* SEARCH BOX */}
      <div className="w-full max-w-4xl px-6">
        <div className="relative">
          <Search className="absolute left-5 top-3.5 h-5 w-5 text-gray-400" />

          {mounted && (
            <input
              type="text"
              placeholder="Search insight..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-neutral-900 border border-neutral-700
                         text-gray-200 rounded-full px-14 py-3 outline-none
                         focus:border-adidaya-red transition"
            />
          )}
        </div>
      </div>
    </div>
  );
}
