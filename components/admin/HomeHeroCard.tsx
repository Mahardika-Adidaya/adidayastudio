"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Image as ImageIcon, ExternalLink, ArrowRight } from "lucide-react";

export default function HomeHeroCard() {
  const router = useRouter();

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all group relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:border-adidaya-red/40 group-hover:text-adidaya-red transition-colors">
            <ImageIcon size={18} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Home
          </span>
        </div>

        <h2 className="text-lg font-semibold text-white tracking-tight">
          Hero Image
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-adidaya-text-muted leading-relaxed">
          Set and update the main hero image and featured cover on the homepage.
        </p>
      </div>

      <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center gap-3 relative z-10">
        <button
          onClick={() => router.push("/admin/home-hero")}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white transition-all duration-200 flex items-center gap-1.5 shadow-md group/btn"
        >
          <span>Edit Hero Image</span>
          <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover/btn:translate-x-0.5" />
        </button>

        <button
          onClick={() => window.open("/", "_blank")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
        >
          <span>Preview</span>
          <ExternalLink size={12} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

