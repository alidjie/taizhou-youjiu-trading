"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { productCategories } from "../../../data/company";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";
const SESSION = "youjiu-cms-session";
const languages = [{id:"fr",name:"Français"},{id:"de",name:"Deutsch"},{id:"es",name:"Español"},{id:"ar",name:"العربية"},{id:"ru",name:"Русский"},{id:"pt",name:"Português"}];

type Row = { id:string; entity_type:string; entity_id:string; locale:string; source_content:Record<string,unknown>; translated_content:Record<string,unknown>; status:string; updated_at:string };
type ProductOption = { id:string; name:string; model_code:string|null; slug:string };
type ContentOption = { key:string; page:string; label:string };
type BlogOption = { id:string; title:string; slug:string; excerpt:string; category:string|null; tags:string[]|null; author:string|null; seo_title:string|null; seo_description:string|null };

export default function TranslationAdmin() {
  const [token,setToken]=useState("");
  const [rows,setRows]=useState<Row[]>([]);
  const [productOptions,setProductOptions]=useState<ProductOption[]>([]);
  const [contentOptions,setContentOptions]=useState<ContentOption[]>([]);
  const [blogOptions,setBlogOptions]=useState<BlogOption[]>([]);
  const [locale,setLocale]=useState("fr");
  const [entityType,setEntityType]=useState("site_content");
  const [entityId,setEntityId]=useState("home.hero");
  const [source,setSource]=useState(`{
  "eyebrow": "YOUR GLOBAL MOBILITY & COMPONENTS PARTNER",
  "headline_before": "MOVE THE",
  "headline_accent": "FUTURE",
  "headline_after": "FORWARD.",
  "body": "Electric mobility products and industrial components for global distributors and OEM partners."
}`);
  const [translated,setTranslated]=useState("");
  const [status,setStatus]=useState("draft");
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState("");
  const [error,setError]=useState("");

  async function refreshSession(refreshToken:string) {
    const response=await fetch(`${API}/auth/v1/token?grant_type=refresh_token`,{method:"POST",headers:{apikey:KEY,"Content-Type":"application/json"},body:JSON.stringify({refresh_token:refreshToken})});
    const result=await response.json();
    if(!response.ok||!result.access_token) throw new Error(result.msg||"后台登录已失效，请先返回后台重新登录。");
    setToken(result.access_token);
    const admin=await fetch(`${API}/rest/v1/cms_admins?select=user_id&limit=1`,{headers:{apikey:KEY,Authorization:`Bearer ${result.access_token}`}});
    const members=admin.ok?await admin.json():[];
    if(!members.length) throw new Error("当前账号没有 YOUJIU CMS 管理员权限。");
    return result.access_token as string;
  }

  async function load(access:string) {
    const headers={apikey:KEY,Authorization:`Bearer ${access}`};
    const [translationsResponse,productsResponse,contentResponse,blogsResponse]=await Promise.all([
      fetch(`${API}/rest/v1/site_translations?select=*&order=updated_at.desc&limit=200`,{headers}),
      fetch(`${API}/rest/v1/products?select=id,name,model_code,slug&order=name.asc&limit=1000`,{headers}),
      fetch(`${API}/rest/v1/site_content?select=key,page,label&order=page.asc,sort_order.asc&limit=500`,{headers}),
      fetch(`${API}/rest/v1/blog_posts?select=id,title,slug,excerpt,category,tags,author,seo_title,seo_description&order=title.asc&limit=1000`,{headers})
    ]);
    for(const response of [translationsResponse,productsResponse,contentResponse,blogsResponse]) {
      if(!response.ok) throw new Error(await response.text());
    }
    setRows(await translationsResponse.json());
    setProductOptions(await productsResponse.json());
    setContentOptions(await contentResponse.json());
    setBlogOptions(await blogsResponse.json());
  }

  useEffect(()=>{let alive=true;try{const saved=localStorage.getItem(SESSION);if(saved){const parsed=JSON.parse(saved);if(parsed.refresh_token) void refreshSession(parsed.refresh_token).then(access=>load(access)).catch(e=>{if(alive)setError(e.message);});}else setError("请先在主后台登录。");}catch{setError("无法读取后台登录会话，请先登录主后台。");}return()=>{alive=false;};},[]);

  async function loadSource() {
    setBusy(true); setError(""); setMessage("");
    try {
      if (entityType === "category") {
        const sourceRecord = productCategories.find(category => category.id === entityId);
        if (!sourceRecord) {
          throw new Error("产品分类 ID 不正确。请从内容 ID 下拉列表选择有效分类，或切换到“页面文案模块”。");
        }
        setSource(JSON.stringify({ name: sourceRecord.name, description: sourceRecord.description, image: sourceRecord.image }, null, 2));
      } else if (entityType === "blog") {
        const sourceRecord = blogOptions.find(post => post.id === entityId);
        if (!sourceRecord) throw new Error("请选择一个有效的 Blog 文章。");
        const response = await fetch(`${API}/rest/v1/blog_posts?select=content&id=eq.${encodeURIComponent(entityId)}&limit=1`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(await response.text());
        const articleRows = await response.json();
        if (!articleRows.length) throw new Error("没有找到该 Blog 正文。");
        setSource(JSON.stringify({
          title: sourceRecord.title, excerpt: sourceRecord.excerpt, content: articleRows[0].content,
          category: sourceRecord.category, tags: sourceRecord.tags, author: sourceRecord.author,
          seo_title: sourceRecord.seo_title, seo_description: sourceRecord.seo_description
        }, null, 2));
      } else {
        const table = entityType === "site_content" ? "site_content" : "products";
        const select = entityType === "site_content" ? "content" : "name,model_code,short_description,description,specifications,features,certifications,seo_title,seo_description";
        const filter = entityType === "site_content" ? `key=eq.${encodeURIComponent(entityId)}` : `id=eq.${encodeURIComponent(entityId)}`;
        const response = await fetch(`${API}/rest/v1/${table}?select=${select}&${filter}&limit=1`, { headers: { apikey: KEY, Authorization: `Bearer ${token}` } });
        if (!response.ok) throw new Error(await response.text());
        const records = await response.json();
        if (!records.length) throw new Error("没有找到该内容。请核对内容 ID，或直接在左侧粘贴英文 JSON。");
        setSource(JSON.stringify(entityType === "site_content" ? records[0].content : records[0], null, 2));
      }
      setTranslated("");
      setStatus("draft");
      setMessage("已加载英文原文。现在可以执行 AI 自动翻译。");
    } catch(e) { setError(e instanceof Error ? e.message : "读取英文原文失败"); }
    finally { setBusy(false); }
  }

  async function translate() {
    setBusy(true);setError("");setMessage("");
    try {
      const parsed=JSON.parse(source);
      const saved=localStorage.getItem(SESSION);
      const refreshToken=saved ? (JSON.parse(saved) as {refresh_token?:string}).refresh_token : undefined;
      if(!refreshToken) throw new Error("后台登录状态不存在，请返回主后台重新登录。");
      const freshAccessToken=await refreshSession(refreshToken);
      const response=await fetch("/api/translations/translate",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${freshAccessToken}`},
        body:JSON.stringify({locale,source:parsed,accessToken:freshAccessToken})
      });
      const result=await response.json();
      if(!response.ok) throw new Error(result.error||"自动翻译失败");
      setTranslated(JSON.stringify(result.translated,null,2));
      setStatus("draft");
      setMessage("AI 翻译已生成。请逐项检查专业术语、型号和技术参数后再保存发布。");
    } catch(e) {setError(e instanceof Error?e.message:"翻译失败");}
    finally {setBusy(false);}
  }

  async function save(publish:boolean) {
    setBusy(true);setError("");setMessage("");
    try {
      const sourceObject=JSON.parse(source);
      const translatedObject=JSON.parse(translated);
      const response=await fetch(`${API}/rest/v1/site_translations?on_conflict=entity_type,entity_id,locale`,{
        method:"POST",
        headers:{apikey:KEY,Authorization:`Bearer ${token}`,"Content-Type":"application/json",Prefer:"resolution=merge-duplicates,return=representation"},
        body:JSON.stringify({entity_type:entityType,entity_id:entityId,locale,source_content:sourceObject,translated_content:translatedObject,status:publish?"published":"draft",published_at:publish?new Date().toISOString():null,updated_at:new Date().toISOString()})
      });
      if(!response.ok) throw new Error(await response.text());
      setStatus(publish?"published":"draft");
      await load(token);
      setMessage(publish?"翻译已发布到对应语言页面。":"翻译草稿已保存。");
    } catch(e) {setError(e instanceof Error?e.message:"保存失败");}
    finally {setBusy(false);}
  }

  function openRow(row:Row) {
    setEntityType(row.entity_type);setEntityId(row.entity_id);setLocale(row.locale);
    setSource(JSON.stringify(row.source_content,null,2));setTranslated(JSON.stringify(row.translated_content,null,2));setStatus(row.status);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  return <main className="min-h-screen bg-[#f3f5f5] text-[#101923]">
    <header className="bg-[#101923] text-white"><div className="max-w-7xl mx-auto px-5 py-5 flex flex-wrap justify-between items-center gap-3"><div><div className="text-xs tracking-[.2em] text-[#b8ed36] font-black">YOUJIU CMS</div><h1 className="text-2xl font-black mt-1">多语言翻译管理</h1></div><Link href="/admin" className="text-sm border border-white/30 px-4 py-2">返回主后台</Link></div></header>
    <div className="max-w-7xl mx-auto px-5 py-8 grid xl:grid-cols-[minmax(0,1fr)_390px] gap-6 items-start">
      <section className="bg-white border border-slate-200 p-5 md:p-7">
        <h2 className="font-black text-lg">创建 / 编辑翻译</h2>
        <p className="text-sm text-slate-500 mt-2">先提供英文源文案 JSON。AI 生成目标语言草稿，人工校对后再发布。字段名称、型号、URL 和技术参数会保留。</p>
        <div className="grid md:grid-cols-3 gap-4 mt-6">
  <label className="text-xs font-bold">目标语言<select value={locale} onChange={e=>setLocale(e.target.value)} className="block w-full mt-2 border p-3 bg-white">{languages.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label>
  <label className="text-xs font-bold">内容类型<select value={entityType} onChange={e=>{const next=e.target.value;setEntityType(next);setEntityId(next==="category"?productCategories[0].id:next==="site_content"?(contentOptions[0]?.key||""):next==="blog"?(blogOptions[0]?.id||""):(productOptions[0]?.id||""));setTranslated("");setStatus("draft");}} className="block w-full mt-2 border p-3 bg-white"><option value="site_content">页面文案模块</option><option value="product">产品详情</option><option value="category">产品分类</option><option value="blog">Blog 文章</option></select></label>
  <label className="text-xs font-bold">内容 ID{entityType==="category"?<select value={entityId} onChange={e=>setEntityId(e.target.value)} className="block w-full mt-2 border p-3 bg-white">{productCategories.map(category=><option key={category.id} value={category.id}>{category.name}</option>)}</select>:entityType==="site_content"?<select value={entityId} onChange={e=>setEntityId(e.target.value)} className="block w-full mt-2 border p-3 bg-white"><option value="">请选择页面文案模块</option>{contentOptions.map(item=><option key={item.key} value={item.key}>{item.page} · {item.label} ({item.key})</option>)}</select>:entityType==="blog"?<select value={entityId} onChange={e=>setEntityId(e.target.value)} className="block w-full mt-2 border p-3 bg-white"><option value="">请选择 Blog 文章</option>{blogOptions.map(item=><option key={item.id} value={item.id}>{item.title} ({item.slug})</option>)}</select>:<select value={entityId} onChange={e=>setEntityId(e.target.value)} className="block w-full mt-2 border p-3 bg-white"><option value="">请选择产品</option>{productOptions.map(item=><option key={item.id} value={item.id}>{item.name}{item.model_code ? " · "+item.model_code : ""} ({item.slug})</option>)}</select>}</label>
</div>
        <div className="grid lg:grid-cols-2 gap-5 mt-6">
          <label className="text-xs font-bold">英文源文案（JSON）<button type="button" onClick={loadSource} disabled={busy||!token} className="ml-3 border border-slate-300 px-3 py-1 text-[10px] disabled:opacity-40">从现有网站内容加载</button><textarea rows={20} value={source} onChange={e=>setSource(e.target.value)} className="block w-full mt-2 border p-3 font-mono text-xs leading-5"/></label>
          <label className="text-xs font-bold">AI 翻译结果（可直接人工修改）<textarea rows={20} dir={locale==="ar"?"rtl":"auto"} value={translated} onChange={e=>setTranslated(e.target.value)} placeholder="点击“AI 自动翻译”后显示结果" className="block w-full mt-2 border p-3 font-mono text-xs leading-5"/></label>
        </div>
        <div className="flex flex-wrap gap-3 mt-5">
          <button disabled={busy||!token} onClick={translate} className="bg-[#101923] text-white px-5 py-3 text-xs font-bold disabled:opacity-40">{busy?"处理中...":"AI 自动翻译"}</button>
          <button disabled={busy||!translated||!token} onClick={()=>save(false)} className="border border-slate-300 px-5 py-3 text-xs font-bold disabled:opacity-40">保存为草稿</button>
          <button disabled={busy||!translated||!token} onClick={()=>save(true)} className="bg-[#b8ed36] text-[#101923] px-5 py-3 text-xs font-black disabled:opacity-40">人工校对完成，发布</button>
          <span className="self-center text-xs text-slate-500">当前状态：{status==="published"?"已发布":"草稿"}</span>
        </div>
        {message&&<p role="status" className="text-sm text-emerald-700 mt-4">{message}</p>}
        {error&&<p role="alert" className="text-sm text-red-700 mt-4 whitespace-pre-wrap">{error}</p>}
      </section>
      <aside className="bg-white border border-slate-200">
        <div className="p-5 border-b"><h2 className="font-black">已有翻译记录</h2><p className="text-xs text-slate-500 mt-1">点击记录可继续编辑或重新发布</p></div>
        <div className="divide-y max-h-[75vh] overflow-auto">{rows.map(row=><button key={row.id} onClick={()=>openRow(row)} className="w-full text-left p-4 hover:bg-slate-50"><div className="flex justify-between gap-2"><b className="text-sm">{row.entity_id}</b><span className={row.status==="published"?"text-emerald-700":"text-amber-700"}>{row.status==="published"?"已发布":"草稿"}</span></div><div className="text-xs text-slate-500 mt-1">{row.entity_type} · {row.locale.toUpperCase()}</div></button>)}{!rows.length&&<p className="p-6 text-sm text-slate-400">尚无翻译记录。</p>}</div>
      </aside>
    </div>
  </main>;
}
