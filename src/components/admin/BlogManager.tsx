"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

type BlogPost = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  image: string | null; cover_image: string | null; author: string | null;
  date: string | null; category: string | null; tags: string[] | null;
  status: "draft" | "published"; featured: boolean; published_at: string | null;
  seo_title: string | null; seo_description: string | null;
  created_at: string; updated_at: string;
};

type Draft = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  cover_image: string; author: string; category: string; tags: string;
  status: "draft" | "published"; featured: boolean;
  seo_title: string; seo_description: string;
};

const emptyDraft = (): Draft => ({
  id:"", slug:"", title:"", excerpt:"", content:"", cover_image:"",
  author:"YOUJIU Editorial Team", category:"Industry Insights", tags:"",
  status:"draft", featured:false, seo_title:"", seo_description:""
});

function slugify(value:string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
}
function headers(token:string) {
  return { apikey:KEY, Authorization:`Bearer ${token}`, "Content-Type":"application/json" };
}

export default function BlogManager({ accessToken }: { accessToken:string }) {
  const [posts,setPosts]=useState<BlogPost[]>([]);
  const [draft,setDraft]=useState<Draft>(emptyDraft());
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [busy,setBusy]=useState(false);
  const [uploading,setUploading]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");

  async function load() {
    const response=await fetch(`${API}/rest/v1/blog_posts?select=*&order=updated_at.desc&limit=1000`,{headers:headers(accessToken),cache:"no-store"});
    if(!response.ok) throw new Error(await response.text() || "读取 Blog 文章失败。");
    setPosts(await response.json());
  }
  useEffect(()=>{ if(accessToken) void load().catch(e=>setError(e.message)); },[accessToken]);

  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase();
    return posts.filter(post=>(filter==="all"||post.status===filter)&&(!term||post.title.toLowerCase().includes(term)||post.slug.toLowerCase().includes(term)||(post.category||"").toLowerCase().includes(term)));
  },[posts,search,filter]);

  function edit(post:BlogPost) {
    setDraft({
      id:post.id, slug:post.slug, title:post.title, excerpt:post.excerpt||"", content:post.content||"",
      cover_image:post.cover_image||post.image||"", author:post.author||"YOUJIU Editorial Team",
      category:post.category||"Industry Insights", tags:(post.tags||[]).join(", "),
      status:post.status||"draft", featured:Boolean(post.featured),
      seo_title:post.seo_title||"", seo_description:post.seo_description||""
    });
    setError("");setNotice("");
    window.scrollTo({top:0,behavior:"smooth"});
  }

  async function uploadCover(event:React.ChangeEvent<HTMLInputElement>) {
    const file=event.target.files?.[0]; event.target.value="";
    if(!file) return;
    if(!["image/jpeg","image/png","image/webp","image/avif"].includes(file.type)) {setError("封面图片仅支持 JPG、PNG、WebP 或 AVIF。");return;}
    if(file.size>12*1024*1024) {setError("封面图片不能超过 12MB。");return;}
    setUploading(true);setError("");
    try {
      const ext=file.name.split(".").pop()?.toLowerCase()||"jpg";
      const path=`blog/${slugify(draft.slug||draft.title||"article")||"article"}/${crypto.randomUUID()}.${ext}`;
      const response=await fetch(`${API}/storage/v1/object/blog-images/${path}`,{
        method:"POST",headers:{apikey:KEY,Authorization:`Bearer ${accessToken}`,"Content-Type":file.type,"x-upsert":"false"},body:file
      });
      if(!response.ok) throw new Error(await response.text()||"封面上传失败。");
      setDraft(d=>({...d,cover_image:`${API}/storage/v1/object/public/blog-images/${path}`}));
      setNotice("封面图片上传成功。保存文章后生效。");
    } catch(e) {setError(e instanceof Error?e.message:"封面上传失败。");}
    finally {setUploading(false);}
  }

  async function save(event:React.FormEvent<HTMLFormElement>) {
    event.preventDefault();setBusy(true);setError("");setNotice("");
    try {
      const title=draft.title.trim();
      const slug=slugify(draft.slug||title);
      if(!title||!slug) throw new Error("请填写文章标题，并确保 URL Slug 有效。");
      if(!draft.content.trim()) throw new Error("请填写文章正文。");
      const now=new Date().toISOString();
      const payload={
        id:draft.id||crypto.randomUUID(), slug, title, excerpt:draft.excerpt.trim(), content:draft.content,
        image:draft.cover_image.trim()||null, cover_image:draft.cover_image.trim()||null,
        author:draft.author.trim()||"YOUJIU Editorial Team", category:draft.category.trim()||"Industry Insights",
        tags:draft.tags.split(",").map(x=>x.trim()).filter(Boolean),
        status:draft.status, featured:draft.featured,
        published_at:draft.status==="published"?(posts.find(p=>p.id===draft.id)?.published_at||now):null,
        date:now.slice(0,10), seo_title:draft.seo_title.trim()||title,
        seo_description:draft.seo_description.trim()||draft.excerpt.trim(), updated_at:now
      };
      const url=draft.id?`${API}/rest/v1/blog_posts?id=eq.${encodeURIComponent(draft.id)}`:`${API}/rest/v1/blog_posts`;
      const response=await fetch(url,{method:draft.id?"PATCH":"POST",headers:{...headers(accessToken),Prefer:"return=representation"},body:JSON.stringify(payload)});
      if(!response.ok) throw new Error(await response.text()||"保存文章失败。");
      await load();setDraft(emptyDraft());setNotice(draft.id?"文章已更新。":"文章已创建。");
    } catch(e) {setError(e instanceof Error?e.message:"保存文章失败。");}
    finally {setBusy(false);}
  }

  async function remove(post:BlogPost) {
    if(!window.confirm(`确定永久删除文章「${post.title}」吗？`)) return;
    setBusy(true);setError("");setNotice("");
    try {
      const response=await fetch(`${API}/rest/v1/blog_posts?id=eq.${encodeURIComponent(post.id)}`,{method:"DELETE",headers:headers(accessToken)});
      if(!response.ok) throw new Error(await response.text()||"删除文章失败。");
      await load();if(draft.id===post.id)setDraft(emptyDraft());setNotice("文章已删除。");
    } catch(e) {setError(e instanceof Error?e.message:"删除文章失败。");}
    finally {setBusy(false);}
  }

  async function togglePublish(post:BlogPost) {
    const status=post.status==="published"?"draft":"published";
    const response=await fetch(`${API}/rest/v1/blog_posts?id=eq.${encodeURIComponent(post.id)}`,{
      method:"PATCH",headers:{...headers(accessToken),Prefer:"return=minimal"},
      body:JSON.stringify({status,published_at:status==="published"?(post.published_at||new Date().toISOString()):null,updated_at:new Date().toISOString()})
    });
    if(!response.ok){setError(await response.text()||"更新发布状态失败。");return;}
    await load();setNotice(status==="published"?"文章已发布。":"文章已撤回为草稿。");
  }

  const published=posts.filter(p=>p.status==="published").length;
  return <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
    <section className="bg-white border border-slate-200">
      <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3"><div><h2 className="font-black text-lg">Blog 文章库</h2><p className="text-xs text-slate-500 mt-1">{posts.length} 篇文章 · 已发布 {published} 篇</p></div><button type="button" onClick={()=>{setDraft(emptyDraft());setError("");setNotice("");}} className="bg-[#101923] text-white text-xs font-bold px-3 py-3">＋ 新建文章</button></div>
      <div className="p-4 space-y-3"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="搜索标题、Slug 或分类" className="w-full border border-slate-300 px-3 py-3 text-sm"/><select value={filter} onChange={e=>setFilter(e.target.value)} className="w-full border border-slate-300 px-3 py-3 text-sm bg-white"><option value="all">全部文章</option><option value="published">已发布</option><option value="draft">草稿</option></select></div>
      <div className="divide-y divide-slate-100 max-h-[900px] overflow-y-auto">{filtered.map(post=><div key={post.id} className={`p-4 ${draft.id===post.id?"bg-[#f4f7e9]":""}`}><div className="flex gap-3">{(post.cover_image||post.image)&&<img src={post.cover_image||post.image||""} alt="" className="w-20 h-16 object-cover bg-slate-100"/>}<div className="min-w-0 flex-1"><div className="font-bold text-sm line-clamp-2">{post.title}</div><div className="text-[10px] text-slate-500 mt-1">{post.category} · {post.slug}</div><span className={`inline-block mt-2 text-[9px] px-2 py-1 ${post.status==="published"?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{post.status==="published"?"已发布":"草稿"}</span></div></div><div className="flex gap-4 mt-3 text-xs font-bold"><button type="button" onClick={()=>edit(post)} className="underline">编辑</button><button type="button" onClick={()=>void togglePublish(post)}>{post.status==="published"?"撤回":"发布"}</button><button type="button" onClick={()=>void remove(post)} className="text-red-600">删除</button>{post.status==="published"&&<a href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" className="underline">查看</a>}</div></div>)}{!filtered.length&&<div className="p-8 text-sm text-slate-500 text-center">没有匹配的文章。</div>}</div>
    </section>
    <section className="bg-white border border-slate-200">
      <div className="p-5 border-b border-slate-200"><div className="text-[10px] tracking-widest text-[#7ca51c] font-black">BLOG EDITOR</div><h2 className="font-black text-xl mt-1">{draft.id?"编辑文章":"新建文章"}</h2><p className="text-xs text-slate-500 mt-2">正文支持 Markdown。保存后可直接发布，无需重新部署。</p></div>
      {notice&&<p role="status" className="mx-5 mt-5 p-3 bg-emerald-50 text-emerald-800 text-sm">{notice}</p>}
      {error&&<p role="alert" className="mx-5 mt-5 p-3 bg-red-50 text-red-800 text-sm whitespace-pre-wrap">{error}</p>}
      <form onSubmit={save} className="p-5 md:p-7 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-xs font-bold md:col-span-2">文章标题 / Title<input required value={draft.title} onChange={e=>setDraft(d=>({...d,title:e.target.value,slug:d.slug||slugify(e.target.value)}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
          <label className="block text-xs font-bold">URL Slug<input required value={draft.slug} onChange={e=>setDraft(d=>({...d,slug:slugify(e.target.value)}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
          <label className="block text-xs font-bold">文章分类<input value={draft.category} onChange={e=>setDraft(d=>({...d,category:e.target.value}))} placeholder="Industry Insights" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
          <label className="block text-xs font-bold">作者<input value={draft.author} onChange={e=>setDraft(d=>({...d,author:e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
          <label className="block text-xs font-bold">标签（英文逗号分隔）<input value={draft.tags} onChange={e=>setDraft(d=>({...d,tags:e.target.value}))} placeholder="electric motorcycle, export, OEM" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
        </div>
        <label className="block text-xs font-bold">文章摘要 / Excerpt<textarea rows={3} value={draft.excerpt} onChange={e=>setDraft(d=>({...d,excerpt:e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
        <div className="border-t border-slate-200 pt-5"><div className="flex flex-wrap justify-between items-center gap-3"><div><h3 className="font-black">文章封面图</h3><p className="text-xs text-slate-500 mt-1">JPG / PNG / WebP / AVIF，单张最大 12MB。</p></div><label className="inline-flex bg-[#101923] text-white px-4 py-3 text-xs font-bold cursor-pointer">{uploading?"正在上传…":"上传封面图"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={uploading} onChange={uploadCover} className="hidden"/></label></div><input value={draft.cover_image} onChange={e=>setDraft(d=>({...d,cover_image:e.target.value}))} placeholder="封面图片 URL" className="w-full border border-slate-300 px-3 py-3 mt-3 text-xs font-normal"/>{draft.cover_image&&<img src={draft.cover_image} alt="封面预览" className="mt-3 max-h-64 w-full object-cover bg-slate-100"/>}</div>
        <label className="block text-xs font-bold">文章正文 / Markdown<textarea required rows={22} value={draft.content} onChange={e=>setDraft(d=>({...d,content:e.target.value}))} placeholder={"# Main heading\n\nWrite your article here...\n\n## Section heading\n\n- Key point one\n- Key point two"} className="w-full border border-slate-300 px-4 py-4 mt-2 text-sm leading-7 font-mono font-normal"/></label>
        <div className="border-t border-slate-200 pt-5"><h3 className="font-black mb-4">搜索引擎设置 / SEO</h3><div className="grid md:grid-cols-2 gap-4"><label className="block text-xs font-bold">SEO Title<input value={draft.seo_title} onChange={e=>setDraft(d=>({...d,seo_title:e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><label className="block text-xs font-bold">Meta Description<textarea rows={2} value={draft.seo_description} onChange={e=>setDraft(d=>({...d,seo_description:e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label></div></div>
        <div className="border-t border-slate-200 pt-5 flex flex-wrap items-center gap-5"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={e=>setDraft(d=>({...d,featured:e.target.checked}))}/>推荐文章</label><label className="flex items-center gap-2 text-sm"><span>发布状态</span><select value={draft.status} onChange={e=>setDraft(d=>({...d,status:e.target.value as "draft"|"published"}))} className="border border-slate-300 px-3 py-2 bg-white"><option value="draft">保存为草稿</option><option value="published">发布到网站</option></select></label><div className="ml-auto flex gap-2"><button type="button" onClick={()=>setDraft(emptyDraft())} className="border border-slate-300 px-4 py-3 text-xs font-bold">清空</button><button disabled={busy||uploading} className="btn-primary disabled:opacity-50">{busy?"保存中…":"保存文章"}</button></div></div>
      </form>
    </section>
  </div>;
}
