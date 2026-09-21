"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import { format } from "date-fns";
import { id as localeID } from "date-fns/locale";
import ShareModal, { ShareItemData } from "@/components/ui/ShareModal";
import { Share2 } from "lucide-react";

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

function InsightDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParams.get("preview") === "true";

  const [insight, setInsight] = useState<Insight | null>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

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

      let query = supabase.from("insight").select("*");

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      if (isUuid) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`);
      } else {
        query = query.eq("slug", slug);
      }

      if (!isPreview) {
        query = query.eq("status", "published");
      }

      let { data } = await query.maybeSingle();

      if (!data && isPreview && slug) {
        let fallbackQuery = supabase.from("insight").select("*");
        if (isUuid) {
          fallbackQuery = fallbackQuery.or(`slug.ilike.${slug},id.eq.${slug}`);
        } else {
          fallbackQuery = fallbackQuery.ilike("slug", slug);
        }
        const { data: fallbackData } = await fallbackQuery.maybeSingle();
        data = fallbackData;
      }

      setInsight(data);
      setLoading(false);
    }

    if (slug) load();
  }, [slug, isPreview]);

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

      {/* HERO (FULL BLEED TO TOP) */}
      <section className="relative w-full">
        <div className="relative min-h-[540px] sm:min-h-[620px] lg:min-h-[700px] h-[65vh] sm:h-[72vh] lg:h-[78vh] w-full overflow-hidden flex flex-col justify-end">
          {insight.hero_image_url ? (
            <img
              src={insight.hero_image_url}
              alt={insight.title}
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 w-full h-full bg-neutral-900 flex items-center justify-center text-gray-500">
              No cover image
            </div>
          )}

          {/* TOP VIGNETTE FOR NAVBAR VISIBILITY */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/25 to-transparent pointer-events-none" />

          {/* BOTTOM GRADIENT FOR TEXT READABILITY & SEAMLESS BLEND */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent pointer-events-none" />

          <div className="relative z-10 w-full pt-28 pb-12 sm:pb-14">
            <div className="max-w-4xl mx-auto px-6">
              
              {/* CATEGORY & SHARE (CLICKABLE) */}
              <div className="mb-3 flex items-center justify-between gap-2 flex-wrap">
                <Link
                  href={`/insights/category/${slugify(insight.category)}`}
                  className="inline-flex items-center rounded-full bg-adidaya-red px-4 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] hover:bg-adidaya-red/80 transition"
                >
                  {insight.category}
                </Link>

                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-xs text-white transition-all backdrop-blur-md cursor-pointer select-none shadow-sm hover:scale-105 active:scale-95"
                >
                  <Share2 size={13} strokeWidth={1.75} />
                  <span>Share</span>
                </button>
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
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}

      {/* SHARE MODAL */}
      {shareOpen && (
        <ShareModal
          isOpen={shareOpen}
          onClose={() => setShareOpen(false)}
          data={{
            type: "insight",
            title: insight.title,
            subtitle: insight.subtitle,
            category: insight.category,
            tags: insight.tags || [],
            author: authorName,
            date: formattedDate,
            readingTime: readingTime,
            imageUrl: insight.hero_image_url,
            excerpt: insight.body_html || insight.subtitle,
          }}
        />
      )}
    </div>
  );
}

export default function InsightDetail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center text-xs">
          <p className="text-gray-500">Loading insight...</p>
        </div>
      }
    >
      <InsightDetailContent />
    </Suspense>
  );
}
