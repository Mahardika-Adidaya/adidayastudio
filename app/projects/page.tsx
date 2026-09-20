"use client";

import { Suspense } from "react";
export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
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

  const [filter, setFilter] = useState<Filter>({
    category: null,
    subcategory: null,
  });

  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  const capitalize = (str: string) =>
    str.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  useEffect(() => {
    if (urlCategory && urlCategory !== "all") {
      setFilter({ category: capitalize(urlCategory), subcategory: null });
      setActiveTab(capitalize(urlCategory));
    }

    if (urlSub && urlSub !== "all") {
      setFilter({ category: null, subcategory: capitalize(urlSub) });
      setActiveTab("all");
    }
  }, []);

  useEffect(() => {
    async function fetchProjects() {
      let query = supabase
        .from("projects")
        .select(
          "id, slug, project_name, hero_image, categories, subcategories, city, country, order_index"
        )
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (filter.category) query = query.contains("categories", [filter.category]);
      if (filter.subcategory)
        query = query.contains("subcategories", [filter.subcategory]);

      const { data, error } = await query;
      setProjects(error ? [] : (data ?? []));
    }

    fetchProjects();
  }, [filter]);

  const filteredProjects = projects.filter((p) => {
    if (!filter.search) return true;
    const q = filter.search.toLowerCase();
    return (
      p.project_name?.toLowerCase().includes(q) ||
      p.city?.toLowerCase().includes(q) ||
      p.country?.toLowerCase().includes(q) ||
      p.slug?.toLowerCase().includes(q) ||
      p.categories?.some((c) => c.toLowerCase().includes(q)) ||
      p.subcategories?.some((s) => s.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-black text-white px-6 lg:px-20 py-16">
      <ProjectSectionHeader title="Projects" />
      <FilterBar onFilterChange={setFilter} initialFilter={filter} />

      {filteredProjects.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-24 px-4 max-w-lg mx-auto">
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
            No projects in this category yet
          </h3>
          <p className="text-sm text-adidaya-text-muted leading-relaxed">
            We hope to create and showcase projects in the category you are looking for soon. If you have a vision in mind, let&apos;s collaborate to make it a reality.
          </p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-8 mt-12 space-y-8">
          {filteredProjects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}
