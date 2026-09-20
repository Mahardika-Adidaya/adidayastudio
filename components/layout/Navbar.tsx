"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, User, LayoutDashboard, LogOut } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import MobileMenu from "./MobileMenu";
import { cn } from "@/lib/cn";
import useUserProfile from "@/hooks/useUserProfile";
import { supabase } from "@/lib/supabaseClient";

const navItems = [
  { href: "/", label: "Intro" },
  { href: "/studio", label: "Studio" },
  { href: "/projects", label: "Projects" },
  { href: "/insights", label: "Insights" },
  { href: "/networks", label: "Networks" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();

  const { profile, loading } = useUserProfile();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Handle Logout
  async function handleSignOut() {
    setUserDropdownOpen(false);
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <header className="sticky top-0 left-0 right-0 w-full z-[999] py-5 transition-all duration-300 pointer-events-none">
        <div className="w-full max-w-5xl mx-auto px-6 flex items-center justify-between pointer-events-auto">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 group transition-opacity hover:opacity-90"
          >
            <Image
              src="/logo-adidaya-red.svg"
              alt="Adidaya Studio"
              width={24}
              height={24}
              priority
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />

            <span className="text-label tracking-[0.2em] uppercase text-adidaya-text-muted group-hover:text-white transition-colors duration-200">
              Adidaya Studio
            </span>
          </Link>

          {/* Right Section: Desktop Nav + Login/Avatar Button (Mepet Kanan) */}
          <div className="hidden md:flex items-center gap-2.5">
            {/* Desktop Nav with Sliding Glass Pill (100% ORIGINAL) */}
            <nav className="flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md relative shadow-lg shadow-black/20">
              {navItems.map((item) => {
                const active = isItemActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`
                      relative px-4 py-1.5 rounded-full text-body-sm transition-colors duration-200 z-10 select-none
                      ${
                        active
                          ? "text-white font-medium"
                          : "text-adidaya-text-muted hover:text-white"
                      }
                    `}
                  >
                    {active && (
                      <motion.div
                        layoutId="active-nav-pill"
                        transition={{ type: "spring", stiffness: 380, damping: 30 }}
                        className="absolute inset-0 bg-white/10 backdrop-blur-md border border-white/20 rounded-full -z-10"
                      />
                    )}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Desktop Auth Button (Avatar jika Logged In, Login jika Logged Out) */}
            {!loading && profile ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User Account Menu"
                  style={!profile.image_url ? { backgroundColor: "#e53935" } : undefined}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border shadow-lg shadow-black/20 transition-all duration-200 group select-none shrink-0 relative overflow-hidden",
                    userDropdownOpen || pathname?.startsWith("/admin")
                      ? "border-white/40 shadow-[0_0_15px_rgba(229,57,53,0.35)]"
                      : "border-white/15 hover:border-white/30"
                  )}
                >
                  {profile.image_url ? (
                    <Image
                      src={profile.image_url}
                      alt={profile.name || "User Avatar"}
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
                </button>

                {/* DROPDOWN MENU (TRANSLUCENT FROSTED GLASS) */}
                <AnimatePresence>
                  {userDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      style={{
                        top: "calc(100% + 18px)",
                        backgroundColor: "rgba(10, 10, 10, 0.45)",
                        backdropFilter: "blur(24px)",
                        WebkitBackdropFilter: "blur(24px)",
                      }}
                      className="absolute right-0 w-64 border border-white/10 rounded-3xl p-3 shadow-[0_0_60px_rgba(0,0,0,0.9)] flex flex-col gap-1.5 z-50"
                    >
                      {/* USER INFO HEADER */}
                      <div className="px-3 py-2.5 border-b border-white/10 mb-1 flex flex-col items-start">
                        <p className="text-sm font-semibold text-white truncate max-w-full">
                          {profile.name || "Administrator"}
                        </p>
                        <p className="text-xs text-adidaya-text-muted truncate max-w-full mt-0.5">
                          {profile.email}
                        </p>
                        <div className="mt-2">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full bg-white/[0.08] border border-white/10 text-[10px] text-gray-300 font-medium tracking-wider uppercase font-mono">
                            {profile.role || "staff"}
                          </span>
                        </div>
                      </div>

                      {/* LINKS (FULL PILL SHAPE) */}
                      <Link
                        href="/admin"
                        onClick={() => setUserDropdownOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-full text-xs transition-all select-none",
                          pathname === "/admin"
                            ? "text-white bg-white/15 border border-white/15 font-semibold backdrop-blur-md shadow-sm"
                            : "text-adidaya-text-muted hover:text-white hover:bg-white/[0.08] hover:border-white/10 border border-transparent font-medium"
                        )}
                      >
                        <LayoutDashboard size={15} strokeWidth={1.5} />
                        <span>Dashboard</span>
                      </Link>

                      <Link
                        href="/admin/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className={cn(
                          "flex items-center gap-3 px-4 py-2.5 rounded-full text-xs transition-all select-none",
                          pathname === "/admin/profile"
                            ? "text-white bg-white/15 border border-white/15 font-semibold backdrop-blur-md shadow-sm"
                            : "text-adidaya-text-muted hover:text-white hover:bg-white/[0.08] hover:border-white/10 border border-transparent font-medium"
                        )}
                      >
                        <User size={15} strokeWidth={1.5} />
                        <span>Profile</span>
                      </Link>

                      {/* SIGN OUT (FULL PILL SHAPE) */}
                      <div className="border-t border-white/10 mt-1 pt-1.5">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-full text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all font-medium text-left border border-transparent select-none"
                        >
                          <LogOut size={15} strokeWidth={1.5} />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              /* Desktop Login Button */
              <Link
                href="/login"
                aria-label="Login / Account"
                title="Login Account"
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border shadow-lg shadow-black/20 backdrop-blur-md transition-all duration-200 group select-none shrink-0",
                  pathname === "/login"
                    ? "bg-white/15 border-white/25 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                    : "bg-white/[0.05] border-white/10 text-adidaya-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.08]"
                )}
              >
                <User
                  size={16}
                  strokeWidth={1.5}
                  className="transition-transform duration-200 group-hover:scale-110 text-adidaya-text-muted group-hover:text-white"
                />
              </Link>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setOpen(true)}
            aria-label="Open Navigation Menu"
            className="md:hidden p-2 text-adidaya-text-muted hover:text-white transition-colors"
          >
            <Menu size={22} />
          </button>
        </div>
      </header>

      {/* MOBILE MENU (drawer) */}
      <MobileMenu
        open={open}
        onClose={() => setOpen(false)}
        navItems={navItems}
        profile={profile}
        onSignOut={handleSignOut}
      />
    </>
  );
}

