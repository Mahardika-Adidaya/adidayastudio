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
      whileHover={{ y: -3 }}
      transition={{ duration: 0.2 }}
      className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 flex flex-col justify-between shadow-[0_0_50px_rgba(0,0,0,0.5)] hover:border-white/20 transition-all group relative overflow-hidden"
    >
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="w-10 h-10 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white group-hover:border-adidaya-red/40 group-hover:text-adidaya-red transition-colors">
            <Briefcase size={18} strokeWidth={1.5} />
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Network • Career
          </span>
        </div>

        <h2 className="text-lg font-semibold text-white tracking-tight">
          Careers Overview
        </h2>

        {stats.loading ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-adidaya-text-muted">
            <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
            <span>Loading metrics...</span>
          </div>
        ) : (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between py-1.5 px-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-adidaya-text-muted">Total Openings</span>
              <span className="text-sm font-semibold text-white font-mono">{stats.total}</span>
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-adidaya-text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>Published</span>
              </span>
              <span className="text-sm font-semibold text-emerald-400 font-mono">
                {stats.published}
              </span>
            </div>

            <div className="flex items-center justify-between py-1.5 px-3 rounded-2xl bg-white/[0.02] border border-white/5">
              <span className="text-xs text-adidaya-text-muted flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400/70" />
                <span>Draft</span>
              </span>
              <span className="text-sm font-semibold text-gray-400 font-mono">
                {stats.draft}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 pt-5 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 relative z-10">
        <button
          onClick={() => router.push("/admin/career")}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white transition-all duration-200 flex items-center gap-1.5 shadow-md group/btn"
        >
          <span>Manage Careers</span>
          <ArrowRight size={13} strokeWidth={2} className="transition-transform group-hover/btn:translate-x-0.5" />
        </button>

        <button
          onClick={() => window.open("/networks", "_blank")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/20 hover:bg-white/[0.08] transition-all flex items-center gap-1.5"
        >
          <span>Preview</span>
          <ExternalLink size={12} strokeWidth={1.5} />
        </button>
      </div>
    </motion.div>
  );
}

