import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";
const localeNames: Record<string, string> = {
  fr: "French", de: "German", es: "Spanish", ar: "Arabic", ru: "Russian", pt: "Portuguese"
};

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace(/^Bearer\\s+/i, "");
    if (!token) return NextResponse.json({ error: "Authentication required." }, { status: 401 });

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!userResponse.ok) return NextResponse.json({ error: "Your admin session has expired." }, { status: 401 });
    const user = await userResponse.json() as { id?: string };
    if (!user.id) return NextResponse.json({ error: "Unable to verify account." }, { status: 401 });

    const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/cms_admins?select=user_id&user_id=eq.${user.id}&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    const admins = adminResponse.ok ? await adminResponse.json() as Array<{ user_id: string }> : [];
    if (!admins.length) return NextResponse.json({ error: "CMS administrator permission required." }, { status: 403 });

    const body = await request.json() as { locale?: string; source?: unknown };
    const locale = body.locale || "";
    if (!localeNames[locale]) return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
    if (!body.source || typeof body.source !== "object") return NextResponse.json({ error: "Source content must be a JSON object." }, { status: 400 });
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured in Vercel. Add it as a server-side environment variable to enable AI translation." }, { status: 503 });
    }

    const aiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.TRANSLATION_MODEL || "gpt-4.1-mini",
        input: [
          { role: "system", content: "Translate the JSON content for a professional international electric mobility and industrial components B2B website. Translate all human-readable string values into " + localeNames[locale] + ". Preserve every JSON key, nesting, number, boolean, URL, SKU, model code, measurement, technical unit, HTML tag and placeholder exactly. Do not add claims or alter technical specifications. Return valid JSON only." },
          { role: "user", content: JSON.stringify(body.source) }
        ],
        text: { format: { type: "json_object" } }
      })
    });
    const result = await aiResponse.json() as { output_text?: string; error?: { message?: string } };
    if (!aiResponse.ok) return NextResponse.json({ error: result.error?.message || "Translation provider request failed." }, { status: 502 });
    if (!result.output_text) return NextResponse.json({ error: "The translation provider returned no JSON output." }, { status: 502 });
    const translated = JSON.parse(result.output_text);
    return NextResponse.json({ translated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
