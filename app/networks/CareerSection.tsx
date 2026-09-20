// components/network/CareerSection.tsx
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";

interface Job {
  id: number;
  title: string;
  type: string;
  division: string;
  education: string;
  experience: string;
  skills: string;
  deadline: string;
  description: string[];
  email: string;
  subject: string;
  fileNote: string;
}

export const dynamic = "force-dynamic";

export default function CareerSection() {
  const [openId, setOpenId] = useState<number | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);

  // FETCH FUNCTION (dipisahkan biar bisa refetch)
  async function loadCareers() {
    const { data, error } = await supabase
      .from("jobs")
      .select("*")
      .eq("published", true)
      .order("created_at", { ascending: false })
      .throwOnError();

    if (!error && data) {
      setJobs(
        data.map((job: any) => ({
          ...job,
          description: Array.isArray(job.description)
            ? job.description
            : [],
        }))
      );
    }
  }

  // FETCH ON MOUNT
  useEffect(() => {
    loadCareers();
  }, []);

  // REFRESH DATA SAAT TAB AKTIF LAGI (setelah publish/delete)
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        loadCareers();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, []);

  function formatSkills(raw: any) {
    if (!raw) return "-";

    // jika array → join
    if (Array.isArray(raw)) return raw.join(", ");

    // jika string "[...]" → parse
    try {
      if (raw.startsWith("[") && raw.endsWith("]")) {
        return JSON.parse(raw).join(", ");
      }
    } catch {}

    return raw; // fallback
  }


  return (
    <div className="flex flex-col divide-y divide-[#2a2a2f]">
      {jobs.map((job) => {
        const isOpen = job.id === openId;

        return (
          <div key={job.id} className="py-8">
            {/* HEADER */}
            <button
              className="w-full flex items-center justify-between group py-4"
              onClick={() => setOpenId(isOpen ? null : job.id)}
            >
              {/* LEFT TITLE */}
              <div className="flex items-center gap-3">
                <span className="text-red-500 text-xl">*</span>
                <span
                  className={`
                    text-lg sm:text-xl font-semibold transition-colors duration-200
                    group-hover:text-adidaya-red
                  `}
                >
                  {job.title}
                </span>
              </div>

              {/* RIGHT SIDE */}
              <div className="flex items-center gap-6">
                {!isOpen && (
                  <div className="hidden sm:flex items-center gap-4 text-xs text-gray-500 leading-none">
                    <span>{job.type}</span>
                    <span>•</span>
                    <span>{job.division}</span>
                    <span>•</span>
                    <span>{job.experience?.split("\n")[0]}</span>
                    <span>•</span>
                    <span>{job.deadline}</span>
                  </div>
                )}

                {/* ICON */}
                <span className="text-2xl text-gray-400 group-hover:text-adidaya-red transition-colors leading-none flex items-center translate-y-[-3px]">
                  {isOpen ? "−" : "+"}
                </span>
              </div>
            </button>

            {/* DROPDOWN */}
            <div
              className={`grid transition-[grid-template-rows] duration-300 ease-out
                ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}
              `}
            >
              <div className="overflow-hidden">
                {/* GRID INFO */}
                <div className="mt-6 grid gap-8 md:grid-cols-4 text-sm leading-relaxed">
                  <Info label="Type" value={job.type} />
                  <Info label="Division" value={job.division} />
                  <Info label="Education" value={job.education} />
                  <Info label="Deadline" value={job.deadline} />
                  <Info label="Experience" value={job.experience} />
                  <Info label="Skill" value={formatSkills(job.skills)} />

                </div>

                {/* DESCRIPTION */}
                <div className="mt-6 text-sm">
                  <p className="text-[10px] tracking-widest text-gray-500 uppercase">
                    Description
                  </p>
                  <ul className="list-disc pl-5 space-y-1 text-gray-300">
                    {job.description?.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>

                {/* FOOTER */}
                <div className="mt-6 text-xs sm:text-sm text-gray-400">
                  <p className="mb-1">
                    Please send your CV and portfolio with the following:
                  </p>
                  <p>
                    <span className="font-semibold text-white">Email:</span>{" "}
                    {job.email}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Subject:</span>{" "}
                    {job.subject}
                  </p>
                  <p>
                    <span className="font-semibold text-white">File:</span>{" "}
                    {job.fileNote || "PDF, max. 5 MB"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Jika tidak ada job */}
      {jobs.length === 0 && (
        <p className="py-10 text-center text-gray-500 text-sm">
          No open positions at the moment.
        </p>
      )}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="uppercase tracking-[0.18em] text-[10px] text-gray-500 mb-1">
        {label}
      </p>
      <p className="whitespace-pre-line text-gray-200">{value}</p>
    </div>
  );
}
