import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { companyInfo } from "../../data/company";
import { getCmsBlock } from "../../lib/cms";
import { applyTranslation, getLocale } from "../../lib/i18n";

export const dynamic = "force-dynamic";
export default async function Contact() {
  const locale = await getLocale();
  const [heroBlock, introBlock] = await Promise.all([getCmsBlock("contact.hero"), getCmsBlock("contact.intro")]);
  const [heroContent, introContent] = await Promise.all([
    applyTranslation(locale, "site_content", "contact.hero", heroBlock?.content || {}),
    applyTranslation(locale, "site_content", "contact.intro", introBlock?.content || {})
  ]);
  const hero = { eyebrow: "CONTACT & SUPPORT", headline: "LET'S TALK BUSINESS.", body: "Tell us what you are sourcing and where you plan to sell.", ...heroContent };
  const intro = { eyebrow: "INTERNATIONAL SALES", headline: "International sales", body: "For product catalogues, technical specifications, OEM discussions and wholesale enquiries, contact our team by email or submit the enquiry form.", primary_label: "Open Inquiry Form", primary_href: "/inquiry", secondary_headline: "Send your requirements", secondary_body: "Include product category, estimated order quantity, destination country and any technical requirements.", ...introContent };
  return <><Header/><main>
    <section className="bg-[#101923] text-white py-20"><div className="container"><div className="eyebrow !text-[#b8ed36] mb-4">{hero.eyebrow}</div><h1 className="text-5xl font-black whitespace-pre-line">{hero.headline}</h1><p className="text-slate-400 mt-5 whitespace-pre-line">{hero.body}</p></div></section>
    <section className="container py-20 grid md:grid-cols-2 gap-12">
      <div><h2 className="text-3xl font-black">{intro.headline}</h2><div className="eyebrow mt-5">{intro.eyebrow}</div><p className="text-slate-500 leading-7 mt-4 whitespace-pre-line">{intro.body}</p><div className="mt-8 border-t border-slate-200 py-5"><div className="eyebrow">EMAIL</div><a href={\`mailto:\${companyInfo.email}\`} className="text-xl font-bold mt-2 block">{companyInfo.email}</a></div><div className="border-t border-slate-200 py-5"><div className="eyebrow">LOCATION</div><p className="mt-2 font-semibold">{companyInfo.address}</p></div></div>
      <div className="bg-[#eef1f1] p-8"><div className="eyebrow mb-4">HOW CAN WE HELP?</div><h3 className="text-2xl font-black">{intro.secondary_headline}</h3><p className="text-sm text-slate-500 leading-6 mt-4 whitespace-pre-line">{intro.secondary_body}</p><Link href={intro.primary_href || "/inquiry"} className="btn-primary mt-8">{intro.primary_label || "Open Inquiry Form"} ↗</Link><div className="text-xs text-slate-400 mt-6">WhatsApp and social media channels will be published after official business contact details are confirmed.</div></div>
    </section>
  </main><Footer/></>;
}
