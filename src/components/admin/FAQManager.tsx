"use client";

import { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

type Source = { title: string; publisher?: string; url: string; verified_on?: string };
type FAQ = {
  id: string; slug: string; question: string; answer: string; category: string;
  product_categories: string[]; keywords: string[]; locale: string;
  status: "suggested" | "draft" | "published" | "archived";
  sources: Source[]; research_summary: string | null; research_date: string | null;
  ai_generated: boolean; revision_of: string | null; featured: boolean;
  published_at: string | null; reviewed_at: string | null; created_at: string; updated_at: string;
};
type Draft = {
  id: string; revision_of: string; slug: string; question: string; answer: string;
  category: string; product_categories: string; keywords: string; locale: string;
  sources_text: string; research_summary: string; research_date: string;
  status: "suggested" | "draft"; ai_generated: boolean; featured: boolean;
};
const emptyDraft = (): Draft => ({
  id: "", revision_of: "", slug: "", question: "", answer: "", category: "Purchasing & Quotation",
  product_categories: "electric-motorcycles", keywords: "", locale: "en",
  sources_text: "", research_summary: "", research_date: new Date().toISOString().slice(0, 10),
  status: "draft", ai_generated: false, featured: false
});
function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
function apiHeaders(token: string) {
  return { apikey: KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
}
function toDraft(item: FAQ): Draft {
  return {
    id: item.id, revision_of: item.revision_of || "", slug: item.slug, question: item.question,
    answer: item.answer, category: item.category || "Purchasing", product_categories: (item.product_categories || []).join(", "),
    keywords: (item.keywords || []).join(", "), locale: item.locale || "en",
    sources_text: (item.sources || []).map(s => `${s.title} | ${s.url}`).join("\n"),
    research_summary: item.research_summary || "", research_date: item.research_date || "",
    status: item.status === "draft" ? "draft" : "suggested", ai_generated: Boolean(item.ai_generated), featured: Boolean(item.featured)
  };
}
function parseSources(value: string): Source[] {
  return value.split("\n").map(line => line.trim()).filter(Boolean).map(line => {
    const index = line.indexOf("|");
    if (index < 1) throw new Error(`来源格式错误：${line}。请使用“来源标题 | https://网址”。`);
    const title = line.slice(0, index).trim();
    const url = line.slice(index + 1).trim();
    if (!/^https?:\/\//i.test(url)) throw new Error(`来源 URL 必须以 http:// 或 https:// 开头：${url}`);
    return { title, url };
  });
}

export default function FAQManager({ accessToken }: { accessToken: string }) {
  const [items, setItems] = useState<FAQ[]>([]);
  const [draft, setDraft] = useState<Draft>(emptyDraft());
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    const response = await fetch(`${API}/rest/v1/faqs?select=*&order=updated_at.desc&limit=1000`, {
      headers: apiHeaders(accessToken), cache: "no-store"
    });
    if (!response.ok) throw new Error(await response.text() || "读取 FAQ 数据失败。");
    setItems(await response.json() as FAQ[]);
  }
  useEffect(() => { if (accessToken) void load().catch(e => setError(e.message)); }, [accessToken]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter(item =>
      (filter === "all" || item.status === filter) &&
      (!term || item.question.toLowerCase().includes(term) || item.category.toLowerCase().includes(term) ||
        (item.keywords || []).some(k => k.toLowerCase().includes(term)))
    );
  }, [items, search, filter]);

  function edit(item: FAQ) {
    setDraft(toDraft(item)); setError(""); setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(""); setNotice("");
    try {
      const question = draft.question.trim();
      const slug = slugify(draft.slug || question);
      if (!question || !slug) throw new Error("请填写问题，并确保 URL Slug 有效。");
      if (!draft.answer.trim()) throw new Error("请填写 AI 参考答案或编辑后的答案。");
      const sources = parseSources(draft.sources_text);
      const now = new Date().toISOString();
      const existing = items.find(item => item.id === draft.id);
      const isRevision = Boolean(existing && existing.status === "published");
      const payload = {
        slug: isRevision ? `${slug}-review-${Date.now()}` : slug,
        question, answer: draft.answer.trim(), category: draft.category.trim() || "General",
        product_categories: draft.product_categories.split(",").map(x => x.trim()).filter(Boolean),
        keywords: draft.keywords.split(",").map(x => x.trim()).filter(Boolean),
        locale: draft.locale || "en", sources, research_summary: draft.research_summary.trim() || null,
        research_date: draft.research_date || null, ai_generated: draft.ai_generated,
        revision_of: isRevision ? existing?.id : (draft.revision_of || null),
        status: isRevision ? "suggested" : draft.status, featured: draft.featured,
        updated_at: now
      };
      let response: Response;
      if (isRevision) {
        response = await fetch(`${API}/rest/v1/faqs`, {
          method: "POST", headers: { ...apiHeaders(accessToken), Prefer: "return=representation" },
          body: JSON.stringify(payload)
        });
      } else if (draft.id) {
        response = await fetch(`${API}/rest/v1/faqs?id=eq.${encodeURIComponent(draft.id)}`, {
          method: "PATCH", headers: { ...apiHeaders(accessToken), Prefer: "return=representation" },
          body: JSON.stringify(payload)
        });
      } else {
        response = await fetch(`${API}/rest/v1/faqs`, {
          method: "POST", headers: { ...apiHeaders(accessToken), Prefer: "return=representation" },
          body: JSON.stringify(payload)
        });
      }
      if (!response.ok) throw new Error(await response.text() || "保存 FAQ 失败。");
      await load(); setDraft(emptyDraft());
      setNotice(isRevision
        ? "已创建一条待审核的 FAQ 修订建议；当前线上版本保持不变。"
        : draft.id ? "FAQ 已保存，尚未公开发布。" : "FAQ 已加入审核队列，尚未公开发布。");
    } catch (e) { setError(e instanceof Error ? e.message : "保存 FAQ 失败。"); }
    finally { setBusy(false); }
  }

  async function publish(item: FAQ) {
    if (!window.confirm(`确认审核并发布这条 FAQ？\n\n${item.question}\n\n发布后访客可在网站 FAQ 栏目看到。`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${API}/rest/v1/faqs?id=eq.${encodeURIComponent(item.id)}`, {
        method: "PATCH", headers: { ...apiHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({
          status: "published", published_at: new Date().toISOString(),
          reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(await response.text() || "发布 FAQ 失败。");
      if (item.revision_of) {
        const oldResponse = await fetch(`${API}/rest/v1/faqs?id=eq.${encodeURIComponent(item.revision_of)}`, {
          method: "PATCH", headers: { ...apiHeaders(accessToken), Prefer: "return=minimal" },
          body: JSON.stringify({ status: "archived", updated_at: new Date().toISOString() })
        });
        if (!oldResponse.ok) {
          await fetch(`${API}/rest/v1/faqs?id=eq.${encodeURIComponent(item.id)}`, {
            method: "PATCH", headers: { ...apiHeaders(accessToken), Prefer: "return=minimal" },
            body: JSON.stringify({ status: "suggested", published_at: null, reviewed_at: null, updated_at: new Date().toISOString() })
          });
          throw new Error(await oldResponse.text() || "替换旧 FAQ 版本失败；新版本已恢复为待审核。");
        }
      }
      await load(); setNotice("FAQ 已由管理员确认并发布到网站。");
    } catch (e) { setError(e instanceof Error ? e.message : "发布失败。"); }
    finally { setBusy(false); }
  }

  async function changeStatus(item: FAQ, status: "draft" | "archived") {
    if (status === "archived" && !window.confirm("确认归档这条 FAQ？归档后不会在网站显示。")) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${API}/rest/v1/faqs?id=eq.${encodeURIComponent(item.id)}`, {
        method: "PATCH", headers: { ...apiHeaders(accessToken), Prefer: "return=minimal" },
        body: JSON.stringify({ status, updated_at: new Date().toISOString() })
      });
      if (!response.ok) throw new Error(await response.text() || "更新状态失败。");
      await load(); setNotice(status === "archived" ? "FAQ 已归档。" : "FAQ 已撤回为草稿。");
    } catch (e) { setError(e instanceof Error ? e.message : "更新状态失败。"); }
    finally { setBusy(false); }
  }

  async function remove(item: FAQ) {
    if (!window.confirm(`确定永久删除 FAQ「${item.question}」吗？`)) return;
    setBusy(true); setError(""); setNotice("");
    try {
      const response = await fetch(`${API}/rest/v1/faqs?id=eq.${encodeURIComponent(item.id)}`, {
        method: "DELETE", headers: apiHeaders(accessToken)
      });
      if (!response.ok) throw new Error(await response.text() || "删除失败。");
      await load(); if (draft.id === item.id) setDraft(emptyDraft()); setNotice("FAQ 已删除。");
    } catch (e) { setError(e instanceof Error ? e.message : "删除 FAQ 失败。"); }
    finally { setBusy(false); }
  }

  const counts = {
    suggested: items.filter(x => x.status === "suggested").length,
    draft: items.filter(x => x.status === "draft").length,
    published: items.filter(x => x.status === "published").length
  };

  return <div className="grid xl:grid-cols-[390px_minmax(0,1fr)] gap-6 items-start">
    <section className="bg-white border border-slate-200">
      <div className="p-5 border-b border-slate-200">
        <h2 className="font-black text-lg">FAQ 审核队列</h2>
        <p className="text-xs text-slate-500 mt-1">AI 建议 {counts.suggested} · 草稿 {counts.draft} · 已发布 {counts.published}</p>
      </div>
      <div className="p-4 space-y-3">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索问题、分类或关键词" className="w-full border border-slate-300 px-3 py-3 text-sm"/>
        <select value={filter} onChange={e => setFilter(e.target.value)} className="w-full border border-slate-300 px-3 py-3 text-sm bg-white">
          <option value="all">全部状态</option><option value="suggested">AI 建议 · 待审核</option><option value="draft">管理员草稿</option><option value="published">已发布</option><option value="archived">已归档</option>
        </select>
        <button type="button" onClick={() => { setDraft(emptyDraft()); setError(""); setNotice(""); }} className="w-full bg-[#101923] text-white px-4 py-3 text-xs font-bold">＋ 手工新增 FAQ</button>
      </div>
      <div className="divide-y divide-slate-100 max-h-[950px] overflow-y-auto">
        {filtered.map(item => <article key={item.id} className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-sm leading-5">{item.question}</div>
              <div className="text-[10px] text-slate-500 mt-1">{item.category} · {item.locale.toUpperCase()} · {item.research_date || "未标注研究日期"}</div>
            </div>
            <span className={`shrink-0 px-2 py-1 text-[9px] font-bold ${item.status === "published" ? "bg-emerald-50 text-emerald-700" : item.status === "suggested" ? "bg-amber-50 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              {item.status === "published" ? "已发布" : item.status === "suggested" ? "AI 待审核" : item.status === "draft" ? "草稿" : "已归档"}
            </span>
          </div>
          <div className="text-xs text-slate-600 mt-2 line-clamp-3 whitespace-pre-line">{item.answer}</div>
          <div className="flex flex-wrap gap-3 mt-3 text-xs font-bold">
            <button type="button" disabled={busy} onClick={() => edit(item)} className="underline">查看 / 编辑</button>
            {item.status !== "published" && item.status !== "archived" && <button type="button" disabled={busy} onClick={() => void publish(item)} className="text-emerald-700">审核并发布</button>}
            {item.status === "published" && <a href="/faq" target="_blank" rel="noreferrer" className="underline">查看前台</a>}
            {item.status === "published" && <button type="button" disabled={busy} onClick={() => void changeStatus(item, "draft")} className="text-amber-700">撤回</button>}
            {item.status !== "archived" && <button type="button" disabled={busy} onClick={() => void changeStatus(item, "archived")} className="text-slate-500">归档</button>}
            <button type="button" disabled={busy} onClick={() => void remove(item)} className="text-red-600">删除</button>
          </div>
        </article>)}
        {!filtered.length && <div className="p-8 text-center text-sm text-slate-500">没有匹配的 FAQ。</div>}
      </div>
    </section>

    <section className="bg-white border border-slate-200">
      <div className="p-5 border-b border-slate-200">
        <div className="text-[10px] tracking-widest text-[#7ca51c] font-black">FAQ KNOWLEDGE REVIEW</div>
        <h2 className="font-black text-xl mt-1">{draft.id ? "编辑 FAQ / 审核建议" : "新增 FAQ"}</h2>
        <p className="text-xs text-slate-500 mt-2">AI 结果仅作为管理员参考。保存不会自动发布；只有点击左侧「审核并发布」才会公开。</p>
      </div>
      {notice && <p role="status" className="mx-5 mt-5 p-3 bg-emerald-50 text-emerald-800 text-sm">{notice}</p>}
      {error && <p role="alert" className="mx-5 mt-5 p-3 bg-red-50 text-red-800 text-sm whitespace-pre-wrap">{error}</p>}
      <form onSubmit={save} className="p-5 md:p-7 space-y-5">
        <div className="grid md:grid-cols-2 gap-4">
          <label className="block text-xs font-bold md:col-span-2">采购问题 / Question
            <input required value={draft.question} onChange={e => setDraft(d => ({...d, question: e.target.value, slug: d.slug || slugify(e.target.value)}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/>
          </label>
          <label className="block text-xs font-bold">URL Slug
            <input required value={draft.slug} onChange={e => setDraft(d => ({...d, slug: slugify(e.target.value)}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/>
          </label>
          <label className="block text-xs font-bold">问题分类
            <select value={draft.category} onChange={e => setDraft(d => ({...d, category: e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal bg-white">
              {["Purchasing & Quotation","Product Selection","OEM & CKD/SKD","Motors & Powertrain","Battery & Charging","Suspension & Components","Certification & Compliance","Shipping & Logistics","Quality & Inspection","After-sales & Warranty","General"].map(v => <option key={v}>{v}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold">产品分类（英文逗号分隔）
            <input value={draft.product_categories} onChange={e => setDraft(d => ({...d, product_categories: e.target.value}))} placeholder="electric-motorcycles, electric-bicycles" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/>
          </label>
          <label className="block text-xs font-bold">搜索关键词（英文逗号分隔）
            <input value={draft.keywords} onChange={e => setDraft(d => ({...d, keywords: e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/>
          </label>
          <label className="block text-xs font-bold">语言
            <select value={draft.locale} onChange={e => setDraft(d => ({...d, locale: e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal bg-white"><option value="en">English</option><option value="zh">简体中文</option><option value="es">Español</option><option value="fr">Français</option><option value="ar">العربية</option><option value="ru">Русский</option></select>
          </label>
        </div>
        <label className="block text-xs font-bold">参考答案 / Answer<textarea required rows={10} value={draft.answer} onChange={e => setDraft(d => ({...d, answer: e.target.value}))} className="w-full border border-slate-300 px-4 py-4 mt-2 text-sm leading-7 font-normal"/></label>
        <div className="border-t border-slate-200 pt-5 space-y-4">
          <div><h3 className="font-black">AI 研究摘要与来源</h3><p className="text-xs text-slate-500 mt-1">每条来源一行，格式：来源名称 | https://网址。法规和认证类问题至少核对官方来源。</p></div>
          <label className="block text-xs font-bold">研究摘要 / 事实边界<textarea rows={4} value={draft.research_summary} onChange={e => setDraft(d => ({...d, research_summary: e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
          <label className="block text-xs font-bold">来源链接<textarea rows={5} value={draft.sources_text} onChange={e => setDraft(d => ({...d, sources_text: e.target.value}))} placeholder={"EU Regulation 168/2013 | https://eur-lex.europa.eu/..."} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal font-mono"/></label>
          <label className="block text-xs font-bold">研究日期<input type="date" value={draft.research_date} onChange={e => setDraft(d => ({...d, research_date: e.target.value}))} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
        </div>
        <div className="border-t border-slate-200 pt-5 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.ai_generated} onChange={e => setDraft(d => ({...d, ai_generated: e.target.checked}))}/>AI 研究建议</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={draft.featured} onChange={e => setDraft(d => ({...d, featured: e.target.checked}))}/>精选问题</label>
          <label className="flex items-center gap-2 text-xs">保存状态
            <select value={draft.status} onChange={e => setDraft(d => ({...d, status: e.target.value as "suggested" | "draft"}))} className="border border-slate-300 px-2 py-2 bg-white"><option value="suggested">待管理员审核</option><option value="draft">管理员草稿</option></select>
          </label>
          <div className="ml-auto flex gap-2">
            <button type="button" onClick={() => {setDraft(emptyDraft());setError("");setNotice("");}} className="border border-slate-300 px-4 py-3 text-xs font-bold">清空</button>
            <button disabled={busy} className="btn-primary disabled:opacity-50">{busy ? "保存中…" : "保存为待审核 / 草稿"}</button>
          </div>
        </div>
      </form>
    </section>
  </div>;
}
