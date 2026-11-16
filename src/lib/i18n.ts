import { headers } from "next/headers";

export const SUPPORTED_LOCALES = ["en", "fr", "de", "es", "ar", "ru", "pt"] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];
export const localeNames: Record<Locale, string> = { en: "English", fr: "Français", de: "Deutsch", es: "Español", ar: "العربية", ru: "Русский", pt: "Português" };

export async function getLocale(): Promise<Locale> {
  const requestHeaders = await headers();
  const value = requestHeaders.get("x-youjiu-locale") || "en";
  return (SUPPORTED_LOCALES as readonly string[]).includes(value) ? value as Locale : "en";
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

export async function applyTranslation<T extends object>(locale: Locale, entityType: string, entityId: string, source: T): Promise<T> {
  if (locale === "en") return source;
  try {
    const query = new URLSearchParams({ select: "translated_content", entity_type: `eq.${entityType}`, entity_id: `eq.${entityId}`, locale: `eq.${locale}`, status: "eq.published", limit: "1" });
    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_translations?${query}`, { headers: { apikey: SUPABASE_KEY }, next: { revalidate: 60 } });
    if (!response.ok) return source;
    const rows = await response.json() as Array<{ translated_content?: Partial<T> }>;
    return rows[0]?.translated_content ? { ...source, ...rows[0].translated_content } as T : source;
  } catch { return source; }
}
