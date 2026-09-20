"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Instagram, Mail, User } from "lucide-react";
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
          "absolute inset-0 bg-black/40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0"
        )}
      />

      {/* DRAWER (DARK TRANSLUCENT FROSTED GLASS) */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[80%] max-w-[320px] bg-black/45 backdrop-blur-2xl border-l border-white/10 p-6 flex flex-col justify-between transition-transform duration-300 ease-out shadow-[0_0_60px_rgba(0,0,0,0.9)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div>
          {/* HEADER */}
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-white/10">
            <p className="text-xl font-semibold tracking-tight text-white">Menu</p>

            <button
              onClick={onClose}
              aria-label="Close menu"
              className="p-2 -mr-1 rounded-full text-adidaya-text-muted hover:text-white hover:bg-white/10 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {/* NAV ITEMS AS PILLS */}
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => {
              const active = isItemActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "text-sm py-3 px-5 rounded-full flex items-center justify-between transition-all duration-200 select-none",
                    active
                      ? "text-white bg-white/15 border border-white/15 font-semibold backdrop-blur-md shadow-sm"
                      : "text-adidaya-text-muted hover:text-white hover:bg-white/[0.08] hover:border-white/10 border border-transparent font-medium"
                  )}
                >
                  <span>{item.label}</span>
                  {active && (
                    <span className="w-1.5 h-1.5 rounded-full bg-adidaya-red shadow-[0_0_8px_#e53935]" />
                  )}
                </Link>
              );
            })}

            {/* LOGIN BUTTON FOR MOBILE */}
            <div className="pt-2 mt-2 border-t border-white/10">
              <Link
                href="/login"
                onClick={onClose}
                className={cn(
                  "text-sm py-3 px-5 rounded-full flex items-center gap-3 transition-all duration-200 select-none",
                  pathname === "/login"
                    ? "text-white bg-white/15 border border-white/15 font-semibold backdrop-blur-md shadow-sm"
                    : "text-adidaya-text-muted hover:text-white hover:bg-white/[0.08] hover:border-white/10 border border-transparent font-medium"
                )}
              >
                <User size={16} strokeWidth={1.5} />
                <span>Login Account</span>
              </Link>
            </div>
          </nav>
        </div>

        {/* FOOTER */}
        <div className="pt-6 border-t border-white/10 flex flex-col gap-4">
          {/* SOCIAL ICONS */}
          <div className="flex items-center gap-3">
            <Link
              href="https://instagram.com/adidayastudio"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="p-2 rounded-full bg-white/[0.05] border border-white/10 text-adidaya-text-muted hover:text-white hover:bg-white/10 hover:border-white/20 transition-all select-none"
            >
              <Instagram size={18} strokeWidth={1.5} />
            </Link>

            <Link
              href="mailto:adidayastudio@gmail.com"
              aria-label="Email"
              className="p-2 rounded-full bg-white/[0.05] border border-white/10 text-adidaya-text-muted hover:text-white hover:bg-white/10 hover:border-white/20 transition-all select-none"
            >
              <Mail size={18} strokeWidth={1.5} />
            </Link>
          </div>

          <p className="text-xs text-adidaya-text-muted/80">
            © {new Date().getFullYear()} Adidaya Studio
          </p>
        </div>
      </div>
    </div>
  );
}

