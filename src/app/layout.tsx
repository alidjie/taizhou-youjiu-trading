import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://almcp.com"),
  title: { default: "YOUJIU | Intelligent Mobility & Industrial Components", template: "%s | YOUJIU" },
  description: "Electric motorcycles, electric bicycles, BLDC motors and suspension systems for global distributors, importers and OEM partners.",
  keywords: ["electric motorcycles", "electric bicycles", "BLDC motors", "motorcycle shock absorbers", "OEM electric mobility supplier"],
  openGraph: { type: "website", siteName: "YOUJIU", title: "YOUJIU | Intelligent Mobility & Industrial Components", description: "A manufacturing and supply partner for global electric mobility businesses." },
  robots: { index: true, follow: true }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-youjiu-locale") || "en";
  const direction = locale === "ar" ? "rtl" : "ltr";
  return <html lang={locale} dir={direction}><body>{children}</body></html>;
}
