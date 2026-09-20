"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

interface Tab {
  label: string;
  value: string;
  href?: string;
}

interface PublicTabsProps {
  tabs: Tab[];
  active: string;
  onChange?: (value: string) => void;
}

export function PublicTabs({ tabs, active, onChange }: PublicTabsProps) {
  return (
    <div className="flex justify-center mb-16">
      <div className="flex gap-2 rounded-full px-2 py-2 border border-adidaya-red bg-black/40 backdrop-blur-xl overflow-x-auto no-scrollbar max-w-full relative">
        {tabs.map((t) => {
          const isActive = active === t.value;

          return (
            <button
              key={t.value}
              onClick={() => onChange?.(t.value)}
              className={cn(
                "relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none",
                isActive
                  ? "text-white font-extrabold"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300 hover:text-black"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="studio-public-tab-active"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  className="absolute inset-0 bg-adidaya-red rounded-full -z-10 shadow-md shadow-red-900/40"
                />
              )}
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
