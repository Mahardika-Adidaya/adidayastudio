"use client";

import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Linkedin,
  Instagram,
  Mail,
  Phone,
  Link2,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";
import { Person } from "./PeopleRow";
import {
  getPersonSlug,
  slugify,
  isChannelVisible,
  ContactChannel,
} from "@/lib/slugHelper";

type Props = {
  person: Person;
  allPeople?: Person[];
  onChange: (id: string, changes: Partial<Person>) => void;
  onSave?: (id: string) => Promise<void> | void;
  onClose: () => void;
};

export default function ContactPopover({
  person,
  allPeople = [],
  onChange,
  onSave,
  onClose,
}: Props) {
  if (typeof window === "undefined") return null;

  const root = document.getElementById("people-popover-root");
  if (!root) return null;

  const autoSlug = getPersonSlug({ ...person, slug: null }, allPeople);

  const handleField =
    (
      field:
        | "linkedin"
        | "instagram"
        | "email"
        | "personal_email"
        | "phone"
        | "slug"
        | "nip"
    ) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      if (field === "slug") {
        val = slugify(val);
      }
      onChange(person.id, { [field]: val } as Partial<Person>);
    };

  const toggleVisibility = (channel: ContactChannel, target: "feed" | "card") => {
    const currentVis = person.contact_visibility || {};
    const channelVis = currentVis[channel] || {};
    const currentVal = isChannelVisible(currentVis, channel, target);

    const updatedVis = {
      ...currentVis,
      [channel]: {
        ...channelVis,
        [target]: !currentVal,
      },
    };

    onChange(person.id, { contact_visibility: updatedVis });
  };

  const clearAll = () => {
    onChange(person.id, {
      linkedin: null,
      instagram: null,
      email: null,
      personal_email: null,
      phone: null,
      slug: null,
      contact_visibility: null,
    });
  };

  const renderVisibilityToggles = (channel: ContactChannel) => {
    const feedVis = isChannelVisible(person.contact_visibility, channel, "feed");
    const cardVis = isChannelVisible(person.contact_visibility, channel, "card");

    return (
      <div className="flex items-center gap-1.5">
        {/* Feed Visibility Toggle */}
        <button
          type="button"
          onClick={() => toggleVisibility(channel, "feed")}
          title={
            feedVis
              ? "Visible in Studio Feed (Click to hide)"
              : "Hidden from Studio Feed (Click to show)"
          }
          className={`
            flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer select-none border
            ${
              feedVis
                ? "bg-white/10 text-white border-white/40 hover:bg-white/20 font-medium shadow-sm"
                : "bg-white/[0.02] text-neutral-500 border-white/5 opacity-40 hover:opacity-80 hover:text-neutral-300"
            }
          `}
        >
          {feedVis ? (
            <Eye className="h-3 w-3 text-white" />
          ) : (
            <EyeOff className="h-3 w-3 text-neutral-500" />
          )}
          <span>Feed</span>
        </button>

        {/* ID Card Visibility Toggle */}
        <button
          type="button"
          onClick={() => toggleVisibility(channel, "card")}
          title={
            cardVis
              ? "Visible on Virtual ID Card (Click to hide)"
              : "Hidden from Virtual ID Card (Click to show)"
          }
          className={`
            flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono transition-all cursor-pointer select-none border
            ${
              cardVis
                ? "bg-white/10 text-white border-white/40 hover:bg-white/20 font-medium shadow-sm"
                : "bg-white/[0.02] text-neutral-500 border-white/5 opacity-40 hover:opacity-80 hover:text-neutral-300"
            }
          `}
        >
          {cardVis ? (
            <Eye className="h-3 w-3 text-white" />
          ) : (
            <EyeOff className="h-3 w-3 text-neutral-500" />
          )}
          <span>Card</span>
        </button>
      </div>
    );
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        {/* COMPACT AESTHETIC MODAL CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 8 }}
          transition={{ duration: 0.18, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{ width: "100%", maxWidth: "480px", backgroundColor: "#141414" }}
          className="rounded-3xl border border-white/10 p-6 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative mx-4 max-h-[90vh] overflow-y-auto"
        >
          {/* HEADER WITH MEMBER INFO */}
          <div className="mb-5 flex items-start justify-between">
            <div>
              <span className="text-xs text-neutral-400 font-medium block mb-0.5">
                Contact & ID Card Details
              </span>
              <p className="text-base font-semibold text-white truncate max-w-[320px]">
                {person.name || "Team Member"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.05] text-neutral-400 hover:text-white hover:bg-white/15 transition-all cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* SECTION INFO BAR */}
          <div className="mb-4 flex items-center justify-between text-[10px] text-neutral-500 font-mono pb-2 border-b border-white/5">
            <span>CHANNELS</span>
            <span>VISIBILITY (FEED & CARD)</span>
          </div>

          {/* INTEGRATED INPUT FIELDS */}
          <div className="space-y-4">
            {/* Phone / WhatsApp */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-neutral-300 font-medium block">
                  Phone / WhatsApp
                </label>
                {renderVisibilityToggles("phone")}
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-emerald-400 bg-emerald-500/10 border-r border-white/10 flex items-center justify-center">
                  <Phone className="h-4 w-4" />
                </div>
                <input
                  value={person.phone || ""}
                  onChange={handleField("phone")}
                  placeholder="+62 812-3456-7890"
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none font-mono"
                />
              </div>
            </div>

            {/* Work Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-neutral-300 font-medium block">
                    Work Email
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">Official</span>
                </div>
                {renderVisibilityToggles("email")}
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-amber-400 bg-amber-500/10 border-r border-white/10 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  value={person.email || ""}
                  onChange={handleField("email")}
                  placeholder="name@adidayastudio.id"
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* Personal Email */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-neutral-300 font-medium block">
                    Personal Email
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">Personal</span>
                </div>
                {renderVisibilityToggles("personal_email")}
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-orange-400 bg-orange-500/10 border-r border-white/10 flex items-center justify-center">
                  <Mail className="h-4 w-4" />
                </div>
                <input
                  value={person.personal_email || ""}
                  onChange={handleField("personal_email")}
                  placeholder="name@gmail.com"
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* LinkedIn */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-neutral-300 font-medium block">
                  LinkedIn
                </label>
                {renderVisibilityToggles("linkedin")}
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-sky-400 bg-sky-500/10 border-r border-white/10 flex items-center justify-center">
                  <Linkedin className="h-4 w-4" />
                </div>
                <input
                  value={person.linkedin || ""}
                  onChange={handleField("linkedin")}
                  placeholder="username or profile link"
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* Instagram */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-neutral-300 font-medium block">
                  Instagram
                </label>
                {renderVisibilityToggles("instagram")}
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-pink-400 bg-pink-500/10 border-r border-white/10 flex items-center justify-center">
                  <Instagram className="h-4 w-4" />
                </div>
                <input
                  value={person.instagram || ""}
                  onChange={handleField("instagram")}
                  placeholder="@username or profile link"
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none"
                />
              </div>
            </div>

            {/* ID Number / NIP */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <label className="text-xs text-neutral-300 font-medium block">
                    ID Number / NIP
                  </label>
                  <span className="text-[10px] font-mono text-neutral-500">Official</span>
                </div>
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-neutral-400 bg-white/5 border-r border-white/10 flex items-center justify-center font-mono text-xs font-semibold">
                  #
                </div>
                <input
                  value={person.nip || ""}
                  onChange={handleField("nip")}
                  placeholder="e.g. 71122003"
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full px-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none font-mono"
                />
              </div>
            </div>

            {/* Custom Slug (ID Card URL) */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-neutral-300 font-medium block">
                  Virtual ID Card Link
                </label>
                <span className="text-[10px] font-mono text-neutral-500">
                  {person.slug ? "Custom Slug" : "Auto Generated"}
                </span>
              </div>
              <div
                style={{ backgroundColor: "#181818" }}
                className="flex items-center rounded-xl border border-white/10 focus-within:border-adidaya-red focus-within:ring-1 focus-within:ring-adidaya-red transition-all overflow-hidden h-11"
              >
                <div className="h-full px-3.5 text-adidaya-red bg-red-500/10 border-r border-white/10 flex items-center justify-center">
                  <Link2 className="h-4 w-4" />
                </div>
                <span className="pl-3 text-[11px] font-mono text-neutral-500 select-none">
                  /id/
                </span>
                <input
                  value={person.slug || ""}
                  onChange={handleField("slug")}
                  placeholder={autoSlug || "slug"}
                  style={{ backgroundColor: "transparent", color: "#ffffff" }}
                  className="w-full pl-1 pr-3.5 py-2.5 text-xs text-white placeholder:text-neutral-600 outline-none font-mono"
                />
              </div>

              {/* LIVE URL PREVIEW WITH GENEROUS SPACING */}
              <div className="mt-3.5 flex items-center gap-2 text-[11px] font-mono px-1">
                <span className="text-neutral-500 select-none">Live URL:</span>
                <span className="text-neutral-200 font-medium truncate">
                  www.adidayastudio.id/id/{person.slug ? slugify(person.slug) : autoSlug}
                </span>
              </div>
            </div>
          </div>

          {/* FOOTER BUTTONS */}
          <div className="mt-8 flex items-center justify-between text-xs">
            <button
              onClick={clearAll}
              className="text-xs text-neutral-500 hover:text-adidaya-red transition-colors flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-red-500/10 cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear all</span>
            </button>

            <button
              onClick={async () => {
                if (onSave) {
                  await onSave(person.id);
                }
                onClose();
              }}
              className="rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_15px_rgba(229,57,53,0.4)] transition-all shadow-sm cursor-pointer"
            >
              Save
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    root
  );
}
