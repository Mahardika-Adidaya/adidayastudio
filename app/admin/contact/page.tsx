"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import useUserProfile from "@/hooks/useUserProfile";
import NoAccess from "@/components/admin/NoAccess";
import { supabase } from "@/lib/supabaseClient";
import {
  DEFAULT_CONTACT_SETTINGS,
  type ContactSettings,
} from "@/lib/getContactSettings";
import { toast } from "react-hot-toast";
import {
  ArrowLeft,
  ExternalLink,
  Save,
  Instagram,
  Mail,
  MessageCircle,
  Loader2,
} from "lucide-react";

export default function AdminContactPage() {
  const router = useRouter();
  const { profile, loading: profileLoading } = useUserProfile();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // FORM STATES
  const [instagramHandle, setInstagramHandle] = useState(
    DEFAULT_CONTACT_SETTINGS.instagram_handle
  );
  const [instagramUrl, setInstagramUrl] = useState(
    DEFAULT_CONTACT_SETTINGS.instagram_url
  );
  const [email, setEmail] = useState(DEFAULT_CONTACT_SETTINGS.email);
  const [whatsappNumber, setWhatsappNumber] = useState(
    DEFAULT_CONTACT_SETTINGS.whatsapp_number
  );
  const [whatsappMessage, setWhatsappMessage] = useState(
    DEFAULT_CONTACT_SETTINGS.whatsapp_message
  );

  /* ============================================================
     FETCH EXISTING CONTACT SETTINGS FROM SUPABASE
  ============================================================ */
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("contact_settings")
          .select("*")
          .eq("id", 1)
          .limit(1);

        if (error) {
          console.error("Error loading contact settings:", error.message);
        } else if (data && data.length > 0) {
          const row: ContactSettings = data[0];
          if (row.instagram_handle) setInstagramHandle(row.instagram_handle);
          if (row.instagram_url) setInstagramUrl(row.instagram_url);
          if (row.email) setEmail(row.email);
          if (row.whatsapp_number) setWhatsappNumber(row.whatsapp_number);
          if (row.whatsapp_message) setWhatsappMessage(row.whatsapp_message);
        }
      } catch (err) {
        console.error("Fetch error:", err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  /* ============================================================
     SAVE HANDLER
  ============================================================ */
  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!profile || (profile.role !== "admin" && profile.role !== "supervisor")) {
      toast.error("Only admin or supervisor can update contact settings.");
      return;
    }

    // Clean WA number (remove spaces, plus, dashes)
    const cleanWa = whatsappNumber.replace(/[^0-9]/g, "");

    setSaving(true);
    try {
      const payload = {
        id: 1,
        instagram_handle: instagramHandle.trim() || "@adidayastudio",
        instagram_url:
          instagramUrl.trim() || "https://instagram.com/adidayastudio",
        email: email.trim() || "adidayastudio@gmail.com",
        whatsapp_number: cleanWa || "6281295845860",
        whatsapp_message:
          whatsappMessage.trim() ||
          "Hi Adidaya Studio, I would like to consult about ...",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("contact_settings")
        .upsert(payload);

      if (error) {
        console.error("Save error:", error);
        toast.error(error.message || "Failed to save contact settings");
        return;
      }

      toast.success("Contact settings saved successfully!");
    } catch (err: any) {
      console.error("Save exception:", err);
      toast.error(err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  /* ============================================================
     PREPARE WA LINK FOR PREVIEW
  ============================================================ */
  const cleanWaNumber = whatsappNumber.replace(/[^0-9]/g, "") || "6281295845860";
  const whatsappHref = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    whatsappMessage || "Hi Adidaya Studio, I would like to ..."
  )}`;

  /* ============================================================
     PERMISSIONS CHECK
  ============================================================ */
  if (profileLoading || loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-3 text-adidaya-text-muted">
        <Loader2 size={24} className="animate-spin text-adidaya-red" />
        <span className="text-xs uppercase tracking-widest text-adidaya-text-muted">
          Loading contact settings...
        </span>
      </div>
    );
  }

  if (!profile || (profile.role !== "admin" && profile.role !== "supervisor")) {
    return (
      <NoAccess message="Only administrators and supervisors can manage contact settings." />
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-8 font-sans">
      {/* 1. HEADER */}
      <header className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] uppercase tracking-[0.2em] text-adidaya-text-muted font-mono">
            Admin • Network • Contact
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl sm:text-3xl font-semibold text-white flex items-center gap-2 tracking-tight">
            <span className="text-adidaya-red font-bold">*</span> Contact & Socials
          </h1>
          <p className="text-sm text-adidaya-text-muted">
            Configure studio official communication channels, WhatsApp consultation text, email, and Instagram links.
          </p>
        </div>
      </header>

      {/* 2. SUBHEADER ACTION BAR (SINGLE SAVE BUTTON AT TOP) */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-white/10">
        {/* KIRI: Back to Dashboard */}
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 select-none group w-fit shadow-sm"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" />
          <span>Back to Dashboard</span>
        </button>

        {/* KANAN: Live Preview & Save Changes */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.open("/networks", "_blank")}
            className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-medium text-adidaya-text-muted hover:text-white hover:border-white/30 hover:bg-white/15 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 select-none group shadow-sm"
          >
            <span>Live Preview</span>
            <ExternalLink
              size={12}
              strokeWidth={1.5}
              className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform"
            />
          </button>

          <button
            type="button"
            onClick={() => handleSave()}
            disabled={saving}
            className="rounded-full px-6 py-2.5 text-xs font-semibold flex items-center gap-2 shadow-md transition-all select-none bg-white text-black hover:bg-adidaya-red hover:text-white hover:shadow-[0_0_20px_rgba(229,57,53,0.4)] hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
          >
            {saving ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Save size={14} strokeWidth={2} />
            )}
            <span>{saving ? "Saving..." : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* 3. FORM CARDS (1 CARD PER ITEM) */}
      <div className="space-y-6">
        {/* CARD 1: INSTAGRAM */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-xl space-y-5"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-yellow-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shrink-0">
              <Instagram size={20} strokeWidth={2} />
            </div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Instagram Channel
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Instagram Handle
              </label>
              <input
                type="text"
                value={instagramHandle}
                onChange={(e) => setInstagramHandle(e.target.value)}
                placeholder="@adidayastudio"
                className="w-full rounded-full bg-black/50 border border-white/10 px-5 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-adidaya-red focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Profile URL
              </label>
              <input
                type="url"
                value={instagramUrl}
                onChange={(e) => setInstagramUrl(e.target.value)}
                placeholder="https://instagram.com/adidayastudio"
                className="w-full rounded-full bg-black/50 border border-white/10 px-5 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-adidaya-red focus:outline-none transition"
              />
            </div>
          </div>
        </motion.div>

        {/* CARD 2: EMAIL */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-xl space-y-5"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white shadow-md shrink-0">
              <Mail size={20} strokeWidth={1.8} />
            </div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              Email Address
            </h2>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="adidayastudio@gmail.com"
              className="w-full rounded-full bg-black/50 border border-white/10 px-5 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-adidaya-red focus:outline-none transition"
            />
          </div>
        </motion.div>

        {/* CARD 3: WHATSAPP CONSULTATION */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-3xl bg-white/[0.03] backdrop-blur-xl border border-white/10 p-6 sm:p-7 shadow-xl space-y-5"
        >
          <div className="flex items-center gap-3 pb-3 border-b border-white/10">
            <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-md shrink-0">
              <MessageCircle size={20} strokeWidth={1.8} />
            </div>
            <h2 className="text-base font-semibold text-white tracking-wide">
              WhatsApp Consultation
            </h2>
          </div>

          <div className="space-y-5">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                WhatsApp Number
              </label>
              <input
                type="text"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                placeholder="6281295845860"
                className="w-full rounded-full bg-black/50 border border-white/10 px-5 py-3 text-sm text-white placeholder:text-neutral-600 focus:border-adidaya-red focus:outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-2">
                Default Consultation Message Template
              </label>
              <textarea
                rows={3}
                value={whatsappMessage}
                onChange={(e) => setWhatsappMessage(e.target.value)}
                placeholder="Hi Adidaya Studio, I would like to consult about ..."
                className="w-full rounded-3xl bg-black/50 border border-white/10 px-5 py-4 text-sm text-white placeholder:text-neutral-600 focus:border-adidaya-red focus:outline-none transition resize-none"
              />
            </div>
          </div>
        </motion.div>

        {/* 4. REAL-TIME LIVE PREVIEW CARDS */}
        <div className="space-y-4 pt-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs text-neutral-400 font-medium">
              Live Preview • Public Contact Cards
            </h3>
          </div>

          <div className="grid gap-5 md:gap-6 md:grid-cols-3 w-full">
            {/* CARD 1: INSTAGRAM */}
            <a
              href={instagramUrl || "https://instagram.com/adidayastudio"}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-56 sm:h-64 transition transform bg-[#e34234] text-white hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="mb-4">
                <Instagram className="w-7 h-7 opacity-80 group-hover:scale-110 transition-transform" />
              </div>

              <div className="mt-auto">
                <p className="text-xs uppercase tracking-[0.15em] opacity-80 mb-1">
                  Find us on Instagram
                </p>
                <p className="text-base sm:text-lg font-semibold break-all leading-snug">
                  {instagramHandle || "@adidayastudio"}
                </p>
              </div>
            </a>

            {/* CARD 2: EMAIL */}
            <a
              href={`mailto:${email || "adidayastudio@gmail.com"}`}
              className="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-56 sm:h-64 transition transform bg-[#f6f6f6] text-black hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="mb-4">
                <Mail className="w-7 h-7 opacity-80 group-hover:scale-110 transition-transform" />
              </div>

              <div className="mt-auto">
                <p className="text-xs uppercase tracking-[0.15em] opacity-80 mb-1">
                  Reach us out
                </p>
                <p className="text-base sm:text-lg font-semibold break-all leading-snug">
                  {email || "adidayastudio@gmail.com"}
                </p>
              </div>
            </a>

            {/* CARD 3: WHATSAPP */}
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-56 sm:h-64 transition transform bg-[#f6f6f6] text-black hover:-translate-y-1 hover:shadow-xl group"
            >
              <div className="mb-4">
                <MessageCircle className="w-7 h-7 opacity-80 group-hover:scale-110 transition-transform" />
              </div>

              <div className="mt-auto">
                <p className="text-xs uppercase tracking-[0.15em] opacity-80 mb-1">
                  Get in touch
                </p>
                <p className="text-base sm:text-lg font-semibold break-all leading-snug">
                  WhatsApp
                </p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
