"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toPng, toJpeg } from "html-to-image";
import QRCode from "qrcode";
import { toast } from "react-hot-toast";
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  QrCode as QrIcon,
  Sparkles,
  Smartphone,
  Globe,
  Send,
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

export default function ShareModal({ isOpen, onClose, data }: ShareModalProps) {
  const [activeTab, setActiveTab] = useState<"story" | "link">("story");
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isExporting, setIsExporting] = useState(false);
  const [canWebShare, setCanWebShare] = useState(false);

  // Hidden high-res export element reference (1080 x 1920)
  const exportStoryRef = useRef<HTMLDivElement>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);

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

  // Determine current canonical URL
  const currentUrl = getCanonicalUrl(data?.url);

  // Check Web Share API availability
  useEffect(() => {
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      setCanWebShare(true);
    }
  }, []);

  // Generate QR Code data URL
  useEffect(() => {
    if (isOpen && currentUrl) {
      QRCode.toDataURL(currentUrl, {
        width: 320,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.error("QR Code Error:", err));
    }
  }, [isOpen, currentUrl]);

  // Convert hero image to base64 for reliable canvas capture without CORS locks
  useEffect(() => {
    let isMounted = true;
    if (isOpen && data?.imageUrl) {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width;
          canvas.height = img.naturalHeight || img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataUrl = canvas.toDataURL("image/jpeg", 0.95);
            if (isMounted) setBase64Image(dataUrl);
          }
        } catch {
          if (isMounted) setBase64Image(data.imageUrl || null);
        }
      };
      img.onerror = () => {
        if (isMounted) setBase64Image(data.imageUrl || null);
      };
      img.src = data.imageUrl;
    } else {
      setBase64Image(null);
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, data?.imageUrl]);

  if (!isOpen || !data) return null;

  // Clean excerpt text
  const cleanExcerpt = stripHtml(data.excerpt || data.subtitle || "");
  const truncatedExcerpt =
    cleanExcerpt.length > 280
      ? cleanExcerpt.slice(0, 275) + "..."
      : cleanExcerpt ||
        (data.type === "career"
          ? "Explore this open position at Adidaya Studio and join our collective architecture & design journey."
          : "Discover more project details, documentation, and design philosophies at Adidaya Studio.");

  // Type metadata
  const typeLabel =
    data.type === "project"
      ? "Architectural Portfolio"
      : data.type === "insight"
      ? "Editorial Insight"
      : "Career Opportunity";

  const categoryLabel =
    data.category ||
    (data.type === "project"
      ? "Architecture"
      : data.type === "insight"
      ? "Editorial"
      : "Recruitment");

  // Format meta chips
  const metaChips: string[] = [];
  if (data.location) metaChips.push(data.location);
  if (data.year) metaChips.push(data.year);
  if (data.status) metaChips.push(data.status);
  if (data.author) metaChips.push(data.author);
  if (data.date) metaChips.push(data.date);
  if (data.readingTime) metaChips.push(`${data.readingTime} min read`);
  if (data.meta && Array.isArray(data.meta)) {
    data.meta.forEach((m) => {
      if (typeof m === "string" && !metaChips.includes(m)) metaChips.push(m);
      else if (typeof m === "object" && m?.value && !metaChips.includes(m.value)) {
        metaChips.push(m.value);
      }
    });
  }

  // Copy Link action
  const handleCopyLink = () => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(currentUrl);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // Social Share Handlers
  const handleSocialShare = (platform: "wa" | "x" | "linkedin" | "telegram") => {
    const text = `Check out "${data.title}" by Adidaya Studio:\n${currentUrl}`;
    let shareUrl = "";

    switch (platform) {
      case "wa":
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
        break;
      case "x":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
          data.title
        )}&url=${encodeURIComponent(currentUrl)}`;
        break;
      case "linkedin":
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
          currentUrl
        )}`;
        break;
      case "telegram":
        shareUrl = `https://t.me/share/url?url=${encodeURIComponent(
          currentUrl
        )}&text=${encodeURIComponent(data.title)}`;
        break;
    }

    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Render & Export Story Image
  const generateStoryDataUrl = async () => {
    if (!exportStoryRef.current) return null;

    try {
      return await toJpeg(exportStoryRef.current, {
        quality: 0.96,
        pixelRatio: 2,
        backgroundColor: "#080808",
        skipFonts: true,
      });
    } catch (err) {
      console.warn("toJpeg failed, fallback to toPng:", err);
      return await toPng(exportStoryRef.current, {
        pixelRatio: 2,
        backgroundColor: "#080808",
        skipFonts: true,
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

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-xl animate-fade-in overflow-y-auto">
      {/* BACKGROUND CLICK TO CLOSE */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* MODAL CARD */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 16 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="relative z-10 w-full max-w-[420px] bg-[#0e0e10] border border-white/15 rounded-3xl shadow-2xl shadow-black/90 flex flex-col max-h-[94vh] overflow-hidden"
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
        <div className="p-6 flex flex-col items-center justify-center overflow-y-auto no-scrollbar">
          {/* STORY LIVE PREVIEW CARD */}
          <div className="w-[260px] sm:w-[280px] aspect-[9/16] bg-[#09090b] rounded-[24px] border border-white/20 p-3.5 shadow-2xl relative overflow-hidden flex flex-col justify-between select-none shrink-0">
            {/* HERO IMAGE BACKGROUND / BANNER */}
            {base64Image || data.imageUrl ? (
              <div className="relative w-full h-[38%] rounded-xl overflow-hidden border border-white/10 shrink-0">
                <img
                  src={base64Image || data.imageUrl || ""}
                  alt={data.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-black/40" />
              </div>
            ) : (
              <div className="relative w-full h-[28%] rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/10 flex flex-col items-center justify-center text-center p-3 shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-adidaya-red mb-1">
                  <Sparkles size={14} />
                </div>
                <span className="text-[10px] uppercase tracking-widest text-neutral-400 font-semibold">
                  ADIDAYA STUDIO
                </span>
              </div>
            )}

            {/* BRAND HEADER & CATEGORY */}
            <div className="flex items-center justify-between mt-2 px-0.5">
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-adidaya-red shadow-[0_0_6px_#e53935]" />
                <span className="text-[9px] uppercase tracking-[0.16em] text-neutral-300 font-bold">
                  ADIDAYA STUDIO
                </span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-adidaya-red text-[8px] font-semibold text-white uppercase tracking-wider">
                {categoryLabel}
              </span>
            </div>

            {/* TITLE & META */}
            <div className="my-1.5 space-y-1">
              <h3 className="text-xs sm:text-[13px] font-bold text-white leading-snug line-clamp-2">
                {data.title}
              </h3>
              {metaChips.length > 0 && (
                <div className="flex flex-wrap gap-1 text-[8px] text-neutral-400">
                  {metaChips.slice(0, 3).map((chip, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-neutral-300 font-medium"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* SPILL TEASER WITH BLUR FADE OVERLAY */}
            <div className="relative flex-1 min-h-0 overflow-hidden my-1">
              <p className="text-[9px] sm:text-[10px] text-neutral-300 leading-relaxed line-clamp-4">
                {truncatedExcerpt}
              </p>
              {/* Blur overlay */}
              <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#09090b] via-[#09090b]/80 to-transparent backdrop-blur-[1px] flex items-end justify-center pb-0.5 pointer-events-none">
                <span className="text-[8px] text-adidaya-red/90 tracking-widest font-bold">
                  •••
                </span>
              </div>
            </div>

            {/* READ MORE ON ADIDAYASTUDIO.ID FOOTER */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2 mt-auto">
              <div className="min-w-0">
                <p className="text-[9px] font-bold text-white uppercase tracking-wider truncate">
                  Read on adidayastudio.id
                </p>
                <p className="text-[7.5px] text-neutral-400 truncate">
                  Tap link sticker / scan QR
                </p>
              </div>
              {qrDataUrl && (
                <img
                  src={qrDataUrl}
                  alt="QR Code"
                  className="w-7 h-7 rounded border border-white/20 bg-white p-0.5 shrink-0"
                />
              )}
            </div>
          </div>

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
          HIDDEN HIGH-RESOLUTION EXPORT ELEMENT (1080 x 1920)
          Used by html-to-image to generate razor-sharp 9:16 images
      ========================================================= */}
      <div
        style={{
          position: "fixed",
          top: -99999,
          left: -99999,
          width: 1080,
          height: 1920,
          pointerEvents: "none",
          zIndex: -1,
        }}
      >
        <div
          ref={exportStoryRef}
          style={{
            width: 1080,
            height: 1920,
            backgroundColor: "#070709",
            color: "#ffffff",
            padding: "80px 70px 70px 70px",
            boxSizing: "border-box",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            fontFamily: "Inter, system-ui, -apple-system, sans-serif",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* BACKGROUND AMBIENT GRADIENT & ARCHITECTURAL GRID */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "radial-gradient(circle at 80% 20%, rgba(229, 57, 53, 0.12) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(255, 255, 255, 0.04) 0%, transparent 60%)",
              pointerEvents: "none",
            }}
          />

          {/* TOP SECTION: BRAND HEADER & CATEGORY */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 2,
              paddingBottom: 24,
              borderBottom: "1px solid rgba(255, 255, 255, 0.12)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <span
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#E53935",
                  boxShadow: "0 0 16px #E53935",
                  display: "inline-block",
                }}
              />
              <span
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  color: "#FFFFFF",
                }}
              >
                ADIDAYA STUDIO
              </span>
            </div>

            <div
              style={{
                backgroundColor: "#E53935",
                color: "#FFFFFF",
                padding: "8px 24px",
                borderRadius: 9999,
                fontSize: 18,
                fontWeight: 700,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
              }}
            >
              {categoryLabel}
            </div>
          </div>

          {/* HERO IMAGE CONTAINER */}
          <div
            style={{
              position: "relative",
              width: "100%",
              height: 720,
              borderRadius: 36,
              overflow: "hidden",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              margin: "36px 0",
              zIndex: 2,
              backgroundColor: "#111114",
            }}
          >
            {base64Image || data.imageUrl ? (
              <>
                <img
                  src={base64Image || data.imageUrl || ""}
                  alt={data.title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background:
                      "linear-gradient(to top, rgba(7, 7, 9, 0.95) 0%, rgba(7, 7, 9, 0.2) 50%, rgba(0, 0, 0, 0.5) 100%)",
                  }}
                />
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "linear-gradient(135deg, #18181b 0%, #09090b 100%)",
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    fontWeight: 800,
                    color: "#E53935",
                    letterSpacing: "0.2em",
                  }}
                >
                  *
                </div>
                <div
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    letterSpacing: "0.25em",
                    color: "#A1A1AA",
                    textTransform: "uppercase",
                    marginTop: 12,
                  }}
                >
                  {typeLabel}
                </div>
              </div>
            )}
          </div>

          {/* MIDDLE: TITLE, METADATA & BLURRED TEASER */}
          <div style={{ position: "relative", zIndex: 2, flex: 1, display: "flex", flexDirection: "column" }}>
            {/* META TAGS ROW */}
            {metaChips.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                {metaChips.slice(0, 4).map((m, i) => (
                  <span
                    key={i}
                    style={{
                      padding: "8px 20px",
                      borderRadius: 9999,
                      backgroundColor: "rgba(255, 255, 255, 0.08)",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      fontSize: 18,
                      fontWeight: 600,
                      letterSpacing: "0.1em",
                      color: "#E4E4E7",
                      textTransform: "uppercase",
                    }}
                  >
                    {m}
                  </span>
                ))}
              </div>
            )}

            {/* TITLE */}
            <h1
              style={{
                fontSize: 48,
                fontWeight: 800,
                lineHeight: 1.22,
                letterSpacing: "-0.02em",
                color: "#FFFFFF",
                margin: "0 0 24px 0",
              }}
            >
              {data.title}
            </h1>

            {/* TEASER TEXT WITH FADE & BLUR OVERLAY */}
            <div
              style={{
                position: "relative",
                flex: 1,
                overflow: "hidden",
                maxHeight: 280,
              }}
            >
              <p
                style={{
                  fontSize: 26,
                  lineHeight: 1.6,
                  color: "#D4D4D8",
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                {truncatedExcerpt}
              </p>

              {/* Smooth Blur and Gradient Fade Out */}
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  height: 140,
                  background:
                    "linear-gradient(to top, rgba(7, 7, 9, 1) 15%, rgba(7, 7, 9, 0.85) 60%, transparent 100%)",
                  display: "flex",
                  alignItems: "flex-end",
                  justifyContent: "center",
                  paddingBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    letterSpacing: "0.4em",
                    color: "#E53935",
                  }}
                >
                  •••••
                </span>
              </div>
            </div>
          </div>

          {/* BOTTOM SECTION: READ MORE BANNER + QR CODE */}
          <div
            style={{
              position: "relative",
              zIndex: 2,
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              borderRadius: 36,
              padding: "28px 36px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 32,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 800,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  color: "#FFFFFF",
                  marginBottom: 6,
                }}
              >
                READ MORE ON ADIDAYASTUDIO.ID
              </div>
              <div
                style={{
                  fontSize: 18,
                  color: "#A1A1AA",
                  letterSpacing: "0.06em",
                }}
              >
                Swipe up or scan QR code to read full article & view documentation
              </div>
            </div>

            {qrDataUrl && (
              <div
                style={{
                  backgroundColor: "#FFFFFF",
                  padding: 10,
                  borderRadius: 20,
                  border: "2px solid rgba(255, 255, 255, 0.3)",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
                }}
              >
                <img
                  src={qrDataUrl}
                  alt="QR"
                  style={{ width: 110, height: 110, display: "block" }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
