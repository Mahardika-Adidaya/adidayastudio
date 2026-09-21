"use client";

import { useEffect, useState, useRef, use } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toJpeg, toPng } from "html-to-image";
import QRCode from "qrcode";
import { toast } from "react-hot-toast";
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
  UserCheck,
  Image as ImageIcon,
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
  nip?: string | null;
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
  const [downloadingCard, setDownloadingCard] = useState(false);
  const [exportingCard1, setExportingCard1] = useState(false);
  const [showSaveMenu, setShowSaveMenu] = useState(false);
  const [cardPhotoBase64, setCardPhotoBase64] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const card1Ref = useRef<HTMLDivElement>(null);
  const card2Ref = useRef<HTMLDivElement>(null);

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

  // Generate QR Code as Base64 Data URL (100% offline, zero CORS issues)
  useEffect(() => {
    if (!currentUrl) return;
    QRCode.toDataURL(currentUrl, {
      margin: 1,
      width: 300,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error("QR Code generation error:", err));
  }, [currentUrl]);

  // Convert profile image to Base64 via local server proxy to bypass CORS when exporting to canvas
  useEffect(() => {
    if (!person?.image_url || person.image_url.includes("logo-adidaya-red")) {
      setCardPhotoBase64(null);
      return;
    }

    let isMounted = true;
    const fetchImageAsBase64 = async () => {
      try {
        const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(person.image_url!)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) throw new Error(`Proxy status: ${response.status}`);
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted && typeof reader.result === "string") {
            setCardPhotoBase64(reader.result);
          }
        };
        reader.readAsDataURL(blob);
      } catch (e) {
        console.warn("Could not convert image via proxy:", e);
      }
    };

    fetchImageAsBase64();
    return () => {
      isMounted = false;
    };
  }, [person?.image_url]);

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

  // Helper to robustly capture card to data URL (JPEG with PNG fallback)
  const renderCardToDataUrl = async (element: HTMLElement, bgColor: string) => {
    try {
      return await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 3,
        backgroundColor: bgColor,
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (
              node.dataset.noExport === "true" ||
              node.classList.contains("no-export")
            ) {
              return false;
            }
          }
          return true;
        },
      });
    } catch (err) {
      console.warn("toJpeg failed, attempting toPng fallback:", err);
      return await toPng(element, {
        pixelRatio: 3,
        backgroundColor: bgColor,
        skipFonts: true,
        filter: (node) => {
          if (node instanceof HTMLElement) {
            if (
              node.dataset.noExport === "true" ||
              node.classList.contains("no-export")
            ) {
              return false;
            }
          }
          return true;
        },
      });
    }
  };

  // Download Card 2 as High-Res JPG
  const handleDownloadCardJpg = async () => {
    if (!card2Ref.current || downloadingCard) return;
    setDownloadingCard(true);
    const toastId = toast.loading("Downloading ID Card JPG...");

    try {
      // Ensure photo base64 is converted before exporting
      if (
        person?.image_url &&
        !person.image_url.includes("logo-adidaya-red") &&
        !cardPhotoBase64
      ) {
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(person.image_url)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            const b64: string = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            setCardPhotoBase64(b64);
            await new Promise((resolve) => setTimeout(resolve, 150));
          }
        } catch (err) {
          console.warn("Could not pre-fetch photo base64:", err);
        }
      }

      // Pause to ensure DOM paint
      await new Promise((resolve) => setTimeout(resolve, 100));

      const dataUrl = await renderCardToDataUrl(card2Ref.current, "#080808");

      const fileName = `${slugify(person?.name || "id-card")}-adidaya.jpg`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("ID Card downloaded successfully!", { id: toastId });
    } catch (err: any) {
      console.error("Failed to export ID Card to JPG:", err);
      toast.error("Failed to generate image: " + (err?.message || "Unknown error"), {
        id: toastId,
      });
    } finally {
      setDownloadingCard(false);
    }
  };

  // Download Card 1 (Contact Card) as High-Res JPG with embedded QR
  const handleDownloadCard1Jpg = async () => {
    if (!card1Ref.current || downloadingCard) return;
    setDownloadingCard(true);
    setShowSaveMenu(false);
    const toastId = toast.loading("Downloading Contact Card JPG...");

    try {
      // 1. Activate export mode so Card 1 displays embedded QR footer
      setExportingCard1(true);

      // 2. Ensure photo base64 is converted before exporting
      if (
        person?.image_url &&
        !person.image_url.includes("logo-adidaya-red") &&
        !cardPhotoBase64
      ) {
        try {
          const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(person.image_url)}`;
          const response = await fetch(proxyUrl);
          if (response.ok) {
            const blob = await response.blob();
            const b64: string = await new Promise((resolve) => {
              const reader = new FileReader();
              reader.onloadend = () => resolve(reader.result as string);
              reader.readAsDataURL(blob);
            });
            setCardPhotoBase64(b64);
          }
        } catch (err) {
          console.warn("Could not pre-fetch photo base64:", err);
        }
      }

      // 3. Small pause for React re-render of QR footer and dismissing menu
      await new Promise((resolve) => setTimeout(resolve, 200));

      const dataUrl = await renderCardToDataUrl(card1Ref.current, "#111111");

      const fileName = `${slugify(person?.name || "contact")}-card.jpg`;
      const link = document.createElement("a");
      link.download = fileName;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success("Contact Card downloaded!", { id: toastId });
    } catch (err: any) {
      console.error("Failed to export Card 1 to JPG:", err);
      toast.error("Failed to generate image: " + (err?.message || "Unknown error"), {
        id: toastId,
      });
    } finally {
      setExportingCard1(false);
      setDownloadingCard(false);
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
        <div className="relative shrink-0">
          <motion.div
            ref={card1Ref}
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
                    src={cardPhotoBase64 || person.image_url}
                    alt={person.name}
                    crossOrigin="anonymous"
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
                <div className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-xs text-neutral-400 font-normal shrink-0">
                    Phone / WA
                  </span>
                  <a
                    href={getWhatsAppLink(person.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center justify-end gap-1.5 min-w-0"
                  >
                    <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors text-right">
                      {person.phone}
                    </span>
                    <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                  </a>
                </div>
              )}

              {/* Work Email */}
              {showWorkEmail && person.email && (
                <div className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-xs text-neutral-400 font-normal shrink-0">
                    Work Email
                  </span>
                  <a
                    href={`mailto:${person.email}`}
                    className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center justify-end gap-1.5 min-w-0"
                  >
                    <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors text-right break-all">
                      {person.email}
                    </span>
                    <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                  </a>
                </div>
              )}

              {/* Personal Email */}
              {showPersonalEmail && person.personal_email && (
                <div className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-xs text-neutral-400 font-normal shrink-0">
                    Personal Email
                  </span>
                  <a
                    href={`mailto:${person.personal_email}`}
                    className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center justify-end gap-1.5 min-w-0"
                  >
                    <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors text-right break-all">
                      {person.personal_email}
                    </span>
                    <ExternalLink className="h-3 w-3 text-neutral-600 group-hover:text-adidaya-red group-active:text-red-400 transition-colors shrink-0" />
                  </a>
                </div>
              )}

              {/* LinkedIn */}
              {showLinkedIn && person.linkedin && (
                <div className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-xs text-neutral-400 font-normal shrink-0">
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
                    className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center justify-end gap-1.5 min-w-0"
                  >
                    <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors text-right">
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
                <div className="flex items-center justify-between text-xs py-0.5 gap-2">
                  <span className="text-xs text-neutral-400 font-normal shrink-0">
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
                    className="group text-xs text-neutral-200 hover:text-adidaya-red active:text-red-400 transition-colors flex items-center justify-end gap-1.5 min-w-0"
                  >
                    <span className="group-hover:text-adidaya-red group-active:text-red-400 transition-colors text-right">
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

            {/* BOTTOM SECTION: EITHER INTERACTIVE BUTTONS OR EXPORTED QR FOOTER */}
            {exportingCard1 ? (
              <div className="flex items-center justify-between pt-3 border-t border-white/10 w-full mt-auto shrink-0">
                <div className="flex flex-col text-left">
                  <span className="text-[11px] font-semibold text-white tracking-tight">
                    Scan for Digital Profile
                  </span>
                  <span className="text-[9px] font-mono text-neutral-400 mt-0.5">
                    adidayastudio.id/id/{activeSlug}
                  </span>
                </div>
                <div className="bg-white p-1 rounded-xl shadow-md shrink-0 border border-white">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR Code"
                      style={{ width: "46px", height: "46px" }}
                      className="block object-contain"
                    />
                  ) : (
                    <div className="w-[46px] h-[46px] bg-neutral-200 rounded" />
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-row items-center gap-2.5 w-full mt-auto pt-4 shrink-0">
                <button
                  onClick={() => setShowQrModal(true)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full bg-white/[0.08] hover:bg-white/20 active:scale-95 border border-white/15 hover:border-white/40 text-neutral-200 hover:text-white text-[11px] font-medium transition-all cursor-pointer shadow-sm min-w-0 group"
                  title="Generate QR Code"
                >
                  <QrCode className="h-3.5 w-3.5 text-adidaya-red group-hover:scale-110 transition-transform shrink-0" />
                  <span className="truncate">QR Code</span>
                </button>

                {/* SAVE BUTTON */}
                <button
                  onClick={() => setShowSaveMenu((prev) => !prev)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-full bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.45)] active:scale-95 text-[11px] font-semibold transition-all cursor-pointer shadow-md min-w-0"
                  title="Save Options"
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
            )}
          </motion.div>

          {/* FLOATING SAVE OPTIONS MENU (OUTSIDE CARD1 TO AVOID MUTATION DURING EXPORT) */}
          <AnimatePresence>
            {showSaveMenu && (
              <>
                {/* Invisible backdrop to dismiss menu on outside click */}
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setShowSaveMenu(false)}
                />

                <div
                  className="absolute bottom-[72px] inset-x-0 flex justify-center pointer-events-none z-30 px-3"
                >
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="pointer-events-auto w-full max-w-[280px] bg-[#141414]/95 backdrop-blur-xl border border-white/15 rounded-2xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.9)] flex flex-col gap-1"
                  >
                    <button
                      onClick={() => {
                        setShowSaveMenu(false);
                        handleDownloadVCard();
                      }}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:border-adidaya-red/40 group-hover:bg-adidaya-red/10 transition-colors shrink-0">
                        <UserCheck className="h-4 w-4 text-adidaya-red" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                          Save as Contact
                        </span>
                        <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                          vCard (.vcf) Phonebook
                        </span>
                      </div>
                    </button>

                    <div className="h-px bg-white/10 my-0.5" />

                    <button
                      onClick={() => {
                        setShowSaveMenu(false);
                        handleDownloadCard1Jpg();
                      }}
                      className="flex items-center gap-3 w-full p-2.5 rounded-xl text-left text-neutral-200 hover:text-white hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <div className="h-8 w-8 rounded-lg bg-white/[0.06] border border-white/10 flex items-center justify-center text-neutral-300 group-hover:text-white group-hover:border-adidaya-red/40 group-hover:bg-adidaya-red/10 transition-colors shrink-0">
                        <ImageIcon className="h-4 w-4 text-adidaya-red" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold tracking-tight text-white leading-tight">
                          Save as Image
                        </span>
                        <span className="text-[10px] text-neutral-400 leading-tight mt-0.5">
                          Card JPG with QR Code
                        </span>
                      </div>
                    </button>
                  </motion.div>
                </div>
              </>
            )}
          </AnimatePresence>
        </div>

        {/* =========================================================================
            CARD 2 (RIGHT): VIRTUAL PHYSICAL ID CARD (EXACT ARTBOARD TEMPLATE)
        ========================================================================= */}
        <motion.div
          ref={card2Ref}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05, ease: "easeOut" }}
          style={{
            background: "#080808",
            width: "350px",
            height: "540px",
            minWidth: "350px",
            minHeight: "540px",
            maxWidth: "350px",
            maxHeight: "540px",
            borderColor: "rgba(255, 255, 255, 0.12)",
          }}
          className="rounded-[28px] border shadow-[0_25px_70px_rgba(0,0,0,0.95)] relative overflow-hidden select-none shrink-0 flex flex-col justify-between p-7"
        >
          {/* 1. TOP CENTER LOGO WORDMARK */}
          <div className="flex items-center justify-center gap-1.5 z-10 shrink-0">
            <span className="text-sm font-bold tracking-tight text-white">adidaya</span>
            <img
              src="/logo-adidaya-red.svg"
              alt="*"
              style={{ width: "13px", height: "13px" }}
              className="object-contain block shrink-0"
            />
            <span className="text-sm font-bold tracking-tight text-white">studio</span>
          </div>

          {/* 2. LARGE RED ADIDAYA ASTERISK MOTIF (SHIFTED SLIGHTLY RIGHT & BLEEDING) */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            <img
              src="/logo-adidaya-red.svg"
              alt="Adidaya Motif"
              style={{
                position: "absolute",
                width: "530px",
                height: "590px",
                right: "-95px",
                bottom: "-35px",
              }}
              className="object-contain block shrink-0 select-none opacity-100"
            />
          </div>

          {/* 3. OPTIONAL PERSON CUTOUT/PORTRAIT PHOTO (PROMINENT & ALIGNED TO RIGHT SIDE) */}
          {(cardPhotoBase64 || person.image_url) && !person.image_url?.includes("logo-adidaya-red") && (
            <div className="absolute inset-0 pointer-events-none z-[5] flex items-end justify-end overflow-hidden">
              <img
                src={cardPhotoBase64 || person.image_url!}
                alt={person.name}
                crossOrigin="anonymous"
                style={{
                  height: "460px",
                  maxWidth: "none",
                }}
                className="object-contain object-bottom block shrink-0 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] translate-x-[22%]"
              />
            </div>
          )}

          {/* 3.5. SUBTLE BOTTOM-LEFT GRADIENT FOR TEXT & QR READABILITY */}
          <div className="absolute inset-0 pointer-events-none z-[7] bg-gradient-to-tr from-black/80 via-black/25 to-transparent" />

          {/* 4. BOTTOM-LEFT OVERLAY (NAME, POSITION, NIP, QR CODE) */}
          <div className="z-10 mt-auto text-left relative flex flex-col items-start max-w-[60%]">
            <h2 className="text-base font-bold text-white tracking-tight leading-snug drop-shadow-md">
              {person.name}
            </h2>

            <p className="text-xs text-neutral-200 font-normal mt-0.5 drop-shadow-sm">
              {person.position || "Architect"}
            </p>

            {person.nip && person.nip.trim() && (
              <span className="text-xs text-neutral-200 font-normal mt-0.5 tracking-wide drop-shadow-sm">
                {person.nip}
              </span>
            )}

            {/* SQUARE WHITE QR CODE */}
            <div
              onClick={() => setShowQrModal(true)}
              style={{
                width: "60px",
                height: "60px",
                minWidth: "60px",
                minHeight: "60px",
              }}
              className="bg-white p-1 rounded-xl shadow-2xl mt-3 cursor-pointer hover:scale-105 transition-transform flex items-center justify-center shrink-0 border border-white"
              title="Click to enlarge QR Code"
            >
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  style={{ width: "52px", height: "52px" }}
                  className="block shrink-0 object-contain"
                />
              ) : (
                <div className="w-[52px] h-[52px] bg-neutral-200 animate-pulse rounded" />
              )}
            </div>
          </div>

          {/* 5. DOWNLOAD CARD AS JPG BUTTON (BOTTOM RIGHT) */}
          <button
            onClick={handleDownloadCardJpg}
            disabled={downloadingCard}
            data-no-export="true"
            className="absolute bottom-6 right-6 z-20 flex items-center justify-center p-2.5 rounded-full bg-white/[0.08] hover:bg-white text-neutral-300 hover:text-black border border-white/15 hover:border-white transition-all shadow-xl cursor-pointer group active:scale-95 disabled:opacity-50"
            title="Download Card as JPG"
          >
            {downloadingCard ? (
              <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              <Download className="h-4 w-4 group-hover:scale-110 transition-transform" />
            )}
          </button>
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
                {qrDataUrl ? (
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    style={{ width: "170px", height: "170px" }}
                    className="block shrink-0 object-contain rounded-lg"
                  />
                ) : (
                  <div className="w-[170px] h-[170px] bg-neutral-100 animate-pulse rounded-lg" />
                )}
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
