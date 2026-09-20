"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import useUserProfile from "@/hooks/useUserProfile";

/* ================================================================
   TYPES
================================================================ */
type Project = {
  id: string;
  project_name: string;
  slug: string | null;
  team_members: any[];
  is_published: boolean;
};

type Insight = {
  id: string;
  title: string;
  slug: string | null;
  authors: any[];
  status: string;
};

/* ================================================================
   PAGE COMPONENT
================================================================ */
export default function AdminProfilePage() {
  const { profile, loading } = useUserProfile();

  const [projects, setProjects] = useState<Project[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);

  /* ================================================================
     AFTER PROFILE LOADED → FETCH PROJECTS + INSIGHTS
  ================================================================= */
  useEffect(() => {
    if (!profile) return;
    fetchProjects(profile);
    fetchInsights(profile);
  }, [profile]);

  /* ================================================================
     FETCH PROJECTS
  ================================================================= */
  const fetchProjects = async (profile: any) => {
    const { data } = await supabase
      .from("projects")
      .select("id, project_name, slug, team_members, is_published")
      .eq("is_published", true)
      .order("created_at", { ascending: false });

    if (!data) return setProjects([]);

    const username = profile.name?.trim().toLowerCase() || "";

    const filtered = data.filter((p) =>
      p.team_members?.some(
        (m: any) => m?.name?.trim().toLowerCase() === username
      )
    );

    setProjects(filtered);
  };

  /* ================================================================
     FETCH INSIGHTS
  ================================================================= */
  const fetchInsights = async (profile: any) => {
    const { data } = await supabase
      .from("insight")
      .select("id, title, slug, authors, status")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (!data) return setInsights([]);

    const username = profile.name?.trim().toLowerCase() || "";

    const filtered = data.filter((i) =>
      i.authors?.some(
        (a: any) => a?.name?.trim().toLowerCase() === username
      )
    );

    setInsights(filtered);
  };

  /* ================================================================
     LOADING STATE
  ================================================================= */
  if (loading || !profile) {
    return (
      <div className="text-gray-400 p-10 text-center">Loading profile...</div>
    );
  }

  /* ================================================================
     UI
  ================================================================= */
  return (
    <div className="max-w-3xl mx-auto mb-20 space-y-10">

      {/* ==========================
          HEADER SECTION
      =========================== */}
      <div className="flex items-start justify-between">

        {/* LEFT: Avatar + Info */}
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-full bg-[#111] border border-white/10 overflow-hidden">
            <Image
              src={profile.image_url || "/logo-adidaya-red.svg"}
              alt="avatar"
              width={56}
              height={56}
              className="object-cover"
            />
          </div>

          <div>
            <h1 className="text-3xl font-semibold text-white">
              {profile.name}
            </h1>

            <p className="text-gray-400 mt-1 text-sm">
              {profile.position || "Architect"} · {profile.role?.toUpperCase()}
            </p>

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/login";
              }}
              className="text-adidaya-red text-sm mt-3 hover:opacity-80 transition"
            >
              Logout
            </button>
          </div>
        </div>

        {/* RIGHT: Back button */}
        <Link
          href="/admin"
          className="px-6 py-2 rounded-full border border-gray-600/40 text-gray-300 
                     text-sm hover:text-adidaya-red hover:border-adidaya-red transition"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* ==========================
          PROFILE INFO
      =========================== */}
      <Section title="Profile Information">
        <InfoRow label="Name" value={profile.name} />
        <InfoRow label="Position" value={profile.position || "Architect"} />
        <InfoRow
          label="Role"
          value={profile.role ? profile.role.toUpperCase() : "-"}
        />
        <InfoRow label="Email" value={profile.email || "-"} />
      </Section>

      {/* ==========================
          PROJECTS
      =========================== */}
      <Section title="Projects Involved">
        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm">No projects yet.</p>
        ) : (
          <div className="space-y-3">
            {projects.map((p) => (
              <Link
                key={p.id}
                href={`/projects/${p.slug || p.id}`}
                target="_blank"
                className="block p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]
                           hover:bg-white/[0.06] transition text-gray-300 text-sm"
              >
                {p.project_name}
              </Link>
            ))}
          </div>
        )}
      </Section>

      {/* ==========================
          INSIGHTS
      =========================== */}
      <Section title="Insights Written">
        {insights.length === 0 ? (
          <p className="text-gray-500 text-sm">No insights published.</p>
        ) : (
          <div className="space-y-3">
            {insights.map((i) => (
              <Link
                key={i.id}
                href={`/insights/${i.slug || i.id}`}
                target="_blank"
                className="block p-3 rounded-lg bg-white/[0.03] border border-white/[0.05]
                           hover:bg-white/[0.06] transition text-gray-300 text-sm"
              >
                {i.title}
              </Link>
            ))}
          </div>
        )}
      </Section>

    </div>
  );
}

/* ================================================================
   SUB COMPONENTS
================================================================ */
function InfoRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex justify-between items-center border-b border-white/5 py-2 gap-4">
      <span className="text-gray-500 text-sm">{label}</span>
      <span className="text-gray-200 text-sm text-right">{value || "-"}</span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-6 rounded-xl bg-[#0f0f0f] border border-white/5">
      <h2 className="text-lg font-semibold text-white mb-4">{title}</h2>
      {children}
    </div>
  );
}
