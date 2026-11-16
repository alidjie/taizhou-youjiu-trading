import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { productCategories } from "../data/company";
import { getCmsBlock, getPublishedProducts } from "../lib/cms";
import { applyTranslation, getLocale } from "../lib/i18n";

const highlights = [
  ["01", "Manufacturing Network", "Connected production resources across electric vehicles, motors and suspension components."],
  ["02", "OEM & Customization", "Product configurations, branding and packaging adapted to local market requirements."],
  ["03", "Export Coordination", "Practical support across specifications, documentation, inspection and shipment."],
  ["04", "Component Integration", "Vehicle and key component sourcing through one coordinated supply partner."]
];
const images = [
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80",
  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=900&q=80"
];
const fallbackHero = {
  eyebrow: "YOUR GLOBAL MOBILITY & COMPONENTS PARTNER", headline_before: "MOVE THE", headline_accent: "FUTURE", headline_after: "FORWARD.",
  body: "Electric mobility products and industrial components, built around the needs of global distributors, importers and OEM partners.",
  primary_label: "Explore Products", primary_href: "/products", secondary_label: "Talk to Our Team", secondary_href: "/inquiry"
};
export const dynamic = "force-dynamic";

export default async function Home() {
  const locale = await getLocale();
  const [heroBlock, whyBlock, ctaBlock, featuredProducts] = await Promise.all([
    getCmsBlock("home.hero"), getCmsBlock("home.why"), getCmsBlock("home.cta"), getPublishedProducts()
  ]);
  const [heroContent, whyContent, ctaContent, products] = await Promise.all([
    applyTranslation(locale, "site_content", "home.hero", heroBlock?.content || {}),
    applyTranslation(locale, "site_content", "home.why", whyBlock?.content || {}),
    applyTranslation(locale, "site_content", "home.cta", ctaBlock?.content || {}),
    Promise.all(featuredProducts.map(product => applyTranslation(locale, "product", product.id, product)))
  ]);
  const hero = { ...fallbackHero, ...heroContent };
  const why = { eyebrow: "WHY YOUJIU", headline: "More than a supplier. A partner in execution.", body: "We coordinate product sourcing and manufacturing resources to help overseas buyers build competitive mobility businesses with dependable product and component support.", ...whyContent };
  const cta = { eyebrow: "LET'S BUILD YOUR MARKET", headline: "Looking for a reliable mobility supply partner?", primary_label: "Send Your Inquiry", primary_href: "/inquiry", ...ctaContent };
  return <><Header/><main>
    <section className="hero"><div className="container hero-grid"><div className="max-w-[650px] py-20">
      <div className="eyebrow !text-[#b8ed36] mb-7">{hero.eyebrow}</div>
      <h1 className="text-5xl md:text-[76px] leading-[.98] tracking-[-.055em] font-black">{hero.headline_before}<br/><span className="text-[#b8ed36]">{hero.headline_accent}</span><br/>{hero.headline_after}</h1>
      <p className="text-slate-300 text-base md:text-lg leading-8 max-w-xl mt-8 whitespace-pre-line">{hero.body}</p>
      <div className="flex flex-wrap gap-3 mt-9"><Link href={hero.primary_href || "/products"} className="btn-primary">{hero.primary_label || "Explore Products"} <span>↗</span></Link><Link href={hero.secondary_href || "/inquiry"} className="btn-outline">{hero.secondary_label || "Talk to Our Team"}</Link></div>
      <div className="mt-14 flex items-center gap-4 text-[10px] tracking-[.2em] text-slate-400 uppercase"><span className="w-10 h-px bg-[#b8ed36]"/> Engineered supply. Global ambition.</div>
    </div><div className="hidden md:block"/></div></section>
    <section className="stat-strip"><div className="container grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10 py-8">{[["4","CORE PRODUCT LINES"],["OEM","CUSTOMIZATION"],["B2B","WHOLESALE FOCUS"],["GLOBAL","EXPORT ORIENTATION"]].map(x=><div key={x[0]} className="px-5 first:pl-0"><div className="text-2xl font-black text-[#b8ed36]">{x[0]}</div><div className="text-[9px] tracking-[.15em] text-slate-400 mt-2">{x[1]}</div></div>)}</div></section>
    <section className="py-24"><div className="container"><div className="flex flex-wrap justify-between items-end gap-6 mb-12"><div><div className="eyebrow mb-4">WHAT WE SUPPLY</div><h2 className="section-title">Mobility products.<br/>Critical components.</h2></div><Link href="/products" className="text-xs font-extrabold tracking-widest border-b-2 border-[#b8ed36] pb-2">VIEW ALL PRODUCTS ↗</Link></div>
      <div className="grid md:grid-cols-2 gap-5">{productCategories.map((c,i)=><Link href={`/products/${c.id}`} key={c.id} className="product-tile group"><div className="product-visual relative" style={{backgroundImage:`linear-gradient(0deg,rgba(10,20,28,.22),transparent),url(${images[i]})`}}><span className="absolute top-5 left-5 bg-[#b8ed36] text-[#101923] text-[9px] font-black tracking-widest px-3 py-2">0{i+1} / PRODUCT LINE</span><span className="absolute bottom-5 right-6 text-white text-3xl group-hover:translate-x-2 transition-transform">↗</span></div><div className="p-7"><h3 className="text-2xl font-black tracking-tight">{c.name}</h3><p className="text-sm text-slate-500 leading-6 mt-3 max-w-lg">{c.description}</p><div className="text-[10px] font-black tracking-[.18em] mt-6">DISCOVER RANGE <span className="text-[#7ca51c]">→</span></div></div></Link>)}</div>
      {products.some(p=>p.featured)&&<div className="mt-20"><div className="flex justify-between items-end gap-4 mb-8"><div><div className="eyebrow mb-3">SELECTED MODELS</div><h2 className="text-3xl font-black">Featured products</h2></div><Link href="/products" className="text-xs font-bold tracking-widest border-b border-[#b8ed36] pb-2">ALL PRODUCTS ↗</Link></div><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.filter(p=>p.featured).slice(0,4).map(p=><Link key={p.id} href={`/products/${p.category}/${p.slug}`} className="border border-slate-200 group hover:border-[#b8ed36] transition-colors"><div className="aspect-[4/3] bg-slate-100 overflow-hidden">{(p.hero_image||p.image)?<img src={p.hero_image||p.image||""} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/>:<div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">YOUJIU PRODUCT</div>}</div><div className="p-5"><h3 className="font-black">{p.name}</h3><p className="text-xs text-slate-500 mt-2 line-clamp-2">{p.short_description}</p><span className="text-[10px] font-black tracking-widest inline-block mt-5">VIEW DETAILS ↗</span></div></Link>)}</div></div>}
    </div></section>
    <section className="bg-[#e9edef] py-24"><div className="container grid md:grid-cols-2 gap-14 items-center"><div><div className="eyebrow mb-4">{why.eyebrow}</div><h2 className="section-title whitespace-pre-line">{why.headline}</h2><p className="text-slate-600 leading-8 mt-6 max-w-lg whitespace-pre-line">{why.body}</p><Link href="/about" className="btn-primary mt-8">Discover YOUJIU ↗</Link></div><div className="grid sm:grid-cols-2 gap-7">{highlights.map(h=><div key={h[0]} className="border-t-2 border-[#b8ed36] pt-5"><div className="text-xs text-slate-400 font-bold">{h[0]}</div><h3 className="font-extrabold text-lg mt-4">{h[1]}</h3><p className="text-sm leading-6 text-slate-500 mt-3">{h[2]}</p></div>)}</div></div></section>
    <section className="bg-[#101923] text-white py-20"><div className="container flex flex-wrap justify-between items-center gap-8"><div><div className="eyebrow !text-[#b8ed36] mb-4">{cta.eyebrow}</div><h2 className="text-3xl md:text-5xl font-black tracking-tight max-w-3xl">{cta.headline}</h2></div><Link href={cta.primary_href||"/inquiry"} className="btn-primary">{cta.primary_label||"Send Your Inquiry"} ↗</Link></div></section>
  </main><Footer/><Link href="/inquiry" className="floating-quote btn-primary">Quick Inquiry ↗</Link></>;
}
