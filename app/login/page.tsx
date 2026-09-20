"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, AlertCircle, Loader2, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    const form = new FormData(e.target as HTMLFormElement);
    const email = form.get("email") as string;
    const password = form.get("password") as string;

    // Supabase auth sign in
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMsg("Incorrect email or password. Please try again.");
      return;
    }

    router.push("/admin");
  }

  return (
    <div className="w-full min-h-[calc(100vh-180px)] flex items-center justify-center px-4 py-8 relative">
      {/* AMBIENT BACKGROUND GLOW */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-adidaya-red/10 rounded-full blur-3xl -z-10" />

      {/* AUTH CARD */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="w-full max-w-md bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-3xl p-8 sm:p-10 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative overflow-hidden"
      >
        {/* HEADER */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-3">
            <Image
              src="/logo-adidaya-red.svg"
              alt="Adidaya Logo"
              width={26}
              height={26}
              priority
              className="object-contain"
            />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-light tracking-[0.2em] text-white">
                ADIDAYA
              </span>
              <span className="text-xl font-bold tracking-[0.2em] text-gray-400">
                STUDIO
              </span>
            </div>
          </div>

          <p className="text-body-sm text-adidaya-text-muted text-center mt-3">
            Sign in to access your administrative workspace
          </p>
        </div>

        {/* FORM */}
        <form onSubmit={handleLogin} className="flex flex-col gap-5">
          {/* EMAIL */}
          <div className="flex flex-col gap-2">
            <label className="text-xs text-gray-300 font-medium">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              placeholder="email@adidayastudio.id"
              autoComplete="email"
              style={{ paddingLeft: "2.25rem", paddingRight: "2.25rem" }}
              className="w-full rounded-full border border-white/10 bg-black/50 py-3.5 text-white placeholder-gray-500 focus:border-white/30 focus:bg-white/[0.04] focus:outline-none text-sm transition-all duration-200"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label className="text-xs text-gray-300 font-medium">
                Password
              </label>
              <Link
                href="/forgot"
                className="text-xs text-adidaya-text-muted hover:text-white transition-colors"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ paddingLeft: "2.25rem", paddingRight: "3.25rem" }}
                className="w-full rounded-full border border-white/10 bg-black/50 py-3.5 text-white placeholder-gray-500 focus:border-white/30 focus:bg-white/[0.04] focus:outline-none text-sm transition-all duration-200"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 rounded-full"
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.5} />
                ) : (
                  <Eye size={18} strokeWidth={1.5} />
                )}
              </button>
            </div>
          </div>

          {/* ERROR ALERT */}
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2.5 p-3.5 rounded-2xl bg-red-500/10 border border-red-500/25 text-red-400 text-xs"
            >
              <AlertCircle size={16} strokeWidth={1.5} className="shrink-0 text-adidaya-red" />
              <span>{errorMsg}</span>
            </motion.div>
          )}

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-full bg-adidaya-red py-3.5 font-medium text-white text-sm transition-all duration-300 hover:bg-white hover:text-black flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(229,57,53,0.35)] hover:shadow-[0_0_25px_rgba(255,255,255,0.25)] disabled:opacity-50 disabled:cursor-not-allowed select-none"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* FOOTER */}
        <div className="mt-8 pt-6 border-t border-white/10 flex items-center justify-center">
          <Link
            href="/"
            className="text-xs text-adidaya-text-muted hover:text-white transition-colors flex items-center gap-1.5 group"
          >
            <ArrowLeft
              size={13}
              strokeWidth={1.5}
              className="transition-transform duration-200 group-hover:-translate-x-0.5"
            />
            <span>Back to main website</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}


