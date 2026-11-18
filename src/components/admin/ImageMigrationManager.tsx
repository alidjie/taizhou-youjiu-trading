"use client";

import { useCallback, useState } from "react";

const API = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://fsqpeuulaglnnwfyxndj.supabase.co";
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

type StorageItem = { name: string; id?: string | null; metadata?: Record<string, unknown> | null };
type StoredObject = { bucket: string; path: string; url: string };
type ProductRow = { id: string; image: string | null; hero_image: string | null; gallery: string[] | null };
type BlogRow = { id: string; image: string | null; cover_image: string | null };
type ContentRow = { key: string; content: Record<string, unknown> };
type TranslationRow = { id: string; source_content: Record<string, unknown>; translated_content: Record<string, unknown> };
type Snapshot = { products: ProductRow[]; blogs: BlogRow[]; content: ContentRow[]; translations: TranslationRow[]; objects: StoredObject[]; candidates: StoredObject[]; references: number };

function authHeaders(token: string, json = true) {
  return { apikey: KEY, Authorization: `Bearer ${token}`, ...(json ? { "Content-Type": "application/json" } : {}) };
}
function encodePath(path: string) { return path.split("/").map(encodeURIComponent).join("/"); }
function storagePathFromUrl(value: string): { bucket: string; path: string } | null {
  try {
    const url = new URL(value);
    if (url.origin !== API) return null;
    const match = url.pathname.match(/^\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
    if (!match) return null;
    return { bucket: decodeURIComponent(match[1]), path: match[2].split("/").map(decodeURIComponent).join("/") };
  } catch { return null; }
}
function visitStrings(value: unknown, fn: (value: string) => void) {
  if (typeof value === "string") fn(value);
  else if (Array.isArray(value)) value.forEach(item => visitStrings(item, fn));
  else if (value && typeof value === "object") Object.values(value as Record<string, unknown>).forEach(item => visitStrings(item, fn));
}
function replaceRefs(value: unknown, mapping: Map<string, string>): unknown {
  if (typeof value === "string") {
    const ref = storagePathFromUrl(value);
    if (!ref) return value;
    const next = mapping.get(`${ref.bucket}/${ref.path}`);
    if (!next) return value;
    try { const old = new URL(value); const fresh = new URL(next); fresh.search = old.search; fresh.hash = old.hash; return fresh.toString(); }
    catch { return next; }
  }
  if (Array.isArray(value)) return value.map(item => replaceRefs(item, mapping));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, replaceRefs(item, mapping)]));
  return value;
}
function collectReferenceKeys(rows: Array<ProductRow | BlogRow | ContentRow | TranslationRow>) {
  const keys = new Set<string>();
  for (const row of rows) visitStrings(row, value => {
    const ref = storagePathFromUrl(value);
    if (ref) keys.add(`${ref.bucket}/${ref.path}`);
  });
  return keys;
}
async function readRows<T>(path: string, token: string): Promise<T[]> {
  const response = await fetch(`${API}/rest/v1/${path}`, { headers: authHeaders(token), cache: "no-store" });
  if (!response.ok) throw new Error(await response.text() || `读取 ${path} 失败`);
  return response.json() as Promise<T[]>;
}
async function patchRow(path: string, token: string, body: unknown) {
  const response = await fetch(`${API}/rest/v1/${path}`, { method: "PATCH", headers: { ...authHeaders(token), Prefer: "return=minimal" }, body: JSON.stringify(body) });
  if (!response.ok) throw new Error(await response.text() || `更新 ${path} 失败`);
}
async function listBucket(bucket: string, token: string): Promise<StoredObject[]> {
  const found: StoredObject[] = [];
  const walk = async (prefix: string) => {
    let cursor: string | undefined;
    do {
      const response = await fetch(`${API}/storage/v1/object/list-v2/${encodeURIComponent(bucket)}`, {
        method: "POST", headers: authHeaders(token),
        body: JSON.stringify({ prefix, limit: 100, with_delimiter: true, ...(cursor ? { cursor } : {}) })
      });
      if (!response.ok) throw new Error(await response.text() || `扫描存储桶 ${bucket} 失败`);
      const page = await response.json() as {
        objects?: Array<{ name: string; id?: string | null; metadata?: Record<string, unknown> | null }>;
        folders?: Array<{ name: string; key?: string }>;
        hasNext?: boolean;
        nextCursor?: string;
      };
      for (const item of page.objects || []) {
        if (item.id !== null) {
          const path = item.name.includes("/") || !prefix ? item.name : `${prefix}${item.name}`;
          found.push({ bucket, path, url: `${API}/storage/v1/object/public/${encodeURIComponent(bucket)}/${encodePath(path)}` });
        }
      }
      for (const folder of page.folders || []) {
        const folderPath = (folder.key || (prefix ? `${prefix}${folder.name}` : folder.name)).replace(/^\\/+|\\/+$/g, "");
        await walk(folderPath);
      }
      cursor = page.hasNext ? page.nextCursor : undefined;
    } while (cursor);
  };
  await walk("");
  return found;
}
async function convertBlob(blob: Blob, filename: string): Promise<Blob> {
  const bitmap = await createImageBitmap(blob, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) throw new Error(`${filename}：无法创建图片压缩画布`);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    return await new Promise<Blob>((resolve, reject) => canvas.toBlob(blob => {
      if (blob?.type === "image/webp") resolve(blob);
      else reject(new Error(`${filename}：WebP 转换失败`));
    }, "image/webp", 0.82));
  } finally { bitmap.close(); }
}
function isRasterCandidate(path: string) {
  return /\.(jpe?g|png|avif|bmp|tiff?)$/i.test(path);
}

