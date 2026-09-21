"use client";

import {
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  type ChangeEvent,
} from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-hot-toast";

// dnd-kit
import { DndContext } from "@dnd-kit/core";
import { SortableContext, useSortable, arrayMove } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Dynamic import rich editor
const RichTextEditor = dynamic(() => import("@/components/RichTextEditor"), {
  ssr: false,
});

// Types
type StatusValue = "proposal" | "conceptual" | "construction" | "built";


const STATUS_OPTIONS = [
  { value: "proposal", label: "Proposal" },
  { value: "conceptual", label: "Conceptual" },
  { value: "construction", label: "Construction" },
  { value: "built", label: "Built" },
];

const CATEGORY_OPTIONS = [
  "Architecture",
  "Interior",
  "Landscape",
  "Urban Design",
];

const SUBCATEGORY_OPTIONS = [
  "Residential",
  "Public Space",
  "Commercial",
  "Hospitality",
  "Office",
  "Gym",
  "Education",
  "Cultural",
  "Mixed Use",
];

const PROJECTS_BUCKET = "project-images";

/* ---------- Helpers ---------- */

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function detectOrientation(file: File) {
  return new Promise<"landscape" | "portrait" | "square">((resolve) => {
    const img = new Image();
    img.onload = () => {
      if (img.width > img.height) resolve("landscape");
      else if (img.height > img.width) resolve("portrait");
      else resolve("square");
    };
    img.src = URL.createObjectURL(file);
  });
}

/* ---------- Sortable Item (Gallery) ---------- */

type SortableItemProps = {
  id: number;
  children: ReactNode;
};

