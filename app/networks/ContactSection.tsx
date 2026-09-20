// components/network/ContactSection.tsx
"use client";

import {
  Instagram,
  Mail,
  MessageCircle,
} from "lucide-react";

export default function ContactSection() {
  const cards = [
    {
      id: "ig",
      title: "Find us on Instagram",
      highlight: "@adidayastudio",
      icon: <Instagram className="w-7 h-7 opacity-80" />,
      href: "https://instagram.com/adidayastudio",
      variant: "red",
    },
    {
      id: "email",
      title: "Reach us out",
      highlight: "adidayastudio@gmail.com",
      icon: <Mail className="w-7 h-7 opacity-80" />,
      href: "mailto:adidayastudio@gmail.com",
      variant: "light",
    },
    {
      id: "wa",
      title: "Get in touch",
      highlight: "WhatsApp",
      icon: <MessageCircle className="w-7 h-7 opacity-80" />,
      href:
        "https://wa.me/6281234567890?text=" +
        encodeURIComponent("Hi Adidaya Studio, I would like to ..."),
      variant: "light",
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {cards.map((card) => (
        <a
          key={card.id}
          href={card.href}
          target="_blank"
          className={`
            relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-64 
            transition transform
            ${
              card.variant === "red"
                ? "bg-[#e34234] text-white hover:-translate-y-1 hover:shadow-xl"
                : "bg-[#f6f6f6] text-black hover:-translate-y-1 hover:shadow-xl"
            }
          `}
        >
          <div className="mb-4">{card.icon}</div>

          <div className="mt-auto">
            <p className="text-xs uppercase tracking-[0.15em] opacity-80 mb-1">
              {card.title}
            </p>

            {/* AUTO WRAP EMAIL / TEXT */}
            <p className="text-base sm:text-lg font-semibold break-all leading-snug">
              {card.highlight}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}
