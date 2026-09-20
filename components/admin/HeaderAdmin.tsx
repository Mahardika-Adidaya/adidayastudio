"use client";

import { ProfileType } from "@/hooks/useUserProfile";

export default function HeaderAdmin({ profile: _profile }: { profile?: ProfileType }) {
  return (
    <header className="mb-8 sm:mb-10">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
          Admin • Dashboard
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
          <span className="text-adidaya-red font-bold">*</span> Dashboard
        </h1>
        <p className="text-sm text-adidaya-text-muted">
          Manage homepage, studio team, projects, insights, and career listings.
        </p>
      </div>
    </header>
  );
}

