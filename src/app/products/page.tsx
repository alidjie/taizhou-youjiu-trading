import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { productCategories } from "../../data/company";
import { getCmsBlock, getPublishedProducts } from "../../lib/cms";
import { applyTranslation, getLocale } from "../../lib/i18n";

const pics = [
  "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1200&q=80"
];

export const dynamic = "force-dynamic";

export default async function Products() {
  const locale = await getLocale();
  const [heroBlock, rawProducts] = await Promise.all([getCmsBlock("products.hero"), getPublishedProducts()]);
  const [heroContent, products, localizedCategories] = await Promise.all([
    applyTranslation(locale, "site_content", "products.hero", heroBlock?.content || {}),
    Promise.all(rawProducts.map(product => applyTranslation(locale, "product", product.id, product))),
    Promise.all(productCategories.map(category => applyTranslation(locale, "category", category.id, category)))
  ]);
  const hero = { eyebrow: "PRODUCT PORTFOLIO", headline: "PRODUCTS & SYSTEMS", body: "Explore our electric mobility and industrial component ranges for wholesale, distribution and OEM applications.", ...heroContent };
  const counts = new Map<string, number>();
  products.forEach(product => counts.set(product.category, (counts.get(product.category) || 0) + 1));

  return <><Header/><main>
    <section className="bg-[#101923] text-white py-20"><div className="container"><div className="eyebrow !text-[#b8ed36] mb-4">{hero.eyebrow}</div><h1 className="text-5xl md:text-6xl font-black tracking-tight whitespace-pre-line">{hero.headline}</h1><p className="text-slate-400 mt-5 max-w-2xl leading-7 whitespace-pre-line">{hero.body}</p></div></section>
    <section className="container py-20"><div className="grid md:grid-cols-2 gap-6">{localizedCategories.map((category, i) => <Link key={category.id} href={\`/products/\${category.id}\`} className="product-tile group"><div className="product-visual h-72 relative" style={{backgroundImage:\`linear-gradient(0deg,rgba(10,20,28,.20),transparent),url(\${pics[i]})\`}}><span className="absolute top-5 left-5 bg-[#b8ed36] text-[#101923] text-[9px] font-black tracking-widest px-3 py-2">PRODUCT CATEGORY 0{i+1}</span><span className="absolute bottom-5 right-6 text-white text-3xl group-hover:translate-x-2 transition-transform">↗</span></div><div className="p-7"><h2 className="text-2xl font-black">{category.name}</h2><p className="text-sm text-slate-500 leading-6 mt-3">{category.description}</p><div className="mt-6 flex items-center justify-between"><span className="text-xs font-black tracking-widest">EXPLORE CATEGORY ↗</span><span className="text-xs text-slate-400">{counts.get(category.id) || 0} published models</span></div></div></Link>)}</div>
      {products.length > 0 && <div className="mt-20"><div className="eyebrow mb-4">LIVE CATALOGUE</div><h2 className="text-3xl font-black mb-8">Recently published models</h2><div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">{products.slice(0,8).map(product=><Link key={product.id} href={\`/products/\${product.category}/\${product.slug}\`} className="border border-slate-200 group hover:border-[#b8ed36] transition-colors"><div className="aspect-[4/3] bg-slate-100 overflow-hidden">{(product.hero_image || product.image) ? <img src={product.hero_image || product.image || ""} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">YOUJIU PRODUCT</div>}</div><div className="p-5"><h3 className="font-black">{product.name}</h3><p className="text-xs text-slate-500 mt-2 line-clamp-2">{product.short_description}</p><span className="inline-block mt-5 text-[10px] font-black tracking-widest">VIEW DETAILS ↗</span></div></Link>)}</div></div>}
    </section>
  </main><Footer/></>;
}
