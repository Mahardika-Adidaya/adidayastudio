"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import ContactSection from "./ContactSection";
import CareerSection from "./CareerSection";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"contact" | "career">("contact");

  return (
    <main className="min-h-screen bg-adidaya-black text-white flex flex-col items-center pt-16 pb-24">
      {/* Title */}
      <h1 className="text-center text-5xl font-bold mb-12 tracking-tight">
        <span className="text-adidaya-red">*</span> Networks
      </h1>

      {/* Tabs */}
      <div className="border border-adidaya-red rounded-full p-2 flex gap-3 mb-16 overflow-x-auto no-scrollbar max-w-full relative">
        <button
          onClick={() => setActiveTab("contact")}
          className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 z-10 select-none
            ${
              activeTab === "contact"
                ? "text-white font-extrabold"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }
          `}
        >
          {activeTab === "contact" && (
            <motion.div
              layoutId="network-tab-active"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute inset-0 bg-adidaya-red rounded-full -z-10 shadow-md shadow-red-900/40"
            />
          )}
          <span>Contact</span>
        </button>

        <button
          onClick={() => setActiveTab("career")}
          className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 z-10 select-none
            ${
              activeTab === "career"
                ? "text-white font-extrabold"
                : "bg-gray-200 text-gray-800 hover:bg-gray-300"
            }
          `}
        >
          {activeTab === "career" && (
            <motion.div
              layoutId="network-tab-active"
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="absolute inset-0 bg-adidaya-red rounded-full -z-10 shadow-md shadow-red-900/40"
            />
          )}
          <span>Career</span>
        </button>
      </div>

      {/* Content */}
      <section className="w-full max-w-5xl px-4">
        {activeTab === "contact" ? <ContactSection /> : <CareerSection />}
      </section>
    </main>
  );
}
