import { NextRequest, NextResponse } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";
const localeNames: Record<string, string> = { fr: "French", de: "German", es: "Spanish", ar: "Arabic", ru: "Russian", pt: "Portuguese" };

export async function POST(request: NextRequest) {
  try {
    const authorization = request.headers.get("authorization") || "";
    const match = authorization.match(/^Bearer\\s+(.+)$/i);
    const token = match?.[1]?.trim();
    if (!token) return NextResponse.json({ error: "CMS 登录凭证缺失，请返回主后台重新登录后再试。" }, { status: 401 });

    // Validate the access token through the CMS admin table and its RLS policy.
    // This avoids a separate Auth user lookup that was rejecting valid CMS sessions.
    const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/cms_admins?select=user_id&limit=1`, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (adminResponse.status === 401) return NextResponse.json({ error: "Supabase 登录凭证已失效。请在主后台退出后重新登录，再打开翻译管理。" }, { status: 401 });
    if (!adminResponse.ok) return NextResponse.json({ error: `无法验证 CMS 管理员权限（Supabase HTTP ${adminResponse.status}）。请检查管理员账号和数据库权限。` }, { status: 403 });
    const admins = await adminResponse.json() as Array<{ user_id: string }>;
    if (!admins.length) return NextResponse.json({ error: "当前登录账号没有 YOUJIU CMS 管理员权限。" }, { status: 403 });

    const body = await request.json() as { locale?: string; source?: unknown };
    const locale = body.locale || "";
    if (!localeNames[locale]) return NextResponse.json({ error: "Unsupported target language." }, { status: 400 });
    if (!body.source || typeof body.source !== "object" || Array.isArray(body.source)) return NextResponse.json({ error: "Source content must be a JSON object." }, { status: 400 });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "GEMINI_API_KEY is not configured in Vercel Production." }, { status: 503 });

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
    const result = await aiResponse.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>; error?: { message?: string } };
    if (!aiResponse.ok) return NextResponse.json({ error: result.error?.message || `Gemini request failed (HTTP ${aiResponse.status}).` }, { status: 502 });
    const output = result.candidates?.[0]?.content?.parts?.map(part => part.text || "").join("").trim();
    if (!output) return NextResponse.json({ error: "Gemini returned no translation text." }, { status: 502 });

    let translated: unknown;
    try { translated = JSON.parse(output); } catch { return NextResponse.json({ error: "Gemini returned invalid JSON. Please retry or reduce the source content size." }, { status: 502 }); }
    if (!translated || typeof translated !== "object" || Array.isArray(translated)) return NextResponse.json({ error: "Gemini returned an invalid JSON object." }, { status: 502 });
    return NextResponse.json({ translated, provider: "Google Gemini", model });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Translation failed." }, { status: 500 });
  }
}
