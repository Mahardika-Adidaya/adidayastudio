"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

import FilterBarInsight from "./FilterBarInsight";
import InsightCard from "./InsightCard";

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

/* ============================================================
   SEARCH LOGIC — FULL TEXT MATCH
============================================================ */
function matchesSearch(item: Insight, q: string) {
  if (!q.trim()) return true;

  const s = q.toLowerCase();

  const cleanBody =
    item.body_html?.replace(/<[^>]+>/g, " ").toLowerCase() || "";

  return (
    item.title.toLowerCase().includes(s) ||
    item.subtitle?.toLowerCase().includes(s) ||
    item.slug.toLowerCase().includes(s) ||
    (item.category || "").toLowerCase().includes(s) ||
    cleanBody.includes(s) ||
    item.tags?.some((t) => t.toLowerCase().includes(s))
  );
}

/* ============================================================
   MAIN PAGE
============================================================ */
export default function InsightPage() {
  const [allInsights, setAllInsights] = useState<Insight[]>([]);
  const [display, setDisplay] = useState<Insight[]>([]);

  const [category, setCategory] = useState("All");
  const [search, setSearch] = useState("");

  /* LOAD ALL INSIGHTS ONCE */
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("insight")
        .select("*")
        .eq("status", "published")
        .order("published_at", { ascending: false });

      setAllInsights(data || []);
      setDisplay(data || []);
    }

    load();
  }, []);

  /* APPLY FILTERING (CATEGORY + SEARCH) */
  useEffect(() => {
    const results = allInsights
      // CATEGORY FILTER
      .filter((item) =>
        category === "All"
          ? true
          : item.category === CATEGORY_MAP[category]
      )
      // SEARCH FULL TEXT
      .filter((item) => matchesSearch(item, search));

    setDisplay(results);
  }, [category, search, allInsights]);

  return (
    <div className="min-h-screen bg-black text-white px-6 lg:px-20 py-16">
      <h1 className="text-center text-5xl font-bold mb-12 tracking-tight">
        <span className="text-adidaya-red">*</span> Insights
      </h1>

      {/* FILTER BAR */}
      <FilterBarInsight
        category={category}
        onCategoryChange={setCategory}
        search={search}
        onSearchChange={setSearch}
      />

      {/* EMPTY MESSAGE */}
      {display.length === 0 && (
        <p className="text-center text-gray-500 mt-20">
          No articles found.
        </p>
      )}

      {/* GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
        {display.map((item) => (
          <InsightCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
