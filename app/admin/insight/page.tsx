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
          <p className="text-neutral-600 text-center py-10">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-3xl bg-[#0a0a0a] border border-neutral-800 text-center py-16">
            <p className="text-lg font-semibold">No insights found</p>
            <p className="text-gray-500 mt-2">
              Try adjusting your filters or search query.
            </p>
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
                            {/* Preview */}
                            <button
                              onClick={() => window.open(`/insights/${i.slug}`, "_blank")}
                              className="px-5 py-2 rounded-full border border-neutral-700 bg-neutral-900 text-sm hover:border-neutral-500 text-white"
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
    </div>
  );
}
