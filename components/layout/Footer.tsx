import Link from "next/link";
import Image from "next/image";
import { Instagram, Mail } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-adidaya-border py-6 md:py-8 px-4 sm:px-6">
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-2 sm:gap-6">

        {/* LEFT: Logo + Brand */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Image
            src="/logo-adidaya-red.svg"
            alt="Adidaya Logo"
            width={26}
            height={26}
            className="w-6 h-6 sm:w-7 sm:h-7 object-contain"
          />

          <div className="flex flex-col">
            <p className="text-xs sm:text-sm md:text-body font-semibold text-adidaya-text-muted leading-tight">
              <span className="font-bold">adidaya</span>
              <span className="font-light">studio</span>
            </p>

            <p className="hidden md:block text-xs text-adidaya-text-muted">
              architecture • construction • development
            </p>
          </div>
        </div>

        {/* MIDDLE: Social Icons */}
        <div className="flex items-center gap-3 sm:gap-5 md:gap-6 shrink-0">
          <Link
            href="https://instagram.com/adidayastudio"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Instagram"
            className="text-adidaya-text-muted hover:text-adidaya-red transition-colors p-1"
          >
            <Instagram className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={1.5} />
          </Link>

          <Link
            href="mailto:adidayastudio@gmail.com"
            aria-label="Email"
            className="text-adidaya-text-muted hover:text-adidaya-red transition-colors p-1"
          >
            <Mail className="w-[18px] h-[18px] sm:w-5 sm:h-5" strokeWidth={1.5} />
          </Link>
        </div>

        {/* RIGHT: Copyright */}
        <div className="text-right text-[10px] sm:text-xs md:text-body-sm text-adidaya-text-muted leading-tight shrink-0">
          <p>© {currentYear} PT Mahardika Adidaya</p>
          <span className="hidden sm:inline text-[10px] md:text-xs opacity-75">All rights reserved</span>
        </div>

      </div>
    </footer>
  );
}


