import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-adidaya-border py-10 px-6">
      <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">

        {/* =========================================================
           DESKTOP LEFT (Logo + Tagline) — unchanged
        ========================================================= */}
        <div className="hidden md:flex items-center gap-3">
          <Image
            src="/logo-adidaya-red.svg"
            alt="Adidaya Logo"
            width={28}
            height={28}
          />

          <div className="flex flex-col">
            <p className="text-body font-semibold text-adidaya-text-muted">
              <span className="font-bold">adidaya</span>
              <span className="font-light">studio</span>
            </p>

            <p className="text-xs text-adidaya-text-muted">
              architecture • construction • development
            </p>
          </div>
        </div>

        {/* =========================================================
           DESKTOP MIDDLE (icons)
        ========================================================= */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="https://instagram.com/adidayastudio"
            target="_blank"
            className="text-adidaya-text-muted hover:text-adidaya-red transition-colors"
          >
            <Instagram size={20} />
          </Link>

          <Link
            href="mailto:adidayastudio@gmail.com"
            className="text-adidaya-text-muted hover:text-adidaya-red transition-colors"
          >
            <Mail size={20} />
          </Link>
        </div>

        {/* =========================================================
           DESKTOP RIGHT (unchanged)
        ========================================================= */}
        <div className="hidden md:block text-right text-body-sm text-adidaya-text-muted leading-tight">
          <p>© {currentYear} PT Mahardika Adidaya</p>
          <span className="text-xs">All rights reserved</span>
        </div>

        {/* =========================================================
           MOBILE VERSION — FULL VERTICAL STACK
        ========================================================= */}
        <div className="md:hidden flex flex-col items-center text-center gap-3">

          {/* Logo */}
          <Image
            src="/logo-adidaya-red.svg"
            alt="Adidaya Logo"
            width={32}
            height={32}
          />

          {/* Name */}
          <p className="text-body font-semibold text-adidaya-text-muted">
            <span className="font-bold">adidaya</span>
            <span className="font-light">studio</span>
          </p>

          {/* Tagline */}
          <p className="text-xs text-adidaya-text-muted">
            architecture • construction • development
          </p>

          {/* Spacer */}
          <div className="h-2" />

          {/* Copyright */}
          <p className="text-body-sm opacity-80">© {currentYear} PT Mahardika Adidaya</p>
          <p className="text-xs opacity-70">All rights reserved</p>
        </div>

      </div>
    </footer>
  );
}
