import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import { productCategories } from "../../../data/company";
import { getCmsBlock, getPublishedProducts } from "../../../lib/cms";
import { applyTranslation, getLocale } from "../../../lib/i18n";

const categoryImages: Record<string, string> = {
  "electric-motorcycles": "https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=1600&q=85",
  "electric-bicycles": "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&w=1600&q=85",
  "electric-motors": "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1600&q=85",
  "suspension-systems": "https://images.unsplash.com/photo-1581092921461-eab62e97a780?auto=format&fit=crop&w=1600&q=85"
};
const fallbackCopy: Record<string, { headline: string; body: string }> = {
  "electric-motorcycles": { headline: "Electric Motorcycles", body: "Electric motorcycle platforms for urban commuting, utility transport and regional distribution. Configurations can be discussed for local regulations and market positioning." },
  "electric-bicycles": { headline: "Electric Bicycles", body: "Electric bicycle and e-mobility solutions designed for daily use, fleet applications and local dealer networks." },
  "electric-motors": { headline: "Electric Motors", body: "Electric traction motor and BLDC solutions for two-wheelers and other electric mobility applications." },
  "suspension-systems": { headline: "Suspension Systems", body: "Motorcycle and automotive shock absorbers and suspension components for OEM and aftermarket supply." }
};
export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const currentCategory = productCategories.find(item => item.id === category);
  if (!currentCategory) notFound();
  const locale = await getLocale();
  const [block, rawProducts] = await Promise.all([getCmsBlock(`category.${category}`), getPublishedProducts(category)]);
  const [blockContent, products, localizedCategory] = await Promise.all([
    applyTranslation(locale, "site_content", `category.${category}`, block?.content || {}),
    Promise.all(rawProducts.map(product => applyTranslation(locale, "product", product.id, product))),
    applyTranslation(locale, "category", currentCategory.id, currentCategory)
  ]);
  const fallback = fallbackCopy[category] || { headline: localizedCategory.name, body: localizedCategory.description };
  const copy = { eyebrow: "YOUJIU PRODUCT RANGE", ...fallback, ...blockContent };
  const image = blockContent.image_url || categoryImages[category] || "";

  return <><Header/><main>
    <section className="bg-[#101923] text-white py-16"><div className="container"><Link href="/products" className="text-xs text-slate-400">PRODUCTS /</Link><div className="eyebrow !text-[#b8ed36] mt-8 mb-4">{copy.eyebrow}</div><h1 className="text-4xl md:text-6xl font-black whitespace-pre-line">{copy.headline}</h1><p className="text-slate-400 max-w-2xl leading-7 mt-5 whitespace-pre-line">{copy.body}</p></div></section>
    <section className="container py-16"><div className="grid md:grid-cols-[.9fr_1.1fr] gap-12 items-start">
      <div>{image && <img src={image} alt={localizedCategory.name} className="w-full aspect-[4/3] object-cover"/>}<div className="bg-[#eef1f1] p-6 mt-5"><div className="eyebrow mb-3">OEM & WHOLESALE</div><h2 className="text-xl font-black">Discuss your market requirements</h2><p className="text-sm text-slate-500 leading-6 mt-2">Tell us your target specifications, estimated quantity and destination market. Our team will help identify suitable models and configurations.</p><Link href={`/inquiry?category=${category}`} className="btn-primary mt-5">Request Product Details ↗</Link></div></div>
      <div><div className="eyebrow mb-3">PRODUCT CATALOGUE</div><h2 className="text-3xl font-black">Available models</h2><p className="text-sm text-slate-500 mt-3">Specifications and images are maintained by the YOUJIU product team and updated from the management backend.</p>
        {products.length > 0 ? <div className="grid sm:grid-cols-2 gap-5 mt-8">{products.map(product=><Link href={`/products/${category}/${product.slug}`} key={product.id} className="border border-slate-200 group hover:border-[#b8ed36] transition-colors"><div className="aspect-[4/3] bg-slate-100 overflow-hidden">{(product.hero_image || product.image) ? <img src={product.hero_image || product.image || ""} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform"/> : <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">YOUJIU PRODUCT</div>}</div><div className="p-5"><div className="text-[9px] font-black tracking-widest text-[#7ca51c]">{product.model_code || "MODEL DETAILS"}</div><h3 className="font-black mt-2">{product.name}</h3><p className="text-xs text-slate-500 leading-5 mt-2 line-clamp-3">{product.short_description || product.description}</p><span className="inline-block text-[10px] font-black tracking-widest mt-5">VIEW DETAILS ↗</span></div></Link>)}</div> : <div className="border border-dashed border-slate-300 p-9 mt-8"><h3 className="font-black">Product range is being updated</h3><p className="text-sm text-slate-500 leading-6 mt-3">Please contact our team for current model lists, specifications and wholesale quotations.</p><Link href={`/inquiry?category=${category}`} className="btn-primary mt-5">Contact Sales ↗</Link></div>}
      </div>
    </div></section>
  </main><Footer/></>;
}
