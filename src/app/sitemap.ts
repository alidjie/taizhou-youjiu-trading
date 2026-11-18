import type { MetadataRoute } from "next";
import { getPublishedProducts, getPublishedBlogSitemapPosts } from "../lib/cms";

const baseUrl = "https://www.almcp.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const routes = ["/", "/products", "/products/electric-motorcycles", "/products/electric-bicycles", "/products/electric-motors", "/products/suspension-systems", "/about", "/contact", "/inquiry", "/blog"];
  const staticEntries: MetadataRoute.Sitemap = routes.map((route, index) => ({
    url: `${baseUrl}${route === "/" ? "" : route}`,
    changeFrequency: route === "/" || route.startsWith("/products") || route === "/blog" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/blog" ? 0.85 : route.startsWith("/products") ? 0.85 : 0.7
  }));
  const products = await getPublishedProducts();
  const productEntries: MetadataRoute.Sitemap = products.map(product => ({
    url: `${baseUrl}/products/${product.category}/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : undefined,
    changeFrequency: "weekly",
    priority: product.featured ? 0.85 : 0.7
  }));
  const posts = await getPublishedBlogSitemapPosts();
  const blogEntries: MetadataRoute.Sitemap = posts.map(post => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : undefined,
    changeFrequency: "monthly",
    priority: post.featured ? 0.8 : 0.65
  }));
  // Only canonical English URLs are listed until a translated article is actually published.
  return [...staticEntries, ...productEntries, ...blogEntries];
}
