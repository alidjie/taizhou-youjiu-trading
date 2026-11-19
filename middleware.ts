import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "fr", "de", "es", "ar", "ru", "pt"] as const;
type Locale = typeof locales[number];
const localePattern = /^\/(en|fr|de|es|ar|ru|pt)(?=\/|$)/i;

function detectLocale(request: NextRequest): Locale {
  const accepted = request.headers.get("accept-language") || "";
  for (const language of accepted.split(",").map(value => value.trim().split(";")[0].toLowerCase())) {
    const match = locales.find(locale => language === locale || language.startsWith(locale + "-"));
    if (match) return match;
  }
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hostname = (request.headers.get("host") || "").split(":")[0].toLowerCase();

  // The CRM runs on its own subdomain. Internally map its root to /crm
  // without exposing /crm in the browser URL or applying the public-site locale redirect.
  if (hostname === "crm.almcp.com") {
    if (pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico" || /\\.[^/]+$/.test(pathname)) {
      return NextResponse.next();
    }

    const destination = request.nextUrl.clone();
    if (pathname === "/") {
      destination.pathname = "/crm";
    } else if (!pathname.startsWith("/crm")) {
      destination.pathname = `/crm${pathname}`;
    }
    return NextResponse.rewrite(destination);
  }
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname === "/favicon.ico" || /\.[^/]+$/.test(pathname)) {
    return NextResponse.next();
  }

  const match = pathname.match(localePattern);
  if (match) {
    const locale = match[1].toLowerCase() as Locale;
    const rewrittenPath = pathname.replace(localePattern, "") || "/";
    const destination = request.nextUrl.clone();
    destination.pathname = rewrittenPath;
    const headers = new Headers(request.headers);
    headers.set("x-youjiu-locale", locale);
    const response = NextResponse.rewrite(destination, { request: { headers } });
    response.cookies.set("youjiu-locale", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return response;
  }

  const saved = request.cookies.get("youjiu-locale")?.value;
  const locale = saved && locales.includes(saved as Locale) ? saved as Locale : detectLocale(request);
  if (locale !== "en") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/" + locale + (pathname === "/" ? "" : pathname);
    return NextResponse.redirect(destination);
  }

  const headers = new Headers(request.headers);
  headers.set("x-youjiu-locale", "en");
  return NextResponse.next({ request: { headers } });
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"] };
