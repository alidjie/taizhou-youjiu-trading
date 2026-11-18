"use client";

import { useMemo, useState } from "react";

type FAQSource = { title: string; publisher?: string; url: string; verified_on?: string };
export type FAQItem = {
  id: string; slug: string; question: string; answer: string; category: string;
  product_categories: string[]; keywords: string[]; sources: FAQSource[]; featured: boolean;
};
const categoryLabels: Record<string,string> = {
  "Purchasing & Quotation": "Purchasing & Quotation",
  "Product Selection": "Product Selection",
  "OEM & CKD/SKD": "OEM & CKD/SKD",
  "Motors & Powertrain": "Motors & Powertrain",
  "Battery & Charging": "Battery & Charging",
  "Suspension & Components": "Suspension & Components",
  "Certification & Compliance": "Certification & Compliance",
  "Shipping & Logistics": "Shipping & Logistics",
  "Quality & Inspection": "Quality & Inspection",
  "After-sales & Warranty": "After-sales & Warranty",
  "General": "General"
};

export default function FAQContent({ items }: { items: FAQItem[] }) {
  const [search,setSearch]=useState("");
  const [category,setCategory]=useState("All");
  const categories=useMemo(()=>["All",...Array.from(new Set(items.map(x=>x.category))).sort()],[items]);
  const filtered=useMemo(()=>{
    const term=search.trim().toLowerCase();
    return items.filter(item=>
      (category==="All"||item.category===category) &&
      (!term || item.question.toLowerCase().includes(term) || item.answer.toLowerCase().includes(term) ||
        (item.keywords||[]).some(k=>k.toLowerCase().includes(term)))
    );
  },[items,search,category]);

  return <div>
    <div className="max-w-3xl mx-auto mb-10">
      <label className="block text-sm font-semibold text-slate-700">
        Search buyer questions
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Try: battery shipping, BLDC motor, EU approval, CKD…" className="mt-2 w-full border border-slate-300 bg-white px-4 py-4 text-sm outline-none focus:border-[#7ca51c]"/>
      </label>
    </div>
    <div className="flex flex-wrap justify-center gap-2 mb-10">
      {categories.map(value=><button key={value} type="button" onClick={()=>setCategory(value)} aria-pressed={category===value} className={`px-4 py-2 text-xs font-bold border transition ${category===value?"bg-[#101923] border-[#101923] text-white":"bg-white border-slate-300 text-slate-600 hover:border-[#7ca51c]"}`}>
        {value==="All"?"All topics":categoryLabels[value]||value}
      </button>)}
    </div>
    <div className="max-w-4xl mx-auto divide-y divide-slate-200 border-y border-slate-200">
      {filtered.map((item,index)=><details key={item.id} className="group py-6" open={search.trim().length>0 && index===0}>
        <summary className="flex cursor-pointer list-none items-start justify-between gap-5 font-bold text-[#101923] marker:hidden">
          <span className="flex gap-4"><span className="text-[#7ca51c] font-black text-xs pt-1">{String(index+1).padStart(2,"0")}</span><span className="text-base md:text-lg leading-7">{item.question}</span></span>
          <span className="shrink-0 w-8 h-8 border border-slate-300 flex items-center justify-center text-lg group-open:rotate-45 transition-transform" aria-hidden="true">+</span>
        </summary>
        <div className="pl-9 md:pl-10 pr-2 pt-5">
          <div className="text-sm md:text-base text-slate-600 leading-8 whitespace-pre-line">{item.answer}</div>
          {item.sources?.length>0&&<div className="mt-5 pt-4 border-t border-slate-100">
            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-2">References</div>
            <ul className="space-y-1">{item.sources.map((source,i)=><li key={i}><a href={source.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#557b10] underline underline-offset-2">{source.title}{source.publisher? ` — ${source.publisher}`:""}</a></li>)}</ul>
          </div>}
        </div>
      </details>)}
      {!filtered.length&&<div className="py-16 text-center text-sm text-slate-500">No matching questions yet. Contact our team for a product-specific answer.</div>}
    </div>
    <div className="max-w-4xl mx-auto mt-16 bg-[#101923] text-white p-8 md:p-12">
      <div className="text-[10px] tracking-[.2em] text-[#b8ed36] font-black">NEED A SPECIFIC ANSWER?</div>
      <h2 className="text-2xl md:text-3xl font-black mt-3">Discuss your market and sourcing requirements with YOUJIU.</h2>
      <p className="text-sm text-slate-300 leading-7 mt-4 max-w-2xl">Share your target country, vehicle class, technical requirements and expected order quantity. Our team can review the configuration and identify the documents that should be confirmed before production.</p>
      <a href="/inquiry" className="inline-flex mt-7 bg-[#b8ed36] text-[#101923] px-6 py-4 text-xs font-black tracking-widest hover:bg-white transition-colors">REQUEST A QUOTE ↗</a>
    </div>
  </div>;
}
