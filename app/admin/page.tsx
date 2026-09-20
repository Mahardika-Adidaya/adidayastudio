"use client";

import useUserProfile from "@/hooks/useUserProfile";
import HeaderAdmin from "@/components/admin/HeaderAdmin";
import DashboardContent from "@/components/admin/DashboardContent";
import { Loader2 } from "lucide-react";

export default function AdminDashboardPage() {
  const { profile, loading } = useUserProfile();

  /* ============================
     1. LOADING STATE
     ============================ */
  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-adidaya-text-muted">
        <Loader2 size={24} className="animate-spin text-adidaya-red" />
        <span className="text-xs uppercase tracking-widest font-mono">Loading dashboard...</span>
      </div>
    );
  }

  /* ============================
     2. NO SESSION AT ALL → NO ACCESS
     ============================ */
  if (!profile) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-2 text-red-400">
        <p className="text-base font-semibold">Access Restricted</p>
        <p className="text-xs text-adidaya-text-muted">Please sign in with authorized credentials to view this page.</p>
      </div>
    );
  }

  /* ============================
     3. VALID SESSION (admin, supervisor, staff)
     ============================ */
  return (
    <div className="w-full max-w-5xl mx-auto px-6 py-8">
      <HeaderAdmin profile={profile} />
      <DashboardContent role={profile.role ?? "staff"} />
    </div>
  );
}

