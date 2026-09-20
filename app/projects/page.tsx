"use client";

import { Suspense, useEffect, useState, useMemo, useCallback } from "react";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

import ProjectCard from "./ProjectCard";
import FilterBar, { type Filter } from "./sections/FilterBar";
import ProjectSectionHeader from "./sections/ProjectSectionHeader";

type Project = {
  id: string;
  slug: string;
  project_name: string;
  hero_image: string | null;
  categories: string[] | null;
  subcategories: string[] | null;
  city: string | null;
  country: string | null;
  order_index: number | null;
};

/* WRAPPER WAJIB (fix Next.js 16 error) */
export default function ProjectsPageWrapper() {
  return (
    <Suspense fallback={null}>
      <ProjectsPage />
    </Suspense>
  );
}

function ProjectsPage() {
  const params = useSearchParams();
  const urlCategory = params.get("category");
  const urlSub = params.get("sub");
  const urlSearch = params.get("q") || params.get("search");

  const [filter, setFilter] = useState<Filter>({
    category: null,
    subcategory: null,
    search: undefined,
  });

  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const capitalize = (str: string) =>
    str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    if (urlCategory && urlCategory !== "all") {
      setFilter((prev) => ({ ...prev, category: capitalize(urlCategory) }));
    }
    if (urlSub && urlSub !== "all") {
      setFilter((prev) => ({ ...prev, subcategory: capitalize(urlSub) }));
    }
    if (urlSearch) {
      setFilter((prev) => ({ ...prev, search: urlSearch }));
    }
  }, [urlCategory, urlSub, urlSearch]);

  /* LOAD ALL PUBLISHED PROJECTS ONCE */
  useEffect(() => {
    async function fetchProjects() {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(
          "id, slug, project_name, hero_image, categories, subcategories, city, country, order_index"
        )
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      setAllProjects(error ? [] : (data ?? []));
      setLoading(false);
    }

    fetchProjects();
  }, []);

  const handleFilterChange = useCallback((newFilter: Filter) => {
    setFilter((prev) => {
      if (
        prev.category === newFilter.category &&
        prev.subcategory === newFilter.subcategory &&
        prev.search === newFilter.search
      ) {
        return prev;
      }
      return newFilter;
    });
  }, []);

  /* IN-MEMORY INSTANT FILTERING */
  const filteredProjects = useMemo(() => {
    return allProjects.filter((p) => {
      if (filter.category && filter.category !== "All") {
        const catTarget = filter.category.toLowerCase();
        const hasCategory = p.categories?.some(
          (c) => c.toLowerCase() === catTarget
        );
        if (!hasCategory) return false;
      }

      if (filter.subcategory && filter.subcategory !== "All") {
        const subTarget = filter.subcategory.toLowerCase();
        const hasSub = p.subcategories?.some(
          (s) => s.toLowerCase() === subTarget
        );
        if (!hasSub) return false;
      }

      if (filter.search) {
        const q = filter.search.toLowerCase();
        const matches =
          p.project_name?.toLowerCase().includes(q) ||
          p.city?.toLowerCase().includes(q) ||
          p.country?.toLowerCase().includes(q) ||
          p.slug?.toLowerCase().includes(q) ||
          p.categories?.some((c) => c.toLowerCase().includes(q)) ||
          p.subcategories?.some((s) => s.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [allProjects, filter]);

  return (
    <div className="min-h-screen bg-black text-white px-6 lg:px-20 py-16">
      <ProjectSectionHeader title="Projects" />
      <FilterBar onFilterChange={handleFilterChange} initialFilter={filter} />

      {loading ? (
        <div className="py-24 text-center text-sm text-neutral-500">
          Loading projects...
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="mt-12">
          {/* EMPTY STATE MESSAGE */}
          <div className="flex flex-col items-center justify-center text-center pt-16 pb-8 px-4 max-w-lg mx-auto">
            <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
              No projects in this category yet
            </h3>
            <p className="text-sm text-adidaya-text-muted leading-relaxed">
              We hope to create and showcase projects in the category you are looking for soon. If you have a vision in mind, let&apos;s collaborate to make it a reality.
            </p>
          </div>

          {/* SUGGESTION SECTION WITH COMPACT SQUARE CARDS (MAX 5, LEFT-ALIGNED) */}
          {allProjects.length > 0 && (
            <div className="mt-12 pt-10 border-t border-white/10 max-w-5xl mx-auto w-full">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-sm font-semibold text-white/90 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-adidaya-red inline-block" />
                  Explore Other Projects
                </h4>
                <motion.button
                  whileHover="hover"
                  initial="initial"
                  onClick={() => setFilter({ category: null, subcategory: null, search: undefined })}
                  className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-adidaya-red active:text-adidaya-red transition-colors font-medium select-none py-1 px-1 cursor-pointer"
                >
                  <span>View All Projects</span>
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
                {allProjects.slice(0, 5).map((p) => (
                  <Link
                    key={p.id}
                    href={`/projects/${p.slug}`}
                    style={{ width: "180px", maxWidth: "180px", height: "238px", borderRadius: "24px" }}
                    className="group flex flex-col shrink-0 overflow-hidden bg-neutral-900 border border-neutral-800 hover:border-neutral-600 transition duration-200"
                  >
                    {/* IMAGE (FIXED 180x180 SQUARE) */}
                    <div
                      style={{ width: "180px", height: "180px", borderRadius: "24px 24px 0 0" }}
                      className="overflow-hidden relative shrink-0"
                    >
                      {p.hero_image ? (
                        <img
                          src={p.hero_image}
                          alt={p.project_name}
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
                        {p.project_name}
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
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
