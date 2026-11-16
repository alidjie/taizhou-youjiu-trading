import { NextRequest, NextResponse } from "next/server";

const locales = ["en", "fr", "de", "es", "ar", "ru", "pt"] as const;
const localePattern = new RegExp("^/(" + locales.join("|") + ")(?=/|$)", "i");

function detectLocale(request: NextRequest) {
  const accepted = request.headers.get("accept-language") || "";
  const preferred = accepted.split(",").map(value => value.trim().split(";")[0].toLowerCase());
  for (const language of preferred) {
    const match = locales.find(locale => language === locale || language.startsWith(locale + "-"));
    if (match) return match;
  }
  return "en";
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const localeMatch = pathname.match(localePattern);
  if (localeMatch) {
    const locale = localeMatch[1].toLowerCase();
    const rewritten = request.nextUrl.clone();
    const stripped = pathname.replace(localePattern, "") || "/";
    rewritten.pathname = stripped;
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set("x-youjiu-locale", locale);
    const response = NextResponse.rewrite(rewritten, { request: { headers: requestHeaders } });
    response.cookies.set("youjiu-locale", locale, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
    return response;
  }

  const savedLocale = request.cookies.get("youjiu-locale")?.value;
  if (!savedLocale && pathname !== "/") {
    const detected = detectLocale(request);
    if (detected !== "en") {
      const target = request.nextUrl.clone();
      target.pathname = "/" + detected + pathname;
      return NextResponse.redirect(target);
    }
  }
  if (!savedLocale && pathname === "/") {
    const detected = detectLocale(request);
    if (detected !== "en") {
      const target = request.nextUrl.clone();
      target.pathname = "/" + detected;
      return NextResponse.redirect(target);
    }
  }
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-youjiu-locale", savedLocale && locales.includes(savedLocale as typeof locales[number]) ? savedLocale : "en");
  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"]
};
