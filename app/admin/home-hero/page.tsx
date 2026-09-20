"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useUserProfile from "@/hooks/useUserProfile";
import NoAccess from "@/components/admin/NoAccess";
import { supabase } from "@/lib/supabaseClient";
import {
  ArrowLeft,
  Upload,
  Trash2,
  ExternalLink,
  Move,
  ZoomIn,
  ZoomOut,
  Check,
  Loader2,
  Image as ImageIcon,
  RotateCcw,
} from "lucide-react";

type HomeHeroRecord = {
  id: number | string;
  image_url: string | null;
  updated_at?: string | null;
};

export default function AdminHomeHeroPage() {
  const router = useRouter();
  const { profile, loading } = useUserProfile();

  // DATA DARI DB
  const [heroRecord, setHeroRecord] = useState<HomeHeroRecord | null>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // STATE IMAGE & EDITOR
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [hasAdjusted, setHasAdjusted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [imgDims, setImgDims] = useState({ width: 0, height: 0 });
  const [zoom, setZoom] = useState(1.2);
  const [dragging, setDragging] = useState(false);

  const dragState = useRef({
    startX: 0,
    startY: 0,
    initX: 0,
    initY: 0,
  });

  /* ============================
     LOAD EXISTING HERO FROM DB
  ============================ */
  useEffect(() => {
    async function loadHero() {
      const { data, error } = await supabase
        .from("home_hero")
        .select("*")
        .eq("id", 1)
        .limit(1);

      if (error) {
        console.error("Error fetching home hero:", error.message);
      } else {
        const record = data?.[0] ?? null;
        setHeroRecord(record);

        if (record?.image_url) {
          setPreviewUrl(record.image_url);
        }
      }

      setInitialLoading(false);
    }

    loadHero();
  }, []);

  /* ============================
     HANDLE FILE
  ============================ */
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    setFile(f);
    const url = URL.createObjectURL(f);
    setPreviewUrl(url);
    setZoom(1.2);
    setPos({ x: 0, y: 0 });
    setHasAdjusted(true);

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ============================
     RESET IMAGE (LOCAL ONLY)
  ============================ */
  const resetLocalImage = () => {
    setFile(null);
    setPreviewUrl(heroRecord?.image_url ?? null);
    setZoom(1.2);
    setPos({ x: 0, y: 0 });
    setHasAdjusted(false);
  };

  /* ============================
     FIT IMAGE INSIDE FRAME
  ============================ */
  useEffect(() => {
    if (!previewUrl) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const frame = containerRef.current;
      if (!frame) return;

      const frameW = frame.clientWidth;
      const frameH = frame.clientHeight;
      const imgW = img.width;
      const imgH = img.height;

      const frameAspect = frameW / frameH;
      const imgAspect = imgW / imgH;

      let renderW: number;
      let renderH: number;

      if (imgAspect > frameAspect) {
        renderH = frameH * zoom;
        renderW = renderH * imgAspect;
      } else {
        renderW = frameW * zoom;
        renderH = renderW / imgAspect;
      }

      setImgDims({ width: renderW, height: renderH });
      setPos({
        x: (frameW - renderW) / 2,
        y: (frameH - renderH) / 2,
      });
    };
    img.src = previewUrl;
  }, [previewUrl, zoom]);

  /* ============================
     DRAG TO PAN
  ============================ */
  const startDrag = (e: any) => {
    e.preventDefault();
    setDragging(true);

    const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
    const pageY = "touches" in e ? e.touches[0].pageY : e.pageY;

    dragState.current = {
      startX: pageX,
      startY: pageY,
      initX: pos.x,
      initY: pos.y,
    };
  };

  const onDrag = (e: any) => {
    if (!dragging || !containerRef.current) return;

    const pageX = "touches" in e ? e.touches[0].pageX : e.pageX;
    const pageY = "touches" in e ? e.touches[0].pageY : e.pageY;

    const dx = pageX - dragState.current.startX;
    const dy = pageY - dragState.current.startY;

    const frame = containerRef.current;

    const newX = dragState.current.initX + dx;
    const newY = dragState.current.initY + dy;

    const minX = frame.clientWidth - imgDims.width;
    const minY = frame.clientHeight - imgDims.height;

    setPos({
      x: Math.max(Math.min(newX, 0), minX),
      y: Math.max(Math.min(newY, 0), minY),
    });
    setHasAdjusted(true);
  };

  const endDrag = () => {
    setDragging(false);
  };

  /* ============================
     SAVE CROP → STORAGE + DB
  ============================ */
  const saveHero = async () => {
    if (!imgRef.current || !containerRef.current || (!file && !hasAdjusted)) return;

    setSaving(true);

    try {
      const img = imgRef.current;

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d")!;

      canvas.width = 1600; // 16:10
      canvas.height = 1000;

      const scaleX = img.naturalWidth / imgDims.width;
      const scaleY = img.naturalHeight / imgDims.height;

      const cropX = -pos.x * scaleX;
      const cropY = -pos.y * scaleY;

      ctx.drawImage(
        img,
        cropX,
        cropY,
        canvas.width * scaleX,
        canvas.height * scaleY,
        0,
        0,
        canvas.width,
        canvas.height
      );

      const blob: Blob | null = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/jpeg", 0.9)
      );

      if (!blob) {
        alert("Failed to generate image blob.");
        return;
      }

      const croppedFile = new File([blob], `hero-${Date.now()}.jpg`, {
        type: "image/jpeg",
      });

      // 1️⃣ Upload ke storage
      const storagePath = `hero/${croppedFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from("project-images")
        .upload(storagePath, croppedFile, {
          cacheControl: "3600",
          upsert: true,
        });

      if (uploadError) {
        console.error(uploadError);
        alert("Upload failed");
        return;
      }

      // 2️⃣ Ambil public URL
      const { data: urlData } = supabase.storage
        .from("project-images")
        .getPublicUrl(storagePath);

      const publicUrl = urlData.publicUrl;

      // 3️⃣ UPDATE tabel home_hero (selalu id = 1)
      const { data: updated, error: dbError } = await supabase
        .from("home_hero")
        .update({
          image_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select()
        .limit(1);

      if (dbError) {
        console.error("DB update failed:", dbError);
        alert("DB update failed");
        return;
      }

      const record = updated?.[0] ?? null;
      setHeroRecord(record);
      setPreviewUrl(publicUrl);
      setFile(null);
      setHasAdjusted(false);
      setZoom(1.2);
      setPos({ x: 0, y: 0 });

      alert("Hero image saved successfully!");
    } catch (err: any) {
      console.error("Error saving hero:", err);
      alert("Failed to process and save hero image.");
    } finally {
      setSaving(false);
    }
  };

  /* ============================
     DELETE HERO (STORAGE + DB)
  ============================ */
  const deleteHero = async () => {
    if (!heroRecord?.image_url) return;

    const confirmDelete = window.confirm(
      "Delete current hero image from website?"
    );
    if (!confirmDelete) return;

    setDeleting(true);

    try {
      const url = heroRecord.image_url;
      const path = url.split("/object/public/project-images/")[1];

      if (!path) {
        console.error("Failed to parse storage path:", url);
      } else {
        const { error: removeError } = await supabase.storage
          .from("project-images")
          .remove([path]);

        if (removeError) {
          console.error("Storage delete error:", removeError);
        }
      }

      const { data: updated, error: dbError } = await supabase
        .from("home_hero")
        .update({
          image_url: null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", 1)
        .select()
        .limit(1);

      if (dbError) {
        console.error("DB update failed:", dbError);
        alert("Failed to update DB.");
        return;
      }

      const record = updated?.[0] ?? null;
      setHeroRecord(record);
      setPreviewUrl(null);
      setFile(null);
      setHasAdjusted(false);
      setZoom(1.2);
      setPos({ x: 0, y: 0 });

      alert("Hero image deleted.");
    } finally {
      setDeleting(false);
    }
  };

  /* ============================
     ROLE GUARD
  ============================ */
  if (!loading && profile?.role === "staff") {
    return (
      <NoAccess message="Only admin or supervisor can manage Home Hero content." />
    );
  }

  if (loading || initialLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-adidaya-text-muted">
        <Loader2 size={24} className="animate-spin text-adidaya-red" />
        <span className="text-xs uppercase tracking-widest font-mono">Loading hero image editor...</span>
      </div>
    );
  }

  const hasChanges = !!file || (hasAdjusted && !!previewUrl);

  /* ============================
     UI REVAMPED (ARCHITECTURAL GLASS)
  ============================ */
  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8">
      {/* 1. HEADER */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Admin • Home Hero
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
            <span className="text-adidaya-red font-bold">*</span> Edit Hero Image
          </h1>
          <p className="text-sm text-adidaya-text-muted">
            Drag to position · Zoom to adjust framing · 16:10 Aspect Ratio
          </p>
        </div>
      </header>

      {/* 2. SUBHEADER ACTION BAR (KIRI: Back to Dashboard, KANAN: Actions) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        {/* KIRI: Back to Dashboard */}
        <button
          onClick={() => router.push("/admin")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 select-none group w-fit shadow-sm"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </button>

        {/* KANAN: Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {heroRecord?.image_url && (
            <button
              onClick={deleteHero}
              disabled={deleting}
              className="rounded-full border border-adidaya-red bg-transparent text-adidaya-red hover:bg-adidaya-red hover:border-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all px-5 py-2.5 text-xs font-medium flex items-center gap-2 disabled:opacity-50 select-none group cursor-pointer"
            >
              {deleting ? (
                <Loader2 size={13} className="animate-spin text-white" />
              ) : (
                <Trash2 size={13} strokeWidth={1.5} className="group-hover:scale-110 transition-transform" />
              )}
              <span>{deleting ? "Deleting..." : "Delete Hero"}</span>
            </button>
          )}

          <button
            onClick={() => window.open("/", "_blank")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none group shadow-sm"
          >
            <span>Live Preview</span>
            <ExternalLink size={12} strokeWidth={1.5} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </button>

          <button
            onClick={saveHero}
            disabled={!hasChanges || saving}
            className={`rounded-full px-6 py-2.5 text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all select-none ${
              hasChanges && !saving
                ? "bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_25px_rgba(229,57,53,0.5)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                : "bg-white/10 text-white/40 border border-white/10 cursor-not-allowed"
            }`}
          >
            {saving ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Check size={14} strokeWidth={2} />
            )}
            <span>{saving ? "Saving..." : "Save Hero Image"}</span>
          </button>
        </div>
      </div>

      {/* 3. MAIN CARD (FROSTED GLASS) */}
      <motion.div
        layout
        className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col gap-6 relative"
      >
        {/* TOP: UPLOAD CONTROLS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
          <div>
            <span className="text-[10px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono mb-1 block">
              Upload Hero Media
            </span>
            <p className="text-xs text-adidaya-text-muted">
              Select a high-resolution image to crop and set as homepage cover.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              className="hidden"
              id="hero-file-upload"
            />
            <label
              htmlFor="hero-file-upload"
              className="rounded-full bg-white/[0.08] hover:bg-adidaya-red hover:border-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] hover:scale-[1.02] active:scale-[0.98] border border-white/15 px-5 py-2.5 text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm select-none group"
            >
              <Upload size={14} strokeWidth={1.5} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>{previewUrl ? "Choose Different Image" : "Upload Hero Image"}</span>
            </label>

            {file && (
              <button
                onClick={resetLocalImage}
                className="rounded-full border border-adidaya-red bg-transparent text-adidaya-red hover:bg-adidaya-red hover:border-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.5)] hover:scale-[1.02] active:scale-[0.98] transition-all px-4 py-2.5 text-xs font-medium flex items-center gap-1.5 select-none group cursor-pointer"
              >
                <RotateCcw size={12} strokeWidth={1.5} className="group-hover:-rotate-45 transition-transform" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* SELECTED FILE BADGE */}
        {file && (
          <div className="flex items-center gap-2 py-2.5 px-4 rounded-2xl bg-white/[0.03] border border-white/10 text-xs text-gray-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#34d399]" />
            <span className="text-adidaya-text-muted font-mono">Selected:</span>
            <span className="font-medium text-white truncate max-w-xs">{file.name}</span>
            <span className="text-[10px] text-adidaya-text-muted font-mono ml-auto">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </span>
          </div>
        )}

        {/* HERO EDITOR FRAME */}
        {previewUrl ? (
          <div className="flex flex-col gap-4">
            <div
              ref={containerRef}
              className="relative w-full aspect-[16/10] rounded-2xl border border-white/15 overflow-hidden bg-black select-none shadow-2xl group/frame"
            >
              <img
                ref={imgRef}
                src={previewUrl}
                alt="Hero Preview"
                crossOrigin="anonymous"
                className="absolute top-0 left-0 cursor-grab active:cursor-grabbing"
                style={{
                  width: imgDims.width,
                  height: imgDims.height,
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
                  transition: dragging ? "none" : "transform 0.15s ease-out",
                }}
                onMouseDown={startDrag}
                onMouseMove={onDrag}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
                onTouchStart={startDrag}
                onTouchMove={onDrag}
                onTouchEnd={endDrag}
              />

              {/* OVERLAY HELPER */}
              <div className="absolute top-3 left-3 pointer-events-none px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-[11px] text-gray-200 flex items-center gap-1.5 shadow-lg">
                <Move size={12} strokeWidth={1.5} />
                <span>Drag image to pan</span>
              </div>
            </div>

            {/* ZOOM SLIDER BAR */}
            <div className="py-3.5 px-5 rounded-2xl bg-white/[0.03] border border-white/10 flex items-center gap-4">
              <span className="text-[10px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono shrink-0">
                Zoom
              </span>
              <ZoomOut size={14} className="text-adidaya-text-muted shrink-0" />
              <input
                type="range"
                min={1}
                max={3}
                step={0.01}
                value={zoom}
                onChange={(e) => {
                  setZoom(Number(e.target.value));
                  setHasAdjusted(true);
                }}
                className="w-full accent-adidaya-red h-1.5 bg-white/10 rounded-lg cursor-pointer"
              />
              <ZoomIn size={14} className="text-adidaya-text-muted shrink-0" />
              <span className="text-xs font-mono font-semibold text-white shrink-0 min-w-[40px] text-right">
                {Math.round(zoom * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full aspect-[16/10] rounded-2xl border border-dashed border-white/15 bg-white/[0.01] flex flex-col items-center justify-center gap-3 text-adidaya-text-muted">
            <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-adidaya-text-muted">
              <ImageIcon size={22} strokeWidth={1.5} />
            </div>
            <p className="text-sm font-medium text-gray-300">No Hero Image Configured</p>
            <p className="text-xs text-adidaya-text-muted max-w-sm text-center">
              Upload a cover image above to establish the primary architectural banner for Adidaya Studio.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
