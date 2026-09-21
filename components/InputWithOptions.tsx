"use client";

import { useState, useRef, useEffect } from "react";
import { FiChevronDown, FiCheck } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

export default function InputWithOptions({
  label,
  value,
  placeholder,
  onChange,
  options = [],
  className = "",
  error,
}: {
  label?: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  options?: string[];
  className?: string;
  error?: string | boolean;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes((value || "").toLowerCase())
  );
  // If user typed something not matching or exact match, still allow full list on click
  const displayOptions = filteredOptions.length > 0 ? filteredOptions : options;

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {label && (
        <label className="block mb-1 text-xs uppercase tracking-[0.2em] text-gray-500">
          {label}
        </label>
      )}

      <div
        onClick={() => setOpen((prev) => !prev)}
        className={`
          w-full bg-[#111] border rounded-full px-4 py-3 cursor-pointer flex items-center justify-between transition-all duration-200
          ${
            error
              ? "border-adidaya-red ring-1 ring-adidaya-red/30"
              : open
              ? "border-white/40 ring-1 ring-white/10"
              : "border-gray-800 hover:border-gray-600"
          }
        `}
      >
        <input
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          className="bg-transparent text-white w-full outline-none text-xs sm:text-sm placeholder:text-gray-500"
        />

        <button
          type="button"
          tabIndex={-1}
          aria-label="Toggle options dropdown"
          className="text-gray-400 hover:text-white transition-colors shrink-0 ml-2"
        >
          <FiChevronDown
            size={16}
            className={`transition-transform duration-200 ${
              open ? "rotate-180 text-white" : "rotate-0"
            }`}
          />
        </button>
      </div>

      <AnimatePresence>
        {open && displayOptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-2 w-full bg-[#121212]/95 backdrop-blur-xl border border-white/15 rounded-2xl max-h-56 overflow-y-auto shadow-2xl shadow-black/80 z-50 p-1.5 space-y-0.5"
          >
            {displayOptions.map((opt) => {
              const isSelected = value === opt;
              return (
                <div
                  key={opt}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(opt);
                    setOpen(false);
                  }}
                  className={`
                    w-full px-3.5 py-2.5 text-xs sm:text-sm font-medium rounded-xl cursor-pointer flex items-center justify-between transition-colors
                    ${
                      isSelected
                        ? "text-adidaya-red font-semibold bg-white/[0.08]"
                        : "text-gray-300 hover:text-white hover:bg-white/[0.06]"
                    }
                  `}
                >
                  <span className="truncate">{opt}</span>
                  {isSelected && (
                    <FiCheck size={14} className="text-adidaya-red shrink-0 ml-2" />
                  )}
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {error && typeof error === "string" && (
        <p className="mt-1 text-xs text-red-400">{error}</p>
      )}
    </div>
  );
}
