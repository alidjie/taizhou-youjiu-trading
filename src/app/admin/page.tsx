"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Inquiry = {
  id: string;
  name: string;
  email: string;
  company: string | null;
  country: string;
  phone: string | null;
  product_category: string | null;
  product_name: string | null;
  quantity: string | null;
  message: string;
  status: string;
  created_at: string;
};

type Product = {
  id: string;
  slug: string;
  name: string;
  model_code: string | null;
  category: string;
  image: string | null;
  hero_image: string | null;
  gallery: string[] | null;
  short_description: string | null;
  description: string | null;
  specs: string[] | null;
  features: string[] | null;
  specifications: Record<string, string> | null;
  certifications: string[] | null;
  featured: boolean;
  published: boolean;
  sort_order: number;
  seo_title: string | null;
  seo_description: string | null;
};

type ProductDraft = {
  id: string;
  name: string;
  slug: string;
  model_code: string;
  category: string;
  hero_image: string;
  gallery_text: string;
  short_description: string;
  description: string;
  specifications_text: string;
  features_text: string;
  certifications_text: string;
  featured: boolean;
  published: boolean;
  sort_order: string;
  seo_title: string;
  seo_description: string;
};

type ContentBlock = {
  key: string;
  page: string;
  label: string;
  content: Record<string, string>;
  published: boolean;
  sort_order: number;
};

type ContentDraft = {
  key: string;
  page: string;
  label: string;
  content: Record<string, string>;
  published: boolean;
};

const apiUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

const categories = [
  { value: "electric-motorcycles", label: "Electric Motorcycles" },
  { value: "electric-bicycles", label: "Electric Bicycles" },
  { value: "electric-motors", label: "Electric Motors" },
  { value: "suspension-systems", label: "Suspension Systems" }
];

const contentFieldLabels: Record<string, string> = {
  eyebrow: "眉题 / 小标题",
  headline_before: "主标题（第一行）",
  headline_accent: "主标题（强调行）",
  headline_after: "主标题（第三行）",
  headline: "主标题",
  subtitle: "副标题",
  body: "正文文案",
  secondary_body: "补充正文",
  primary_label: "主按钮文字",
  primary_href: "主按钮链接",
  secondary_label: "次按钮文字",
  secondary_href: "次按钮链接",
  image_url: "主图 URL"
};

function emptyProduct(): ProductDraft {
  return {
    id: "",
    name: "",
    slug: "",
    model_code: "",
    category: "electric-motorcycles",
    hero_image: "",
    gallery_text: "",
    short_description: "",
    description: "",
    specifications_text: "",
    features_text: "",
    certifications_text: "",
    featured: false,
    published: false,
    sort_order: "0",
    seo_title: "",
    seo_description: ""
  };
}

