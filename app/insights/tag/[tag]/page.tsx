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
  hero_image_url: string | null;
  category: string;
  tags: string[] | null;
  published_at: string | null;
  created_at: string;
  reading_time: number | null;
};

export default function TagPage() {
  const router = useRouter();
  const params = useParams();
  const urlTag = (params.tag as string)?.toLowerCase();

  const [query, setQuery] = useState(urlTag || "");
  const [insights, setInsights] = useState<Insight[]>([]);

  /* ============================
     LOAD DATA
  ============================ */
  useEffect(() => {
    if (!urlTag) return;
    loadInsights(urlTag);
  }, [urlTag]);

  async function loadInsights(tag: string) {
    const { data, error } = await supabase
      .from("insight")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });

    if (error) {
      console.error(error);
      return;
    }

    // Filter manual → fix mismatch uppercase / slug / spacing
    const results = (data || []).filter((item) => {
      const query = tag.toLowerCase();

      const normalized = item.tags?.map((t: string) => t.toLowerCase()) || [];

      // partial match → lebih fleksibel
      return normalized.some((t: string) => t.includes(query));
    });


    setInsights(results); // FIX: sebelumnya salah: setInsights(data)
  }

  /* ============================
     SEARCH TAG
  ============================ */
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    router.push(`/insights/tag/${query.trim().toLowerCase()}`);
  }

  /* ============================
     RENDER
  ============================ */
  return (
    <div className="min-h-screen bg-black text-white pt-8 pb-20">
      <div className="mx-auto max-w-5xl px-6">

        {/* BREADCRUMB */}
        <p className="text-[11px] uppercase tracking-[0.18em] text-gray-400 mb-1">
          Insights • Tags
        </p>

        {/* HEADER + SEARCH */}
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-4xl font-semibold">
            <span className="text-adidaya-red">*</span> Tags: {urlTag}
          </h1>

          {/* SEARCH */}
          <form
            onSubmit={handleSearch}
            className="flex items-center bg-[#111] border border-white/10 rounded-full px-4 py-2 backdrop-blur"
          >
            <input
              type="text"
              placeholder="Search tags..."
              className="bg-transparent outline-none text-sm text-white placeholder-gray-500 w-40"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="ml-3 text-gray-400 hover:text-white text-sm">
              Search
            </button>
          </form>
        </div>

        {/* COUNT */}
        <p className="text-gray-400 mb-8">
          {insights.length} insight{insights.length !== 1 ? "s" : ""} found
        </p>

        {/* GRID */}
        {insights.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {insights.map((item) => {
              const dateObj = new Date(item.published_at || item.created_at);
              const formattedDate = format(dateObj, "d MMM yyyy", {
                locale: localeID,
              });

              const readingTime = item.reading_time || 0;

              /* TAG LOGIC */
              const allTags = item.tags || [];
              const mainTag = urlTag;
              const otherTags = allTags.filter(
                (t) => t.toLowerCase() !== mainTag.toLowerCase()
              );

              const show1 = otherTags[0];
              const extraCount = otherTags.length - 1;

              return (
                <Link
                  key={item.id}
                  href={`/insights/${item.slug}`}
                  className="block rounded-2xl overflow-hidden bg-[#111]/60 border border-white/5 hover:border-adidaya-red transition-all shadow-xl"
                >
                  {/* IMAGE */}
                  <div className="h-48 w-full overflow-hidden">
                    <img
                      src={item.hero_image_url || ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* CONTENT */}
                  <div className="p-5">
                    {/* BADGES */}
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {/* CATEGORY */}
                      <span className="inline-block px-4 py-1 bg-adidaya-red text-white rounded-full text-[11px] uppercase tracking-[0.15em]">
                        {item.category}
                      </span>

                      {/* MAIN TAG */}
                      <span className="inline-block px-3 py-1 bg-neutral-800 text-gray-300 rounded-full text-[11px] uppercase">
                        {mainTag}
                      </span>

                      {/* OTHER TAG */}
                      {show1 && (
                        <span className="inline-block px-3 py-1 bg-neutral-800 text-gray-300 rounded-full text-[11px] uppercase">
                          {show1}
                        </span>
                      )}

                      {/* EXTRA COUNT */}
                      {extraCount > 0 && (
                        <span className="inline-block px-3 py-1 bg-neutral-900 text-gray-500 rounded-full text-[11px] uppercase">
                          +{extraCount}
                        </span>
                      )}
                    </div>

                    {/* TITLE */}
                    <h3 className="text-lg font-semibold leading-tight mb-1">
                      {item.title}
                    </h3>

                    {/* META */}
                    <p className="text-sm text-gray-400 flex items-center gap-2">
                      {formattedDate} • {readingTime} min read
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 mt-10">No insights found.</p>
        )}
      </div>
    </div>
  );
}
