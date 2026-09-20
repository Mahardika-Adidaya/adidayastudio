"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, User } from "lucide-react";
import { motion } from "framer-motion";
import MobileMenu from "./MobileMenu";
import { cn } from "@/lib/cn";

const navItems = [
  { href: "/", label: "Intro" },
  { href: "/studio", label: "Studio" },
  { href: "/projects", label: "Projects" },
  { href: "/insights", label: "Insights" },
  { href: "/networks", label: "Networks" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname === href || pathname?.startsWith(href + "/");
  };

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

          {/* Right Section: Desktop Nav + Login Button (Mepet Kanan) */}
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

            {/* Desktop Login Button (Bulat Sempurna / Circle) */}
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
      />
    </>
  );
}
