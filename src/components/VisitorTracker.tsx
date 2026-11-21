"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

function canonicalPath(path: string) {
  return path.replace(/^\/(en|fr|de|es|ar|ru|pt)(?=\/|$)/i, "") || "/";
}

function isProductDetail(path: string) {
  const clean = canonicalPath(path);
  return /^\/products\/[^/]+\/[^/]+\/?$/.test(clean) || /^\/products\/detail\/[^/]+\/?$/.test(clean);
}

function isInquiry(path: string) {
  return /^\/inquiry\/?$/i.test(canonicalPath(path));
}

export default function VisitorTracker() {
  const pathname = usePathname();
  const visitorIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname.startsWith("/admin") || pathname.startsWith("/crm")) return;

    if (!visitorIdRef.current) visitorIdRef.current = crypto.randomUUID();
    const visitorId = visitorIdRef.current;
    const productPage = isProductDetail(pathname);
    const inquiryPage = isInquiry(pathname);
    let activeSeconds = 0;
    let lastTick = Date.now();
    let productEngagementSent = false;
    let disposed = false;

    const send = (eventType: string, keepalive = false) => {
      const payload = {
        visitor_id: visitorId,
        event_type: eventType,
        path: pathname,
        page_title: document.title,
        referrer: document.referrer,
        duration_seconds: activeSeconds
      };
      try {
        void fetch("/api/analytics/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          keepalive
        }).catch(() => undefined);
      } catch { /* analytics must never interrupt website navigation */ }
    };

    send(inquiryPage ? "inquiry_view" : "page_view");

    const tick = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        const now = Date.now();
        activeSeconds += Math.max(0, Math.min(3, Math.floor((now - lastTick) / 1000)));
        if (productPage && activeSeconds >= 20 && !productEngagementSent) {
          productEngagementSent = true;
          send("product_engaged");
        }
      }
      lastTick = Date.now();
    }, 1000);

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState === "visible") send("heartbeat");
    }, 15000);

    const onVisibility = () => {
      lastTick = Date.now();
      if (document.visibilityState === "hidden") send("heartbeat", true);
    };
    const onPageHide = () => send("page_exit", true);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);

    return () => {
      disposed = true;
      window.clearInterval(tick);
      window.clearInterval(heartbeat);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      if (!disposed) return;
      send("page_exit", true);
    };
  }, [pathname]);

  return null;
}
