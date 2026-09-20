"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

export default function StatsInsights() {
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
        .from("insight") // 🔥 TABEL BENAR
        .select("id, status, published_at");

      if (!error && data) {
        const total = data.length;

        // STATUS PUBLISHED KETIKA:
        // - status == "published"
        // - OR published_at != null
        const published = data.filter(
          (d) => d.status === "published" || d.published_at
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
      className="rounded-3xl bg-[#0b0b0b] border border-gray-800/60 px-6 py-5 flex flex-col justify-between"
    >
      <div>
        <p className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
          Insight
        </p>
        <h2 className="mt-2 text-lg font-semibold text-gray-100">
          Insights Overview
        </h2>

        {stats.loading ? (
          <p className="mt-3 text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="mt-3 space-y-1 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Total</span>
              <span className="text-gray-100 font-semibold">{stats.total}</span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Published</span>
              <span className="font-semibold text-emerald-300">
                {stats.published}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-gray-400">Draft</span>
              <span className="font-semibold text-gray-300">
                {stats.draft}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-between items-center">
        <button
          onClick={() => router.push("/admin/insight")}
          className="rounded-full bg-white px-5 py-2 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white"
        >
          Manage Insights
        </button>
        <button
          onClick={() => window.open("/insights", "_blank")}
          className="text-[11px] uppercase tracking-[0.16em] text-gray-500 hover:text-adidaya-red"
        >
          Preview
        </button>
      </div>
    </motion.div>
  );
}
