"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { toJpeg, toPng } from "html-to-image";
import QRCode from "qrcode";
import { toast } from "react-hot-toast";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  Sparkles,
  Loader2,
} from "lucide-react";

export interface ShareItemData {
  type: "project" | "insight" | "career";
  title: string;
  subtitle?: string | null;
  category?: string | null;
  tags?: string[] | null;
  meta?: (string | { label?: string; value: string })[];
  imageUrl?: string | null;
  excerpt?: string | null;
  url?: string;
  author?: string | null;
  date?: string | null;
  readingTime?: string | number | null;
  location?: string | null;
  year?: string | null;
  status?: string | null;

  // Career specific structured fields:
  jobType?: string | null;
  division?: string | null;
  education?: string | null;
  experience?: string | null;
  skills?: string | null;
  deadline?: string | null;
  descriptionList?: string[] | null;
  email?: string | null;
  subject?: string | null;
  fileNote?: string | null;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: ShareItemData | null;
}

// Strip HTML tags for clean text teaser
function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function formatSkills(skills?: string | null): string {
  if (!skills) return "-";
  let s = skills.trim();
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) {
        return arr.filter(Boolean).join(", ");
      }
    } catch {
      return s.replace(/[\[\]"']/g, "").replace(/,\s*/g, ", ").trim();
    }
  }
  return s;
}

function normalizeDescriptionList(desc?: any): string[] {
  if (!desc) return [];
  if (Array.isArray(desc)) return desc.map((d) => String(d).trim()).filter(Boolean);
  if (typeof desc === "string") {
    if (desc.trim().startsWith("[") && desc.trim().endsWith("]")) {
      try {
        const arr = JSON.parse(desc);
        if (Array.isArray(arr)) return arr.map((d) => String(d).trim()).filter(Boolean);
      } catch {}
    }
    return desc.split("\n").map((line) => line.trim()).filter(Boolean);
  }
  return [];
}

function AdidayaLogoIcon({
  className = "w-4 h-4",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 964.35 1080"
      className={className}
      style={style}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fill="#e53935"
        d="M594.49,903.79h-228.27c-11.87,13.85-19.27,29.88-26.63,46.08-11.98,26.37-24.48,52.51-37.04,78.61-22.58,46.93-92.55,66.66-141.78,37.26-51.77-30.92-62.49-101.56-34.65-143.17,16.71-24.96,35.58-48.51,54.05-72.25,37.65-48.36,75.68-96.42,113.57-144.59,20.65-26.26,41.66-52.24,61.86-78.84,9.22-12.15,20.39-23.37,25.76-41.41-7.42.78-12.75.84-17.85,1.94-71.85,15.58-143.67,31.34-215.51,46.95-10.89,2.37-21.82,4.98-32.87,6.08-41.21,4.08-74.44-10.21-97.88-44.9-21.18-31.34-21.71-64.89-7.9-98.88,11.5-28.31,51.09-63.38,96.47-60.16,19.97,1.42,39.82,4.76,59.67,7.65,66.15,9.65,132.27,19.54,198.44,29.14,3.89.56,8.02-.59,14.77-1.18-6-16.1-16.08-26.52-24.76-37.56-50.95-64.85-102.22-129.45-153.28-194.21-17.93-22.74-35.35-45.89-53.44-68.5-26.39-32.97-30.18-70.02-13.69-106.91C149.95,28.25,180.6,5.83,221.41.97c51.94-6.19,90.43,17.48,111.64,66.07,45.48,104.18,91.23,208.23,137.04,312.26,3.47,7.87,8.37,15.1,12.23,21.96,12.77-.89,12.84-10.49,15.35-17.01,18.38-47.86,36.05-95.99,54.36-143.87,5.96-15.59,12.23-31.21,20.01-45.94,25.26-47.81,87.64-63.42,136.08-38.72,66.49,33.91,75.74,119,23.52,168.74-45.18,43.04-88.7,87.84-132.79,132.02-5.13,5.14-9.27,11.28-16.71,20.45,12.45-1.28,20.14-1.48,27.58-2.93,68.85-13.48,137.65-27.24,206.49-40.77,10.92-2.15,21.98-3.58,32.98-5.31,73.62-11.54,137.51,59.72,107.62,139.6-13.97,37.34-42.32,59.67-82.74,63.4-14.24,1.31-29.06.14-43.23-2.23-70.31-11.77-140.47-24.39-210.72-36.51-10.65-1.84-21.5-5.24-32.2-.68-2.31,11.33,6.02,17.05,11.23,23.59,58.33,73.23,116.98,146.19,175.58,219.2,16.04,19.98,32.84,39.4,48.06,59.99,9.2,12.44,18.2,25.81,23.57,40.15,18.31,48.88-1.16,100.05-46.49,126.29-17.4,10.07-34.7,19.33-56.07,19.27-41.55-.11-73.93-16.3-93.5-53.06-13.57-25.49-23.87-52.72-35.72-79.13-6.33-14.11-12.84-28.13-20.11-44.02ZM482.56,651.15c-2.42,1.41-5.27,2.05-6.02,3.66-23.27,50.31-46.39,100.7-69.27,151.19-1.2,2.65-.15,6.32-.15,10.03,3.26.81,6.3,2.24,9.35,2.24,44.36-.06,88.73-.31,133.09-.58,1.03,0,2.27-.54,3.03-1.25.7-.64.89-1.85,2.17-4.79-17.94-51.94-43.44-102.41-65.3-154.37-1.1-2.61-4.64-4.2-6.89-6.13Z"
      />
    </svg>
  );
}

