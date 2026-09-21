"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import useUserProfile from "@/hooks/useUserProfile";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ExternalLink,
  Plus,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Check,
  X,
  BookOpen,
  Edit2,
} from "lucide-react";

/* ============================================================
   TYPES
============================================================ */
type Author = {
  name: string;
  role: string;
};

type Insight = {
  id: string;
  title: string;
  subtitle: string | null;
  slug: string;
  category: string;
  tags: string[] | null;
  authors: Author[] | null;
  reading_time?: number | null;

  hero_image_url: string | null;
  hero_caption: string | null;

  body_html: string | null;
  status: "draft" | "published";

  created_at: string;
  updated_at: string | null;
  published_at: string | null;
};

/* ============================================================
   HELPERS
============================================================ */
function formatDateLabel(dt: string | null) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ============================================================
   ROLE PERMISSIONS
============================================================ */

const canPublish = (role: string | null | undefined) =>
  role === "admin" || role === "supervisor";

const canDelete = (role: string | null | undefined) =>
  role === "admin" || role === "supervisor";

const canEdit = (role: string | null | undefined, status: string) => {
  // Semua boleh edit draft
  if (status === "draft") return true;
  // Published hanya admin & supervisor
  return role === "admin" || role === "supervisor";
};

/* ============================================================
   MAIN PAGE
============================================================ */
export default function AdminInsightListPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

  const [insights, setInsights] = useState<Insight[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  /* Filters & Dropdown States */
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [authorFilter, setAuthorFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");
  const [dateFilter, setDateFilter] = useState("all");

  const [selectedMonth, setSelectedMonth] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");

  const [sortKey, setSortKey] = useState<
    "az" | "created" | "updated" | "published_first" | "draft_first"
  >("created");

  const [previewInsight, setPreviewInsight] = useState<Insight | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);
  const sortRef = useRef<HTMLDivElement>(null);

  const role = profile?.role ?? null; // "admin" | "supervisor" | "staff" | null

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
  const isFilterActive = categoryFilter !== "all" || authorFilter !== "all" || isFilterOpen;
  const isSortActive = sortKey !== "created" || statusFilter !== "all" || isSortOpen;

  /* ============================================================
     FETCH DATA
  ============================================================ */
  useEffect(() => {
    async function load() {
      setLoading(true);

      const { data, error } = await supabase
        .from("insight")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Failed to load insights");
        setLoading(false);
        return;
      }

      setInsights((data || []) as Insight[]);
      setLoading(false);
    }

    load();
  }, []);

  /* ============================================================
     UNIQUE CATEGORY + AUTHORS
  ============================================================ */
  const categories = useMemo(() => {
    const setC = new Set<string>();
    insights.forEach((i) => setC.add(i.category));
    return [...setC];
  }, [insights]);

  const authorsUnique = useMemo(() => {
    const setA = new Set<string>();
    insights.forEach((i) => i.authors?.forEach((a) => setA.add(a.name)));
    return [...setA];
  }, [insights]);

  /* ============================================================
     FILTER + SORT
  ============================================================ */
  const filtered = useMemo(() => {
    let r = [...insights];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      r = r.filter((i) =>
        [
          i.title,
          i.subtitle ?? "",
          i.category,
          ...(i.tags ?? []),
          ...(i.authors?.map((a) => a.name) ?? []),
        ]
          .join(" ")
          .toLowerCase()
          .includes(q)
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      r = r.filter((i) => i.category === categoryFilter);
    }

    // Author filter
    if (authorFilter !== "all") {
      r = r.filter((i) =>
        i.authors?.some((a) => a.name === authorFilter)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      r = r.filter((i) => i.status === statusFilter);
    }

    // Date filters
    const now = new Date();
    r = r.filter((i) => {
      const created = new Date(i.created_at);

      if (dateFilter === "today") {
        return created.toDateString() === now.toDateString();
      }

      if (dateFilter === "week") {
        const diff = (now.getTime() - created.getTime()) / 86400000;
        return diff <= 7;
      }

      if (dateFilter === "month") {
        return (
          created.getMonth() === now.getMonth() &&
          created.getFullYear() === now.getFullYear()
        );
      }

      if (dateFilter === "select-month" && selectedMonth !== "all") {
        return (
          created.getMonth() === MONTHS.indexOf(selectedMonth) &&
          (selectedYear === "all"
            ? true
            : created.getFullYear() === Number(selectedYear))
        );
      }

      if (dateFilter === "select-year" && selectedYear !== "all") {
        return created.getFullYear() === Number(selectedYear);
      }

      return true;
    });

    // Sort
    if (sortKey === "az") {
      r.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortKey === "created") {
      r.sort(
        (a, b) =>
          new Date(b.created_at).getTime() -
          new Date(a.created_at).getTime()
      );
    } else if (sortKey === "updated") {
      r.sort(
        (a, b) =>
          new Date(b.updated_at || b.created_at).getTime() -
          new Date(a.updated_at || a.created_at).getTime()
      );
    } else if (sortKey === "published_first") {
      r.sort((a, b) => (b.status === "published" ? 1 : -1));
    } else if (sortKey === "draft_first") {
      r.sort((a, b) => (a.status === "draft" ? -1 : 1));
    }

    return r;
  }, [
    insights,
    search,
    categoryFilter,
    authorFilter,
    statusFilter,
    dateFilter,
    selectedMonth,
    selectedYear,
    sortKey,
  ]);

  /* ============================================================
     ACTIONS WITH ROLE GUARD
  ============================================================ */
  async function togglePublish(i: Insight) {
    if (!canPublish(role)) {
      toast.error("You do not have permission to publish/unpublish.");
      return;
    }

    const next = i.status === "draft" ? "published" : "draft";

    const { error } = await supabase
      .from("insight")
      .update({
        status: next,
        published_at: next === "published" ? new Date().toISOString() : null,
      })
      .eq("id", i.id);

    if (error) {
      console.error("TOGGLE PUBLISH ERROR:", error);
      toast.error(error.message || "Failed to update publish status");
      return;
    }

    setInsights((prev) =>
      prev.map((x) =>
        x.id === i.id
          ? {
              ...x,
              status: next,
              published_at:
                next === "published" ? new Date().toISOString() : null,
            }
          : x
      )
    );
  }

  async function deleteInsight(i: Insight) {
    if (!canDelete(role)) {
      toast.error("Only admin and supervisor can delete insights.");
      return;
    }

    if (!confirm(`Delete "${i.title}"?`)) return;

    try {
      const { data, error } = await supabase
        .from("insight")
        .delete()
        .eq("id", i.id)
        .select();

      if (error) {
        console.error("DELETE INSIGHT ERROR:", error);
        toast.error(error.message || "Failed to delete insight");
        return;
      }

      if (!data || data.length === 0) {
        console.error("DELETE BLOCKED BY RLS POLICY: 0 rows deleted from 'insight' table");
        toast.error("Gagal menghapus: RLS Policy DELETE pada tabel 'insight' di Supabase belum diaktifkan.", {
          duration: 6000,
        });
        return;
      }

      setInsights((prev) => prev.filter((x) => x.id !== i.id));
      toast.success("Insight deleted");
    } catch (err: any) {
      console.error("DELETE ERROR:", err);
      toast.error(err?.message || "Failed to delete insight");
    }
  }

  /* ============================================================
     RENDER
  ============================================================ */
  if (profileLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center text-gray-300">
        Loading...
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. HEADER */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Admin • Insights
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
            <span className="text-adidaya-red font-bold">*</span> Insights
          </h1>
          <p className="text-sm text-adidaya-text-muted">
            Manage architectural editorial articles, research records, design dialogues, authors, and publishing status.
          </p>
        </div>
      </header>

      {/* 2. SUBHEADER ACTION BAR (KIRI: Back to Dashboard, KANAN: Filters, Sort, Search, Live Preview, Create Insight) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        {/* KIRI: Back to Dashboard */}
        <button
          onClick={() => router.push("/admin")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 select-none group w-fit shadow-sm"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </button>

        {/* KANAN: Search, Filter, Sort, Live Preview, Create Insight */}
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

          {/* CATEGORY & AUTHOR FILTER BUTTON */}
          <div ref={filterRef} className="relative shrink-0">
            <button
              onClick={() => {
                setIsFilterOpen((prev) => !prev);
                setIsSortOpen(false);
              }}
              aria-label="Filter categories and authors"
              className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 shadow-sm ${
                isFilterActive
                  ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)] text-adidaya-red"
                  : "border border-white/10 bg-white/[0.04] text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.08]"
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={1.5} />
              {(categoryFilter !== "all" || authorFilter !== "all") && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-adidaya-red ring-2 ring-black" />
              )}
            </button>

            {/* FILTER DROPDOWN MENU */}
            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-64 bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl shadow-black/80 z-50 max-w-[calc(100vw-32px)]"
                >
                  <div className="px-3 py-1.5 text-[10px] uppercase font-mono tracking-widest text-neutral-400 border-b border-white/10 mb-2 flex items-center justify-between">
                    <span>Filters</span>
                    {(categoryFilter !== "all" || authorFilter !== "all") && (
                      <button
                        onClick={() => {
                          setCategoryFilter("all");
                          setAuthorFilter("all");
                          setIsFilterOpen(false);
                        }}
                        className="text-adidaya-red hover:underline capitalize font-sans text-xs"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Categories */}
                  <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-widest text-neutral-400">
                    Categories
                  </div>
                  <div className="max-h-40 overflow-y-auto space-y-1 no-scrollbar p-0.5 mb-2">
                    <button
                      onClick={() => {
                        setCategoryFilter("all");
                      }}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
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
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isActive
                              ? "text-adidaya-red font-semibold bg-white/[0.08]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="truncate uppercase">{cat}</span>
                          {isActive && (
                            <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Authors */}
                  {authorsUnique.length > 0 && (
                    <>
                      <div className="px-3 py-1 text-[10px] uppercase font-mono tracking-widest text-neutral-400 border-t border-white/10 pt-2">
                        Authors
                      </div>
                      <div className="max-h-36 overflow-y-auto space-y-1 no-scrollbar p-0.5">
                        <button
                          onClick={() => {
                            setAuthorFilter("all");
                          }}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            authorFilter === "all"
                              ? "text-adidaya-red font-semibold bg-white/[0.08]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span>All Authors</span>
                          {authorFilter === "all" && (
                            <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                          )}
                        </button>
                        {authorsUnique.map((auth) => {
                          const isActive = authorFilter === auth;
                          return (
                            <button
                              key={auth}
                              onClick={() => {
                                setAuthorFilter(auth);
                              }}
                              className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                                isActive
                                  ? "text-adidaya-red font-semibold bg-white/[0.08]"
                                  : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                              }`}
                            >
                              <span className="truncate">{auth}</span>
                              {isActive && (
                                <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
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
              {(sortKey !== "created" || statusFilter !== "all") && (
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
                    {(["all", "draft", "published"] as const).map((s) => (
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
                      { key: "created", label: "Date Added (Newest)" },
                      { key: "az", label: "Title (A - Z)" },
                      { key: "updated", label: "Last Modified" },
                      { key: "published_first", label: "Published First" },
                      { key: "draft_first", label: "Draft First" },
                    ].map((item) => {
                      const isActive = sortKey === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => {
                            setSortKey(item.key as any);
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
            onClick={() => window.open("/insights", "_blank")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none group shadow-sm"
          >
            <span>Live Preview</span>
            <ExternalLink
              size={12}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>

          {/* CREATE INSIGHT BUTTON */}
          <button
            onClick={() => router.push("/admin/insight/create")}
            className="rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all select-none bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Create Insight</span>
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
                placeholder="Search insights by title, tag, or author..."
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
      <div className="space-y-4">
        {loading ? (
          <p className="text-neutral-500 text-xs text-center py-12">Loading insights…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
              <BookOpen size={20} strokeWidth={1.5} />
            </div>
            <p className="text-base sm:text-lg font-semibold text-white">
              {search || categoryFilter !== "all" || authorFilter !== "all" || statusFilter !== "all"
                ? "No insights found"
                : "No insights yet"}
            </p>
            <p className="text-xs sm:text-sm text-adidaya-text-muted mt-1.5 max-w-sm mx-auto">
              {search || categoryFilter !== "all" || authorFilter !== "all" || statusFilter !== "all"
                ? "Try adjusting your search query or filter criteria."
                : "Start by writing and publishing your first architectural insight."}
            </p>
            {search || categoryFilter !== "all" || authorFilter !== "all" || statusFilter !== "all" ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setCategoryFilter("all");
                  setAuthorFilter("all");
                  setStatusFilter("all");
                }}
                className="mt-5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-medium text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/admin/insight/create")}
                className="mt-5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-md hover:bg-adidaya-red hover:text-white transition"
              >
                + Create Insight
              </button>
            )}
          </div>
        ) : (
          filtered.map((i) => {
            const firstAuthor = i.authors?.[0]?.name ?? "—";
            const dateLabel =
              i.status === "published"
                ? formatDateLabel(i.published_at)
                : formatDateLabel(i.created_at);

            const editAllowed = canEdit(role, i.status);
            const publishAllowed = canPublish(role);
            const deleteAllowed = canDelete(role);

            return (
              <motion.div
                key={i.id}
                layout
                className="rounded-3xl bg-[#0b0b0b] border border-neutral-800 overflow-hidden"
              >
                {/* SUMMARY */}
                <div className="flex justify-between items-center px-6 py-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className="font-semibold truncate max-w-[180px]">
                      {i.title}
                    </span>

                    <span className="px-3 py-1 rounded-full text-[11px] border border-neutral-700 text-neutral-300 uppercase tracking-[0.14em]">
                      {i.category}
                    </span>

                    <span className="text-xs text-neutral-500">
                      {dateLabel}
                    </span>

                    <span className="text-xs text-neutral-500">
                      {firstAuthor}
                    </span>

                    {i.reading_time !== null &&
                      i.reading_time !== undefined && (
                        <span className="text-xs text-neutral-500">
                          {i.reading_time} min read
                        </span>
                      )}

                    <span
                      className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.14em] ${
                        i.status === "published"
                          ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
                          : "bg-orange-900/40 border border-orange-700 text-orange-300"
                      }`}
                    >
                      {i.status === "published" ? "Published" : "Draft"}
                    </span>
                  </div>

                  <button
                    onClick={() =>
                      setExpandedId(
                        expandedId === i.id ? null : i.id
                      )
                    }
                    className="text-neutral-500 hover:text-white text-lg"
                  >
                    {expandedId === i.id ? "−" : "+"}
                  </button>
                </div>

                {/* EXPANDED */}
                <AnimatePresence>
                  {expandedId === i.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                      className="border-t border-neutral-800 bg-[#070707] px-6 py-6"
                    >
                      <div className="grid grid-cols-12 gap-8">
                        {/* HERO LEFT */}
                        <div className="col-span-12 md:col-span-4">
                          {i.hero_image_url ? (
                            <img
                              src={i.hero_image_url}
                              className="w-full h-40 rounded-xl object-cover border border-neutral-800"
                            />
                          ) : (
                            <div className="w-full h-40 rounded-xl bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-600 text-sm">
                              No image
                            </div>
                          )}
                        </div>

                        {/* META RIGHT */}
                        <div className="col-span-12 md:col-span-8 space-y-6">
                          {i.subtitle && (
                            <p className="text-sm text-gray-300">
                              {i.subtitle}
                            </p>
                          )}

                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-[0.16em]">
                              Authors
                            </p>
                            <ul className="mt-1 list-disc ml-5 text-sm text-white/80">
                              {i.authors?.map((a, idx) => (
                                <li key={idx}>
                                  {a.name} — {a.role}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span className="inline-flex px-4 py-1.5 rounded-full bg-[#E53935] text-[11px] uppercase tracking-wide">
                              {i.category}
                            </span>

                            {i.tags?.map((t) => (
                              <span
                                key={t}
                                className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-200"
                              >
                                {t}
                              </span>
                            ))}
                          </div>

                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[11px] uppercase text-neutral-500 tracking-[0.16em]">
                                Created
                              </p>
                              <p className="text-sm mt-1 text-white">
                                {formatDateLabel(i.created_at)}
                              </p>
                            </div>

                            <div>
                              <p className="text-[11px] uppercase text-neutral-500 tracking-[0.16em]">
                                {i.published_at
                                  ? "Published At"
                                  : "Last Modified"}
                              </p>
                              <p className="text-sm mt-1 text-white">
                                {formatDateLabel(
                                  i.updated_at || i.published_at
                                )}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-3 pt-2">
                            {/* Preview: native admin embedded canvas */}
                            <button
                              type="button"
                              onClick={() => setPreviewInsight(i)}
                              className="px-5 py-2 rounded-full border border-neutral-700 bg-neutral-900 text-sm hover:border-neutral-500 text-white cursor-pointer transition shadow-sm"
                            >
                              Preview
                            </button>

                            {/* Edit */}
                            <button
                              disabled={!editAllowed}
                              onClick={
                                editAllowed
                                  ? () =>
                                      router.push(
                                        `/admin/insight/edit?id=${i.id}`
                                      )
                                  : undefined
                              }
                              className={`
                                px-6 py-2 rounded-full text-sm font-medium transition border 
                                ${
                                  !editAllowed
                                    ? "border-neutral-700 bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                    : "border-neutral-600 hover:bg-neutral-700 bg-neutral-900 text-white"
                                }
                              `}
                            >
                              Edit
                            </button>

                            {/* Publish / Unpublish */}
                            <button
                              disabled={!publishAllowed}
                              onClick={
                                publishAllowed
                                  ? () => togglePublish(i)
                                  : undefined
                              }
                              className={`
                                px-5 py-2 rounded-full text-sm
                                ${
                                  !publishAllowed
                                    ? "border-neutral-700 bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                    : i.status === "published"
                                    ? "border border-neutral-600 bg-neutral-900 text-neutral-200 hover:border-neutral-400"
                                    : "border border-emerald-700 bg-emerald-900/40 text-emerald-200 hover:bg-emerald-800"
                                }
                              `}
                            >
                              {i.status === "published"
                                ? "Unpublish"
                                : "Publish"}
                            </button>

                            {/* Delete */}
                            <button
                              disabled={!deleteAllowed}
                              onClick={
                                deleteAllowed
                                  ? () => deleteInsight(i)
                                  : undefined
                              }
                              className={`
                                px-5 py-2 rounded-full text-sm
                                ${
                                  !deleteAllowed
                                    ? "border-neutral-700 bg-neutral-800 text-neutral-500 cursor-not-allowed"
                                    : "border border-red-700 bg-red-900/40 text-red-200 hover:bg-red-800"
                                }
                              `}
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
          })
        )}
      </div>

      {/* EMBEDDED INSIGHT PREVIEW MODAL */}
      <AnimatePresence>
        {previewInsight && (
          <InsightPreviewModal
            insight={previewInsight}
            onClose={() => setPreviewInsight(null)}
            onEdit={() => {
              const id = previewInsight.id;
              setPreviewInsight(null);
              router.push(`/admin/insight/edit?id=${id}`);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

/* =========================================================
   EMBEDDED INSIGHT PREVIEW MODAL (NATIVE ADMIN CANVAS)
========================================================= */
function InsightPreviewModal({
  insight,
  onClose,
  onEdit,
}: {
  insight: Insight;
  onClose: () => void;
  onEdit: () => void;
}) {
  const [fullInsight, setFullInsight] = useState<Insight>(insight);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      if (!insight.id) return;
      try {
        const { data } = await supabase
          .from("insight")
          .select("*")
          .eq("id", insight.id)
          .maybeSingle();

        if (data) {
          setFullInsight(data as Insight);
        }
      } catch (err) {
        console.error("Error loading preview details:", err);
      }
    }

    loadData();
  }, [insight.id]);

  const hero = fullInsight.hero_image_url || null;
  const isPublished = fullInsight.status === "published";
  const authorName = fullInsight.authors?.[0]?.name || "Adidaya Studio";
  const formattedDate = formatDateLabel(
    fullInsight.published_at || fullInsight.created_at
  );
  const readingTime = fullInsight.reading_time || 0;

  return (
    <motion.div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-xl p-3 sm:p-6 pt-16 sm:pt-20 font-sans"
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
                isPublished
                  ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
                  : "bg-orange-900/40 border border-orange-700 text-orange-300"
              }`}
            >
              {isPublished ? "Published" : "Draft Preview"}
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-white truncate">
                {fullInsight.title}
              </h2>
              <p className="text-[11px] text-adidaya-text-muted truncate">
                /insights/{fullInsight.slug || fullInsight.id}
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
              <span className="hidden sm:inline">Edit Insight</span>
            </button>

            {isPublished && (
              <button
                type="button"
                onClick={() =>
                  window.open(`/insights/${fullInsight.slug}`, "_blank")
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
                alt={fullInsight.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 w-full h-full bg-neutral-900 flex items-center justify-center text-gray-500 text-xs">
                No hero image uploaded
              </div>
            )}

            {/* Vignette gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-black/60 to-transparent pointer-events-none" />

            {/* Content overlay */}
            <div className="relative z-10 w-full p-5 sm:p-7 max-w-3xl mx-auto">
              {/* Category pill */}
              {fullInsight.category && (
                <div className="mb-2.5">
                  <span className="inline-block bg-adidaya-red px-3 py-0.5 rounded-full text-[10px] uppercase tracking-[0.16em] text-white font-semibold shadow-sm">
                    {fullInsight.category}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-semibold text-white tracking-tight leading-snug mb-2">
                {fullInsight.title}
              </h1>

              {/* Meta row */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-300">
                <span>{authorName}</span>
                <span>•</span>
                <span>{formattedDate}</span>
                {readingTime > 0 && (
                  <>
                    <span>•</span>
                    <span>{readingTime} min read</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* MAIN ARTICLE BODY & DETAILS */}
          <div className="max-w-3xl mx-auto px-5 sm:px-7 py-8 space-y-8">
            {/* SUBTITLE */}
            {fullInsight.subtitle && (
              <p className="text-sm sm:text-base text-gray-300 font-medium leading-relaxed italic border-l-2 border-adidaya-red pl-4 py-0.5">
                {fullInsight.subtitle}
              </p>
            )}

            {/* AUTHORS BREAKDOWN */}
            {fullInsight.authors && fullInsight.authors.length > 0 && (
              <section className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <h3 className="text-[11px] uppercase tracking-[0.16em] text-neutral-400 mb-2.5 font-medium">
                  Authors & Contributors
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {fullInsight.authors.map((a, i) => (
                    <div key={`auth-${i}`} className="text-xs text-neutral-300">
                      <span className="font-semibold text-white">{a.name}</span>{" "}
                      — <span className="text-neutral-400">{a.role}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* BODY HTML CONTENT */}
            {fullInsight.body_html ? (
              <section
                className="prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed prose-p:text-neutral-300 prose-headings:text-white prose-strong:text-white prose-img:rounded-xl prose-img:border prose-img:border-white/10"
                dangerouslySetInnerHTML={{
                  __html: fullInsight.body_html,
                }}
              />
            ) : (
              <p className="text-xs text-neutral-500 italic">
                No body content written for this insight yet.
              </p>
            )}

            {/* TAGS */}
            {fullInsight.tags && fullInsight.tags.length > 0 && (
              <section className="space-y-3 pt-4 border-t border-white/10">
                <h3 className="text-[11px] uppercase tracking-[0.16em] text-neutral-400 font-medium">
                  Tags ({fullInsight.tags.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {fullInsight.tags.map((t) => (
                    <span
                      key={t}
                      className="px-3.5 py-1 bg-neutral-900 text-gray-300 rounded-full text-[11px] uppercase tracking-[0.14em] border border-white/10"
                    >
                      {t}
                    </span>
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
