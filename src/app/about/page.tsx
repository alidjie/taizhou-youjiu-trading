import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Link from "next/link";
import { getCmsBlock } from "../../lib/cms";
import { applyTranslation, getLocale } from "../../lib/i18n";

export const dynamic = "force-dynamic";

const fallbacks = {
  hero: {
    eyebrow: "ABOUT YOUJIU",
    headline: "BUILT AROUND GLOBAL MOBILITY.",
    body: "YOUJIU connects overseas buyers with electric mobility products and industrial component manufacturing resources in China."
  },
  intro: {
    eyebrow: "OUR APPROACH",
    headline: "Manufacturing resources. Export execution.",
    body: "Our business focuses on four product groups: electric motorcycles, electric bicycles, electric motors and suspension systems. We work with manufacturing resources to coordinate product selection, technical communication, quality requirements and export arrangements.",
    secondary_body: "Factory images, production capacity, testing records and certificates will be added after verification and approval for publication.",
    image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=85"
  },
  quality: {
    eyebrow: "QUALITY & COMPLIANCE",
    headline: "Evidence before claims.",
    body: "Product certificates, test reports and applicable market approvals are model- and destination-specific. Request the documents relevant to your selected products.",
    primary_label: "Discuss Your Requirements",
    primary_href: "/inquiry"
  }
};

export default async function About() {
  const locale = await getLocale();\n  const [heroBlock, introBlock, qualityBlock] = await Promise.all([
    getCmsBlock("about.hero"),
    getCmsBlock("about.intro"),
    getCmsBlock("about.quality")
  ]);
  const hero = { ...fallbacks.hero, ...(heroBlock?.content ?? {}) };
  const intro = { ...fallbacks.intro, ...(introBlock?.content ?? {}) };
  const quality = { ...fallbacks.quality, ...(qualityBlock?.content ?? {}) };

  return <><Header/><main>
    <section className="bg-[#101923] text-white py-24"><div className="container"><div className="eyebrow !text-[#b8ed36] mb-5">{hero.eyebrow}</div><h1 className="text-5xl md:text-6xl font-black max-w-3xl whitespace-pre-line">{hero.headline}</h1><p className="text-slate-300 leading-8 max-w-2xl mt-7 whitespace-pre-line">{hero.body}</p></div></section>
    <section className="container py-20 grid md:grid-cols-2 gap-12 items-center"><img src={intro.image_url} alt="Industrial manufacturing" className="w-full aspect-[4/3] object-cover"/><div><div className="eyebrow mb-4">{intro.eyebrow}</div><h2 className="section-title whitespace-pre-line">{intro.headline}</h2><p className="text-slate-500 leading-8 mt-6 whitespace-pre-line">{intro.body}</p><p className="text-slate-500 leading-8 mt-4 whitespace-pre-line">{intro.secondary_body}</p></div></section>
    <section className="bg-[#e9edef] py-20"><div className="container"><div className="eyebrow mb-4">{quality.eyebrow}</div><h2 className="section-title whitespace-pre-line">{quality.headline}</h2><p className="text-slate-600 mt-5 max-w-2xl leading-7 whitespace-pre-line">{quality.body}</p><Link href={quality.primary_href || "/inquiry"} className="btn-primary mt-8">{quality.primary_label || "Discuss Your Requirements"} ↗</Link></div></section>
  </main><Footer/></>;
}
