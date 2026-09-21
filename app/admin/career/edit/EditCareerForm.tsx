"use client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import type { ReactNode } from "react";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import InputWithOptions from "@/components/InputWithOptions";
import { jobRoles } from "@/data/jobRoles";
import { divisionMap } from "@/data/divisionMap";
import { experienceOptions } from "@/data/experienceOptions";
import { defaultSkills } from "@/data/skills";
import { jobTypes } from "@/data/jobType";
import { useRouter, useSearchParams } from "next/navigation";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensors,
  useSensor,
} from "@dnd-kit/core";

import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

/* ===========================
   SORTABLE ITEM
=========================== */
function SortableItem({ id, children }: { id: string; children: ReactNode }) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id });

  return (
    <li
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      {...attributes}
      {...listeners}
      className="flex items-center justify-between cursor-grab"
    >
      {children}
    </li>
  );
}

/* ===========================
   MAIN PAGE
=========================== */
export default function EditCareerForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const careerId = searchParams.get("id");
  const isEdit = Boolean(careerId);

  /* STATES */
  const [title, setTitle] = useState("");
  const [jobCode, setJobCode] = useState("");
  const [type, setType] = useState("");
  const [division, setDivision] = useState("");

  const [educationLevel, setEducationLevel] = useState("");
  const [educationMajor, setEducationMajor] = useState("");

  const [experience, setExperience] = useState("");
  const [experienceNote, setExperienceNote] = useState("");

  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const [openSkillList, setOpenSkillList] = useState(false);
  const skillDropdownRef = useRef<HTMLDivElement>(null);

  const [deadline, setDeadline] = useState("");
  const [email] = useState("adidayastudio@gmail.com");
  const [subject, setSubject] = useState("");

  const [descriptionInput, setDescriptionInput] = useState("");
  const [descriptionList, setDescriptionList] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const [showToast, setShowToast] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  const clearError = (f: string) =>
    setErrors((prev) => ({ ...prev, [f]: "" }));

  /* DRAG SENSOR */
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 3 } })
  );

  /* ===========================
     FETCH EXISTING DATA
  ============================ */
  useEffect(() => {
    if (!careerId) return;

    async function loadCareer() {
      const { data } = await supabase
        .from("jobs")
        .select("*")
        .eq("id", careerId)
        .single();

      if (!data) return;

      setTitle(data.title || "");
      setJobCode(data.job_code || "");
      setType(data.type || "");
      setDivision(data.division || "");

      if (data.education?.includes("—")) {
        const [lvl, major] = data.education.split("—").map((v: string) => v.trim());
        setEducationLevel(lvl || "");
        setEducationMajor(major || "");
      }

      setExperience(data.experience || "");
      setSkills(Array.isArray(data.skills) ? data.skills : []);
      setDeadline(data.deadline || "");
      setSubject(data.subject || "");
      setDescriptionList(Array.isArray(data.description) ? data.description : []);
    }

    loadCareer();
  }, [careerId]);

  /* ===========================
     CLOSE SKILL DROPDOWN
  ============================ */
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        skillDropdownRef.current &&
        !skillDropdownRef.current.contains(e.target as Node)
      ) {
        setOpenSkillList(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  /* ===========================
     DESCRIPTION HANDLER
  ============================ */
  const addDesc = () => {
    if (!descriptionInput.trim()) return;
    setDescriptionList((prev) => [...prev, descriptionInput.trim()]);
    setDescriptionInput("");
  };

  const removeDesc = (i: number) =>
    setDescriptionList((prev) => prev.filter((_, x) => x !== i));

  /* ===========================
     VALIDATION
  ============================ */
  function validate() {
    const e: any = {};
    if (!title) e.title = true;
    if (!type) e.type = true;
    if (!division) e.division = true;
    if (!experience) e.experience = true;
    return e;
  }

  /* ===========================
     SUBMIT
  ============================ */
  const handleSubmit = async () => {
    setLoading(true);
    setErrors({});

    const v = validate();
    if (Object.keys(v).length > 0) {
      setErrors(v);
      setLoading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
      return;
    }

    const education =
      educationLevel || educationMajor
        ? `${educationLevel}${educationLevel && educationMajor ? " — " : ""}${educationMajor}`
        : "-";

    const payload = {
      title,
      job_code: jobCode,
      type,
      division,
      education,
      experience,
      skills: skills.length > 0 ? skills : ["-"],
      deadline,
      email,
      subject,
      description: descriptionList.length > 0 ? descriptionList : ["-"],
      file_note: "PDF, max. 5 MB",
    };

    const { error } = await supabase
      .from("jobs")
      .update(payload)
      .eq("id", careerId);

    if (error) {
      setMessage("❌ Error: " + error.message);
      setLoading(false);
      return;
    }

    router.push("/admin/career");
  };

  /* ===========================
     RENDER
  ============================ */
  return (
    <div className="min-h-screen bg-black pb-48 md:pb-56 pt-6 text-gray-100 font-sans">
      <div className="mx-auto flex w-full max-w-5xl flex-col px-4">
        
        {/* BREADCRUMB */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Admin • Network • Career
          </span>
        </div>

        {/* TITLE */}
        <h1 className="mb-2 text-3xl font-semibold text-white">
          <span className="mr-2 text-adidaya-red">*</span>
          Edit Career
        </h1>

        {/* SUBTITLE */}
        <p className="mb-6 text-xs text-gray-500">
          Fields with <span className="text-adidaya-red">*</span> are required.
        </p>

        {/* TOAST */}
        {showToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 bg-adidaya-red text-white px-5 py-3 rounded-xl shadow-lg animate-slideDown z-50">
            Please complete all required fields.
          </div>
        )}

        <div className="space-y-8 max-w-5xl">

          {/* ============================
              CODE + TITLE
          ============================= */}
          <div className="flex gap-6 items-start">
            <div className="w-1/2">
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                Code <span className="text-adidaya-red">*</span>
              </label>
              <input
                value={jobCode}
                readOnly
                className="w-full px-4 py-4 rounded-full bg-[#111] border border-gray-700 text-gray-400 cursor-not-allowed"
                placeholder="Auto"
              />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                Job Title <span className="text-adidaya-red">*</span>
              </label>
              <InputWithOptions
                label=""
                value={title}
                placeholder="Select or type..."
                onChange={(v) => {
                  setTitle(v);
                  clearError("title");

                  const role = jobRoles.find((r) => r.label === v);
                  if (role) {
                    setJobCode(role.code);
                    setSubject(`${role.code}_YourName`);
                    setDivision(divisionMap[role.code] ?? "");
                  }
                }}
                options={jobRoles.map((r) => r.label).sort()}
                error={errors.title}
              />
            </div>
          </div>

          {/* ============================
              TYPE + DIVISION
          ============================= */}
          <div className="flex gap-6 items-start">
            <div className="w-1/2">
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                Type <span className="text-adidaya-red">*</span>
              </label>
              <InputWithOptions
                label=""
                value={type}
                placeholder="Select or type..."
                onChange={(v) => {
                  setType(v);
                  clearError("type");
                }}
                options={jobTypes}
                error={errors.type}
              />
            </div>

            <div className="flex-1">
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                Division
              </label>
              <input
                value={division}
                readOnly
                className="w-full px-4 py-4 rounded-full bg-[#111] border border-gray-700 text-gray-400 cursor-not-allowed"
                placeholder="Auto-filled"
              />
            </div>
          </div>

          {/* ============================
              EDUCATION
          ============================= */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
              Education
            </label>
            <div className="flex gap-4">
              <div className="w-1/2">
                <InputWithOptions
                  label="Level"
                  value={educationLevel}
                  placeholder="Select level"
                  onChange={setEducationLevel}
                  options={["SD", "SMP", "SMA/SMK", "D-3", "S-1", "S-2", "S-3"]}
                />
              </div>

              <div className="flex-1">
                <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                  Major
                </label>
                <InputField
                  label=""
                  value={educationMajor}
                  placeholder="e.g. Architecture, Civil Engineering, ..."
                  onChange={(e) => setEducationMajor(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* ============================
              EXPERIENCE & SKILLS
          ============================= */}
          <div className="flex-1 space-y-6">

            {/* EXPERIENCE */}
            <div className="flex-1 space-y-2">
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                Experience <span className="text-adidaya-red">*</span>
              </label>
              <InputWithOptions
                label=""
                value={experience}
                placeholder="Select range"
                onChange={(v) => {
                  setExperience(v);
                  clearError("experience");

                  const exp = experienceOptions.find((e) => e.label === v);
                  setExperienceNote(exp?.note || "");
                }}
                options={experienceOptions.map((e) => e.label)}
                error={errors.experience}
              />
              {experienceNote && (
                <p className="text-xs text-gray-400 mt-1">{experienceNote}</p>
              )}
            </div>

            {/* SKILLS */}
            <div className="flex-1 space-y-2">
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
                Skills
              </label>

              <div ref={skillDropdownRef} className="relative">
                <input
                  value={skillInput}
                  onChange={(e) => {
                    setSkillInput(e.target.value);
                    setOpenSkillList(true);
                  }}
                  onFocus={() => setOpenSkillList(true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      if (skillInput && !skills.includes(skillInput)) {
                        setSkills((prev) => [...prev, skillInput]);
                        setSkillInput("");
                      }
                    }
                  }}
                  placeholder="Type or select..."
                  className="w-full px-4 py-3 rounded-full bg-[#111] border border-gray-700 text-white"
                />

                {openSkillList && (
                  <div className="absolute left-0 right-0 top-full mt-2 w-full bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl max-h-48 overflow-y-auto shadow-2xl shadow-black/80 z-50 p-1.5 space-y-0.5">
                    {defaultSkills
                      .filter((s) =>
                        s.toLowerCase().includes(skillInput.toLowerCase())
                      )
                      .map((skill) => (
                        <div
                          key={skill}
                          onClick={() => {
                            if (!skills.includes(skill)) {
                              setSkills((prev) => [...prev, skill]);
                            }
                            setSkillInput("");
                            setOpenSkillList(false);
                          }}
                          className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl cursor-pointer text-gray-300 hover:text-white hover:bg-white/[0.08] transition-colors"
                        >
                          {skill}
                        </div>
                      ))}

                    {skillInput &&
                      !defaultSkills.includes(skillInput) &&
                      !skills.includes(skillInput) && (
                        <div
                          onClick={() => {
                            setSkills((prev) => [...prev, skillInput]);
                            setSkillInput("");
                            setOpenSkillList(false);
                          }}
                          className="px-3.5 py-2 text-xs sm:text-sm font-medium rounded-xl cursor-pointer text-adidaya-red hover:text-white hover:bg-adidaya-red/20 transition-colors"
                        >
                          Add "{skillInput}"
                        </div>
                      )}
                  </div>
                )}

                {/* SKILL CHIPS */}
                <div className="flex flex-wrap gap-2 mt-2">
                  {skills.map((s) => (
                    <span
                      key={s}
                      className="px-3 py-1 bg-adidaya-red text-black rounded-full flex items-center gap-2 text-sm"
                    >
                      {s}
                      <button
                        onClick={() =>
                          setSkills((prev) => prev.filter((x) => x !== s))
                        }
                        className="text-black font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ============================
              DEADLINE
          ============================= */}
          <div className="w-1/2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
              Deadline
            </label>
            <input
              type="date"
              value={deadline}
              min={today}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full px-4 py-3 rounded-full bg-[#111] border border-gray-700 text-gray-200"
            />
          </div>

          {/* ============================
              SUBJECT
          ============================= */}
          <div className="w-1/2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
              Email Subject
            </label>
            <input
              value={subject}
              readOnly
              className="w-full px-4 py-3 rounded-full bg-[#111] border border-gray-700 text-gray-400"
              placeholder="Code_YourName"
            />
          </div>

          {/* ============================
              DESCRIPTION BULLETS
          ============================= */}
          <div>
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-gray-500">
              Description Bullets
            </label>

            <div className="flex gap-2 mb-3">
              <input
                className="flex-1 px-4 py-3 rounded-full bg-[#111] border border-gray-700 text-white"
                placeholder="e.g. Preparing presentation for clients"
                value={descriptionInput}
                onChange={(e) => setDescriptionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addDesc();
                  }
                }}
              />
              <button
                onClick={addDesc}
                className="px-5 py-3 rounded-full bg-adidaya-black text-white font-bold text-sm hover:text-adidaya-red"
              >
                Add
              </button>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={({ active, over }) => {
                if (!over || active.id === over.id) return;
                const oldIndex = descriptionList.indexOf(active.id as string);
                const newIndex = descriptionList.indexOf(over.id as string);
                if (oldIndex === -1 || newIndex === -1) return;
                setDescriptionList((i) => arrayMove(i, oldIndex, newIndex));
              }}
            >
              <SortableContext
                items={descriptionList}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-1 text-gray-300">
                  {descriptionList.map((d, i) => (
                    <SortableItem key={d} id={d}>
                      <span>• {d}</span>
                      <button
                        onClick={() => removeDesc(i)}
                        className="text-red-400 hover:text-red-300 text-sm ml-3"
                      >
                        ✕
                      </button>
                    </SortableItem>
                  ))}
                </ul>
              </SortableContext>
            </DndContext>
          </div>

          {message && <p className="mt-4 text-sm">{message}</p>}
        </div>

        {/* BOTTOM ACTION BAR (MATCHING FOOTER HEIGHT) */}
        <div className="fixed inset-x-0 bottom-0 bg-[#050509]/95 border-t border-white/10 backdrop-blur-xl z-40 shadow-[0_-10px_30px_rgba(0,0,0,0.6)] py-6 md:py-8 px-4 sm:px-6">
          <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-4">
            <div className="text-xs sm:text-sm text-neutral-400 font-medium">
              Save as draft to continue later.
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => router.push("/admin/career")}
                className="rounded-full border border-white/15 bg-white/5 px-6 py-2.5 text-xs font-medium text-neutral-200 hover:text-white hover:bg-white/10 hover:border-white/30 transition shadow-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="rounded-full border border-adidaya-red bg-adidaya-red px-7 py-2.5 text-xs font-semibold text-white shadow-lg shadow-red-900/40 transition hover:bg-red-700 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===========================
   REUSABLE INPUT FIELD
=========================== */
function InputField({
  label,
  value,
  placeholder,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (e: any) => void;
}) {
  return (
    <div>
      <label className="block mb-1 text-xs uppercase tracking-[0.2em] text-gray-500">
        {label}
      </label>
      <input
        className="w-full px-4 py-3 rounded-full bg-[#111] border border-gray-700 text-white"
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
    </div>
  );
}
