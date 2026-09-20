"use client";

import Link from "next/link";

export default function InsightCard({ item }: any) {
  // FORMAT READING TIME
  const formattedReadingTime =
    item.reading_time === null || item.reading_time === undefined
      ? "" // kalau kosong, ya file-nya memang belum punya reading_time
      : item.reading_time < 1
      ? "<1 min read"
      : `${Math.ceil(item.reading_time)} min read`;

  return (
    <Link href={`/insights/${item.slug}`}>
      <div className="group bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition">
        
        {/* IMAGE */}
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={item.hero_image_url || "/placeholder.jpg"}
            alt={item.title}
            className="h-full w-full object-cover group-hover:scale-105 transition"
          />
        </div>

          {/* CONTENT */}
          <div className="px-5 py-6">

            {/* CATEGORY */}
            <span className="px-3 py-1 rounded-full bg-adidaya-red text-[11px] uppercase tracking-wide text-white mb-3 inline-block">
              {item.category?.replace(/-/g, " ") ?? ""}
            </span>

            {/* TITLE */}
            <h3 className="text-lg font-semibold leading-snug mb-2">
              {item.title}
            </h3>

            {/* META (DATE · READING TIME) */}
            {item.published_at && (
              <div className="flex items-center gap-2 text-[13px] text-gray-400 mt-1">

                {/* DATE */}
                <span>
                  {new Date(item.published_at).toLocaleDateString("id-ID", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>

                {/* DOT */}
                {formattedReadingTime && <span className="mx-1">·</span>}

                {/* TIME */}
                {formattedReadingTime && (
                  <span>{formattedReadingTime}</span>
                )}
              </div>
            )}

          </div>

      </div>
    </Link>
  );
}
