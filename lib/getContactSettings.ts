import { supabase } from "@/lib/supabaseClient";

export type ContactSettings = {
  id?: number;
  instagram_handle: string;
  instagram_url: string;
  email: string;
  whatsapp_number: string;
  whatsapp_message: string;
  updated_at?: string;
};

export const DEFAULT_CONTACT_SETTINGS: ContactSettings = {
  instagram_handle: "@adidayastudio",
  instagram_url: "https://instagram.com/adidayastudio",
  email: "adidayastudio@gmail.com",
  whatsapp_number: "6281295845860",
  whatsapp_message: "Hi Adidaya Studio, I would like to consult about ...",
};

export async function getContactSettings(): Promise<ContactSettings> {
  try {
    const { data, error } = await supabase
      .from("contact_settings")
      .select("*")
      .eq("id", 1)
      .limit(1);

    if (error || !data || data.length === 0) {
      return DEFAULT_CONTACT_SETTINGS;
    }

    return {
      ...DEFAULT_CONTACT_SETTINGS,
      ...data[0],
    };
  } catch (err) {
    console.error("Fetch contact_settings error:", err);
    return DEFAULT_CONTACT_SETTINGS;
  }
}
