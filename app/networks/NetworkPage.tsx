"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import ContactSection from "./ContactSection";
import CareerSection from "./CareerSection";

export default function NetworkPage() {
  const [activeTab, setActiveTab] = useState<"contact" | "career">("contact");
  const dockRef = useRef<HTMLDivElement>(null);

  const scrollToCenter = (element: HTMLElement | null) => {
    if (!element || !dockRef.current) return;
    const container = dockRef.current;
    const elementLeft = element.offsetLeft;
    const elementWidth = element.offsetWidth;
    const containerWidth = container.offsetWidth;

    const targetScrollLeft = elementLeft - containerWidth / 2 + elementWidth / 2;

    container.scrollTo({
      left: targetScrollLeft,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    if (dockRef.current) {
      const activeButton = dockRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      if (activeButton) {
        scrollToCenter(activeButton);
      }
    }
  }, [activeTab]);

  return (
    <main className="min-h-screen bg-adidaya-black text-white flex flex-col items-center pt-16 pb-24 px-6 sm:px-8 md:px-10">
      {/* Title */}
      <h1 className="text-center text-5xl font-bold mb-12 tracking-tight">
        <span className="text-adidaya-red">*</span> Networks
      </h1>

      {/* Tabs */}
      <div className="flex justify-center mb-16 px-2 max-w-full">
        <div
          ref={dockRef}
          className="border border-adidaya-red rounded-full p-2 flex gap-2 overflow-x-auto no-scrollbar max-w-full relative"
        >
          <button
            data-active={activeTab === "contact"}
            onClick={(e) => {
              setActiveTab("contact");
              scrollToCenter(e.currentTarget);
            }}
            className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none shrink-0
              ${
                activeTab === "contact"
                  ? "text-white font-bold"
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
            data-active={activeTab === "career"}
            onClick={(e) => {
              setActiveTab("career");
              scrollToCenter(e.currentTarget);
            }}
            className={`relative px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 whitespace-nowrap z-10 select-none shrink-0
              ${
                activeTab === "career"
                  ? "text-white font-bold"
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
      </div>

      {/* Content */}
      <section className="w-full max-w-5xl">
        {activeTab === "contact" ? <ContactSection /> : <CareerSection />}
      </section>
    </main>
  );
}

