"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, ExternalLink, ArrowRight } from "lucide-react";

export default function HomeHeroCard() {
  const router = useRouter();

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all group relative overflow-hidden"
    >
      {/* ===== KOLOM KIRI: ICON, JUDUL, SUBTITLE ===== */}
      <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:border-adidaya-red/40 group-hover:text-adidaya-red transition-colors shrink-0">
          <ImageIcon size={20} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono mb-1">
            Home
          </span>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Hero Image
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-adidaya-text-muted leading-relaxed">
            Set and update the main hero image and featured cover on the homepage.
          </p>
        </div>
      </div>

      {/* ===== KOLOM KANAN: TOMBOL EDIT & PREVIEW ===== */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push("/admin/home-hero")}
          className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white transition-all duration-200 flex items-center gap-1.5 shadow-md group/btn"
        >
          <span>Edit Hero Image</span>
          <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover/btn:translate-x-0.5" />
        </button>

        <button
          onClick={() => window.open("/", "_blank")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
        >
          <span>Preview</span>
          <ExternalLink size={12} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

