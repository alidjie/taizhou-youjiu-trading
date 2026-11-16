import { NextRequest, NextResponse } from "next/server";
const locales = ["en", "fr", "de", "es", "ar", "ru", "pt"] as const;
const localePattern = new RegExp("^/(" + locales.join("|") + ")(?=/|$)", "i");
function detectLocale(request: NextRequest) {
  const accepted = request.headers.get("accept-language") || "";
  for (const language of accepted.split(",").map(value => value.trim().split(";")[0].toLowerCase())) {
    const match = locales.find(locale => language === locale || language.startsWith(locale + "-"));
    if (match) return match;
  }
  return "en";
}
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/admin") || pathname.startsWith("/api") || pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();
  const match = pathname.match(localePattern);
  if (match) {
    const locale = match[1].toLowerCase();
    const destination = request.nextUrl.clone();
    destination.pathname = pathname.replace(localePattern, "") || "/";
    const headers = new Headers(request.headers);
    headers.set("x-youjiu-locale", locale);
    const response = NextResponse.rewrite(destination, { request: { headers } });
    response.cookies.set("youjiu-locale", locale, { path: "/", maxAge: 31536000, sameSite: "lax" });
    return response;
  }
  const saved = request.cookies.get("youjiu-locale")?.value;
  const locale = saved && locales.includes(saved as typeof locales[number]) ? saved : detectLocale(request);
  if (locale !== "en") {
    const destination = request.nextUrl.clone();
    destination.pathname = "/" + locale + (pathname === "/" ? "" : pathname);
    return NextResponse.redirect(destination);
  }
  const headers = new Headers(request.headers);
  headers.set("x-youjiu-locale", "en");
  return NextResponse.next({ request: { headers } });
}
export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\\\..*).*)"] };
