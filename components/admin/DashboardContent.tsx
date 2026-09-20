"use client";

import HomeHeroCard from "./HomeHeroCard";
import PeopleCard from "./PeopleCard";
import StatsProjects from "./StatsProjects";
import StatsInsights from "./StatsInsights";
import ContactCard from "./ContactCard";
import StatsCareers from "./StatsCareers";

export default function DashboardContent({ role }: { role: string }) {
  return (
    <div className="flex flex-col gap-5">
      {/* HOME HERO (admin & supervisor only) */}
      {(role === "admin" || role === "supervisor") && <HomeHeroCard />}

      {/* STUDIO TEAM & PEOPLE (admin & supervisor only) */}
      {(role === "admin" || role === "supervisor") && <PeopleCard />}

      {/* PROJECTS (semua role) */}
      <StatsProjects />

      {/* INSIGHTS (semua role) */}
      <StatsInsights />

      {/* CONTACTS (admin & supervisor only) */}
      {(role === "admin" || role === "supervisor") && <ContactCard />}

      {/* CAREERS (admin & supervisor only) */}
      {(role === "admin" || role === "supervisor") && <StatsCareers />}
    </div>
  );
}
