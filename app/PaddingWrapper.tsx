"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export default function PaddingWrapper({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <main className={isHome ? "-mt-20 p-0 h-screen" : "pt-10"}>
      {children}
    </main>
  );
}


