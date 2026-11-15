import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.website === "string" && body.website.trim()) return NextResponse.json({ ok: true });
    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();
    if (name.length < 2 || name.length > 120 || email.length < 5 || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || message.length < 5 || message.length > 5000) {
      return NextResponse.json({ error: "Invalid enquiry details" }, { status: 400 });
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return NextResponse.json({ error: "Enquiry service is not configured" }, { status: 503 });
    const response = await fetch(`${url}/rest/v1/inquiries`, {
      method: "POST",
      headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({
        name, email, company: String(body.company || "").slice(0,200), country: String(body.country || "").slice(0,100),
        whatsapp: String(body.whatsapp || "").slice(0,100), product_category: String(body.product_category || "").slice(0,80),
        product_name: String(body.product_name || "").slice(0,200), quantity: String(body.quantity || "").slice(0,100),
        message, source_path: request.headers.get("referer") || null
      })
    });
    if (!response.ok) return NextResponse.json({ error: "Could not save enquiry" }, { status: 502 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