function SortableItem({ id, children }: SortableItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

/* ===========================================================
   MAIN COMPONENT
=========================================================== */

export default function AdminProjectForm({
  mode = "create",
  projectId,
  initialProject,
}: {
  mode?: "create" | "edit";
  projectId?: string;
  initialProject?: any;
}) {


  const isEdit = mode === "edit";


  const router = useRouter();

  // Required fields
  const [projectName, setProjectName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEditedManually, setSlugEditedManually] = useState(false);

  const [status, setStatus] = useState("");
  const [yearStart, setYearStart] = useState("");
  const [yearEnd, setYearEnd] = useState("");
  const [isOngoing, setIsOngoing] = useState(false);

  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [isConfidentialLocation, setIsConfidentialLocation] = useState(false);

  const [categories, setCategories] = useState<string[]>([]);
  const [subcategories, setSubcategories] = useState<string[]>([]);

  // Ordering & Featured
  const [orderIndex, setOrderIndex] = useState("0");
  const [isFeatured, setIsFeatured] = useState(false);

  // Hero
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroPath, setHeroPath] = useState("");

  // Optional fields & Specifications
  const [siteArea, setSiteArea] = useState("");
  const [buildingArea, setBuildingArea] = useState("");
  const [buildingFloors, setBuildingFloors] = useState("");

  const [teamMembers, setTeamMembers] = useState<{ name: string; role: string }[]>([]);
  const [gallery, setGallery] = useState<
    { id: string, url: string; path: string; caption: string; orientation?: string }[]
  >([]);
  const [descriptionHtml, setDescriptionHtml] = useState("");

  // Form states
  const [saving, setSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [globalError, setGlobalError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Gallery UI states
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [selectedImages, setSelectedImages] = useState<number[]>([]);

  /* ---------- Auto slug ---------- */
  useEffect(() => {
    if (!slugEditedManually) setSlug(slugify(projectName));
  }, [projectName, slugEditedManually]);

  /* ---------- Year display ---------- */
  const yearDisplay = useMemo(() => {
    if (!yearStart && !yearEnd) return "";
    if (isOngoing) return `${yearStart}–Now`;
    if (yearStart && yearEnd) return `${yearStart}–${yearEnd}`;
    return yearStart || "";
  }, [yearStart, yearEnd, isOngoing]);

  /* ---------- Main tag for preview ---------- */
  const mainTag = useMemo(() => {
    if (subcategories.length > 0) return subcategories[0];
    if (categories.length > 0) return categories[0];
    return "";
  }, [categories, subcategories]);

  /* ---------- Toggle helper for chips ---------- */
  const toggle = (value: string, list: string[], setter: (v: string[]) => void) => {
    if (list.includes(value)) setter(list.filter((v) => v !== value));
    else setter([...list, value]);
  };

  /* ===========================================================
     HERO UPLOAD / DELETE
  =========================================================== */

  const uploadHero = async (e: ChangeEvent<HTMLInputElement>) => {
    try {
      const file = e.target.files?.[0];
      if (!file) return;

      const ext = file.name.split(".").pop();
      const path = `hero/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}.${ext}`;

      const { error } = await supabase.storage
        .from(PROJECTS_BUCKET)
        .upload(path, file);

      if (error) {
        console.error(error);
        toast.error("Failed to upload hero image");
        return;
      }

      const { data } = supabase.storage
        .from(PROJECTS_BUCKET)
        .getPublicUrl(path);

      setHeroImageUrl(data.publicUrl);
      setHeroPath(path);
      toast.success("Hero image uploaded!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to upload hero image");
    }
  };

  const deleteHero = async () => {
    if (!heroPath) return toast.error("No image to delete");

    const { error } = await supabase.storage
      .from(PROJECTS_BUCKET)
      .remove([heroPath]);

    if (error) {
      console.error(error);
      toast.error("Failed to delete hero image");
      return;
    }

    setHeroImageUrl("");
    setHeroPath("");
    toast.success("Hero image deleted!");
  };

  /* ===========================================================
     TEAM MEMBERS
  =========================================================== */

  const addTeamMember = () => {
    setTeamMembers((prev) => [...prev, { name: "", role: "" }]);
  };

  const updateTeamMember = (index: number, field: "name" | "role", value: string) => {
    setTeamMembers((prev) =>
      prev.map((tm, i) => (i === index ? { ...tm, [field]: value } : tm))
    );
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers((prev) => prev.filter((_, i) => i !== index));
  };

  /* ===========================================================
     GALLERY
  =========================================================== */

const uploadGallery = async (e: ChangeEvent<HTMLInputElement>) => {
  const files = Array.from(e.target.files || []) as File[];

  if (isEdit && !projectId) {
    toast.error("Missing project ID");
    return;
  }

  for (const file of files) {
    const ext = file.name.split(".").pop();
    const path = `gallery/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${ext}`;

    const orientation = await detectOrientation(file);

    // UPLOAD STORAGE
    const { error: uploadErr } = await supabase.storage
      .from(PROJECTS_BUCKET)
      .upload(path, file);

    if (uploadErr) {
      console.error(uploadErr);
      toast.error("Upload failed");
      continue;
    }

    const { data: urlData } = supabase.storage
      .from(PROJECTS_BUCKET)
      .getPublicUrl(path);

    // INSERT DB
    const { data: insertData, error: insertErr } = await supabase
      .from("project_images")
      .insert({
        project_id: isEdit ? projectId : null, // null saat CREATE, akan diupdate setelah save
        image_url: urlData.publicUrl,
        image_path: path,
        caption: "",
        orientation,
        order_index: gallery.length,
      })
      .select()
      .single();

    if (insertErr) {
      console.error(insertErr);
      toast.error("Failed to save gallery item");
      continue;
    }

    // UPDATE LOCAL STATE
    setGallery((prev) => [
      ...prev,
      {
        id: insertData.id,
        url: insertData.image_url,
        path: insertData.image_path,
        caption: "",
        orientation,
      },
    ]);
  }
};


  const updateGalleryCaption = (index: number, caption: string) => {
    setGallery((prev) =>
      prev.map((g, i) => (i === index ? { ...g, caption } : g))
    );
  };

const removeGalleryImage = async (index: number) => {
  const img = gallery[index];
  if (!img) return;

  // If there's no ID yet (newly added before project saved), just remove locally
  if (!img.id) {
    setGallery((prev) => prev.filter((_, i) => i !== index));
    return;
  }

  // DELETE storage
  await supabase.storage.from(PROJECTS_BUCKET).remove([img.path]);

  // DELETE database
  await supabase.from("project_images").delete().eq("id", img.id);

  // UPDATE STATE
  setGallery((prev) => prev.filter((_, i) => i !== index));
};




  /* ===========================================================
     SAVE DRAFT
  =========================================================== */

  const validateDraft = () => {
    const errors: Record<string, string> = {};

    if (!projectName.trim()) errors.projectName = "Project name is required.";
    if (!slug.trim()) errors.slug = "Slug is required.";
    if (!status) errors.status = "Status is required.";
    if (!yearStart.trim()) errors.yearStart = "Start year is required.";
    if (!city.trim()) errors.city = "City is required.";
    if (!country.trim()) errors.country = "Country is required.";
    if (categories.length === 0)
      errors.categories = "At least 1 category is required.";
    if (subcategories.length === 0)
      errors.subcategories = "At least 1 subcategory is required.";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      toast.error("Please fill all required fields (marked with *).");
      return false;
    }

    return true;
  };

const handleSaveDraft = async () => {
  if (!validateDraft()) return;

  setSaving(true);
  setGlobalError(null);
  setSuccessMessage(null);

  try {
    let error;

    if (isEdit) {
      // ============================
      // UPDATE MODE
      // ============================
      const response = await supabase
        .from("projects")
        .update({
          project_name: projectName.trim(),
          slug: slug.trim(),
          hero_image: heroImageUrl || null,
          status,
          year_start: yearStart ? parseInt(yearStart) : null,
          year_end: isOngoing || !yearEnd ? null : parseInt(yearEnd),
          is_ongoing: isOngoing,
          city: city.trim(),
          country: country.trim(),
          is_confidential_location: isConfidentialLocation,
          categories,
          subcategories,
          site_area: siteArea.trim() || null,
          building_area: buildingArea.trim() || null,
          building_floors: buildingFloors.trim() || null,
          team_members: teamMembers,
          description_html: descriptionHtml || null,
          order_index: parseInt(orderIndex || "0"),
          is_featured: isFeatured,
        })
        .eq("id", projectId)
        .select()
        .single();

      error = response.error;
    } else {
      // ============================
      // CREATE MODE
      // ============================
      const { data: created, error: createError } = await supabase
        .from("projects")
        .insert({
          project_name: projectName.trim(),
          slug: slug.trim(),
          hero_image: heroImageUrl || null,
          status,
          year_start: yearStart ? parseInt(yearStart) : null,
          year_end: isOngoing || !yearEnd ? null : parseInt(yearEnd),
          is_ongoing: isOngoing,
          city: city.trim(),
          country: country.trim(),
          is_confidential_location: isConfidentialLocation,
          categories,
          subcategories,
          site_area: siteArea.trim() || null,
          building_area: buildingArea.trim() || null,
          building_floors: buildingFloors.trim() || null,
          team_members: teamMembers,
          description_html: descriptionHtml || null,
          order_index: parseInt(orderIndex || "0"),
          is_featured: isFeatured,
          is_published: false,
        })
        .select()
        .single();

      error = createError;

      if (!createError && created?.id) {
        // LINK all gallery images with missing project_id
        await supabase
          .from("project_images")
          .update({ project_id: created.id })
          .is("project_id", null);

        toast.success("Gallery linked!");
      }
    }

    if (error) {
      console.error("Save project error details:", error);
      const errMsg = error.message || error.details || "Failed to save project";
      toast.error(errMsg);
      setGlobalError(errMsg);
    } else {
      toast.success(isEdit ? "Project updated!" : "Draft saved!");
      router.push("/admin/projects");
    }
  } catch (err: any) {
    console.error("Save project unexpected error:", err);
    const errMsg = err?.message || "Unexpected error occurred while saving.";
    toast.error(errMsg);
    setGlobalError(errMsg);
  } finally {
    setSaving(false);
  }
};


    // --- PREFILL STATE SAAT EDIT ---
  useEffect(() => {
    if (mode !== "edit" || !initialProject) return;

    setProjectName(initialProject.project_name ?? "");
    setSlug(initialProject.slug ?? "");
    // jangan auto-edit slug kalau user pernah ubah manual di edit
    setSlugEditedManually(true);

    setStatus(initialProject.status ?? "");
    setYearStart(
      initialProject.year_start != null
        ? String(initialProject.year_start)
        : ""
    );
    setYearEnd(
      initialProject.year_end != null ? String(initialProject.year_end) : ""
    );
    setIsOngoing(Boolean(initialProject.is_ongoing));

    setCity(initialProject.city ?? "");
    setCountry(initialProject.country ?? "");
    setIsConfidentialLocation(
      Boolean(initialProject.is_confidential_location)
    );

    setCategories(initialProject.categories ?? []);
    setSubcategories(initialProject.subcategories ?? []);

    setSiteArea(initialProject.site_area ?? "");
    setBuildingArea(initialProject.building_area ?? "");
    setBuildingFloors(initialProject.building_floors ?? initialProject.floors_count ?? "");

    setOrderIndex(
      initialProject.order_index != null
        ? String(initialProject.order_index)
        : "0"
    );
    setIsFeatured(Boolean(initialProject.is_featured));

    // hero_image di table projects (url)
    setHeroImageUrl(initialProject.hero_image ?? "");
    // kita belum simpan path di DB, jadi biarin kosong
    setHeroPath("");

    setTeamMembers(initialProject.team_members ?? []);
    setDescriptionHtml(initialProject.description_html ?? "");


  // AFTER main prefill
// =============================
// FETCH GALLERY FROM project_images
// =============================
async function loadGallery() {
  if (!initialProject?.id) return;

  const { data, error } = await supabase
    .from("project_images")
    .select("*")
    .eq("project_id", initialProject.id)
    .order("order_index", { ascending: true });

  if (!error && data) {
    setGallery(
      data.map((img: any) => ({
        id: img.id,
        url: img.image_url,
        path: img.image_path,
        caption: img.caption || "",
        orientation: img.orientation || "landscape",
      }))
    );
  }
}

loadGallery();


    // gallery: kamu bilang pakai table terpisah project_images,
    // dan belum di-load di sini, jadi untuk sekarang biarin [] dulu.
    // Nanti kalau mau bisa tambah fetch ke project_images di EditProjectPage.
  }, [mode, initialProject]);

  /* ===========================================================
     RENDER
  =========================================================== */

  return (
    <>
      <div className="min-h-screen bg-[#050509] text-gray-100 font-sans">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pb-48 pt-12 md:flex-row md:px-8 md:pb-56">
          {/* ============= LEFT: FORM ============= */}
          <div className="w-full md:w-2/3">
            {/* BREADCRUMB */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
                Admin • Projects
              </span>
            </div>

            <h1 className="mb-2 text-3xl font-semibold text-white">
              <span className="mr-2 text-adidaya-red">*</span>
              {mode === "edit" ? "Edit Project" : "Create New Project"}
            </h1>

            <p className="mb-6 text-xs text-gray-500">
              {mode === "edit" ? (
                <>Update the project details below. Fields with <span className="text-adidaya-red">*</span> are required.</>
              ) : (
                <>Fields with <span className="text-adidaya-red">*</span> are required.</>
              )}
            </p>

            {globalError && (
              <div className="mb-5 rounded-2xl border border-red-800 bg-red-900/20 px-4 py-3 text-sm text-red-300">
                {globalError}
              </div>
            )}

            {successMessage && (
              <div className="mb-5 rounded-2xl border border-green-800 bg-green-900/20 px-4 py-3 text-sm text-green-300">
                {successMessage}
              </div>
            )}

            <div className="space-y-10">
              {/* PROJECT NAME + SLUG */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                    Project Name <span className="text-adidaya-red">*</span>
                  </label>
                  <input
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="Grha Gandana"
                    className="w-full rounded-full border border-gray-700 bg-[#111] px-4 py-3 text-sm text-gray-100 focus:border-adidaya-red outline-none"
                  />
                  {fieldErrors.projectName && (
                    <p className="mt-1 text-xs text-red-400">
                      {fieldErrors.projectName}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                    Slug <span className="text-adidaya-red">*</span>
                  </label>
                  <input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      setSlugEditedManually(true);
                    }}
                    placeholder="grha-gandana"
                    className="w-full rounded-full border border-gray-700 bg-[#111] px-4 py-3 text-sm text-gray-100 focus:border-adidaya-red outline-none"
                  />
                  {fieldErrors.slug && (
                    <p className="mt-1 text-xs text-red-400">
                      {fieldErrors.slug}
                    </p>
                  )}
                </div>
              </div>

              {/* STATUS */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Status <span className="text-adidaya-red">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {STATUS_OPTIONS.map((s) => (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => setStatus(s.value as StatusValue)}
                      className={`rounded-full border px-4 py-2 text-xs transition ${
                        status === s.value
                          ? "bg-adidaya-red border-adidaya-red text-white"
                          : "border-gray-600 bg-[#111] text-gray-300 hover:border-adidaya-red"
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* YEAR */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Year <span className="text-adidaya-red">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={yearStart}
                    onChange={(e) => setYearStart(e.target.value)}
                    placeholder="2018"
                    className="w-28 rounded-full border border-gray-700 bg-[#111] px-4 py-2 text-sm text-gray-100 focus:border-adidaya-red outline-none"
                  />
                  <span className="text-gray-500">—</span>
                  <input
                    value={yearEnd}
                    onChange={(e) => setYearEnd(e.target.value)}
                    disabled={isOngoing}
                    placeholder="2023"
                    className="w-28 rounded-full border border-gray-700 bg-[#111] px-4 py-2 text-sm text-gray-100 disabled:opacity-40 focus:border-adidaya-red outline-none"
                  />
                </div>

                <label className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={isOngoing}
                    onChange={(e) => {
                      setIsOngoing(e.target.checked);
                      if (e.target.checked) setYearEnd("");
                    }}
                    className="h-3 w-3 rounded border border-gray-500"
                  />
                  Project is ongoing (…–Now)
                </label>

                {fieldErrors.yearStart && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldErrors.yearStart}
                  </p>
                )}
              </div>

              {/* LOCATION */}
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                    City <span className="text-adidaya-red">*</span>
                  </label>
                  <input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Bandung"
                    className="w-full rounded-full border border-gray-700 bg-[#111] px-4 py-3 text-sm text-gray-100 focus:border-adidaya-red outline-none"
                  />
                  {fieldErrors.city && (
                    <p className="mt-1 text-xs text-red-400">
                      {fieldErrors.city}
                    </p>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                    Country <span className="text-adidaya-red">*</span>
                  </label>
                  <input
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="Indonesia"
                    className="w-full rounded-full border border-gray-700 bg-[#111] px-4 py-3 text-sm text-gray-100 focus:border-adidaya-red outline-none"
                  />
                  {fieldErrors.country && (
                    <p className="mt-1 text-xs text-red-400">
                      {fieldErrors.country}
                    </p>
                  )}
                </div>
              </div>

              <label className="flex items-center gap-2 text-xs text-gray-400">
                <input
                  type="checkbox"
                  checked={isConfidentialLocation}
                  onChange={(e) => setIsConfidentialLocation(e.target.checked)}
                  className="h-3 w-3 rounded border border-gray-500"
                />
                Hide exact location in public page
              </label>

              {/* CATEGORIES */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Categories <span className="text-adidaya-red">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {CATEGORY_OPTIONS.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => toggle(cat, categories, setCategories)}
                      className={`rounded-full border px-4 py-2 text-xs transition ${
                        categories.includes(cat)
                          ? "bg-adidaya-red border-adidaya-red text-white"
                          : "border-gray-600 bg-[#111] text-gray-300 hover:border-adidaya-red"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                {fieldErrors.categories && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldErrors.categories}
                  </p>
                )}
              </div>

              {/* SUBCATEGORIES */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Subcategories <span className="text-adidaya-red">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {SUBCATEGORY_OPTIONS.map((sub) => (
                    <button
                      key={sub}
                      type="button"
                      onClick={() =>
                        toggle(sub, subcategories, setSubcategories)
                      }
                      className={`rounded-full border px-4 py-2 text-xs transition ${
                        subcategories.includes(sub)
                          ? "bg-adidaya-red border-adidaya-red text-white"
                          : "border-gray-600 bg-[#111] text-gray-300 hover:border-adidaya-red"
                      }`}
                    >
                      {sub}
                    </button>
                  ))}
                </div>
                {fieldErrors.subcategories && (
                  <p className="mt-1 text-xs text-red-400">
                    {fieldErrors.subcategories}
                  </p>
                )}
              </div>

              {/* SPECIFICATIONS (SITE AREA, BUILDING AREA, BUILDING / FLOORS) - OPTIONAL */}
              <div className="mt-8 pt-6 border-t border-neutral-800/80">
                <div className="mb-4">
                  <p className="text-xs uppercase tracking-[0.2em] text-neutral-400 font-semibold">
                    Project Specifications <span className="text-neutral-600 text-[10px] normal-case tracking-normal">(Optional)</span>
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* SITE AREA */}
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-gray-500">
                      Site Area
                    </label>
                    <div className="relative flex items-center">
                      <input
                        value={siteArea}
                        onChange={(e) => setSiteArea(e.target.value)}
                        className="w-full rounded-full border border-gray-700 bg-[#111] pl-4 pr-12 py-3 text-xs sm:text-sm text-gray-100 focus:border-adidaya-red outline-none"
                      />
                      <span className="absolute right-4 text-xs font-medium text-neutral-400 select-none pointer-events-none">
                        m²
                      </span>
                    </div>
                  </div>

                  {/* BUILDING AREA */}
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-gray-500">
                      Building Area
                    </label>
                    <div className="relative flex items-center">
                      <input
                        value={buildingArea}
                        onChange={(e) => setBuildingArea(e.target.value)}
                        className="w-full rounded-full border border-gray-700 bg-[#111] pl-4 pr-12 py-3 text-xs sm:text-sm text-gray-100 focus:border-adidaya-red outline-none"
                      />
                      <span className="absolute right-4 text-xs font-medium text-neutral-400 select-none pointer-events-none">
                        m²
                      </span>
                    </div>
                  </div>

                  {/* FLOORS */}
                  <div>
                    <label className="mb-1.5 block text-xs uppercase tracking-[0.16em] text-gray-500">
                      Floors
                    </label>
                    <div className="relative flex items-center">
                      <input
                        value={buildingFloors}
                        onChange={(e) => setBuildingFloors(e.target.value)}
                        className="w-full rounded-full border border-gray-700 bg-[#111] pl-4 pr-16 py-3 text-xs sm:text-sm text-gray-100 focus:border-adidaya-red outline-none"
                      />
                      <span className="absolute right-4 text-xs font-medium text-neutral-400 select-none pointer-events-none">
                        Floors
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ORDER & FEATURED */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                    Order Index
                  </label>
                  <input
                    type="number"
                    value={orderIndex}
                    onChange={(e) => setOrderIndex(e.target.value)}
                    className="w-full rounded-full border border-gray-700 bg-[#111] px-4 py-3 text-sm text-gray-100 focus:border-adidaya-red outline-none"
                    placeholder="0"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                    Featured
                  </label>

                  <div className="flex items-center gap-3 mt-2">
                    <button
                      type="button"
                      onClick={() => setIsFeatured(true)}
                      className={`px-4 py-2 rounded-full text-xs border ${
                        isFeatured
                          ? "bg-adidaya-red border-adidaya-red text-white"
                          : "border-gray-600 bg-[#111] text-gray-300 hover:border-adidaya-red"
                      }`}
                    >
                      Yes
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFeatured(false)}
                      className={`px-4 py-2 rounded-full text-xs border ${
                        !isFeatured
                          ? "bg-adidaya-red border-adidaya-red text-white"
                          : "border-gray-600 bg-[#111] text-gray-300 hover:border-adidaya-red"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>

              {/* HERO IMAGE */}
              <div className="space-y-2 w-full">
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  HERO IMAGE <span className="text-adidaya-red">*</span>
                </label>

                <div className="relative w-full aspect-[16/9] bg-[#0b0b0c] border border-gray-800 rounded-2xl flex items-center justify-center overflow-hidden group">
                  {heroImageUrl ? (
                    <img
                      src={heroImageUrl}
                      alt="Hero"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-500">No image</span>
                  )}

                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3">
                    {heroImageUrl && (
                      <button
                        onClick={deleteHero}
                        className="px-4 py-2 rounded-full bg-[#111]/80 text-gray-200 border border-gray-700 text-sm backdrop-blur-sm transition hover:bg-adidaya-red hover:border-adidaya-red"
                      >
                        Delete
                      </button>
                    )}

                    <label className="px-4 py-2 rounded-full cursor-pointer bg-[#111]/80 text-gray-200 border border-gray-700 text-sm backdrop-blur-sm transition hover:bg-adidaya-red hover:border-adidaya-red">
                      {heroImageUrl ? "Replace image" : "Upload image"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={uploadHero}
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* TEAM MEMBERS */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Team Members
                </label>
                <div className="space-y-4">
                  {teamMembers.map((tm, index) => (
                    <div
                      key={index}
                      className="flex flex-col md:flex-row md:items-center gap-3"
                    >
                      <input
                        value={tm.name}
                        onChange={(e) =>
                          updateTeamMember(index, "name", e.target.value)
                        }
                        placeholder="Name"
                        className="flex-1 rounded-full border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-sm text-gray-200 focus:border-adidaya-red transition focus:outline-none focus:ring-0"
                      />

                      <input
                        value={tm.role}
                        onChange={(e) =>
                          updateTeamMember(index, "role", e.target.value)
                        }
                        placeholder="Role"
                        className="flex-1 rounded-full border border-gray-700 bg-[#1a1a1a] px-4 py-2 text-sm text-gray-200 focus:border-adidaya-red focus:outline-none focus:ring-0"
                      />

                      <button
                        onClick={() => removeTeamMember(index)}
                        className="text-xs text-red-400 hover:text-red-300 whitespace-nowrap"
                      >
                        Remove
                      </button>
                    </div>
                  ))}

                  <button
                    onClick={addTeamMember}
                    type="button"
                    className="rounded-full border border-gray-700 px-4 py-2 text-xs text-gray-300 hover:border-adidaya-red"
                  >
                    + Add Team Member
                  </button>
                </div>
              </div>

              {/* GALLERY IMAGES */}
                <div>
                {/* HEADER */}
                <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs uppercase tracking-[0.2em] text-gray-500">
                    GALLERY IMAGES
                    </label>

                    <div className="flex items-center gap-3">
                    {/* Multi Delete Toggle */}
                    <button
                        onClick={() => {
                        setDeleteMode(!deleteMode);
                        setSelectedImages([]);
                        }}
                        className={`text-xs ${
                        deleteMode ? "text-adidaya-red" : "text-gray-400"
                        } hover:text-adidaya-red`}
                    >
                        {deleteMode ? "Cancel" : "Multi Delete"}
                    </button>

                    {/* Confirm Delete */}
                    {deleteMode && selectedImages.length > 0 && (
                        <button
                        onClick={() => {
                            const filtered = gallery.filter((_, idx) => !selectedImages.includes(idx));
                            setGallery(filtered);
                            setSelectedImages([]);
                            setDeleteMode(false);
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                        >
                        Delete ({selectedImages.length})
                        </button>
                    )}
                    </div>
                </div>

                {/* GRID 3/4 IMAGES + 1/4 ADD BTN */}
                <div className="grid grid-cols-4 gap-4 w-full">

                    {/* LEFT — SCROLLABLE IMAGES */}
                    <div className="col-span-3">
                    {gallery.length === 0 ? (
                        <div className="h-36 flex items-center justify-center rounded-2xl border border-gray-700 bg-[#111] text-gray-500">
                        No images yet
                        </div>
                    ) : (
                        <div className="overflow-x-auto scrollbar-hide pb-2">
                        <div className="flex gap-4">
                            {gallery.map((img, index) => (
                            <div
                                key={index}
                                className="
                                relative shrink-0 
                                h-36 
                                rounded-2xl overflow-hidden 
                                border border-gray-700 bg-[#111]
                                "
                                style={{ width: "auto", aspectRatio: img.orientation === "portrait" ? "3/4" : "4/3" }}
                            >
                                {/* PREVIEW MODE */}
                                {!deleteMode && (
                                <img
                                    src={img.url}
                                    onClick={() => setPreviewImage(img.url)}
                                    className="w-full h-full object-cover cursor-pointer"
                                />
                                )}

                                {/* MULTI DELETE MODE */}
                                {deleteMode && (
                                <div
                                    onClick={() => {
                                    setSelectedImages(prev =>
                                        prev.includes(index)
                                        ? prev.filter(i => i !== index)
                                        : [...prev, index]
                                    );
                                    }}
                                    className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer"
                                >
                                    <div
                                    className={`h-5 w-5 rounded border ${
                                        selectedImages.includes(index)
                                        ? "bg-adidaya-red border-adidaya-red"
                                        : "border-gray-400"
                                    }`}
                                    ></div>
                                </div>
                                )}

                                {/* DELETE BUTTON */}
                                {!deleteMode && (
                                <button
                                    onClick={() => removeGalleryImage(index)}
                                    className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-1 text-xs text-white hover:bg-black/80"
                                >
                                    ✕
                                </button>
                                )}

                                {/* CAPTION */}
                                {!deleteMode && (
                                <input
                                    value={img.caption}
                                    onChange={(e) =>
                                    updateGalleryCaption(index, e.target.value)
                                    }
                                    placeholder="Caption (optional)"
                                    className="
                                    absolute bottom-0 left-0 right-0
                                    bg-black/60 backdrop-blur-sm px-2 py-1
                                    text-[10px] text-gray-200 placeholder-gray-400 
                                    outline-none
                                    "
                                />
                                )}
                            </div>
                            ))}
                        </div>
                        </div>
                    )}
                    </div>

                    {/* RIGHT — ADD BUTTON */}
                    <label
                    className="
                        col-span-1 h-36 flex items-center justify-center
                        rounded-2xl border border-dashed border-gray-700
                        bg-[#111] cursor-pointer text-xs text-gray-400
                        hover:border-adidaya-red hover:text-adidaya-red
                    "
                    >
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        className="hidden"
                        onChange={uploadGallery}
                    />
                    + Add Images
                    </label>
                </div>

                {/* FULLSCREEN PREVIEW */}
                {previewImage && (
                    <div
                    onClick={() => setPreviewImage(null)}
                    className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
                    >
                    <img
                        src={previewImage}
                        className="max-h-[90vh] max-w-[90vw] rounded-2xl"
                    />
                    </div>
                )}
                </div>


              {/* DESCRIPTION RICH TEXT */}
              <div>
                <label className="mb-2 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Description (optional)
                </label>
                <RichTextEditor
                  value={descriptionHtml}
                  onChange={setDescriptionHtml}
                  onUploadImage={async (file) => {
                    const ext = file.name.split(".").pop();
                    const path = `description/${Date.now()}-${Math.random()
                      .toString(36)
                      .slice(2)}.${ext}`;

                    const { error } = await supabase.storage
                      .from("project-images")
                      .upload(path, file);

                    if (error) throw error;

                    const { data } = supabase.storage
                      .from("project-images")
                      .getPublicUrl(path);

                    return data.publicUrl;
                  }}
                />

              </div>
            </div>
          </div>

          {/* ============= RIGHT: PREVIEW ============= */}
          <div className="w-full md:w-1/3 md:sticky md:top-10 md:self-start">
            <h2 className="mb-3 text-xs uppercase tracking-[0.3em] text-gray-500">
              Preview
            </h2>
            <div className="rounded-3xl overflow-hidden border border-gray-800 bg-[#101015]">
              {/* HERO */}
              <div className="bg-black">
                {heroImageUrl ? (
                  <img
                    src={heroImageUrl}
                    className="h-56 w-full object-cover"
                  />
                ) : (
                  <div className="h-56 flex items-center justify-center text-gray-600 text-xs">
                    No hero image
                  </div>
                )}
              </div>
              {/* INFO */}
              <div className="space-y-1 px-5 py-4 text-xs text-gray-300">
                <p className="text-sm font-medium text-gray-100">
                  {projectName || "Project Name"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {isConfidentialLocation
                    ? country
                      ? `Private Location, ${country}`
                      : "Private Location"
                    : city || country
                    ? `${city}${country ? `, ${country}` : ""}`
                    : "Location"}
                </p>
                <p className="text-[11px] text-gray-500">
                  {yearDisplay || "Year"}
                </p>
                {mainTag && (
                  <span className="inline-block mt-2 rounded-full px-3 py-1 border border-gray-600 text-[10px] uppercase tracking-[0.15em] text-gray-300">
                    {mainTag}
                  </span>
                )}
              </div>
            </div>

            {/* Quick Summary */}
            <div className="mt-4 rounded-2xl border border-gray-800 bg-[#101015] px-4 py-3 text-[11px] text-gray-400">
              <p className="font-medium text-gray-200 mb-1">Quick Summary</p>
              <p className="text-gray-400">
                {categories.length > 0 && (
                  <>
                    Categories:{" "}
                    <span className="text-gray-200">
                      {categories.join(", ")}
                    </span>
                    <br />
                  </>
                )}
                {subcategories.length > 0 && (
                  <>
                    Subcategories:{" "}
                    <span className="text-gray-200">
                      {subcategories.join(", ")}
                    </span>
                    <br />
                  </>
                )}
                Status:{" "}
                <span className="text-gray-200">
                  {STATUS_OPTIONS.find((s) => s.value === status)?.label}
                </span>
              </p>
            </div>
          </div>
        </div>

        {/* BOTTOM ACTION BAR (SETINGGI FOOTER HALAMAN ASLI) */}
        <div className="fixed inset-x-0 bottom-0 bg-[#050509]/95 border-t border-white/10 backdrop-blur-xl z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] py-6 md:py-8 px-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-neutral-400 font-medium">
              Save as draft to continue later.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => router.push("/admin/projects")}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDraft}
                disabled={saving}
                className="rounded-full border border-adidaya-red bg-adidaya-red px-7 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Save Draft"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL PREVIEW FULLSCREEN */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 cursor-pointer"
        >
          <img
            src={previewImage}
            className="max-h-[90vh] max-w-[90vw] rounded-2xl"
          />
        </div>
      )}
    </>
  );
}
