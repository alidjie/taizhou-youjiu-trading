import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import ProductMarketingSections from "../../../../components/ProductMarketingSections";
import { productCategories } from "../../../../data/company";
import { getPublishedProduct, getPublishedProducts } from "../../../../lib/cms";
import { applyTranslation, getLocale } from "../../../../lib/i18n";

export const dynamic = "force-dynamic";
type PageProps = { params: Promise<{ category: string; slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category, slug } = await params;
  const rawProduct = await getPublishedProduct(category, slug);
  const product = rawProduct ? await applyTranslation(await getLocale(), "product", rawProduct.id, rawProduct) : null;
  if (!product) return { title: "Product not found | YOUJIU" };
  return {
    title: product.seo_title || `${product.name} | YOUJIU`,
    description: product.seo_description || product.short_description || product.description || `${product.name} from YOUJIU.`,
    openGraph: { title: product.seo_title || product.name, description: product.seo_description || product.short_description || product.description || "", images: product.hero_image || product.image ? [product.hero_image || product.image || ""] : [] }
  };
}

export default async function ProductDetailPage({ params }: PageProps) {
  const { category, slug } = await params;
  const locale = await getLocale();
  const [rawProduct, rawCategoryInfo, rawCategoryProducts] = await Promise.all([
    getPublishedProduct(category, slug),
    Promise.resolve(productCategories.find(item => item.id === category)),
    getPublishedProducts(category)
  ]);
  const product = rawProduct ? await applyTranslation(locale, "product", rawProduct.id, rawProduct) : null;
  const categoryInfo = rawCategoryInfo ? await applyTranslation(locale, "category", rawCategoryInfo.id, rawCategoryInfo) : null;
  const categoryProducts = await Promise.all(rawCategoryProducts.map(item => applyTranslation(locale, "product", item.id, item)));
  if (!product || !categoryInfo) notFound();

  const images = Array.from(new Set([product.hero_image, product.image, ...(product.gallery || [])].filter((value): value is string => Boolean(value))));
  const specifications = product.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications) : [];
  const features = product.features || [];
  const certifications = product.certifications || [];

  return <><Header/><main className="bg-white">
    <div className="container pt-5 pb-3 text-xs text-slate-500"><Link href="/products" className="hover:text-[#789d22]">PRODUCTS</Link><span className="mx-2">/</span><Link href={`/products/${category}`} className="hover:text-[#789d22]">{categoryInfo.name}</Link><span className="mx-2">/</span><span className="text-slate-800">{product.name}</span></div>
    <section className="container pb-12 pt-3">
      <div className="grid gap-7 lg:grid-cols-[230px_minmax(0,1fr)_330px] items-start">
        <aside className="hidden lg:block border border-slate-200 p-4">
          <h2 className="text-xs font-black tracking-[.16em] text-slate-500 mb-4">PRODUCT CATEGORIES</h2>
          <nav className="space-y-1">{productCategories.map(item=><Link key={item.id} href={`/products/${item.id}`} className={`block px-3 py-3 text-sm font-semibold border-l-2 ${item.id===category?"border-[#b8ed36] bg-slate-50 text-[#101923]":"border-transparent text-slate-600 hover:bg-slate-50"}`}>{item.name}</Link>)}</nav>
          <div className="border-t border-slate-200 mt-5 pt-5"><h3 className="text-xs font-black tracking-[.14em] text-slate-500 mb-3">IN THIS CATEGORY</h3><nav className="space-y-2">{categoryProducts.map(item=><Link key={item.id} href={`/products/${category}/${item.slug}`} className={`flex gap-3 items-center text-xs leading-5 p-2 ${item.slug===slug?"bg-slate-100 font-bold text-[#101923]":"text-slate-600 hover:bg-slate-50"}`}>{item.image||item.hero_image?<img src={item.image||item.hero_image||""} alt="" className="w-14 h-12 object-contain bg-white"/>:<span className="w-14 h-12 bg-slate-100"/>}<span>{item.name}</span></Link>)}</nav></div>
        </aside>
        <div className="min-w-0">
          <div className="bg-[#f3f5f5] min-h-[360px] md:min-h-[520px] flex items-center justify-center p-5">
            {images.length>0?<img src={images[0]} alt={product.name} className="w-full max-h-[520px] object-contain" fetchPriority="high"/>:<div className="text-slate-400 text-sm">Product images will be added soon</div>}
          </div>
          {images.length>1&&<div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-3">{images.slice(1).map((src,index)=><div key={src} className="bg-[#f3f5f5] aspect-[4/3] p-2"><img src={src} alt={`${product.name} view ${index+2}`} className="w-full h-full object-contain" loading="lazy"/></div>)}</div>}
          <div className="mt-8 border-t border-slate-200 pt-7"><div className="eyebrow mb-3">{product.model_code||"YOUJIU PRODUCT"}</div><h1 className="text-3xl md:text-4xl font-black tracking-tight text-[#101923]">{product.name}</h1><p className="text-slate-600 leading-7 mt-4 whitespace-pre-line">{product.short_description}</p></div>
          {features.length>0&&<div className="mt-8"><h2 className="font-black text-xl mb-4">Key features</h2><ul className="space-y-3">{features.map((feature,index)=><li key={index} className="flex gap-3 text-sm text-slate-600"><span className="text-[#7ca51c]">✓</span>{feature}</li>)}</ul></div>}
          {certifications.length>0&&<div className="mt-8"><h2 className="font-black text-lg mb-3">Documents & certifications</h2><div className="flex flex-wrap gap-2">{certifications.map((cert,index)=><span key={index} className="text-xs border border-slate-300 px-3 py-2">{cert}</span>)}</div></div>}
        </div>
        <aside className="lg:sticky lg:top-24 border border-slate-200 p-5 md:p-7">
          <div className="eyebrow mb-3">PRODUCT OVERVIEW</div><h2 className="text-2xl font-black text-[#101923]">Specifications & options</h2>
          {product.description&&<p className="text-slate-600 text-sm leading-7 mt-4 whitespace-pre-line">{product.description}</p>}
          {specifications.length>0&&<div className="mt-6 border-t border-slate-200"><h3 className="font-black text-base py-4">Technical specifications</h3>{specifications.map(([label,value])=><div key={label} className="py-3 border-t border-slate-100 grid grid-cols-[.85fr_1.15fr] gap-3 text-sm"><span className="text-slate-500">{label}</span><span className="font-semibold text-[#101923]">{value}</span></div>)}</div>}
          <div className="bg-[#101923] text-white p-5 mt-7"><div className="eyebrow !text-[#b8ed36] mb-3">OEM & WHOLESALE</div><h3 className="text-xl font-black">Request a quotation</h3><p className="text-sm text-slate-300 leading-6 mt-3">Share your market, configuration and estimated quantity for pricing and export details.</p><Link href={`/inquiry?category=${category}&product=${encodeURIComponent(product.name)}`} className="btn-primary block text-center mt-5">Request a Quote ↗</Link></div>
        </aside>
      </div>
    </section>
    <ProductMarketingSections blocks={product.marketing_blocks}/>
  </main><Footer/></>;
}
