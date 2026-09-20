"use client";

import { Map, SunMedium, Network, GitBranch, ShieldCheck } from "lucide-react";

export default function PillarsSection() {
  const pillars = [
    {
      title: "Context-Led",
      desc: "Every design begins by honoring the land and the stories already living there.",
      icon: <Map className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
      mobileIcon: <Map className="w-7 h-7 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Experience First",
      desc: "Spaces are shaped to be felt—through light, rhythm, sound, and human presence.",
      icon: <SunMedium className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
      mobileIcon: <SunMedium className="w-7 h-7 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Integrated Systems",
      desc: "Architecture, structure, and technology move as one cohesive system.",
      icon: <Network className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
      mobileIcon: <Network className="w-7 h-7 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Adaptive Future",
      desc: "Designs that evolve gracefully as needs shift and time unfolds.",
      icon: <GitBranch className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
      mobileIcon: <GitBranch className="w-7 h-7 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Enduring Values",
      desc: "Guided by durability, efficiency, and a responsibility toward the environment.",
      icon: <ShieldCheck className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
      mobileIcon: <ShieldCheck className="w-7 h-7 text-adidaya-red" strokeWidth={1.5} />,
    },
  ];

  return (
    <div className="flex flex-col place-items-center mt-6 md:mt-10">
      <p className="text-gray-300 max-w-3xl text-center text-sm md:text-base leading-relaxed mb-12 md:mb-16 px-4">
        At Adidaya, our work is anchored in principles that frame how spaces
        take shape, how systems connect, and how architecture becomes an
        experience to feel.
      </p>

      {/* ======================================================== */}
      {/* 1. VERSI DESKTOP (TERKUNCI & TERISOLASI)                 */}
      {/* 5 Kolom Grid | Box Atas (w-32) | Teks Center di Bawah    */}
      {/* ======================================================== */}
      <div className="pillars-desktop-grid gap-8 lg:gap-10 w-full max-w-7xl px-6">
        {pillars.map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            <div className="w-32 h-32 rounded-3xl bg-white/[0.04] backdrop-blur-md border border-white/10 mb-5 flex items-center justify-center shadow-lg shadow-black/40">
              {item.icon}
            </div>

            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* ======================================================== */}
      {/* 2. VERSI MOBILE (TERKUNCI & TERISOLASI)                  */}
      {/* Baris Vertikal | Box Kiri (w-16) | Teks di Kanan         */}
      {/* ======================================================== */}
      <div className="pillars-mobile-list gap-5 w-full px-2">
        {pillars.map((item, i) => (
          <div key={i} className="flex flex-row items-center text-left gap-4">
            <div className="w-16 h-16 shrink-0 rounded-2xl bg-white/[0.04] backdrop-blur-md border border-white/10 flex items-center justify-center shadow-md shadow-black/40">
              {item.mobileIcon}
            </div>

            <div className="flex flex-col">
              <h3 className="text-base font-semibold text-white mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-gray-400 leading-relaxed">
                {item.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* CSS ISOLATION TO PREVENT UTILITY CLASHES */}
      <style jsx>{`
        .pillars-desktop-grid {
          display: none;
        }
        .pillars-mobile-list {
          display: flex;
          flex-direction: column;
        }
        @media (min-width: 768px) {
          .pillars-desktop-grid {
            display: grid !important;
            grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
          }
          .pillars-mobile-list {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
