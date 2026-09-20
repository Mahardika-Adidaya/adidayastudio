"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProcessSection() {
  const scrollRef = useRef<HTMLDivElement>(null);

  const steps = [
    {
      id: 1,
      title: "Discovery",
      short: "Uncovering Context and Intention",
      detail: [
        "Reading context, site, and human patterns",
        "Listening to the project’s vision and needs",
        "Finding an honest starting point",
      ],
    },
    {
      id: 2,
      title: "Insight Forming",
      short: "Shaping Meaning Into Direction",
      detail: [
        "Turning findings into a design narrative",
        "Weaving intuition, ideas, and function",
        "Defining the guiding thread",
      ],
    },
    {
      id: 3,
      title: "Design Crafting",
      short: "Transforming Ideas Into Space",
      detail: [
        "Shaping spaces, flows, and atmospheres",
        "Refining details, materials, light, and systems",
        "Aligning architecture with technical and operational needs",
      ],
    },
    {
      id: 4,
      title: "Documentation",
      short: "Turning Design Into Clarity",
      detail: [
        "Translating design into clear drawings and specifications",
        "Preparing documents for coordination and execution",
        "Ensuring the original intent carries into construction",
      ],
    },
    {
      id: 5,
      title: "Supervision",
      short: "Guiding the Design to Life",
      detail: [
        "Guiding implementation on site",
        "Upholding quality, detail, and design integrity",
        "Supporting the project until the space comes alive",
      ],
    },
  ];

  const [active, setActive] = useState(1);

  return (
    <section className="w-full flex flex-col items-center mt-0">
      {/* WRAPPER untuk overlay + scroll area */}
      <div className="relative w-full py-12">
        {/* LEFT GRADIENT OVERLAY */}
        <div className="pointer-events-none absolute left-0 top-0 h-full w-16 bg-gradient-to-r from-black to-transparent z-30" />

        {/* RIGHT GRADIENT OVERLAY */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-16 bg-gradient-to-l from-black to-transparent z-30" />

        {/* SCROLLABLE HORIZONTAL AREA */}
        <div
          ref={scrollRef}
          className="overflow-x-auto overflow-y-hidden no-scrollbar w-full"
        >
          <div className="relative min-w-[900px] px-6">
            {/* RED LINE */}
            <div className="absolute top-[12px] left-0 right-0 h-[2px] bg-adidaya-red" />

            {/* STEPS */}
            <div className="flex justify-between relative">
              {steps.map((step) => {
                const isActive = active === step.id;
                return (
                  <div
                    key={step.id}
                    className="flex flex-col items-center w-[160px] relative cursor-pointer"
                    onClick={() => setActive(step.id)}
                  >
                    {/* DOT */}
                    <div className="relative flex items-center justify-center w-6 h-6 z-10">
                      {isActive ? (
                        <motion.div
                          layoutId="process-active-dot"
                          className="w-6 h-6 rounded-full bg-adidaya-red border-2 border-adidaya-red"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-gray-500 bg-black" />
                      )}
                    </div>

                    {/* BUTTON */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActive(step.id);
                      }}
                      className={`relative mt-2 px-6 py-2 rounded-full border text-sm whitespace-nowrap transition-colors duration-200 z-10 ${
                        isActive
                          ? "text-white border-transparent"
                          : "bg-neutral-200 text-black border-gray-500 hover:bg-white"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="process-active-pill"
                          className="absolute inset-0 bg-adidaya-red rounded-full border border-adidaya-red -z-10"
                          transition={{
                            type: "spring",
                            stiffness: 400,
                            damping: 30,
                          }}
                        />
                      )}
                      {step.title}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* DETAIL SECTION */}
      <div className="w-full max-w-4xl px-6">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, x: 15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
            >
              <h3 className="text-xl md:text-2xl font-semibold text-adidaya-red mb-4">
                {steps[active - 1].title}
              </h3>

              <p className="text-gray-300 mb-6">{steps[active - 1].short}</p>

              <ul className="space-y-3">
                {steps[active - 1].detail.map((d, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-adidaya-red rounded-full mt-2" />
                    <p className="text-gray-300 text-sm md:text-base leading-relaxed">
                      {d}
                    </p>
                  </li>
                ))}
              </ul>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
