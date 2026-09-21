// components/network/CareerSection.tsx
"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { Mail, Share2 } from "lucide-react";
import ShareModal, { ShareItemData } from "@/components/ui/ShareModal";

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
  const [loading, setLoading] = useState(true);
  const [shareJob, setShareJob] = useState<Job | null>(null);

  // FETCH FUNCTION (dipisahkan biar bisa refetch)
  async function loadCareers() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("published", true)
        .order("created_at", { ascending: false });

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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
                <div className="mt-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs sm:text-sm text-gray-400">
                  <div>
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

                  {/* SHARE POSITION BUTTON */}
                  <button
                    type="button"
                    onClick={() => setShareJob(job)}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/15 text-xs text-white transition-all backdrop-blur-md cursor-pointer select-none shadow-sm hover:scale-105 active:scale-95 shrink-0"
                  >
                    <Share2 size={13} strokeWidth={1.75} />
                    <span>Share Position & Story</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })}

      {/* Loading State */}
      {loading && (
        <div className="py-16 text-center text-sm text-neutral-500">
          Loading career opportunities...
        </div>
      )}

      {/* Jika tidak ada job (Empty State bergaya No Projects) */}
      {!loading && jobs.length === 0 && (
        <div className="flex flex-col items-center justify-center text-center pt-8 pb-12 px-4 max-w-xl mx-auto">
          <h3 className="text-lg sm:text-xl font-medium text-white mb-2">
            No open positions at the moment
          </h3>
          <p className="text-sm text-adidaya-text-muted leading-relaxed mb-6 max-w-lg [text-wrap:balance]">
            We are not actively hiring right now, but we are always excited to connect with passionate talent. Feel free to send your CV and portfolio to stay in&nbsp;touch.
          </p>
          <motion.a
            href="mailto:adidayastudio@gmail.com?subject=Career%20Application%20-%20Adidaya%20Studio"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-adidaya-red hover:text-white transition-colors duration-200 shadow-lg select-none cursor-pointer"
          >
            <Mail className="w-4 h-4" strokeWidth={1.75} />
            <span>Send Email</span>
          </motion.a>
        </div>
      )}

      {/* SHARE MODAL */}
      {shareJob && (
        <ShareModal
          isOpen={Boolean(shareJob)}
          onClose={() => setShareJob(null)}
          data={{
            type: "career",
            title: shareJob.title,
            category: shareJob.division || "Career",
            meta: [
              shareJob.type,
              shareJob.division,
              shareJob.education,
              shareJob.experience?.split("\n")[0] || "",
              shareJob.deadline ? `Deadline: ${shareJob.deadline}` : "",
            ].filter(Boolean),
            excerpt: shareJob.description?.join(". ") || `Requirements: ${shareJob.skills || ""}`,
            url: typeof window !== "undefined" ? `${window.location.origin}/networks#career` : undefined,
          }}
        />
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
