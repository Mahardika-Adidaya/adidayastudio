"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import useUserProfile from "@/hooks/useUserProfile";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  X,
  Building2,
  Edit2,
  Share2,
} from "lucide-react";
import ShareModal, { ShareItemData } from "@/components/ui/ShareModal";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

/* =========================================================
   TYPES & HELPERS
========================================================= */
type Project = {
  id: string;
  project_name: string;
  status: string;
  slug: string;

  year_start: number | null;
  year_end: number | null;
  is_ongoing: boolean;

  city: string | null;
  country: string | null;

  categories: string[] | null;
  subcategories: string[] | null;

  site_area?: string | null;
  building_area?: string | null;
  building_floors?: string | null;

  team_members: { name: string; role: string }[] | null;

  hero_image: string | null;
  is_published: boolean;
  order_index: number;

  created_at: string;
  updated_at: string | null;
};

type StatusFilter = "all" | "draft" | "published";
type SortKey = "order" | "created_at" | "updated_at";

const formatStatusLabel = (status?: string | null) => {
  if (!status) return "—";
  return status.charAt(0).toUpperCase() + status.slice(1);
};

const formatYearRange = (
  start: number | null,
  end: number | null,
  isOngoing: boolean
) => {
  if (!start) return "Year —";
  if (isOngoing) return `${start} – Now`;
  if (end) return `${start} – ${end}`;
  return `${start}`;
};

/* =========================================================
   ROLE PERMISSIONS
========================================================= */
const canPublish = (role: string | null | undefined) =>
  role === "admin" || role === "supervisor";

const canDelete = (role: string | null | undefined) => role === "admin";

const canEdit = (role: string | null | undefined, isPublished: boolean) => {
  // Semua role bisa edit draft
  if (!isPublished) return true;
  // Published hanya admin & supervisor
  return role === "admin" || role === "supervisor";
};

