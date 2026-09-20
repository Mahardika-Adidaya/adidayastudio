import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  PROJECT_CATEGORIES,
  PROJECT_SUBCATEGORIES,
} from "@/data/projectCategories";

export type Filter = {
  category: string | null;
  subcategory: string | null;
};

type FilterBarProps = {
  onFilterChange: (filter: Filter) => void;
  initialFilter?: Filter;
};

export default function FilterBar({ onFilterChange, initialFilter }: FilterBarProps) {
  const [category, setCategory] = useState<string>("All");
  const [subcategory, setSubcategory] = useState<string>("All");

  useEffect(() => {
    onFilterChange({
      category: category === "All" ? null : category,
      subcategory: subcategory === "All" ? null : subcategory,
    });
  }, [category, subcategory, onFilterChange]);

  useEffect(() => {
    if (initialFilter) {
      if (initialFilter.category) setCategory(initialFilter.category);
      if (initialFilter.subcategory) setSubcategory(initialFilter.subcategory);
    }
  }, [initialFilter]);

  const categoriesWithAll = ["All", ...PROJECT_CATEGORIES];
  const subcategoriesWithAll = ["All", ...PROJECT_SUBCATEGORIES];

  return (
    <div className="flex flex-col items-center gap-6 w-full">
      <div className="border border-adidaya-red rounded-full p-2 flex gap-3 overflow-x-auto no-scrollbar max-w-full relative">
        {categoriesWithAll.map((cat) => {
          const isActive = category === cat;

          return (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setSubcategory("All");
              }}
              className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none
                ${isActive
                  ? "text-white"
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

      <div className="flex flex-wrap justify-center gap-6 text-sm mt-2">
        {subcategoriesWithAll.map((sub) => {
          const isActive = subcategory === sub;

          return (
            <button
              key={sub}
              onClick={() => setSubcategory(sub)}
              className={`
                transition-all
                ${isActive
                  ? "text-white font-semibold"
                  : "text-gray-400 hover:text-adidaya-red"
                }
              `}
            >
              {sub}
            </button>
          );
        })}
      </div>
    </div>
  );
}
