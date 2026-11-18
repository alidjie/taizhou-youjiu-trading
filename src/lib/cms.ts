const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fsqpeuulaglnnwfyxndj.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_27Jb43sOATe3CJlIEP-zVQ_-QFD6HOB";

export type CmsBlock = {
  key: string;
  page: string;
  label: string;
  content: Record<string, string>;
  published: boolean;
};

export type CmsProduct = {
  id: string;
  slug: string;
  name: string;
  model_code?: string | null;
  category: string;
  image?: string | null;
  hero_image?: string | null;
  gallery?: string[] | null;
  short_description?: string | null;
  description?: string | null;
  specs?: string[] | null;
  features?: string[] | null;
  specifications?: Record<string, string> | null;
  certifications?: string[] | null;
  featured?: boolean;
  published: boolean;
  sort_order?: number;
  seo_title?: string | null;
  seo_description?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

async function publicRest<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
      },
      next: { revalidate: 60 },
    });
    if (!response.ok) return null;
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

export async function getCmsBlock(key: string): Promise<CmsBlock | null> {
  const query = new URLSearchParams({
    select: "key,page,label,content,published",
    key: `eq.${key}`,
    published: "eq.true",
    limit: "1",
  });
  const rows = await publicRest<CmsBlock[]>(`site_content?${query.toString()}`);
  return rows?.[0] ?? null;
}

export async function getPublishedProducts(category?: string): Promise<CmsProduct[]> {
  const query = new URLSearchParams({
    select: "id,slug,name,model_code,category,image,hero_image,gallery,short_description,description,specs,features,specifications,certifications,featured,published,sort_order,seo_title,seo_description,created_at,updated_at",
    published: "eq.true",
    order: "sort_order.asc,created_at.desc",
  });
  if (category) query.set("category", `eq.${category}`);
  const rows = await publicRest<CmsProduct[]>(`products?${query.toString()}`);
  return rows ?? [];
}

export async function getPublishedProduct(category: string, slug: string): Promise<CmsProduct | null> {
  const query = new URLSearchParams({
    select: "id,slug,name,model_code,category,image,hero_image,gallery,short_description,description,specs,features,specifications,certifications,featured,published,sort_order,seo_title,seo_description",
    category: `eq.${category}`,
    slug: `eq.${slug}`,
    published: "eq.true",
    limit: "1",
  });
  const rows = await publicRest<CmsProduct[]>(`products?${query.toString()}`);
  return rows?.[0] ?? null;
}


export type CmsBlogPost = {
  id: string; slug: string; title: string; excerpt: string; content: string;
  image?: string | null; cover_image?: string | null; author?: string | null;
  date?: string | null; category?: string | null; tags?: string[] | null;
  status: "draft" | "published"; featured?: boolean; published_at?: string | null;
  seo_title?: string | null; seo_description?: string | null;
  created_at?: string; updated_at?: string;
};

export async function getPublishedBlogPosts(limit = 12, offset = 0, category?: string): Promise<CmsBlogPost[]> {
  const query = new URLSearchParams({
    select: "id,slug,title,excerpt,content,image,cover_image,author,date,category,tags,status,featured,published_at,seo_title,seo_description,created_at,updated_at",
    status: "eq.published",
    order: "published_at.desc.nullslast,created_at.desc",
    limit: String(limit),
    offset: String(offset)
  });
  if (category) query.set("category", `eq.${category}`);
  const rows = await publicRest<CmsBlogPost[]>(`blog_posts?${query.toString()}`);
  return rows ?? [];
}

export async function getPublishedBlogPost(slug: string): Promise<CmsBlogPost | null> {
  const query = new URLSearchParams({
    select: "id,slug,title,excerpt,content,image,cover_image,author,date,category,tags,status,featured,published_at,seo_title,seo_description,created_at,updated_at",
    slug: `eq.${slug}`,
    status: "eq.published",
    limit: "1"
  });
  const rows = await publicRest<CmsBlogPost[]>(`blog_posts?${query.toString()}`);
  return rows?.[0] ?? null;
}


export type CmsBlogCard = Omit<CmsBlogPost, "content">;

export async function getPublishedBlogPostCards(limit = 12, offset = 0, category?: string): Promise<CmsBlogCard[]> {
  const query = new URLSearchParams({
    select: "id,slug,title,excerpt,image,cover_image,author,date,category,tags,status,featured,published_at,seo_title,seo_description,created_at,updated_at",
    status: "eq.published",
    order: "published_at.desc.nullslast,created_at.desc",
    limit: String(limit),
    offset: String(offset)
  });
  if (category) query.set("category", `eq.${category}`);
  const rows = await publicRest<CmsBlogCard[]>(`blog_posts?${query.toString()}`);
  return rows ?? [];
}

export async function getPublishedBlogPostCount(category?: string): Promise<number> {
  try {
    const query = new URLSearchParams({ select: "id", status: "eq.published" });
    if (category) query.set("category", `eq.${category}`);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?${query.toString()}`, {
      method: "HEAD",
      headers: { apikey: SUPABASE_KEY, Prefer: "count=exact", Range: "0-0" },
      cache: "no-store"
    });
    if (!response.ok) return 0;
    const range = response.headers.get("content-range") || "";
    const total = Number(range.split("/")[1]);
    return Number.isFinite(total) ? total : 0;
  } catch { return 0; }
}

export async function getPublishedBlogCategories(): Promise<string[]> {
  const query = new URLSearchParams({ select: "category", status: "eq.published", limit: "1000" });
  const rows = await publicRest<Array<{category:string|null}>>(`blog_posts?${query.toString()}`);
  return Array.from(new Set((rows || []).map(row => row.category).filter((value): value is string => Boolean(value)))).sort();
}

export async function getPublishedBlogSitemapPosts(): Promise<Array<Pick<CmsBlogPost, "slug" | "featured" | "updated_at">>> {
  const query = new URLSearchParams({
    select: "slug,featured,updated_at",
    status: "eq.published",
    order: "published_at.desc.nullslast,created_at.desc",
    limit: "1000"
  });
  return await publicRest<Array<Pick<CmsBlogPost, "slug" | "featured" | "updated_at">>>(`blog_posts?${query.toString()}`) || [];
}

export type CmsFAQSource = {
  title: string;
  publisher?: string;
  url: string;
  verified_on?: string;
};

export type CmsFAQ = {
  id: string;
  slug: string;
  question: string;
  answer: string;
  category: string;
  product_categories: string[];
  keywords: string[];
  locale: string;
  sources: CmsFAQSource[];
  featured: boolean;
  sort_order: number;
  updated_at?: string | null;
  created_at?: string | null;
};

export async function getPublishedFAQs(locale = "en"): Promise<CmsFAQ[]> {
  const query = new URLSearchParams({
    select: "id,slug,question,answer,category,product_categories,keywords,locale,sources,featured,sort_order,updated_at,created_at",
    status: "eq.published",
    locale: `eq.${locale}`,
    order: "sort_order.asc,created_at.asc",
    limit: "500"
  });
  return await publicRest<CmsFAQ[]>(`faqs?${query.toString()}`) || [];
}

export async function getPublishedFAQSitemapItems(): Promise<Array<Pick<CmsFAQ, "slug" | "updated_at">>> {
  const query = new URLSearchParams({
    select: "slug,updated_at",
    status: "eq.published",
    locale: "eq.en",
    order: "sort_order.asc,created_at.asc",
    limit: "500"
  });
  return await publicRest<Array<Pick<CmsFAQ, "slug" | "updated_at">>>(`faqs?${query.toString()}`) || [];
}