export default function ImageMigrationManager({ accessToken }: { accessToken: string }) {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [scanning, setScanning] = useState(false);
  const [running, setRunning] = useState(false);
  const [allowDelete, setAllowDelete] = useState(false);
  const [log, setLog] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const scan = useCallback(async () => {
    setScanning(true); setError(""); setNotice(""); setLog([]);
    try {
      const [products, blogs, content, translations, productObjects, blogObjects] = await Promise.all([
        readRows<ProductRow>("products?select=id,image,hero_image,gallery&limit=2000", accessToken),
        readRows<BlogRow>("blog_posts?select=id,image,cover_image&limit=2000", accessToken),
        readRows<ContentRow>("site_content?select=key,content&limit=2000", accessToken),
        readRows<TranslationRow>("site_translations?select=id,source_content,translated_content&limit=5000", accessToken),
        listBucket("products", accessToken),
        listBucket("blog-images", accessToken)
      ]);
      const objects = [...productObjects, ...blogObjects];
      const keys = new Set<string>();
      for (const group of [products, blogs, content, translations]) for (const key of collectReferenceKeys(group)) keys.add(key);
      const referenced = objects.filter(item => keys.has(`${item.bucket}/${item.path}`));
      const candidates = referenced.filter(item => isRasterCandidate(item.path));
      setSnapshot({ products, blogs, content, translations, objects, candidates, references: keys.size });
      setNotice(`扫描完成：共发现 ${objects.length} 个存储文件，其中 ${referenced.length} 个被网站数据引用，${candidates.length} 个旧格式图片可转换。`);
      setLog([
        `产品记录：${products.length} 条；Blog：${blogs.length} 条；网站文案：${content.length} 条；多语言记录：${translations.length} 条。`,
        `Supabase Storage：products ${productObjects.length} 个文件；blog-images ${blogObjects.length} 个文件。`,
        `未被数据库引用的存储文件不会自动删除；外部图片 URL 和网站 public 目录图片不会被迁移。`
      ]);
    } catch (e) { setError(e instanceof Error ? e.message : "扫描失败"); }
    finally { setScanning(false); }
  }, [accessToken]);

  const migrate = useCallback(async () => {
    if (!snapshot || !allowDelete) return;
    setRunning(true); setError(""); setNotice("");
    const mapping = new Map<string, string>();
    const originals: StoredObject[] = [];
    const failures: string[] = [];
    let converted = 0;
    let savedBytes = 0;
    try {
      for (const item of snapshot.candidates) {
        try {
          const response = await fetch(item.url, { cache: "no-store" });
          if (!response.ok) throw new Error(`原图下载失败（HTTP ${response.status}）`);
          const original = await response.blob();
          const webp = await convertBlob(original, item.path);
          const newPath = item.path.replace(/\.[^.]+$/, "") + "-" + crypto.randomUUID() + ".webp";
          const newUrl = `${API}/storage/v1/object/public/${encodeURIComponent(item.bucket)}/${encodePath(newPath)}`;
          const upload = await fetch(`${API}/storage/v1/object/${encodeURIComponent(item.bucket)}/${encodePath(newPath)}`, {
            method: "POST", headers: { ...authHeaders(accessToken, false), "Content-Type": "image/webp", "x-upsert": "false" }, body: webp
          });
          if (!upload.ok) throw new Error(`WebP 上传失败：${await upload.text()}`);
          const verify = await fetch(newUrl, { method: "HEAD", cache: "no-store" });
          if (!verify.ok || !(verify.headers.get("content-type") || "").toLowerCase().includes("image/webp")) {
            throw new Error("新 WebP 图片验证失败，旧图保留");
          }
          mapping.set(`${item.bucket}/${item.path}`, newUrl);
          originals.push(item);
          converted++;
          savedBytes += original.size - webp.size;
          setLog(old => [...old, `已转换并验证：${item.bucket}/${item.path}`]);
        } catch (e) { failures.push(`${item.bucket}/${item.path}：${e instanceof Error ? e.message : "失败"}`); }
      }
      if (!mapping.size) {
        setNotice("没有成功转换的图片。旧图片未删除。");
        if (failures.length) setLog(old => [...old, ...failures]);
        return;
      }

      const updatedProducts = snapshot.products.map(row => ({
        row,
        image: replaceRefs(row.image, mapping) as string | null,
        hero_image: replaceRefs(row.hero_image, mapping) as string | null,
        gallery: replaceRefs(row.gallery || [], mapping) as string[]
      }));
      for (const item of updatedProducts) {
        if (item.image !== item.row.image || item.hero_image !== item.row.hero_image || JSON.stringify(item.gallery) !== JSON.stringify(item.row.gallery || [])) {
          await patchRow(`products?id=eq.${encodeURIComponent(item.row.id)}`, accessToken, { image: item.image, hero_image: item.hero_image, gallery: item.gallery });
        }
      }
      for (const row of snapshot.blogs) {
        const image = replaceRefs(row.image, mapping) as string | null;
        const cover_image = replaceRefs(row.cover_image, mapping) as string | null;
        if (image !== row.image || cover_image !== row.cover_image) await patchRow(`blog_posts?id=eq.${encodeURIComponent(row.id)}`, accessToken, { image, cover_image });
      }
      for (const row of snapshot.content) {
        const content = replaceRefs(row.content, mapping) as Record<string, unknown>;
        if (JSON.stringify(content) !== JSON.stringify(row.content)) await patchRow(`site_content?key=eq.${encodeURIComponent(row.key)}`, accessToken, { content });
      }
      for (const row of snapshot.translations) {
        const source_content = replaceRefs(row.source_content, mapping) as Record<string, unknown>;
        const translated_content = replaceRefs(row.translated_content, mapping) as Record<string, unknown>;
        if (JSON.stringify(source_content) !== JSON.stringify(row.source_content) || JSON.stringify(translated_content) !== JSON.stringify(row.translated_content)) {
          await patchRow(`site_translations?id=eq.${encodeURIComponent(row.id)}`, accessToken, { source_content, translated_content });
        }
      }

      const [freshProducts, freshBlogs, freshContent, freshTranslations] = await Promise.all([
        readRows<ProductRow>("products?select=id,image,hero_image,gallery&limit=2000", accessToken),
        readRows<BlogRow>("blog_posts?select=id,image,cover_image&limit=2000", accessToken),
        readRows<ContentRow>("site_content?select=key,content&limit=2000", accessToken),
        readRows<TranslationRow>("site_translations?select=id,source_content,translated_content&limit=5000", accessToken)
      ]);
      const stillReferenced = new Set<string>();
      for (const group of [freshProducts, freshBlogs, freshContent, freshTranslations]) for (const key of collectReferenceKeys(group)) stillReferenced.add(key);
      const safeToDelete = originals.filter(item => !stillReferenced.has(`${item.bucket}/${item.path}`));
      const blocked = originals.length - safeToDelete.length;
      let deleted = 0;
      if (safeToDelete.length) {
        for (const bucket of ["products", "blog-images"]) {
          const paths = safeToDelete.filter(item => item.bucket === bucket).map(item => item.path);
          for (let i = 0; i < paths.length; i += 100) {
            const response = await fetch(`${API}/storage/v1/object/${encodeURIComponent(bucket)}`, {
              method: "DELETE", headers: authHeaders(accessToken), body: JSON.stringify({ prefixes: paths.slice(i, i + 100) })
            });
            if (!response.ok) throw new Error(`已更新数据库，但删除旧图失败：${await response.text()}。旧图仍可在 Storage 中手动清理。`);
            deleted += Math.min(100, paths.length - i);
          }
        }
      }
      const savedMb = (savedBytes / 1024 / 1024).toFixed(2);
      setNotice(`迁移完成：成功转换 ${converted} 张；数据库引用已复核；安全删除旧图 ${deleted} 张；预计节省 ${savedMb} MB。${blocked ? `另有 ${blocked} 张旧图仍被引用，未删除。` : ""}${failures.length ? `失败 ${failures.length} 张，原图保留。` : ""}`);
      setLog(old => [...old, `数据库引用复核通过；删除旧图 ${deleted} 张。`, ...failures]);
      await scan();
    } catch (e) {
      setError(e instanceof Error ? e.message : "迁移过程中发生错误。为安全起见，未主动删除未验证的旧图。");
    } finally { setRunning(false); }
  }, [snapshot, allowDelete, accessToken, scan]);

  return <section className="space-y-5">
    <div className="border border-slate-200 bg-white p-5 sm:p-6">
      <h2 className="text-lg font-black text-slate-900">历史图片批量转换 WebP</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">扫描 Supabase Storage 的 products、blog-images 两个存储桶，匹配产品、Blog、网站文案及多语言内容中的图片地址。转换完成后更新数据库引用，重新读取数据确认旧地址已全部解除引用，再删除旧文件。</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="bg-slate-50 p-3"><div className="text-xs text-slate-500">最大图片边长</div><div className="mt-1 font-bold">2560 px</div></div>
        <div className="bg-slate-50 p-3"><div className="text-xs text-slate-500">WebP 编码质量</div><div className="mt-1 font-bold">82%</div></div>
        <div className="bg-slate-50 p-3"><div className="text-xs text-slate-500">旧图删除条件</div><div className="mt-1 font-bold">验证成功 + 无数据库引用</div></div>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={scan} disabled={scanning || running} className="btn-primary disabled:opacity-50">{scanning ? "正在扫描..." : "扫描历史图片"}</button>
        <button type="button" onClick={migrate} disabled={!snapshot?.candidates.length || !allowDelete || running || scanning} className="border border-slate-300 px-5 py-3 text-sm font-bold disabled:opacity-40">{running ? "正在转换与核验..." : "开始转换并更新引用"}</button>
      </div>
      <label className="mt-4 flex items-start gap-2 text-sm text-slate-700">
        <input type="checkbox" checked={allowDelete} onChange={e => setAllowDelete(e.target.checked)} disabled={running} className="mt-1"/>
        <span>我确认：只有在新 WebP 文件通过访问及格式验证、数据库引用全部更新并复核后，才允许删除对应旧图片。</span>
      </label>
      {error && <div role="alert" className="mt-4 whitespace-pre-wrap border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</div>}
      {notice && <div role="status" className="mt-4 whitespace-pre-wrap border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{notice}</div>}
    </div>
    {snapshot && <div className="border border-slate-200 bg-white p-5">
      <h3 className="font-bold">扫描结果</h3>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[["Storage 文件", snapshot.objects.length], ["已被引用", snapshot.objects.filter(x => collectReferenceKeys([...snapshot.products, ...snapshot.blogs, ...snapshot.content, ...snapshot.translations]).has(`${x.bucket}/${x.path}`)).length], ["可转换旧图", snapshot.candidates.length], ["产品 / Blog", `${snapshot.products.length} / ${snapshot.blogs.length}`]].map(([label,value])=><div key={String(label)} className="bg-slate-50 p-3"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-xl font-black tabular-nums">{value}</div></div>)}
      </div>
      {!snapshot.candidates.length && <p className="mt-3 text-sm text-slate-500">当前未发现已被数据库引用的 JPG、PNG、AVIF、BMP 或 TIFF 图片。外部图片地址和网站 public 目录中的图片不属于 Supabase Storage，本工具不会改动它们。</p>}
    </div>}
    {log.length > 0 && <div className="border border-slate-200 bg-white p-5"><h3 className="font-bold">执行日志</h3><ul className="mt-3 max-h-72 space-y-2 overflow-auto text-xs text-slate-600">{log.map((line,index)=><li key={index} className="break-all border-b border-slate-100 pb-2">{line}</li>)}</ul></div>}
  </section>;
}
