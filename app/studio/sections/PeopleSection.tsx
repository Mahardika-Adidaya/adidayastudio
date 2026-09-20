"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabaseClient";
import { isChannelVisible } from "@/lib/slugHelper";

type Profile = {
  id: string;
  name: string | null;
  email: string | null;
  personal_email?: string | null;
  phone?: string | null;
  contact_visibility?: Record<string, { feed?: boolean; card?: boolean }> | null;
  role: string | null;
  order_index: number | null;
  is_published: boolean | null;
  position: string | null;
  linkedin: string | null;
  instagram: string | null;
  image_url: string | null;
  slug?: string | null;
  level: number | null;
};

export default function PeopleSection() {
  const [people, setPeople] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (error) {
        console.error("❌ Error fetching people:", error);
        setLoading(false);
        return;
      }

      // hide admin
      const filtered = data.filter((p) => p.role !== "admin");

      setPeople(filtered);
      setLoading(false);
    };

    fetchProfiles();
  }, []);

  if (loading) return <p className="text-gray-400">Loading team...</p>;

  return (
    <div className="grid md:grid-cols-3 gap-10">
      {people.map((person) => (
        <div key={person.id} className="group">

          {/* IMAGE */}
          <div className="relative overflow-hidden rounded-3xl h-64 bg-[#111111] border border-white/10 flex items-center justify-center">
            {person.image_url ? (
              <Image
                src={person.image_url}
                alt={person.name || "Team Member"}
                width={400}
                height={400}
                className="
                  object-cover w-full h-full
                  transition-all duration-300
                  group-hover:scale-105 group-hover:brightness-75
                "
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full w-full bg-[#111111]">
                <Image
                  src="/logo-adidaya-red.svg"
                  alt="Adidaya"
                  width={64}
                  height={64}
                  className="w-16 h-16 opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300"
                />
              </div>
            )}

            {/* HOVER OVERLAY */}
            <div
              className="
                absolute inset-0 rounded-3xl bg-adidaya-red/50
                opacity-0 group-hover:opacity-100
                transition-all duration-300
                flex flex-col justify-center items-center gap-4
              "
            >
              <p className="text-white text-lg font-semibold">
                {person.name}
              </p>

              <div className="flex gap-2.5 flex-wrap justify-center px-4">
                {person.linkedin &&
                  isChannelVisible(person.contact_visibility, "linkedin", "feed") && (
                    <a
                      href={
                        person.linkedin.startsWith("http")
                          ? person.linkedin
                          : `https://linkedin.com/in/${person.linkedin}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white/20 rounded-full text-xs text-white hover:bg-white/40 transition-colors font-medium"
                    >
                      LinkedIn
                    </a>
                  )}

                {person.instagram &&
                  isChannelVisible(person.contact_visibility, "instagram", "feed") && (
                    <a
                      href={
                        person.instagram.startsWith("http")
                          ? person.instagram
                          : `https://instagram.com/${person.instagram.replace("@", "")}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white/20 rounded-full text-xs text-white hover:bg-white/40 transition-colors font-medium"
                    >
                      IG
                    </a>
                  )}

                {person.phone &&
                  isChannelVisible(person.contact_visibility, "phone", "feed") && (
                    <a
                      href={`https://wa.me/${person.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1 bg-white/20 rounded-full text-xs text-white hover:bg-white/40 transition-colors font-medium"
                    >
                      WA
                    </a>
                  )}

                {person.email &&
                  isChannelVisible(person.contact_visibility, "email", "feed") && (
                    <a
                      href={`mailto:${person.email}`}
                      title="Work Email"
                      className="px-3 py-1 bg-white/20 rounded-full text-xs text-white hover:bg-white/40 transition-colors font-medium"
                    >
                      {person.personal_email &&
                      isChannelVisible(
                        person.contact_visibility,
                        "personal_email",
                        "feed"
                      )
                        ? "Work"
                        : "Email"}
                    </a>
                  )}

                {person.personal_email &&
                  isChannelVisible(
                    person.contact_visibility,
                    "personal_email",
                    "feed"
                  ) && (
                    <a
                      href={`mailto:${person.personal_email}`}
                      title="Personal Email"
                      className="px-3 py-1 bg-white/20 rounded-full text-xs text-white hover:bg-white/40 transition-colors font-medium"
                    >
                      {person.email &&
                      isChannelVisible(person.contact_visibility, "email", "feed")
                        ? "Personal"
                        : "Email"}
                    </a>
                  )}
              </div>
            </div>
          </div>

          {/* NAME + POSITION */}
          <div className="mt-4">
            <p className="font-semibold text-xl text-adidaya-red">
              {person.name}
            </p>
            <p className="text-gray-400 text-sm">
              {person.position}
            </p>
          </div>

        </div>
      ))}
    </div>
  );
}
