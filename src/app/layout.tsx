import type { Metadata } from "next";
import { headers } from "next/headers";
import VisitorTracker from "../components/VisitorTracker";
import "./globals.css";

const siteUrl = "https://www.almcp.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "YOUJIU | Electric Mobility & OEM Components", template: "%s | YOUJIU" },
  description: "Electric motorcycles, electric bicycles, BLDC motors and suspension systems for global distributors, importers and OEM partners.",
  keywords: ["electric motorcycles", "electric bicycles", "electric motorcycle manufacturer", "BLDC motors", "motorcycle shock absorbers", "OEM electric mobility supplier"],
  verification: {
    yandex: "2d49a12f9270e19f"
  },
  openGraph: {
    type: "website",
    siteName: "YOUJIU",
    url: siteUrl,
    title: "YOUJIU | Electric Mobility & OEM Components",
    description: "A manufacturing and supply partner for global electric mobility businesses."
  },
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
    shortcut: ["/icon.svg"]
  },
  robots: { index: true, follow: true }
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const requestHeaders = await headers();
  const locale = requestHeaders.get("x-youjiu-locale") || "en";
  const direction = locale === "ar" ? "rtl" : "ltr";
  const websiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteUrl}/#organization`,
        "name": "YOUJIU",
        "url": siteUrl,
        "logo": { "@type": "ImageObject", "url": `${siteUrl}/icon.svg` }
      },
      {
        "@type": "WebSite",
        "@id": `${siteUrl}/#website`,
        "name": "YOUJIU",
        "url": siteUrl,
        "publisher": { "@id": `${siteUrl}/#organization` },
        "inLanguage": locale
      }
    ]
  };
  return <html lang={locale} dir={direction}><body><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(websiteSchema).replace(/</g,"\\u003c")}}/>{children}<VisitorTracker /></body></html>;
}
