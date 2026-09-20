"use client";

import { useRef, useEffect } from "react";
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
  const dockRef = useRef<HTMLDivElement>(null);

  const scrollToCenter = (element: HTMLElement | null) => {
    if (!element || !dockRef.current) return;
    const container = dockRef.current;
    const elementLeft = element.offsetLeft;
    const elementWidth = element.offsetWidth;
    const containerWidth = container.offsetWidth;

    const targetScrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

    container.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (dockRef.current) {
      const activeButton = dockRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeButton) {
        scrollToCenter(activeButton);
      }
    }
  }, [active]);

  return (
    <div className="flex justify-center mb-16 px-4 max-w-full">
      <div
        ref={dockRef}
        className="border border-adidaya-red rounded-full p-2 flex gap-2 overflow-x-auto no-scrollbar max-w-full relative"
      >
        {tabs.map((t) => {
          const isActive = active === t.value;

          return (
            <button
              key={t.value}
              data-active={isActive}
              onClick={(e) => {
                onChange?.(t.value);
                scrollToCenter(e.currentTarget);
              }}
              className={cn(
                "relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none shrink-0",
                isActive
                  ? "text-white font-bold"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
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

