import type { MetadataRoute } from "next";
import { getPublishedProducts, getPublishedBlogPosts } from "../lib/cms";

const baseUrl = "https://www.almcp.com";
const locales = ["fr", "de", "es", "ar", "ru", "pt"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["/", "/products", "/products/electric-motorcycles", "/products/electric-bicycles", "/products/electric-motors", "/products/suspension-systems", "/about", "/contact", "/inquiry", "/blog"];
  const staticEntries: MetadataRoute.Sitemap = routes.map((route, index) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    lastModified: new Date(),
    changeFrequency: route === "/" || route.startsWith("/products") || route === "/blog" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/blog" ? 0.85 : route.startsWith("/products") ? 0.85 : 0.7
  }));
  const products = await getPublishedProducts();
  const productEntries: MetadataRoute.Sitemap = products.map(product => ({
    url: `${baseUrl}/products/${product.category}/${product.slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: product.featured ? 0.85 : 0.7
  }));
  const posts = await getPublishedBlogPosts(1000);
  const blogEntries: MetadataRoute.Sitemap = posts.flatMap(post => [
    { url: `${baseUrl}/blog/${post.slug}`, lastModified: post.updated_at ? new Date(post.updated_at) : new Date(), changeFrequency: "monthly" as const, priority: post.featured ? 0.8 : 0.65 },
    ...locales.map(locale => ({ url: `${baseUrl}/${locale}/blog/${post.slug}`, lastModified: post.updated_at ? new Date(post.updated_at) : new Date(), changeFrequency: "monthly" as const, priority: post.featured ? 0.75 : 0.6 }))
  ]);
  const localizedBlogIndexes: MetadataRoute.Sitemap = locales.map(locale => ({
    url: `${baseUrl}/${locale}/blog`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.75
  }));
  return [...staticEntries, ...productEntries, ...blogEntries, ...localizedBlogIndexes];
}
