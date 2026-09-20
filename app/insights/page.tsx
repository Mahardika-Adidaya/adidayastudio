"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

import FilterBarInsight, { type InsightFilter } from "./FilterBarInsight";
import InsightCard from "./InsightCard";
import ProjectSectionHeader from "@/app/projects/sections/ProjectSectionHeader";

type Insight = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  hero_image_url: string | null;
  tags: string[] | null;
  authors: any[] | null;
  published_at: string | null;
  category: string | null;
  reading_time: number | null;
  body_html?: string | null;
};

/* ============================================================
   CATEGORY → SLUG MAP
============================================================ */
const CATEGORY_MAP: Record<string, string> = {
  "Studio Stories": "studio-stories",
  "Design Dialogues": "design-dialogues",
  "Craft & Construction": "craft-construction",
  "Business Briefings": "business-briefings",
  "Research Records": "research-records",
  "News & Notes": "news-notes",
};

const SLUG_TO_CATEGORY_MAP: Record<string, string> = Object.entries(
  CATEGORY_MAP
).reduce((acc, [key, val]) => {
  acc[val] = key;
  return acc;
}, {} as Record<string, string>);

/* ============================================================
   SEARCH LOGIC — FULL TEXT MATCH
============================================================ */
function matchesSearch(item: Insight, q: string) {
  if (!q.trim()) return true;

  const s = q.toLowerCase();

  const cleanBody =
    item.body_html?.replace(/<[^>]+>/g, " ").toLowerCase() || "";

  return (
    item.title?.toLowerCase().includes(s) ||
    item.subtitle?.toLowerCase().includes(s) ||
    item.slug?.toLowerCase().includes(s) ||
    (item.category || "").toLowerCase().includes(s) ||
    cleanBody.includes(s) ||
    item.tags?.some((t) => t.toLowerCase().includes(s))
  );
}

/* WRAPPER (Suspense for Next.js App Router) */
export default function InsightsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <InsightPage />
    </Suspense>
  );
}

