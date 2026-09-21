"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProjectGallery from "@/components/ProjectGallery";
import ShareModal, { ShareItemData } from "@/components/ui/ShareModal";
import { Share2 } from "lucide-react";

// Slugify for category/subcategory links
const slugify = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function ProjectDetailContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const slug = params.slug as string;
  const isPreview = searchParams.get("preview") === "true";

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  /* ============================
      SCROLL EVENT
  ============================ */
  useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      const height = document.body.scrollHeight - window.innerHeight;
      setProgress(Math.min(1, y / height));
      setShowBackToTop(y > 400);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* ============================
      LOAD PROJECT
  ============================ */
  useEffect(() => {
    async function load() {
      setLoading(true);

      // Primary query
      let query = supabase.from("projects").select("*");

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);

      if (isUuid) {
        query = query.or(`slug.eq.${slug},id.eq.${slug}`);
      } else {
        query = query.eq("slug", slug);
      }

      if (!isPreview) {
        query = query.eq("is_published", true);
      }

      let { data: proj, error: projErr } = await query.maybeSingle();

      // If not found with default filter and preview mode is active, try fallback ilike
      if (!proj && isPreview && slug) {
        let fallbackQuery = supabase.from("projects").select("*");
        if (isUuid) {
          fallbackQuery = fallbackQuery.or(`slug.ilike.${slug},id.eq.${slug}`);
        } else {
          fallbackQuery = fallbackQuery.ilike("slug", slug);
        }
        const { data: fallbackProj } = await fallbackQuery.maybeSingle();
        proj = fallbackProj;
      }

      if (projErr) {
        console.error("Project fetch error:", projErr);
      }

      if (!proj) {
        setProject(null);
        setLoading(false);
        return;
      }

      const { data: images, error: imgErr } = await supabase
        .from("project_images")
        .select("*")
        .eq("project_id", proj.id)
        .order("order_index", { ascending: true });

      if (imgErr) console.error(imgErr);

      setProject({
        ...proj,
        gallery: images || [],
      });

      setLoading(false);
    }

    if (slug) load();
  }, [slug, isPreview]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center">
        Loading...
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center">
        Project not found.
      </div>
    );
  }

  /* ============================
      COMPUTED FIELDS
  ============================ */
  const hero =
    project.hero_image ||
    project.gallery?.[0]?.image_url ||
    (project.gallery?.[0] as any)?.url ||
    null;

  const yearLabel =
    project.year_start && project.year_end
      ? `${project.year_start} – ${project.year_end}`
      : project.year_start || "";

  const location = project.is_confidential_location
    ? "Confidential"
    : `${project.city || ""}${
        project.city && project.country ? ", " : ""
      }${project.country || ""}`;

  return (
    <div className="bg-black text-white">

      {/* ============================
          PROGRESS BAR
      ============================ */}
      <div
        className="fixed top-0 left-0 h-[3px] bg-adidaya-red z-[999]"
        style={{ width: `${progress * 100}%` }}
      />

      {/* ============================
          HERO (FULL BLEED TO TOP)
      ============================ */}
      <section className="relative w-full">
        <div className="relative min-h-[540px] sm:min-h-[620px] lg:min-h-[700px] h-[65vh] sm:h-[72vh] lg:h-[78vh] w-full overflow-hidden flex flex-col justify-end">

          {hero ? (
            <img
              src={hero}
              alt={project.project_name}
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

          {/* HERO TEXT */}
          <div className="relative z-10 w-full pt-28 pb-12 sm:pb-14">
            <div className="max-w-4xl mx-auto px-6">

              {/* CATEGORY & SUBCATEGORY & SHARE */}
              <div className="flex items-center justify-between gap-2 mb-4 flex-wrap">
                <div className="flex gap-2 flex-wrap items-center">
                  {project.categories?.map((c: string) => (
                    <Link
                      key={`cat-${c}`}
                      href={`/projects?category=${slugify(c)}&sub=all`}
                      className="inline-block bg-adidaya-red px-4 py-1 rounded-full 
                      text-[11px] uppercase tracking-[0.18em] hover:bg-adidaya-red/80 transition"
                    >
                      {c}
                    </Link>
                  ))}

                  {project.subcategories?.map((s: string) => (
                    <Link
                      key={`sub-${s}`}
                      href={`/projects?category=all&sub=${slugify(s)}`}
                      className="inline-block bg-neutral-900 px-4 py-1 rounded-full 
                      text-[11px] uppercase tracking-[0.18em] border border-white/10 
                      hover:border-adidaya-red transition"
                    >
                      {s}
                    </Link>
                  ))}
                </div>

                {/* SHARE BUTTON */}
                <button
                  type="button"
                  onClick={() => setShareOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-xs text-white transition-all backdrop-blur-md cursor-pointer select-none shadow-sm hover:scale-105 active:scale-95 ml-auto sm:ml-0"
                >
                  <Share2 size={13} strokeWidth={1.75} />
                  <span>Share</span>
                </button>
              </div>

              {/* TITLE */}
              <h1 className="text-4xl sm:text-5xl font-semibold mb-4 tracking-tight leading-tight">
                {project.project_name}
              </h1>

              {/* META */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-300">
                {project.status && <span className="capitalize">{project.status}</span>}
                {project.status && <span>•</span>}

                {location && <span>{location}</span>}
                {location && <span>•</span>}

                {yearLabel && <span>{yearLabel}</span>}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ============================
          MAIN CONTENT
      ============================ */}
      <main className="max-w-4xl mx-auto px-6 pt-14 pb-28">

        {/* SPECIFICATIONS (SITE AREA, BUILDING AREA, BUILDING / FLOORS) */}
        {(project.site_area || project.building_area || project.building_floors || project.floors_count) && (
          <section className="mb-10 p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
            <h3 className="text-xs uppercase tracking-[0.2em] text-neutral-400 mb-4 font-semibold">
              Project Specifications
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {project.site_area && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400 mb-1.5 font-medium">
                    Site Area
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    {project.site_area}
                    {!project.site_area.includes("m²") && !project.site_area.toLowerCase().includes("sqm") && (
                      <span className="text-xs text-neutral-400 font-normal ml-1">m²</span>
                    )}
                  </p>
                </div>
              )}
              {project.building_area && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400 mb-1.5 font-medium">
                    Building Area
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    {project.building_area}
                    {!project.building_area.includes("m²") && !project.building_area.toLowerCase().includes("sqm") && (
                      <span className="text-xs text-neutral-400 font-normal ml-1">m²</span>
                    )}
                  </p>
                </div>
              )}
              {(project.building_floors || project.floors_count) && (
                <div>
                  <p className="text-[10px] uppercase tracking-[0.16em] text-neutral-400 mb-1.5 font-medium">
                    Floors
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-white tracking-tight">
                    {project.building_floors || project.floors_count}
                    {/^\d+$/.test(String(project.building_floors || project.floors_count).trim()) && (
                      <span className="text-xs text-neutral-400 font-normal ml-1">Floors</span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* TEAM */}
        {project.team_members?.length > 0 && (
          <section className="mb-16">
            <h3 className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-4">
              Team Credits
            </h3>

            <div className="space-y-2 mb-6">
              {project.team_members.map((m: any, i: number) => (
                <p key={`team-${i}`} className="text-gray-200">
                  <span className="font-semibold">{m.name}</span> — {m.role}
                </p>
              ))}
            </div>

            <div className="border-b border-white/10" />
          </section>
        )}

        {/* DESCRIPTION HTML */}
        {project.description_html && (
          <section
            className="prose prose-invert max-w-none
            prose-headings:text-white
            prose-h2:text-2xl prose-h2:font-semibold prose-h2:mt-12 prose-h2:mb-4
            prose-h3:text-xl prose-h3:font-semibold prose-h3:mt-8 prose-h3:mb-3
            prose-p:text-gray-300 prose-p:leading-relaxed
            prose-li:text-gray-300
            prose-strong:text-white
            prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: project.description_html }}
          />
        )}

        {/* GALLERY */}
        {project.gallery?.length > 0 && (
          <div className="mt-20">
            <ProjectGallery images={project.gallery} />
          </div>
        )}
      </main>

      {/* BACK TO TOP */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="
            fixed bottom-8 right-6 w-12 h-12 rounded-full
            bg-neutral-900/80 backdrop-blur
            border border-white/10 hover:border-adidaya-red
            transition flex items-center justify-center z-[999]
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
            type: "project",
            title: project.project_name,
            category: project.categories?.[0] || "Architecture",
            tags: project.subcategories || [],
            location,
            year: yearLabel,
            status: project.status,
            meta: [
              project.site_area ? `Site: ${project.site_area}` : "",
              project.building_area ? `Building: ${project.building_area}` : "",
              project.building_floors || project.floors_count ? `${project.building_floors || project.floors_count}` : "",
            ].filter(Boolean),
            imageUrl: hero,
            excerpt: project.description_html,
          }}
        />
      )}
    </div>
  );
}

export default function ProjectDetail() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-gray-400 flex items-center justify-center text-xs">
          Loading project...
        </div>
      }
    >
      <ProjectDetailContent />
    </Suspense>
  );
}
