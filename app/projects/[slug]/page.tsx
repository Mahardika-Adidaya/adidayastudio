"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import ProjectGallery from "@/components/ProjectGallery";

// Slugify for category/subcategory links
const slugify = (t: string) =>
  t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function ProjectDetail() {
  const params = useParams();
  const slug = params.slug as string;

  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);

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

      const { data: proj, error: projErr } = await supabase
        .from("projects")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (projErr) {
        console.error(projErr);
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
  }, [slug]);

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
  const hero = project.hero_image || null;

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

              {/* CATEGORY & SUBCATEGORY */}
              <div className="flex gap-2 mb-4 flex-wrap">

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

        {/* TEAM */}
        {project.team_members?.length > 0 && (
          <section className="mb-16">
            <h3 className="text-xs uppercase tracking-[0.18em] text-gray-500 mb-4">
              Team
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
    </div>
  );
}
