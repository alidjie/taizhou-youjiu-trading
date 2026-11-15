import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://almcp.com"),
  title: { default: "YOUJIU | Intelligent Mobility & Industrial Components", template: "%s | YOUJIU" },
  description: "Electric motorcycles, electric bicycles, BLDC motors and suspension systems for global distributors, importers and OEM partners.",
  keywords: ["electric motorcycles", "electric bicycles", "BLDC motors", "motorcycle shock absorbers", "OEM electric mobility supplier"],
  alternates: { canonical: "https://almcp.com" },
  openGraph: {
    type: "website",
    url: "https://almcp.com",
    siteName: "YOUJIU",
    title: "YOUJIU | Intelligent Mobility & Industrial Components",
    description: "A manufacturing and supply partner for global electric mobility businesses."
  },
  robots: { index: true, follow: true }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
