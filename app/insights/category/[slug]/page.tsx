"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import Link from "next/link";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

type Insight = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  category: string;
  hero_image_url: string | null;
  published_at: string | null;
  created_at: string;
  reading_time: number | null;
};

export default function CategoryPage() {
  const router = useRouter();
  const { slug } = useParams();
  const currentCategory = decodeURIComponent(slug as string);

  const [insights, setInsights] = useState<Insight[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  /** LOAD AVAILABLE CATEGORIES */
  async function loadCategories() {
    const { data } = await supabase
      .from("insight")
      .select("category")
      .eq("status", "published");

    const list = Array.from(
      new Set((data || []).map((i) => i.category))
    );

    setCategories(list);
  }

  /** LOAD INSIGHTS IN THIS CATEGORY */
  async function loadInsights() {
    setLoading(true);

    const { data } = await supabase
      .from("insight")
      .select("*")
      .eq("category", currentCategory)
      .eq("status", "published")
      .order("published_at", { ascending: false });

    setInsights(data || []);
    setLoading(false);
  }

  useEffect(() => {
    loadCategories();
    loadInsights();
  }, [slug]);

  /** CHANGE CATEGORY ACTION */
  const handleCategoryChange = (value: string) => {
    router.push(`/insights/category/${value}`);
  };

return (
  <div className="min-h-screen bg-black pt-8 pb-16 text-white">
    <div className="mx-auto max-w-5xl px-6">

      {/* HEADER */}
      <p className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-2">
        INSIGHTS • CATEGORY
      </p>

      <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
        <h1 className="text-4xl font-bold">
          <span className="text-adidaya-red mr-1">*</span>
          Category: {currentCategory}
        </h1>

        {/* STYLED DROPDOWN */}
        <div className="relative">
          <select
            value={currentCategory}
            onChange={(e) => handleCategoryChange(e.target.value)}
            className="
              appearance-none
              bg-[#111]
              border border-white/15
              text-gray-200 text-sm
              rounded-full px-6 py-2 pr-10
              focus:outline-none
              focus:border-adidaya-red
              transition
              cursor-pointer
            "
          >
            {categories.map((c) => (
              <option
                key={c}
                value={c}
                className="bg-black text-white"
              >
                {c}
              </option>
            ))}
          </select>

          {/* CUSTOM CARET */}
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-gray-400"
            >
                <polyline points="6 9 12 15 18 9" />
            </svg>
            </span>

        </div>
      </div>

      {/* COUNT */}
      <p className="text-gray-500 text-sm mb-8">
        {insights.length} insight{insights.length > 1 ? "s" : ""} found
      </p>

      {/* GRID LIST – 3 COLUMNS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {insights.map((insight) => {
          const dateObj = new Date(insight.published_at || insight.created_at);
          const formattedDate = format(dateObj, "d MMM yyyy", {
            locale: localeID,
          });

          return (
            <Link
              key={insight.id}
              href={`/insights/${insight.slug}`}
              className="rounded-3xl overflow-hidden bg-[#121212] 
                border border-white/5 hover:border-white/20
                hover:bg-[#1a1a1a] transition duration-300"
            >
              <img
                src={insight.hero_image_url || ""}
                className="w-full h-40 object-cover"
              />

              <div className="p-5">
                <span
                  className="inline-flex px-4 py-1 mb-3
                    bg-adidaya-red rounded-full
                    text-[10px] font-semibold uppercase tracking-[0.18em]"
                >
                  {insight.category}
                </span>

                <h2 className="text-lg font-semibold leading-tight mb-2">
                  {insight.title}
                </h2>

                <div className="flex items-center gap-3 text-gray-400 text-xs">
                  <span>{formattedDate}</span>
                  <span>•</span>
                  <span>{insight.reading_time || 0} min read</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {insights.length === 0 && !loading && (
        <p className="text-center text-gray-600 mt-20">
          No insights found in this category.
        </p>
      )}

    </div>
  </div>
);

}
