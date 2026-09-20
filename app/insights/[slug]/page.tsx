"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";

// ----------------------
// SLUGIFY HELPER
// ----------------------
const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

type Insight = {
  id: string;
  title: string;
  subtitle: string | null;
  body_html: string | null;
  hero_image_url: string | null;
  hero_caption: string | null;
  tags: string[] | null;
  authors: { name: string; role: string }[] | null;
  category: string;
  published_at: string | null;
  created_at: string;
  reading_time: number | null;
};

export default function InsightDetail() {
  const params = useParams();
  const slug = params.slug as string;

  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // -----------------------------------
  // SCROLL HANDLER (progress + back to top)
  // -----------------------------------
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const height =
        document.body.scrollHeight - window.innerHeight;

      setProgress(Math.min(1, scrollTop / height));
      setShowBackToTop(scrollTop > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // -----------------------------------
  // LOAD DATA
  // -----------------------------------
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data } = await supabase
        .from("insight")
        .select("*")
        .eq("slug", slug)
        .eq("status", "published")
        .single();

      setInsight(data);
      setLoading(false);
    }

    if (slug) load();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p className="text-gray-500">Insight not found.</p>
      </div>
    );
  }

  const dateObj = new Date(insight.published_at || insight.created_at);
  const formattedDate = format(dateObj, "d MMM yyyy", { locale: localeID });
  const readingTime = insight.reading_time || 0;
  const authorName = insight.authors?.[0]?.name || "Adidaya Studio";

  return (
    <div className="bg-black text-white">

      {/* PROGRESS BAR */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-adidaya-red z-[999]"
        style={{ width: `${progress * 100}%` }}
      />

      {/* HERO */}
      <section className="relative w-full">
        <div className="relative h-[420px] sm:h-[480px] lg:h-[520px] overflow-hidden">
          <img
            src={insight.hero_image_url || ""}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/55 to-black/20" />

          <div className="absolute inset-x-0 bottom-0 pb-12">
            <div className="max-w-4xl mx-auto px-6">
              
              {/* CATEGORY (CLICKABLE) */}
              <div className="mb-3">
                <Link
                  href={`/insights/category/${slugify(insight.category)}`}
                  className="inline-flex items-center rounded-full bg-adidaya-red px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-adidaya-red/80 transition"
                >
                  {insight.category}
                </Link>
              </div>

              {/* TITLE */}
              <h1 className="text-4xl sm:text-5xl font-semibold mb-4 leading-tight">
                {insight.title}
              </h1>

              {/* META */}
              <div className="flex flex-wrap items-center gap-2 text-[13px] text-gray-300">
                <span>{authorName}</span>
                <span>•</span>
                <span>{formattedDate}</span>
                <span>•</span>
                <span>{readingTime} min read</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BODY CONTENT */}
      <main className="max-w-4xl mx-auto px-6 pt-10 pb-20">

        {/* TAGS (CLICKABLE) */}
        {insight.tags && insight.tags.length > 0 && (
          <div className="mb-10">
            <p className="text-xs uppercase tracking-wider text-gray-500 mb-3">
              Tags
            </p>

            <div className="flex flex-wrap gap-2">
              {insight.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/insights/tag/${slugify(tag)}`}
                  className="px-4 py-1 bg-neutral-800 text-gray-200 rounded-full text-[11px] uppercase tracking-[0.15em] hover:bg-neutral-700 transition"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* BODY HTML */}
        <div
          className="prose prose-invert max-w-none prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: insight.body_html || "" }}
        />
      </main>

      {/* BACK TO TOP BUTTON */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="
            fixed bottom-8 right-6 z-[999]
            bg-neutral-900/80 backdrop-blur
            border border-white/10
            hover:border-adidaya-red hover:bg-black
            transition-all duration-300
            w-12 h-12 rounded-full flex items-center justify-center
            shadow-[0_0_25px_rgba(0,0,0,0.3)]
          "
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
    </div>
  );
}