/* =========================================================
   SORTABLE PROJECT ITEM
========================================================= */
function SortableProjectItem({
  project,
  expanded,
  onExpand,
  onPreview,
  onTogglePublish,
  onEdit,
  onDelete,
  onShare,
  role,
}: {
  project: Project;
  expanded: boolean;
  onExpand: () => void;
  onPreview: () => void;
  onTogglePublish: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onShare: () => void;
  role: string | null | undefined;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: project.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const statusBadgeClass = project.is_published
    ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
    : "bg-gray-900/60 border border-gray-700 text-gray-300";

  const locationLabel =
    project.city && project.country
      ? `${project.city}, ${project.country}`
      : "Location —";

  const yearLabel = formatYearRange(
    project.year_start,
    project.year_end,
    project.is_ongoing
  );

  const mainCategory =
    project.categories && project.categories.length > 0
      ? project.categories[0]
      : null;

  const editAllowed = canEdit(role, project.is_published);
  const publishAllowed = canPublish(role);
  const deleteAllowed = canDelete(role);

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="rounded-3xl bg-[#0b0b0b] border border-neutral-800 overflow-hidden"
    >
      {/* COLLAPSED HEADER ROW */}
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-4 min-w-0">
          {/* Drag handle */}
          <button
            {...attributes}
            {...listeners}
            className="cursor-grab opacity-40 hover:opacity-80"
          >
            ⋮⋮
          </button>

          {/* Order index */}
          <span className="text-xs text-neutral-500 w-8">
            #{project.order_index}
          </span>

          {/* Name */}
          <span className="font-semibold text-white truncate max-w-[180px]">
            {project.project_name}
          </span>

          {/* Status */}
          <span
            className={`ml-3 px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.14em] ${statusBadgeClass}`}
          >
            {project.is_published ? "Published" : "Draft"}
          </span>

          {/* Location */}
          <span className="ml-4 text-xs text-neutral-500 truncate max-w-[180px]">
            {locationLabel}
          </span>

          {/* Year */}
          <span className="ml-4 text-xs text-neutral-500">{yearLabel}</span>

          {/* Category */}
          {mainCategory ? (
            <span className="ml-4 px-3 py-1 rounded-full text-[11px] border border-neutral-700 text-neutral-300">
              {mainCategory}
            </span>
          ) : (
            <span className="ml-4 text-xs text-neutral-600">Category —</span>
          )}
        </div>

        {/* Expand toggle */}
        <button
          onClick={onExpand}
          className="text-neutral-500 hover:text-white text-lg font-semibold"
        >
          {expanded ? "−" : "+"}
        </button>
      </div>

      {/* EXPANDED CONTENT */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
          >
            <div className="border-t border-neutral-800 bg-[#070707] px-6 py-6 grid grid-cols-12 gap-8">
              {/* LEFT: Thumbnail */}
              <div className="col-span-12 md:col-span-4">
                {project.hero_image ? (
                  <img
                    src={project.hero_image}
                    className="w-full h-48 rounded-xl object-cover border border-neutral-800"
                  />
                ) : (
                  <div className="w-full h-48 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
                    No image
                  </div>
                )}
              </div>

              {/* RIGHT: Meta info */}
              <div className="col-span-12 md:col-span-8 space-y-4">
                {/* Status */}
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                    Project Status
                  </p>
                  <p className="mt-1 text-sm text-white">
                    {formatStatusLabel(project.status)}
                  </p>
                </div>

                {/* Year + Location */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                      Year
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {yearLabel.replace("Year ", "")}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                      Location
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {project.city && project.country
                        ? `${project.city}, ${project.country}`
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Category / Subcategory */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                      Category
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {project.categories?.length
                        ? project.categories.join(", ")
                        : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                      Subcategory
                    </p>
                    <p className="mt-1 text-sm text-white">
                      {project.subcategories?.length
                        ? project.subcategories.join(", ")
                        : "—"}
                    </p>
                  </div>
                </div>

                {/* Specifications */}
                {(project.site_area || project.building_area || project.building_floors) && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                    {project.site_area && (
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                          Site Area
                        </p>
                        <p className="mt-0.5 text-xs text-white font-medium">
                          {project.site_area}
                        </p>
                      </div>
                    )}
                    {project.building_area && (
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                          Building Area
                        </p>
                        <p className="mt-0.5 text-xs text-white font-medium">
                          {project.building_area}
                        </p>
                      </div>
                    )}
                    {project.building_floors && (
                      <div>
                        <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-mono">
                          Floors
                        </p>
                        <p className="mt-0.5 text-xs text-white font-medium">
                          {project.building_floors}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Team Members */}
                <div>
                  <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                    Team Members
                  </p>
                  {project.team_members?.length ? (
                    <ul className="mt-1 list-disc ml-5 text-sm text-white/90">
                      {project.team_members.map((m, i) => (
                        <li key={`${m.name}-${i}`}>
                          {m.name} — {m.role}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-sm text-white/80">—</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-3 pt-4">
                  {/* Preview: semua role boleh */}
                  <button
                    type="button"
                    onClick={onPreview}
                    className="px-5 py-2 rounded-full border border-neutral-700 bg-neutral-900 text-sm hover:border-neutral-500"
                  >
                    Preview
                  </button>

                  {/* Share & Story */}
                  <button
                    type="button"
                    onClick={onShare}
                    className="px-5 py-2 rounded-full border border-neutral-700 bg-neutral-900 text-sm text-white hover:border-adidaya-red hover:text-adidaya-red transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Share2 size={13} strokeWidth={1.75} />
                    <span>Share</span>
                  </button>

                  {/* Edit */}
                  <button
                    type="button"
                    onClick={editAllowed ? onEdit : undefined}
                    disabled={!editAllowed}
                    className={`px-5 py-2 rounded-full border text-sm ${
                      !editAllowed
                        ? "border-neutral-800 bg-neutral-900 text-neutral-500 opacity-40 cursor-not-allowed"
                        : "border-neutral-700 bg-neutral-900 text-white hover:border-neutral-500"
                    }`}
                  >
                    Edit
                  </button>

                  {/* Publish / Unpublish */}
                  <button
                    type="button"
                    onClick={publishAllowed ? onTogglePublish : undefined}
                    disabled={!publishAllowed}
                    className={`px-5 py-2 rounded-full text-sm ${
                      !publishAllowed
                        ? "border-neutral-800 bg-neutral-900 text-neutral-500 opacity-40 cursor-not-allowed"
                        : project.is_published
                        ? "border border-neutral-600 bg-neutral-900 text-neutral-200 hover:border-neutral-400"
                        : "border border-emerald-700 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800"
                    }`}
                  >
                    {project.is_published ? "Unpublish" : "Publish"}
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={deleteAllowed ? onDelete : undefined}
                    disabled={!deleteAllowed}
                    className={`px-5 py-2 rounded-full border text-sm ${
                      !deleteAllowed
                        ? "border-neutral-800 bg-neutral-900 text-neutral-500 opacity-40 cursor-not-allowed"
                        : "border border-red-700 bg-red-900/40 text-red-200 hover:bg-red-800"
                    }`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* =========================================================
   MAIN PAGE
========================================================= */
export default function AdminProjectListPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [previewProject, setPreviewProject] = useState<Project | null>(null);
  const [shareProject, setShareProject] = useState<Project | null>(null);

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("order");

  // Dropdown & Search state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  // Focus input when search bar opens
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isSearchOpen]);

  // Click outside and escape key handling
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
      if (sortRef.current && !sortRef.current.contains(event.target as Node)) {
        setIsSortOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsFilterOpen(false);
        setIsSortOpen(false);
        if (isSearchOpen && !search) {
          setIsSearchOpen(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSearchOpen, search]);

  const isSearchActive = Boolean(search || isSearchOpen);
  const isFilterActive = categoryFilter !== "all" || isFilterOpen;
  const isSortActive = sortKey !== "order" || statusFilter !== "all" || isSortOpen;

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  /* ------------------ Fetch projects ------------------ */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("order_index", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load projects");
        setLoading(false);
        return;
      }

      const withOrder = (data || []).map((p: any, idx: number) => ({
        ...p,
        order_index: p.order_index ?? idx + 1,
      }));

      setProjects(withOrder as Project[]);

      const uniq = Array.from(
        new Set(
          withOrder
            .flatMap((p: any) => p.categories || [])
            .filter(Boolean)
        )
      ) as string[];

      setCategories(uniq);
      setLoading(false);
    };

    fetchData();
  }, []);

  /* ------------------ Filtering + Sorting ------------------ */
  const filteredProjects = useMemo(() => {
    let r = [...projects];

    // status
    if (statusFilter !== "all") {
      const isPub = statusFilter === "published";
      r = r.filter((p) => p.is_published === isPub);
    }

    // category
    if (categoryFilter !== "all") {
      r = r.filter((p) => p.categories?.includes(categoryFilter));
    }

    // search
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter(
        (p) =>
          p.project_name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q)
      );
    }

    // sort
    if (sortKey === "created_at") {
      r.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    } else if (sortKey === "updated_at") {
      r.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );
    } else {
      // order_index
      r.sort((a, b) => a.order_index - b.order_index);
    }

    return r;
  }, [projects, statusFilter, categoryFilter, search, sortKey]);

  /* ------------------ DND Reorder ------------------ */
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    // DnD cuma make sense saat sortKey = "order"
    if (sortKey !== "order") {
      toast.error("Reordering only available when sorted by Order.");
      return;
    }

    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);

    const reordered = arrayMove(projects, oldIndex, newIndex).map(
      (p, i) => ({ ...p, order_index: i + 1 })
    );

    setProjects(reordered);

    const updates = reordered.map((p) =>
      supabase
        .from("projects")
        .update({ order_index: p.order_index })
        .eq("id", p.id)
    );

    await Promise.all(updates);
    toast.success("Order updated");
  };

  /* ------------------ Publish Toggle (role-guarded) ------------------ */
  const togglePublish = async (project: Project) => {
    if (!canPublish(profile?.role)) {
      toast.error("You do not have permission to publish/unpublish.");
      return;
    }

    const next = !project.is_published;

    const { error } = await supabase
      .from("projects")
      .update({ is_published: next })
      .eq("id", project.id);

    if (error) {
      toast.error("Failed to update publish status");
      return;
    }

    setProjects((prev) =>
      prev.map((p) =>
        p.id === project.id ? { ...p, is_published: next } : p
      )
    );
  };

  /* ------------------ Delete (admin only) ------------------ */
  const deleteProject = async (project: Project) => {
    if (!canDelete(profile?.role)) {
      toast.error("Only admin can delete projects.");
      return;
    }

    if (!confirm(`Delete "${project.project_name}"?`)) return;

    const { error } = await supabase
      .from("projects")
      .delete()
      .eq("id", project.id);

    if (error) {
      toast.error("Failed to delete project");
      return;
    }

    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    toast.success("Project deleted");
  };

  /* ------------------ Loading guard for profile ------------------ */
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-300">
        Loading...
      </div>
    );
  }

  /* ------------------ Render ------------------ */
  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. HEADER */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Admin • Projects
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
            <span className="text-adidaya-red font-bold">*</span> Projects
          </h1>
          <p className="text-sm text-adidaya-text-muted">
            Manage architectural portfolio, client credentials, project metadata, team credits, and public gallery visibility.
          </p>
        </div>
      </header>

      {/* 2. SUBHEADER ACTION BAR (KIRI: Back to Dashboard, KANAN: Filters, Sort, Search, Live Preview, Create Project) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        {/* KIRI: Back to Dashboard */}
        <button
          onClick={() => router.push("/admin")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 select-none group w-fit shadow-sm"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </button>

        {/* KANAN: Search, Filter, Sort, Live Preview, Create Project */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* SEARCH BUTTON */}
          <button
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              setIsFilterOpen(false);
              setIsSortOpen(false);
            }}
            aria-label="Toggle search"
            className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 shadow-sm ${
              isSearchActive
                ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)] text-adidaya-red"
                : "border border-white/10 bg-white/[0.04] text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.08]"
            }`}
          >
            <Search size={16} strokeWidth={1.5} />
            {search && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-adidaya-red ring-2 ring-black" />
            )}
          </button>

          {/* CATEGORY FILTER BUTTON */}
          <div ref={filterRef} className="relative shrink-0">
            <button
              onClick={() => {
                setIsFilterOpen((prev) => !prev);
                setIsSortOpen(false);
              }}
              aria-label="Filter category"
              className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 shadow-sm ${
                isFilterActive
                  ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)] text-adidaya-red"
                  : "border border-white/10 bg-white/[0.04] text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.08]"
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={1.5} />
              {categoryFilter !== "all" && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-adidaya-red ring-2 ring-black" />
              )}
            </button>

            {/* CATEGORY DROPDOWN MENU */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-60 sm:w-64 bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-2xl shadow-black/80 z-50 max-w-[calc(100vw-32px)]"
                >
                  <div className="px-3 py-2 text-[10px] uppercase font-mono tracking-widest text-neutral-400 border-b border-white/10 mb-1.5 flex items-center justify-between">
                    <span>Filter Categories</span>
                    {categoryFilter !== "all" && (
                      <button
                        onClick={() => {
                          setCategoryFilter("all");
                          setIsFilterOpen(false);
                        }}
                        className="text-adidaya-red hover:underline capitalize font-sans text-xs"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1 no-scrollbar p-0.5">
                    <button
                      onClick={() => {
                        setCategoryFilter("all");
                        setIsFilterOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        categoryFilter === "all"
                          ? "text-adidaya-red font-semibold bg-white/[0.08]"
                          : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>All Categories</span>
                      {categoryFilter === "all" && (
                        <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                      )}
                    </button>
                    {categories.map((cat) => {
                      const isActive = categoryFilter === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => {
                            setCategoryFilter(cat);
                            setIsFilterOpen(false);
                          }}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isActive
                              ? "text-adidaya-red font-semibold bg-white/[0.08]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isActive && (
                            <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SORT & STATUS BUTTON */}
          <div ref={sortRef} className="relative shrink-0">
            <button
              onClick={() => {
                setIsSortOpen((prev) => !prev);
                setIsFilterOpen(false);
              }}
              aria-label="Sort and Status"
              className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 shadow-sm ${
                isSortActive
                  ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)] text-adidaya-red"
                  : "border border-white/10 bg-white/[0.04] text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.08]"
              }`}
            >
              <ArrowUpDown size={16} strokeWidth={1.5} />
              {(sortKey !== "order" || statusFilter !== "all") && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-adidaya-red ring-2 ring-black" />
              )}
            </button>

            {/* SORT & STATUS DROPDOWN MENU */}
            <AnimatePresence>
              {isSortOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-64 bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl shadow-black/80 z-50 max-w-[calc(100vw-32px)]"
                >
                  {/* Status Section */}
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                    Status
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-3 p-0.5 bg-black/40 rounded-xl border border-white/5">
                    {(["all", "draft", "published"] as StatusFilter[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatusFilter(s)}
                        className={`py-1.5 px-2 rounded-lg text-[11px] font-medium uppercase tracking-wider text-center transition-all ${
                          statusFilter === s
                            ? "bg-adidaya-red text-white font-semibold shadow-sm"
                            : "text-neutral-400 hover:text-white hover:bg-white/5"
                        }`}
                      >
                        {s === "all" ? "All" : s === "draft" ? "Draft" : "Pub"}
                      </button>
                    ))}
                  </div>

                  {/* Sort Section */}
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-neutral-400 border-t border-white/10 pt-2">
                    Sort By
                  </div>
                  <div className="space-y-1 p-0.5">
                    {[
                      { key: "order" as SortKey, label: "Manual Order (DnD)" },
                      { key: "created_at" as SortKey, label: "Date Added" },
                      { key: "updated_at" as SortKey, label: "Last Modified" },
                    ].map((item) => {
                      const isActive = sortKey === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            setSortKey(item.key);
                          }}
                          className={`w-full text-left px-3.5 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isActive
                              ? "text-adidaya-red font-semibold bg-white/[0.08]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>{item.label}</span>
                          {isActive && (
                            <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* LIVE PREVIEW BUTTON */}
          <button
            onClick={() => window.open("/projects", "_blank")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none group shadow-sm"
          >
            <span>Live Preview</span>
            <ExternalLink
              size={12}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>

          {/* CREATE PROJECT BUTTON */}
          <button
            onClick={() => router.push("/admin/projects/create")}
            className="rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all select-none bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* FLOATING / EXPANDABLE SEARCH BAR */}
      <AnimatePresence>
        {isSearchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="mb-6 w-full max-w-lg mx-auto z-30"
          >
            <div className="flex items-center w-full bg-white/[0.05] border border-white/15 backdrop-blur-md rounded-full px-4 py-2.5 shadow-lg shadow-black/40">
              <Search size={16} className="text-adidaya-red shrink-0 mr-3" strokeWidth={1.5} />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search projects by name or slug..."
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder:text-adidaya-text-muted outline-none"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="p-1 text-adidaya-text-muted hover:text-white rounded-full hover:bg-white/10 transition shrink-0 mr-1"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
              <button
                onClick={() => {
                  setSearch("");
                  setIsSearchOpen(false);
                }}
                aria-label="Close search bar"
                className="p-1 text-adidaya-text-muted hover:text-white rounded-full hover:bg-white/10 transition shrink-0 select-none"
              >
                <X size={16} strokeWidth={1.5} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

        {/* LIST */}
        {loading ? (
          <div className="mt-10 text-center text-xs text-neutral-500 py-12">
            Loading projects...
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
              <Building2 size={20} strokeWidth={1.5} />
            </div>
            <p className="text-base sm:text-lg font-semibold text-white">
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "No projects found"
                : "No projects yet"}
            </p>
            <p className="text-xs sm:text-sm text-adidaya-text-muted mt-1.5 max-w-sm mx-auto">
              {search || categoryFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search query or filter criteria."
                : "Start by creating your first project portfolio."}
            </p>
            {search || categoryFilter !== "all" || statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setStatusFilter("all");
                }}
                className="mt-5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-medium text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/admin/projects/create")}
                className="mt-5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-md hover:bg-adidaya-red hover:text-white transition"
              >
                + Create Project
              </button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredProjects.map((p) => p.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <SortableProjectItem
                    key={project.id}
                    project={project}
                    expanded={expandedId === project.id}
                    onExpand={() =>
                      setExpandedId((prev) =>
                        prev === project.id ? null : project.id
                      )
                    }
                    onPreview={() => setPreviewProject(project)}
                    onTogglePublish={() => togglePublish(project)}
                    onEdit={() =>
                      router.push(`/admin/projects/edit?id=${project.id}`)
                    }
                    onDelete={() => deleteProject(project)}
                    onShare={() => setShareProject(project)}
                    role={profile?.role}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* EMBEDDED PROJECT PREVIEW MODAL */}
        <AnimatePresence>
          {previewProject && (
            <ProjectPreviewModal
              project={previewProject}
              onClose={() => setPreviewProject(null)}
              onEdit={() => {
                const id = previewProject.id;
                setPreviewProject(null);
                router.push(`/admin/projects/edit?id=${id}`);
              }}
            />
          )}
        </AnimatePresence>

        {/* SHARE MODAL */}
        {shareProject && (
          <ShareModal
            isOpen={Boolean(shareProject)}
            onClose={() => setShareProject(null)}
            data={{
              type: "project",
              title: shareProject.project_name,
              category: shareProject.categories?.[0] || "Architecture",
              tags: shareProject.subcategories || [],
              location:
                shareProject.city && shareProject.country
                  ? `${shareProject.city}, ${shareProject.country}`
                  : null,
              year: shareProject.year_start
                ? `${shareProject.year_start}${
                    shareProject.is_ongoing
                      ? " – Now"
                      : shareProject.year_end
                      ? ` – ${shareProject.year_end}`
                      : ""
                  }`
                : null,
              status: shareProject.status,
              meta: [
                shareProject.city && shareProject.country
                  ? `${shareProject.city}, ${shareProject.country}`
                  : "",
                shareProject.year_start ? `${shareProject.year_start}` : "",
                shareProject.site_area ? `Site: ${shareProject.site_area}` : "",
                shareProject.building_area ? `Building: ${shareProject.building_area}` : "",
                shareProject.building_floors ? `${shareProject.building_floors}` : "",
              ].filter(Boolean),
              imageUrl: shareProject.hero_image,
              url: typeof window !== "undefined" ? `${window.location.origin}/projects/${shareProject.slug || shareProject.id}` : undefined,
            }}
          />
        )}
      </div>
    );
  }

/* =========================================================
   EMBEDDED PROJECT PREVIEW MODAL (NATIVE ADMIN CANVAS)
========================================================= */
function ProjectPreviewModal({
  project,
  onClose,
  onEdit,
}: {
  project: Project;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [fullProject, setFullProject] = useState<any>(project);
  const [gallery, setGallery] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        // 1. Fetch full project details including description_html
        const { data: projData } = await supabase
          .from("projects")
          .select("*")
          .eq("id", project.id)
          .maybeSingle();

        if (projData) {
          setFullProject(projData);
        }

        // 2. Fetch gallery images
        const { data: imgData } = await supabase
          .from("project_images")
          .select("*")
          .eq("project_id", project.id)
          .order("order_index", { ascending: true });

        if (imgData) {
          setGallery(imgData);
        }
      } catch (err) {
        console.error("Error loading preview details:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [project.id]);

  const hero = fullProject.hero_image || null;
  const yearLabel =
    fullProject.year_start && fullProject.year_end
      ? `${fullProject.year_start} – ${fullProject.year_end}`
      : fullProject.year_start || "";

  const location = fullProject.is_confidential_location
    ? "Confidential"
    : `${fullProject.city || ""}${
        fullProject.city && fullProject.country ? ", " : ""
      }${fullProject.country || ""}`;

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 pt-16 sm:pt-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative h-[76vh] max-h-[720px] w-full max-w-4xl rounded-3xl border border-white/15 bg-[#0a0a0a] overflow-hidden flex flex-col shadow-2xl shadow-black font-sans"
        initial={{ scale: 0.96, opacity: 0, y: 10 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-white/10 px-5 sm:px-6 py-3 bg-[#111] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-[0.14em] shrink-0 font-medium ${
                fullProject.is_published
                  ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
                  : "bg-orange-900/40 border border-orange-700 text-orange-300"
              }`}
            >
              {fullProject.is_published ? "Published" : "Draft Preview"}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">
                {fullProject.project_name}
              </h2>
              <p className="text-[11px] text-adidaya-text-muted truncate">
                /projects/{fullProject.slug || fullProject.id}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white hover:bg-white/15 hover:border-white/30 transition flex items-center gap-1.5 shadow-sm"
            >
              <Edit2 size={12} />
              <span className="hidden sm:inline">Edit Project</span>
            </button>

            {fullProject.is_published && (
              <button
                type="button"
                onClick={() =>
                  window.open(`/projects/${fullProject.slug}`, "_blank")
                }
                className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/15 hover:border-white/30 transition flex items-center gap-1.5 shadow-sm"
                title="Open live public page"
              >
                <ExternalLink size={12} />
                <span className="hidden sm:inline">Open Live</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="h-8 w-8 flex items-center justify-center rounded-full border border-white/10 bg-white/5 text-neutral-400 hover:text-white hover:bg-white/15 transition shadow-sm"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* SCROLLABLE EMBEDDED CANVAS */}
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {/* HERO SECTION */}
          <div className="relative min-h-[220px] sm:min-h-[260px] h-[34vh] max-h-[300px] w-full overflow-hidden flex flex-col justify-end bg-neutral-950">
            {hero ? (
              <img
                src={hero}
                alt={fullProject.project_name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-neutral-900 flex items-center justify-center text-gray-500 text-xs">
                No cover image uploaded
              </div>
            )}

            {/* Vignette gradients */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-transparent pointer-events-none" />

            {/* Content overlay */}
            <div className="relative z-10 w-full p-5 sm:p-7 max-w-3xl mx-auto">
              {/* Category pills */}
              <div className="flex gap-1.5 mb-2.5 flex-wrap">
                {fullProject.categories?.map((c: string) => (
                  <span
                    key={`cat-${c}`}
                    className="inline-block bg-adidaya-red px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.14em] text-white font-medium shadow-sm"
                  >
                    {c}
                  </span>
                ))}
                {fullProject.subcategories?.map((s: string) => (
                  <span
                    key={`sub-${s}`}
                    className="inline-block bg-neutral-900 px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.14em] border border-white/15 text-neutral-300 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug mb-2">
                {fullProject.project_name}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2.5 text-xs text-neutral-300">
                {fullProject.status && (
                  <span className="capitalize">{fullProject.status}</span>
                )}
                {fullProject.status && <span>•</span>}
                {location && <span>{location}</span>}
                {location && <span>•</span>}
                {yearLabel && <span>{yearLabel}</span>}
              </div>
            </div>
          </div>

          {/* MAIN CONTENT DETAILS */}
          <div className="max-w-3xl mx-auto px-5 sm:px-7 py-8 space-y-8">
            {/* TEAM CREDITS */}
            {fullProject.team_members && fullProject.team_members.length > 0 && (
              <section className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <h3 className="text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-2.5 font-medium">
                  Team Credits
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fullProject.team_members.map((m: any, i: number) => (
                    <div key={`team-${i}`} className="text-xs text-neutral-300">
                      <span className="font-semibold text-white">{m.name}</span>{" "}
                      — <span className="text-neutral-400">{m.role}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* DESCRIPTION */}
            {fullProject.description_html ? (
              <section
                className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed prose-p:text-neutral-300 prose-headings:text-white prose-strong:text-white"
                dangerouslySetInnerHTML={{
                  __html: fullProject.description_html,
                }}
              />
            ) : (
              <p className="text-xs text-neutral-500 italic">
                No description written for this project yet.
              </p>
            )}

            {/* GALLERY */}
            {gallery.length > 0 && (
              <section className="space-y-3 pt-3 border-t border-white/10">
                <h3 className="text-[11px] uppercase tracking-[0.16em] text-neutral-400 font-medium">
                  Project Gallery ({gallery.length} images)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {gallery.map((img) => (
                    <div
                      key={img.id}
                      className="relative rounded-xl overflow-hidden border border-white/10 aspect-[4/3] bg-neutral-900 group"
                    >
                      <img
                        src={img.image_url}
                        alt={img.caption || ""}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      {img.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 p-2 text-[10px] text-white truncate backdrop-blur-sm">
                          {img.caption}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
