"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import InsightEditor from "@/components/InsightEditor";
import { toast } from "react-hot-toast";

/* ============================================================
   TYPES
============================================================ */
type Author = {
  name: string;
  role: string;
};

type CategoryValue =
  | "studio-stories"
  | "design-dialogues"
  | "craft-construction"
  | "business-briefings"
  | "research-records"
  | "news-notes";

/* ============================================================
   CATEGORY + TAGS
============================================================ */
const CATEGORY_LABELS: { value: CategoryValue; label: string }[] = [
  { value: "studio-stories", label: "Studio Stories" },
  { value: "design-dialogues", label: "Design Dialogues" },
  { value: "craft-construction", label: "Craft & Construction" },
  { value: "business-briefings", label: "Business Briefings" },
  { value: "research-records", label: "Research Records" },
  { value: "news-notes", label: "News & Notes" },
];

const RECOMMENDED_TAGS: Record<CategoryValue, string[]> = {
  "studio-stories": [
    "culture",
    "people",
    "team",
    "behind-the-scenes",
    "reflection",
    "voice",
    "studio-life",
    "editorial",
    "personal",
  ],
  "design-dialogues": [
    "concept",
    "design-thinking",
    "ideation",
    "narrative",
    "journey",
    "sketch",
    "exploration",
    "iteration",
    "aesthetics",
  ],
  "craft-construction": [
    "structure",
    "mep",
    "systems",
    "detailing",
    "materiality",
    "tectonics",
    "fabrication",
    "sitework",
    "durability",
  ],
  "business-briefings": [
    "business",
    "branding",
    "marketing",
    "industry-trends",
    "client",
    "value",
    "management",
    "growth",
    "operations",
  ],
  "research-records": [
    "research",
    "methodology",
    "publication",
    "whitepaper",
    "analysis",
    "findings",
    "comparison",
    "theory",
  ],
  "news-notes": [
    "news",
    "update",
    "announcement",
    "milestone",
    "launch",
    "timeline",
    "press",
    "progress",
    "event",
  ],
};

/* ============================================================
   UTIL FUNCTIONS
============================================================ */
function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

// ⭐ FINAL reading time function — menghasilkan integer minute
function calculateReadingTime(html: string): number {
  const cleanText = html.replace(/<[^>]+>/g, " ").trim();
  const words = cleanText.split(/\s+/).filter(Boolean).length;

  if (words === 0) return 1;

  return Math.max(1, Math.ceil(words / 200));
}

/* ============================================================
   PAGE
============================================================ */

