import type { Metadata } from "next";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import FAQContent from "../../components/FAQContent";
import { getPublishedFAQs } from "../../lib/cms";

const siteUrl = "https://www.almcp.com";

export const metadata: Metadata = {
  title: "Electric Mobility Buyer FAQs",
  description: "Answers for global importers, distributors and OEM buyers of electric motorcycles, e-bikes, BLDC motors and motorcycle suspension systems.",
  alternates: { canonical: `${siteUrl}/faq` },
  openGraph: {
    type: "website",
    url: `${siteUrl}/faq`,
    title: "Electric Mobility Buyer FAQs | YOUJIU",
    description: "Technical, purchasing, certification and shipping answers for electric mobility buyers."
  },
  robots: { index: true, follow: true }
};

export default async function FAQPage() {
  const items = await getPublishedFAQs("en");
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": items.map(item => ({
      "@type": "Question",
      "name": item.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": item.answer
      }
    }))
  };

  return <><Header/><main className="min-h-screen bg-[#f7f8f6] text-[#101923]">
    {items.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(faqSchema).replace(/</g,"\\u003c")}} />}
    <section className="bg-[#101923] text-white px-5 md:px-8 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-[10px] tracking-[.25em] text-[#b8ed36] font-black">YOUJIU BUYER KNOWLEDGE CENTRE</div>
        <h1 className="text-4xl md:text-6xl font-black tracking-tight mt-4">Frequently Asked Questions</h1>
        <p className="max-w-3xl text-slate-300 text-base md:text-lg leading-8 mt-6">Practical answers to common sourcing, technical, certification, battery, logistics and after-sales questions from electric mobility importers, distributors and OEM partners.</p>
        <div className="flex flex-wrap gap-3 mt-8 text-[10px] font-bold tracking-widest text-slate-400">
          <span>ELECTRIC MOTORCYCLES</span><span>•</span><span>E-BIKES</span><span>•</span><span>BLDC MOTORS</span><span>•</span><span>SUSPENSION</span>
        </div>
      </div>
    </section>
    <section className="max-w-6xl mx-auto px-5 md:px-8 py-14 md:py-20">
      <div className="flex flex-wrap justify-between items-end gap-4 mb-10">
        <div><div className="text-[10px] tracking-widest text-[#7ca51c] font-black">BUYER SUPPORT</div><h2 className="text-2xl md:text-3xl font-black mt-2">Answers before you place an order</h2></div>
        <p className="text-xs text-slate-500">{items.length} published answers</p>
      </div>
      {items.length ? <FAQContent items={items} /> : <div className="bg-white border border-slate-200 p-10 text-center"><h2 className="font-black text-xl">FAQ articles are being prepared</h2><p className="text-sm text-slate-500 mt-3">Contact our team for product specifications, sourcing requirements and export documentation questions.</p><a href="/inquiry" className="inline-flex mt-6 bg-[#101923] text-white px-6 py-3 text-xs font-bold">CONTACT SALES ↗</a></div>}
      <p className="max-w-4xl mx-auto text-[11px] text-slate-400 leading-6 mt-10">Regulatory and certification information is general guidance, not legal advice or a certification statement. Requirements depend on the destination country, vehicle classification, product configuration and shipment date. Confirm current rules with the relevant authority and qualified local specialists before importing.</p>
    </section>
  </main><Footer/></>;
}
