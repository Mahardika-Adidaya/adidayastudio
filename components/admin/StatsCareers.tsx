"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { Briefcase, ExternalLink, ArrowRight } from "lucide-react";

export default function StatsCareers() {
  const router = useRouter();

  const [stats, setStats] = useState({
    total: 0,
    published: 0,
    draft: 0,
    loading: true,
  });

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from("jobs")
        .select("id, published, status");

      if (!error && data) {
        const total = data.length;

        const published = data.filter(
          (d) => d.published === true || d.status === "published"
        ).length;

        const draft = total - published;

        setStats({ total, published, draft, loading: false });
      }
    }

    load();
  }, []);

  return (
    <motion.div
      layout
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all group relative overflow-hidden"
    >
      {/* ===== KOLOM KIRI: ICON, JUDUL, SUBTITLE, STATS ===== */}
      <div className="flex items-start gap-4 sm:gap-5 flex-1 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:border-adidaya-red/40 group-hover:text-adidaya-red transition-colors shrink-0">
          <Briefcase size={20} strokeWidth={1.5} />
        </div>

        <div className="flex flex-col min-w-0">
          <span className="text-[10px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono mb-1">
            Network • Career
          </span>
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Careers Overview
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-adidaya-text-muted leading-relaxed">
            Job postings, studio openings, internships, and applicant pipelines.
          </p>

          {/* KETERANGAN STATS DI BAWAHNYA */}
          <div className="mt-4">
            {stats.loading ? (
              <div className="flex items-center gap-2 text-xs text-adidaya-text-muted">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
                <span className="font-mono text-[11px] tracking-wider uppercase">Loading metrics...</span>
              </div>
            ) : (
              <div className="inline-flex flex-wrap items-center rounded-full bg-white/[0.03] border border-white/10 p-1 divide-x divide-white/10 shadow-sm">
                <div className="flex items-center gap-2 px-3.5 py-1">
                  <span className="text-[11px] font-mono uppercase tracking-wider text-adidaya-text-muted">Total Openings</span>
                  <span className="font-semibold text-white font-mono text-xs">{stats.total}</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-adidaya-text-muted">Published</span>
                  <span className="font-semibold text-emerald-400 font-mono text-xs">{stats.published}</span>
                </div>

                <div className="flex items-center gap-2 px-3.5 py-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400/80 shadow-[0_0_6px_rgba(251,191,36,0.4)]" />
                  <span className="text-[11px] font-mono uppercase tracking-wider text-adidaya-text-muted">Draft</span>
                  <span className="font-semibold text-zinc-300 font-mono text-xs">{stats.draft}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===== KOLOM KANAN: TOMBOL MANAGE & PREVIEW ===== */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={() => router.push("/admin/career")}
          className="rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white transition-all duration-200 flex items-center gap-1.5 shadow-md group/btn"
        >
          <span>Manage Careers</span>
          <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover/btn:translate-x-0.5" />
        </button>

        <button
          onClick={() => window.open("/networks", "_blank")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
        >
          <span>Preview</span>
          <ExternalLink size={12} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