async function fetchImageAsBase64(url: string): Promise<string> {
  if (!url) return "";
  if (url.startsWith("data:")) return url;
  try {
    const fetchUrl = url.startsWith("/")
      ? url
      : `/api/proxy-image?url=${encodeURIComponent(url)}`;
    const res = await fetch(fetchUrl);
    if (!res.ok) throw new Error(`Proxy error: ${res.statusText}`);
    const blob = await res.blob();
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === "string") resolve(reader.result);
        else reject(new Error("FileReader result not string"));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("fetchImageAsBase64 failed, using raw url:", err);
    return url;
  }
}

async function ensureAllImagesLoaded(element: HTMLElement) {
  const images = Array.from(element.querySelectorAll("img"));
  await Promise.all(
    images.map((img) => {
      if (img.complete && img.naturalWidth > 0) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const done = () => resolve();
        img.onload = done;
        img.onerror = done;
        if (img.decode) {
          img.decode().then(done).catch(done);
        } else {
          setTimeout(done, 250);
        }
      });
    })
  );
}

export default function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [qrSvg, setQrSvg] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [base64Image, setBase64Image] = useState<string | null>(null);

  // Hidden high-res export element reference (1080 x 1920)
  const exportStoryRef = useRef<HTMLDivElement>(null);

  // Helper to ensure production domain https://www.adidayastudio.id
  const getCanonicalUrl = (rawUrl?: string): string => {
    let url =
      rawUrl ||
      (typeof window !== "undefined"
        ? window.location.href
        : "https://www.adidayastudio.id");

    if (url.includes("localhost") || url.includes("127.0.0.1")) {
      try {
        const parsed = new URL(url);
        return `https://www.adidayastudio.id${parsed.pathname}${parsed.search}`;
      } catch {
        return url.replace(/https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i, "https://www.adidayastudio.id");
      }
    }
    return url;
  };

  const currentUrl = getCanonicalUrl(data?.url);

  // Generate QR Code as SVG vector for 100% reliable rendering
  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toString(currentUrl, {
        type: "svg",
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((svg) => setQrSvg(svg))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [isOpen, currentUrl]);

  // Convert hero image to base64 via proxy to prevent CORS taint
  useEffect(() => {
    let isMounted = true;
    if (isOpen && data?.imageUrl) {
      fetchImageAsBase64(data.imageUrl).then((b64) => {
        if (isMounted) setBase64Image(b64);
      });
    } else {
      setBase64Image(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, data?.imageUrl]);

  if (!isOpen || !data) return null;

  // Clean excerpt text (deduplicate if same as subtitle)
  let rawExcerpt = data.excerpt || "";
  if (data.subtitle && rawExcerpt.trim() === data.subtitle.trim()) {
    rawExcerpt = "";
  }
  const cleanExcerpt = stripHtml(rawExcerpt);
  const truncatedExcerpt =
    cleanExcerpt.length > 280
      ? cleanExcerpt.slice(0, 275) + "..."
      : cleanExcerpt ||
        (data.type === "career"
          ? "Explore this open position at Adidaya Studio and join our collective architecture & design journey."
          : data.type === "insight"
          ? "Discover thoughtful perspectives, design philosophies, and architectural discourse at Adidaya Studio."
          : "Discover more project details, documentation, and architectural philosophies at Adidaya Studio.");

  const categoryLabel =
    data.category ||
    (data.type === "project"
      ? "Architecture"
      : data.type === "insight"
      ? "Editorial"
      : "Career");

  // Format meta chips: Kota, Tahun, Status (e.g. Purwokerto, 2022 – 2023, Built)
  const metaChips: string[] = [];
  if (data.type === "project") {
    if (data.location) {
      metaChips.push(data.location.split(",")[0].trim());
    }
    if (data.year) {
      metaChips.push(data.year);
    }
    if (data.status) {
      metaChips.push(data.status.charAt(0).toUpperCase() + data.status.slice(1));
    }
  } else if (data.type === "insight") {
    if (data.author) metaChips.push(data.author);
    if (data.date && data.date !== "—") metaChips.push(data.date);
    if (data.readingTime) metaChips.push(`${data.readingTime} min read`);
  } else if (data.type === "career") {
    if (data.meta && Array.isArray(data.meta)) {
      data.meta.slice(0, 3).forEach((m) => {
        if (typeof m === "string" && m) metaChips.push(m);
      });
    }
  }

  // Normalized descriptions for career
  const careerDescriptions = normalizeDescriptionList(data.descriptionList);

  // Copy Link action
  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Render & Export Story Image (1080 x 1920)
  const generateStoryDataUrl = async () => {
    if (!exportStoryRef.current) return null;

    // 1. Ensure hero image base64 is ready
    if (!base64Image && data?.imageUrl) {
      const b64 = await fetchImageAsBase64(data.imageUrl);
      setBase64Image(b64);
    }

    // 2. Ensure QR Code SVG is ready
    if (!qrSvg && currentUrl) {
      const svg = await QRCode.toString(currentUrl, {
        type: "svg",
        margin: 1,
        color: { dark: "#000000", light: "#FFFFFF" },
      });
      setQrSvg(svg);
    }

    // 3. Ensure all <img> elements inside exportStoryRef are loaded & decoded
    await ensureAllImagesLoaded(exportStoryRef.current);
    await new Promise((resolve) => setTimeout(resolve, 150));

    try {
      return await toJpeg(exportStoryRef.current, {
        quality: 0.96,
        pixelRatio: 1,
        backgroundColor: "#09090b",
        cacheBust: false,
      });
    } catch (err) {
      console.warn("toJpeg failed, fallback to toPng:", err);
      return await toPng(exportStoryRef.current, {
        pixelRatio: 1,
        backgroundColor: "#09090b",
        cacheBust: false,
      });
    }
  };

  const handleDownloadStory = async () => {
    if (isExporting || !exportStoryRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("Generating 9:16 Instagram Story image...");

    try {
      const dataUrl = await generateStoryDataUrl();
      if (!dataUrl) throw new Error("Failed to render story canvas");

      const link = document.createElement("a");
      const cleanFileName = (data.title || "adidaya-story")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .slice(0, 40);
      link.download = `adidaya-story-${cleanFileName}.jpg`;
      link.href = dataUrl;
      link.click();

      toast.success("Instagram Story downloaded! (1080x1920)", { id: toastId });
    } catch (err: any) {
      console.error("Export Story Error:", err);
      toast.error("Failed to generate Story image. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  // Share Image directly via Web Share API with File
  const handleShareStoryDevice = async () => {
    if (isExporting || !exportStoryRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("Preparing Story image for sharing...");

    try {
      const dataUrl = await generateStoryDataUrl();
      if (!dataUrl) throw new Error("Canvas render failed");

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `adidaya-${data.type}-story.jpg`, {
        type: "image/jpeg",
      });

      if (
        typeof navigator !== "undefined" &&
        navigator.canShare &&
        navigator.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: data.title,
          text: `Check out ${data.title} on Adidaya Studio: ${currentUrl}`,
        });
        toast.dismiss(toastId);
      } else {
        const link = document.createElement("a");
        link.download = `adidaya-${data.type}-story.jpg`;
        link.href = dataUrl;
        link.click();
        toast.success("Image saved to your device!", { id: toastId });
      }
    } catch (err: any) {
      if (err?.name !== "AbortError") {
        console.error("Share story error:", err);
        toast.error("Sharing not supported directly. Image downloaded instead.", {
          id: toastId,
        });
      } else {
        toast.dismiss(toastId);
      }
    } finally {
      setIsExporting(false);
    }
  };

  const activeImage = base64Image || data.imageUrl;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* BACKGROUND CLICK TO CLOSE */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* MODAL CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] bg-[#0e0e10] border border-white/15 rounded-3xl shadow-2xl shadow-black/90 flex flex-col max-h-[95vh] overflow-hidden"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-adidaya-red/10 border border-adidaya-red flex items-center justify-center text-adidaya-red shadow-[0_0_10px_rgba(229,57,53,0.25)]">
              <Share2 size={15} strokeWidth={1.75} />
            </div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Share {data.type === "career" ? "Career" : data.type === "insight" ? "Insight" : "Project"}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/15 text-neutral-400 hover:text-white transition flex items-center justify-center cursor-pointer"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-5 flex flex-col items-center justify-center overflow-y-auto no-scrollbar">
          {/* STORY LIVE PREVIEW CARD (9:16 PORTRAIT) */}
          {data.type === "career" ? (
            /* DEDICATED CAREER PREVIEW CARD (ALL FIELDS) */
            <div
              className="w-[270px] sm:w-[285px] aspect-[9/16] bg-[#09090b] rounded-[24px] border border-white/20 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none shrink-0 p-3.5 pt-10"
              style={{
                background:
                  "radial-gradient(circle at 85% 20%, rgba(229, 57, 53, 0.24) 0%, rgba(229, 57, 53, 0.04) 42%, transparent 68%), linear-gradient(180deg, #181215 0%, #100f12 35%, #09090b 100%)",
              }}
            >
              {/* TOP CONTENT GROUP (TITLE, SPECS CARD, DESCRIPTION) WITH TIGHT SPACING */}
              <div className="space-y-2">
                {/* We're hiring & Title */}
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="px-2 py-0.5 rounded-full bg-adidaya-red text-[7.5px] font-bold text-white shadow-md shadow-red-900/30">
                      We're hiring
                    </span>
                  </div>

                  <div className="flex items-start gap-1 pt-0.5">
                    <span className="text-adidaya-red font-bold text-sm leading-tight">*</span>
                    <h3 className="text-sm sm:text-[15px] font-extrabold text-white leading-tight tracking-tight">
                      {data.title}
                    </h3>
                  </div>
                </div>

                {/* STRUCTURED CARD: TYPE, EXPERIENCE, DEADLINE (ROW 1), EDUCATION (ROW 2), SKILL (ROW 3) */}
                <div className="grid grid-cols-3 gap-x-2 gap-y-1.5 p-2 rounded-xl bg-white/[0.04] border border-white/10 text-[7.5px]">
                  <div>
                    <span className="text-[6px] uppercase tracking-wider text-neutral-400 font-bold block">TYPE</span>
                    <span className="font-semibold text-neutral-100 block truncate">{data.jobType || "Full time"}</span>
                  </div>
                  <div>
                    <span className="text-[6px] uppercase tracking-wider text-neutral-400 font-bold block">EXPERIENCE</span>
                    <span className="font-semibold text-neutral-100 block truncate">{data.experience || "0–1 year"}</span>
                  </div>
                  <div>
                    <span className="text-[6px] uppercase tracking-wider text-neutral-400 font-bold block">DEADLINE</span>
                    <span className="font-semibold text-adidaya-red block truncate">{data.deadline || "Open"}</span>
                  </div>
                  <div className="col-span-3 pt-0.5">
                    <span className="text-[6px] uppercase tracking-wider text-neutral-400 font-bold block">EDUCATION</span>
                    <span className="font-semibold text-neutral-100 block leading-tight">
                      {data.education || "S-1 — Architecture"}
                    </span>
                  </div>
                  <div className="col-span-3 pt-0.5">
                    <span className="text-[6px] uppercase tracking-wider text-neutral-400 font-bold block">SKILL</span>
                    <span className="font-semibold text-neutral-100 block leading-tight">
                      {formatSkills(data.skills) || "Archicad, AutoCAD, SketchUp"}
                    </span>
                  </div>
                </div>

                {/* DESCRIPTION BULLETS (ALL DESCRIPTIONS - NO CARD WRAPPER) */}
                {careerDescriptions.length > 0 && (
                  <div className="space-y-0.5 px-0.5">
                    <span className="text-[6px] uppercase tracking-wider text-neutral-400 font-bold block">DESCRIPTION</span>
                    <ul className="space-y-0.5 text-[7px] text-neutral-300 leading-tight">
                      {careerDescriptions.map((item, i) => (
                        <li key={i} className="flex items-start gap-1">
                          <span className="text-adidaya-red font-bold leading-none shrink-0">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* BOTTOM SECTION: Send CV (Left) + QR Code (Right) -> Bottom Logo */}
              <div className="space-y-1.5 pt-1 mt-auto">
                {/* Row: Left (Submission Info), Right (QR Code) */}
                <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/10">
                  <div className="flex-1 min-w-0 text-[6.5px] text-neutral-300 space-y-0.5 text-left">
                    <p className="truncate">
                      <span className="text-neutral-400 font-normal">Send CV & portfolio to:</span>{" "}
                      <strong className="text-white font-semibold">{data.email || "adidayastudio@gmail.com"}</strong>
                    </p>
                    <p className="truncate">
                      <span className="text-neutral-400 font-normal">Subject:</span>{" "}
                      <strong className="text-neutral-200 font-semibold">{data.subject || "AD_YourName"}</strong>
                    </p>
                    <p className="truncate">
                      <span className="text-neutral-400 font-normal">File:</span>{" "}
                      <strong className="text-neutral-200 font-semibold">{data.fileNote || "PDF, max. 5 MB"}</strong>
                    </p>
                  </div>
                  {qrSvg && (
                    <div
                      className="w-10 h-10 rounded-lg bg-white p-0.5 border border-white/30 shadow-md shrink-0 flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                      dangerouslySetInnerHTML={{ __html: qrSvg }}
                    />
                  )}
                </div>

                {/* Bottom: Real Adidaya Logo & Wordmark */}
                <div className="flex items-center justify-center gap-1 text-neutral-400 opacity-80 pt-0.5">
                  <AdidayaLogoIcon className="w-2.5 h-2.5 shrink-0" />
                  <span className="text-[7.5px] uppercase tracking-[0.2em] font-medium text-neutral-300">
                    <span className="font-bold text-white">adidaya</span>{" "}
                    <span className="font-light text-neutral-400">studio</span>
                  </span>
                </div>
              </div>
            </div>
          ) : (
            /* PROJECT & INSIGHT PREVIEW CARD */
            <div className="w-[270px] sm:w-[285px] aspect-[9/16] bg-[#09090b] rounded-[24px] border border-white/20 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none shrink-0">
              {/* HERO IMAGE FULL TOP BLEED BACKGROUND */}
              <div className="absolute inset-x-0 top-0 h-[64%] overflow-hidden">
                {activeImage ? (
                  <>
                    <img
                      src={activeImage}
                      alt={data.title}
                      className="w-full h-full object-cover object-center"
                    />
                    {/* Top subtle vignette */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent" />
                    {/* Bottom fade - subtle so it doesn't cover the building */}
                    <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#09090b] via-[#09090b]/60 to-transparent" />
                  </>
                ) : (
                  <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-[#09090b] flex flex-col items-center justify-center">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-adidaya-red mb-1">
                      <Sparkles size={16} />
                    </div>
                    <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">
                      ADIDAYA STUDIO
                    </span>
                  </div>
                )}
              </div>

              {/* LOWER CONTENT: TITLE, SUBTITLE, METADATA CHIPS & TEASER TEXT */}
              <div className="relative z-10 px-4 mt-auto mb-2 space-y-1.5">
                {/* TITLE & SUBTITLE */}
                <div>
                  <h3 className="text-base sm:text-[17px] font-bold text-white leading-tight tracking-tight line-clamp-2 drop-shadow-md">
                    {data.title}
                  </h3>
                  {data.subtitle && (
                    <p className="text-[10px] sm:text-[10.5px] font-medium text-neutral-300 leading-snug line-clamp-1 mt-0.5">
                      {data.subtitle}
                    </p>
                  )}
                </div>

                {/* META CHIPS */}
                {metaChips.length > 0 && (
                  <div className="flex flex-wrap gap-1 text-[8px] text-neutral-300">
                    {metaChips.map((chip, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-full bg-white/[0.08] backdrop-blur-md border border-white/15 text-neutral-200 font-medium"
                      >
                        {chip}
                      </span>
                    ))}
                  </div>
                )}

                {/* SPILL TEASER WITH BLUR FADE OVERLAY */}
                <div className="relative overflow-hidden max-h-[76px]">
                  <p className="text-[9.5px] sm:text-[10px] text-neutral-300 leading-relaxed line-clamp-3 font-normal">
                    {truncatedExcerpt}
                  </p>
                  {/* Blur fade overlay */}
                  <div className="absolute inset-x-0 bottom-0 h-6 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent backdrop-blur-[1px] flex items-end justify-center pb-0.5 pointer-events-none">
                    <span className="text-[9px] text-adidaya-red font-bold tracking-widest">
                      •••
                    </span>
                  </div>
                </div>
              </div>

              {/* BOTTOM SECTION: Left: Pill + Logo; Right: Big QR Code */}
              <div className="relative z-10 mx-3.5 mb-3.5 flex items-end justify-between gap-2">
                {/* Left: Pill & Real Adidaya Logo */}
                <div className="flex flex-col items-start gap-1.5 min-w-0">
                  {/* Read more pill (only around the text, not full width) */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/[0.08] border border-white/15 backdrop-blur-md shadow-sm">
                    <span className="text-[9px] sm:text-[9.5px] font-medium text-neutral-300 whitespace-nowrap">
                      Read more on <span className="font-semibold text-white">adidayastudio.id</span>
                    </span>
                  </div>

                  {/* Real Adidaya Logo & Wordmark */}
                  <div className="flex items-center gap-1.5 pl-0.5 text-neutral-400 opacity-85">
                    <AdidayaLogoIcon className="w-2.5 h-2.5 shrink-0" />
                    <span className="text-[7.5px] uppercase tracking-[0.22em] font-medium text-neutral-300">
                      <span className="font-bold text-white">adidaya</span>{" "}
                      <span className="font-light text-neutral-400">studio</span>
                    </span>
                  </div>
                </div>

                {/* Right: Big QR Code (vector SVG, 100% reliable) */}
                {qrSvg && (
                  <div
                    className="w-10 h-10 rounded-lg bg-white p-1 border border-white/30 shadow-md shrink-0 flex items-center justify-center overflow-hidden [&>svg]:w-full [&>svg]:h-full [&>svg]:block"
                    dangerouslySetInnerHTML={{ __html: qrSvg }}
                  />
                )}
              </div>
            </div>
          )}

          {/* ACTION BUTTONS (DOWNLOAD, SHARE, COPY LINK) - PILL SHAPE */}
          <div className="grid grid-cols-3 gap-2.5 w-full max-w-[340px] mt-5">
            {/* DOWNLOAD BUTTON */}
            <button
              type="button"
              onClick={handleDownloadStory}
              disabled={isExporting}
              className="rounded-full px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-white text-black hover:bg-adidaya-red hover:text-white transition-all duration-200 shadow-md hover:shadow-[0_0_15px_rgba(229,57,53,0.35)] disabled:opacity-50 cursor-pointer text-center select-none"
            >
              {isExporting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Download size={14} strokeWidth={2} />
              )}
              <span>Download</span>
            </button>

            {/* SHARE BUTTON */}
            <button
              type="button"
              onClick={handleShareStoryDevice}
              disabled={isExporting}
              className="rounded-full px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/[0.08] text-white border border-white/15 hover:border-white/40 hover:bg-white/15 transition-all cursor-pointer text-center select-none shadow-sm"
            >
              <Share2 size={14} strokeWidth={1.75} />
              <span>Share</span>
            </button>

            {/* COPY LINK BUTTON */}
            <button
              type="button"
              onClick={handleCopyLink}
              className="rounded-full px-3 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 bg-white/[0.08] text-white border border-white/15 hover:border-white/40 hover:bg-white/15 transition-all cursor-pointer text-center select-none shadow-sm"
            >
              {copied ? (
                <>
                  <Check size={14} strokeWidth={2.5} className="text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy size={14} strokeWidth={1.75} />
                  <span>Copy Link</span>
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>

      {/* =========================================================
          HIGH-RESOLUTION EXPORT CANVAS (1080 x 1920)
          Identical layout to the preview, rendered in 1080x1920 HD
      ========================================================= */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: 1080,
          height: 1920,
          opacity: 0.001,
          pointerEvents: "none",
          zIndex: -9999,
          overflow: "hidden",
        }}
      >
        {data.type === "career" ? (
          /* DEDICATED CAREER HIGH-RES EXPORT CANVAS (ALL FIELDS) */
          <div
            ref={exportStoryRef}
            style={{
              width: 1080,
              height: 1920,
              backgroundColor: "#09090b",
              color: "#ffffff",
              padding: "300px 75px 65px 75px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              boxSizing: "border-box",
              backgroundImage:
                "radial-gradient(circle at 85% 20%, rgba(229, 57, 53, 0.26) 0%, rgba(229, 57, 53, 0.05) 42%, transparent 68%), linear-gradient(180deg, #181215 0%, #100f12 35%, #09090b 100%)",
            }}
          >
            {/* TOP GROUP: TITLE, SPECS CARD, DESCRIPTION (COHESIVE SPACING) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              {/* We're hiring & Title */}
              <div>
                <div
                  style={{
                    display: "inline-flex",
                    alignSelf: "flex-start",
                    backgroundColor: "#E53935",
                    color: "#FFFFFF",
                    padding: "10px 24px",
                    borderRadius: 9999,
                    fontSize: 20,
                    fontWeight: 700,
                    letterSpacing: "0.02em",
                    boxShadow: "0 6px 20px rgba(229, 57, 53, 0.35)",
                    marginBottom: 16,
                  }}
                >
                  We're hiring
                </div>

                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <span style={{ color: "#E53935", fontSize: 56, fontWeight: 800, lineHeight: 1 }}>*</span>
                  <h1
                    style={{
                      fontSize: 54,
                      fontWeight: 800,
                      lineHeight: 1.15,
                      letterSpacing: "-0.02em",
                      color: "#FFFFFF",
                      margin: 0,
                    }}
                  >
                    {data.title}
                  </h1>
                </div>
              </div>

              {/* 3-COLUMN STRUCTURED CARD: TYPE, EXPERIENCE, DEADLINE (ROW 1), EDUCATION (ROW 2), SKILL (ROW 3) */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "24px 28px",
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 24,
                  padding: "32px 36px",
                }}
              >
                <div>
                  <span style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", fontWeight: 700, display: "block", marginBottom: 6 }}>TYPE</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#F4F4F5" }}>{data.jobType || "Full time"}</span>
                </div>
                <div>
                  <span style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", fontWeight: 700, display: "block", marginBottom: 6 }}>EXPERIENCE</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#F4F4F5" }}>{data.experience || "0–1 year"}</span>
                </div>
                <div>
                  <span style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", fontWeight: 700, display: "block", marginBottom: 6 }}>DEADLINE</span>
                  <span style={{ fontSize: 24, fontWeight: 700, color: "#E53935" }}>{data.deadline || "Open"}</span>
                </div>
                <div style={{ gridColumn: "span 3", paddingTop: 4 }}>
                  <span style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", fontWeight: 700, display: "block", marginBottom: 6 }}>EDUCATION</span>
                  <span style={{ fontSize: 23, fontWeight: 700, color: "#F4F4F5", lineHeight: 1.4 }}>
                    {data.education || "S-1 — Architecture"}
                  </span>
                </div>
                <div style={{ gridColumn: "span 3", paddingTop: 4 }}>
                  <span style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", fontWeight: 700, display: "block", marginBottom: 6 }}>SKILL</span>
                  <span style={{ fontSize: 23, fontWeight: 700, color: "#F4F4F5", lineHeight: 1.4 }}>
                    {formatSkills(data.skills) || "Archicad, AutoCAD, SketchUp"}
                  </span>
                </div>
              </div>

              {/* DESCRIPTION BULLETS (ALL DESCRIPTIONS - NO CARD WRAPPER) */}
              {careerDescriptions.length > 0 && (
                <div style={{ padding: "0 4px" }}>
                  <span style={{ fontSize: 16, textTransform: "uppercase", letterSpacing: "0.12em", color: "#A1A1AA", fontWeight: 700, display: "block", marginBottom: 12 }}>DESCRIPTION</span>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {careerDescriptions.map((item, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, fontSize: 19, color: "#D4D4D8", lineHeight: 1.45 }}>
                        <span style={{ color: "#E53935", fontWeight: 700 }}>•</span>
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* BOTTOM SECTION: Left (Submission info), Right (QR Code) -> Bottom (Logo) */}
            <div style={{ display: "flex", flexDirection: "column", gap: 24, paddingTop: 10, marginTop: "auto" }}>
              {/* Row: Left (Submission Info), Right (QR Code) */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 30,
                  backgroundColor: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.12)",
                  borderRadius: 22,
                  padding: "26px 32px",
                }}
              >
                <div style={{ flex: 1, minWidth: 0, fontSize: 19, color: "#D4D4D8", lineHeight: 1.6, textAlign: "left" }}>
                  <div style={{ marginBottom: 4 }}>
                    <span style={{ color: "#A1A1AA" }}>Send CV & portfolio to: </span>
                    <strong style={{ color: "#FFFFFF", fontWeight: 700 }}>{data.email || "adidayastudio@gmail.com"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#A1A1AA" }}>Subject: </span>
                    <strong style={{ color: "#E4E4E7", fontWeight: 600 }}>{data.subject || "AD_YourName"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#A1A1AA" }}>File: </span>
                    <strong style={{ color: "#E4E4E7", fontWeight: 600 }}>{data.fileNote || "PDF, max. 5 MB"}</strong>
                  </div>
                </div>

                {qrSvg && (
                  <div
                    style={{
                      backgroundColor: "#FFFFFF",
                      padding: 8,
                      borderRadius: 16,
                      border: "2px solid rgba(255, 255, 255, 0.4)",
                      boxShadow: "0 8px 24px rgba(0, 0, 0, 0.45)",
                      width: 110,
                      height: 110,
                      boxSizing: "border-box",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                    dangerouslySetInnerHTML={{
                      __html: qrSvg.replace(/<svg /, '<svg style="width: 100%; height: 100%; display: block;" '),
                    }}
                  />
                )}
              </div>

              {/* Bottom: Real Adidaya Logo & Wordmark */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.85 }}>
                <AdidayaLogoIcon style={{ width: 22, height: 22, display: "block" }} />
                <span style={{ fontSize: 16, letterSpacing: "0.22em", textTransform: "uppercase", color: "#A1A1AA" }}>
                  <strong style={{ color: "#FFFFFF" }}>adidaya</strong> studio
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* PROJECT & INSIGHT HIGH-RES EXPORT CANVAS */
          <div
            ref={exportStoryRef}
            style={{
              width: 1080,
              height: 1920,
              backgroundColor: "#09090b",
              color: "#ffffff",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              fontFamily: "Inter, system-ui, -apple-system, sans-serif",
              boxSizing: "border-box",
            }}
          >
            {/* HERO IMAGE (FULL TOP BLEED) */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1240,
                overflow: "hidden",
              }}
            >
              {activeImage ? (
                <>
                  <img
                    src={activeImage}
                    alt={data.title}
                    crossOrigin="anonymous"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: "center",
                      display: "block",
                    }}
                  />
                  {/* Top ambient vignette */}
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      height: 140,
                      background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 100%)",
                    }}
                  />
                  {/* Bottom subtle dark fade */}
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      right: 0,
                      bottom: 0,
                      height: 280,
                      background:
                        "linear-gradient(to top, #09090b 0%, rgba(9,9,11,0.6) 50%, transparent 100%)",
                    }}
                  />
                </>
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(to bottom, #1f1f23, #09090b)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                />
              )}
            </div>

            {/* LOWER CONTENT: TITLE, SUBTITLE, METADATA CHIPS & TEASER TEXT */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                padding: "0 65px",
                marginTop: "auto",
                marginBottom: 24,
              }}
            >
              {/* TITLE & SUBTITLE */}
              <div style={{ marginBottom: 18 }}>
                <h1
                  style={{
                    fontSize: 52,
                    fontWeight: 800,
                    lineHeight: 1.18,
                    letterSpacing: "-0.02em",
                    color: "#FFFFFF",
                    margin: data.subtitle ? "0 0 10px 0" : "0",
                  }}
                >
                  {data.title}
                </h1>

                {data.subtitle && (
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 500,
                      lineHeight: 1.35,
                      color: "#D4D4D8",
                      margin: 0,
                    }}
                  >
                    {data.subtitle}
                  </p>
                )}
              </div>

              {/* META CHIPS (CLEAN CHIPS) */}
              {metaChips.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 12,
                    marginBottom: 22,
                  }}
                >
                  {metaChips.map((m, i) => (
                    <span
                      key={i}
                      style={{
                        padding: "8px 24px",
                        borderRadius: 9999,
                        backgroundColor: "rgba(255, 255, 255, 0.08)",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        fontSize: 18,
                        fontWeight: 600,
                        letterSpacing: "0.04em",
                        color: "#E4E4E7",
                      }}
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}

              {/* DESCRIPTION TEASER WITH FADE OVERLAY */}
              <div
                style={{
                  position: "relative",
                  maxHeight: 220,
                  overflow: "hidden",
                }}
              >
                <p
                  style={{
                    fontSize: 26,
                    lineHeight: 1.55,
                    color: "#D4D4D8",
                    margin: 0,
                    fontWeight: 400,
                  }}
                >
                  {truncatedExcerpt}
                </p>

                {/* Blur / Gradient Fade */}
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: 90,
                    background:
                      "linear-gradient(to top, rgba(9, 9, 11, 1) 20%, rgba(9, 9, 11, 0.8) 60%, transparent 100%)",
                    display: "flex",
                    alignItems: "flex-end",
                    justifyContent: "center",
                    paddingBottom: 6,
                  }}
                >
                  <span
                    style={{
                      fontSize: 24,
                      letterSpacing: "0.3em",
                      color: "#E53935",
                      fontWeight: 700,
                    }}
                  >
                    •••
                  </span>
                </div>
              </div>
            </div>

            {/* BOTTOM SECTION: Left: Pill + Logo; Right: Big QR Code */}
            <div
              style={{
                position: "relative",
                zIndex: 10,
                margin: "0 65px 65px 65px",
                display: "flex",
                alignItems: "flex-end",
                justifyContent: "space-between",
                gap: 30,
              }}
            >
              {/* Left: Pill & Real Adidaya Logo */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                {/* Read more pill (only around the text, not full width) */}
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.08)",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    borderRadius: 9999,
                    padding: "12px 26px",
                  }}
                >
                  <span
                    style={{
                      fontSize: 22,
                      fontWeight: 500,
                      color: "#D4D4D8",
                      letterSpacing: "0.01em",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Read more on{" "}
                    <span style={{ fontWeight: 700, color: "#FFFFFF" }}>
                      adidayastudio.id
                    </span>
                  </span>
                </div>

                {/* Real Adidaya Logo & Wordmark */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    paddingLeft: 4,
                    opacity: 0.85,
                  }}
                >
                  <AdidayaLogoIcon
                    style={{
                      width: 18,
                      height: 18,
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      fontSize: 13,
                      letterSpacing: "0.22em",
                      textTransform: "uppercase",
                      color: "#A1A1AA",
                    }}
                  >
                    <span style={{ fontWeight: 800, color: "#FFFFFF" }}>adidaya</span>{" "}
                    <span style={{ fontWeight: 300, color: "#A1A1AA" }}>studio</span>
                  </div>
                </div>
              </div>

              {/* Right: Big QR Code (vector SVG, 100% reliable) */}
              {qrSvg && (
                <div
                  style={{
                    backgroundColor: "#FFFFFF",
                    padding: 10,
                    borderRadius: 18,
                    border: "2px solid rgba(255, 255, 255, 0.4)",
                    boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)",
                    width: 130,
                    height: 130,
                    boxSizing: "border-box",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                  dangerouslySetInnerHTML={{
                    __html: qrSvg.replace(/<svg /, '<svg style="width: 100%; height: 100%; display: block;" '),
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
