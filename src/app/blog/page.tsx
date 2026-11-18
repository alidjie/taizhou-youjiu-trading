import type { Metadata } from "next";
import Link from "next/link";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import { getPublishedBlogPosts } from "../../lib/cms";
import { applyTranslation, getLocale } from "../../lib/i18n";

export const metadata:Metadata={title:"Blog & Industry Insights",description:"Insights on electric mobility, electric motorcycles, e-bikes, motors, suspension systems and international export markets."};
export const dynamic="force-dynamic";

export default async function BlogIndex({searchParams}:{searchParams:Promise<{page?:string;category?:string}>}) {
  const params=await searchParams;
  const page=Math.max(1,Number(params.page)||1);
  const category=params.category||"";
  const locale=await getLocale();
  const all=await getPublishedBlogPosts(1000,0,category||undefined);
  const pageSize=12;
  const totalPages=Math.max(1,Math.ceil(all.length/pageSize));
  const visible=all.slice((page-1)*pageSize,page*pageSize);
  const posts=await Promise.all(visible.map(post=>applyTranslation(locale,"blog",post.id,post)));
  const categories=Array.from(new Set(all.map(post=>post.category).filter(Boolean)));
  return <><Header/><main className="min-h-screen">
    <section className="bg-[#101923] text-white py-20"><div className="container"><div className="eyebrow !text-[#b8ed36] mb-4">YOUJIU KNOWLEDGE HUB</div><h1 className="text-5xl md:text-6xl font-black">Blog & Insights</h1><p className="text-slate-300 max-w-2xl leading-8 mt-6">Industry perspectives, product knowledge and practical export insights for electric mobility distributors, importers and OEM partners.</p></div></section>
    <section className="container py-16">
      <div className="flex flex-wrap gap-2 mb-9"><Link href="/blog" className={`px-4 py-2 text-xs font-bold border ${!category?"bg-[#101923] text-white":"border-slate-300"}`}>All topics</Link>{categories.map(item=><Link key={item} href={`/blog?category=${encodeURIComponent(item)}`} className={`px-4 py-2 text-xs font-bold border ${category===item?"bg-[#101923] text-white":"border-slate-300"}`}>{item}</Link>)}</div>
      {posts.length?<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-7">{posts.map(post=><article key={post.id} className="border border-slate-200 bg-white group"><Link href={`/blog/${post.slug}`} className="block">{(post.cover_image||post.image)&&<div className="aspect-[16/10] overflow-hidden bg-slate-100"><img src={post.cover_image||post.image||""} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"/></div>}<div className="p-6"><div className="flex gap-3 items-center text-[10px] tracking-widest uppercase text-slate-500"><span className="text-[#789b1e] font-black">{post.category}</span><span>{post.published_at?new Date(post.published_at).toLocaleDateString(locale):""}</span></div><h2 className="text-xl font-black leading-snug mt-4 group-hover:text-[#6f9217]">{post.title}</h2><p className="text-sm text-slate-500 leading-7 mt-3 line-clamp-3">{post.excerpt}</p><span className="inline-block mt-6 text-[10px] font-black tracking-widest">READ ARTICLE ↗</span></div></Link></article>)}</div>:<div className="border border-dashed border-slate-300 p-16 text-center text-slate-500">New articles are coming soon.</div>}
      {totalPages>1&&<nav aria-label="Blog pagination" className="flex justify-center gap-3 mt-12">{page>1&&<Link className="border px-4 py-3 text-xs font-bold" href={`/blog?page=${page-1}${category?"&category="+encodeURIComponent(category):""}`}>Previous</Link>}<span className="px-4 py-3 text-xs text-slate-500">Page {page} / {totalPages}</span>{page<totalPages&&<Link className="border px-4 py-3 text-xs font-bold" href={`/blog?page=${page+1}${category?"&category="+encodeURIComponent(category):""}`}>Next</Link>}</nav>}
    </section>
  </main><Footer/></>;
}
