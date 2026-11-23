"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

const API = "https://fsqpeuulaglnnwfyxndj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

type Prospect = {
 id:string; company_name:string; country:string; city:string|null; website:string|null; domain:string|null;
 company_type:string; product_categories:string[]; company_profile:string|null; estimated_scale:string|null;
 import_evidence:string|null; contacts:Array<Record<string,string>>; source_urls:Array<Record<string,string>>;
 qualification_score:number; qualification_notes:string|null; discovered_at:string; last_verified_at:string|null;
 status:string; claimed_by:string|null; claim_expires_at:string|null;
};
type Alert = {id:string;customer_id:string;company_name:string;summary:string;contact_updates:Array<Record<string,string>>;source_urls:Array<Record<string,string>>;discovered_at:string;is_read:boolean};
type Props = {token:string;userId:string;role:"admin"|"sales"|"factory";onOpenCustomer?:(id:string)=>void};
const input="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm";
const fmt=(s?:string|null)=>s?new Date(s).toLocaleString("zh-CN",{hour12:false}):"—";
const contactLabel=(c:Record<string,string>)=>[c.name,c.title,c.department].filter(Boolean).join(" · ");

export default function ProspectPool({token,userId,role,onOpenCustomer}:Props){
 const [rows,setRows]=useState<Prospect[]>([]);
 const [alerts,setAlerts]=useState<Alert[]>([]);
 const [tab,setTab]=useState<"pool"|"mine"|"alerts">("pool");
 const [query,setQuery]=useState("");
 const [country,setCountry]=useState("");
 const [category,setCategory]=useState("all");
 const [loading,setLoading]=useState(false);
 const [busyId,setBusyId]=useState("");
 const [error,setError]=useState("");
 const [notice,setNotice]=useState("");

 const headers={apikey:KEY,Authorization:"Bearer "+token,"Content-Type":"application/json"};
 const request=useCallback(async<T,>(path:string,init?:RequestInit):Promise<T>=>{
  const response=await fetch(API+"/rest/v1/"+path,{...init,headers:{...headers,...(init?.headers||{})}});
  const body=await response.text();
  if(!response.ok)throw new Error(body||"CRM request failed");
  return body?JSON.parse(body) as T:undefined as T;
 },[token]);

 const load=useCallback(async()=>{
  setLoading(true);setError("");
  try{
   const [leads,notices]=await Promise.all([
    request<Prospect[]>("ai_prospect_leads?select=*&order=qualification_score.desc,discovered_at.desc&limit=1000"),
    request<Alert[]>("crm_ai_customer_alerts?select=*&order=discovered_at.desc&limit=500")
   ]);
   setRows(leads);setAlerts(notices);
  }catch(e){setError(e instanceof Error?e.message:"线索加载失败");}
  finally{setLoading(false);}
 },[request]);
 useEffect(()=>{if(role!=="factory")void load();},[load,role]);

 const filtered=useMemo(()=>rows.filter(row=>{
  const text=[row.company_name,row.country,row.city,row.website,row.company_type,row.company_profile,...(row.product_categories||[])].join(" ").toLowerCase();
  return (!query||text.includes(query.toLowerCase()))&&(!country||row.country.toLowerCase().includes(country.toLowerCase()))&&(category==="all"||(row.product_categories||[]).includes(category));
 }),[rows,query,country,category]);
 const available=filtered.filter(row=>row.status==="pool"||(row.status==="claimed"&&row.claim_expires_at&&new Date(row.claim_expires_at)<new Date()));
 const mine=filtered.filter(row=>row.status==="claimed"&&row.claimed_by===userId&&(!row.claim_expires_at||new Date(row.claim_expires_at)>new Date()));
 const unread=alerts.filter(a=>!a.is_read).length;

 async function claim(id:string){
  setBusyId(id);setError("");setNotice("");
  try{
   await request("rpc/crm_claim_ai_prospect",{method:"POST",body:JSON.stringify({p_lead_id:id})});
   setNotice("已认领该客户线索，当前由你跟进，认领有效期 30 天。");
   await load();setTab("mine");
  }catch(e){setError(e instanceof Error?e.message:"认领失败");}
  finally{setBusyId("");}
 }
 async function renew(id:string){
  setBusyId(id);setError("");setNotice("");
  try{await request("rpc/crm_renew_ai_prospect_claim",{method:"POST",body:JSON.stringify({p_lead_id:id})});setNotice("认领有效期已续期 30 天。");await load();}
  catch(e){setError(e instanceof Error?e.message:"续期失败");}
  finally{setBusyId("");}
 }
 async function markRead(alert:Alert){
  try{await request("crm_ai_customer_alerts?id=eq."+encodeURIComponent(alert.id),{method:"PATCH",headers:{Prefer:"return=minimal"},body:JSON.stringify({is_read:true})});setAlerts(current=>current.map(x=>x.id===alert.id?{...x,is_read:true}:x));}
  catch(e){setError(e instanceof Error?e.message:"标记提醒失败");}
 }
 const sourceLinks=(urls:Array<Record<string,string>>)=>urls.map((source,i)=>{
  const url=source.url||source.href||"";
  if(!/^https?:\/\//i.test(url))return null;
  return <a key={i} href={url} target="_blank" rel="noreferrer" className="text-emerald-700 underline break-all">{source.title||source.source||"来源 "+(i+1)}</a>;
 }).filter(Boolean);

 if(role==="factory")return null;
 return <div className="space-y-4">
  <div className="flex flex-wrap items-start justify-between gap-3">
   <div><h2 className="text-xl font-black">AI 海外客户公海</h2><p className="mt-1 text-sm text-slate-500">AI 收集海外进口商、批发商及 CKD 组装商；采购决策人和公开联系方式优先。线索需核实后再联系。</p></div>
   <button onClick={()=>void load()} disabled={loading} className={input}>{loading?"正在刷新…":"刷新线索"}</button>
  </div>
  <div className="grid gap-3 sm:grid-cols-3">
   <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">可认领公海线索</div><div className="mt-1 text-2xl font-black">{available.length}</div></div>
   <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">我已认领</div><div className="mt-1 text-2xl font-black">{mine.length}</div></div>
   <div className="rounded-xl border border-slate-200 bg-white p-4"><div className="text-xs text-slate-500">已有客户情报提醒</div><div className="mt-1 text-2xl font-black">{unread}</div></div>
  </div>
  <div className="flex flex-wrap gap-2">
   <button onClick={()=>setTab("pool")} className={tab==="pool"?"rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white":input}>公共公海（{available.length}）</button>
   <button onClick={()=>setTab("mine")} className={tab==="mine"?"rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white":input}>我的认领（{mine.length}）</button>
   <button onClick={()=>setTab("alerts")} className={tab==="alerts"?"rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white":input}>已有客户提醒（{unread}）</button>
  </div>
  {error&&<div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>}
  {notice&&<div className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{notice}</div>}
  {tab!=="alerts"&&<div className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-3">
   <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="搜索公司、国家、产品或业务类型" className={input+" min-w-[220px] flex-1"}/>
   <input value={country} onChange={e=>setCountry(e.target.value)} placeholder="国家筛选" className={input+" w-36"}/>
   <select value={category} onChange={e=>setCategory(e.target.value)} className={input}><option value="all">全部产品</option><option value="electric_motorcycle">两轮电动摩托车</option><option value="electric_tricycle">三轮电动摩托车</option><option value="low_speed_four_wheeler">低速四轮电动车</option><option value="bldc_motor">BLDC 电机</option></select>
  </div>}
  {tab==="pool"&&<div className="space-y-3">{available.map(row=><article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4">
   <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="text-lg font-black">{row.company_name}</h3><p className="mt-1 text-sm text-slate-500">{row.country}{row.city?", "+row.city:""} · {row.company_type}</p></div><div className="flex items-center gap-3"><span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold">匹配度 {row.qualification_score}/100</span><button onClick={()=>void claim(row.id)} disabled={busyId===row.id} className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{busyId===row.id?"处理中…":"认领客户"}</button></div></div>
   {row.website&&<a href={row.website.startsWith("http")?row.website:"https://"+row.website} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-emerald-700 underline">{row.website}</a>}
   <p className="mt-3 text-sm leading-6 text-slate-700">{row.company_profile||"暂无企业简介"}</p>
   <div className="mt-3 flex flex-wrap gap-2">{row.product_categories.map(cat=><span key={cat} className="rounded bg-slate-100 px-2 py-1 text-xs">{cat}</span>)}<span className="rounded bg-slate-100 px-2 py-1 text-xs">发现：{fmt(row.discovered_at)}</span></div>
   {row.import_evidence&&<p className="mt-3 text-sm"><strong>采购/进口证据：</strong>{row.import_evidence}</p>}
   {row.estimated_scale&&<p className="mt-2 text-sm"><strong>规模：</strong>{row.estimated_scale}</p>}
   <div className="mt-4 border-t border-slate-100 pt-3"><div className="text-xs font-bold text-slate-500">联系人 / 采购决策人</div><div className="mt-2 grid gap-2 md:grid-cols-2">{row.contacts.map((c,i)=><div key={i} className="rounded-lg bg-slate-50 p-3 text-sm"><div className="font-bold">{contactLabel(c)||"联系人待确认"}</div>{c.email&&<div className="mt-1">E-mail: <a href={"mailto:"+c.email} className="text-emerald-700 underline">{c.email}</a></div>}{c.whatsapp&&<div>WhatsApp: <a href={"https://wa.me/"+c.whatsapp.replace(/[^0-9]/g,"")} target="_blank" rel="noreferrer" className="text-emerald-700 underline">{c.whatsapp}</a></div>}{c.phone&&<div>电话：{c.phone}</div>}{c.wechat&&<div>WeChat: {c.wechat}</div>}{c.linkedin&&<div>LinkedIn: <a href={c.linkedin} target="_blank" rel="noreferrer" className="text-emerald-700 underline">查看资料</a></div>}{c.source&&<div className="mt-1 text-xs text-slate-500">联系人来源：{c.source}</div>}</div>)}</div></div>
   {row.qualification_notes&&<p className="mt-3 text-xs text-slate-500">{row.qualification_notes}</p>}
   <div className="mt-3 flex flex-wrap gap-2 text-xs">{sourceLinks(row.source_urls)}</div>
  </article>)}{!available.length&&<div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">暂无可认领线索。等待 AI 客户开发任务导入新的企业信息。</div>}</div>}
  {tab==="mine"&&<div className="space-y-3">{mine.map(row=><article key={row.id} className="rounded-xl border border-slate-200 bg-white p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><h3 className="font-black">{row.company_name}</h3><p className="text-sm text-slate-500">{row.country} · 认领到期：{fmt(row.claim_expires_at)}</p></div><button onClick={()=>void renew(row.id)} disabled={busyId===row.id} className={input}>续期 30 天</button></div><p className="mt-2 text-sm">{row.company_profile}</p><div className="mt-3 flex flex-wrap gap-3 text-sm">{row.contacts.map((c,i)=><span key={i}>{contactLabel(c)} {c.email||c.whatsapp||c.phone||c.wechat||""}</span>)}</div><div className="mt-3 flex flex-wrap gap-2 text-xs">{sourceLinks(row.source_urls)}</div></article>)}{!mine.length&&<div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">你目前没有认领中的线索。</div>}</div>}
  {tab==="alerts"&&<div className="space-y-3">{alerts.map(alert=><article key={alert.id} className={"rounded-xl border bg-white p-4 "+(alert.is_read?"border-slate-200":"border-amber-300 bg-amber-50/40")}><div className="flex flex-wrap items-start justify-between gap-2"><div><h3 className="font-black">{alert.company_name}</h3><p className="mt-1 text-xs text-slate-500">情报时间：{fmt(alert.discovered_at)} · 客户 ID：{alert.customer_id}</p></div><div className="flex gap-2">{onOpenCustomer&&<button onClick={()=>onOpenCustomer(alert.customer_id)} className="text-sm font-bold text-emerald-700">打开客户档案</button>}{!alert.is_read&&<button onClick={()=>void markRead(alert)} className="text-sm font-bold text-slate-600">标记已读</button>}</div></div><p className="mt-3 whitespace-pre-line text-sm leading-6">{alert.summary}</p>{alert.contact_updates.map((c,i)=><div key={i} className="mt-2 text-sm">{contactLabel(c)} · {c.email||c.whatsapp||c.phone||c.wechat||"无公开联系方式"}</div>)}<div className="mt-2 flex flex-wrap gap-2 text-xs">{sourceLinks(alert.source_urls)}</div></article>)}{!alerts.length&&<div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">暂无已有客户的新情报提醒。</div>}</div>}
  <p className="text-xs leading-5 text-slate-400">线索认领期限为 30 天，业务员可续期。若线索已匹配 CRM 中的客户，不重复进入公海，而是进入该客户负责人的情报提醒。联系人信息必须有公开来源；未查到的字段留空，不猜测、不补造。</p>
 </div>;
}
