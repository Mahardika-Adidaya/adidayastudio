"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { cn } from "@/lib/cn";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  navItems: { label: string; href: string }[];
}

export default function MobileMenu({ open, onClose, navItems }: MobileMenuProps) {
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  return (
    <div
      className={cn(
        "fixed inset-0 z-[99999] transition-all duration-300",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
    >
      {/* BACKDROP */}
      <div
        onClick={onClose}
        className={cn(
          "absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* DRAWER */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[75%] max-w-[320px] bg-[#0c0c0c] border-l border-adidaya-border p-6 flex flex-col justify-between transition-transform duration-300 shadow-2xl",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div>
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/10">
            <p className="text-h3 font-semibold tracking-wider text-white">Menu</p>

            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 text-adidaya-text-muted hover:text-white transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          <nav className="flex flex-col gap-4">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "text-body py-2 px-3 rounded-lg flex items-center justify-between transition-colors",
                    active
                      ? "text-white bg-white/10 font-medium"
                      : "text-adidaya-text-muted hover:text-white hover:bg-white/5"
                  )}
                >
                  <span>{item.label}</span>
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-adidaya-red" />}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-6 border-t border-white/10 text-xs text-adidaya-text-muted">
          <p>© {new Date().getFullYear()} Adidaya Studio</p>
        </div>
      </div>
    </div>
  );
}
