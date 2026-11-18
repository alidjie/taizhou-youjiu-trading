import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import BlogContent from "../../../components/BlogContent";
import { getPublishedBlogPost } from "../../../lib/cms";
import { applyTranslation, getLocale } from "../../../lib/i18n";

type Props={params:Promise<{slug:string}>};
export const dynamic="force-dynamic";

export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {slug}=await params;
  const post=await getPublishedBlogPost(slug);
  if(!post)return {title:"Article not found"};
  const locale=await getLocale();
  const localized=await applyTranslation(locale,"blog",post.id,post);
  return {title:localized.seo_title||localized.title,description:localized.seo_description||localized.excerpt,openGraph:{type:"article",title:localized.seo_title||localized.title,description:localized.seo_description||localized.excerpt,images:localized.cover_image||localized.image?[localized.cover_image||localized.image||""]:[]}};
}

export default async function BlogArticle({params}:Props){
  const {slug}=await params;
  const post=await getPublishedBlogPost(slug);
  if(!post)notFound();
  const locale=await getLocale();
  const article=await applyTranslation(locale,"blog",post.id,post);
  const publishedDate=article.published_at||article.date;
  const schema={"@context":"https://schema.org","@type":"Article","headline":article.title,"description":article.excerpt,"image":article.cover_image||article.image||undefined,"datePublished":publishedDate||undefined,"dateModified":article.updated_at,"author":{"@type":"Organization","name":article.author||"YOUJIU"},"publisher":{"@type":"Organization","name":"YOUJIU","url":"https://www.almcp.com"},"mainEntityOfPage":`https://www.almcp.com/blog/${article.slug}`};
  return <><Header/><main className="min-h-screen"><article className="container max-w-4xl py-14 md:py-20">
    <Link href="/blog" className="text-xs font-bold tracking-widest text-slate-500 hover:text-[#789b1e]">← BACK TO BLOG</Link>
    <div className="mt-9 text-[10px] font-black tracking-widest uppercase text-[#789b1e]">{article.category}</div>
    <h1 className="text-4xl md:text-6xl font-black tracking-tight leading-tight mt-4">{article.title}</h1>
    <p className="text-lg text-slate-500 leading-8 mt-6">{article.excerpt}</p>
    <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-7"><span>{article.author||"YOUJIU Editorial Team"}</span><span>{publishedDate?new Date(publishedDate).toLocaleDateString(locale):""}</span></div>
    {(article.cover_image||article.image)&&<img src={article.cover_image||article.image||""} alt={article.title} className="w-full max-h-[560px] object-cover mt-10"/>}
    <div className="max-w-3xl mx-auto mt-10"><BlogContent content={article.content||""}/></div>
    {!!article.tags?.length&&<div className="max-w-3xl mx-auto flex flex-wrap gap-2 mt-10 pt-7 border-t border-slate-200">{article.tags.map(tag=><span key={tag} className="bg-slate-100 text-slate-600 px-3 py-2 text-xs">#{tag}</span>)}</div>}
    <script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(schema).replace(/</g,"\\u003c")}}/>
  </article></main><Footer/></>;
}