function InsightPage() {
  const params = useSearchParams();
  const urlCategory = params.get("category");
  const urlTag = params.get("tag");
  const urlQuery = params.get("q") || params.get("search");

  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);

  const [filter, setFilter] = useState<InsightFilter>({
    category: null,
    tag: null,
    search: undefined,
  });

  const capitalize = (str: string) =>
    str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  /* SYNC URL SEARCH PARAMS */
  useEffect(() => {
    if (urlCategory && urlCategory !== "all") {
      const matchedCat =
        SLUG_TO_CATEGORY_MAP[urlCategory] || capitalize(urlCategory);
      setFilter((prev) => ({ ...prev, category: matchedCat }));
    }
    if (urlTag && urlTag !== "all") {
      setFilter((prev) => ({ ...prev, tag: capitalize(urlTag) }));
    }
    if (urlQuery) {
      setFilter((prev) => ({ ...prev, search: urlQuery }));
    }
  }, [urlCategory, urlTag, urlQuery]);

  /* LOAD ALL PUBLISHED INSIGHTS */
  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase
        .from("insight")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      setAllInsights(data || []);
      setLoading(false);
    }

    load();
  }, []);

  const handleFilterChange = useCallback((newFilter: InsightFilter) => {
    setFilter((prev) => {
      if (
        prev.category === newFilter.category &&
        prev.tag === newFilter.tag &&
        prev.search === newFilter.search
      ) {
        return prev;
      }
      return newFilter;
    });
  }, []);

  /* EXTRACT DYNAMIC TAGS FROM INSIGHTS */
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    allInsights.forEach((item) => {
      item.tags?.forEach((t) => {
        if (t && t.trim()) {
          const formatted = t
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) => c.toUpperCase());
          set.add(formatted);
        }
      });
    });
    return Array.from(set).sort();
  }, [allInsights]);

  /* APPLY FILTERING (CATEGORY + TAG + SEARCH) */
  const display = useMemo(() => {
    let results = allInsights;

    // CATEGORY FILTER
    if (filter.category && filter.category !== "All") {
      const slugCat =
        CATEGORY_MAP[filter.category] ||
        filter.category.toLowerCase().replace(/\s+/g, "-");
      results = results.filter((item) => item.category === slugCat);
    }

    // TAG FILTER
    if (filter.tag && filter.tag !== "All") {
      const qTag = filter.tag.toLowerCase().replace(/\s+/g, "-");
      const rawTag = filter.tag.toLowerCase();
      results = results.filter((item) =>
        item.tags?.some((t) => {
          const lower = t.toLowerCase();
          return (
            lower === qTag ||
            lower === rawTag ||
            lower.includes(rawTag) ||
            rawTag.includes(lower)
          );
        })
      );
    }

    // SEARCH FULL TEXT
    if (filter.search) {
      results = results.filter((item) => matchesSearch(item, filter.search!));
    }

    return results;
  }, [filter, allInsights]);

  return (
    <div className="min-h-screen bg-black text-white px-6 lg:px-20 py-16">
      <ProjectSectionHeader title="Insights" />

      {/* FILTER BAR INSIGHT (EXACT MATCH WITH PROJECTS FILTERBAR) */}
      <FilterBarInsight
        onFilterChange={handleFilterChange}
        initialFilter={filter}
        availableTags={availableTags}
      />

      {loading ? (
        <div className="py-24 text-center text-sm text-neutral-500">
          Loading insights...
        </div>
      ) : display.length === 0 ? (
        <div className="mt-12">
          {/* EMPTY STATE MESSAGE */}
          <div className="flex flex-col items-center justify-center text-center pt-16 pb-8 px-4 max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
              No articles found
            </h3>
            <p className="text-sm text-adidaya-text-muted leading-relaxed">
              We couldn&apos;t find any articles matching your search or filter. Try choosing another category or keyword.
            </p>
          </div>

          {/* SUGGESTION SECTION WITH COMPACT SQUARE CARDS (MAX 5, LEFT-ALIGNED) */}
          {allInsights.length > 0 && (
            <div className="mt-12 pt-10 border-t border-white/10 max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-adidaya-red inline-block" />
                  Explore Other Insights
                </h4>
                <motion.button
                  whileHover="hover"
                  initial="initial"
                  onClick={() =>
                    setFilter({ category: null, tag: null, search: undefined })
                  }
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-adidaya-red active:text-adidaya-red transition-colors font-medium select-none py-1 px-1 cursor-pointer"
                >
                  <span>View All Insights</span>
                  <motion.span
                    variants={{
                      initial: { x: 0 },
                      hover: { x: 5 },
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="inline-flex items-center"
                  >
                    <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} />
                  </motion.span>
                </motion.button>
              </div>

              <div className="flex items-start justify-start gap-4 overflow-x-auto no-scrollbar max-w-full pb-2">
                {allInsights.slice(0, 5).map((item) => (
                  <Link
                    key={item.id}
                    href={`/insights/${item.slug}`}
                    style={{ width: "180px", maxWidth: "180px", height: "238px", borderRadius: "24px" }}
                    className="group flex flex-col shrink-0 overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition duration-200"
                  >
                    {/* IMAGE (FIXED 180x180 SQUARE) */}
                    <div
                      style={{ width: "180px", height: "180px", borderRadius: "24px 24px 0 0" }}
                      className="overflow-hidden relative shrink-0"
                    >
                      {item.hero_image_url ? (
                        <img
                          src={item.hero_image_url}
                          alt={item.title}
                          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "24px 24px 0 0" }}
                          className="group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-neutral-800" />
                      )}
                    </div>

                    {/* TEXT CONTAINER (FIXED 58px HEIGHT, VERTICALLY CENTERED, MAX 2 LINES) */}
                    <div
                      style={{ height: "58px" }}
                      className="px-4 py-2.5 text-left flex flex-col justify-center shrink-0"
                    >
                      <h5
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        className="text-xs font-medium text-neutral-200 group-hover:text-adidaya-red transition-colors leading-relaxed"
                      >
                        {item.title}
                      </h5>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {display.map((item) => (
            <InsightCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
