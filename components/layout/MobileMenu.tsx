"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, Instagram, Mail, User, LayoutDashboard, LogOut } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/cn";
import { ProfileType } from "@/hooks/useUserProfile";

interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  navItems: { label: string; href: string }[];
  profile?: ProfileType | null;
  onSignOut?: () => void;
}

export default function MobileMenu({
  open,
  onClose,
  navItems,
  profile,
  onSignOut,
}: MobileMenuProps) {
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

            {/* AUTH SECTION FOR MOBILE */}
            <div className="pt-6 mt-6 border-t border-white/10 flex flex-col gap-2.5">
              {profile ? (
                <>
                  <div className="px-4 py-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center gap-3 mb-1">
                    <div
                      className="w-10 h-10 rounded-full overflow-hidden shrink-0 flex items-center justify-center border border-white/20 shadow-md"
                      style={!profile.image_url ? { backgroundColor: "#e53935" } : undefined}
                    >
                      {profile.image_url ? (
                        <Image
                          src={profile.image_url}
                          alt={profile.name || "Avatar"}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-white font-semibold text-xs tracking-wider select-none">
                          {profile.name
                            ? profile.name
                                .split(" ")
                                .filter(Boolean)
                                .map((n) => n[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()
                            : <User size={16} strokeWidth={1.5} className="text-white" />}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">
                        {profile.name || "Administrator"}
                      </p>
                      <p className="text-[10px] text-adidaya-text-muted uppercase tracking-wider font-mono">
                        {profile.role || "staff"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/admin"
                    onClick={onClose}
                    className={cn(
                      "text-sm py-2.5 px-4 rounded-full flex items-center gap-3 transition-all select-none",
                      pathname === "/admin"
                        ? "text-white bg-white/15 border border-white/15 font-semibold backdrop-blur-md shadow-sm"
                        : "text-adidaya-text-muted hover:text-white hover:bg-white/[0.08] hover:border-white/10 border border-transparent font-medium"
                    )}
                  >
                    <LayoutDashboard size={16} strokeWidth={1.5} />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/admin/profile"
                    onClick={onClose}
                    className={cn(
                      "text-sm py-2.5 px-4 rounded-full flex items-center gap-3 transition-all select-none",
                      pathname === "/admin/profile"
                        ? "text-white bg-white/15 border border-white/15 font-semibold backdrop-blur-md shadow-sm"
                        : "text-adidaya-text-muted hover:text-white hover:bg-white/[0.08] hover:border-white/10 border border-transparent font-medium"
                    )}
                  >
                    <User size={16} strokeWidth={1.5} />
                    <span>Edit Profile</span>
                  </Link>

                  <button
                    onClick={() => {
                      onClose();
                      onSignOut?.();
                    }}
                    className="text-sm py-2.5 px-4 rounded-full flex items-center gap-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium text-left border border-transparent select-none mt-1"
                  >
                    <LogOut size={16} strokeWidth={1.5} />
                    <span>Sign Out</span>
                  </button>
                </>
              ) : (
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
              )}
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

