"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowDown,
  ArrowUp,
  Trash2,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  Camera,
  Loader2,
} from "lucide-react";
import ContactPopover from "./ContactPopover";
import { getPersonSlug } from "@/lib/slugHelper";

export type Person = {
  id: string;
  order_index: number;
  name: string;
  position: string;
  role: "admin" | "supervisor" | "staff";
  image_url: string | null;
  linkedin: string | null;
  instagram: string | null;
  email: string | null;
  personal_email?: string | null;
  phone?: string | null;
  slug?: string | null;
  contact_visibility?: Record<string, { feed?: boolean; card?: boolean }> | null;
  is_published: boolean;

  image_file?: File | null;
  preview_url?: string | null;
};

type Props = {
  person: Person;
  index: number;
  allPeople?: Person[];

  onChange: (id: string, changes: Partial<Person>) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;

  onSave: (id: string) => Promise<void>;
  onTogglePublish: (id: string, isPublished: boolean) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onDeletePhoto: (id: string) => void;

  saving: boolean;
  publishing: boolean;

  activePopoverId: string | null;
  openPopover: () => void;
  closePopover: () => void;

  canEdit: boolean;
};

export default function PeopleRow(props: Props) {
  const {
    person,
    index,
    allPeople = [],
    onChange,
    onMoveUp,
    onMoveDown,
    onSave,
    onTogglePublish,
    onDelete,
    onDeletePhoto,
    saving,
    publishing,
    activePopoverId,
    openPopover,
    closePopover,
    canEdit,
  } = props;

  const [roleOpen, setRoleOpen] = useState(false);
  const roleRef = useRef<HTMLDivElement | null>(null);
  const hasContact =
    person.linkedin ||
    person.instagram ||
    person.email ||
    person.personal_email ||
    person.phone;
  const currentSlug = getPersonSlug(person, allPeople);

  /* CLOSE DROPDOWN */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const isTemp = person.id.startsWith("temp-");

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "44px 64px 1.2fr 1fr 105px 80px 45px 55px 80px",
      }}
      className="gap-3.5 px-5 py-3 items-center text-xs bg-[#0c0c0c] hover:bg-[#121212] rounded-2xl transition-all shadow-sm border border-transparent hover:border-white/5"
    >
      {/* 1. NO & REORDER */}
      <div className="flex flex-col items-center gap-1 font-mono text-neutral-500">
        <span className="text-xs font-semibold text-neutral-300">{index + 1}</span>

        <div className="flex items-center gap-0.5">
          <button
            onClick={canEdit ? onMoveUp : undefined}
            disabled={!canEdit}
            title="Move Up"
            className="rounded p-0.5 text-neutral-500 hover:text-white hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ArrowUp className="h-3 w-3" />
          </button>

          <button
            onClick={canEdit ? onMoveDown : undefined}
            disabled={!canEdit}
            title="Move Down"
            className="rounded p-0.5 text-neutral-500 hover:text-white hover:bg-neutral-800 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
          >
            <ArrowDown className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* 2. PHOTO */}
      <div className="flex flex-col items-center gap-1">
        <div className="relative group">
          {person.preview_url || person.image_url ? (
            <img
              src={person.preview_url || person.image_url || ""}
              className="h-12 w-12 rounded-xl object-cover bg-[#161616] border border-white/10"
              alt="Preview"
            />
          ) : (
            <div className="h-12 w-12 flex items-center justify-center rounded-xl bg-[#161616] border border-white/10 p-2.5">
              <img
                src="/logo-adidaya-red.svg"
                alt="Adidaya Logo"
                className="w-full h-full object-contain opacity-50"
              />
            </div>
          )}

          {canEdit && (
            <label
              title="Upload photo"
              className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity text-white"
            >
              <Camera className="h-4 w-4" />
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  onChange(person.id, {
                    image_file: file,
                    preview_url: URL.createObjectURL(file),
                  });
                }}
              />
            </label>
          )}
        </div>

        {/* Delete photo if exists */}
        {person.image_url && canEdit && (
          <button
            onClick={() => onDeletePhoto(person.id)}
            className="text-[9px] font-mono text-adidaya-red/70 hover:text-adidaya-red transition-colors"
          >
            Remove
          </button>
        )}
      </div>

      {/* 3. NAME */}
      <div>
        <input
          value={person.name}
          readOnly={!canEdit}
          onChange={(e) => canEdit && onChange(person.id, { name: e.target.value })}
          placeholder="Full Name"
          style={{ backgroundColor: "#181818", color: "#ffffff" }}
          className={`
            w-full rounded-xl border border-white/10 px-3.5 py-2.5 text-xs text-white
            placeholder:text-neutral-500 focus:border-adidaya-red focus:ring-1 focus:ring-adidaya-red focus:bg-[#1f1f1f] outline-none transition-all
            ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>

      {/* 4. POSITION */}
      <div>
        <input
          value={person.position}
          readOnly={!canEdit}
          onChange={(e) =>
            canEdit && onChange(person.id, { position: e.target.value })
          }
          placeholder="Position / Title"
          style={{ backgroundColor: "#181818", color: "#ffffff" }}
          className={`
            w-full rounded-xl border border-white/10 px-3.5 py-2.5 text-xs text-white
            placeholder:text-neutral-500 focus:border-adidaya-red focus:ring-1 focus:ring-adidaya-red focus:bg-[#1f1f1f] outline-none transition-all
            ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}
          `}
        />
      </div>

      {/* 5. ROLE SELECTOR */}
      <div className="relative" ref={roleRef}>
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => canEdit && setRoleOpen(!roleOpen)}
          style={{ backgroundColor: "#181818", color: "#ffffff" }}
          className={`
            w-full rounded-xl border border-white/10 px-3.5 py-2.5 text-xs flex justify-between items-center transition-all text-neutral-200
            ${canEdit ? "hover:border-white/30 hover:bg-[#202020] cursor-pointer" : "opacity-50 cursor-not-allowed"}
          `}
        >
          <span className="capitalize text-xs truncate">{person.role}</span>
          <span className="text-neutral-500 text-[9px] ml-1">▼</span>
        </button>

        {roleOpen && canEdit && (
          <div
            style={{ backgroundColor: "#1a1a1a" }}
            className="absolute z-50 mt-1.5 w-full rounded-xl border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.95)] p-1.5 bg-[#1a1a1a]"
          >
            {["admin", "supervisor", "staff"].map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => {
                  onChange(person.id, { role: r as any });
                  setRoleOpen(false);
                }}
                className={`
                  w-full text-left px-2.5 py-2 text-xs rounded-lg capitalize transition-colors flex items-center justify-between
                  ${person.role === r ? "bg-white/15 text-white font-semibold" : "text-neutral-300 hover:bg-white/10 hover:text-white"}
                `}
              >
                <span>{r}</span>
                {person.role === r && <Check className="h-3.5 w-3.5 text-adidaya-red stroke-[2.5]" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 6. CONTACT (CLEAN DIRECT ICONS) */}
      <div className="flex justify-center">
        <button
          type="button"
          disabled={!canEdit}
          onClick={() => canEdit && openPopover()}
          title="Edit contact & ID card credentials"
          className={`
            flex items-center justify-center gap-1.5 p-1.5 transition-all
            ${canEdit ? "text-neutral-400 hover:text-white cursor-pointer group" : "opacity-40 cursor-not-allowed text-neutral-600"}
          `}
        >
          {hasContact ? (
            <div className="flex items-center gap-1.5 text-neutral-400 group-hover:text-white transition-colors">
              {person.phone && <Phone className="h-3.5 w-3.5 text-emerald-400/80 hover:text-emerald-400 transition-colors" />}
              {person.email && <Mail className="h-3.5 w-3.5 text-amber-400/80 hover:text-amber-400 transition-colors" />}
              {person.linkedin && <Linkedin className="h-3.5 w-3.5 text-sky-400/80 hover:text-sky-400 transition-colors" />}
              {person.instagram && <Instagram className="h-3.5 w-3.5 text-pink-400/80 hover:text-pink-400 transition-colors" />}
            </div>
          ) : (
            <span className="text-[11px] font-mono text-neutral-600 group-hover:text-neutral-300 transition-colors">+ Add</span>
          )}
        </button>
      </div>

      {/* 7. VIRTUAL ID CARD LINK (ARROW SLANTED ↗️) */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={() => window.open(`/id/${currentSlug}`, "_blank")}
          title={`Open Virtual ID Card (/id/${currentSlug})`}
          className="h-8 w-8 flex items-center justify-center rounded-xl bg-white/[0.04] border border-white/10 text-neutral-400 hover:text-white hover:border-adidaya-red/40 hover:bg-adidaya-red/10 transition-all cursor-pointer group"
        >
          <ArrowUpRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-neutral-400 group-hover:text-adidaya-red" />
        </button>
      </div>

      {/* 8. SHOW IN FEED TOGGLE (CLEAN DIRECT EYE ICON) */}
      <div className="flex justify-center">
        <button
          type="button"
          disabled={!canEdit || isTemp || publishing}
          onClick={() => canEdit && !isTemp && onTogglePublish(person.id, !person.is_published)}
          title={
            isTemp
              ? "Save member first to enable feed visibility"
              : person.is_published
              ? "Visible in /studio feed (Click to hide)"
              : "Hidden from /studio feed (Click to show)"
          }
          className={`
            flex items-center justify-center p-1.5 transition-all select-none
            ${
              isTemp
                ? "opacity-20 cursor-not-allowed text-neutral-600"
                : publishing
                ? "opacity-50 cursor-wait animate-pulse"
                : person.is_published
                ? "text-emerald-400 hover:text-emerald-300 hover:scale-110 cursor-pointer"
                : "text-neutral-600 hover:text-neutral-300 hover:scale-110 cursor-pointer"
            }
          `}
        >
          {person.is_published ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>

      {/* 9. ACTIONS (CHECKMARK SAVE & TRASH DELETE) */}
      <div className="flex items-center justify-end gap-2 text-xs">
        <button
          disabled={!canEdit || saving}
          onClick={() => canEdit && onSave(person.id)}
          title={isTemp ? "Create Member" : "Save Changes"}
          className={`
            h-8 w-8 rounded-full border transition-all select-none flex items-center justify-center
            ${
              isTemp
                ? "bg-adidaya-red text-white border-adidaya-red hover:bg-red-600 shadow-[0_0_12px_rgba(229,57,53,0.4)] cursor-pointer"
                : "bg-white/[0.06] border-white/10 text-neutral-400 hover:bg-white hover:text-black hover:border-white hover:shadow-md hover:scale-105 cursor-pointer"
            }
            ${saving ? "opacity-50 cursor-wait animate-pulse" : ""}
            ${!canEdit ? "opacity-30 cursor-not-allowed" : ""}
          `}
        >
          <Check className="h-4 w-4 stroke-[2.5]" />
        </button>

        <button
          disabled={!canEdit}
          onClick={() => canEdit && onDelete(person.id)}
          title="Delete Member"
          className={`
            h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.06] border border-white/10 text-neutral-400 hover:text-white hover:bg-adidaya-red hover:border-adidaya-red transition-all
            ${!canEdit ? "opacity-30 cursor-not-allowed" : "cursor-pointer"}
          `}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* CONTACT POPUP */}
      {activePopoverId === person.id && canEdit && (
        <ContactPopover
          person={person}
          allPeople={allPeople}
          onChange={onChange}
          onSave={onSave}
          onClose={closePopover}
        />
      )}
    </div>
  );
}
