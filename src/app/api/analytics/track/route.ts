import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

type TrackPayload = {
  visitor_id?: string;
  event_type?: string;
  path?: string;
  page_title?: string;
  referrer?: string;
  duration_seconds?: number;
};

function clip(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const clean = value.trim().slice(0, max);
  return clean || null;
}

function deviceFromAgent(agent: string): "desktop" | "mobile" | "tablet" | "unknown" {
  if (/ipad|tablet|kindle|silk/i.test(agent)) return "tablet";
  if (/mobile|iphone|ipod|android/i.test(agent)) return "mobile";
  if (agent) return "desktop";
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as TrackPayload;
    const visitorId = clip(body.visitor_id, 36);
    const eventType = clip(body.event_type, 30);
    const path = clip(body.path, 500);
    const allowedEvents = new Set(["page_view", "heartbeat", "page_exit", "product_engaged", "inquiry_view"]);
    if (!visitorId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(visitorId)
      || !eventType || !allowedEvents.has(eventType) || !path || !path.startsWith("/")) {
      return NextResponse.json({ error: "Invalid analytics event" }, { status: 400 });
    }

    const duration = Number.isFinite(body.duration_seconds) ? Math.max(0, Math.min(86400, Math.floor(body.duration_seconds || 0))) : 0;
    const countryHeader = request.headers.get("x-vercel-ip-country") || "";
    const region = clip(request.headers.get("x-vercel-ip-country-region"), 100);
    const city = clip(request.headers.get("x-vercel-ip-city"), 100);
    const country = /^[A-Za-z]{2}$/.test(countryHeader) ? countryHeader.toUpperCase() : null;
    const userAgent = request.headers.get("user-agent") || "";
    let referrerDomain: string | null = null;
    const referrer = clip(body.referrer, 1000);
    if (referrer) {
      try { referrerDomain = new URL(referrer).hostname.slice(0, 255); } catch { /* ignore invalid referrer */ }
    }

    const row = {
      visitor_id: visitorId,
      event_type: eventType,
      path,
      page_title: clip(body.page_title, 300),
      referrer_domain: referrerDomain,
      duration_seconds: duration,
      country,
      region,
      city,
      device_type: deviceFromAgent(userAgent)
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/site_analytics_events`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(row)
    });
    if (!response.ok) {
      const detail = await response.text();
      console.error("Website analytics insert failed:", response.status, detail);
      return NextResponse.json({ error: "Analytics storage unavailable" }, { status: 502 });
    }
    return NextResponse.json({ ok: true }, { status: 202 });
  } catch (error) {
    console.error("Website analytics request failed:", error);
    return NextResponse.json({ error: "Invalid analytics request" }, { status: 400 });
  }
}
