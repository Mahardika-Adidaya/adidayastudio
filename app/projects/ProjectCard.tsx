"use client";

import Link from "next/link";

type Project = {
  id?: string;
  slug?: string;
  project_name?: string | null;
  hero_image?: string | null;
  categories?: string[] | null;
  subcategories?: string[] | null;
  city?: string | null;
  country?: string | null;
};

type ProjectCardProps = {
  project: Project;
};

export default function ProjectCard({ project }: ProjectCardProps) {
  const title = project.project_name || "Untitled";
  const hero = project.hero_image || "";

  const categories = project.categories || [];
  const subcategories = project.subcategories || [];

  const cat = categories[0] || "";
  const sub = subcategories[0] || "";

  const city = project.city || "";
  const country = project.country || "";

  let location = "";
  if (country.toLowerCase() === "indonesia") {
    location = city;
  } else if (city && country) {
    location = `${city}, ${country}`;
  } else {
    location = city || country;
  }

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="block break-inside-avoid"
    >
      <div className="group bg-neutral-900 rounded-3xl overflow-hidden border border-neutral-800 hover:border-neutral-600 transition duration-300">
        
        {/* IMAGE (LANDSCAPE 16:10 RATIO WITH HOVER ZOOM) */}
        <div className="aspect-[16/10] w-full overflow-hidden bg-neutral-950 relative">
          {hero ? (
            <img
              src={hero}
              alt={title}
              className="h-full w-full object-cover group-hover:scale-105 transition duration-500 ease-out"
            />
          ) : (
            <div className="w-full h-full bg-neutral-800" />
          )}
        </div>

        {/* TEXT (ORIGINAL CAPTION PRESERVED) */}
        <div className="px-5 py-5 text-left">
          <h3 className="text-lg font-semibold leading-snug mb-1 group-hover:text-adidaya-red transition-colors line-clamp-1">
            {title}
          </h3>

          <p className="text-gray-400 text-sm">
            {cat}
            {sub && ` | ${sub}`}
          </p>

          {location && (
            <p className="text-gray-400 text-sm mt-0.5">{location}</p>
          )}
        </div>

      </div>
    </Link>
  );
}