export default function CreateInsightPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [category, setCategory] = useState<CategoryValue | "">("");

  const [authors, setAuthors] = useState<Author[]>([{ name: "", role: "" }]);

  const [heroUrl, setHeroUrl] = useState("");
  const [heroCaption, setHeroCaption] = useState("");
  const [uploadingHero, setUploadingHero] = useState(false);

  const [bodyHtml, setBodyHtml] = useState("");

  const [tags, setTags] = useState<string[]>([]);
  const [customTag, setCustomTag] = useState("");

  const [saving, setSaving] = useState(false);
  const [triedSubmit, setTriedSubmit] = useState(false);

  /* ============================================================
     HANDLERS
  ============================================================ */
  function handleAuthorChange(i: number, field: keyof Author, v: string) {
    setAuthors((prev) => {
      const c = [...prev];
      c[i] = { ...c[i], [field]: v };
      return c;
    });
  }

  function addAuthor() {
    setAuthors((prev) => [...prev, { name: "", role: "" }]);
  }

  function removeAuthor(i: number) {
    if (authors.length === 1) return;
    setAuthors((prev) => prev.filter((_, idx) => idx !== i));
  }

  function toggleTag(tag: string) {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function customTagHandler(e: any) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (!customTag.trim()) return;
      setTags((t) => [...t, customTag.trim()]);
      setCustomTag("");
    }
  }

  /* ============================================================
     HERO UPLOAD
  ============================================================ */
  async function handleHeroFileChange(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingHero(true);
      const fileName = `${Date.now()}-${file.name}`;
      const path = `hero/${fileName}`;

      const { error } = await supabase.storage
        .from("insight-images")
        .upload(path, file);

      if (error) throw error;

      const { data } = supabase.storage
        .from("insight-images")
        .getPublicUrl(path);

      setHeroUrl(data.publicUrl);
      toast.success("Hero image uploaded");
    } catch (err) {
      toast.error("Upload failed");
    } finally {
      setUploadingHero(false);
      e.target.value = "";
    }
  }

  /* ============================================================
     INLINE IMAGE
  ============================================================ */
  async function uploadInline(file: File): Promise<string> {
    const fileName = `${Date.now()}-${file.name}`;
    const path = `inline/${fileName}`;

    const { error } = await supabase.storage
      .from("insight-images")
      .upload(path, file);

    if (error) throw error;

    const { data } = supabase.storage
      .from("insight-images")
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /* ============================================================
     SAVE DRAFT
  ============================================================ */
  async function saveDraft() {
    setTriedSubmit(true);

    if (!title.trim()) return toast.error("Title is required");
    if (!category) return toast.error("Category is required");
    if (!heroUrl.trim()) return toast.error("Hero image is required");
    if (!bodyHtml.trim()) return toast.error("Body cannot be empty");

    const cleanedAuthors = authors.filter(
      (a) => a.name.trim() && a.role.trim()
    );

    if (cleanedAuthors.length === 0)
      return toast.error("At least 1 author is required");

    try {
      setSaving(true);

      const slug = slugify(title);
      const reading_time = calculateReadingTime(bodyHtml);

      const { error } = await supabase.from("insight").insert([
        {
          title,
          subtitle,
          slug,
          category,
          authors: cleanedAuthors,
          hero_image_url: heroUrl,
          hero_caption: heroCaption,
          body_html: bodyHtml,
          tags,
          status: "draft",
          reading_time,
        },
      ]);

      if (error) throw error;

      toast.success("Draft saved");
      router.push("/admin/insight");
    } catch (err: any) {
      toast.error(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  function cancel() {
    router.push("/admin/insight");
  }

  /* ============================================================
     UI RENDER
  ============================================================ */
  const recommendedTags =
    category && RECOMMENDED_TAGS[category as CategoryValue]
      ? RECOMMENDED_TAGS[category as CategoryValue]
      : [];

  return (
    <div className="min-h-screen bg-black text-white font-sans">
      <main className="mx-auto max-w-5xl px-6 pt-14 pb-48 md:pb-56 space-y-8">
        
        {/* HEADER */}
        <div>
          <p className="text-[11px] uppercase tracking-[0.25em] text-gray-500">
            Admin • Insight
          </p>
          <h1 className="mt-3 text-3xl font-semibold">
            <span className="mr-2 text-[#E53935]">*</span>
            Create New Insight
          </h1>
        </div>

        {/* TITLE */}
        <section className="py-6 border-b border-white/10 pb-6">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="w-full bg-transparent text-4xl font-semibold placeholder:text-gray-700 text-white"
          />

          <input
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder="Subtitle (optional)"
            className="py-3 w-full bg-transparent text-base text-gray-300 placeholder:text-gray-600"
          />
        </section>

        {/* AUTHORS */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Authors <span className="text-[#E53935]">*</span>
          </p>

          <div className="py-3 space-y-3">
            {authors.map((author, i) => (
              <div key={i} className="flex items-center gap-4">
                <input
                  value={author.name}
                  onChange={(e) =>
                    handleAuthorChange(i, "name", e.target.value)
                  }
                  placeholder="Name"
                  className={`flex-1 rounded-full border bg-black/40 px-4 py-2 text-sm text-white placeholder:text-gray-500 ${
                    triedSubmit && !author.name
                      ? "border-[#E53935]"
                      : "border-white/10 focus:border-[#E53935]"
                  }`}
                />

                <input
                  value={author.role}
                  onChange={(e) =>
                    handleAuthorChange(i, "role", e.target.value)
                  }
                  placeholder="Role"
                  className={`flex-1 rounded-full border bg-black/40 px-4 py-2 text-sm text-white placeholder:text-gray-500 ${
                    triedSubmit && !author.role
                      ? "border-[#E53935]"
                      : "border-white/10 focus:border-[#E53935]"
                  }`}
                />

                {authors.length > 1 && (
                  <button
                    onClick={() => removeAuthor(i)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addAuthor}
            className="text-xs text-gray-300 hover:text-white"
          >
            + Add Author
          </button>
        </section>

        {/* CATEGORY */}
        <section>
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Category <span className="text-[#E53935]">*</span>
          </p>

          <div className="flex flex-wrap gap-3 py-3">
            {CATEGORY_LABELS.map((cat) => {
              const active = category === cat.value;
              return (
                <button
                  key={cat.value}
                  onClick={() =>
                    setCategory(active ? "" : (cat.value as CategoryValue))
                  }
                  className={`rounded-full border px-5 py-3 text-xs transition ${
                    active
                      ? "border-[#E53935] bg-[#E53935] text-white shadow-[0_0_18px_rgba(229,57,53,0.6)]"
                      : "border-white/15 bg-white/5 text-gray-200 hover:border-white/40"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* HERO UPLOAD */}
        <section className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Hero Image <span className="text-[#E53935]">*</span>
          </p>

          <div className="rounded-2xl border border-white/10 bg-white/5 px-6 py-6">
            <div className="space-y-2">
              <label className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                URL
              </label>

              <input
                value={heroUrl}
                onChange={(e) => setHeroUrl(e.target.value)}
                placeholder="https://…"
                className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
              />
            </div>

            <div className="py-3 flex items-center gap-4 text-xs text-gray-400">
              <span className="uppercase tracking-[0.16em]">or upload</span>

              <label className="inline-flex cursor-pointer items-center rounded-full border border-white/20 bg-black/40 px-4 py-1.5 text-xs hover:bg-white/10">
                <span>{uploadingHero ? "Uploading…" : "Choose file"}</span>
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleHeroFileChange}
                  disabled={uploadingHero}
                />
              </label>
            </div>

            <div className="space-y-2 py-3">
              <label className="text-[11px] uppercase tracking-[0.16em] text-gray-500">
                Caption
              </label>

              <input
                value={heroCaption}
                onChange={(e) => setHeroCaption(e.target.value)}
                placeholder="Image caption (optional)"
                className="w-full rounded-full border border-white/10 bg-black/40 px-4 py-2 text-sm text-white"
              />
            </div>

            {heroUrl && (
              <div className="overflow-hidden rounded-xl border border-white/10 bg-black/60">
                <img
                  src={heroUrl}
                  alt={heroCaption || "Hero"}
                  className="h-72 w-full object-cover"
                />
              </div>
            )}
          </div>
        </section>

        {/* BODY EDITOR */}
        <section className="space-y-3">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Body <span className="text-[#E53935]">*</span>
          </p>

          <InsightEditor
            value={bodyHtml}
            onChange={setBodyHtml}
            onUploadImage={uploadInline}
          />
        </section>

        {/* TAGS */}
        <section className="space-y-4 pb-8">
          <p className="text-[11px] uppercase tracking-[0.2em] text-gray-500">
            Tags
          </p>

          {recommendedTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs text-gray-400">
                Recommended for{" "}
                <span className="text-gray-200 font-medium">
                  {CATEGORY_LABELS.find((c) => c.value === category)?.label}
                </span>
              </p>

              <div className="flex flex-wrap gap-2">
                {recommendedTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full border px-3 py-1 text-xs ${
                      tags.includes(tag)
                        ? "border-[#E53935] bg-[#E53935] text-white"
                        : "border-white/20 bg-white/5 text-gray-200 hover:border-white/40"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-full bg-white/10 px-3 py-1 text-xs text-gray-100"
              >
                {tag}
                <button
                  onClick={() => toggleTag(tag)}
                  className="ml-1 text-[10px] text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </span>
            ))}

            <input
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={customTagHandler}
              placeholder="Add tag and press Enter"
              className="min-w-[180px] flex-1 rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs text-white"
            />
          </div>
        </section>
      </main>

      {/* BOTTOM ACTION BAR (MATCHING FOOTER HEIGHT) */}
      <div className="fixed inset-x-0 bottom-0 bg-[#050509]/95 border-t border-white/10 backdrop-blur-xl z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] py-6 md:py-8 px-4 sm:px-6">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-neutral-400 font-medium">
            Save as draft to continue later.
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={cancel}
              className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={saveDraft}
              disabled={saving}
              className="rounded-full border border-adidaya-red bg-adidaya-red px-7 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving…" : "Save Draft"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
