"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";
import useUserProfile from "@/hooks/useUserProfile";
import NoAccess from "@/components/admin/NoAccess";
import { supabase } from "@/lib/supabaseClient";
import { divisionsMap } from "@/data/divisionsMap";
import { jobTypes } from "@/data/jobType";
import {
  ArrowLeft,
  Plus,
  Search,
  SlidersHorizontal,
  Check,
  X,
  ExternalLink,
  Briefcase,
  Edit2,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";

type StatusFilter = "all" | "draft" | "published";
type SortOption = "newest_deadline" | "oldest_deadline" | "created_at";

export default function AdminCareerList() {
  const { profile, loading: profileLoading } = useUserProfile();
  const router = useRouter();

  const [jobs, setJobs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [openId, setOpenId] = useState<number | null>(null);

  // Filter & Search states
  const [search, setSearch] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [divisionFilter, setDivisionFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("newest_deadline");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  // Modal / Action states
  const [publishTarget, setPublishTarget] = useState<any | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Focus search input on open
  useEffect(() => {
    if (isSearchOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
  }, [isSearchOpen]);

  // Close filter dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ------------------------------------------------------
     FETCH DATA
  ------------------------------------------------------ */
  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching careers:", error);
        toast.error("Failed to load career listings");
      } else {
        setJobs(data || []);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  /* ------------------------------------------------------
     FILTERING & SORTING
  ------------------------------------------------------ */
  const filteredJobs = useMemo(() => {
    let list = [...jobs];

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (j) =>
          j.title?.toLowerCase().includes(q) ||
          j.division?.toLowerCase().includes(q) ||
          j.type?.toLowerCase().includes(q)
      );
    }

    // Filter Division
    if (divisionFilter !== "all") {
      list = list.filter((j) => j.division === divisionFilter);
    }

    // Filter Type
    if (typeFilter !== "all") {
      list = list.filter((j) => j.type === typeFilter);
    }

    // Filter Status
    if (statusFilter !== "all") {
      const isPub = statusFilter === "published";
      list = list.filter((j) => {
        const clean = j.status?.replace(/['"]/g, "").toLowerCase();
        return isPub ? clean === "published" : clean === "draft";
      });
    }

    // Sort
    if (sortBy === "newest_deadline") {
      list.sort(
        (a, b) =>
          new Date(b.deadline || 0).getTime() -
          new Date(a.deadline || 0).getTime()
      );
    } else if (sortBy === "oldest_deadline") {
      list.sort(
        (a, b) =>
          new Date(a.deadline || 0).getTime() -
          new Date(b.deadline || 0).getTime()
      );
    } else if (sortBy === "created_at") {
      list.sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime()
      );
    }

    return list;
  }, [jobs, search, divisionFilter, typeFilter, statusFilter, sortBy]);

  const isFilterActive =
    divisionFilter !== "all" ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    sortBy !== "newest_deadline";

  /* ------------------------------------------------------
     ACTIONS
  ------------------------------------------------------ */
  const handlePublish = async (job: any) => {
    if (!job) return;
    const clean = job.status?.replace(/['"]/g, "").toLowerCase();
    const newStatus = clean === "published" ? "draft" : "published";

    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          status: newStatus,
          published: newStatus === "published",
        })
        .eq("id", job.id);

      if (error) throw error;

      toast.success(
        newStatus === "published"
          ? "Career published to website"
          : "Career moved to draft"
      );
      setPublishTarget(null);
      fetchJobs();
    } catch (err: any) {
      console.error("Publish error:", err);
      toast.error(err?.message || "Failed to update status");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async (job: any) => {
    if (!job) return;
    if (profile?.role !== "admin") {
      toast.error("Only admin can delete career postings.");
      return;
    }

    setActionLoading(true);
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", job.id);
      if (error) throw error;

      toast.success(`"${job.title}" deleted successfully`);
      setDeleteTarget(null);
      setJobs((prev) => prev.filter((j) => j.id !== job.id));
    } catch (err: any) {
      console.error("Delete error:", err);
      toast.error(err?.message || "Failed to delete career");
    } finally {
      setActionLoading(false);
    }
  };

  const formatSkills = (s: any) => {
    if (!s) return "-";
    if (typeof s === "string" && s.startsWith("[") && s.endsWith("]")) {
      try {
        const arr = JSON.parse(s);
        return Array.isArray(arr) ? arr.join(", ") : s;
      } catch {
        return s;
      }
    }
    return s;
  };

  const getDescriptionList = (desc: any): string[] => {
    if (!desc) return [];
    if (Array.isArray(desc)) return desc;
    return String(desc)
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
  };

  if (!profileLoading && profile?.role === "staff") {
    return (
      <NoAccess message="Only admin and supervisor can access Career section." />
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* 1. HEADER */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-adidaya-text-muted">
            Admin • Network • Career
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
            <span className="text-adidaya-red font-bold">*</span> Career
          </h1>
          <p className="text-sm text-adidaya-text-muted">
            Manage studio job openings, recruitment criteria, applicant requirements, and career visibility.
          </p>
        </div>
      </header>

      {/* 2. SUBHEADER ACTION BAR */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        {/* KIRI: Back to Dashboard */}
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 select-none group w-fit shadow-sm"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </button>

        {/* KANAN: Search, Filters, Live Preview, Create Career */}
        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap sm:flex-nowrap">
          {/* SEARCH BUTTON */}
          <button
            type="button"
            onClick={() => {
              setIsSearchOpen((prev) => !prev);
              setIsFilterOpen(false);
            }}
            aria-label="Toggle search"
            className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 shadow-sm ${
              search || isSearchOpen
                ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)] text-adidaya-red"
                : "border border-white/10 bg-white/[0.04] text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.08]"
            }`}
          >
            <Search size={16} strokeWidth={1.5} />
            {search && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-adidaya-red ring-2 ring-black" />
            )}
          </button>

          {/* FILTER BUTTON & DROPDOWN */}
          <div ref={filterRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsFilterOpen((prev) => !prev)}
              aria-label="Filter careers"
              className={`w-10 h-10 rounded-full transition-all duration-200 flex items-center justify-center relative select-none backdrop-blur-md shrink-0 shadow-sm ${
                isFilterActive
                  ? "border border-adidaya-red bg-white/[0.04] shadow-[0_0_15px_rgba(229,57,53,0.3)] text-adidaya-red"
                  : "border border-white/10 bg-white/[0.04] text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/[0.08]"
              }`}
            >
              <SlidersHorizontal size={16} strokeWidth={1.5} />
              {isFilterActive && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-adidaya-red ring-2 ring-black" />
              )}
            </button>

            <AnimatePresence>
              {isFilterOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.96 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute right-0 top-full mt-3 w-64 bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2.5 shadow-2xl shadow-black/80 z-50 max-w-[calc(100vw-32px)]"
                >
                  {/* Header Reset */}
                  <div className="px-3 py-1.5 text-xs text-neutral-400 border-b border-white/10 mb-2 flex items-center justify-between font-medium">
                    <span>Filters & Sorting</span>
                    {isFilterActive && (
                      <button
                        onClick={() => {
                          setDivisionFilter("all");
                          setTypeFilter("all");
                          setStatusFilter("all");
                          setSortBy("newest_deadline");
                          setIsFilterOpen(false);
                        }}
                        className="text-adidaya-red hover:underline text-xs"
                      >
                        Reset
                      </button>
                    )}
                  </div>

                  {/* Status Pills */}
                  <div className="px-3 py-1 text-[11px] text-neutral-400 font-medium">
                    Status
                  </div>
                  <div className="grid grid-cols-3 gap-1 mb-2.5 p-0.5 bg-black/40 rounded-xl border border-white/5">
                    {(["all", "draft", "published"] as StatusFilter[]).map(
                      (s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setStatusFilter(s)}
                          className={`py-1.5 px-2 rounded-lg text-xs font-medium capitalize text-center transition-all ${
                            statusFilter === s
                              ? "bg-adidaya-red text-white font-semibold shadow-sm"
                              : "text-neutral-400 hover:text-white hover:bg-white/5"
                          }`}
                        >
                          {s}
                        </button>
                      )
                    )}
                  </div>

                  {/* Divisions */}
                  <div className="px-3 py-1 text-[11px] text-neutral-400 font-medium border-t border-white/10 pt-2">
                    Division
                  </div>
                  <div className="max-h-32 overflow-y-auto space-y-0.5 no-scrollbar p-0.5 mb-2">
                    <button
                      onClick={() => setDivisionFilter("all")}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        divisionFilter === "all"
                          ? "text-adidaya-red font-semibold bg-white/[0.08]"
                          : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>All Divisions</span>
                      {divisionFilter === "all" && (
                        <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                      )}
                    </button>
                    {Object.values(divisionsMap).map((div: string) => {
                      const isActive = divisionFilter === div;
                      return (
                        <button
                          key={div}
                          onClick={() => setDivisionFilter(div)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isActive
                              ? "text-adidaya-red font-semibold bg-white/[0.08]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="truncate">{div}</span>
                          {isActive && (
                            <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Job Type */}
                  <div className="px-3 py-1 text-[11px] text-neutral-400 font-medium border-t border-white/10 pt-2">
                    Job Type
                  </div>
                  <div className="max-h-28 overflow-y-auto space-y-0.5 no-scrollbar p-0.5 mb-2">
                    <button
                      onClick={() => setTypeFilter("all")}
                      className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                        typeFilter === "all"
                          ? "text-adidaya-red font-semibold bg-white/[0.08]"
                          : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                      }`}
                    >
                      <span>All Types</span>
                      {typeFilter === "all" && (
                        <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                      )}
                    </button>
                    {jobTypes.map((t) => {
                      const isActive = typeFilter === t;
                      return (
                        <button
                          key={t}
                          onClick={() => setTypeFilter(t)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
                            isActive
                              ? "text-adidaya-red font-semibold bg-white/[0.08]"
                              : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="truncate">{t}</span>
                          {isActive && (
                            <Check size={14} className="text-adidaya-red shrink-0 ml-2" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Sort */}
                  <div className="px-3 py-1 text-[11px] text-neutral-400 font-medium border-t border-white/10 pt-2">
                    Sort By
                  </div>
                  <div className="space-y-0.5 p-0.5">
                    {[
                      { key: "newest_deadline" as SortOption, label: "Newest Deadline" },
                      { key: "oldest_deadline" as SortOption, label: "Oldest Deadline" },
                      { key: "created_at" as SortOption, label: "Date Added" },
                    ].map((item) => {
                      const isActive = sortBy === item.key;
                      return (
                        <button
                          key={item.key}
                          onClick={() => setSortBy(item.key)}
                          className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium flex items-center justify-between transition-colors ${
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
            type="button"
            onClick={() => window.open("/career", "_blank")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none group shadow-sm"
          >
            <span>Live Preview</span>
            <ExternalLink
              size={12}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>

          {/* CREATE CAREER BUTTON */}
          <button
            type="button"
            onClick={() => router.push("/admin/career/create")}
            className="rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all select-none bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Create Career</span>
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
              <Search
                size={16}
                className="text-adidaya-red shrink-0 mr-3"
                strokeWidth={1.5}
              />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search careers by title, division, or type..."
                className="w-full min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder:text-adidaya-text-muted outline-none"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Clear search"
                  className="p-1 text-adidaya-text-muted hover:text-white rounded-full hover:bg-white/10 transition shrink-0 mr-1"
                >
                  <X size={14} strokeWidth={1.5} />
                </button>
              )}
              <button
                type="button"
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

      {/* 3. LIST OR EMPTY STATE */}
      <div className="space-y-4">
        {loading ? (
          <div className="w-full min-h-[30vh] flex flex-col items-center justify-center gap-3 text-adidaya-text-muted py-12">
            <Loader2 size={24} className="animate-spin text-adidaya-red" />
            <span className="text-xs uppercase tracking-widest">
              Loading career listings...
            </span>
          </div>
        ) : filteredJobs.length === 0 ? (
          /* UNIFIED EMPTY STATE */
          <div className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 text-center py-16 px-6">
            <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 mx-auto flex items-center justify-center text-neutral-400 mb-4 shadow-sm">
              <Briefcase size={20} />
            </div>
            <p className="text-base sm:text-lg font-semibold text-white">
              No career openings found
            </p>
            <p className="text-xs sm:text-sm text-adidaya-text-muted mt-1.5 max-w-sm mx-auto">
              {search || isFilterActive
                ? "Try adjusting your search query or filter criteria."
                : "Start by creating your first career position listing."}
            </p>
            {search || isFilterActive ? (
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setDivisionFilter("all");
                  setTypeFilter("all");
                  setStatusFilter("all");
                  setSortBy("newest_deadline");
                }}
                className="mt-5 rounded-full border border-white/15 bg-white/5 px-5 py-2 text-xs font-medium text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
              >
                Reset Filters
              </button>
            ) : (
              <button
                type="button"
                onClick={() => router.push("/admin/career/create")}
                className="mt-5 rounded-full bg-white px-5 py-2.5 text-xs font-semibold text-black shadow-md hover:bg-adidaya-red hover:text-white transition"
              >
                + Create Career
              </button>
            )}
          </div>
        ) : (
          filteredJobs.map((job) => {
            const isOpen = openId === job.id;
            const isPub =
              job.status?.replace(/['"]/g, "").toLowerCase() === "published";

            return (
              <motion.div
                key={job.id}
                layout
                className="rounded-3xl bg-[#0b0b0b] border border-neutral-800 overflow-hidden"
              >
                {/* COLLAPSED HEADER ROW */}
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => setOpenId(isOpen ? null : job.id)}
                >
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-wrap sm:flex-nowrap">
                    <span className="text-adidaya-red font-bold text-lg leading-none shrink-0">
                      *
                    </span>

                    {/* Title */}
                    <span className="font-semibold text-white truncate max-w-[200px] sm:max-w-xs">
                      {job.title}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-3 py-1 rounded-full text-[11px] uppercase tracking-[0.14em] shrink-0 ${
                        isPub
                          ? "bg-emerald-900/40 border border-emerald-700 text-emerald-300"
                          : "bg-orange-900/40 border border-orange-700 text-orange-300"
                      }`}
                    >
                      {isPub ? "Published" : "Draft"}
                    </span>

                    {/* Division */}
                    <span className="hidden md:inline text-xs text-neutral-500 truncate max-w-[150px]">
                      {job.division || "—"}
                    </span>

                    {/* Type */}
                    <span className="hidden sm:inline px-2.5 py-0.5 rounded-full text-[11px] border border-neutral-800 text-neutral-400">
                      {job.type || "—"}
                    </span>

                    {/* Deadline */}
                    {job.deadline && (
                      <span className="hidden lg:inline text-xs text-neutral-500">
                        Deadline: {job.deadline}
                      </span>
                    )}
                  </div>

                  {/* Expand toggle & Quick Action */}
                  <div className="flex items-center gap-3 ml-2 shrink-0">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenId(isOpen ? null : job.id);
                      }}
                      className="text-neutral-500 hover:text-white text-lg font-semibold w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/5 transition"
                    >
                      {isOpen ? "−" : "+"}
                    </button>
                  </div>
                </div>

                {/* EXPANDED CONTENT */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18 }}
                    >
                      <div className="border-t border-neutral-800 bg-[#070707] px-6 py-6 space-y-6">
                        {/* META INFO GRID */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4 text-xs">
                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                              Type
                            </p>
                            <p className="text-white font-medium">
                              {job.type || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                              Division
                            </p>
                            <p className="text-white font-medium">
                              {job.division || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                              Education
                            </p>
                            <p className="text-white font-medium">
                              {job.education || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                              Deadline
                            </p>
                            <p className="text-white font-medium">
                              {job.deadline || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                              Experience
                            </p>
                            <p className="text-white font-medium">
                              {job.experience || "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-1">
                              Skills
                            </p>
                            <p className="text-white font-medium truncate">
                              {formatSkills(job.skills)}
                            </p>
                          </div>
                        </div>

                        {/* DESCRIPTION */}
                        {job.description && (
                          <div className="pt-2 border-t border-neutral-800/80">
                            <p className="text-[11px] text-neutral-500 uppercase tracking-wider mb-2">
                              Job Requirements & Description
                            </p>
                            <ul className="list-disc pl-5 space-y-1 text-xs text-neutral-300">
                              {getDescriptionList(job.description).map(
                                (d, i) => (
                                  <li key={i}>{d}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        {/* ACTIONS FOOTER */}
                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-800">
                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() =>
                              router.push(`/admin/career/edit?id=${job.id}`)
                            }
                            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-neutral-300 hover:text-white hover:bg-white/10 hover:border-white/30 transition flex items-center gap-1.5 shadow-sm"
                          >
                            <Edit2 size={13} />
                            <span>Edit Career</span>
                          </button>

                          {/* Toggle Publish */}
                          <button
                            type="button"
                            onClick={() => setPublishTarget(job)}
                            className={`rounded-full px-4 py-2 text-xs font-medium transition flex items-center gap-1.5 shadow-sm ${
                              isPub
                                ? "border border-amber-500/30 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20"
                                : "border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20"
                            }`}
                          >
                            {isPub ? (
                              <>
                                <EyeOff size={13} />
                                <span>Unpublish</span>
                              </>
                            ) : (
                              <>
                                <Eye size={13} />
                                <span>Publish</span>
                              </>
                            )}
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => {
                              if (profile?.role !== "admin") {
                                toast.error(
                                  "Only admin can delete career postings."
                                );
                                return;
                              }
                              setDeleteTarget(job);
                            }}
                            className={`rounded-full px-4 py-2 text-xs font-medium transition flex items-center gap-1.5 shadow-sm ${
                              profile?.role === "admin"
                                ? "border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-white"
                                : "opacity-40 cursor-not-allowed border border-white/10 bg-white/5 text-neutral-500"
                            }`}
                          >
                            <Trash2 size={13} />
                            <span>Delete</span>
                          </button>
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

      {/* PUBLISH / UNPUBLISH MODAL */}
      <AnimatePresence>
        {publishTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-semibold text-white">
                {publishTarget.status?.replace(/['"]/g, "").toLowerCase() ===
                "published"
                  ? "Unpublish this career?"
                  : "Publish this career?"}
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                {publishTarget.status?.replace(/['"]/g, "").toLowerCase() ===
                "published"
                  ? "After unpublishing, this career posting will be hidden from the public website."
                  : "After publishing, this career position will be immediately visible on the public website."}
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPublishTarget(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-neutral-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handlePublish(publishTarget)}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-adidaya-red hover:bg-red-600 rounded-full text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md"
                >
                  {actionLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : null}
                  <span>
                    {publishTarget.status
                      ?.replace(/['"]/g, "")
                      .toLowerCase() === "published"
                      ? "Unpublish"
                      : "Publish"}
                  </span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
        {deleteTarget && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] w-full max-w-md rounded-3xl p-6 border border-white/15 shadow-2xl space-y-4"
            >
              <h3 className="text-base font-semibold text-white">
                Delete career position?
              </h3>

              <p className="text-xs text-neutral-400 leading-relaxed">
                Are you sure you want to permanently delete{" "}
                <strong className="text-white">
                  &quot;{deleteTarget.title}&quot;
                </strong>
                ? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDeleteTarget(null)}
                  disabled={actionLoading}
                  className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-xs font-medium text-neutral-300 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(deleteTarget)}
                  disabled={actionLoading}
                  className="px-5 py-2 bg-red-600 hover:bg-red-700 rounded-full text-xs font-semibold text-white transition flex items-center gap-1.5 shadow-md"
                >
                  {actionLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : null}
                  <span>Delete</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
