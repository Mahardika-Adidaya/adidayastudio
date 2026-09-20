"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function PaddingWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";
  
  // Identify detail pages (Projects & Insights) that need full-bleed top hero
  const isProjectDetail =
    Boolean(pathname?.startsWith("/projects/")) &&
    pathname !== "/projects" &&
    !pathname?.startsWith("/projects/category");
    
  const isInsightDetail =
    Boolean(pathname?.startsWith("/insights/")) &&
    pathname !== "/insights" &&
    !pathname?.startsWith("/insights/category") &&
    !pathname?.startsWith("/insights/tag");
    
  const isFullBleed = isHome || isProjectDetail || isInsightDetail;

  return (
    <main
      className={
        isHome
          ? "-mt-20 p-0 h-screen flex-1"
          : isFullBleed
          ? "-mt-20 p-0 flex-1"
          : "pt-10 flex-1 flex flex-col"
      }
    >
      {children}
    </main>
  );
}


