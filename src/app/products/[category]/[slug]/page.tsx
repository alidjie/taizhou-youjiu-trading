import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Header from "../../../../components/Header";
import Footer from "../../../../components/Footer";
import ProductMarketingSections from "../../../../components/ProductMarketingSections";
import { productCategories } from "../../../../data/company";
import { getPublishedProduct } from "../../../../lib/cms";
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
  const [rawProduct, rawCategoryInfo] = await Promise.all([
    getPublishedProduct(category, slug),
    Promise.resolve(productCategories.find(item => item.id === category))
  ]);
  const product = rawProduct ? await applyTranslation(locale, "product", rawProduct.id, rawProduct) : null;
  const categoryInfo = rawCategoryInfo ? await applyTranslation(locale, "category", rawCategoryInfo.id, rawCategoryInfo) : null;
  if (!product || !categoryInfo) notFound();

  const images = Array.from(new Set([product.hero_image, product.image, ...(product.gallery || [])].filter((value): value is string => Boolean(value))));
  const specifications = product.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications) : [];
  const features = product.features || [];
  const certifications = product.certifications || [];

  return <><Header/><main>
    <section className="bg-[#101923] text-white py-8"><div className="container"><div className="text-xs text-slate-400"><Link href="/products" className="hover:text-[#b8ed36]">PRODUCTS</Link><span className="mx-2">/</span><Link href={`/products/${category}`} className="hover:text-[#b8ed36]">{categoryInfo.name.toUpperCase()}</Link></div><div className="eyebrow !text-[#b8ed36] mt-8 mb-3">{product.model_code || "YOUJIU PRODUCT"}</div><h1 className="text-4xl md:text-6xl font-black max-w-4xl">{product.name}</h1><p className="text-slate-300 leading-7 max-w-3xl mt-5 whitespace-pre-line">{product.short_description}</p></div></section>
    <section className="container py-14 grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-start"><div>
      {images.length > 0 ? <div className="grid sm:grid-cols-2 gap-4">{images.map((src,index)=><div key={src} className={index===0 ? "sm:col-span-2" : ""}><img src={src} alt={`${product.name} view ${index+1}`} className={index===0 ? "w-full max-h-[560px] object-contain bg-[#f2f4f4]" : "w-full aspect-[4/3] object-contain bg-[#f2f4f4]"}/></div>)}</div> : <div className="aspect-[4/3] bg-[#eef1f1] flex items-center justify-center text-slate-400">Product images will be added soon</div>}
    </div>
    <div><div className="eyebrow mb-3">PRODUCT OVERVIEW</div><h2 className="text-3xl font-black">Specifications & options</h2><p className="text-slate-600 leading-7 mt-5 whitespace-pre-line">{product.description || product.short_description}</p>
      {specifications.length > 0 && <div className="mt-8 border-t border-slate-200"><h3 className="font-black text-lg py-4">Technical specifications</h3>{specifications.map(([label,value])=><div key={label} className="py-3 border-t border-slate-100 grid grid-cols-[.8fr_1.2fr] gap-4 text-sm"><span className="text-slate-500">{label}</span><span className="font-semibold">{value}</span></div>)}</div>}
      {features.length > 0 && <div className="mt-8"><h3 className="font-black text-lg mb-4">Key features</h3><ul className="space-y-3">{features.map((feature,index)=><li key={index} className="flex gap-3 text-sm text-slate-600"><span className="text-[#7ca51c]">✓</span>{feature}</li>)}</ul></div>}
      {certifications.length > 0 && <div className="mt-8"><h3 className="font-black text-lg mb-3">Documents & certifications</h3><div className="flex flex-wrap gap-2">{certifications.map((cert,index)=><span key={index} className="text-xs border border-slate-300 px-3 py-2">{cert}</span>)}</div></div>}
      <div className="bg-[#101923] text-white p-7 mt-10"><div className="eyebrow !text-[#b8ed36] mb-3">OEM & WHOLESALE ENQUIRIES</div><h3 className="text-2xl font-black">Request a model-specific quotation</h3><p className="text-sm text-slate-300 leading-6 mt-3">Send your destination market, required configuration and estimated quantity. Our sales team will follow up with model availability and export details.</p><Link href={`/inquiry?category=${category}&product=${encodeURIComponent(product.name)}`} className="btn-primary mt-6">Request a Quote ↗</Link></div>
    </div></section>
    <ProductMarketingSections blocks={product.marketing_blocks}/>
  </main><Footer/></>;
}
