import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    if (typeof body.website === "string" && body.website.trim()) {
      return NextResponse.json({ ok: true, emailSent: false });
    }

    const name = String(body.name || "").trim();
    const email = String(body.email || "").trim();
    const message = String(body.message || "").trim();

    if (
      name.length < 2 || name.length > 120 ||
      email.length < 5 || email.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
      message.length < 5 || message.length > 5000
    ) {
      return NextResponse.json({ error: "Invalid enquiry details" }, { status: 400 });
    }

    const url = process.env.SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
    const key = process.env.SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

    const enquiry = {
      name,
      email,
      company: String(body.company || "").slice(0, 200),
      country: String(body.country || "Not specified").slice(0, 100),
      whatsapp: String(body.whatsapp || "").slice(0, 100),
      product_category: String(body.product_category || "").slice(0, 80),
      product_name: String(body.product_name || "").slice(0, 200),
      quantity: String(body.quantity || "").slice(0, 100),
      message,
      source_path: request.headers.get("referer") || null
    };

    // Save first: a temporary email-provider failure must never discard a customer enquiry.
    const response = await fetch(`${url}/rest/v1/inquiries`, {
      method: "POST",
      headers: {
        apikey: key,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify(enquiry)
    });

    if (!response.ok) {
      const detail = await response.text();
      console.error("Inquiry database insert failed:", response.status, detail);
      return NextResponse.json({ error: "Could not save enquiry. Please try again." }, { status: 502 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("Inquiry saved, but RESEND_API_KEY is not configured.");
      return NextResponse.json({ ok: true, emailSent: false, notification: "not_configured" });
    }

    const to = process.env.INQUIRY_TO_EMAIL || "alidjie@gmail.com";
    const from = process.env.RESEND_FROM_EMAIL || "YOUJIU Website <onboarding@resend.dev>";
    const emailText = [
      "A new business enquiry has been submitted on the YOUJIU website.",
      "",
      `Name: ${name}`,
      `Email: ${email}`,
      `Company: ${enquiry.company || "Not provided"}`,
      `Country: ${enquiry.country}`,
      `WhatsApp / Phone: ${enquiry.whatsapp || "Not provided"}`,
      `Product category: ${enquiry.product_category || "Not specified"}`,
      `Model / product: ${enquiry.product_name || "Not specified"}`,
      `Estimated quantity: ${enquiry.quantity || "Not specified"}`,
      "",
      "Requirements:",
      message
    ].join("\n");

    try {
      const mailResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from,
          to: [to],
          reply_to: email,
          subject: `New YOUJIU website enquiry - ${name}`,
          text: emailText
        })
      });

      if (!mailResponse.ok) {
        const detail = await mailResponse.text();
        console.error("Inquiry email delivery failed:", mailResponse.status, detail);
        return NextResponse.json({ ok: true, emailSent: false, notification: "send_failed" });
      }
    } catch (mailError) {
      console.error("Inquiry email request failed:", mailError);
      return NextResponse.json({ ok: true, emailSent: false, notification: "send_failed" });
    }

    return NextResponse.json({ ok: true, emailSent: true });
  } catch (error) {
    console.error("Inquiry request failed:", error);
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
