// components/network/ContactSection.tsx
"use client";

import { useEffect, useState } from "react";
import { Instagram, Mail, MessageCircle } from "lucide-react";
import {
  getContactSettings,
  DEFAULT_CONTACT_SETTINGS,
  type ContactSettings,
} from "@/lib/getContactSettings";

export default function ContactSection() {
  const [settings, setSettings] = useState<ContactSettings>(
    DEFAULT_CONTACT_SETTINGS
  );

  useEffect(() => {
    async function load() {
      const data = await getContactSettings();
      setSettings(data);
    }
    load();
  }, []);

  const cleanWaNumber =
    settings.whatsapp_number?.replace(/[^0-9]/g, "") || "6281295845860";
  const whatsappHref = `https://wa.me/${cleanWaNumber}?text=${encodeURIComponent(
    settings.whatsapp_message || "Hi Adidaya Studio, I would like to ..."
  )}`;

  const cards = [
    {
      id: "ig",
      title: "Find us on Instagram",
      highlight: settings.instagram_handle || "@adidayastudio",
      icon: <Instagram className="w-7 h-7 opacity-80" />,
      href: settings.instagram_url || "https://instagram.com/adidayastudio",
      variant: "red",
    },
    {
      id: "email",
      title: "Reach us out",
      highlight: settings.email || "adidayastudio@gmail.com",
      icon: <Mail className="w-7 h-7 opacity-80" />,
      href: `mailto:${settings.email || "adidayastudio@gmail.com"}`,
      variant: "light",
    },
    {
      id: "wa",
      title: "Get in touch",
      highlight: "WhatsApp",
      icon: <MessageCircle className="w-7 h-7 opacity-80" />,
      href: whatsappHref,
      variant: "light",
    },
  ];

  return (
    <div className="grid gap-5 md:gap-6 md:grid-cols-3 max-w-[340px] sm:max-w-md md:max-w-5xl mx-auto w-full">
      {cards.map((card) => (
        <a
          key={card.id}
          href={card.href}
          target="_blank"
          rel="noopener noreferrer"
          className={`
            relative rounded-3xl p-6 sm:p-8 flex flex-col justify-between h-56 sm:h-64 
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
