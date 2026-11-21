"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type AnalyticsEvent = {
  id: number;
  visitor_id: string;
  event_type: "page_view" | "heartbeat" | "page_exit" | "product_engaged" | "inquiry_view";
  path: string;
  page_title: string | null;
  referrer_domain: string | null;
  duration_seconds: number;
  country: string | null;
  region: string | null;
  city: string | null;
  device_type: "desktop" | "mobile" | "tablet" | "unknown";
  created_at: string;
};

type Visitor = {
  id: string;
  latest: AnalyticsEvent;
  events: AnalyticsEvent[];
  pages: Array<{ path: string; title: string; seconds: number }>;
  productEngaged: boolean;
  inquiryViewed: boolean;
  online: boolean;
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

function durationLabel(seconds: number) {
  const safe = Math.max(0, seconds || 0);
  if (safe < 60) return safe + " 秒";
  return Math.floor(safe / 60) + " 分 " + (safe % 60) + " 秒";
}

function locationLabel(event: AnalyticsEvent) {
  return [event.city, event.region, event.country].filter(Boolean).join(" · ") || "地区信息暂不可用";
}

function pageLabel(event: AnalyticsEvent) {
  return event.page_title || event.path;
}

export default function VisitorMonitor({ accessToken }: { accessToken: string }) {
  const [events, setEvents] = useState<AnalyticsEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [windowHours, setWindowHours] = useState("24");
  const [showAll, setShowAll] = useState(false);

  const refresh = useCallback(async () => {
    if (!accessToken) return;
    try {
      const since = new Date(Date.now() - Number(windowHours) * 60 * 60 * 1000).toISOString();
      const query = new URLSearchParams({
        select: "id,visitor_id,event_type,path,page_title,referrer_domain,duration_seconds,country,region,city,device_type,created_at",
        created_at: "gte." + since,
        order: "created_at.desc",
        limit: "5000"
      });
      const response = await fetch(SUPABASE_URL + "/rest/v1/site_analytics_events?" + query.toString(), {
        headers: { apikey: SUPABASE_KEY, Authorization: "Bearer " + accessToken },
        cache: "no-store"
      });
      if (!response.ok) throw new Error(await response.text() || "读取访客数据失败");
      const rows = await response.json() as AnalyticsEvent[];
      setEvents(rows);
      setLastUpdated(new Date());
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "读取实时访客数据失败");
    } finally {
      setLoading(false);
    }
  }, [accessToken, windowHours]);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);

  const visitors = useMemo<Visitor[]>(() => {
    const map = new Map<string, AnalyticsEvent[]>();
    for (const event of events) {
      const list = map.get(event.visitor_id) || [];
      list.push(event);
      map.set(event.visitor_id, list);
    }
    const now = Date.now();
    return Array.from(map.entries()).map(([id, rows]) => {
      const sorted = [...rows].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
      const latest = sorted[0];
      const byPage = new Map<string, { path: string; title: string; seconds: number; at: number }>();
      for (const event of [...sorted].reverse()) {
        const previous = byPage.get(event.path);
        byPage.set(event.path, {
          path: event.path,
          title: event.page_title || event.path,
          seconds: Math.max(previous?.seconds || 0, event.duration_seconds || 0),
          at: Date.parse(event.created_at)
        });
      }
      const pages = Array.from(byPage.values()).sort((a, b) => a.at - b.at).map(({ path, title, seconds }) => ({ path, title, seconds }));
      const productEngaged = sorted.some(event => event.event_type === "product_engaged");
      const inquiryViewed = sorted.some(event => event.event_type === "inquiry_view");
      const ageSeconds = Math.max(0, (now - Date.parse(latest.created_at)) / 1000);
      const online = ageSeconds <= 45 && latest.event_type !== "page_exit";
      return { id, latest, events: sorted, pages, productEngaged, inquiryViewed, online };
    }).sort((a, b) => {
      const hotDiff = Number(b.productEngaged && b.inquiryViewed) - Number(a.productEngaged && a.inquiryViewed);
      if (hotDiff) return hotDiff;
      const onlineDiff = Number(b.online) - Number(a.online);
      return onlineDiff || Date.parse(b.latest.created_at) - Date.parse(a.latest.created_at);
    });
  }, [events]);

  const onlineVisitors = visitors.filter(visitor => visitor.online);
  const hotVisitors = visitors.filter(visitor => visitor.productEngaged && visitor.inquiryViewed);
  const productInterested = visitors.filter(visitor => visitor.productEngaged);
  const inquiryVisitors = visitors.filter(visitor => visitor.inquiryViewed);
  const countryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const visitor of onlineVisitors) {
      const country = visitor.latest.country || "未知地区";
      counts.set(country, (counts.get(country) || 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [onlineVisitors]);

  const visibleVisitors = showAll ? visitors : visitors.slice(0, 30);

  return <section className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <div className="text-[10px] tracking-[.2em] text-[#7ca51c] font-black">LIVE VISITOR INTELLIGENCE</div>
        <h2 className="text-2xl md:text-3xl font-black mt-2">实时访客监控</h2>
        <p className="text-xs text-slate-500 mt-2">每 10 秒自动刷新 · 在线定义：最近 45 秒内仍有活动 · 只统计网站公开页面</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select value={windowHours} onChange={event => setWindowHours(event.target.value)} className="border border-slate-300 bg-white px-3 py-2.5 text-xs">
          <option value="1">最近 1 小时</option><option value="6">最近 6 小时</option><option value="24">最近 24 小时</option><option value="72">最近 3 天</option>
        </select>
        <button type="button" onClick={() => void refresh()} className="border border-slate-300 bg-white px-3 py-2.5 text-xs font-bold">立即刷新 ↻</button>
      </div>
    </div>

    {error && <div role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700 whitespace-pre-wrap">{error}</div>}

    <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
      <div className="bg-[#101923] text-white p-5"><div className="text-[10px] tracking-widest text-slate-400">当前在线访客</div><div className="text-4xl font-black mt-2 tabular-nums">{onlineVisitors.length}</div><div className="text-[10px] text-[#b8ed36] mt-2">实时活动中</div></div>
      <div className="bg-white border border-slate-200 p-5"><div className="text-[10px] tracking-widest text-slate-500">高意向访客</div><div className="text-4xl font-black mt-2 tabular-nums">{onlineVisitors.filter(v => v.productEngaged && v.inquiryViewed).length}</div><div className="text-[10px] text-slate-400 mt-2">产品页超过 20 秒 + 进入询盘页，且当前在线</div></div>
      <div className="bg-white border border-slate-200 p-5"><div className="text-[10px] tracking-widest text-slate-500">产品深度浏览</div><div className="text-4xl font-black mt-2 tabular-nums">{productInterested.length}</div><div className="text-[10px] text-slate-400 mt-2">所选时间范围内达到 20 秒的独立访客</div></div>
      <div className="bg-white border border-slate-200 p-5"><div className="text-[10px] tracking-widest text-slate-500">访问询盘页面</div><div className="text-4xl font-black mt-2 tabular-nums">{inquiryVisitors.length}</div><div className="text-[10px] text-slate-400 mt-2">所选时间范围内的独立访客</div></div>
    </div>

    <div className="grid xl:grid-cols-[.8fr_1.2fr] gap-4">
      <section className="bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="font-black">当前在线国家 / 地区</h3><span className="text-[10px] text-slate-400">{onlineVisitors.length} 位在线</span></div>
        {countryCounts.length ? <div className="mt-4 space-y-3">{countryCounts.map(([country, count]) => <div key={country}><div className="flex justify-between text-xs mb-1"><span>{country}</span><b className="tabular-nums">{count}</b></div><div className="h-2 bg-slate-100 overflow-hidden"><div className="h-full bg-[#9acb22]" style={{ width: (count / Math.max(1, onlineVisitors.length) * 100) + "%" }}/></div></div>)}</div> : <p className="text-sm text-slate-400 mt-4">目前没有在线访客，或暂时无法取得访客地理信息。</p>}
        <p className="text-[10px] text-slate-400 mt-5 leading-5">国家、区域和城市来自 Vercel 请求地理信息，属于 IP 定位估算。代理网络或隐私工具可能导致缺失或偏差。</p>
      </section>
      <section className="bg-white border border-slate-200 p-5">
        <div className="flex items-center justify-between gap-3"><h3 className="font-black">重点关注规则</h3><span className="text-[10px] text-[#789d1d] font-bold">自动识别</span></div>
        <div className="grid sm:grid-cols-2 gap-3 mt-4">
          <div className="border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black">产品页深度浏览</div><div className="text-2xl font-black mt-2">≥ 20 秒</div><p className="text-[11px] text-slate-500 mt-1">产品详情页处于前台且累计停留达到 20 秒。</p></div>
          <div className="border border-slate-200 bg-slate-50 p-4"><div className="text-xs font-black">高意向行为</div><div className="text-2xl font-black mt-2">产品 + 询盘</div><p className="text-[11px] text-slate-500 mt-1">同一浏览会话达到产品深度浏览，并访问询盘页面。</p></div>
        </div>
        <p className="text-[10px] text-slate-400 mt-4">访客 ID 仅保存在当前浏览器标签页的 sessionStorage，不记录原始 IP、姓名或邮箱。访客关闭标签页后，在线状态通常在 45 秒内消失。</p>
      </section>
    </div>

    <section className="bg-white border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div><h3 className="font-black text-lg">访客实时明细</h3><p className="text-xs text-slate-500 mt-1">显示所选时间范围内的独立浏览会话，优先排列高意向访客</p></div>
        <div className="text-[10px] text-slate-400">{lastUpdated ? "最近更新 " + lastUpdated.toLocaleTimeString() : loading ? "正在加载…" : "等待数据"}</div>
      </div>
      {loading && !events.length ? <div className="p-10 text-center text-sm text-slate-400">正在读取访客数据…</div> : visibleVisitors.length ? <div className="divide-y divide-slate-100">
        {visibleVisitors.map(visitor => <article key={visitor.id} className="p-4 md:p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className={visitor.online ? "inline-flex items-center gap-1.5 text-[10px] font-bold text-emerald-700" : "text-[10px] text-slate-400"}>{visitor.online && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>}{visitor.online ? "在线" : "已离开"}</span>
                {visitor.productEngaged && <span className="bg-amber-100 text-amber-800 px-2 py-1 text-[10px] font-bold">产品页 ≥20 秒</span>}
                {visitor.inquiryViewed && <span className="bg-blue-50 text-blue-800 px-2 py-1 text-[10px] font-bold">访问询盘页</span>}
                {visitor.productEngaged && visitor.inquiryViewed && <span className="bg-[#b8ed36] text-[#101923] px-2 py-1 text-[10px] font-black">高意向</span>}
              </div>
              <div className="font-bold text-sm mt-2">{locationLabel(visitor.latest)}</div>
              <div className="text-[10px] text-slate-400 mt-1">{visitor.latest.device_type.toUpperCase()} · 会话 {visitor.id.slice(0, 8)} · 最近活动 {new Date(visitor.latest.created_at).toLocaleTimeString()}</div>
            </div>
            <div className="text-right"><div className="text-[10px] text-slate-400">当前 / 最后页面</div><div className="text-xs font-bold mt-1 max-w-[320px] break-all">{visitor.latest.path}</div><div className="text-[10px] text-slate-500 mt-1">页面停留 {durationLabel(visitor.latest.duration_seconds)}</div></div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">{visitor.pages.map((page, index) => <span key={page.path + index} className="inline-flex items-center gap-2 border border-slate-200 bg-slate-50 px-2.5 py-2 text-[10px] max-w-full"><span className="font-semibold break-all">{page.title}</span><span className="text-slate-500 whitespace-nowrap">{durationLabel(page.seconds)}</span></span>)}</div>
        </article>)}
        {visitors.length > 30 && <div className="p-4 text-center"><button type="button" onClick={() => setShowAll(value => !value)} className="text-xs font-bold underline">{showAll ? "收起列表" : "显示全部 " + visitors.length + " 个会话"}</button></div>}
      </div> : <div className="p-12 text-center"><div className="font-bold">暂时没有访客事件</div><p className="text-xs text-slate-400 mt-2">部署监控功能后，网站有新访客时会自动出现在这里。</p></div>}
    </section>
  </section>;
}
