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
};

async function publicRest<T>(path: string): Promise<T | null> {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_KEY,
      },
      cache: "no-store",
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
    select: "id,slug,name,model_code,category,image,hero_image,gallery,short_description,description,specs,features,specifications,certifications,featured,published,sort_order,seo_title,seo_description",
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
