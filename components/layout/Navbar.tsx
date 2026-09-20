"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { motion } from "framer-motion";
import MobileMenu from "./MobileMenu";

const navItems = [
  { href: "/", label: "Intro" },
  { href: "/studio", label: "Studio" },
  { href: "/projects", label: "Project" },
  { href: "/insight", label: "Insight" },
  { href: "/network", label: "Network" },
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

          {/* Desktop Nav with Sliding Glass Pill */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-full bg-white/[0.05] border border-white/10 backdrop-blur-md relative shadow-lg shadow-black/20">
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
