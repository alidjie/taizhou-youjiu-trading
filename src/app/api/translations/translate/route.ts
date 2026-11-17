import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";
const localeNames: Record<string, string> = {
  fr: "French", de: "German", es: "Spanish", ar: "Arabic", ru: "Russian", pt: "Portuguese"
};

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const token = authorization.replace(/^Bearer\s+/i, "").trim();
    if (!token || token === authorization) {
      return NextResponse.json({ error: "Authentication token missing or malformed. Please sign in to the CMS again." }, { status: 401 });
    }

    const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!userResponse.ok) {
      return NextResponse.json({ error: "Your admin session is invalid or expired. Please sign in to the CMS again." }, { status: 401 });
    }
    const user = await userResponse.json() as { id?: string };
    if (!user.id) return NextResponse.json({ error: "Unable to verify account." }, { status: 401 });

    const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/cms_admins?select=user_id&user_id=eq.${encodeURIComponent(user.id)}&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!adminResponse.ok) {
      return NextResponse.json({ error: "Unable to verify CMS administrator permission. Please check your admin account." }, { status: 403 });
    }
    const admins = await adminResponse.json() as Array<{ user_id: string }>;
    if (!admins.length) return NextResponse.json({ error: "CMS administrator permission required." }, { status: 403 });

    const body = await request.json() as { locale?: string; source?: unknown };
    const locale = body.locale || "";
    if (!localeNames[locale]) return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
    if (!body.source || typeof body.source !== "object" || Array.isArray(body.source)) {
      return NextResponse.json({ error: "Source content must be a JSON object." }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GEMINI_API_KEY is not configured in Vercel Production. Add it as a server-side environment variable and redeploy." }, { status: 503 });
    }

    const model = process.env.GEMINI_TRANSLATION_MODEL || "gemini-2.5-flash-lite";
    const instruction = "You are a professional website translator for an international B2B electric mobility and industrial components company. Translate all human-readable string values into " + localeNames[locale] + ". Preserve every JSON key, nesting, number, boolean, URL, SKU, model code, measurement, technical unit, HTML tag and placeholder exactly. Do not translate brand names or alter technical specifications. Do not add claims. Return only a valid JSON object.";
    const aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: instruction }] },
        contents: [{ role: "user", parts: [{ text: JSON.stringify(body.source) }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.2 }
      }),
      cache: "no-store"
    });

    const result = await aiResponse.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      error?: { message?: string };
    };
    if (!aiResponse.ok) {
      return NextResponse.json({ error: result.error?.message || "Gemini translation request failed." }, { status: 502 });
    }
    const output = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!output) return NextResponse.json({ error: "Gemini returned no translation text." }, { status: 502 });

    let translated: unknown;
    try {
      translated = JSON.parse(output);
    } catch {
      return NextResponse.json({ error: "Gemini returned invalid JSON. Please retry or reduce the source content size." }, { status: 502 });
    }
    if (!translated || typeof translated !== "object" || Array.isArray(translated)) {
      return NextResponse.json({ error: "Gemini returned an invalid JSON object." }, { status: 502 });
    }
    return NextResponse.json({ translated, provider: "Google Gemini", model });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Translation failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
