"use client";

import { useEffect, useState, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  findPersonBySlug,
  getPersonSlug,
  slugify,
  isChannelVisible,
} from "@/lib/slugHelper";
import {
  Phone,
  Mail,
  Linkedin,
  Instagram,
  Download,
  Share2,
  QrCode,
  ArrowLeft,
  Check,
  ExternalLink,
  Copy,
  X,
  Sparkles,
  ShieldCheck,
  CreditCard,
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

type Profile = {
  id: string;
  name: string;
  position: string;
  role: string;
  email: string | null;
  personal_email?: string | null;
  phone?: string | null;
  linkedin: string | null;
  instagram: string | null;
  image_url: string | null;
  slug?: string | null;
  contact_visibility?: Record<string, { feed?: boolean; card?: boolean }> | null;
  order_index?: number;
  is_published?: boolean;
};

type Project = {
  id: string;
  title: string;
  slug: string;
  category?: string;
  image_url?: string;
  cover_image?: string;
};

export default function VirtualIdCardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
  const slugParam = resolvedParams.slug;

  const [loading, setLoading] = useState(true);
  const [person, setPerson] = useState<Profile | null>(null);
  const [allPeople, setAllPeople] = useState<Profile[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showQrModal, setShowQrModal] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("*")
          .order("order_index", { ascending: true });

        const profiles = (profilesData || []) as Profile[];
        setAllPeople(profiles);

        const matched = findPersonBySlug(slugParam, profiles);
        setPerson(matched);

        // Fetch some studio projects
        const { data: projData } = await supabase
          .from("projects")
          .select("id, title, slug, category, image_url, cover_image")
          .eq("is_published", true)
          .limit(4);

        if (projData) {
          setProjects(projData as Project[]);
        }
      } catch (err) {
        console.error("Error loading ID card data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [slugParam]);

  const activeSlug = person ? getPersonSlug(person, allPeople) : slugParam;
  const currentUrl = `https://www.adidayastudio.id/id/${activeSlug}`;

  // Check channel visibility for Card
  const showPhone =
    !!person?.phone?.trim() &&
    isChannelVisible(person?.contact_visibility, "phone", "card");

  const showWorkEmail =
    !!person?.email?.trim() &&
    isChannelVisible(person?.contact_visibility, "email", "card");

  const showPersonalEmail =
    !!person?.personal_email?.trim() &&
    isChannelVisible(person?.contact_visibility, "personal_email", "card");

  const showLinkedIn =
    !!person?.linkedin?.trim() &&
    isChannelVisible(person?.contact_visibility, "linkedin", "card");

  const showInstagram =
    !!person?.instagram?.trim() &&
    isChannelVisible(person?.contact_visibility, "instagram", "card");

  const hasAnyVisibleContact =
    showPhone || showWorkEmail || showPersonalEmail || showLinkedIn || showInstagram;

  // Generate vCard file (.vcf)
  const handleDownloadVCard = () => {
    if (!person) return;

    const nameParts = (person.name || "Member").trim().split(" ");
    const firstName = nameParts[0] || "";
    const lastName = nameParts.slice(1).join(" ") || "";
    const cleanPhone = (person.phone || "").replace(/[^0-9+]/g, "");

    const vCardLines = [
      "BEGIN:VCARD",
      "VERSION:3.0",
      `N:${lastName};${firstName};;;`,
      `FN:${person.name}`,
      "ORG:Adidaya Studio",
      `TITLE:${person.position || "Team Member"}`,
      showWorkEmail ? `EMAIL;type=INTERNET;type=WORK:${person.email}` : "",
      showPersonalEmail ? `EMAIL;type=INTERNET;type=HOME:${person.personal_email}` : "",
      showPhone && cleanPhone ? `TEL;type=CELL;type=VOICE:${cleanPhone}` : "",
      `URL;type=WORK:${currentUrl}`,
      showLinkedIn && person.linkedin
        ? `X-SOCIALPROFILE;type=linkedin:${
            person.linkedin.startsWith("http")
              ? person.linkedin
              : `https://linkedin.com/in/${person.linkedin}`
          }`
        : "",
      showInstagram && person.instagram
        ? `X-SOCIALPROFILE;type=instagram:${
            person.instagram.startsWith("http")
              ? person.instagram
              : `https://instagram.com/${person.instagram.replace("@", "")}`
          }`
        : "",
      "NOTE:Adidaya Studio — Architecture, Construction, and Development",
      "END:VCARD",
    ]
      .filter(Boolean)
      .join("\r\n");

    const blob = new Blob([vCardLines], { type: "text/vcard;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `${slugify(person.name || "contact")}-adidaya.vcf`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // WhatsApp Link Helper
  const getWhatsAppLink = (phone: string) => {
    let clean = phone.replace(/[^0-9]/g, "");
    if (clean.startsWith("0")) {
      clean = "62" + clean.substring(1);
    }
    return `https://wa.me/${clean}?text=${encodeURIComponent(
      `Hello ${person?.name || ""}, I reached you via your Adidaya Studio Virtual ID Card.`
    )}`;
  };

  const memberPassId = person?.order_index
    ? `ADS-${String(person.order_index).padStart(3, "0")}`
    : "ADS-007";

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060606] text-white flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 border-2 border-adidaya-red border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono tracking-widest text-neutral-400 uppercase">
            Loading Virtual ID...
          </span>
        </div>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="min-h-screen bg-[#060606] text-white flex items-center justify-center p-6">
        <div className="max-w-md w-full rounded-3xl bg-[#0e0e0e] border border-white/10 p-8 text-center shadow-2xl">
          <div className="mx-auto h-16 w-16 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mb-5">
            <img
              src="/logo-adidaya-red.svg"
              alt="Adidaya"
              className="h-8 w-8 opacity-60"
            />
          </div>
          <h2 className="text-xl font-bold mb-2">Member Not Found</h2>
          <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
            The virtual card link{" "}
            <code className="text-adidaya-red font-mono">/id/{slugParam}</code>{" "}
            does not match any registered team member at Adidaya Studio.
          </p>
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-xs font-semibold text-black hover:bg-adidaya-red hover:text-white transition-all shadow-md"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Explore Studio Members</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex-1 flex flex-col items-center px-4 pt-4 pb-12 relative selection:bg-adidaya-red selection:text-white">

      {/* 2-CARD MAIN CONTAINER (EXACT FIXED 5.5 x 8.5 CM PORTRAIT RATIO • NEVER SQUISHED) */}
      <div className="w-full flex flex-col md:flex-row items-center justify-center gap-6 lg:gap-8">
        {/* =========================================================================
            CARD 1 (LEFT): DATA DIRI & CONTACT CENTER (REFINED • 1-ROW BUTTONS)
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          style={{
            background:
              "linear-gradient(180deg, rgba(22, 22, 22, 0.98) 0%, rgba(12, 12, 12, 0.98) 100%)",
            width: "350px",
            height: "540px",
            minWidth: "350px",
            minHeight: "540px",
            maxWidth: "350px",
            maxHeight: "540px",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
          className="rounded-[28px] border p-6 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex flex-col justify-between relative overflow-hidden shrink-0"
        >
          {/* CARD TOP LINE HEADER */}
          <div
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
            className="flex items-center justify-between pb-4 mb-1 shrink-0"
          >
            <div className="flex items-center gap-2">
              <img
                src="/logo-adidaya-red.svg"
                alt="Adidaya"
                style={{ width: "16px", height: "16px" }}
                className="object-contain block shrink-0"
              />
              <span className="font-semibold text-xs tracking-wide text-neutral-200">
                Adidaya Studio
              </span>
            </div>
            <span className="text-[10px] font-mono text-neutral-400">
              /id/{activeSlug}
            </span>
          </div>

          {/* AVATAR & BASIC DETAILS */}
          <div
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
            className="flex items-center gap-4 py-4 shrink-0"
          >
            <div
              style={{
                width: "56px",
                height: "56px",
                minWidth: "56px",
                minHeight: "56px",
                maxWidth: "56px",
                maxHeight: "56px",
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
              className="rounded-2xl overflow-hidden bg-[#161616] border shadow-lg relative flex items-center justify-center p-0.5 shrink-0"
            >
              {person.image_url && !person.image_url.includes("logo-adidaya-red") ? (
                <img
                  src={person.image_url}
                  alt={person.name}
                  className="h-full w-full object-cover rounded-[14px] block"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center rounded-[14px] bg-[#1a1a1a] p-2">
                  <img
                    src="/logo-adidaya-red.svg"
                    alt="Adidaya Logo"
                    style={{ width: "28px", height: "28px" }}
                    className="object-contain opacity-70 block shrink-0"
                  />
                </div>
              )}
            </div>

            <div className="flex flex-col text-left justify-center min-w-0">
              <h1 className="text-sm font-semibold text-white tracking-tight leading-snug truncate">
                {person.name}
              </h1>

              <p className="text-xs text-adidaya-red font-medium mt-1 truncate">
                {person.position || "Architect"}
              </p>
            </div>
          </div>

          {/* CONTACT LIST (2-COLUMN FORMAT: CLEAN, SANS-SERIF, SPACIOUS) */}
          <div className="flex-1 py-4 space-y-3.5 overflow-y-auto max-h-[220px] pr-0.5 scrollbar-none flex flex-col justify-center">
            {/* Phone */}
            {showPhone && person.phone && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-xs text-neutral-400 font-normal">
                  Phone / WA
                </span>
                <a
                  href={getWhatsAppLink(person.phone)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors">
                    {person.phone}
                  </span>
                  <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                </a>
              </div>
            )}

            {/* Work Email */}
            {showWorkEmail && person.email && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-xs text-neutral-400 font-normal">
                  Work Email
                </span>
                <a
                  href={`mailto:${person.email}`}
                  className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 truncate max-w-[175px] transition-colors flex items-center gap-1.5"
                >
                  <span className="truncate group-hover:text-adidaya-red group-active:text-red-400 transition-colors">
                    {person.email}
                  </span>
                  <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                </a>
              </div>
            )}

            {/* Personal Email */}
            {showPersonalEmail && person.personal_email && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-xs text-neutral-400 font-normal">
                  Personal Email
                </span>
                <a
                  href={`mailto:${person.personal_email}`}
                  className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 truncate max-w-[175px] transition-colors flex items-center gap-1.5"
                >
                  <span className="truncate group-hover:text-adidaya-red group-active:text-red-400 transition-colors">
                    {person.personal_email}
                  </span>
                  <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                </a>
              </div>
            )}

            {/* LinkedIn */}
            {showLinkedIn && person.linkedin && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-xs text-neutral-400 font-normal">
                  LinkedIn
                </span>
                <a
                  href={
                    person.linkedin.startsWith("http")
                      ? person.linkedin
                      : `https://linkedin.com/in/${person.linkedin}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors">
                    {person.linkedin.replace(
                      /https?:\/\/(www\.)?linkedin\.com\/in\/?/,
                      ""
                    )}
                  </span>
                  <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                </a>
              </div>
            )}

            {/* Instagram */}
            {showInstagram && person.instagram && (
              <div className="flex items-center justify-between text-xs py-0.5">
                <span className="text-xs text-neutral-400 font-normal">
                  Instagram
                </span>
                <a
                  href={
                    person.instagram.startsWith("http")
                      ? person.instagram
                      : `https://instagram.com/${person.instagram.replace("@", "")}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center gap-1.5"
                >
                  <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors">
                    {person.instagram.startsWith("@")
                      ? person.instagram
                      : `@${person.instagram
                          .replace(/https?:\/\/(www\.)?instagram\.com\/?/, "")
                          .replace(/\/$/, "")}`}
                  </span>
                  <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* BOTTOM ACTIONS (1 COMPACT HORIZONTAL ROW • FULL PILL • HIGH CONTRAST) */}
          <div className="flex flex-row items-center gap-2.5 w-full mt-auto pt-4 shrink-0">
            <button
              onClick={() => setShowQrModal(true)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full bg-white/[0.08] hover:bg-white/20 active:scale-95 border border-white/15 hover:border-white/40 text-neutral-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer shadow-sm min-w-0 group"
              title="Generate QR Code"
            >
              <QrCode className="h-3.5 w-3.5 text-adidaya-red group-hover:scale-110 transition-transform shrink-0" />
              <span className="truncate">QR Code</span>
            </button>

            <button
              onClick={handleDownloadVCard}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.45)] active:scale-95 text-[11px] font-semibold transition-all cursor-pointer shadow-md min-w-0"
              title="Save Contact"
            >
              <Download className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">Save</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full bg-white/[0.08] hover:bg-white/20 active:scale-95 border border-white/15 hover:border-white/40 text-neutral-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer shadow-sm min-w-0 group"
              title="Share Link"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span className="text-emerald-400 truncate">Copied</span>
                </>
              ) : (
                <>
                  <Share2 className="h-3.5 w-3.5 text-neutral-400 group-hover:text-white transition-colors shrink-0" />
                  <span className="truncate">Share</span>
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* =========================================================================
            CARD 2 (RIGHT): VIRTUAL PHYSICAL ID CARD (FIXED EXACT 5.5 x 8.5 CM)
        ========================================================================= */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          style={{
            background:
              "linear-gradient(145deg, #161616 0%, #0c0c0c 45%, #121212 100%)",
            width: "350px",
            height: "540px",
            minWidth: "350px",
            minHeight: "540px",
            maxWidth: "350px",
            maxHeight: "540px",
            borderColor: "rgba(255, 255, 255, 0.12)",
          }}
          className="rounded-[28px] border p-6 shadow-[0_25px_70px_rgba(0,0,0,0.95)] flex flex-col justify-between relative overflow-hidden group select-none shrink-0"
        >
          {/* ARCHITECTURAL GEOMETRIC WATERMARK ACCENTS */}
          <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-br from-adidaya-red/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/[0.02] rounded-full blur-2xl pointer-events-none" />

          {/* LANYARD / BADGE CLIP SLOT AT TOP */}
          <div className="flex justify-center mb-3 shrink-0">
            <div
              style={{ borderColor: "rgba(255, 255, 255, 0.15)" }}
              className="h-1.5 w-14 rounded-full bg-black/90 border shadow-inner"
            />
          </div>

          {/* PHYSICAL BADGE HEADER */}
          <div
            style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)" }}
            className="flex items-start justify-between pb-3.5 mb-3 shrink-0"
          >
            <div className="flex items-center gap-2.5">
              <div
                style={{
                  width: "32px",
                  height: "32px",
                  minWidth: "32px",
                  minHeight: "32px",
                  borderColor: "rgba(255, 255, 255, 0.15)",
                }}
                className="rounded-xl bg-black border flex items-center justify-center p-1.5 shadow-md shrink-0"
              >
                <img
                  src="/logo-adidaya-red.svg"
                  alt="Adidaya Mark"
                  style={{ width: "18px", height: "18px" }}
                  className="object-contain block shrink-0"
                />
              </div>
              <div>
                <h3 className="text-xs font-bold tracking-[0.18em] text-white uppercase leading-none font-mono">
                  ADIDAYA STUDIO
                </h3>
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest block mt-1">
                  STUDIO PASS • {memberPassId}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-wider">
                STATUS
              </span>
              <span className="text-[10px] font-mono font-semibold text-adidaya-red tracking-wider">
                ACTIVE MEMBER
              </span>
            </div>
          </div>

          {/* MAIN BADGE PORTRAIT FRAME */}
          <div className="flex flex-col items-center text-center my-auto">
            <div className="relative mb-2">
              {/* ARCHITECTURAL CORNER CROSSHAIRS */}
              <div className="absolute -top-1.5 -left-1.5 text-[8px] font-mono text-white/30 select-none">
                +
              </div>
              <div className="absolute -top-1.5 -right-1.5 text-[8px] font-mono text-white/30 select-none">
                +
              </div>
              <div className="absolute -bottom-1.5 -left-1.5 text-[8px] font-mono text-white/30 select-none">
                +
              </div>
              <div className="absolute -bottom-1.5 -right-1.5 text-[8px] font-mono text-white/30 select-none">
                +
              </div>

              <div
                style={{
                  width: "108px",
                  height: "108px",
                  minWidth: "108px",
                  minHeight: "108px",
                  maxWidth: "108px",
                  maxHeight: "108px",
                }}
                className="rounded-2xl overflow-hidden bg-black border border-white/20 p-1 shadow-2xl relative flex items-center justify-center shrink-0"
              >
                {person.image_url && !person.image_url.includes("logo-adidaya-red") ? (
                  <img
                    src={person.image_url}
                    alt={person.name}
                    className="h-full w-full object-cover rounded-xl block"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center rounded-xl bg-[#141414] p-3.5">
                    <img
                      src="/logo-adidaya-red.svg"
                      alt="Adidaya"
                      style={{ width: "48px", height: "48px" }}
                      className="object-contain opacity-75 block shrink-0"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* HOLOGRAPHIC SECURITY BADGE (CLEAN PILL BELOW PHOTO) */}
            <div className="mb-2 px-2.5 py-0.5 rounded-full bg-black/90 border border-white/20 text-[9px] font-mono text-neutral-300 inline-flex items-center gap-1 shadow-md">
              <ShieldCheck className="h-3 w-3 text-adidaya-red" />
              <span>OFFICIAL ID</span>
            </div>

            {/* MEMBER NAME & POSITION */}
            <h2 className="text-lg font-bold uppercase tracking-tight text-white font-mono leading-tight">
              {person.name}
            </h2>

            <p className="text-xs font-semibold text-adidaya-red tracking-wide uppercase mt-0.5">
              {person.position || "ARCHITECT"}
            </p>

            <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/[0.04] border border-white/10">
              <span className="h-1.5 w-1.5 rounded-full bg-adidaya-red" />
              <span className="text-[9px] font-mono uppercase tracking-widest text-neutral-300">
                {person.role || "STAFF"}
              </span>
            </div>
          </div>

          {/* PHYSICAL BADGE BOTTOM BAR (QR CODE + SERIAL) */}
          <div className="pt-3.5 border-t border-white/10 flex items-center justify-between shrink-0 mt-auto">
            {/* SCAN QR MINI */}
            <div className="flex items-center gap-2.5">
              <div
                onClick={() => setShowQrModal(true)}
                style={{
                  width: "48px",
                  height: "48px",
                  minWidth: "48px",
                  minHeight: "48px",
                }}
                className="bg-white p-1 rounded-xl border border-white/20 cursor-pointer hover:scale-105 transition-transform shadow-md shrink-0 flex items-center justify-center"
                title="Click to enlarge QR"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(
                    currentUrl
                  )}&color=0-0-0`}
                  alt="QR Pass"
                  style={{ width: "40px", height: "40px" }}
                  className="block shrink-0"
                />
              </div>
              <div className="text-left">
                <span className="text-[8px] font-mono text-neutral-500 uppercase block leading-tight">
                  SCAN TO VERIFY
                </span>
                <span className="text-[10px] font-mono font-medium text-white block mt-0.5">
                  www.adidayastudio.id
                </span>
                <span className="text-[8px] font-mono text-adidaya-red block">
                  /id/{activeSlug}
                </span>
              </div>
            </div>

            {/* SERIAL NUMBER */}
            <div className="text-right">
              <span className="text-[8px] font-mono text-neutral-500 uppercase block">
                ID SERIAL
              </span>
              <span className="text-xs font-mono font-bold tracking-widest text-neutral-200 block mt-0.5">
                {memberPassId}
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* QR CODE MODAL (COMPACT AESTHETIC DIALOG) */}
      <AnimatePresence>
        {showQrModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowQrModal(false)}
            className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-4"
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 8 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                maxWidth: "340px",
                backgroundColor: "#141414",
                borderColor: "rgba(255, 255, 255, 0.12)",
              }}
              className="rounded-3xl border p-6 text-center shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative shrink-0 flex flex-col items-center mx-auto"
            >
              <button
                onClick={() => setShowQrModal(false)}
                className="absolute top-4 right-4 h-7 w-7 rounded-full bg-white/[0.06] text-neutral-400 hover:text-white flex items-center justify-center transition-all cursor-pointer hover:bg-white/15"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="h-9 w-9 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-adidaya-red mb-3 shrink-0">
                <QrCode className="h-4.5 w-4.5" />
              </div>

              <h3 className="text-base font-semibold text-white tracking-tight">
                Scan ID Card
              </h3>
              <p className="text-[11px] text-neutral-400 mt-1 mb-4 leading-relaxed max-w-[240px]">
                Scan with smartphone camera to open {person.name}&apos;s profile
              </p>

              {/* QR IMAGE (FIXED COMPACT SIZE) */}
              <div
                style={{ width: "190px", height: "190px" }}
                className="bg-white p-2.5 rounded-2xl shadow-md mb-4 flex items-center justify-center shrink-0"
              >
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=170x170&data=${encodeURIComponent(
                    currentUrl
                  )}&color=0-0-0`}
                  alt="QR Code"
                  style={{ width: "170px", height: "170px" }}
                  className="block shrink-0 object-contain rounded-lg"
                />
              </div>

              {/* URL COPY BAR */}
              <div
                style={{ backgroundColor: "#181818" }}
                className="w-full flex items-center justify-between border border-white/10 rounded-full px-3 py-1.5 text-xs text-neutral-300 mb-4"
              >
                <span className="font-mono text-[10px] text-neutral-400 truncate flex-1 text-left select-all pr-2">
                  www.adidayastudio.id/id/{activeSlug}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="px-2.5 py-1 rounded-full bg-white text-black hover:bg-adidaya-red hover:text-white font-medium text-[10px] transition-all cursor-pointer flex items-center gap-1 shrink-0 shadow-sm"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <button
                onClick={() => setShowQrModal(false)}
                className="w-full rounded-full bg-white/10 hover:bg-white hover:text-black text-white py-2 text-xs font-semibold transition-all cursor-pointer"
              >
                Done
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
