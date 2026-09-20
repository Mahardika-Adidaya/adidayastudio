"use client";

import { Map, SunMedium, Network, GitBranch, ShieldCheck } from "lucide-react";

export default function PillarsSection() {
  const pillars = [
    {
      title: "Context-Led",
      desc: "Every design begins by honoring the land and the stories already living there.",
      icon: <Map className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Experience First",
      desc: "Spaces are shaped to be felt—through light, rhythm, sound, and human presence.",
      icon: <SunMedium className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Integrated Systems",
      desc: "Architecture, structure, and technology move as one cohesive system.",
      icon: <Network className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Adaptive Future",
      desc: "Designs that evolve gracefully as needs shift and time unfolds.",
      icon: <GitBranch className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
    },
    {
      title: "Enduring Values",
      desc: "Guided by durability, efficiency, and a responsibility toward the environment.",
      icon: <ShieldCheck className="w-12 h-12 text-adidaya-red" strokeWidth={1.5} />,
    },
  ];

  return (
    <div className="flex flex-col place-items-center mt-10">
      <p className="text-gray-300 max-w-3xl text-center leading-relaxed mb-16">
        At Adidaya, our work is anchored in principles that frame how spaces
        take shape, how systems connect, and how architecture becomes an
        experience to feel.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10 w-full max-w-7xl px-6">
        {pillars.map((item, i) => (
          <div key={i} className="flex flex-col items-center text-center">
            {/* Glassy Card */}
            <div className="w-32 h-32 rounded-3xl bg-white/[0.04] backdrop-blur-md border border-white/10 mb-5 flex items-center justify-center shadow-lg shadow-black/40">
              {item.icon}
            </div>

            <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
            <p className="text-sm text-gray-400 leading-relaxed">{item.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