function slugify(value: string) {
  return value.toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function lines(value: string) {
  return value.split("\n").map(item => item.trim()).filter(Boolean);
}

function parseSpecifications(value: string) {
  const result: Record<string, string> = {};
  value.split("\n").map(line => line.trim()).filter(Boolean).forEach(line => {
    const separator = line.indexOf(":") >= 0 ? line.indexOf(":") : line.indexOf("：");
    if (separator > 0) {
      const key = line.slice(0, separator).trim();
      const detail = line.slice(separator + 1).trim();
      if (key && detail) result[key] = detail;
    }
  });
  return result;
}

function toDraft(product: Product): ProductDraft {
  const specificationLines = Object.entries(product.specifications || {}).map(([key, value]) => `${key}: ${value}`);
  return {
    id: product.id,
    name: product.name || "",
    slug: product.slug || "",
    model_code: product.model_code || "",
    category: product.category,
    hero_image: product.hero_image || product.image || "",
    gallery_text: (product.gallery || []).join("\n"),
    short_description: product.short_description || "",
    description: product.description || "",
    specifications_text: specificationLines.join("\n"),
    features_text: (product.features || []).join("\n"),
    certifications_text: (product.certifications || []).join("\n"),
    featured: Boolean(product.featured),
    published: Boolean(product.published),
    sort_order: String(product.sort_order ?? 0),
    seo_title: product.seo_title || "",
    seo_description: product.seo_description || ""
  };
}

function jsonHeaders(token: string) {
  return {
    apikey: publishableKey,
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json"
  };
}

export default function AdminDashboard() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [accessToken, setAccessToken] = useState("");
  const [needsAdminClaim, setNeedsAdminClaim] = useState(false);
  const [bootstrapCode, setBootstrapCode] = useState("");
  const [tab, setTab] = useState<"inquiries" | "products" | "content">("products");
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [productDraft, setProductDraft] = useState<ProductDraft>(emptyProduct());
  const [contentDraft, setContentDraft] = useState<ContentDraft | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products.filter(product => {
      const matchesCategory = filterCategory === "all" || product.category === filterCategory;
      const matchesSearch = !term || product.name.toLowerCase().includes(term) || product.slug.toLowerCase().includes(term) || (product.model_code || "").toLowerCase().includes(term);
      return matchesCategory && matchesSearch;
    });
  }, [products, filterCategory, search]);

  async function requestRows<T>(path: string, token: string): Promise<T[]> {
    const response = await fetch(`${apiUrl}/rest/v1/${path}`, {
      headers: { apikey: publishableKey, Authorization: `Bearer ${token}` },
      cache: "no-store"
    });
    if (!response.ok) {
      const message = await response.text();
      if (response.status === 401 || response.status === 403) {
        throw new Error("当前账号没有后台管理员权限。需要为登录账号开通 YOUJIU CMS 管理员权限。");
      }
      throw new Error(message || "读取数据失败。");
    }
    return await response.json() as T[];
  }

  async function loadAll(token: string) {
    setLoading(true);
    setError("");
    try {
      const [inquiryRows, productRows, blockRows] = await Promise.all([
        requestRows<Inquiry>("inquiries?select=*&order=created_at.desc&limit=200", token),
        requestRows<Product>("products?select=*&order=sort_order.asc,created_at.desc", token),
        requestRows<ContentBlock>("site_content?select=*&order=sort_order.asc,page.asc", token)
      ]);
      setInquiries(inquiryRows);
      setProducts(productRows);
      setContentBlocks(blockRows);
    } catch (err) {
      const message = err instanceof Error ? err.message : "后台数据读取失败。";
      setError(message);
      if (message.includes("管理员权限")) setNeedsAdminClaim(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (accessToken) void loadAll(accessToken);
  }, [accessToken]);

  async function signIn(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/auth/v1/token?grant_type=password`, {
        method: "POST",
        headers: { apikey: publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json() as { access_token?: string; msg?: string; message?: string };
      if (!response.ok || !result.access_token) {
        throw new Error(result.msg || result.message || "登录失败，请检查邮箱和密码。");
      }
      setAccessToken(result.access_token);
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "登录失败。");
    } finally {
      setLoading(false);
    }
  }

  async function signUp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/auth/v1/signup`, {
        method: "POST",
        headers: { apikey: publishableKey, "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = await response.json() as { access_token?: string; msg?: string; message?: string };
      if (!response.ok) throw new Error(result.msg || result.message || "账号注册失败。");
      if (result.access_token) {
        setAccessToken(result.access_token);
        setPassword("");
        setNotice("账号创建成功。首次使用请完成管理员激活。");
      } else {
        setAuthMode("signin");
        setPassword("");
        setNotice("注册请求已提交。请先打开邮箱，完成 Supabase 发来的验证邮件，再返回这里登录。");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "账号注册失败。");
    } finally {
      setLoading(false);
    }
  }

  async function activateFirstAdmin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!bootstrapCode.trim()) {
      setError("请输入一次性管理员激活码。");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${apiUrl}/rest/v1/rpc/claim_first_cms_admin`, {
        method: "POST",
        headers: jsonHeaders(accessToken),
        body: JSON.stringify({ p_code: bootstrapCode.trim() })
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail.includes("already been activated")
          ? "首位管理员已激活。当前账号不在管理员名单中。"
          : "激活失败。请检查激活码是否正确、是否过期，或是否已经使用。");
      }
      setBootstrapCode("");
      setNeedsAdminClaim(false);
      setNotice("管理员权限已激活。现在可以管理产品、网站文案和询盘。");
      await loadAll(accessToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : "管理员激活失败。");
    } finally {
      setLoading(false);
    }
  }

  async function updateInquiryStatus(id: string, status: string) {
    setError("");
    const response = await fetch(`${apiUrl}/rest/v1/inquiries?id=eq.${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { ...jsonHeaders(accessToken), Prefer: "return=minimal" },
      body: JSON.stringify({ status })
    });
    if (!response.ok) {
      setError("询盘状态更新失败，请检查管理员权限。");
      return;
    }
    setInquiries(current => current.map(item => item.id === id ? { ...item, status } : item));
  }

  function editProduct(product: Product) {
    setProductDraft(toDraft(product));
    setError("");
    setNotice("");
  }

  function updateProductDraft<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setProductDraft(current => ({ ...current, [key]: value }));
  }

  async function uploadProductImages(event: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const uploadedUrls: string[] = [];
      for (const file of files) {
        if (!file.type.startsWith("image/")) throw new Error(`${file.name} 不是图片文件。`);
        if (file.size > 12 * 1024 * 1024) throw new Error(`${file.name} 超过 12MB 限制。`);
        const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const folder = slugify(productDraft.slug || productDraft.name || "product") || "product";
        const objectPath = `${folder}/${crypto.randomUUID()}.${extension}`;
        const response = await fetch(`${apiUrl}/storage/v1/object/products/${objectPath}`, {
          method: "POST",
          headers: {
            apikey: publishableKey,
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": file.type,
            "x-upsert": "false"
          },
          body: file
        });
        if (!response.ok) {
          const detail = await response.text();
          throw new Error(`图片上传失败：${detail || response.statusText}`);
        }
        uploadedUrls.push(`${apiUrl}/storage/v1/object/public/products/${objectPath}`);
      }
      setProductDraft(current => ({
        ...current,
        hero_image: current.hero_image || uploadedUrls[0],
        gallery_text: [...lines(current.gallery_text), ...uploadedUrls].join("\n")
      }));
      setNotice(`成功上传 ${uploadedUrls.length} 张图片。保存产品后即会显示在网站上。`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "图片上传失败。");
    } finally {
      setUploading(false);
    }
  }

  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const name = productDraft.name.trim();
      const slug = slugify(productDraft.slug || name);
      if (!name || !slug) throw new Error("请填写产品名称和 URL Slug。");
      const specifications = parseSpecifications(productDraft.specifications_text);
      const payload = {
        id: productDraft.id || crypto.randomUUID(),
        name,
        slug,
        model_code: productDraft.model_code.trim() || null,
        category: productDraft.category,
        image: productDraft.hero_image.trim() || null,
        hero_image: productDraft.hero_image.trim() || null,
        gallery: lines(productDraft.gallery_text),
        short_description: productDraft.short_description.trim() || null,
        description: productDraft.description.trim() || null,
        specs: Object.entries(specifications).map(([key, value]) => `${key}: ${value}`),
        specifications,
        features: lines(productDraft.features_text),
        certifications: lines(productDraft.certifications_text),
        featured: productDraft.featured,
        published: productDraft.published,
        sort_order: Number(productDraft.sort_order) || 0,
        seo_title: productDraft.seo_title.trim() || null,
        seo_description: productDraft.seo_description.trim() || null,
        updated_at: new Date().toISOString()
      };
      const isExisting = Boolean(productDraft.id);
      const response = await fetch(
        isExisting
          ? `${apiUrl}/rest/v1/products?id=eq.${encodeURIComponent(productDraft.id)}`
          : `${apiUrl}/rest/v1/products`,
        {
          method: isExisting ? "PATCH" : "POST",
          headers: { ...jsonHeaders(accessToken), Prefer: "return=representation" },
          body: JSON.stringify(payload)
        }
      );
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(detail || "产品保存失败。请检查 slug 是否重复或管理员权限是否有效。");
      }
      await loadAll(accessToken);
      setProductDraft(emptyProduct());
      setNotice(isExisting ? "产品资料已更新。" : "新产品已创建。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "产品保存失败。");
    } finally {
      setLoading(false);
    }
  }

  async function unpublishProduct(product: Product) {
    if (!window.confirm(`确定将「${product.name}」从网站撤下吗？产品资料会保留，可以重新发布。`)) return;
    setError("");
    const response = await fetch(`${apiUrl}/rest/v1/products?id=eq.${encodeURIComponent(product.id)}`, {
      method: "PATCH",
      headers: { ...jsonHeaders(accessToken), Prefer: "return=minimal" },
      body: JSON.stringify({ published: false, updated_at: new Date().toISOString() })
    });
    if (!response.ok) {
      setError("撤下产品失败。");
      return;
    }
    await loadAll(accessToken);
    if (productDraft.id === product.id) setProductDraft(emptyProduct());
    setNotice("产品已撤下，资料仍保留在后台。");
  }

  function editContent(block: ContentBlock) {
    setContentDraft({
      key: block.key,
      page: block.page,
      label: block.label,
      content: { ...(block.content || {}) },
      published: block.published
    });
    setError("");
    setNotice("");
  }

  async function saveContent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!contentDraft) return;
    setLoading(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch(`${apiUrl}/rest/v1/site_content?key=eq.${encodeURIComponent(contentDraft.key)}`, {
        method: "PATCH",
        headers: { ...jsonHeaders(accessToken), Prefer: "return=representation" },
        body: JSON.stringify({
          label: contentDraft.label,
          page: contentDraft.page,
          content: contentDraft.content,
          published: contentDraft.published,
          updated_at: new Date().toISOString()
        })
      });
      if (!response.ok) throw new Error(await response.text() || "营销文案保存失败。");
      await loadAll(accessToken);
      setNotice("营销文案已保存。刷新网站页面即可查看更新。");
    } catch (err) {
      setError(err instanceof Error ? err.message : "营销文案保存失败。");
    } finally {
      setLoading(false);
    }
  }

  const productCount = products.length;
  const publishedCount = products.filter(product => product.published).length;
  const newInquiryCount = inquiries.filter(inquiry => inquiry.status === "new").length;

  if (!accessToken) {
    return <main className="min-h-screen bg-[#f3f5f5] text-[#101923]">
      <header className="bg-[#101923] text-white px-6 py-5"><div className="max-w-7xl mx-auto"><Link href="/" className="font-black tracking-[.18em] text-xl">YOUJIU <span className="text-[#b8ed36]">/</span> MANAGEMENT</Link></div></header>
      <section className="max-w-md mx-auto px-5 py-16">
        <div className="bg-white border border-slate-200 p-8 shadow-sm">
          <div className="text-[10px] tracking-[.2em] text-[#7ca51c] font-black">PRIVATE CONTENT MANAGEMENT</div>
          <h1 className="text-3xl font-black mt-3">管理后台登录</h1>
          <p className="text-sm text-slate-500 mt-3 leading-6">登录后可以上传产品、维护产品详情、更新网站营销文案和管理客户询盘。</p>
          <div className="flex gap-2 mt-7 border-b border-slate-200">
            <button type="button" onClick={()=>{setAuthMode("signin");setError("");setNotice("");}} className={`px-3 py-2 text-xs font-bold border-b-2 ${authMode==="signin"?"border-[#7ca51c]":"border-transparent text-slate-400"}`}>已有账号登录</button>
            <button type="button" onClick={()=>{setAuthMode("signup");setError("");setNotice("");}} className={`px-3 py-2 text-xs font-bold border-b-2 ${authMode==="signup"?"border-[#7ca51c]":"border-transparent text-slate-400"}`}>首次创建账号</button>
          </div>
          <form onSubmit={authMode==="signin"?signIn:signUp} className="mt-6 space-y-5">
            <label className="block text-xs font-bold">管理员邮箱<input type="email" required value={email} onChange={event=>setEmail(event.target.value)} className="block w-full border border-slate-300 mt-2 px-4 py-3 font-normal"/></label>
            <label className="block text-xs font-bold">密码<input type="password" required minLength={8} value={password} onChange={event=>setPassword(event.target.value)} className="block w-full border border-slate-300 mt-2 px-4 py-3 font-normal"/></label>
            <button disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? "正在处理..." : authMode==="signin" ? "登录管理后台 ↗" : "创建 Supabase 登录账号 ↗"}</button>
          </form>
          {notice && <p role="status" className="text-sm text-emerald-800 bg-emerald-50 p-3 mt-5">{notice}</p>}
          {error && <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 mt-5">{error}</p>}
          <p className="text-[11px] text-slate-400 mt-6 leading-5">请使用你能收取验证邮件的业务邮箱。首位管理员还需完成一次性激活；普通注册账号不会自动获得网站编辑权限。</p>
        </div>
      </section>
    </main>;
  }

  return <main className="min-h-screen bg-[#f3f5f5] text-[#101923]">
    <header className="bg-[#101923] text-white px-5 md:px-8 py-4">
      <div className="max-w-[1500px] mx-auto flex items-center justify-between gap-4">
        <Link href="/" className="font-black tracking-[.16em] text-lg md:text-xl">YOUJIU <span className="text-[#b8ed36]">/</span> CMS</Link>
        <div className="flex items-center gap-3"><span className="hidden sm:block text-[10px] text-slate-400 tracking-widest">CONTENT MANAGEMENT</span><button onClick={()=>{setAccessToken("");setInquiries([]);setProducts([]);setContentBlocks([]);}} className="text-xs border border-white/20 px-3 py-2 hover:border-[#b8ed36]">退出登录</button></div>
      </div>
    </header>
    <div className="max-w-[1500px] mx-auto px-4 md:px-8 py-7">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-7"><div><div className="text-[10px] tracking-[.2em] text-[#7ca51c] font-black">YOUJIU WEBSITE OPERATIONS</div><h1 className="text-3xl md:text-4xl font-black mt-2">网站内容管理</h1><p className="text-sm text-slate-500 mt-2">产品和营销内容直接保存到 Supabase，无需每次修改代码或重新部署。</p></div><button onClick={()=>void loadAll(accessToken)} disabled={loading} className="border border-slate-300 bg-white px-4 py-3 text-xs font-bold disabled:opacity-50">{loading ? "正在刷新..." : "刷新数据 ↻"}</button></div>

      <div className="grid sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-slate-200 p-5"><div className="text-[10px] text-slate-500 tracking-widest">产品总数</div><div className="text-3xl font-black mt-2">{productCount}</div><div className="text-xs text-slate-400 mt-1">已发布 {publishedCount} 个</div></div>
        <div className="bg-white border border-slate-200 p-5"><div className="text-[10px] text-slate-500 tracking-widest">待处理询盘</div><div className="text-3xl font-black mt-2">{newInquiryCount}</div><div className="text-xs text-slate-400 mt-1">最近 200 条询盘记录</div></div>
        <div className="bg-white border border-slate-200 p-5"><div className="text-[10px] text-slate-500 tracking-widest">可编辑内容模块</div><div className="text-3xl font-black mt-2">{contentBlocks.length}</div><div className="text-xs text-slate-400 mt-1">首页、About、产品分类</div></div>
      </div>

      {needsAdminClaim && <section className="bg-white border border-[#c6d98a] p-5 md:p-6 mb-6"><div className="text-[10px] tracking-widest text-[#7ca51c] font-black">FIRST ADMIN ACTIVATION</div><h2 className="text-xl font-black mt-2">激活首位网站管理员</h2><p className="text-sm text-slate-600 leading-6 mt-2">当前账号已经登录，但尚未获得 YOUJIU CMS 权限。输入一次性激活码即可把当前账号加入管理员名单。激活成功后，激活码立即失效。</p><form onSubmit={activateFirstAdmin} className="mt-4 flex flex-wrap gap-3"><input value={bootstrapCode} onChange={event=>setBootstrapCode(event.target.value)} placeholder="输入一次性激活码" className="border border-slate-300 px-3 py-3 text-sm flex-1 min-w-[240px]"/><button disabled={loading} className="btn-primary disabled:opacity-50">{loading?"正在激活...":"激活管理员权限"}</button></form></section>}
      {error && <div role="alert" className="bg-red-50 border border-red-200 text-red-800 p-4 text-sm mb-5 whitespace-pre-wrap">{error}</div>}
      {notice && <div role="status" className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 text-sm mb-5">{notice}</div>}

      <div className="flex flex-wrap gap-2 border-b border-slate-300 mb-6">
        <button onClick={()=>setTab("products")} className={`px-5 py-3 text-sm font-bold border-b-2 ${tab==="products"?"border-[#7ca51c] text-[#101923]":"border-transparent text-slate-500"}`}>产品管理</button>
        <button onClick={()=>setTab("content")} className={`px-5 py-3 text-sm font-bold border-b-2 ${tab==="content"?"border-[#7ca51c] text-[#101923]":"border-transparent text-slate-500"}`}>营销文案</button>
        <button onClick={()=>setTab("inquiries")} className={`px-5 py-3 text-sm font-bold border-b-2 ${tab==="inquiries"?"border-[#7ca51c] text-[#101923]":"border-transparent text-slate-500"}`}>客户询盘</button>
      </div>

      {tab === "products" && <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <section className="bg-white border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-3"><div><h2 className="font-black text-lg">产品目录</h2><p className="text-xs text-slate-500 mt-1">{filteredProducts.length} 条记录</p></div><button onClick={()=>{setProductDraft(emptyProduct());setError("");setNotice("");}} className="bg-[#101923] text-white text-xs font-bold px-3 py-3">＋ 新增产品</button></div>
          <div className="p-4 space-y-3"><input value={search} onChange={event=>setSearch(event.target.value)} placeholder="搜索产品名称、型号或 Slug" className="w-full border border-slate-300 px-3 py-3 text-sm"/><select value={filterCategory} onChange={event=>setFilterCategory(event.target.value)} className="w-full border border-slate-300 px-3 py-3 text-sm bg-white"><option value="all">全部产品分类</option>{categories.map(category=><option key={category.value} value={category.value}>{category.label}</option>)}</select></div>
          <div className="divide-y divide-slate-100 max-h-[760px] overflow-y-auto">{filteredProducts.map(product=><div key={product.id} className={`p-4 flex gap-3 ${productDraft.id===product.id?"bg-[#f4f7e9]":""}`}><div className="w-20 h-20 shrink-0 bg-slate-100">{(product.hero_image||product.image)?<img src={product.hero_image||product.image||""} alt={product.name} className="w-full h-full object-cover"/>:<div className="w-full h-full flex items-center justify-center text-[9px] text-slate-400">NO IMAGE</div>}</div><div className="min-w-0 flex-1"><div className="font-bold text-sm truncate">{product.name}</div><div className="text-[10px] text-slate-500 mt-1">{product.model_code||product.slug}</div><div className="flex gap-2 mt-2"><span className={`text-[9px] px-2 py-1 ${product.published?"bg-emerald-50 text-emerald-700":"bg-slate-100 text-slate-500"}`}>{product.published?"已发布":"草稿"}</span>{product.featured&&<span className="text-[9px] px-2 py-1 bg-[#eff5d8] text-[#607f12]">推荐</span>}</div><button onClick={()=>editProduct(product)} className="text-xs font-bold underline mt-3">编辑产品 →</button></div></div>)}{!filteredProducts.length&&<div className="p-8 text-sm text-slate-500 text-center">暂时没有产品记录。点击“新增产品”开始建立目录。</div>}</div>
        </section>

        <section className="bg-white border border-slate-200">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between gap-4"><div><div className="text-[10px] tracking-widest text-[#7ca51c] font-black">{productDraft.id?"EDIT PRODUCT":"NEW PRODUCT"}</div><h2 className="font-black text-xl mt-1">{productDraft.id ? "编辑产品详情" : "新建产品"}</h2></div>{productDraft.id&&<button onClick={()=>setProductDraft(emptyProduct())} className="text-xs border border-slate-300 px-3 py-2">新建另一款</button>}</div>
          <form onSubmit={saveProduct} className="p-5 md:p-7">
            <div className="grid md:grid-cols-2 gap-4">
              <label className="block text-xs font-bold">产品名称 / Product Name<input required value={productDraft.name} onChange={event=>updateProductDraft("name",event.target.value)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
              <label className="block text-xs font-bold">型号 / Model Code<input value={productDraft.model_code} onChange={event=>updateProductDraft("model_code",event.target.value)} placeholder="e.g. YJ-E01" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
              <label className="block text-xs font-bold">URL Slug<input required value={productDraft.slug} onChange={event=>updateProductDraft("slug",event.target.value)} placeholder="electric-motorcycle-model" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label>
              <label className="block text-xs font-bold">产品分类<select value={productDraft.category} onChange={event=>updateProductDraft("category",event.target.value)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal bg-white">{categories.map(category=><option key={category.value} value={category.value}>{category.label}</option>)}</select></label>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6">
              <div className="flex flex-wrap justify-between items-center gap-3"><div><h3 className="font-black">产品图片</h3><p className="text-xs text-slate-500 mt-1">支持 JPG / PNG / WebP / AVIF，单张不超过 12MB。</p></div><label className="inline-flex items-center bg-[#101923] text-white text-xs font-bold px-4 py-3 cursor-pointer">{uploading?"正在上传...":"上传图片"}<input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={uploading} onChange={uploadProductImages} className="hidden"/></label></div>
              <div className="grid md:grid-cols-[200px_1fr] gap-4 mt-5"><div className="aspect-[4/3] bg-slate-100 border border-slate-200 overflow-hidden">{productDraft.hero_image?<img src={productDraft.hero_image} alt="产品主图预览" className="w-full h-full object-contain"/>:<div className="w-full h-full flex items-center justify-center text-xs text-slate-400">主图预览</div>}</div><div className="space-y-3"><label className="block text-xs font-bold">主图 URL<input value={productDraft.hero_image} onChange={event=>updateProductDraft("hero_image",event.target.value)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-xs font-normal"/></label><label className="block text-xs font-bold">图片集 URL（每行一张）<textarea rows={3} value={productDraft.gallery_text} onChange={event=>updateProductDraft("gallery_text",event.target.value)} placeholder="上传后自动填入；也可粘贴已有图片 URL" className="w-full border border-slate-300 px-3 py-3 mt-2 text-xs font-normal"/></label></div></div>
            </div>

            <div className="mt-7 border-t border-slate-200 pt-6"><h3 className="font-black mb-4">产品文案与详情</h3><label className="block text-xs font-bold">简短介绍 / Short Description<textarea rows={2} value={productDraft.short_description} onChange={event=>updateProductDraft("short_description",event.target.value)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><label className="block text-xs font-bold mt-4">详细描述 / Product Detail<textarea rows={7} value={productDraft.description} onChange={event=>updateProductDraft("description",event.target.value)} placeholder="可分段填写用途、产品特点、选配方案、包装方式、OEM 支持等内容。" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><p className="text-[10px] text-slate-400 mt-2">详情页会按段落显示。建议每段只写一个主题，便于海外采购商阅读。</p></div>

            <div className="mt-7 border-t border-slate-200 pt-6"><h3 className="font-black mb-4">技术参数与卖点</h3><div className="grid md:grid-cols-2 gap-4"><label className="block text-xs font-bold">技术参数（每行：参数名: 参数值）<textarea rows={7} value={productDraft.specifications_text} onChange={event=>updateProductDraft("specifications_text",event.target.value)} placeholder={"Motor Power: 1500W\nRated Voltage: 72V\nBattery: Lithium / Lead-acid"} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><label className="block text-xs font-bold">产品卖点（每行一项）<textarea rows={7} value={productDraft.features_text} onChange={event=>updateProductDraft("features_text",event.target.value)} placeholder={"Efficient BLDC motor\nReinforced frame\nOEM color options"} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><label className="block text-xs font-bold md:col-span-2">证书 / 文件（每行一项）<textarea rows={3} value={productDraft.certifications_text} onChange={event=>updateProductDraft("certifications_text",event.target.value)} placeholder="仅填写已核实且允许公开的证书或测试文件名称。" className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label></div></div>

            <div className="mt-7 border-t border-slate-200 pt-6"><h3 className="font-black mb-4">搜索引擎设置 / SEO</h3><div className="grid md:grid-cols-2 gap-4"><label className="block text-xs font-bold">SEO Title<input value={productDraft.seo_title} onChange={event=>updateProductDraft("seo_title",event.target.value)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><label className="block text-xs font-bold">SEO Description<textarea rows={2} value={productDraft.seo_description} onChange={event=>updateProductDraft("seo_description",event.target.value)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label></div></div>

            <div className="mt-7 border-t border-slate-200 pt-6 flex flex-wrap items-center gap-6"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productDraft.featured} onChange={event=>updateProductDraft("featured",event.target.checked)}/>首页推荐产品</label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={productDraft.published} onChange={event=>updateProductDraft("published",event.target.checked)}/>立即发布到网站</label><label className="flex items-center gap-2 text-xs">排序<input type="number" value={productDraft.sort_order} onChange={event=>updateProductDraft("sort_order",event.target.value)} className="w-20 border border-slate-300 px-2 py-2"/></label><div className="ml-auto flex gap-2"><button type="button" onClick={()=>setProductDraft(emptyProduct())} className="border border-slate-300 px-4 py-3 text-xs font-bold">清空</button><button disabled={loading||uploading} className="btn-primary disabled:opacity-50">{loading?"保存中...":"保存产品资料"}</button></div></div>
          </form>
        </section>
      </div>}

      {tab === "content" && <div className="grid xl:grid-cols-[360px_minmax(0,1fr)] gap-6 items-start">
        <section className="bg-white border border-slate-200"><div className="p-5 border-b border-slate-200"><h2 className="font-black text-lg">页面内容模块</h2><p className="text-xs text-slate-500 mt-1">选择当前网站页面已绑定的文案区域</p></div>
          
          <div className="divide-y divide-slate-100">{contentBlocks.map(block=><button key={block.key} onClick={()=>editContent(block)} className={`w-full text-left p-4 hover:bg-slate-50 ${contentDraft?.key===block.key?"bg-[#f4f7e9]":""}`}><div className="font-bold text-sm">{block.label}</div><div className="text-[10px] text-slate-400 mt-1">{block.page} / {block.key}</div><div className="mt-2 text-[10px]">{block.published?<span className="text-emerald-700">网站展示中</span>:<span className="text-slate-400">未发布</span>}</div></button>)}{!contentBlocks.length&&<div className="p-8 text-sm text-slate-500">暂时没有文案模块。</div>}</div>
        </section>
        <section className="bg-white border border-slate-200">
          <div className="p-5 border-b border-slate-200"><div className="text-[10px] tracking-widest text-[#7ca51c] font-black">MARKETING COPY EDITOR</div><h2 className="font-black text-xl mt-1">{contentDraft?.label || "选择一个内容模块"}</h2><p className="text-xs text-slate-500 mt-2">编辑后保存，网站读取数据库中的新文案，不需要重新部署。</p></div>
          {contentDraft ? <form onSubmit={saveContent} className="p-5 md:p-7"><div className="grid md:grid-cols-2 gap-4 mb-5"><label className="block text-xs font-bold">模块名称<input value={contentDraft.label} onChange={event=>setContentDraft(current=>current?({...current,label:event.target.value}):current)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/></label><label className="block text-xs font-bold">页面<select value={contentDraft.page} onChange={event=>setContentDraft(current=>current?({...current,page:event.target.value}):current)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal bg-white"><option value="home">首页</option><option value="about">About</option><option value="products">产品中心</option></select></label></div><div className="space-y-4">{Object.entries(contentDraft.content).map(([key,value])=><label key={key} className="block text-xs font-bold">{contentFieldLabels[key] || key}{["body","secondary_body","headline"].includes(key)?<textarea rows={key==="body"?5:3} value={value} onChange={event=>setContentDraft(current=>current?({...current,content:{...current.content,[key]:event.target.value}}):current)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/>:<input value={value} onChange={event=>setContentDraft(current=>current?({...current,content:{...current.content,[key]:event.target.value}}):current)} className="w-full border border-slate-300 px-3 py-3 mt-2 text-sm font-normal"/>}</label>)}{!Object.keys(contentDraft.content).length&&<p className="text-sm text-slate-500">该模块暂无字段。请先添加字段或选择其他模块。</p>}</div><div className="mt-7 border-t border-slate-200 pt-5 flex flex-wrap items-center justify-between gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={contentDraft.published} onChange={event=>setContentDraft(current=>current?({...current,published:event.target.checked}):current)}/>在网站展示此模块</label><button disabled={loading} className="btn-primary disabled:opacity-50">{loading?"保存中...":"保存文案"}</button></div></form>:<div className="p-10 text-sm text-slate-500">从左侧选择一个首页、About 或产品分类文案模块。</div>}
        </section>
      </div>}

      {tab === "inquiries" && <section className="bg-white border border-slate-200 overflow-x-auto"><div className="p-5 border-b border-slate-200"><h2 className="font-black text-lg">客户询盘</h2><p className="text-xs text-slate-500 mt-1">最新 200 条询盘 · {inquiries.length} 条已加载</p></div><table className="w-full text-left text-sm min-w-[1050px]"><thead className="bg-[#e9edef] text-[10px] tracking-widest uppercase"><tr>{["客户","公司 / 国家","产品","数量","留言","状态","收到时间"].map(label=><th key={label} className="p-4">{label}</th>)}</tr></thead><tbody>{inquiries.map(item=><tr key={item.id} className="border-t border-slate-100 align-top"><td className="p-4"><div className="font-bold">{item.name}</div><a className="text-xs text-blue-700" href={`mailto:${item.email}`}>{item.email}</a>{item.phone&&<div className="text-xs text-slate-500 mt-1">{item.phone}</div>}</td><td className="p-4 text-xs">{item.company||"—"}<div className="text-slate-500 mt-1">{item.country||"—"}</div></td><td className="p-4 text-xs">{item.product_name||item.product_category||"General enquiry"}</td><td className="p-4 text-xs">{item.quantity||"—"}</td><td className="p-4 text-xs max-w-xs whitespace-pre-wrap">{item.message}</td><td className="p-4"><select aria-label="Enquiry status" value={item.status||"new"} onChange={event=>void updateInquiryStatus(item.id,event.target.value)} className="border border-slate-300 px-2 py-2 text-xs bg-white"><option value="new">New</option><option value="contacted">Contacted</option><option value="qualified">Qualified</option><option value="closed">Closed</option></select></td><td className="p-4 text-xs text-slate-500 whitespace-nowrap">{new Date(item.created_at).toLocaleString()}</td></tr>)}</tbody></table>{!inquiries.length&&!loading&&<p className="p-10 text-center text-slate-500 text-sm">暂无询盘记录。</p>}</section>}
    </div>
  </main>;
}
